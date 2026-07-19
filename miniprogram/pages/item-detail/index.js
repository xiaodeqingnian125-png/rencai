const { getBorrowItemById } = require("../../data/business");
const { showPreviewNotice } = require("../../utils/preview-mode");

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
    showPreviewNotice();
  },

  closeRequest() {
    this.setData({ requestOpen: false });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitRequest() {
    showPreviewNotice();
  }
});
