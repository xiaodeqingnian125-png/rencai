const { getApartmentById } = require("../../data/apartments");
const {
  submitUserComment,
  toggleFavoriteForUser,
  toggleCommentLikeForUser
} = require("../../data/queries");
const db = require("../../data/db");

Page({
  data: {
    apartment: null,
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
    navIconSize: "",
    locationMarkers: []
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
    const isAdmin = !!app.globalData.isAdmin;
    this.setData({
      apartment,
      isAdmin,
      favorite: isLoggedIn && apartment.favorite ? apartment.favorite : false,
      locationMarkers: [{
        id: 0,
        longitude: apartment.longitude,
        latitude: apartment.latitude,
        title: apartment.name
      }]
    });
  },

  onMapTap(e) {
    // 使用 chooseLocation 让用户选择位置
    wx.chooseLocation({
      longitude: this.data.apartment.longitude || 113.6,
      latitude: this.data.apartment.latitude || 34.7,
      success: (res) => {
        const { longitude, latitude } = res;
        // 更新数据库
        db.saveAdminItem("apartments", {
          id: this.apartmentId,
          longitude: longitude,
          latitude: latitude
        }).then(() => {
          this.setData({
            "apartment.longitude": longitude,
            "apartment.latitude": latitude,
            locationMarkers: [{
              id: 0,
              longitude,
              latitude,
              title: this.data.apartment.name
            }]
          });
          wx.showToast({ title: "位置已更新", icon: "success" });
        }).catch(() => {
          wx.showToast({ title: "更新失败", icon: "none" });
        });
      },
      fail: (err) => {
        // 用户取消选择时不报错，仅打日志
        console.log("[chooseLocation] cancel or fail:", err.errMsg || err);
      }
    });
  },

  onImageChange(e) {
    const newImage = e.detail.value;
    db.saveAdminItem("apartments", {
      id: this.apartmentId,
      image: newImage
    }).then(() => {
      this.setData({ "apartment.image": newImage });
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
