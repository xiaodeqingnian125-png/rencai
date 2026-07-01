const { getActivities, getServices } = require("../../data/business");

Page({
  data: {
    activities: [],
    services: []
  },

  onLoad() {
    this.setData({
      activities: getActivities().slice(0, 3),
      services: getServices().slice(0, 3)
    });
  },

  goActivityList() {
    wx.navigateTo({ url: "/pages/activity-list/index" });
  },

  goActivityDetail(e) {
    wx.navigateTo({ url: `/pages/activity-detail/index?id=${e.currentTarget.dataset.id}` });
  },

  goActivityPublish() {
    wx.navigateTo({ url: "/pages/activity-publish/index" });
  },

  goServiceList() {
    wx.navigateTo({ url: "/pages/service-list/index" });
  },

  goServiceDetail(e) {
    wx.navigateTo({ url: `/pages/service-detail/index?id=${e.currentTarget.dataset.id}` });
  }
});
