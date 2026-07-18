const { getRoomById } = require("../../data/apartments");
const {
  submitUserComment,
  toggleFavoriteForUser,
  toggleCommentLikeForUser
} = require("../../data/queries");
const db = require("../../data/db");

Page({
  data: {
    apartment: null,
    room: null,
    favorite: false,
    commentSheetOpen: false,
    commentDraft: "",
    commentCount: "0/200",
    lastCommentAt: 0,
    loginModalVisible: false,
    isAdmin: false,
    navTop: "",
    navHeight: "",
    navWidth: "",
    navRadius: "",
    navIconSize: ""
  },

  onLoad(options) {
    this.aptId = options.aptId;
    this.roomId = options.roomId;
    this.initNavBar();
    this.loadRoom();
  },

  initNavBar() {
    try {
      const menu = wx.getMenuButtonBoundingClientRect();
      const h = menu.height;
      this.setData({
        navTop: menu.top + "px",
        navHeight: h + "px",
        navWidth: Math.round(h * 1.3) + "px",
        navRadius: h / 2 + "px",
        navIconSize: Math.round(h * 0.5) + "px"
      });
    } catch (e) {
      this.setData({
        navTop: "calc(env(safe-area-inset-top) + 12px)",
        navHeight: "32px",
        navWidth: "42px",
        navRadius: "16px",
        navIconSize: "16px"
      });
    }
  },

  onShow() {
    this.loadRoom();
  },

  loadRoom() {
    const { apartment, room } = getRoomById(this.aptId, this.roomId);
    const app = getApp();
    const isLoggedIn = app.globalData.isLoggedIn;
    const isAdmin = !!app.globalData.isAdmin;
    this.setData({
      apartment,
      room,
      isAdmin,
      favorite: isLoggedIn && room.favorite ? room.favorite : false
    });
  },

  onImageChange(e) {
    const newImage = e.detail.value;
    db.saveAdminItem("room_types", {
      id: this.roomId,
      image: newImage
    }).then(() => {
      this.setData({ "room.image": newImage });
      wx.showToast({ title: "图片已更新", icon: "success" });
    }).catch(() => {
      wx.showToast({ title: "更新失败", icon: "none" });
    });
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
    this.loadRoom();
  },

  onLoginCancel() {
    this.setData({ loginModalVisible: false });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: "/pages/index/index" });
  },

  toggleFavorite() {
    if (!this.ensureLogin()) return;
    const app = getApp();
    const userId = app.globalData.userId;
    const result = toggleFavoriteForUser("room_type", this.data.room.id, userId);
    if (!result.ok) return;
    this.setData({ favorite: result.favorite });
    wx.showToast({
      title: result.favorite ? "已收藏" : "已取消收藏",
      icon: "none"
    });
  },

  openCommentSheet() {
    if (!this.ensureLogin()) return;
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
    const app = getApp();
    const userId = app.globalData.userId;
    const newComment = submitUserComment(
      "room_type",
      this.data.room.id,
      userId,
      text
    );
    const comments = [newComment, ...this.data.room.comments];
    this.setData({
      "room.comments": comments,
      commentDraft: "",
      commentCount: "0/200",
      commentSheetOpen: false,
      lastCommentAt: now
    });
    wx.showToast({ title: "评价已发布", icon: "none" });
  },

  likeComment(e) {
    if (!this.ensureLogin()) return;
    const index = Number(e.currentTarget.dataset.index);
    const target = this.data.room.comments[index];
    if (!target) return;
    const app = getApp();
    const userId = app.globalData.userId;
    const result = toggleCommentLikeForUser(target.id, userId);
    if (!result.ok) return;
    const comments = this.data.room.comments.map((comment, idx) => (
      idx === index ? { ...comment, likes: result.likes, liked: result.liked } : comment
    ));
    this.setData({ "room.comments": comments });
  },

  onShareAppMessage() {
    return {
      title: this.data.room ? `${this.data.apartment.name} · ${this.data.room.name}` : "晓得青年户型详情",
      path: this.data.apartment && this.data.room
        ? `/pages/room-detail/index?aptId=${this.data.apartment.id}&roomId=${this.data.room.id}`
        : "/pages/index/index"
    };
  }
});
