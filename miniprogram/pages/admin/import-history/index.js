const db = require("../../../data/db");

Page({
  data: {
    targetType: "apartments",
    tasks: [],
    statusText: {
      pending: "待处理",
      previewing: "待确认",
      processing: "处理中",
      completed: "已完成",
      partial_failed: "部分失败",
      failed: "失败"
    }
  },

  onLoad() {
    this.loadTasks();
  },

  onShow() {
    this.loadTasks();
  },

  async loadTasks() {
    wx.showLoading({ title: "加载中" });
    try {
      const res = await db.listImportTasks(this.data.targetType, 1, 50);
      if (res.ok) {
        this.setData({ tasks: res.tasks || [] });
      }
    } catch (err) {
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ targetType: type });
    this.loadTasks();
  },

  viewTask(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/import-preview/index?taskId=${id}`
    });
  }
});
