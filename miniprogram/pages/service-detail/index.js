const { getServiceById } = require("../../data/business");

Page({
  data: {
    service: null,
    orderOpen: false,
    form: {
      name: "",
      phone: "",
      address: "",
      remark: ""
    }
  },

  onLoad(options) {
    this.setData({ service: getServiceById(options.id) });
  },

  openOrder() {
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
    const { name, phone, address } = this.data.form;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      wx.showToast({ title: "请填写联系人、手机号和地址", icon: "none" });
      return;
    }
    this.setData({ orderOpen: false });
    wx.showModal({
      title: "需求已提交",
      content: "当前未配置微信支付，订单不会发起线上扣款。客服会联系你确认时间和线下支付方式。",
      showCancel: false
    });
  }
});
