const { getApartmentById } = require("../../data/apartments");
const {
  submitUserComment,
  toggleFavoriteForUser,
  toggleCommentLikeForUser
} = require("../../data/queries");

Page({
  data: {
    apartment: null,
    favorite: false,
    commentSheetOpen: false,
    commentDraft: "",
    commentCount: "0/200",
    lastCommentAt: 0,
    loginModalVisible: false,
    navTop: "",
    navHeight: "",
    navWidth: "",
    navRadius: "",
    navIconSize: ""
  },

  onLoad(options) {
    this.apartmentId = options.id;
    this.initNavBar();
    this.loadApartment();
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
    this.loadApartment();
  },

  loadApartment() {
    const apartment = getApartmentById(this.apartmentId);
    const app = getApp();
    const isLoggedIn = app.globalData.isLoggedIn;
    this.setData({
      apartment,
      favorite: isLoggedIn && apartment.favorite ? apartment.favorite : false
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
    this.loadApartment();
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
    if (!this.ensureLogin()) return;
    const app = getApp();
    const userId = app.globalData.userId;
    const result = toggleFavoriteForUser("apartment", this.data.apartment.id, userId);
    if (!result.ok) return;
    const apartment = getApartmentById(this.apartmentId);
    this.setData({
      favorite: result.favorite,
      "apartment.apartmentFavoriteCount": apartment.apartmentFavoriteCount
    });
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
      "apartment",
      this.data.apartment.id,
      userId,
      text
    );
    const comments = [newComment, ...this.data.apartment.comments];
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
    if (!this.ensureLogin()) return;
    const index = Number(e.currentTarget.dataset.index);
    const target = this.data.apartment.comments[index];
    if (!target) return;
    const app = getApp();
    const userId = app.globalData.userId;
    const result = toggleCommentLikeForUser(target.id, userId);
    if (!result.ok) return;
    const comments = this.data.apartment.comments.map((comment, idx) => (
      idx === index ? { ...comment, likes: result.likes, liked: result.liked } : comment
    ));
    this.setData({ "apartment.comments": comments });
  },

  onShareAppMessage() {
    return {
      title: this.data.apartment ? this.data.apartment.name : "晓得青年人才公寓",
      path: this.data.apartment ? `/pages/apartment-detail/index?id=${this.data.apartment.id}` : "/pages/index/index"
    };
  }
});
