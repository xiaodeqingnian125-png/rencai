const { getMyComments } = require("../../data/queries");
const { showPreviewNotice } = require("../../utils/preview-mode");

Page({
  data: {
    comments: []
  },

  onLoad() {
    this.setData({ comments: getMyComments() });
  },

  openTarget(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.path });
  },

  deleteComment(e) {
    showPreviewNotice();
  }
});
