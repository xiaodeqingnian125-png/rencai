const businessConfig = {
  activities: {
    title: "我的活动",
    subtitle: "报名、发起和候补活动的最新进展",
    empty: "暂无活动记录，去服务页看看最近的青年活动。",
    items: [
      {
        title: "周末桌游局",
        status: "已报名",
        toneClass: "ok",
        meta: ["时间：周六 19:30", "地点：郑东人才公寓共享客厅", "报名码：HD-2606-02"],
        actions: [
          { label: "查看活动", action: "service", primary: true },
          { label: "取消报名", action: "cancelActivity", primary: false }
        ]
      },
      {
        title: "夏日夜跑搭子",
        status: "候补中",
        toneClass: "warn",
        meta: ["时间：周日 20:00", "集合：北门广场", "当前候补：第 3 位"],
        actions: [
          { label: "查看活动", action: "service", primary: true },
          { label: "提醒我", action: "remind", primary: false }
        ]
      }
    ]
  },
  posts: {
    title: "我的帖子",
    subtitle: "找室友发布记录和联系状态",
    empty: "还没有发布找室友帖子。",
    items: [
      {
        title: "郑东人才公寓 · 主卧找室友",
        status: "展示中",
        toneClass: "ok",
        meta: ["类型：有房找室友", "预算：1200-1500 元/月", "最近联系：2 人咨询"],
        actions: [
          { label: "查看帖子", action: "roommate", primary: true },
          { label: "下架帖子", action: "closePost", primary: false }
        ]
      }
    ]
  },
  lend: {
    title: "我借出的",
    subtitle: "别人向你借用的物品与归还状态",
    empty: "暂无借出记录。",
    items: [
      {
        title: "电钻工具箱",
        status: "借出中",
        toneClass: "warn",
        meta: ["借用人：林同学", "借用时间：今天 18:00-20:00", "归还点：3 号楼大厅"],
        actions: [
          { label: "联系借用人", action: "contact", primary: true },
          { label: "确认归还", action: "finishLend", primary: false }
        ]
      },
      {
        title: "折叠梯",
        status: "待确认",
        toneClass: "muted",
        meta: ["申请人：陈同学", "申请时间：明天 10:00-11:30", "留言：装窗帘用一下"],
        actions: [
          { label: "同意借出", action: "approveLend", primary: true },
          { label: "拒绝", action: "reject", primary: false }
        ]
      }
    ]
  },
  borrow: {
    title: "我借入的",
    subtitle: "你的借用申请、领取和归还记录",
    empty: "暂无借入记录，去借个锤子看看可借物品。",
    items: [
      {
        title: "手持熨斗",
        status: "待领取",
        toneClass: "warn",
        meta: ["物主：阿泽", "预约：今天 21:00", "领取点：2 号楼前台"],
        actions: [
          { label: "查看物品", action: "borrowPage", primary: true },
          { label: "联系物主", action: "contact", primary: false }
        ]
      }
    ]
  },
  orders: {
    title: "我的订单",
    subtitle: "代办服务订单和处理进度",
    empty: "暂无服务订单。",
    items: [
      {
        title: "快递代取 · 中通 3 件",
        status: "处理中",
        toneClass: "warn",
        meta: ["订单号：DD-260630-018", "取件点：菜鸟驿站东门店", "预计送达：30 分钟内"],
        actions: [
          { label: "查看订单", action: "service", primary: true },
          { label: "联系客服", action: "contact", primary: false }
        ]
      },
      {
        title: "维修预约 · 水龙头漏水",
        status: "已完成",
        toneClass: "muted",
        meta: ["订单号：DD-260629-006", "处理人：物业维修王师傅", "完成时间：昨天 16:20"],
        actions: [
          { label: "再次下单", action: "service", primary: true },
          { label: "评价服务", action: "comment", primary: false }
        ]
      }
    ]
  }
};

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
    const messageMap = {
      settings: "设置下一步接入"
    };
    wx.showToast({
      title: messageMap[action] || "功能下一步接入",
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
