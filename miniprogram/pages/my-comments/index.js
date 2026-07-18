const { getMyComments } = require("../../data/queries");

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
    const id = Number(e.currentTarget.dataset.id);
    this.setData({
      comments: this.data.comments.filter((comment) => comment.id !== id)
    });
    wx.showToast({ title: "已删除", icon: "none" });
  }
});
