/**
 * 晓得青年核心云函数
 *
 * 镜像 mock-store.js 的全部数据操作，通过 wx-server-sdk 访问云数据库。
 * 部署后在客户端通过 db.js 适配器（DATA_MODE = "cloud"）调用。
 *
 * 云数据库集合：
 *   users, apartments, room_types, activities, services,
 *   borrow_items, borrow_requests, comments, comment_likes,
 *   favorites, activity_registrations, service_orders,
 *   roommate_posts, messages
 *
 * 使用前需在云开发控制台创建以上集合并导入种子数据。
 */

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const { migrateApartments, migrateRoomTypes } = require("./lib/migrate");
const {
  createImportTask,
  previewImport,
  confirmImport,
  getImportTask,
  listImportTasks
} = require("./lib/import-task");

// 全部业务集合清单（含 import_tasks 共 15 个）
const ALL_COLLECTIONS = [
  "users",
  "apartments",
  "room_types",
  "activities",
  "services",
  "borrow_items",
  "borrow_requests",
  "comments",
  "comment_likes",
  "favorites",
  "activity_registrations",
  "service_orders",
  "roommate_posts",
  "messages",
  "import_tasks"
];

// 身份与权限校验模块
// 管理员身份只根据当前 OPENID 对应的 users 记录中的 role 字段判断
// 不接受前端传入的 openid / userId 决定当前用户身份
// 不根据昵称、手机号判定管理员
// 不把管理员 OPENID 或手机号硬编码到仓库文件
const {
  ADMIN_OPENIDS,
  getCurrentUser,
  isAdmin,
  requireAdmin,
  requireUser
} = require("./lib/auth");

// 手机号脱敏：保留后 4 位
function maskPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  const s = phone.trim();
  if (s.length < 4) return "****";
  return "****" + s.slice(-4);
}

// openid 脱敏：仅保留前 4 和后 4 位，中间用 ... 代替（用于日志输出）
function maskOpenid(openid) {
  if (!openid || typeof openid !== "string") return "";
  const s = openid.trim();
  if (s.length <= 8) return "****";
  return s.slice(0, 4) + "..." + s.slice(-4);
}

// ========== 工具函数 ==========

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getNextId(collection) {
  return collection
    .orderBy("id", "desc")
    .limit(1)
    .get()
    .then((res) => {
      if (!res.data.length) return 1;
      const maxId = res.data.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
      return maxId + 1;
    });
}

// 分页拉取全量数据，规避单次 get 100 条限制
// 云函数端单次 get 默认 100 条，最大 limit 1000，这里按 100 一页循环拉取
async function getAll(collection, whereClause) {
  const PAGE_SIZE = 100;
  let all = [];
  let skip = 0;
  // 安全上限：单集合最多拉 5000 条，避免异常集合卡死云函数
  const MAX_ROWS = 5000;
  while (skip < MAX_ROWS) {
    let query = collection.orderBy("id", "desc").skip(skip).limit(PAGE_SIZE);
    if (whereClause) {
      query = collection.where(whereClause).orderBy("id", "desc").skip(skip).limit(PAGE_SIZE);
    }
    const { data } = await query.get(); // eslint-disable-line no-await-in-loop
    all = all.concat(data);
    if (data.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }
  return all;
}

// ========== 云环境初始化 ==========

// 一键创建全部业务集合并导入种子数据
// 已存在的集合跳过，已存在的种子记录按 code 查重跳过
async function initCloud() {
  const created = [];
  const existed = [];
  const errors = [];

  // 1. 创建集合（已存在会返回 errCode -501001，忽略）
  for (const name of ALL_COLLECTIONS) {
    try {
      await db.createCollection(name); // eslint-disable-line no-await-in-loop
      created.push(name);
    } catch (err) {
      const errCode = err && (err.errCode || (err.result && err.result.errCode));
      // -501001 = 集合已存在；其他错误记录
      if (errCode === -501001 || /already exists/i.test(err.message || "")) {
        existed.push(name);
      } else {
        errors.push({ collection: name, errCode, message: err.message || String(err) });
      }
    }
  }

  // 2. 导入 apartments/room_types 种子数据（已存在记录会跳过）
  const aptResult = await migrateApartments();
  const roomResult = await migrateRoomTypes();

  return {
    ok: true,
    collections: { created, existed, errors },
    seed: {
      apartments: aptResult.results,
      room_types: roomResult.results
    }
  };
}

// ========== 用户登录 ==========

// 判断错误是否为「集合不存在」
// wx-server-sdk 在集合未创建时返回 errCode -502003 或 -501001，message 含 "collection not exists"
function isCollectionMissingError(err) {
  if (!err) return false;
  const errCode = err.errCode || (err.result && err.result.errCode);
  const errMsg = err.message || (err.result && err.result.errMsg) || "";
  if (errCode === -502003 || errCode === -501001) return true;
  return /collection.*not.*exists|collection.*does.*not.*exist|数据库.*不存在|集合.*不存在/i.test(errMsg);
}

// 用户登录 / 注册
// 仅使用 cloud.getWXContext().OPENID 作为身份标识，不信任前端传入的 openid
// 统一返回 { ok, code, message, user?, isNew? }
async function loginUser(openid, nickname, phone) {
  // openid 必须来自 wxContext，前端传入的 openid 参数被忽略
  if (!openid) {
    return { ok: false, code: "no_openid", message: "无法获取用户身份（OPENID）" };
  }
  if (!nickname || !phone) {
    return { ok: false, code: "invalid_params", message: "昵称和手机号不能为空" };
  }

  const userCol = db.collection("users");
  let existing = null;
  try {
    const { data } = await userCol.where({ openid }).get();
    existing = data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("[rencai] loginUser query users failed:", err);
    if (isCollectionMissingError(err)) {
      return {
        ok: false,
        code: "users_collection_missing",
        message: "用户数据库尚未初始化，请联系管理员"
      };
    }
    return {
      ok: false,
      code: "users_query_failed",
      message: "查询用户失败：" + (err.message || String(err))
    };
  }

  // 管理员角色判定（仅用于写入 users.role，不用于身份校验）：
  // - 已有用户：保留现有 role（不覆盖，防止前端伪造管理员）
  // - 新用户：默认 "tenant"，仅当 openid 在 ADMIN_OPENIDS（env.js，gitignored）中时引导为 "admin"
  // 管理员身份校验（requireAdmin）只依据 users.role，不依赖此处的判定
  let role = "tenant";
  if (existing) {
    role = existing.role || "tenant";
  } else if (ADMIN_OPENIDS.indexOf(openid) >= 0) {
    role = "admin";
  }
  const roleLabel = role === "admin" ? "管理员" : "住户";

  console.log("[rencai] loginUser openid(脱敏):", maskOpenid(openid),
    "phone(脱敏):", maskPhone(phone), "role:", role);

  try {
    if (existing) {
      // 已有用户，更新昵称/手机号/角色（角色由服务端权威判定，不接受前端篡改）
      await userCol.doc(existing._id).update({
        data: {
          nickname,
          phone,
          avatar_text: nickname.charAt(0),
          role,
          role_label: roleLabel,
          updated_at: db.serverDate()
        }
      });
      const user = { ...existing, nickname, phone, role, role_label: roleLabel, avatar_text: nickname.charAt(0) };
      return { ok: true, user, isNew: false };
    }

    // 新用户
    const nextId = await getNextId(userCol);
    const newUser = {
      id: nextId,
      openid,
      nickname,
      avatar_text: nickname.charAt(0),
      avatar_class: "ca-1",
      phone,
      role,
      role_label: roleLabel,
      apartment_id: 0,
      room_label: "未入住",
      status: "active",
      note: "",
      created_at: db.serverDate(),
      updated_at: db.serverDate()
    };
    await userCol.add({ data: newUser });
    // 返回给前端的 user 对象不能包含 db.serverDate() 命令对象，
    // 否则 wx.cloud.callFunction 序列化时会导致 result 异常（前端拿到 undefined）。
    // 写入成功后用普通对象返回，时间戳字段由数据库服务端填充。
    const safeUser = {
      id: nextId,
      openid,
      nickname,
      avatar_text: nickname.charAt(0),
      avatar_class: "ca-1",
      phone,
      role,
      role_label: roleLabel,
      apartment_id: 0,
      room_label: "未入住",
      status: "active",
      note: ""
    };
    return { ok: true, user: safeUser, isNew: true };
  } catch (err) {
    console.error("[rencai] loginUser write failed:", err);
    if (isCollectionMissingError(err)) {
      return {
        ok: false,
        code: "users_collection_missing",
        message: "用户数据库尚未初始化，请联系管理员"
      };
    }
    return {
      ok: false,
      code: "login_user_failed",
      message: "登录写入失败：" + (err.message || String(err))
    };
  }
}

// 通过 OPENID 查询用户（用于恢复登录态）
// 统一返回 { ok, code, message, user? }
async function getUserByOpenid(openid) {
  if (!openid) {
    return { ok: false, code: "no_openid", message: "无法获取用户身份（OPENID）" };
  }
  try {
    const { data } = await db.collection("users").where({ openid }).get();
    if (data.length === 0) {
      return { ok: false, code: "user_not_found", message: "用户不存在，请重新登录" };
    }
    return { ok: true, user: data[0] };
  } catch (err) {
    console.error("[rencai] getUserByOpenid failed:", err);
    if (isCollectionMissingError(err)) {
      return {
        ok: false,
        code: "users_collection_missing",
        message: "用户数据库尚未初始化，请联系管理员"
      };
    }
    return {
      ok: false,
      code: "user_query_failed",
      message: "查询用户失败：" + (err.message || String(err))
    };
  }
}

// 通过 getPhoneNumber 回调的 code 换取真实手机号
// 调用微信开放接口 phonenumber.getPhoneNumber
async function getPhoneByCode(code) {
  if (!code) {
    return { ok: false, error: "missing_code" };
  }
  try {
    const result = await cloud.openapi.phonenumber.getPhoneNumber({ code });
    // wx-server-sdk 返回结构：{ errCode, errMsg, phoneInfo: { phoneNumber, purePhoneNumber, countryCode, watermark } }
    if (result.errCode !== 0) {
      console.error("[rencai] getPhoneByCode errCode:", result.errCode, result.errMsg);
      return { ok: false, error: result.errMsg || "get_phone_failed" };
    }
    const phoneNumber = result.phoneInfo && result.phoneInfo.phoneNumber;
    if (!phoneNumber) {
      return { ok: false, error: "empty_phone" };
    }
    return { ok: true, phoneNumber };
  } catch (err) {
    console.error("[rencai] getPhoneByCode exception:", err);
    return { ok: false, error: err.message || String(err) };
  }
}

// ========== 管理员数据集 ==========

const ADMIN_COLLECTION_MAP = {
  apartments: "apartments",
  rooms: "room_types",
  activities: "activities",
  services: "service_orders",
  items: "borrow_items",
  comments: "comments",
  users: "users"
};

async function getAdminDataset(type) {
  const colName = ADMIN_COLLECTION_MAP[type];
  if (!colName) return [];
  const data = await getAll(db.collection(colName));
  return data;
}

async function getNextAdminId(type) {
  const colName = ADMIN_COLLECTION_MAP[type];
  if (!colName) return 1;
  return await getNextId(db.collection(colName));
}

async function saveAdminItem(type, item) {
  const colName = ADMIN_COLLECTION_MAP[type];
  if (!colName) return "ignored";
  const col = db.collection(colName);

  // 检查是否已存在
  const { data } = await col.where({ id: Number(item.id) }).get();
  if (data.length > 0) {
    // 更新
    await col.doc(data[0]._id).update({
      data: { ...item, updated_at: db.serverDate() }
    });
    return "updated";
  }

  // 新建
  await col.add({ data: { ...item, created_at: db.serverDate(), updated_at: db.serverDate() } });
  return "created";
}

async function deleteAdminItem(type, id) {
  const colName = ADMIN_COLLECTION_MAP[type];
  if (!colName) return false;
  const numericId = Number(id);
  const col = db.collection(colName);

  const { data } = await col.where({ id: numericId }).get();
  if (!data.length) return false;

  await col.doc(data[0]._id).remove();

  // 级联删除关联数据
  if (type === "apartments") {
    await db.collection("room_types").where({ apartment_id: numericId }).remove();
    await db.collection("favorites").where({ target_type: "apartment", target_id: numericId }).remove();
  } else if (type === "rooms") {
    await db.collection("favorites").where({ target_type: "room_type", target_id: numericId }).remove();
  } else if (type === "activities") {
    await db.collection("activity_registrations").where({ activity_id: numericId }).remove();
  } else if (type === "items") {
    await db.collection("borrow_requests").where({ item_id: numericId }).remove();
  } else if (type === "comments") {
    await db.collection("comment_likes").where({ comment_id: numericId }).remove();
  }

  return true;
}

async function updateAdminItemStatus(type, id, status) {
  const colName = ADMIN_COLLECTION_MAP[type];
  if (!colName) return false;
  const col = db.collection(colName);

  const { data } = await col.where({ id: Number(id) }).get();
  if (!data.length) return false;

  await col.doc(data[0]._id).update({
    data: { status, updated_at: db.serverDate() }
  });
  return true;
}

async function importAdminItems(type, rows) {
  const colName = ADMIN_COLLECTION_MAP[type];
  if (!colName) return { created: 0, updated: 0, ignored: 0 };
  const col = db.collection(colName);

  let created = 0, updated = 0, ignored = 0;
  for (const row of rows) {
    const { data } = await col.where({ id: Number(row.id) }).get();
    if (data.length > 0) {
      await col.doc(data[0]._id).update({ data: { ...row, updated_at: db.serverDate() } });
      updated++;
    } else {
      await col.add({ data: { ...row, created_at: db.serverDate(), updated_at: db.serverDate() } });
      created++;
    }
  }
  return { created, updated, ignored };
}

async function exportAdminItems(targetType, filters = {}) {
  const col = db.collection(targetType);
  // 合并筛选条件
  const whereClause = {};
  if (filters.district) whereClause.district = filters.district;
  if (filters.status) whereClause.status = filters.status;

  const data = await getAll(col, Object.keys(whereClause).length > 0 ? whereClause : null);
  return { ok: true, items: data };
}

// ========== 公开只读接口（公寓/户型，游客可访问） ==========

// 校验图片路径：仅 cloud:// / https:// 开头视为有效
// 本地文件名（如 apt-1.jpg）和 http:// 明文链接视为无图
function isValidImagePath(path) {
  if (!path || typeof path !== "string") return false;
  const s = path.trim();
  if (!s) return false;
  return /^cloud:\/\/|^https:\/\//i.test(s);
}

// 设施图标映射表（label → icon）
const FACILITY_ICON_MAP = {
  "独立卫浴": "卫",
  "空调": "空",
  "热水器": "热",
  "宽带": "网",
  "衣柜": "柜",
  "书桌": "桌",
  "自助洗衣房": "衣",
  "洗衣房": "衣",
  "公共厨房": "厨",
  "健身区": "健",
  "健身房": "健",
  "快递柜": "柜",
  "休闲区": "休",
  "充电桩": "电",
  "自习室": "习"
};

// 规范化设施列表：兼容字符串数组和对象数组
// 字符串 "空调" → { label:"空调", icon:"空", active:true }
// 对象 { label, icon, active } → 清洗后保留
// 规则：
// - 非数组返回 []
// - 空字符串/无有效 label 的项过滤
// - active 缺失默认 true，明确 false 保留 false
// - icon 缺失时先查映射表，再取 label 第一个汉字
// - 不允许返回 undefined 的 label
function normalizeFacilityList(input) {
  if (!Array.isArray(input)) return [];
  const result = [];
  for (const item of input) {
    if (item == null) continue;
    let label = "";
    let icon = "";
    let active = true;
    if (typeof item === "string") {
      label = item.trim();
    } else if (typeof item === "object") {
      label = String(item.label || "").trim();
      icon = String(item.icon || "").trim();
      // active 缺失默认 true，明确 false 保留 false
      active = item.active === false ? false : true;
    } else {
      continue;
    }
    if (!label) continue; // 无有效 label 的项过滤
    // icon 缺失时从映射表获取，再 fallback 到 label 第一个汉字
    if (!icon) {
      icon = FACILITY_ICON_MAP[label] || label.charAt(0) || "?";
    }
    result.push({ label, icon, active });
  }
  return result;
}

// 规范化费用列表：兼容缺失的 active 字段
// costs 项可能是 { label, value } 或 { label, value, active }
// 规则：
// - 非数组返回 []
// - 无有效 label 的项过滤
// - active 缺失默认 true，明确 false 保留 false
// - 保留 label 和 value
function normalizeCostList(input) {
  if (!Array.isArray(input)) return [];
  const result = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const label = String(item.label || "").trim();
    if (!label) continue;
    const value = String(item.value || "").trim();
    const active = item.active === false ? false : true;
    result.push({ label, value, active });
  }
  return result;
}

// 公寓详情页字段安全映射：剥离 _id / 内部字段，避免 db 命令对象
// 兼容 snake_case（数据库）和 camelCase（旧 mock）两套字段名
// 无效图片路径（如本地文件名 apt-1.jpg）置为空字符串，由前端走占位图
// id 统一转为 number；无效 id 返回 null
function toApartmentPage(apt) {
  if (!apt) return null;
  const id = Number(apt.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  const priceMin = Number(apt.price_min ?? apt.priceMin);
  const priceMax = Number(apt.price_max ?? apt.priceMax);
  const longitude = Number(apt.longitude);
  const latitude = Number(apt.latitude);
  return {
    id,
    apartment_code: apt.apartment_code ?? apt.apartmentCode ?? "",
    name: apt.name || "",
    district: apt.district || "",
    address: apt.address ?? apt.location ?? "",
    longitude: Number.isFinite(longitude) ? longitude : 0,
    latitude: Number.isFinite(latitude) ? latitude : 0,
    location_meta: apt.location_meta ?? apt.locationMeta ?? "",
    price_min: Number.isFinite(priceMin) ? priceMin : 0,
    price_max: Number.isFinite(priceMax) ? priceMax : 0,
    room_summary: apt.room_summary ?? apt.rooms ?? "",
    status: apt.status || "active",
    image: isValidImagePath(apt.image) ? apt.image : "",
    hero_class: apt.hero_class ?? apt.heroClass ?? "",
    image_class: apt.image_class ?? apt.imageClass ?? "",
    tags: Array.isArray(apt.tags) ? apt.tags : [],
    costs: normalizeCostList(apt.costs),
    private_facilities: normalizeFacilityList(apt.private_facilities),
    public_facilities: normalizeFacilityList(apt.public_facilities),
    nearby: Array.isArray(apt.nearby) ? apt.nearby : []
  };
}

// 户型详情页字段安全映射
// id 统一转为 number；无效 id 返回 null
// price 强制转为 number
// costs/facilities 来自所属公寓（room_types 表无此字段），使用 normalize 规范化
function toRoomPage(room, apartment) {
  if (!room) return null;
  const id = Number(room.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  const apartmentId = Number(room.apartment_id ?? room.apartmentId);
  const price = Number(room.price);
  // 户型的 facilities 来自所属公寓的 private_facilities
  // 户型的 costs 来自所属公寓的 costs
  const facilities = apartment
    ? normalizeFacilityList(apartment.private_facilities ?? apartment.privateFacilities)
    : [];
  const costs = apartment
    ? normalizeCostList(apartment.costs)
    : [];
  return {
    id,
    apartment_id: Number.isFinite(apartmentId) ? apartmentId : 0,
    apartment_code: room.apartment_code ?? room.apartmentCode ?? "",
    name: room.name || "",
    area: room.area || "",
    orient: room.orient || "",
    layout: room.layout || "",
    floor: room.floor || "",
    price: Number.isFinite(price) ? price : 0,
    status: room.status || "active",
    image: isValidImagePath(room.image) ? room.image : "",
    desc: room.desc || "",
    costs,
    facilities
  };
}

// 公寓列表项字段（精简，用于首页卡片）
// 输出 camelCase 以匹配页面数据契约
// 兼容 snake_case（数据库）和 camelCase（旧 mock）两套字段名
// id 统一转为 number；无效 id（非正整数）返回 null，由调用方跳过
function toApartmentCard(apt) {
  if (!apt) return null;
  const id = Number(apt.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  const priceMin = Number(apt.price_min ?? apt.priceMin);
  const priceMax = Number(apt.price_max ?? apt.priceMax);
  return {
    id,
    apartmentCode: apt.apartment_code ?? apt.apartmentCode ?? "",
    name: apt.name || "",
    district: apt.district || "",
    priceMin: Number.isFinite(priceMin) ? priceMin : 0,
    priceMax: Number.isFinite(priceMax) ? priceMax : 0,
    rooms: apt.room_summary ?? apt.rooms ?? "",
    location: apt.address ?? apt.location ?? "",
    tags: Array.isArray(apt.tags) ? apt.tags : [],
    imageClass: apt.image_class ?? apt.imageClass ?? "",
    image: isValidImagePath(apt.image) ? apt.image : "",
    favorite: false
  };
}

// 校验 apartment_code：必须为非空字符串，且只允许字母数字与下划线，长度 ≤ 32
function isValidApartmentCode(code) {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  if (!trimmed || trimmed.length > 32) return false;
  return /^[A-Za-z0-9_]+$/.test(trimmed);
}

// 校验数字 ID：必须为正整数
function isValidNumericId(id) {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 && num < 1e8;
}

// 校验分页参数：page 正整数默认 1，pageSize 默认 20 上限 100
function parsePaging(params) {
  let page = Number(params.page);
  if (!Number.isInteger(page) || page < 1) page = 1;
  let pageSize = Number(params.pageSize);
  if (!Number.isInteger(pageSize) || pageSize < 1) pageSize = 20;
  if (pageSize > 100) pageSize = 100;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

// 公开读取：公寓列表
// 默认同时返回 status === "active" 和无 status 字段的旧数据（不使用 active 为空才查旧数据的 fallback）
// 支持真分页：page + pageSize，返回 hasMore
// 注意：where 使用 _.in(["active", null]) 需在 apartments 集合上创建 status 字段索引（见报告）
async function publicGetApartmentList(params) {
  const { page, pageSize, skip } = parsePaging(params);
  const col = db.collection("apartments");
  try {
    // 同时匹配 status === "active" 和 status 不存在的旧数据
    // 微信云数据库 where({ status: _.in(["active", null]) }) 会匹配 active 或字段缺失的记录
    const query = col.where({
      status: _.in(["active", null])
    }).orderBy("id", "asc").skip(skip).limit(pageSize);
    const { data } = await query.get();
    // 查询总数（仅查当前页是否还有更多）
    // 为避免 count 性能问题，用 limit+1 方式判断 hasMore
    const probeQuery = col.where({
      status: _.in(["active", null])
    }).orderBy("id", "asc").skip(skip + pageSize).limit(1);
    const probe = await probeQuery.get();
    const hasMore = probe.data.length > 0;
    // 过滤无效 id 的记录（toApartmentCard 返回 null）
    const cards = data.map(toApartmentCard).filter((card) => card !== null);
    // 按 id 正序排序（字符串和数字 id 混用时统一按数字比较）
    cards.sort((a, b) => a.id - b.id);
    return {
      ok: true,
      data: cards,
      page,
      pageSize,
      hasMore
    };
  } catch (err) {
    console.error("[rencai] publicGetApartmentList failed:", err);
    if (isCollectionMissingError(err)) {
      return { ok: false, code: "collection_missing", message: "公寓数据未初始化" };
    }
    return { ok: false, code: "query_failed", message: "查询公寓列表失败" };
  }
}

// 公开读取：单个公寓详情（按 id）
// 兼容数字和字符串 id（数据库可能存在 id=1 或 id="1"）
// 返回给前端的 id 统一为 number
async function publicGetApartmentDetail(params) {
  const id = Number(params.id);
  if (!isValidNumericId(id)) {
    return { ok: false, code: "invalid_params", message: "公寓 ID 非法" };
  }
  try {
    const col = db.collection("apartments");
    // 同时匹配数字 id 和字符串 id
    const { data } = await col.where({ id: _.in([id, String(id)]) }).limit(1).get();
    if (data.length === 0) {
      return { ok: false, code: "not_found", message: "公寓不存在" };
    }
    const apartment = toApartmentPage(data[0]);
    if (!apartment) {
      return { ok: false, code: "invalid_record", message: "公寓记录数据非法" };
    }
    return { ok: true, data: apartment };
  } catch (err) {
    console.error("[rencai] publicGetApartmentDetail failed:", err);
    if (isCollectionMissingError(err)) {
      return { ok: false, code: "collection_missing", message: "公寓数据未初始化" };
    }
    return { ok: false, code: "query_failed", message: "查询公寓详情失败" };
  }
}

// 公开读取：某公寓的户型列表（按 apartment_code 关联）
// 默认同时返回 status === "active" 和无 status 字段的旧数据
// 支持真分页：page + pageSize，返回 hasMore
// 注意：where 使用 _.in(["active", null]) 需在 room_types 集合上创建 (apartment_code, status) 组合索引（见报告）
async function publicGetRoomListByApartment(params) {
  const code = params.apartmentCode;
  if (!isValidApartmentCode(code)) {
    return { ok: false, code: "invalid_params", message: "公寓编号非法" };
  }
  const { page, pageSize, skip } = parsePaging(params);
  try {
    const col = db.collection("room_types");
    // 同时匹配 status === "active" 和 status 不存在的旧数据
    const query = col.where({
      apartment_code: code.trim(),
      status: _.in(["active", null])
    }).orderBy("id", "asc").skip(skip).limit(pageSize);
    const { data } = await query.get();
    // 用 limit+1 方式判断 hasMore
    const probeQuery = col.where({
      apartment_code: code.trim(),
      status: _.in(["active", null])
    }).orderBy("id", "asc").skip(skip + pageSize).limit(1);
    const probe = await probeQuery.get();
    const hasMore = probe.data.length > 0;
    return {
      ok: true,
      data: data.map(toRoomPage),
      page,
      pageSize,
      hasMore
    };
  } catch (err) {
    console.error("[rencai] publicGetRoomListByApartment failed:", err);
    if (isCollectionMissingError(err)) {
      return { ok: false, code: "collection_missing", message: "户型数据未初始化" };
    }
    return { ok: false, code: "query_failed", message: "查询户型列表失败" };
  }
}

// 公开读取：单个户型详情（按 apartment_code + id）
// 兼容数字和字符串 id（数据库可能存在 id=1 或 id="1"）
// 返回给前端的 id 统一为 number
async function publicGetRoomDetail(params) {
  const code = params.apartmentCode;
  const id = Number(params.id);
  if (!isValidApartmentCode(code)) {
    return { ok: false, code: "invalid_params", message: "公寓编号非法" };
  }
  if (!isValidNumericId(id)) {
    return { ok: false, code: "invalid_params", message: "户型 ID 非法" };
  }
  try {
    const col = db.collection("room_types");
    // 同时匹配数字 id 和字符串 id
    const { data } = await col.where({
      apartment_code: code.trim(),
      id: _.in([id, String(id)])
    }).limit(1).get();
    if (data.length === 0) {
      return { ok: false, code: "not_found", message: "户型不存在" };
    }
    // 先拉取所属公寓原始记录（toRoomPage 需要 apartment 来填充 facilities/costs）
    let apartmentRaw = null;
    const aptRes = await db.collection("apartments").where({ apartment_code: code.trim() }).limit(1).get();
    if (aptRes.data.length > 0) {
      apartmentRaw = aptRes.data[0];
    }
    // toRoomPage 用原始 apartment 数据填充 facilities/costs（内部会做 normalize）
    const room = toRoomPage(data[0], apartmentRaw);
    if (!room) {
      return { ok: false, code: "invalid_record", message: "户型记录数据非法" };
    }
    // 返回给前端的 apartment 用 toApartmentPage 规范化
    const apartment = apartmentRaw ? toApartmentPage(apartmentRaw) : null;
    return { ok: true, data: { room, apartment } };
  } catch (err) {
    console.error("[rencai] publicGetRoomDetail failed:", err);
    if (isCollectionMissingError(err)) {
      return { ok: false, code: "collection_missing", message: "户型数据未初始化" };
    }
    return { ok: false, code: "query_failed", message: "查询户型详情失败" };
  }
}

// ========== 用户侧写操作 ==========

async function registerActivity(params) {
  const { activityId, userId, name, phone } = params;
  const regCol = db.collection("activity_registrations");

  // 检查重复报名
  const { data: existing } = await regCol.where({
    activity_id: Number(activityId),
    user_id: userId
  }).get();
  if (existing.length > 0) {
    return { ok: false, reason: "duplicate" };
  }

  // 检查满员
  const actCol = db.collection("activities");
  const { data: acts } = await actCol.where({ id: Number(activityId) }).get();
  if (!acts.length) return { ok: false, reason: "not_found" };
  const activity = acts[0];
  if (activity.current_count >= activity.max_participants) {
    return { ok: false, reason: "full" };
  }

  // 创建报名记录
  const code = "BM" + Date.now().toString(36).toUpperCase();
  await regCol.add({
    data: {
      activity_id: Number(activityId),
      user_id: userId,
      name,
      phone,
      code,
      status: "registered",
      created_at: db.serverDate()
    }
  });

  // 更新活动人数
  await actCol.doc(activity._id).update({
    data: { current_count: _.inc(1) }
  });

  return { ok: true, code };
}

async function submitComment(params) {
  const { targetType, targetId, userId, body } = params;
  const col = db.collection("comments");
  const nextId = await getNextId(col);
  const comment = {
    id: nextId,
    user_id: userId,
    target_type: targetType,
    target_id: Number(targetId),
    rating: 4.5,
    tags: [],
    body,
    created_label: "刚刚",
    like_count: 0,
    status: "active",
    created_at: db.serverDate()
  };
  await col.add({ data: comment });
  return comment;
}

async function toggleFavorite(params) {
  const { targetType, targetId, userId } = params;
  const col = db.collection("favorites");
  const { data } = await col.where({
    target_type: targetType,
    target_id: Number(targetId),
    user_id: userId
  }).get();

  if (data.length > 0) {
    await col.doc(data[0]._id).remove();
    return { ok: true, favorite: false };
  }

  await col.add({
    data: {
      target_type: targetType,
      target_id: Number(targetId),
      user_id: userId,
      created_at: db.serverDate()
    }
  });
  return { ok: true, favorite: true };
}

async function toggleCommentLike(params) {
  const { commentId, userId } = params;
  const col = db.collection("comment_likes");
  const { data } = await col.where({
    comment_id: Number(commentId),
    user_id: userId
  }).get();

  if (data.length > 0) {
    await col.doc(data[0]._id).remove();
    // 减少点赞数
    const cmtCol = db.collection("comments");
    const { data: cmts } = await cmtCol.where({ id: Number(commentId) }).get();
    if (cmts.length > 0) {
      await cmtCol.doc(cmts[0]._id).update({ data: { like_count: _.inc(-1) } });
    }
    return { ok: true, liked: false, likes: Math.max(0, (cmts[0]?.like_count || 1) - 1) };
  }

  await col.add({
    data: { comment_id: Number(commentId), user_id: userId, created_at: db.serverDate() }
  });
  // 增加点赞数
  const cmtCol = db.collection("comments");
  const { data: cmts } = await cmtCol.where({ id: Number(commentId) }).get();
  if (cmts.length > 0) {
    await cmtCol.doc(cmts[0]._id).update({ data: { like_count: _.inc(1) } });
  }
  return { ok: true, liked: true, likes: (cmts[0]?.like_count || 0) + 1 };
}

async function createBorrowRequest(params) {
  const { itemId, userId, startDate, endDate, message } = params;
  const col = db.collection("borrow_requests");
  const nextId = await getNextId(col);
  await col.add({
    data: {
      id: nextId,
      item_id: Number(itemId),
      borrower_user_id: userId,
      start_date: startDate,
      end_date: endDate,
      message,
      status: "pending",
      created_at: db.serverDate()
    }
  });
  return { ok: true };
}

async function createBorrowItem(params) {
  const { userId, data } = params;
  const col = db.collection("borrow_items");
  const nextId = await getNextId(col);
  const item = {
    id: nextId,
    name: data.name,
    category: data.category,
    category_label: data.category,
    thumb_class: "thumb-tool",
    desc: data.desc,
    detail: data.desc,
    rules: data.rules,
    return_tip: "请按规则按时归还。",
    location: data.location,
    pickup_location: data.location,
    owner_user_id: userId,
    status: "available",
    created_at: db.serverDate()
  };
  await col.add({ data: item });
  return { ok: true, item };
}

async function createRoommatePost(params) {
  const { userId, data } = params;
  const col = db.collection("roommate_posts");
  const nextId = await getNextId(col);
  const post = {
    id: nextId,
    user_id: userId,
    title: data.title,
    budget: data.budget,
    location: data.location,
    detail: data.detail,
    contact: data.contact,
    status: "active",
    created_at: db.serverDate()
  };
  await col.add({ data: post });
  return { ok: true, post };
}

async function createServiceOrder(params) {
  const { userId, serviceId, data } = params;
  const col = db.collection("service_orders");
  const nextId = await getNextId(col);
  const orderNo = "SV" + Date.now().toString(36).toUpperCase();
  const order = {
    id: nextId,
    service_id: Number(serviceId),
    user_id: userId,
    order_no: orderNo,
    contact_name: data.contactName,
    contact_phone: data.contactPhone,
    address: data.address,
    remark: data.remark,
    appointment_label: data.appointment,
    assignee: "待分配",
    status: "processing",
    created_at: db.serverDate()
  };
  await col.add({ data: order });
  return { ok: true, orderNo };
}

async function isActivityRegistered(params) {
  const { activityId, userId } = params;
  const { data } = await db.collection("activity_registrations").where({
    activity_id: Number(activityId),
    user_id: userId
  }).get();
  return data.length > 0;
}

// ========== 云函数入口 ==========

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const wxContext = cloud.getWXContext();

  try {
    switch (action) {
      // ========== 公开 action（无需鉴权） ==========
      case "loginUser":
        // 强制使用 wxContext.OPENID，忽略前端传入的 openid 防止身份伪造
        return await loginUser(wxContext.OPENID, params.nickname, params.phone);
      case "getUserByOpenid":
        // 恢复登录态：使用 wxContext.OPENID 查询当前用户
        return await getUserByOpenid(wxContext.OPENID);
      case "getPhoneByCode":
        return await getPhoneByCode(params.code);

      // ========== 公开只读 action（游客可访问，公寓/户型） ==========
      case "getApartmentList":
        return await publicGetApartmentList(params);
      case "getApartmentDetail":
        return await publicGetApartmentDetail(params);
      case "getRoomListByApartment":
        return await publicGetRoomListByApartment(params);
      case "getRoomDetail":
        return await publicGetRoomDetail(params);

      // ========== 用户身份 action（需登录，用服务端 userId 覆盖前端传入值） ==========
      case "isUserAdmin": {
        // 身份查询：用 OPENID 查 users.role，不信任前端传入的 userId
        const user = await getCurrentUser(wxContext);
        return { ok: true, isAdmin: isAdmin(user) };
      }
      case "registerActivity":
      case "submitComment":
      case "toggleFavorite":
      case "toggleCommentLike":
      case "createBorrowRequest":
      case "createBorrowItem":
      case "createRoommatePost":
      case "createServiceOrder":
      case "isActivityRegistered": {
        const auth = await requireUser(wxContext);
        if (!auth.ok) return auth;
        // 用服务端权威 userId 覆盖前端传入值，防止身份伪造
        const secureParams = { ...params, userId: auth.user.id };
        switch (action) {
          case "registerActivity": return await registerActivity(secureParams);
          case "submitComment": return await submitComment(secureParams);
          case "toggleFavorite": return await toggleFavorite(secureParams);
          case "toggleCommentLike": return await toggleCommentLike(secureParams);
          case "createBorrowRequest": return await createBorrowRequest(secureParams);
          case "createBorrowItem": return await createBorrowItem(secureParams);
          case "createRoommatePost": return await createRoommatePost(secureParams);
          case "createServiceOrder": return await createServiceOrder(secureParams);
          case "isActivityRegistered": return await isActivityRegistered(secureParams);
          default: return { ok: false, code: "unknown_action", message: `未知 action: ${action}`, action };
        }
      }

      // ========== 管理员 action（需 admin 角色） ==========
      case "getAdminDataset":
      case "getNextAdminId":
      case "saveAdminItem":
      case "deleteAdminItem":
      case "updateAdminItemStatus":
      case "importAdminItems":
      case "migrateApartments":
      case "migrateRoomTypes":
      case "exportAdminItems":
      case "initCloud":
      case "createImportTask":
      case "previewImport":
      case "confirmImport":
      case "getImportTask":
      case "listImportTasks": {
        const auth = await requireAdmin(wxContext);
        if (!auth.ok) return auth;
        // 用服务端权威身份覆盖操作人字段
        const operator = auth.user.id;
        switch (action) {
          case "getAdminDataset": return await getAdminDataset(params.type);
          case "getNextAdminId": return await getNextAdminId(params.type);
          case "saveAdminItem": return await saveAdminItem(params.type, params.item);
          case "deleteAdminItem": return await deleteAdminItem(params.type, params.id);
          case "updateAdminItemStatus": return await updateAdminItemStatus(params.type, params.id, params.status);
          case "importAdminItems": return await importAdminItems(params.type, params.rows);
          case "migrateApartments": return await migrateApartments();
          case "migrateRoomTypes": return await migrateRoomTypes();
          case "exportAdminItems": return await exportAdminItems(event.targetType, event.filters || {});
          case "initCloud": return await initCloud();
          case "createImportTask": return await createImportTask(event.targetType, event.fileName, event.csvContent, operator);
          case "previewImport": return await previewImport(event.taskId);
          case "confirmImport": return await confirmImport(event.taskId);
          case "getImportTask": return await getImportTask(event.taskId);
          case "listImportTasks": return await listImportTasks(event.targetType, event.page, event.pageSize);
          default: return { ok: false, code: "unknown_action", message: `未知 action: ${action}`, action };
        }
      }

      default:
        return { ok: false, code: "unknown_action", message: `未知 action: ${action}`, action };
    }
  } catch (err) {
    console.error(`[rencai] action=${action} error:`, err);
    return { ok: false, code: "cloud_action_failed", message: err.message || String(err), action };
  }
};
