const { getServiceById } = require("../../data/business");
const { showPreviewNotice } = require("../../utils/preview-mode");

Page({
  data: {
    service: null,
    orderOpen: false,
    form: {
      name: "",
      phone: "",
      address: "",
      remark: ""
    },
    loginModalVisible: false
  },

  onLoad(options) {
    this.setData({ service: getServiceById(options.id) });
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

  openOrder() {
    showPreviewNotice();
  },

  closeOrder() {
    this.setData({ orderOpen: false });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitOrder() {
    showPreviewNotice();
  }
});
