const { loginUser, getUserInfoByOpenid } = require("./data/queries");
const db = require("./data/db");
const envList = require("./envList");

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

  // 初始化云开发（仅当配置了云环境时生效）
  initCloud() {
    if (db.isCloudMode() && envList.envList.length > 0) {
      wx.cloud.init({
        env: envList.envList[0],
        traceUser: true
      });
      this.globalData.cloudReady = true;
      console.log("[cloud] 云开发已初始化，环境:", envList.envList[0]);
    } else {
      console.log("[cloud] 使用 mock 模式，未初始化云开发");
    }
  },

  // 从本地缓存恢复登录态
  restoreLogin() {
    try {
      const cached = wx.getStorageSync("auth_info");
      if (cached && cached.openid) {
        const user = getUserInfoByOpenid(cached.openid);
        if (user) {
          this.globalData.openid = cached.openid;
          this.globalData.userInfo = user;
          this.globalData.userId = user.id;
          this.globalData.isLoggedIn = true;
          this.globalData.isAdmin = user.role === "admin";
        }
      }
    } catch (e) {
      // 缓存读取失败，保持未登录
    }
  },

  // 微信授权登录
  // 参数：nickname（用户填写的昵称）、phone（手机号）
  login(nickname, phone) {
    if (db.isCloudMode() && this.globalData.cloudReady) {
      // 云模式：调用 wx.login 获取 code，通过云函数换取 openid
      return this.loginWithCloud(nickname, phone);
    }
    // mock 模式：模拟 openid 生成
    return this.loginWithMock(nickname, phone);
  },

  // mock 模式登录（同步）
  loginWithMock(nickname, phone) {
    const mockOpenid = "wx_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    const result = loginUser(mockOpenid, nickname, phone);
    if (!result.ok) {
      return { ok: false, reason: "login_failed" };
    }
    this.applyLoginSuccess(mockOpenid, result.user, result.isNew);
    return { ok: true, user: result.user, isNew: result.isNew };
  },

  // 云模式登录（异步）
  loginWithCloud(nickname, phone) {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          // 通过云函数获取 openid 并登录
          wx.cloud.callFunction({
            name: "rencai",
            data: {
              action: "loginUser",
              code: loginRes.code,
              nickname,
              phone
            },
            success: (cfRes) => {
              const result = cfRes.result;
              if (!result.ok) {
                resolve({ ok: false, reason: "login_failed" });
                return;
              }
              this.applyLoginSuccess(result.user.openid, result.user, result.isNew);
              resolve({ ok: true, user: result.user, isNew: result.isNew });
            },
            fail: (err) => {
              console.error("[cloud] login failed:", err);
              // 云登录失败时降级到 mock 模式
              const mockResult = this.loginWithMock(nickname, phone);
              resolve(mockResult);
            }
          });
        },
        fail: (err) => {
          console.error("[cloud] wx.login failed:", err);
          // wx.login 失败时降级到 mock 模式
          const mockResult = this.loginWithMock(nickname, phone);
          resolve(mockResult);
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
