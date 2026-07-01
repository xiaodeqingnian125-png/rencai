const { getActivities } = require("../../data/business");

Page({
  data: {
    activeType: "all",
    tabs: [
      { value: "all", label: "全部" },
      { value: "open", label: "报名中" },
      { value: "official", label: "官方活动" },
      { value: "user", label: "用户活动" }
    ],
    activities: [],
    visibleActivities: []
  },

  onLoad() {
    this.loadActivities();
  },

  onPullDownRefresh() {
    this.loadActivities();
    wx.stopPullDownRefresh();
  },

  loadActivities() {
    this.setData({ activities: getActivities() }, () => this.applyFilter());
  },

  selectType(e) {
    this.setData({ activeType: e.currentTarget.dataset.value }, () => this.applyFilter());
  },

  applyFilter() {
    const { activeType, activities } = this.data;
    const visibleActivities = activities.filter((activity) => {
      if (activeType === "open") return !activity.full;
      if (activeType === "official" || activeType === "user") return activity.type === activeType;
      return true;
    });
    this.setData({ visibleActivities });
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/activity-detail/index?id=${e.currentTarget.dataset.id}` });
  },

  goPublish() {
    wx.navigateTo({ url: "/pages/activity-publish/index" });
  }
});
