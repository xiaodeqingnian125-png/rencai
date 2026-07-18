const { getBorrowItemById } = require("../../data/business");
const { createBorrowRequestForUser } = require("../../data/queries");

Page({
  data: {
    item: null,
    requestOpen: false,
    requested: false,
    requestButtonText: "申请借用",
    requestSheetTitle: "申请借用",
    form: {
      startDate: "",
      endDate: "",
      message: ""
    },
    loginModalVisible: false
  },

  onLoad(options) {
    this.itemId = options.id;
    this.setData({ item: getBorrowItemById(this.itemId) }, () => this.syncRequestState());
  },

  syncRequestState() {
    const { item, requested } = this.data;
    if (!item) return;
    const actionText = item.status === "borrowed" ? "预约借用" : "申请借用";
    this.setData({
      requestButtonText: requested ? "已申请" : actionText,
      requestSheetTitle: actionText
    });
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
  },

  onLoginCancel() {
    this.setData({ loginModalVisible: false });
  },

  openRequest() {
    if (!this.ensureLogin()) return;
    if (this.data.requested) {
      wx.showToast({ title: "申请已提交，等待物主确认", icon: "none" });
      return;
    }
    this.setData({ requestOpen: true });
  },

  closeRequest() {
    this.setData({ requestOpen: false });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitRequest() {
    const { startDate, endDate, message } = this.data.form;
    if (!startDate.trim() || !endDate.trim()) {
      wx.showToast({ title: "请填写借用开始和归还时间", icon: "none" });
      return;
    }
    const app = getApp();
    const userId = app.globalData.userId;
    const result = createBorrowRequestForUser(
      this.data.item.id,
      userId,
      startDate.trim(),
      endDate.trim(),
      message.trim()
    );
    if (!result.ok) {
      wx.showToast({ title: "申请提交失败", icon: "none" });
      return;
    }
    this.setData({ requestOpen: false, requested: true }, () => this.syncRequestState());
    wx.showModal({
      title: "申请已发送",
      content: "物主会在消息页收到借用申请。确认后如需发送具体房间号，会通过消息通知你。",
      showCancel: false
    });
  }
});
