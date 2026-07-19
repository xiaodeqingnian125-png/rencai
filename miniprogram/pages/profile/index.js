const { showPreviewNotice } = require("../../utils/preview-mode");

Page({
  data: {
    isLoggedIn: false,
    isAdmin: false,
    user: {
      avatarText: "游",
      name: "点击登录",
      status: "游客模式"
    },
    menuGroups: [
      {
        id: "core",
        items: [
          { title: "我的活动", badge: "", action: "activities", icon: "/assets/icons/msg-activity.svg", toneClass: "icon-activity" },
          { title: "我的帖子", badge: "", action: "posts", icon: "/assets/icons/profile-post.svg", toneClass: "icon-post" },
          { title: "我借出的", badge: "", action: "lend", icon: "/assets/icons/profile-lend.svg", toneClass: "icon-lend" },
          { title: "我借入的", badge: "", action: "borrow", icon: "/assets/icons/profile-borrow.svg", toneClass: "icon-borrow" }
        ]
      },
      {
        id: "other",
        items: [
          { title: "我的订单", badge: "", action: "orders", icon: "/assets/icons/profile-order.svg", toneClass: "icon-order" },
          { title: "我的收藏", badge: "", action: "favorites", icon: "/assets/icons/profile-fav.svg", toneClass: "icon-fav" },
          { title: "我的评论", badge: "", action: "comments", icon: "/assets/icons/msg-comment.svg", toneClass: "icon-comment" }
        ]
      },
      {
        id: "settings",
        items: [
          { title: "设置", badge: "", action: "settings", icon: "/assets/icons/profile-settings.svg", toneClass: "icon-settings" }
        ]
      }
    ],
    adminMenus: [
      { title: "公寓管理", type: "apartments", icon: "/assets/icons/admin-apartment.svg" },
      { title: "户型管理", type: "rooms", icon: "/assets/icons/admin-room.svg" },
      { title: "活动管理", type: "activities", icon: "/assets/icons/admin-activity.svg" },
      { title: "服务管理", type: "services", icon: "/assets/icons/admin-service.svg" },
      { title: "物品管理", type: "items", icon: "/assets/icons/admin-item.svg" },
      { title: "评论管理", type: "comments", icon: "/assets/icons/admin-comment.svg" },
      { title: "用户管理", type: "users", icon: "/assets/icons/admin-user.svg" }
    ],
    adminOpen: false,
    sheetOpen: false,
    sheetTitle: "",
    sheetSubtitle: "",
    sheetEmpty: "",
    records: [],
    loginModalVisible: false
  },

  onLoad() {
    this.syncUserState();
    this.syncBadges();
  },

  onShow() {
    this.syncUserState();
    this.syncBadges();
  },

  syncUserState() {
    const app = getApp();
    const { isLoggedIn, isAdmin, userInfo } = app.globalData;
    if (isLoggedIn && userInfo) {
      this.setData({
        isLoggedIn: true,
        isAdmin: isAdmin,
        user: {
          avatarText: userInfo.avatar_text || userInfo.nickname.charAt(0),
          name: userInfo.nickname,
          status: userInfo.room_label && userInfo.room_label !== "未入住"
            ? `已入住 · ${userInfo.apartment_name || userInfo.room_label}`
            : "未入住"
        }
      });
    } else {
      this.setData({
        isLoggedIn: false,
        isAdmin: false,
        user: {
          avatarText: "游",
          name: "点击登录",
          status: "游客模式"
        },
        adminOpen: false
      });
    }
  },

  syncBadges() {
    // 业务模块尚未开放，不展示来自 Mock 数据的数量徽标。
  },

  // 点击用户卡片
  openProfileEdit() {
    if (!this.data.isLoggedIn) {
      this.setData({ loginModalVisible: true });
      return;
    }
    wx.navigateTo({ url: "/pages/profile-edit/index" });
  },

  // 登录成功
  onLoginSuccess(e) {
    this.setData({ loginModalVisible: false });
    this.syncUserState();
    this.syncBadges();
    const { user, isNew } = e.detail;
    wx.showToast({
      title: isNew ? `欢迎加入${user.role === "admin" ? "（管理员）" : ""}` : `欢迎回来${user.role === "admin" ? "（管理员）" : ""}`,
      icon: "none"
    });
  },

  // 关闭登录弹窗
  onLoginCancel() {
    this.setData({ loginModalVisible: false });
  },

  toggleAdmin() {
    this.setData({ adminOpen: !this.data.adminOpen });
  },

  openMenu(e) {
    const action = e.currentTarget.dataset.action;
    if (action === "settings") {
      if (!this.data.isLoggedIn) {
        this.setData({ loginModalVisible: true });
        return;
      }
      wx.navigateTo({ url: "/pages/profile-edit/index" });
      return;
    }
    showPreviewNotice();
  },

  closeBusiness() {
    this.setData({ sheetOpen: false });
  },

  handleRecordAction(e) {
    showPreviewNotice();
  },

  openAdmin(e) {
    if (!this.data.isAdmin) {
      wx.showToast({ title: "仅管理员可访问", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: `/pages/admin/index?type=${e.currentTarget.dataset.type}`
    });
  }
});
