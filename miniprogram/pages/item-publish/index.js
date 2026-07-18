const { borrowCategories } = require("../../data/business");
const { createBorrowItemForUser } = require("../../data/queries");

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
    if (!this.ensureLogin()) return;
    const { name, desc, rules, location } = this.data.form;
    if (!name.trim() || !desc.trim() || !rules.trim() || !location.trim()) {
      wx.showToast({ title: "请补全物品信息", icon: "none" });
      return;
    }
    const app = getApp();
    const userId = app.globalData.userId;
    const result = createBorrowItemForUser(userId, {
      name: name.trim(),
      category: this.data.activeCategory,
      desc: desc.trim(),
      rules: rules.trim(),
      location: location.trim(),
      pickupLocation: location.trim()
    });
    if (!result.ok) {
      wx.showToast({ title: "发布失败，请重试", icon: "none" });
      return;
    }
    wx.showModal({
      title: "发布成功",
      content: "物品已发布，邻居可以在借个锤子看到并申请借用。你可以在「我的 → 我借出的」管理物品和处理借用申请。",
      showCancel: false,
      success: () => wx.navigateBack()
    });
  }
});
