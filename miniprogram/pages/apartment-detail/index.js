const { getApartmentById } = require("../../data/apartments");

Page({
  data: {
    apartment: null,
    favorite: false,
    commentSheetOpen: false,
    commentDraft: "",
    commentCount: "0/200",
    lastCommentAt: 0
  },

  onLoad(options) {
    const apartment = getApartmentById(options.id);
    this.setData({
      apartment,
      favorite: apartment.favorite
    });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },

  goRoomDetail(e) {
    const { aptId, roomId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/room-detail/index?aptId=${aptId}&roomId=${roomId}`
    });
  },

  goMap() {
    wx.navigateTo({
      url: `/pages/map/index?id=${this.data.apartment.id}`
    });
  },

  toggleFavorite() {
    const favorite = !this.data.favorite;
    this.setData({ favorite });
    wx.showToast({
      title: favorite ? "已收藏" : "已取消收藏",
      icon: "none"
    });
  },

  openCommentSheet() {
    this.setData({ commentSheetOpen: true });
  },

  closeCommentSheet() {
    this.setData({ commentSheetOpen: false });
  },

  handleCommentInput(e) {
    const value = e.detail.value;
    this.setData({
      commentDraft: value,
      commentCount: `${value.length}/200`
    });
  },

  submitComment() {
    const text = this.data.commentDraft.trim();
    if (!text) {
      wx.showToast({ title: "请先写下评价内容", icon: "none" });
      return;
    }
    const now = Date.now();
    if (this.data.lastCommentAt && now - this.data.lastCommentAt < 5 * 60 * 1000) {
      wx.showToast({ title: "5分钟内不能重复提交评价", icon: "none" });
      return;
    }
    const comments = [
      {
        avatar: "我",
        avatarClass: "ca-1",
        name: "我",
        time: "刚刚",
        body: text,
        likes: 0
      },
      ...this.data.apartment.comments
    ];
    this.setData({
      "apartment.comments": comments,
      commentDraft: "",
      commentCount: "0/200",
      commentSheetOpen: false,
      lastCommentAt: now
    });
    wx.showToast({ title: "评价已发布", icon: "none" });
  },

  likeComment(e) {
    const index = Number(e.currentTarget.dataset.index);
    const comments = this.data.apartment.comments.map((comment, idx) => (
      idx === index ? { ...comment, likes: comment.likes + 1 } : comment
    ));
    this.setData({ "apartment.comments": comments });
  },

  replyComment() {
    wx.showToast({
      title: "回复功能下一步接入",
      icon: "none"
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.apartment ? this.data.apartment.name : "晓得青年人才公寓",
      path: this.data.apartment ? `/pages/apartment-detail/index?id=${this.data.apartment.id}` : "/pages/index/index"
    };
  }
});
