/**
 * 身份与权限校验模块
 *
 * 核心原则：
 * 1. 管理员身份只根据当前 OPENID 对应的 users 记录中的 role 字段判断
 * 2. 不接受前端传入的 openid / userId 决定当前用户身份
 * 3. 不根据昵称、手机号判定管理员
 * 4. 不把管理员 OPENID 或手机号硬编码到仓库文件
 *
 * ADMIN_OPENIDS（位于 env.js，gitignored）仅用于首次登录时引导初始化管理员角色，
 * 不直接用于管理员身份校验。留空时需在云数据库控制台手动将 users.role 设为 "admin"。
 */

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const localEnv = require("../env");
const ADMIN_OPENIDS = (localEnv && Array.isArray(localEnv.ADMIN_OPENIDS)) ? localEnv.ADMIN_OPENIDS : [];

/**
 * 根据 wxContext.OPENID 查询当前用户记录
 * 唯一身份来源：cloud.getWXContext().OPENID + users 集合
 * @param {Object} wxContext - cloud.getWXContext() 返回值
 * @returns {Promise<Object|null>} users 记录或 null
 */
async function getCurrentUser(wxContext) {
  const openid = wxContext && wxContext.OPENID;
  if (!openid) return null;
  try {
    const { data } = await db.collection("users").where({ openid }).get();
    return data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error("[rencai] getCurrentUser query failed:", err);
    return null;
  }
}

/**
 * 判定用户是否为管理员
 * 唯一依据：users.role === "admin"
 * @param {Object|null} user - getCurrentUser 返回的用户记录
 * @returns {boolean}
 */
function isAdmin(user) {
  return !!(user && user.role === "admin");
}

/**
 * 要求管理员身份
 * 用于保护管理员 action（getAdminDataset/saveAdminItem/initCloud 等）
 * @param {Object} wxContext
 * @returns {Promise<Object>} 成功返回 { ok:true, user, openid }，失败返回 { ok:false, code:"forbidden", message:"无权执行该操作" }
 */
async function requireAdmin(wxContext) {
  const openid = wxContext && wxContext.OPENID;
  if (!openid) {
    return { ok: false, code: "unauthorized", message: "请先登录" };
  }
  const user = await getCurrentUser(wxContext);
  if (!isAdmin(user)) {
    return { ok: false, code: "forbidden", message: "无权执行该操作" };
  }
  return { ok: true, user, openid };
}

/**
 * 要求已登录用户身份
 * 用于保护用户写操作（registerActivity/submitComment/toggleFavorite 等）
 * 返回的 user.id 用于覆盖前端传入的 userId，防止身份伪造
 * @param {Object} wxContext
 * @returns {Promise<Object>} 成功返回 { ok:true, user, openid }，失败返回 { ok:false, code:"unauthorized", message:"请先登录" }
 */
async function requireUser(wxContext) {
  const openid = wxContext && wxContext.OPENID;
  if (!openid) {
    return { ok: false, code: "unauthorized", message: "请先登录" };
  }
  const user = await getCurrentUser(wxContext);
  if (!user) {
    return { ok: false, code: "unauthorized", message: "请先登录" };
  }
  return { ok: true, user, openid };
}

module.exports = {
  ADMIN_OPENIDS,
  getCurrentUser,
  isAdmin,
  requireAdmin,
  requireUser
};
