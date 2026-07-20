/**
 * 导入任务流程模块
 * 创建 → 预览（解析+校验+地理编码）→ 确认写入
 *
 * 状态流转：
 *   pending     创建完成，等待预览
 *   previewing  预览中/已预览，等待确认
 *   processing  确认写入中（防止重复确认）
 *   completed   全部成功
 *   partial_failed 部分失败
 *   failed      全部失败
 *
 * 幂等保证：
 *   - 已 completed / partial_failed 的任务禁止再次确认
 *   - processing 状态拒绝重复确认
 *   - 确认时按唯一键重新查询已存在记录，不依赖预览阶段缓存的 _existing_id
 */

const cloud = require("wx-server-sdk");
const XLSX = require("xlsx");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const { stripBOM, parseCsv, rowsToObjects, toInt, toFloat, parseJsonArray, parseFloorPlans, isStoredImagePath, stripFormulaEscape } = require("./csv-parser");
const { geocodeAddress } = require("./geocode");

const BATCH_SIZE = 20; // 每批写入条数
const GEOCODE_BATCH = 5; // 每批并发地理编码条数
// 地理编码上限：10 行，每批 5 行并发，每行最坏 6 秒（腾讯 3s + 高德 3s）。
// 两批最坏约 12 秒，给 CSV 解析与数据库查询保留余量。
const MAX_GEOCODE_ROWS = 10;
const MAX_CSV_ROWS = 500; // 单次导入最大行数

// processing 状态过期阈值：5 分钟（300000 毫秒）
// 超过此时间视为卡死任务，允许安全重试
const PROCESSING_EXPIRE_MS = 5 * 60 * 1000;

/**
 * 允许导入的集合白名单
 */
const ALLOWED_TARGET_TYPES = ["apartments", "room_types"];

function xlsxBufferToCsv(fileContent) {
  try {
    const workbook = XLSX.read(fileContent, { type: "buffer" });
    const firstSheetName = workbook.SheetNames && workbook.SheetNames[0];
    const worksheet = firstSheetName && workbook.Sheets[firstSheetName];
    if (!worksheet) return { ok: false, code: "excel_parse_failed", error: "Excel 文件没有可读取的工作表" };
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    if (!String(csvContent || "").trim()) {
      return { ok: false, code: "excel_parse_failed", error: "Excel 文件没有可导入的数据" };
    }
    return { ok: true, csvContent };
  } catch (error) {
    return { ok: false, code: "excel_parse_failed", error: "Excel 文件解析失败，请确认文件格式" };
  }
}

function validateGeocodeRowCount(count) {
  if (count <= MAX_GEOCODE_ROWS) return "";
  return `缺少经纬度的数据超过 ${MAX_GEOCODE_ROWS} 条，请分批导入。`;
}

/**
 * 生成任务编号
 */
function generateTaskId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(now.getTime()).slice(-6);
  return `IMP-${y}${m}${d}-${seq}`;
}

/**
 * 创建导入任务
 * @param {string} targetType - "apartments" | "room_types"
 * @param {string} fileName - 文件名
 * @param {string} csvContent - CSV 文本内容
 * @param {string} operator - 操作人 user_id（由服务端注入）
 */
async function createImportTask(targetType, fileName, csvContent, operator) {
  if (!ALLOWED_TARGET_TYPES.includes(targetType)) {
    return { ok: false, error: `不支持的导入类型: ${targetType}` };
  }
  const taskId = generateTaskId();
  const task = {
    task_id: taskId,
    file_name: fileName,
    target_type: targetType,
    operator: operator || "unknown",
    total_count: 0,
    success_count: 0,
    fail_count: 0,
    created_count: 0,
    updated_count: 0,
    skipped_count: 0,
    status: "pending",
    error_log: [],
    preview_data: [],
    csv_content: csvContent,
    create_time: db.serverDate(),
    complete_time: null
  };

  await db.collection("import_tasks").add({ data: task });
  return { ok: true, taskId };
}

async function createImportTaskFromFile(targetType, fileName, fileID, operator, cloudClient) {
  if (!ALLOWED_TARGET_TYPES.includes(targetType)) {
    return { ok: false, error: `不支持的导入类型: ${targetType}` };
  }
  if (!fileID || !cloudClient || typeof cloudClient.downloadFile !== "function") {
    return { ok: false, error: "Excel 文件上传失败，请重新选择" };
  }
  try {
    const downloaded = await cloudClient.downloadFile({ fileID });
    const parsed = xlsxBufferToCsv(downloaded && downloaded.fileContent);
    if (!parsed.ok) return parsed;
    return await createImportTask(targetType, fileName, parsed.csvContent, operator);
  } catch (error) {
    return { ok: false, code: "excel_parse_failed", error: "Excel 文件解析失败，请确认文件格式" };
  }
}

/**
 * 分页拉取全部公寓，规避单次 get 100 条限制
 * 用于户型校验时构建 apartmentMap
 */
async function fetchAllApartments() {
  const PAGE_SIZE = 100;
  const MAX_ROWS = 5000;
  let all = [];
  let skip = 0;
  while (skip < MAX_ROWS) {
    const query = db.collection("apartments").orderBy("id", "asc").skip(skip).limit(PAGE_SIZE);
    const { data } = await query.get(); // eslint-disable-line no-await-in-loop
    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }
  return all;
}

/**
 * raw_data 长度上限（每行原始数据最多保留 1000 字符）
 * 用于控制 import_tasks 文档大小，避免预览阶段写入过多数据
 */
const RAW_DATA_MAX = 1000;
const TRUNCATE_MARKER = "…[已截断]";

/**
 * 截断 raw_data 到 RAW_DATA_MAX 字符（含标记总长度不超过上限）
 * 超长时截断并追加 "…[已截断]" 标记
 * @param {string} str - JSON 字符串化的原始数据
 * @returns {string} 截断后的字符串；空串原样返回
 */
function truncateRawData(str) {
  if (typeof str !== "string" || str === "") return "";
  if (str.length <= RAW_DATA_MAX) return str;
  // 预留标记空间，保证总长度 <= RAW_DATA_MAX
  return str.slice(0, RAW_DATA_MAX - TRUNCATE_MARKER.length) + TRUNCATE_MARKER;
}

/**
 * 构建错误行的 raw_data 字段
 * 只保存用户上传 CSV 当前行的内容（解析后的对象），剔除系统注入的 __rowNum
 * 不加入 _openid、管理员身份、地图 Key、环境变量或服务器上下文
 * @param {Object} rowObj - rowsToObjects 生成的行对象（含 __rowNum）
 * @returns {string} 紧凑 JSON 字符串，最多 RAW_DATA_MAX 字符
 */
function buildRawData(rowObj) {
  if (!rowObj || typeof rowObj !== "object") return "";
  // 剔除解析阶段注入的行号字段，只保留用户 CSV 当前行内容
  const copy = {};
  Object.keys(rowObj).forEach((key) => {
    if (key !== "__rowNum") {
      copy[key] = rowObj[key];
    }
  });
  let jsonStr;
  try {
    jsonStr = JSON.stringify(copy);
  } catch (err) {
    return "";
  }
  return truncateRawData(jsonStr);
}

/**
 * 预览导入：解析 + 校验 + 地理编码
 */
async function previewImport(taskId) {
  const taskCol = db.collection("import_tasks");
  const { data: tasks } = await taskCol.where({ task_id: taskId }).get();
  if (tasks.length === 0) {
    return { ok: false, error: "任务不存在" };
  }
  const task = tasks[0];

  // 状态守卫：只有 pending / previewing 允许重新预览
  if (task.status !== "pending" && task.status !== "previewing") {
    return { ok: false, error: `当前状态 ${task.status} 不允许重新预览` };
  }

  await taskCol.doc(task._id).update({ data: { status: "previewing" } });

  const csvContent = task.csv_content || "";
  const targetType = task.target_type;

  // 解析 CSV
  const rows = parseCsv(csvContent);
  const objects = rowsToObjects(rows);

  if (objects.length === 0) {
    await taskCol.doc(task._id).update({
      data: {
        status: "previewing",
        total_count: 0,
        success_count: 0,
        preview_data: [],
        error_log: [{ row: 0, reason: "CSV 无有效数据行", raw_data: "" }],
        fail_count: 1
      }
    });
    return { ok: true, taskId, totalCount: 0, successCount: 0, failCount: 1, errorLog: [{ row: 0, reason: "CSV 无有效数据行", raw_data: "" }], previewData: [] };
  }

  // 行数上限
  if (objects.length > MAX_CSV_ROWS) {
    const msg = `CSV 数据行数 ${objects.length} 超过单次导入上限 ${MAX_CSV_ROWS}，请分批导入`;
    await taskCol.doc(task._id).update({
      data: {
        status: "previewing",
        total_count: objects.length,
        success_count: 0,
        preview_data: [],
        error_log: [{ row: 0, reason: msg, raw_data: "" }],
        fail_count: 1
      }
    });
    return { ok: true, taskId, totalCount: objects.length, successCount: 0, failCount: 1, errorLog: [{ row: 0, reason: msg, raw_data: "" }], previewData: [] };
  }

  const errorLog = [];
  const previewData = [];

  // 获取公寓列表（用于户型校验）— 分页拉取全部，不受 100 条限制
  let apartmentMap = {};
  if (targetType === "room_types") {
    const apartments = await fetchAllApartments();
    apartments.forEach(apt => {
      if (apt.apartment_code) {
        apartmentMap[apt.apartment_code] = apt;
      }
    });
  }

  // 公寓类型需要统计待地理编码的行数
  if (targetType === "apartments") {
    const needGeocodeCount = objects.filter(obj => {
      const lng = toFloat(obj["经度"]);
      const lat = toFloat(obj["纬度"]);
      return !(lng !== 0 && lat !== 0);
    }).length;
    const geocodeLimitError = validateGeocodeRowCount(needGeocodeCount);
    if (geocodeLimitError) {
      const msg = geocodeLimitError;
      await taskCol.doc(task._id).update({
        data: {
          status: "previewing",
          total_count: objects.length,
          success_count: 0,
          preview_data: [],
          error_log: [{ row: 0, reason: msg, raw_data: "" }],
          fail_count: 1
        }
      });
      return { ok: true, taskId, totalCount: objects.length, successCount: 0, failCount: 1, errorLog: [{ row: 0, reason: msg, raw_data: "" }], previewData: [] };
    }
  }

  // 分批并发校验
  for (let i = 0; i < objects.length; i += GEOCODE_BATCH) {
    const batch = objects.slice(i, i + GEOCODE_BATCH);
    const results = await Promise.all(
      batch.map((obj) =>
        targetType === "apartments"
          ? validateApartmentRow(obj)
          : validateRoomRow(obj, apartmentMap)
      )
    );
    results.forEach((result, idx) => {
      const rowObj = batch[idx];
      const rowNum = rowObj.__rowNum;
      if (result.error) {
        errorLog.push({
          row: rowNum,
          reason: result.error,
          raw_data: buildRawData(rowObj)
        });
      } else {
        previewData.push(result.data);
      }
    });
  }

  await taskCol.doc(task._id).update({
    data: {
      status: "previewing",
      total_count: objects.length,
      success_count: previewData.length,
      preview_data: previewData,
      error_log: errorLog,
      fail_count: errorLog.length
    }
  });

  return {
    ok: true,
    taskId,
    totalCount: objects.length,
    successCount: previewData.length,
    failCount: errorLog.length,
    errorLog,
    previewData: previewData.slice(0, 20) // 预览只返回前20条，避免数据过大
  };
}

/**
 * 校验公寓行（完整字段版本，20 字段，含业务 id）
 * 支持字段：id, apartment_code, name, district, address, longitude, latitude,
 *          location_meta, price_min, price_max, room_summary,
 *          status, image, hero_class, image_class, tags, costs,
 *          private_facilities, public_facilities, nearby
 *
 * id 规则：
 *   - 可留空，留空时由服务端生成
 *   - 提供时必须为正整数
 *   - 提供的 id 若已被其他 apartment_code 占用，返回校验错误
 *
 * 经纬度规则：
 *   - CSV 提供且合法 → 直接使用，不调用地图 API
 *   - CSV 缺失或非法 → 调用地理编码
 *   - 地理编码失败 → 经纬度置 (0,0) 并附 _warning
 *
 * 公式注入还原：所有文本字段先 stripFormulaEscape 去除保护性单引号
 *
 * JSON 字段（tags/costs/private_facilities/public_facilities/nearby）：
 *   - 空字符串视为 []
 *   - 非空必须为合法 JSON 数组
 *   - 格式错误返回 error，整行不入库
 */
async function validateApartmentRow(row) {
  // 导入时先还原公式注入保护用的单引号前缀
  const code = stripFormulaEscape((row["公寓编号"] || "")).trim();
  const name = stripFormulaEscape((row["公寓名称"] || "")).trim();
  const address = stripFormulaEscape((row["地址"] || "")).trim();
  const image = stripFormulaEscape((row["封面图路径"] || row["封面图文件名"] || "")).trim();

  if (!code) return { error: "公寓编号为空" };
  if (!name) return { error: "公寓名称为空" };
  if (!address) return { error: "地址为空" };
  if (!isStoredImagePath(image)) return { error: "封面图路径必须是 cloud:// 或 https:// 地址" };

  // 业务 id 处理
  const csvIdRaw = stripFormulaEscape((row["业务ID"] || "")).trim();
  let csvId = 0;
  if (csvIdRaw) {
    csvId = toInt(csvIdRaw);
    if (csvId <= 0) {
      return { error: `业务ID 必须为正整数，当前值: ${csvIdRaw}` };
    }
  }

  // 检查 code 是否已存在（仅用于预览信息，不作为唯一依据）
  const exist = await db.collection("apartments").where({ apartment_code: code }).get();
  const existingId = exist.data.length > 0 ? exist.data[0]._id : null;
  const existingNumericId = exist.data.length > 0 ? Number(exist.data[0].id) || 0 : 0;

  // 如果 CSV 提供了 id，且该 id 已被其他 apartment_code 的记录占用，返回错误
  if (csvId > 0) {
    const idCheck = await db.collection("apartments").where({ id: csvId }).get();
    for (const rec of idCheck.data) {
      if (rec.apartment_code !== code) {
        return { error: `业务ID ${csvId} 已被公寓 ${rec.apartment_code} 占用` };
      }
    }
  }

  // 经纬度：优先使用 CSV 提供的合法值，缺失时才地理编码
  const csvLng = toFloat(row["经度"]);
  const csvLat = toFloat(row["纬度"]);
  let longitude = 0;
  let latitude = 0;
  let geoSource = "empty";

  if (csvLng !== 0 && csvLat !== 0 && Number.isFinite(csvLng) && Number.isFinite(csvLat)) {
    // CSV 提供合法经纬度，直接使用
    longitude = csvLng;
    latitude = csvLat;
    geoSource = "csv";
  } else {
    // 缺失或非法，调用地理编码
    const geoResult = await geocodeAddress(address);
    longitude = geoResult.lng;
    latitude = geoResult.lat;
    geoSource = geoResult.source;
  }

  if (geoSource === "failed" || longitude === 0 || latitude === 0) {
    return { error: `地址无法解析：${address}` };
  }

  // JSON 字段解析（先还原公式注入保护前缀）
  let tags = [];
  let costs = [];
  let privateFacilities = [];
  let publicFacilities = [];
  let nearby = [];
  let floorPlans = [];

  try {
    tags = parseJsonArray(stripFormulaEscape(row["标签"] || ""));
  } catch (err) {
    return { error: `标签字段${err.message}` };
  }
  try {
    costs = parseJsonArray(stripFormulaEscape(row["费用项"] || ""));
  } catch (err) {
    return { error: `费用项字段${err.message}` };
  }
  try {
    privateFacilities = parseJsonArray(stripFormulaEscape(row["私人设施"] || ""));
  } catch (err) {
    return { error: `私人设施字段${err.message}` };
  }
  try {
    publicFacilities = parseJsonArray(stripFormulaEscape(row["公共设施"] || ""));
  } catch (err) {
    return { error: `公共设施字段${err.message}` };
  }
  try {
    nearby = parseJsonArray(stripFormulaEscape(row["周边配套"] || ""));
  } catch (err) {
    return { error: `周边配套字段${err.message}` };
  }
  try {
    floorPlans = parseFloorPlans(stripFormulaEscape(row["平面图"] || ""));
  } catch (err) {
    return { error: `平面图字段${err.message}` };
  }

  const data = {
    apartment_code: code,
    name: name,
    district: stripFormulaEscape((row["区域"] || "")).trim(),
    address: address,
    longitude: longitude,
    latitude: latitude,
    location_meta: stripFormulaEscape((row["位置摘要"] || "")).trim(),
    price_min: toInt(row["最低租金"]),
    price_max: toInt(row["最高租金"]),
    room_summary: stripFormulaEscape((row["居室类型"] || "")).trim(),
    status: (row["状态"] || "active").trim(),
    image,
    floor_plans: floorPlans,
    hero_class: stripFormulaEscape((row["渐变背景类"] || "")).trim(),
    image_class: stripFormulaEscape((row["备用图片类"] || "")).trim(),
    tags: tags,
    costs: costs,
    private_facilities: privateFacilities,
    public_facilities: publicFacilities,
    nearby: nearby,
    _csv_id: csvId,
    _existing_id: existingId,
    _existing_numeric_id: existingNumericId,
    _geo_source: geoSource
  };

  return { data };
}

/**
 * 校验户型行（完整字段版本，12 字段，含业务 id 和 desc）
 * 幂等键：apartment_code + name
 * apartment_id 自动从所属公寓的数字 id 生成（不再使用 _id 字符串）
 *
 * id 规则：
 *   - 可留空，留空时由服务端生成
 *   - 提供时必须为正整数
 *   - 提供的 id 若已被其他 (apartment_code + name) 占用，返回校验错误
 */
async function validateRoomRow(row, apartmentMap) {
  const name = stripFormulaEscape((row["户型名称"] || "")).trim();
  const code = stripFormulaEscape((row["公寓编号"] || "")).trim();
  const apartmentName = stripFormulaEscape((row["所属公寓名称"] || "")).trim();
  const image = stripFormulaEscape((row["封面图路径"] || row["封面图文件名"] || "")).trim();

  if (!name) return { error: "户型名称为空" };
  if (!code) return { error: "公寓编号为空" };
  if (!isStoredImagePath(image)) return { error: "封面图路径必须是 cloud:// 或 https:// 地址" };

  // 业务 id 处理
  const csvIdRaw = stripFormulaEscape((row["房源ID"] || "")).trim();
  let csvId = 0;
  if (csvIdRaw) {
    csvId = toInt(csvIdRaw);
    if (csvId <= 0) {
      return { error: `房源ID 必须为正整数，当前值: ${csvIdRaw}` };
    }
  }

  // 按 code 查公寓
  let apartment = apartmentMap[code];
  if (!apartment) {
    // 失败，按 name 反查（兼容历史数据）
    const { data: byName } = await db.collection("apartments").where({ name: apartmentName }).get();
    if (byName.length > 0) {
      apartment = byName[0];
    }
  }

  if (!apartment) {
    return { error: `公寓不存在（code: ${code}, name: ${apartmentName}）` };
  }

  // 去重：按 name + apartment_code 查已存在户型
  const exist = await db.collection("room_types")
    .where({ name: name, apartment_code: apartment.apartment_code }).get();
  const existingId = exist.data.length > 0 ? exist.data[0]._id : null;

  // 如果 CSV 提供了 id，且该 id 已被其他 (apartment_code + name) 占用，返回错误
  if (csvId > 0) {
    const idCheck = await db.collection("room_types").where({ id: csvId }).get();
    for (const rec of idCheck.data) {
      if (!(rec.apartment_code === apartment.apartment_code && rec.name === name)) {
        return { error: `房源ID ${csvId} 已被其他户型占用` };
      }
    }
  }

  // apartment_id 统一为所属公寓的数字 id
  const apartmentNumericId = Number(apartment.id) || 0;

  const data = {
    name: name,
    apartment_code: apartment.apartment_code,
    apartment_id: apartmentNumericId,
    area: stripFormulaEscape((row["面积"] || "")).trim(),
    orient: stripFormulaEscape((row["朝向"] || "")).trim(),
    layout: stripFormulaEscape((row["居室"] || "")).trim(),
    floor: stripFormulaEscape((row["楼层"] || "")).trim(),
    price: toInt(row["租金"]),
    status: (row["状态"] || "active").trim(),
    image,
    desc: stripFormulaEscape((row["描述"] || "")).trim(),
    _csv_id: csvId,
    _existing_id: existingId
  };

  return { data };
}

/**
 * 确认导入：分批写入云数据库
 *
 * 幂等与状态规则：
 *   1. processing 状态在 5 分钟内拒绝重复确认（防并发）
 *   2. processing 超过 5 分钟视为卡死，允许安全重试（重新 upsert）
 *   3. completed 状态拒绝再次确认（终态）
 *   4. partial_failed / failed 状态拒绝再次确认（终态，需要重新创建任务）
 *   5. 写入前重新按唯一键查询，不依赖预览阶段缓存的 _existing_id
 *   6. 公寓按 apartment_code 执行 upsert
 *   7. 房源按 apartment_code + name 执行 upsert
 *   8. 每条记录标记 created / updated / skipped / failed
 *   9. 全部成功 → completed；部分失败 → partial_failed；全部失败 → failed
 *  10. 异常捕获：根据已成功写入数量设置 failed / partial_failed，保证状态不卡死
 *  11. 无事务回滚，部分写入会保留，仅通过状态标记和 write_errors 记录
 *  12. 同批次自动生成的 id 通过 usedIdsSet 去重，避免同批次内 id 重复
 */
async function confirmImport(taskId) {
  const taskCol = db.collection("import_tasks");
  const { data: tasks } = await taskCol.where({ task_id: taskId }).get();
  if (tasks.length === 0) {
    return { ok: false, error: "任务不存在" };
  }
  const task = tasks[0];

  // 状态守卫：处理中（5 分钟内拒绝，超过 5 分钟视为卡死允许重试）
  if (task.status === "processing") {
    const processingStartedAt = task.processing_started_at ? new Date(task.processing_started_at).getTime() : 0;
    const elapsed = Date.now() - processingStartedAt;
    if (elapsed < PROCESSING_EXPIRE_MS) {
      return { ok: false, error: `任务正在处理中（${Math.floor(elapsed / 1000)}秒前），请勿重复确认` };
    }
    // 超过 5 分钟视为卡死，允许安全重试：继续往下执行
    // 重试时必须重新 upsert，不依赖任何缓存状态
  } else if (task.status === "completed" || task.status === "partial_failed" || task.status === "failed") {
    // 终态拒绝再次确认
    return {
      ok: false,
      error: `任务已${statusText(task.status)}，不可再次确认。如需重新导入，请新建任务。`
    };
  } else if (task.status !== "previewing") {
    return { ok: false, error: `任务当前状态 ${task.status} 不允许确认导入` };
  }

  // 切换到 processing 状态，记录开始时间，防止并发重复确认
  await taskCol.doc(task._id).update({
    data: {
      status: "processing",
      processing_started_at: db.serverDate()
    }
  });

  const previewData = task.preview_data || [];
  const targetType = task.target_type;
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const writeErrors = [];
  const rowResults = [];
  // 同批次自动生成 id 的去重集合，避免同批次内 getNextIdForCollection 返回相同值
  const usedIdsSet = new Set();

  // 异常保护：try/catch 确保任何异常都更新状态，不卡死在 processing
  try {
    // 分批写入
    for (let i = 0; i < previewData.length; i += BATCH_SIZE) {
      const batch = previewData.slice(i, i + BATCH_SIZE);
      const promises = batch.map(async (item) => {
        try {
          const col = db.collection(targetType);
          // 剥离内部字段
          const { _existing_id, _existing_numeric_id, _warning, _geo_source, _csv_id, ...cleanData } = item;

          // 重新按唯一键查询（幂等保证，不依赖预览阶段的 _existing_id）
          let existingDoc = null;
          if (targetType === "apartments") {
            const { data: found } = await col.where({ apartment_code: cleanData.apartment_code }).get();
            if (found.length > 0) existingDoc = found[0];
          } else {
            const { data: found } = await col.where({
              name: cleanData.name,
              apartment_code: cleanData.apartment_code
            }).get();
            if (found.length > 0) existingDoc = found[0];
          }

          if (existingDoc) {
            // 已存在，更新（保留数据库已有 id，不使用 CSV 提供的 id 覆盖）
            // 如果 CSV 提供了 _csv_id 且与数据库 id 不一致，记录警告但不阻止更新
            const updateData = { ...cleanData, update_time: db.serverDate() };
            // 删除 cleanData.id，避免用 CSV id 覆盖数据库已有 id
            delete updateData.id;
            await col.doc(existingDoc._id).update({ data: updateData });
            return { result: "updated", key: cleanData.apartment_code || cleanData.name };
          }

          // 新增 — 生成 id 逻辑
          // 优先使用 CSV 提供的 _csv_id（已通过校验未被占用）
          if (_csv_id && _csv_id > 0) {
            cleanData.id = _csv_id;
            usedIdsSet.add(_csv_id);
          } else if (!cleanData.id) {
            // 自动生成，避开同批次已使用的 id
            let nextId = await getNextIdForCollection(col);
            while (usedIdsSet.has(nextId)) {
              nextId++;
            }
            cleanData.id = nextId;
            usedIdsSet.add(nextId);
          }

          await col.add({
            data: { ...cleanData, create_time: db.serverDate(), update_time: db.serverDate() }
          });
          return { result: "created", key: cleanData.apartment_code || cleanData.name };
        } catch (err) {
          return { result: "failed", key: item.apartment_code || item.name, error: err.message };
        }
      });

      const results = await Promise.all(promises);
      results.forEach(r => {
        rowResults.push(r);
        if (r.result === "created") createdCount++;
        else if (r.result === "updated") updatedCount++;
        else if (r.result === "skipped") skippedCount++;
        else {
          failedCount++;
          writeErrors.push({ item: r.key, error: r.error });
        }
      });
    }
  } catch (err) {
    // 异常保护：捕获未预期的错误，根据已成功写入数量设置状态
    writeErrors.push({ item: "__confirm_batch__", error: `批次处理异常: ${err.message}` });
  }

  const successCount = createdCount + updatedCount + skippedCount;

  // 确定最终状态
  let finalStatus;
  if (failedCount === 0 && writeErrors.length === 0) {
    finalStatus = "completed";
  } else if (successCount === 0) {
    finalStatus = "failed";
  } else {
    finalStatus = "partial_failed";
  }

  await taskCol.doc(task._id).update({
    data: {
      status: finalStatus,
      success_count: successCount,
      fail_count: failedCount + (task.error_log || []).length,
      created_count: createdCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      complete_time: db.serverDate(),
      csv_content: null, // 清理 CSV 内容，节省空间
      write_errors: writeErrors,
      processing_started_at: null // 清理 processing 开始时间
    }
  });

  return {
    ok: true,
    taskId,
    status: finalStatus,
    createdCount,
    updatedCount,
    skippedCount,
    failedCount,
    successCount,
    failCount: failedCount + (task.error_log || []).length,
    writeErrors
  };
}

/**
 * 获取集合下一个可用数字 id
 */
async function getNextIdForCollection(col) {
  const { data } = await col.orderBy("id", "desc").limit(1).get();
  if (!data.length) return 1;
  const maxId = Number(data[0].id) || 0;
  return maxId + 1;
}

/**
 * 状态文案
 */
function statusText(status) {
  const map = {
    pending: "待处理",
    previewing: "预览中",
    processing: "处理中",
    completed: "完成",
    partial_failed: "部分失败",
    failed: "失败"
  };
  return map[status] || status;
}

/**
 * 查询任务
 */
async function getImportTask(taskId) {
  const { data: tasks } = await db.collection("import_tasks").where({ task_id: taskId }).get();
  if (tasks.length === 0) {
    return { ok: false, error: "任务不存在" };
  }
  const task = tasks[0];
  // 只剥离 csv_content（体积大且无需返回前端），保留 preview_data 供预览页渲染
  const { csv_content, ...safeTask } = task;
  if (safeTask.preview_data && safeTask.preview_data.length > 20) {
    safeTask.preview_data = safeTask.preview_data.slice(0, 20);
  }
  return { ok: true, task: safeTask };
}

/**
 * 任务列表
 */
async function listImportTasks(targetType, page = 1, pageSize = 20) {
  const col = db.collection("import_tasks");
  let query = col.orderBy("create_time", "desc");

  if (targetType) {
    query = col.where({ target_type: targetType }).orderBy("create_time", "desc");
  }

  const skip = (page - 1) * pageSize;
  const { data: tasks } = await query.skip(skip).limit(pageSize).get();

  // 清理大字段
  const safeTasks = tasks.map(t => {
    const { csv_content, preview_data, ...safe } = t;
    return safe;
  });

  return { ok: true, tasks: safeTasks, page, pageSize };
}

module.exports = {
  createImportTask,
  createImportTaskFromFile,
  previewImport,
  confirmImport,
  getImportTask,
  listImportTasks,
  ALLOWED_TARGET_TYPES,
  MAX_CSV_ROWS,
  MAX_GEOCODE_ROWS,
  validateGeocodeRowCount,
  validateApartmentRow,
  xlsxBufferToCsv,
  // 以下为本地验证导出的纯函数（不影响云函数运行时行为）
  truncateRawData,
  buildRawData,
  RAW_DATA_MAX,
  TRUNCATE_MARKER
};
