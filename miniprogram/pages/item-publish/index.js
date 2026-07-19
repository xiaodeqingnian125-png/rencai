const { borrowCategories } = require("../../data/business");
const { showPreviewNotice } = require("../../utils/preview-mode");

Page({
  data: {
    categories: borrowCategories.filter((item) => item.value !== "all"),
    activeCategory: "tool",
    form: {
      name: "",
      desc: "",
      rules: "",
      location: ""
    },
    loginModalVisible: false
  },

  onLoad() {
    this.ensureLogin();
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
    wx.navigateBack();
  },

  selectCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.value });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitItem() {
    showPreviewNotice();
  }
});
