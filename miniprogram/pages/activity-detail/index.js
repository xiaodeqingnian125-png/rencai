const { getActivityById } = require("../../data/business");
const { showPreviewNotice } = require("../../utils/preview-mode");

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
    this.setData({ activity, registered: false }, () => this.syncRegisterState());
  },

  syncRegisterState() {
    const { activity } = this.data;
    if (!activity) return;
    this.setData({ registerButtonText: "功能预览", registerDisabled: false });
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
    showPreviewNotice();
  },

  closeRegister() {
    this.setData({ formOpen: false });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitRegister() {
    showPreviewNotice();
  },

  onShareAppMessage() {
    return {
      title: this.data.activity ? this.data.activity.title : "晓得青年活动",
      path: this.data.activity ? `/pages/activity-detail/index?id=${this.data.activity.id}` : "/pages/service/index"
    };
  }
});
