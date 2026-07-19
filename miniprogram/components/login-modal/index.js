Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    nickname: "",
    phone: "",
    phoneInputMode: "wechat",
    loading: false
  },

  methods: {
    onNicknameInput(e) {
      this.setData({ nickname: e.detail.value });
    },

    onPhoneInput(e) {
      this.setData({ phone: e.detail.value });
    },

    // 微信手机号快速验证回调
    // 微信安全策略：e.detail.phoneNumber 不再直接返回，需用 e.detail.code
    // 通过云函数 getPhoneByCode 调用 phonenumber.getPhoneNumber 换取真实号码
    onGetPhoneNumber(e) {
      if (e.detail.errMsg !== "getPhoneNumber:ok") {
        wx.showToast({ title: "未获取到手机号，请手动输入", icon: "none" });
        this.setData({ phoneInputMode: "manual" });
        return;
      }
      const code = e.detail.code;
      if (!code) {
        wx.showToast({ title: "请手动输入手机号", icon: "none" });
        this.setData({ phoneInputMode: "manual" });
        return;
      }
      // 云开发未初始化时（mock 模式）直接降级手动输入
      const app = getApp();
      if (!app.globalData.cloudReady) {
        wx.showToast({ title: "请手动输入手机号", icon: "none" });
        this.setData({ phoneInputMode: "manual" });
        return;
      }
      // 通过云函数用 code 换取真实手机号
      this.setData({ loading: true });
      wx.cloud.callFunction({
        name: "rencai",
        data: { action: "getPhoneByCode", code },
        success: (cfRes) => {
          this.setData({ loading: false });
          const result = cfRes.result;
          if (result && result.ok && result.phoneNumber) {
            this.setData({ phone: result.phoneNumber });
            wx.showToast({ title: "手机号已获取", icon: "none" });
            // 昵称已填则自动登录，否则等用户填完昵称手动点登录
            if (this.data.nickname.trim()) {
              this.onLogin();
            }
          } else {
            wx.showToast({ title: "获取手机号失败，请手动输入", icon: "none" });
            this.setData({ phoneInputMode: "manual" });
          }
        },
        fail: (err) => {
          console.error("[login] getPhoneByCode failed:", err);
          this.setData({ loading: false });
          wx.showToast({ title: "获取手机号失败，请手动输入", icon: "none" });
          this.setData({ phoneInputMode: "manual" });
        }
      });
    },

    // 切换手机号输入模式
    togglePhoneMode() {
      const next = this.data.phoneInputMode === "wechat" ? "manual" : "wechat";
      this.setData({ phoneInputMode: next });
    },

    onLogin() {
      const { nickname, phone } = this.data;
      if (!nickname.trim()) {
        wx.showToast({ title: "请输入昵称", icon: "none" });
        return;
      }
      if (!phone.trim() || phone.trim().length !== 11) {
        wx.showToast({ title: "请输入11位手机号", icon: "none" });
        return;
      }
      this.setData({ loading: true });
      const app = getApp();
      const result = app.login(nickname.trim(), phone.trim());

      // 支持同步（mock）和异步（cloud）两种返回
      const handleResult = (res) => {
        this.setData({ loading: false });
        if (!res || !res.ok) {
          const toast = this.mapLoginErrorToToast(res);
          wx.showToast({ title: toast, icon: "none" });
          return;
        }
        this.setData({ nickname: "", phone: "", phoneInputMode: "wechat" });
        this.triggerEvent("loginsuccess", { user: res.user, isNew: res.isNew });
      };

      if (result && typeof result.then === "function") {
        result.then(handleResult).catch((err) => {
          this.setData({ loading: false });
          console.error("[login-modal] 未捕获的异常:", err);
          wx.showToast({ title: "登录异常，请重试", icon: "none" });
        });
      } else {
        handleResult(result);
      }
    },

    // 将登录错误映射为用户可理解的提示文案
    mapLoginErrorToToast(res) {
      if (!res) return "登录失败，请重试";
      const code = res.code;
      const msg = res.message || "";
      switch (code) {
        case "cloud_not_initialized":
          return "云开发未初始化，请联系管理员";
        case "function_call_failed":
          return "云函数未部署，请先部署 rencai";
        case "users_collection_missing":
          return "用户数据库未初始化，请联系管理员";
        case "login_user_failed":
          return msg || "登录失败，请重试";
        case "wx_login_failed":
          return "微信登录失败，请重试";
        case "invalid_result":
        case "empty_cloud_result":
          return msg || "云函数返回异常，请重试";
        case "cloud_action_failed":
          return msg || "云函数执行异常，请重试";
        case "no_openid":
          return "无法获取身份，请重试";
        case "invalid_params":
          return "请填写完整信息";
        case "users_query_failed":
        case "user_query_failed":
          return msg || "查询用户失败，请重试";
        default:
          return msg || "登录失败，请重试";
      }
    },

    onCancel() {
      this.triggerEvent("cancel");
    },

    onMaskTap() {
      this.triggerEvent("cancel");
    },

    noop() {}
  }
});
