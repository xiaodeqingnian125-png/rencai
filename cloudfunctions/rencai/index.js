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

// 管理员判定配置
// 优先级：env.ADMIN_OPENIDS（OPENID 白名单）> users.role 持久化字段 > 兜底（nickname+phone，仅首次设置 admin 时使用）
const localEnv = require("./env");
const ADMIN_OPENIDS = (localEnv && Array.isArray(localEnv.ADMIN_OPENIDS)) ? localEnv.ADMIN_OPENIDS : [];
// 仅当 ADMIN_OPENIDS 为空时，回退到 nickname+phone 兜底判定（带 warning）
const ADMIN_NICKNAME_FALLBACK = "晓邱";
const ADMIN_PHONE_FALLBACK = "17739768562";

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

// 判定是否为管理员（服务端权威判定）
// 1. ADMIN_OPENIDS 包含 openid → admin
// 2. 已有用户记录的 role === "admin" → admin（持久化角色）
// 3. 兜底：ADMIN_OPENIDS 为空且 nickname+phone 匹配 → admin（首次设置）
function resolveAdminRole(openid, existingUser, nickname, phone) {
  if (ADMIN_OPENIDS.length > 0) {
    if (ADMIN_OPENIDS.indexOf(openid) >= 0) return true;
    // OPENID 白名单已配置但当前 openid 不在白名单 → 强制非 admin（即使老数据是 admin 也覆盖）
    if (existingUser && existingUser.role === "admin") return false;
    return false;
  }
  // 兜底：仅当 ADMIN_OPENIDS 未配置时使用
  if (existingUser && existingUser.role === "admin") return true;
  if (nickname === ADMIN_NICKNAME_FALLBACK && phone === ADMIN_PHONE_FALLBACK) {
    console.warn("[rencai] ADMIN_OPENIDS 未配置，使用 nickname+phone 兜底判定管理员，建议配置后重新部署");
    return true;
  }
  return false;
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

  const isAdmin = resolveAdminRole(openid, existing, nickname, phone);
  const role = isAdmin ? "admin" : "tenant";
  const roleLabel = isAdmin ? "管理员" : "住户";

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

async function isUserAdmin(userId) {
  const { data } = await db.collection("users").where({ id: Number(userId) }).get();
  if (!data.length) return false;
  return data[0].role === "admin";
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
      case "loginUser":
        // 强制使用 wxContext.OPENID，忽略前端传入的 openid 防止身份伪造
        return await loginUser(wxContext.OPENID, params.nickname, params.phone);
      case "getUserByOpenid":
        // 恢复登录态：使用 wxContext.OPENID 查询当前用户
        return await getUserByOpenid(wxContext.OPENID);
      case "getPhoneByCode":
        return await getPhoneByCode(params.code);
      case "isUserAdmin":
        return await isUserAdmin(params.userId);
      case "getAdminDataset":
        return await getAdminDataset(params.type);
      case "getNextAdminId":
        return await getNextAdminId(params.type);
      case "saveAdminItem":
        return await saveAdminItem(params.type, params.item);
      case "deleteAdminItem":
        return await deleteAdminItem(params.type, params.id);
      case "updateAdminItemStatus":
        return await updateAdminItemStatus(params.type, params.id, params.status);
      case "importAdminItems":
        return await importAdminItems(params.type, params.rows);
      case "registerActivity":
        return await registerActivity(params);
      case "submitComment":
        return await submitComment(params);
      case "toggleFavorite":
        return await toggleFavorite(params);
      case "toggleCommentLike":
        return await toggleCommentLike(params);
      case "createBorrowRequest":
        return await createBorrowRequest(params);
      case "createBorrowItem":
        return await createBorrowItem(params);
      case "createRoommatePost":
        return await createRoommatePost(params);
      case "createServiceOrder":
        return await createServiceOrder(params);
      case "isActivityRegistered":
        return await isActivityRegistered(params);
      case "migrateApartments":
        return await migrateApartments();
      case "migrateRoomTypes":
        return await migrateRoomTypes();
      case "createImportTask":
        return await createImportTask(
          event.targetType,
          event.fileName,
          event.csvContent,
          event.operator
        );
      case "previewImport":
        return await previewImport(event.taskId);
      case "confirmImport":
        return await confirmImport(event.taskId);
      case "getImportTask":
        return await getImportTask(event.taskId);
      case "listImportTasks":
        return await listImportTasks(event.targetType, event.page, event.pageSize);
      case "exportAdminItems":
        return await exportAdminItems(event.targetType, event.filters || {});
      case "initCloud":
        return await initCloud();
      default:
        return { ok: false, code: "unknown_action", message: `未知 action: ${action}`, action };
    }
  } catch (err) {
    console.error(`[rencai] action=${action} error:`, err);
    return { ok: false, code: "cloud_action_failed", message: err.message || String(err), action };
  }
};
