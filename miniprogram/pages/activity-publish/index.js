Page({
  data: {
    modeOptions: ["线下", "线上"],
    activeMode: "线下",
    locationPlaceholder: "如：郑东人才公寓活动室",
    form: {
      title: "",
      category: "",
      date: "",
      time: "",
      location: "",
      fee: "0",
      maxCount: "",
      intro: ""
    }
  },

  selectMode(e) {
    const activeMode = e.currentTarget.dataset.value;
    this.setData({
      activeMode,
      locationPlaceholder: activeMode === "线下" ? "如：郑东人才公寓活动室" : "如：腾讯会议"
    });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitActivity() {
    const { form, activeMode } = this.data;
    if (!form.title.trim() || !form.date.trim() || !form.time.trim() || !form.intro.trim()) {
      wx.showToast({ title: "请补全标题、时间和介绍", icon: "none" });
      return;
    }
    if (activeMode === "线下" && !form.location.trim()) {
      wx.showToast({ title: "线下活动需填写地点", icon: "none" });
      return;
    }
    wx.showModal({
      title: "已提交审核",
      content: "活动会进入管理员审核队列，通过后以用户活动标签展示。费用按 V1.0 规则线下确认。",
      showCancel: false,
      success: () => wx.navigateBack()
    });
  }
});
