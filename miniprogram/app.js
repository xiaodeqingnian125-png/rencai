const { loginUser, getUserInfoByOpenid } = require("./data/queries");
const db = require("./data/db");
const envList = require("./envList");

// 手机号脱敏：仅保留后 4 位（用于日志输出）
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

// 脱敏云函数返回中的敏感字段（phone / openid），用于调试日志
function maskResult(result) {
  if (!result) return result;
  try {
    const cloned = JSON.parse(JSON.stringify(result));
    if (cloned && cloned.user) {
      if (cloned.user.phone) cloned.user.phone = maskPhone(cloned.user.phone);
      if (cloned.user.openid) cloned.user.openid = maskOpenid(cloned.user.openid);
    }
    return cloned;
  } catch (e) {
    return { masked: "serialize_failed" };
  }
}

App({
  globalData: {
    appName: "晓得青年",
    userInfo: null,
    isLoggedIn: false,
    isAdmin: false,
    openid: "",
    userId: "",
    cloudReady: false
  },

  onLaunch() {
    this.initCloud();
    this.restoreLogin();
  },

  // 初始化云开发
  // 只要配置了云环境 ID 就初始化（用于手机号获取等云能力）
  // 数据层模式（mock/cloud）由 db.js 的 DATA_MODE 单独控制
  initCloud() {
    if (envList.envList.length > 0) {
      wx.cloud.init({
        env: envList.envList[0],
        traceUser: true
      });
      this.globalData.cloudReady = true;
      console.log("[cloud] 云开发已初始化，环境:", envList.envList[0],
        db.isCloudMode() ? "(数据层: cloud)" : "(数据层: mock)");
    } else {
      console.warn("[cloud] 未配置云环境 ID，云能力不可用");
    }
  },

  // 从本地缓存恢复登录态
  // 云模式下走异步云函数 getUserByOpenid 查询
  // mock 模式下走同步 store 查询
  restoreLogin() {
    try {
      const cached = wx.getStorageSync("auth_info");
      if (!cached || !cached.openid) {
        return;
      }

      if (db.isCloudMode()) {
        // 云模式：异步通过云函数查询
        // 注意：云模式下 cached.openid 是历史登录时记录的，
        // 实际查询时云函数会用 wxContext.OPENID（当前调用者身份）
        this.restoreLoginWithCloud(cached.openid);
      } else {
        // mock 模式：同步查询
        const user = getUserInfoByOpenid(cached.openid);
        if (user) {
          this.applyLoginSuccess(cached.openid, user, false);
        }
      }
    } catch (e) {
      console.warn("[restoreLogin] 缓存读取失败:", e);
    }
  },

  // 云模式恢复登录态
  restoreLoginWithCloud(cachedOpenid) {
    if (!this.globalData.cloudReady) {
      console.warn("[restoreLogin] 云开发未初始化，跳过恢复");
      return;
    }
    wx.cloud.callFunction({
      name: "rencai",
      data: { action: "getUserByOpenid" },
      success: (cfRes) => {
        const result = cfRes && cfRes.result;
        if (!result) {
          console.warn("[restoreLogin] 云函数返回空结果");
          return;
        }
        if (!result.ok) {
          // 常见原因：user_not_found（缓存过期）/ users_collection_missing（数据库未初始化）
          console.warn("[restoreLogin] 恢复失败:", result.code, result.message);
          // 缓存的 openid 已无效，清理本地缓存
          if (result.code === "user_not_found" || result.code === "users_collection_missing") {
            try { wx.removeStorageSync("auth_info"); } catch (e) { /* ignore */ }
          }
          return;
        }
        this.applyLoginSuccess(cachedOpenid, result.user, false);
        console.log("[restoreLogin] 恢复成功，user_id:", result.user.id, "role:", result.user.role);
      },
      fail: (err) => {
        console.error("[restoreLogin] 云函数调用失败:", err.errMsg || err);
      }
    });
  },

  // 微信授权登录
  // 参数：nickname（用户填写的昵称）、phone（手机号）
  // 返回：Promise<{ ok, code?, message?, user?, isNew? }>
  login(nickname, phone) {
    if (db.isCloudMode()) {
      if (!this.globalData.cloudReady) {
        console.error("[login] 云开发未初始化");
        return Promise.resolve({
          ok: false,
          code: "cloud_not_initialized",
          message: "云开发未初始化，请检查 envList.js 配置"
        });
      }
      return this.loginWithCloud(nickname, phone);
    }
    // mock 模式：模拟 openid 生成
    return Promise.resolve(this.loginWithMock(nickname, phone));
  },

  // mock 模式登录（同步，包装为 Promise）
  loginWithMock(nickname, phone) {
    const mockOpenid = "wx_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    const result = loginUser(mockOpenid, nickname, phone);
    if (!result.ok) {
      return { ok: false, code: "login_failed", message: "登录失败" };
    }
    this.applyLoginSuccess(mockOpenid, result.user, result.isNew);
    return { ok: true, user: result.user, isNew: result.isNew };
  },

  // 云模式登录（异步）
  // 不再静默降级到 mock 模式，所有错误显式返回
  loginWithCloud(nickname, phone) {
    return new Promise((resolve) => {
      wx.login({
        success: (loginRes) => {
          // 通过云函数换取 openid 并登录
          wx.cloud.callFunction({
            name: "rencai",
            data: {
              action: "loginUser",
              code: loginRes.code,
              nickname,
              phone
            },
            success: (cfRes) => {
              // 打印完整返回结构（敏感字段已脱敏），定位云函数返回格式不一致问题
              console.error("[login] loginUser完整返回（已脱敏）：",
                JSON.stringify(maskResult(cfRes && cfRes.result)));
              const result = cfRes && cfRes.result;
              if (!result) {
                console.error("[login] 云函数返回空结果");
                resolve({
                  ok: false,
                  code: "empty_cloud_result",
                  message: "云函数没有返回有效结果"
                });
                return;
              }
              if (!result.ok) {
                // 兼容旧版云函数返回 { ok:false, error:"..." }（无 code/message）
                console.error("[login] 登录失败:", result.code, result.message,
                  result.error ? "(legacy error: " + result.error + ")" : "");
                resolve({
                  ok: false,
                  code: result.code || (result.error ? "cloud_action_failed" : "login_user_failed"),
                  message: result.message || result.error || "登录失败"
                });
                return;
              }
              this.applyLoginSuccess(result.user.openid, result.user, result.isNew);
              console.log("[login] 登录成功，openid(脱敏):", maskOpenid(result.user.openid),
                "phone(脱敏):", maskPhone(phone), "role:", result.user.role);
              resolve({ ok: true, user: result.user, isNew: result.isNew });
            },
            fail: (err) => {
              console.error("[login] callFunction 失败:", err.errMsg || err);
              resolve({
                ok: false,
                code: "function_call_failed",
                message: "云函数调用失败，请确认 rencai 云函数已部署"
              });
            }
          });
        },
        fail: (err) => {
          console.error("[login] wx.login 失败:", err.errMsg || err);
          resolve({
            ok: false,
            code: "wx_login_failed",
            message: "微信登录失败，请稍后重试"
          });
        }
      });
    });
  },

  // 应用登录成功状态
  applyLoginSuccess(openid, user, isNew) {
    this.globalData.openid = openid;
    this.globalData.userInfo = user;
    this.globalData.userId = user.id;
    this.globalData.isLoggedIn = true;
    this.globalData.isAdmin = user.role === "admin";
    try {
      wx.setStorageSync("auth_info", { openid });
    } catch (e) {
      // 缓存写入失败不影响登录
    }
  },

  // 退出登录
  logout() {
    this.globalData.openid = "";
    this.globalData.userInfo = null;
    this.globalData.userId = "";
    this.globalData.isLoggedIn = false;
    this.globalData.isAdmin = false;
    try {
      wx.removeStorageSync("auth_info");
    } catch (e) {
      // ignore
    }
  }
});
