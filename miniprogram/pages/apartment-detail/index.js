const db = require("../../data/db");

// 将云端返回的 apartment 对象映射为页面兼容格式（camelCase + 派生字段）
function mapApartmentToPage(apt) {
  if (!apt) return null;
  const priceMin = Number(apt.price_min) || 0;
  const priceMax = Number(apt.price_max) || 0;
  const latitude = Number(apt.latitude) || 0;
  const longitude = Number(apt.longitude) || 0;
  return {
    id: apt.id,
    apartment_code: apt.apartment_code || "",
    name: apt.name || "",
    district: apt.district || "",
    priceText: `¥${priceMin}-${priceMax}`,
    priceMin,
    priceMax,
    roomsText: apt.room_summary || "",
    location: apt.address || "",
    latitude,
    longitude,
    locationMeta: apt.location_meta || "",
    heroClass: apt.hero_class || "",
    imageClass: apt.image_class || "",
    image: apt.image || "",
    favorite: false, // 游客默认未收藏，登录用户由 toggleFavorite 管理
    apartmentFavoriteCount: 0, // 云模式暂不展示收藏数，避免假数据
    roomFavoriteCount: 0,
    rooms: [],
    costs: Array.isArray(apt.costs) ? apt.costs : [],
    privateFacilities: apt.private_facilities || [],
    publicFacilities: apt.public_facilities || [],
    nearby: apt.nearby || [],
    comments: [] // 云模式评论走独立链路，暂不展示假数据
  };
}

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
    locationMarkers: [],
    loading: true,
    error: "",
    notFound: false
  },

  onLoad(options) {
    this.apartmentId = options.id;
    this._isAlive = true;
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
    if (this._loadedOnce) {
      this.loadApartment();
    }
  },

  onUnload() {
    this._isAlive = false;
  },

  loadApartment() {
    if (!this._isAlive) return;
    this.setData({ loading: true, error: "", notFound: false });
    db.getApartmentDetail(this.apartmentId).then((res) => {
      if (!this._isAlive) return;
      if (!res || !res.ok) {
        if (res && res.code === "not_found") {
          this.setData({ loading: false, notFound: true, apartment: null });
          return;
        }
        const message = (res && res.message) || "加载公寓详情失败";
        console.error("[apartment-detail] loadApartment failed:", res);
        this.setData({ loading: false, error: message, apartment: null });
        return;
      }
      const apartment = mapApartmentToPage(res.data);
      const app = getApp();
      const isAdmin = !!app.globalData.isAdmin;
      this._loadedOnce = true;
      this.setData({
        loading: false,
        apartment,
        isAdmin,
        favorite: false,
        locationMarkers: [{
          id: 0,
          longitude: apartment.longitude,
          latitude: apartment.latitude,
          title: apartment.name
        }]
      }, () => {
        // 加载该公寓的户型列表（云模式按 apartment_code 查询）
        // 若页面已被卸载，跳过户户型加载（loadRooms 内部也会再检查 _isAlive）
        if (this._isAlive && apartment.apartment_code) {
          this.loadRooms(apartment.apartment_code);
        }
      });
    }).catch((err) => {
      console.error("[apartment-detail] loadApartment exception:", err);
      if (!this._isAlive) return;
      this.setData({ loading: false, error: "网络异常，请稍后重试", apartment: null });
    });
  },

  // 加载某公寓的户型列表
  // 当前公寓详情页只展示第一页户型（pageSize 100 覆盖 14 条数据）
  loadRooms(apartmentCode) {
    if (!apartmentCode) {
      console.warn("[apartment-detail] loadRooms: no apartment_code");
      return;
    }
    db.getRoomListByApartment(apartmentCode, { page: 1, pageSize: 100 }).then((res) => {
      if (!this._isAlive) return;
      if (!res || !res.ok) {
        console.error("[apartment-detail] loadRooms failed:", res);
        // 户型加载失败不阻塞公寓详情展示，仅置空
        this.setData({ "apartment.rooms": [] });
        return;
      }
      const rooms = (Array.isArray(res.data) ? res.data : []).map((room) => ({
        id: room.id,
        apartment_code: room.apartment_code || apartmentCode,
        aptId: this.data.apartment.id, // 兼容 wxml 的 data-apt-id
        name: room.name,
        area: room.area,
        orient: room.orient,
        layout: room.layout,
        floor: room.floor,
        price: `¥${room.price}`,
        priceValue: room.price,
        imageClass: "", // 云端无此字段，留空
        image: room.image || "",
        desc: room.desc || "",
        favorite: false,
        status: room.status
      }));
      this.setData({ "apartment.rooms": rooms });
    }).catch((err) => {
      console.error("[apartment-detail] loadRooms exception:", err);
      if (!this._isAlive) return;
      this.setData({ "apartment.rooms": [] });
    });
  },

  retryLoad() {
    this.loadApartment();
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
    const { aptId, roomId, apartmentCode } = e.currentTarget.dataset;
    // 优先使用 apartment_code（云模式按 apartment_code 关联）
    const code = apartmentCode || (this.data.apartment && this.data.apartment.apartment_code) || "";
    if (code) {
      wx.navigateTo({
        url: `/pages/room-detail/index?aptId=${aptId}&roomId=${roomId}&apartmentCode=${code}`
      });
    } else {
      wx.navigateTo({
        url: `/pages/room-detail/index?aptId=${aptId}&roomId=${roomId}`
      });
    }
  },

  goMap() {
    wx.navigateTo({
      url: `/pages/map/index?id=${this.data.apartment.id}`
    });
  },

  toggleFavorite() {
    if (!this.ensureLogin()) return;
    // 云模式下收藏走云端，本阶段未实现，提示开发中
    if (db.isCloudMode()) {
      wx.showToast({ title: "收藏功能云端化中", icon: "none" });
      return;
    }
    // mock 模式：动态加载 queries 避免云模式直接依赖
    const { toggleFavoriteForUser } = require("../../data/queries");
    const app = getApp();
    const userId = app.globalData.userId;
    const result = toggleFavoriteForUser("apartment", this.data.apartment.id, userId);
    if (!result.ok) return;
    const newCount = Math.max(0, (this.data.apartment.apartmentFavoriteCount || 0) + (result.favorite ? 1 : -1));
    this.setData({
      favorite: result.favorite,
      "apartment.apartmentFavoriteCount": newCount
    });
    wx.showToast({
      title: result.favorite ? "已收藏" : "已取消收藏",
      icon: "none"
    });
  },

  openCommentSheet() {
    if (!this.ensureLogin()) return;
    // 云模式下评论走云端，本阶段未实现
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
    if (db.isCloudMode()) {
      wx.showToast({ title: "点赞功能云端化中", icon: "none" });
      return;
    }
    const index = Number(e.currentTarget.dataset.index);
    const target = this.data.apartment.comments[index];
    if (!target) return;
    const { toggleCommentLikeForUser } = require("../../data/queries");
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
