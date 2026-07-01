const { getBorrowItemById } = require("../../data/business");

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
    }
  },

  onLoad(options) {
    this.setData({ item: getBorrowItemById(options.id) }, () => this.syncRequestState());
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

  openRequest() {
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
    const { startDate, endDate } = this.data.form;
    if (!startDate.trim() || !endDate.trim()) {
      wx.showToast({ title: "请填写借用开始和归还时间", icon: "none" });
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
