const db = require("../../data/db");

// 将云端返回的 room 对象映射为页面兼容格式
// 明确保留 costs/facilities（来自所属公寓，云函数已填充并规范化）
function mapRoomToPage(room, apartment) {
  if (!room) return null;
  const price = Number(room.price) || 0;
  return {
    id: room.id,
    apartment_id: room.apartment_id || (apartment && apartment.id) || 0,
    apartment_code: room.apartment_code || (apartment && apartment.apartment_code) || "",
    name: room.name || "",
    area: room.area || "",
    orient: room.orient || "",
    layout: room.layout || "",
    floor: room.floor || "",
    price: `¥${price}`,
    priceValue: price,
    status: room.status || "active",
    image: room.image || "",
    desc: room.desc || "",
    favorite: false,
    // costs/facilities 来自云函数 toRoomPage（继承自所属公寓）
    costs: Array.isArray(room.costs) ? room.costs : [],
    facilities: Array.isArray(room.facilities) ? room.facilities : [],
    comments: [] // 云模式评论走独立链路，暂不展示假数据
  };
}

function mapApartmentToPage(apt) {
  if (!apt) return null;
  return {
    id: apt.id,
    apartment_code: apt.apartment_code || "",
    name: apt.name || "",
    district: apt.district || ""
  };
}

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
    navIconSize: "",
    loading: true,
    error: "",
    notFound: false
  },

  onLoad(options) {
    this.aptId = options.aptId;
    this.roomId = options.roomId;
    this.apartmentCode = options.apartmentCode || "";
    this._isAlive = true;
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
    if (this._loadedOnce) {
      this.loadRoom();
    }
  },

  onUnload() {
    this._isAlive = false;
  },

  loadRoom() {
    if (!this._isAlive) return;
    this.setData({ loading: true, error: "", notFound: false });
    // 优先用 apartment_code 查询（云模式），否则回退到 roomId（mock 模式）
    const code = this.apartmentCode;
    if (db.isCloudMode() && code) {
      db.getRoomDetail(code, this.roomId).then((res) => this._applyRoomResult(res)).catch((err) => this._handleRoomError(err));
    } else if (db.isCloudMode() && !code) {
      // 云模式但没有 apartment_code，无法查询（云函数要求 code + id 双校验）
      console.error("[room-detail] 云模式缺少 apartment_code 参数");
      this.setData({ loading: false, error: "户型参数不完整，请从公寓详情进入" });
    } else {
      // mock 模式：通过 db.getRoomDetail 走 queries 兜底
      db.getRoomDetail(code, this.roomId).then((res) => this._applyRoomResult(res)).catch((err) => this._handleRoomError(err));
    }
  },

  _applyRoomResult(res) {
    if (!this._isAlive) return;
    if (!res || !res.ok) {
      if (res && res.code === "not_found") {
        this.setData({ loading: false, notFound: true, room: null, apartment: null });
        return;
      }
      const message = (res && res.message) || "加载户型详情失败";
      console.error("[room-detail] loadRoom failed:", res);
      this.setData({ loading: false, error: message, room: null, apartment: null });
      return;
    }
    const payload = res.data || {};
    const apartment = mapApartmentToPage(payload.apartment);
    const room = mapRoomToPage(payload.room, apartment);
    const app = getApp();
    const isAdmin = !!app.globalData.isAdmin;
    this._loadedOnce = true;
    this.setData({
      loading: false,
      apartment,
      room,
      isAdmin,
      favorite: false
    });
  },

  _handleRoomError(err) {
    console.error("[room-detail] loadRoom exception:", err);
    if (!this._isAlive) return;
    this.setData({ loading: false, error: "网络异常，请稍后重试", room: null, apartment: null });
  },

  retryLoad() {
    this.loadRoom();
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
    if (db.isCloudMode()) {
      wx.showToast({ title: "收藏功能云端化中", icon: "none" });
      return;
    }
    const { toggleFavoriteForUser } = require("../../data/queries");
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
    if (db.isCloudMode()) {
      wx.showToast({ title: "评论功能云端化中", icon: "none" });
      return;
    }
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
    if (db.isCloudMode()) {
      wx.showToast({ title: "评论功能云端化中", icon: "none" });
      this.setData({ commentSheetOpen: false });
      return;
    }
    const now = Date.now();
    if (this.data.lastCommentAt && now - this.data.lastCommentAt < 5 * 60 * 1000) {
      wx.showToast({ title: "5分钟内不能重复提交评价", icon: "none" });
      return;
    }
    const { submitUserComment } = require("../../data/queries");
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
    if (db.isCloudMode()) {
      wx.showToast({ title: "点赞功能云端化中", icon: "none" });
      return;
    }
    const index = Number(e.currentTarget.dataset.index);
    const target = this.data.room.comments[index];
    if (!target) return;
    const { toggleCommentLikeForUser } = require("../../data/queries");
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
