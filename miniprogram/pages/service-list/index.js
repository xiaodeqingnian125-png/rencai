const { getServices } = require("../../data/business");

Page({
  data: {
    searchValue: "",
    services: [],
    visibleServices: []
  },

  onLoad() {
    this.setData({ services: getServices() }, () => this.applyFilter());
  },

  handleSearch(e) {
    this.setData({ searchValue: e.detail.value }, () => this.applyFilter());
  },

  clearSearch() {
    this.setData({ searchValue: "" }, () => this.applyFilter());
  },

  applyFilter() {
    const keyword = this.data.searchValue.trim().toLowerCase();
    const visibleServices = this.data.services.filter((service) => {
      const haystack = [service.name, service.desc, service.category, service.scope].join(" ").toLowerCase();
      return !keyword || haystack.indexOf(keyword) !== -1;
    });
    this.setData({ visibleServices });
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/service-detail/index?id=${e.currentTarget.dataset.id}` });
  }
});
