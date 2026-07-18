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

const DATA_MODE = "mock"; // "mock" | "cloud"

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
  isActivityRegisteredByUser
};
