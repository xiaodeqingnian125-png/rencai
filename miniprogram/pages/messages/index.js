const business = require("../../data/business");
const { showPreviewNotice } = require("../../utils/preview-mode");

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
    messages: [],
    filteredMessages: [],
    hasUnread: true,
    showDetail: false,
    selectedMessage: null,
    detailActions: []
  },

  onLoad() {
    this.loadMessages();
  },

  onShow() {
    this.loadMessages();
  },

  loadMessages() {
    const messages = JSON.parse(JSON.stringify(business.messages));
    this.setData({
      messages,
      filteredMessages: this.getFilteredMessages(messages, this.data.activeType),
      hasUnread: messages.some((message) => message.unread)
    });
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
    if (action === "comments") {
      wx.navigateTo({ url: "/pages/my-comments/index" });
      return;
    }
    showPreviewNotice();
  },

  confirmService() {
    showPreviewNotice();
  },

  deleteCurrentMessage() {
    showPreviewNotice();
  }
});
