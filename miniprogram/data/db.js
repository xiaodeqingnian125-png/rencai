/**
 * 数据访问适配器
 *
 * 通过 DATA_MODE 配置切换数据来源：
 *   "mock"  — 使用本地内存 mock-store（默认，开发/预览用）
 *   "cloud" — 调用云函数 rencai 读写云数据库（需先配置云环境）
 *
 * 所有页面和 queries.js 统一通过此模块访问数据，
 * 切换模式只需修改 DATA_MODE 常量，无需改动业务代码。
 */

const DATA_MODE = "cloud"; // "mock" | "cloud"

// mock-store 同步接口（本地内存）
const store = require("./mock-store");
// queries.js 提供部分高级查询（管理员数据集等）
const queries = require("./queries");

// 判断当前是否云模式
function isCloudMode() {
  return DATA_MODE === "cloud";
}

// 调用云函数的通用封装
function callCloud(action, params) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: "rencai",
      data: { action, ...params },
      success(res) {
        resolve(res.result);
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// ========== 数据集读取 ==========

// 获取全部表数据（用于 queries.js 初始化）
function getTables() {
  if (isCloudMode()) {
    // 云模式下返回空壳，实际数据按需拉取
    return store.getTables();
  }
  return store.getTables();
}

// 获取管理员数据集
function getAdminDataset(type) {
  if (isCloudMode()) {
    return callCloud("getAdminDataset", { type });
  }
  return Promise.resolve(queries.getAdminDataset(type));
}

// 获取下一个可用 ID
function getNextAdminId(type) {
  if (isCloudMode()) {
    return callCloud("getNextAdminId", { type });
  }
  return Promise.resolve(queries.getNextAdminId(type));
}

// ========== 管理员 CRUD ==========

function saveAdminItem(type, item) {
  if (isCloudMode()) {
    return callCloud("saveAdminItem", { type, item });
  }
  return Promise.resolve(store.saveAdminItem(type, item));
}

function deleteAdminItem(type, id) {
  if (isCloudMode()) {
    return callCloud("deleteAdminItem", { type, id });
  }
  return Promise.resolve(store.deleteAdminItem(type, id));
}

function updateAdminItemStatus(type, id, status) {
  if (isCloudMode()) {
    return callCloud("updateAdminItemStatus", { type, id, status });
  }
  return Promise.resolve(store.updateAdminItemStatus(type, id, status));
}

function importAdminItems(type, rows) {
  if (isCloudMode()) {
    return callCloud("importAdminItems", { type, rows });
  }
  return Promise.resolve(store.importAdminItems(type, rows));
}

// ========== 导入任务 ==========

function createImportTask(targetType, fileName, csvContent, operator) {
  if (isCloudMode()) {
    return callCloud("createImportTask", { targetType, fileName, csvContent, operator });
  }
  // mock 模式暂不支持，返回错误提示
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function previewImport(taskId) {
  if (isCloudMode()) {
    return callCloud("previewImport", { taskId });
  }
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function confirmImport(taskId) {
  if (isCloudMode()) {
    return callCloud("confirmImport", { taskId });
  }
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function getImportTask(taskId) {
  if (isCloudMode()) {
    return callCloud("getImportTask", { taskId });
  }
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function listImportTasks(targetType, page, pageSize) {
  if (isCloudMode()) {
    return callCloud("listImportTasks", { targetType, page, pageSize });
  }
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function exportAdminItems(targetType, filters) {
  if (isCloudMode()) {
    return callCloud("exportAdminItems", { targetType, filters });
  }
  return Promise.resolve(queries.getAdminDataset(targetType));
}

function createExportFile(targetType, csvContent) {
  if (!isCloudMode()) {
    return Promise.resolve({ ok: false, code: "cloud_required", message: "导出文件需在云模式下生成" });
  }
  return callCloud("createExportFile", { targetType, csvContent });
}

// ========== 用户登录与身份 ==========

function loginUser(openid, nickname, phone) {
  if (isCloudMode()) {
    return callCloud("loginUser", { openid, nickname, phone });
  }
  return Promise.resolve(store.loginOrCreateUser(openid, nickname, phone));
}

function getUserByOpenid(openid) {
  if (isCloudMode()) {
    return callCloud("getUserByOpenid", { openid });
  }
  const user = store.getUserByOpenid(openid);
  return Promise.resolve(user);
}

function isUserAdmin(userId) {
  if (isCloudMode()) {
    return callCloud("isUserAdmin", { userId });
  }
  return Promise.resolve(store.isUserAdmin(userId));
}

// ========== 用户侧写操作 ==========

function registerActivityForUser(activityId, userId, name, phone) {
  if (isCloudMode()) {
    return callCloud("registerActivity", { activityId, userId, name, phone });
  }
  return Promise.resolve(store.registerActivity(activityId, userId, name, phone));
}

function submitUserComment(targetType, targetId, userId, body) {
  if (isCloudMode()) {
    return callCloud("submitComment", { targetType, targetId, userId, body });
  }
  return Promise.resolve(store.submitComment(targetType, targetId, userId, body));
}

function toggleFavoriteForUser(targetType, targetId, userId) {
  if (isCloudMode()) {
    return callCloud("toggleFavorite", { targetType, targetId, userId });
  }
  return Promise.resolve(store.toggleFavoriteRecord(targetType, targetId, userId));
}

function toggleCommentLikeForUser(commentId, userId) {
  if (isCloudMode()) {
    return callCloud("toggleCommentLike", { commentId, userId });
  }
  return Promise.resolve(store.toggleCommentLike(commentId, userId));
}

function createBorrowRequestForUser(itemId, userId, startDate, endDate, message) {
  if (isCloudMode()) {
    return callCloud("createBorrowRequest", { itemId, userId, startDate, endDate, message });
  }
  return Promise.resolve(store.createBorrowRequest(itemId, userId, startDate, endDate, message));
}

function createBorrowItemForUser(userId, data) {
  if (isCloudMode()) {
    return callCloud("createBorrowItem", { userId, data });
  }
  return Promise.resolve(store.createBorrowItem(userId, data));
}

function createRoommatePostForUser(userId, data) {
  if (isCloudMode()) {
    return callCloud("createRoommatePost", { userId, data });
  }
  return Promise.resolve(store.createRoommatePost(userId, data));
}

function createServiceOrderForUser(userId, serviceId, data) {
  if (isCloudMode()) {
    return callCloud("createServiceOrder", { userId, serviceId, data });
  }
  return Promise.resolve(store.createServiceOrder(userId, serviceId, data));
}

function isActivityRegisteredByUser(activityId, userId) {
  if (isCloudMode()) {
    return callCloud("isActivityRegistered", { activityId, userId });
  }
  return Promise.resolve(store.isActivityRegistered(activityId, userId));
}

// ========== 模式与配置 ==========

function getMode() {
  return DATA_MODE;
}

// ========== 公开只读接口（公寓/户型，游客可访问） ==========

// 首页公寓列表
// 支持真分页：page 默认 1，pageSize 默认 20 上限 100
// 云函数返回 { ok, data, page, pageSize, hasMore }
// mock 模式返回与云函数相同的分页结构（仅返回第一页，hasMore:false）
function getApartmentList(options) {
  const opts = options || {};
  const page = Number(opts.page) || 1;
  const pageSize = Number(opts.pageSize) || 20;
  if (isCloudMode()) {
    return callCloud("getApartmentList", { page, pageSize });
  }
  // mock 模式：从 queries 读取，包装为分页结构
  const cards = queries.getHomeApartmentCards();
  const start = (page - 1) * pageSize;
  const slice = cards.slice(start, start + pageSize);
  return Promise.resolve({
    ok: true,
    data: slice,
    page,
    pageSize,
    hasMore: start + pageSize < cards.length
  });
}

// 公寓详情（按 id）
function getApartmentDetail(id) {
  if (isCloudMode()) {
    return callCloud("getApartmentDetail", { id });
  }
  // mock 模式：返回与云函数相同的 { ok, data } 结构
  const apartment = queries.getApartmentById(id);
  return Promise.resolve({ ok: true, data: apartment });
}

// 某公寓的户型列表（按 apartment_code）
// 支持真分页：page 默认 1，pageSize 默认 20 上限 100
function getRoomListByApartment(apartmentCode, options) {
  const opts = options || {};
  const page = Number(opts.page) || 1;
  const pageSize = Number(opts.pageSize) || 20;
  if (isCloudMode()) {
    return callCloud("getRoomListByApartment", { apartmentCode, page, pageSize });
  }
  // mock 模式：从 mock-store 读取，包装为分页结构
  const store = require("./mock-store");
  const tables = store.getTables();
  const allRooms = tables.roomTypes
    .filter((room) => room.apartment_code === apartmentCode && (room.status === "active" || !room.status))
    .map((room) => ({
      id: room.id,
      apartment_id: room.apartment_id,
      apartment_code: room.apartment_code || "",
      name: room.name,
      area: room.area,
      orient: room.orient,
      layout: room.layout,
      floor: room.floor,
      price: room.price,
      status: room.status,
      image: room.image,
      desc: room.desc
    }));
  const start = (page - 1) * pageSize;
  const slice = allRooms.slice(start, start + pageSize);
  return Promise.resolve({
    ok: true,
    data: slice,
    page,
    pageSize,
    hasMore: start + pageSize < allRooms.length
  });
}

// 单个户型详情（按 apartment_code + id）
function getRoomDetail(apartmentCode, id) {
  if (isCloudMode()) {
    return callCloud("getRoomDetail", { apartmentCode, id });
  }
  // mock 模式：返回与云函数相同的 { ok, data: { room, apartment } } 结构
  const result = queries.getRoomById(0, id); // aptId 在 mock 模式不重要，按 roomId 查
  return Promise.resolve({
    ok: true,
    data: {
      room: result.room,
      apartment: result.apartment
    }
  });
}

module.exports = {
  isCloudMode,
  getMode,
  getTables,
  getAdminDataset,
  getNextAdminId,
  saveAdminItem,
  deleteAdminItem,
  updateAdminItemStatus,
  importAdminItems,
  createImportTask,
  previewImport,
  confirmImport,
  getImportTask,
  listImportTasks,
  exportAdminItems,
  createExportFile,
  loginUser,
  getUserByOpenid,
  isUserAdmin,
  registerActivityForUser,
  submitUserComment,
  toggleFavoriteForUser,
  toggleCommentLikeForUser,
  createBorrowRequestForUser,
  createBorrowItemForUser,
  createRoommatePostForUser,
  createServiceOrderForUser,
  isActivityRegisteredByUser,
  // 公开只读接口（公寓/户型）
  getApartmentList,
  getApartmentDetail,
  getRoomListByApartment,
  getRoomDetail
};
