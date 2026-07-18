const { getActivityById } = require("../../data/business");
const {
  registerActivityForUser,
  isActivityRegisteredByUser
} = require("../../data/queries");

Page({
  data: {
    activity: null,
    registered: false,
    registerButtonText: "立即报名",
    registerDisabled: false,
    formOpen: false,
    form: {
      name: "",
      phone: ""
    },
    loginModalVisible: false
  },

  onLoad(options) {
    this.activityId = options.id;
    this.refreshActivity();
  },

  onShow() {
    this.refreshActivity();
  },

  refreshActivity() {
    const activity = getActivityById(this.activityId);
    const app = getApp();
    const isLoggedIn = app.globalData.isLoggedIn;
    const userId = app.globalData.userId;
    const registered = isLoggedIn ? isActivityRegisteredByUser(this.activityId, userId) : false;
    this.setData({ activity, registered }, () => this.syncRegisterState());
  },

  syncRegisterState() {
    const { activity, registered } = this.data;
    if (!activity) return;
    const registerDisabled = activity.full || registered;
    const registerButtonText = registered ? "已报名" : (activity.full ? "已满员" : "立即报名");
    this.setData({ registerButtonText, registerDisabled });
  },

  ensureLogin() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      this.setData({ loginModalVisible: true });
      return false;
    }
    return true;
  },

  onLoginSuccess() {
    this.setData({ loginModalVisible: false });
    this.refreshActivity();
  },

  onLoginCancel() {
    this.setData({ loginModalVisible: false });
  },

  openRegister() {
    if (!this.ensureLogin()) return;
    if (this.data.activity.full) {
      wx.showToast({ title: "活动已满员，关注后续名额", icon: "none" });
      return;
    }
    if (this.data.registered) {
      wx.showToast({ title: "你已报名该活动", icon: "none" });
      return;
    }
    this.setData({ formOpen: true });
  },

  closeRegister() {
    this.setData({ formOpen: false });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitRegister() {
    const { name, phone } = this.data.form;
    if (!name.trim() || !phone.trim()) {
      wx.showToast({ title: "请填写姓名和手机号", icon: "none" });
      return;
    }
    const app = getApp();
    const userId = app.globalData.userId;
    const result = registerActivityForUser(this.data.activity.id, userId, name.trim(), phone.trim());
    if (!result.ok) {
      const reasonMap = {
        duplicate: "你已报名该活动",
        full: "活动已满员，关注后续名额",
        not_found: "活动不存在"
      };
      wx.showToast({ title: reasonMap[result.reason] || "报名失败", icon: "none" });
      return;
    }
    const activity = getActivityById(this.data.activity.id);
    this.setData({
      activity,
      registered: true,
      formOpen: false
    }, () => this.syncRegisterState());
    wx.showModal({
      title: "报名成功",
      content: `报名码：${result.code}。活动前提醒会在消息页展示。若活动有费用，请按页面说明与主办方线下确认。`,
      showCancel: false
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.activity ? this.data.activity.title : "晓得青年活动",
      path: this.data.activity ? `/pages/activity-detail/index?id=${this.data.activity.id}` : "/pages/service/index"
    };
  }
});
