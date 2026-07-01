const { profileRecords: businessConfig } = require("../../data/business");

Page({
  data: {
    adminOpen: false,
    user: {
      avatarText: "小",
      name: "晓得青年",
      status: "已入住 · 郑东人才公寓"
    },
    menuGroups: [
      {
        id: "core",
        items: [
          { title: "我的活动", badge: "2", action: "activities", icon: "/assets/icons/msg-activity.svg", toneClass: "icon-activity" },
          { title: "我的帖子", badge: "1", action: "posts", icon: "/assets/icons/profile-post.svg", toneClass: "icon-post" },
          { title: "我借出的", badge: "", action: "lend", icon: "/assets/icons/profile-lend.svg", toneClass: "icon-lend" },
          { title: "我借入的", badge: "", action: "borrow", icon: "/assets/icons/profile-borrow.svg", toneClass: "icon-borrow" }
        ]
      },
      {
        id: "other",
        items: [
          { title: "我的订单", badge: "", action: "orders", icon: "/assets/icons/profile-order.svg", toneClass: "icon-order" },
          { title: "我的收藏", badge: "3", action: "favorites", icon: "/assets/icons/profile-fav.svg", toneClass: "icon-fav" },
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
    sheetOpen: false,
    sheetTitle: "",
    sheetSubtitle: "",
    sheetEmpty: "",
    records: []
  },

  toggleAdmin() {
    this.setData({ adminOpen: !this.data.adminOpen });
  },

  openProfileEdit() {
    wx.navigateTo({ url: "/pages/profile-edit/index" });
  },

  openMenu(e) {
    const action = e.currentTarget.dataset.action;
    const config = businessConfig[action];
    if (config) {
      this.setData({
        sheetOpen: true,
        sheetTitle: config.title,
        sheetSubtitle: config.subtitle,
        sheetEmpty: config.empty,
        records: config.items || []
      });
      return;
    }
    if (action === "favorites") {
      wx.navigateTo({ url: "/pages/favorites/index" });
      return;
    }
    if (action === "comments") {
      wx.navigateTo({ url: "/pages/my-comments/index" });
      return;
    }
    if (action === "settings") {
      wx.navigateTo({ url: "/pages/profile-edit/index" });
      return;
    }
    const messageMap = {};
    wx.showToast({
      title: messageMap[action] || "静态版暂不可用",
      icon: "none"
    });
  },

  closeBusiness() {
    this.setData({ sheetOpen: false });
  },

  handleRecordAction(e) {
    const action = e.currentTarget.dataset.action;
    if (action === "service") {
      wx.switchTab({ url: "/pages/service/index" });
      return;
    }
    if (action === "borrowPage") {
      wx.switchTab({ url: "/pages/borrow/index" });
      return;
    }
    if (action === "roommate") {
      wx.navigateTo({ url: "/pages/roommate/index" });
      return;
    }
    if (action === "comment") {
      wx.navigateTo({ url: "/pages/my-comments/index" });
      return;
    }
    const messageMap = {
      cancelActivity: "已提交取消报名",
      remind: "已开启候补提醒",
      closePost: "帖子已下架",
      contact: "已为你打开联系入口",
      finishLend: "已确认归还",
      approveLend: "已同意借出",
      reject: "已拒绝申请"
    };
    wx.showToast({
      title: messageMap[action] || "操作已提交",
      icon: "none"
    });
  },

  openAdmin(e) {
    wx.navigateTo({
      url: `/pages/admin/index?type=${e.currentTarget.dataset.type}`
    });
  }
});
