const typeLabels = {
  activity: "活动",
  borrow: "借用",
  service: "服务",
  comment: "评论",
  system: "系统"
};

Page({
  data: {
    activeType: "all",
    tabs: [
      { value: "all", label: "全部" },
      { value: "activity", label: "活动" },
      { value: "borrow", label: "借用" },
      { value: "service", label: "服务" },
      { value: "comment", label: "评论" }
    ],
    messages: [
      {
        id: 1,
        type: "activity",
        typeLabel: "活动",
        icon: "/assets/icons/msg-activity.svg",
        toneClass: "tone-activity",
        title: "活动提醒",
        preview: "你报名的「郑东公寓周末集市」将于明天14:00开始",
        detail: "你报名的「郑东公寓周末集市」将于明天14:00在郑东人才公寓中心花园开始。建议提前10分钟到场，现场可领取摊位指引和活动贴纸。",
        time: "10分钟前",
        unread: true,
        status: "待开始"
      },
      {
        id: 2,
        type: "borrow",
        typeLabel: "借用",
        icon: "/assets/icons/msg-borrow.svg",
        toneClass: "tone-borrow",
        title: "借用申请已确认",
        preview: "小李已确认你借用「电钻」的申请，取件位置：3号楼502",
        detail: "小李已确认你借用「电钻」的申请。取件位置：3号楼502；建议今日19:00-21:00之间取件，归还前请确认电池和钻头配件齐全。",
        time: "1小时前",
        unread: true,
        status: "待取件"
      },
      {
        id: 3,
        type: "service",
        typeLabel: "服务",
        icon: "/assets/icons/msg-service.svg",
        toneClass: "tone-service",
        title: "订单已支付",
        preview: "你已成功支付「代办入住手续」¥50.00，客服将在1个工作日内联系你",
        detail: "你已成功支付「代办入住手续」¥50.00。客服将在1个工作日内联系你确认材料清单，如需补充身份证明或租赁材料，会通过消息继续提醒。",
        time: "2小时前",
        unread: false,
        status: "处理中"
      },
      {
        id: 4,
        type: "activity",
        typeLabel: "活动",
        icon: "/assets/icons/msg-activity.svg",
        toneClass: "tone-activity",
        title: "活动取消通知",
        preview: "原定于7月20日的「人才公寓篮球友谊赛」因场地原因取消",
        detail: "原定于7月20日的「人才公寓篮球友谊赛」因场地维护取消。报名名额会自动释放，后续重启时间将在活动页同步。",
        time: "昨天",
        unread: true,
        status: "已取消"
      },
      {
        id: 5,
        type: "borrow",
        typeLabel: "借用",
        icon: "/assets/icons/msg-borrow.svg",
        toneClass: "tone-borrow",
        title: "借用即将到期",
        preview: "你借用的「露营帐篷」还剩1天到期，请及时归还",
        detail: "你借用的「露营帐篷」还剩1天到期，请在明日20:00前归还至2号楼前台。若需要延长借用时间，请先联系物主确认。",
        time: "昨天",
        unread: false,
        status: "待归还"
      },
      {
        id: 6,
        type: "service",
        typeLabel: "服务",
        icon: "/assets/icons/msg-service.svg",
        toneClass: "tone-service",
        title: "服务完成",
        preview: "你的「代取快递」订单已完成，请确认收货",
        detail: "你的「代取快递」订单已完成，快递已放置在5号楼一层临时寄存柜。请确认收货，如有遗漏可联系服务人员补充处理。",
        time: "7月1日",
        unread: false,
        status: "待确认"
      },
      {
        id: 7,
        type: "comment",
        typeLabel: "评论",
        icon: "/assets/icons/msg-comment.svg",
        toneClass: "tone-comment",
        title: "评价收到回复",
        preview: "郑东人才公寓管家回复了你的户型评价",
        detail: "郑东人才公寓管家回复了你对「精致一居室」的评价：感谢反馈，厨房收纳架本周会补充安装，欢迎入住后继续提出建议。",
        time: "7月1日",
        unread: false,
        status: "已回复"
      },
      {
        id: 8,
        type: "system",
        typeLabel: "系统",
        icon: "/assets/icons/msg-system.svg",
        toneClass: "tone-system",
        title: "系统通知",
        preview: "欢迎加入晓得青年！开始探索你的理想公寓吧",
        detail: "欢迎加入晓得青年。你可以在首页查看人才公寓，在服务页报名活动和提交代办需求，也可以通过借个锤子共享闲置工具。",
        time: "7月1日",
        unread: false,
        status: "已送达"
      }
    ],
    filteredMessages: [],
    hasUnread: true,
    showDetail: false,
    selectedMessage: null,
    detailActions: []
  },

  onLoad() {
    this.applyType();
  },

  selectType(e) {
    const activeType = e.currentTarget.dataset.value;
    this.setData({ activeType }, () => {
      this.applyType();
    });
  },

  applyType() {
    const { activeType, messages } = this.data;
    this.setData({
      filteredMessages: this.getFilteredMessages(messages, activeType),
      hasUnread: messages.some((message) => message.unread)
    });
  },

  getFilteredMessages(messages, activeType) {
    if (activeType === "all") {
      return messages;
    }
    return messages.filter((message) => message.type === activeType);
  },

  openMessage(e) {
    const id = Number(e.currentTarget.dataset.id);
    const messages = this.data.messages.map((message) => (
      message.id === id ? { ...message, unread: false } : message
    ));
    const selectedMessage = messages.find((message) => message.id === id);
    if (!selectedMessage) {
      return;
    }
    this.setData({
      messages,
      filteredMessages: this.getFilteredMessages(messages, this.data.activeType),
      hasUnread: messages.some((message) => message.unread),
      selectedMessage,
      detailActions: this.getDetailActions(selectedMessage),
      showDetail: true
    });
  },

  closeDetail() {
    this.setData({ showDetail: false });
  },

  getDetailActions(message) {
    if (message.type === "activity") {
      return [
        { label: "查看活动", action: "service", primary: true },
        { label: message.status === "已取消" ? "知道了" : "加入提醒", action: "remind", primary: false },
        { label: "删除消息", action: "delete", primary: false }
      ];
    }
    if (message.type === "borrow") {
      return [
        { label: "查看借用", action: "borrow", primary: true },
        { label: message.status === "待归还" ? "联系物主" : "联系对方", action: "contact", primary: false },
        { label: "删除消息", action: "delete", primary: false }
      ];
    }
    if (message.type === "service") {
      return [
        { label: "查看订单", action: "service", primary: true },
        { label: message.status === "待确认" ? "确认完成" : "联系客服", action: message.status === "待确认" ? "confirmService" : "contact", primary: false },
        { label: "删除消息", action: "delete", primary: false }
      ];
    }
    if (message.type === "comment") {
      return [
        { label: "查看评论", action: "comments", primary: true },
        { label: "回复管家", action: "reply", primary: false },
        { label: "删除消息", action: "delete", primary: false }
      ];
    }
    return [
      { label: "去首页看看", action: "home", primary: true },
      { label: "删除消息", action: "delete", primary: false }
    ];
  },

  handleDetailAction(e) {
    const action = e.currentTarget.dataset.action;
    if (action === "home") {
      wx.switchTab({ url: "/pages/index/index" });
      return;
    }
    if (action === "service") {
      wx.switchTab({ url: "/pages/service/index" });
      return;
    }
    if (action === "borrow") {
      wx.switchTab({ url: "/pages/borrow/index" });
      return;
    }
    if (action === "delete") {
      this.deleteCurrentMessage();
      return;
    }
    if (action === "confirmService") {
      this.confirmService();
      return;
    }
    const messageMap = {
      remind: "已加入提醒",
      contact: "已为你打开联系入口",
      comments: "我的评论下一步接入",
      reply: "已打开回复入口"
    };
    this.setData({ showDetail: false });
    wx.showToast({
      title: messageMap[action] || "操作已提交",
      icon: "none"
    });
  },

  confirmService() {
    const selected = this.data.selectedMessage;
    if (!selected) {
      return;
    }
    const messages = this.data.messages.map((message) => {
      if (message.id !== selected.id) {
        return message;
      }
      return {
        ...message,
        title: "服务已确认完成",
        preview: "你已确认「代取快递」订单完成，感谢你的反馈",
        detail: "你已确认「代取快递」订单完成。若后续还有代办需求，可在服务页继续提交。",
        status: "已完成"
      };
    });
    this.setData({
      messages,
      filteredMessages: this.getFilteredMessages(messages, this.data.activeType),
      selectedMessage: null,
      showDetail: false
    });
    wx.showToast({ title: "已确认完成", icon: "none" });
  },

  deleteCurrentMessage() {
    const selected = this.data.selectedMessage;
    if (!selected) {
      return;
    }
    const messages = this.data.messages.filter((message) => message.id !== selected.id);
    this.setData({
      messages,
      filteredMessages: this.getFilteredMessages(messages, this.data.activeType),
      hasUnread: messages.some((message) => message.unread),
      selectedMessage: null,
      showDetail: false
    });
    wx.showToast({ title: "消息已删除", icon: "none" });
  }
});
