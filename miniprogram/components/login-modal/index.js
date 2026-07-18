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
    // 真实环境：e.detail.code 发送到后端调用 phonenumber.getPhoneNumber 换取真实号码
    // mock 环境：开发工具下 e.detail.phoneNumber 可能为空，自动切换手动输入
    onGetPhoneNumber(e) {
      if (e.detail.errMsg !== "getPhoneNumber:ok") {
        wx.showToast({ title: "未获取到手机号，请手动输入", icon: "none" });
        this.setData({ phoneInputMode: "manual" });
        return;
      }
      // 真实环境/真机上 e.detail.phoneNumber 有值
      if (e.detail.phoneNumber) {
        this.setData({ phone: e.detail.phoneNumber });
        wx.showToast({ title: "手机号已获取", icon: "none" });
        return;
      }
      // 开发工具下可能无值，自动切换手动输入
      wx.showToast({ title: "请手动输入手机号", icon: "none" });
      this.setData({ phoneInputMode: "manual" });
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
          wx.showToast({ title: "登录失败，请重试", icon: "none" });
          return;
        }
        this.setData({ nickname: "", phone: "", phoneInputMode: "wechat" });
        this.triggerEvent("loginsuccess", { user: res.user, isNew: res.isNew });
      };

      if (result && typeof result.then === "function") {
        result.then(handleResult).catch(() => {
          this.setData({ loading: false });
          wx.showToast({ title: "登录失败，请重试", icon: "none" });
        });
      } else {
        handleResult(result);
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
