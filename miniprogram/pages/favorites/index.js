const { getFavoriteRecords } = require("../../data/queries");

Page({
  data: {
    activeTab: "apartment",
    tabs: [
      { value: "apartment", label: "收藏的公寓", count: 0 },
      { value: "room", label: "收藏的户型", count: 0 }
    ],
    apartments: [],
    rooms: [],
    list: []
  },

  onLoad() {
    const { apartments, rooms, tabs } = getFavoriteRecords();
    this.setData({ apartments, rooms, tabs }, () => this.applyTab());
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.value }, () => this.applyTab());
  },

  applyTab() {
    this.setData({
      list: this.data.activeTab === "apartment" ? this.data.apartments : this.data.rooms
    });
  },

  openFavorite(e) {
    const { id, aptId } = e.currentTarget.dataset;
    if (this.data.activeTab === "apartment") {
      wx.navigateTo({ url: `/pages/apartment-detail/index?id=${id}` });
      return;
    }
    wx.navigateTo({ url: `/pages/room-detail/index?aptId=${aptId}&roomId=${id}` });
  },

  goHome() {
    wx.switchTab({ url: "/pages/index/index" });
  }
});
