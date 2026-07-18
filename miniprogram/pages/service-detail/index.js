const { getServiceById } = require("../../data/business");
const { createServiceOrderForUser } = require("../../data/queries");

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
    if (!this.ensureLogin()) return;
    this.setData({ orderOpen: true });
  },

  closeOrder() {
    this.setData({ orderOpen: false });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitOrder() {
    const { name, phone, address, remark } = this.data.form;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      wx.showToast({ title: "请填写联系人、手机号和地址", icon: "none" });
      return;
    }
    const app = getApp();
    const userId = app.globalData.userId;
    const result = createServiceOrderForUser(userId, this.data.service.id, {
      contactName: name.trim(),
      contactPhone: phone.trim(),
      address: address.trim(),
      remark: remark.trim(),
      appointment: "待客服确认"
    });
    if (!result.ok) {
      wx.showToast({ title: "提交失败，请重试", icon: "none" });
      return;
    }
    this.setData({ orderOpen: false });
    wx.showModal({
      title: "需求已提交",
      content: `订单号：${result.orderNo}。当前未配置微信支付，订单不会发起线上扣款。客服会联系你确认时间和线下支付方式。可在「我的 → 我的订单」查看进度。`,
      showCancel: false
    });
  }
});
