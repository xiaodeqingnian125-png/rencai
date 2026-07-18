const db = require("../../../data/db");

Page({
  data: {
    taskId: "",
    task: {},
    previewData: [],
    importing: false
  },

  onLoad(options) {
    if (options.taskId) {
      this.setData({ taskId: options.taskId });
      this.loadTask();
    }
  },

  async loadTask() {
    wx.showLoading({ title: "加载中" });
    try {
      const res = await db.getImportTask(this.data.taskId);
      if (res.ok) {
        this.setData({
          task: res.task,
          previewData: (res.task.preview_data || []).slice(0, 20)
        });
      } else {
        wx.showToast({ title: res.error || "加载失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  async confirmImport() {
    if (this.data.importing) return;
    this.setData({ importing: true });

    wx.showLoading({ title: "导入中" });
    try {
      const res = await db.confirmImport(this.data.taskId);
      if (res.ok) {
        wx.showToast({
          title: `成功${res.successCount}条`,
          icon: "success"
        });
        this.loadTask();
      } else {
        wx.showToast({ title: res.error || "导入失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "导入失败", icon: "none" });
    } finally {
      this.setData({ importing: false });
      wx.hideLoading();
    }
  },

  cancel() {
    wx.navigateBack();
  }
});
