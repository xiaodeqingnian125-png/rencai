const { showPreviewNotice } = require("../../utils/preview-mode");

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
    showPreviewNotice();
  }
});
