const { getActivityById } = require("../../data/business");

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
    }
  },

  onLoad(options) {
    this.setData({ activity: getActivityById(options.id) }, () => this.syncRegisterState());
  },

  syncRegisterState() {
    const { activity, registered } = this.data;
    if (!activity) return;
    const registerDisabled = activity.full || registered;
    const registerButtonText = registered ? "已报名" : (activity.full ? "已满员" : "立即报名");
    this.setData({ registerButtonText, registerDisabled });
  },

  openRegister() {
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
    const activity = {
      ...this.data.activity,
      currentCount: this.data.activity.currentCount + 1
    };
    activity.participants = `${activity.currentCount}/${activity.maxCount}人`;
    activity.statusText = `报名中 · ${activity.currentCount}/${activity.maxCount}人`;
    this.setData({
      activity,
      registered: true,
      formOpen: false
    }, () => this.syncRegisterState());
    wx.showModal({
      title: "报名成功",
      content: "活动前提醒会在消息页模拟展示。若活动有费用，请按页面说明与主办方线下确认。",
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
