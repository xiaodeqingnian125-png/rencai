const {
  borrowCategories,
  getActivities,
  getActivityById,
  getServices,
  getServiceById,
  getBorrowItems,
  getBorrowItemById,
  getMessages,
  getProfileRecords
} = require("./queries");

const api = {
  borrowCategories,
  getActivities,
  getActivityById,
  getServices,
  getServiceById,
  getBorrowItems,
  getBorrowItemById
};

// messages 和 profileRecords 改为动态 getter，
// 避免模块加载时缓存快照导致后续运行时写入读不到。
Object.defineProperty(api, "messages", {
  enumerable: true,
  get: getMessages
});

Object.defineProperty(api, "profileRecords", {
  enumerable: true,
  get: getProfileRecords
});

module.exports = api;
