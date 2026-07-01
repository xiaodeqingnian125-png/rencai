const { messages: baseMessages } = require("../../data/business");

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
    messages: JSON.parse(JSON.stringify(baseMessages)),
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
      const url = this.data.selectedMessage && this.data.selectedMessage.type === "service"
        ? "/pages/service-list/index"
        : "/pages/activity-list/index";
      wx.navigateTo({ url });
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
      comments: "已打开我的评论",
      reply: "已打开回复入口"
    };
    if (action === "comments") {
      wx.navigateTo({ url: "/pages/my-comments/index" });
      return;
    }
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
