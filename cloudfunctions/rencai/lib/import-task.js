/**
 * 导入任务流程模块
 * 创建 → 预览（解析+校验+地理编码）→ 确认写入
 */

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const { stripBOM, parseCsv, rowsToObjects, csvStringToArray, toNumber, toInt } = require("./csv-parser");
const { geocodeAddress } = require("./geocode");

const BATCH_SIZE = 20; // 每批写入条数

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
 * @param {string} operator - 操作人 user_id
 */
async function createImportTask(targetType, fileName, csvContent, operator) {
  const taskId = generateTaskId();
  const task = {
    task_id: taskId,
    file_name: fileName,
    target_type: targetType,
    operator: operator || "unknown",
    total_count: 0,
    success_count: 0,
    fail_count: 0,
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

  // 更新状态为 previewing
  await taskCol.doc(task._id).update({ data: { status: "previewing" } });

  const csvContent = task.csv_content || "";
  const targetType = task.target_type;

  // 解析 CSV
  const rows = parseCsv(csvContent);
  const objects = rowsToObjects(rows);

  const errorLog = [];
  const previewData = [];

  // 获取公寓列表（用于户型校验）
  let apartmentMap = {};
  if (targetType === "room_types") {
    const { data: apartments } = await db.collection("apartments").get();
    apartments.forEach(apt => {
      apartmentMap[apt.apartment_code] = apt;
    });
  }

  // 分批并发校验，避免 20+ 行串行地理编码触发云函数 20s 超时
  const GEOCODE_BATCH = 5;
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
      const rowNum = batch[idx].__rowNum;
      if (result.error) {
        errorLog.push({ row: rowNum, reason: result.error });
      } else {
        previewData.push(result.data);
      }
    });
  }

  // 更新任务
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
 * 校验公寓行
 */
async function validateApartmentRow(row) {
  const code = (row["公寓编号"] || "").trim();
  const name = (row["公寓名称"] || "").trim();
  const address = (row["地址"] || "").trim();

  if (!code) return { error: "公寓编号为空" };
  if (!name) return { error: "公寓名称为空" };
  if (!address) return { error: "地址为空" };

  // 检查 code 是否已存在
  const exist = await db.collection("apartments").where({ apartment_code: code }).get();
  const existingId = exist.data.length > 0 ? exist.data[0]._id : null;

  // 地址转经纬度
  const geoResult = await geocodeAddress(address);

  const data = {
    apartment_code: code,
    name: name,
    district: (row["区域"] || "").trim(),
    address: address,
    longitude: geoResult.lng,
    latitude: geoResult.lat,
    location_meta: (row["位置摘要"] || "").trim(),
    price_min: toInt(row["最低租金"]),
    price_max: toInt(row["最高租金"]),
    room_summary: (row["居室类型"] || "").trim(),
    status: (row["状态"] || "active").trim(),
    image: (row["封面图文件名"] || "").trim(),
    _existing_id: existingId,
    _geo_source: geoResult.source
  };

  if (geoResult.source === "failed") {
    data._warning = "地址无法解析，经纬度为0，需手动修正";
  }

  return { data };
}

/**
 * 校验户型行
 */
async function validateRoomRow(row, apartmentMap) {
  const name = (row["户型名称"] || "").trim();
  const code = (row["公寓编号"] || "").trim();
  const apartmentName = (row["所属公寓名称"] || "").trim();

  if (!name) return { error: "户型名称为空" };
  if (!code) return { error: "公寓编号为空" };

  // 先按 code 查公寓
  let apartment = apartmentMap[code];
  if (!apartment) {
    // 失败，按 name 反查
    const { data: byName } = await db.collection("apartments").where({ name: apartmentName }).get();
    if (byName.length > 0) {
      apartment = byName[0];
    }
  }

  if (!apartment) {
    return { error: `公寓不存在（code: ${code}, name: ${apartmentName}）` };
  }

  // 去重：按 name + apartment_code 查已存在户型，命中则走 update 路径
  const exist = await db.collection("room_types")
    .where({ name: name, apartment_code: apartment.apartment_code }).get();
  const existingId = exist.data.length > 0 ? exist.data[0]._id : null;

  const data = {
    name: name,
    apartment_code: apartment.apartment_code,
    apartment_id: apartment._id,
    area: (row["面积"] || "").trim(),
    orient: (row["朝向"] || "").trim(),
    layout: (row["居室"] || "").trim(),
    floor: (row["楼层"] || "").trim(),
    price: toInt(row["租金"]),
    status: (row["状态"] || "active").trim(),
    image: (row["封面图文件名"] || "").trim(),
    _existing_id: existingId
  };

  return { data };
}

/**
 * 确认导入：分批写入云数据库
 */
async function confirmImport(taskId) {
  const taskCol = db.collection("import_tasks");
  const { data: tasks } = await taskCol.where({ task_id: taskId }).get();
  if (tasks.length === 0) {
    return { ok: false, error: "任务不存在" };
  }
  const task = tasks[0];

  const previewData = task.preview_data || [];
  const targetType = task.target_type;
  let successCount = 0;
  let failCount = 0;
  const writeErrors = [];

  // 分批写入
  for (let i = 0; i < previewData.length; i += BATCH_SIZE) {
    const batch = previewData.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (item) => {
      try {
        const col = db.collection(targetType);
        const existingId = item._existing_id;
        const { _existing_id, _warning, _geo_source, ...cleanData } = item;

        if (existingId) {
          // 已存在，更新
          await col.doc(existingId).update({
            data: { ...cleanData, update_time: db.serverDate() }
          });
        } else {
          // 新增
          await col.add({
            data: { ...cleanData, create_time: db.serverDate(), update_time: db.serverDate() }
          });
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message, item: item.apartment_code || item.name };
      }
    });

    const results = await Promise.all(promises);
    results.forEach(r => {
      if (r.success) {
        successCount++;
      } else {
        failCount++;
        writeErrors.push({ item: r.item, error: r.error });
      }
    });
  }

  // 更新任务状态
  await taskCol.doc(task._id).update({
    data: {
      status: "completed",
      success_count: successCount,
      fail_count: failCount + (task.error_log || []).length,
      complete_time: db.serverDate(),
      csv_content: null // 清理 CSV 内容，节省空间
    }
  });

  return {
    ok: true,
    taskId,
    successCount,
    failCount: failCount + (task.error_log || []).length,
    writeErrors
  };
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
  previewImport,
  confirmImport,
  getImportTask,
  listImportTasks
};
