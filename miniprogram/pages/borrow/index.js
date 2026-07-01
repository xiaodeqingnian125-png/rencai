const { borrowCategories, getBorrowItems } = require("../../data/business");

Page({
  data: {
    searchValue: "",
    activeCategory: "all",
    categories: borrowCategories,
    items: [],
    filteredItems: []
  },

  onLoad() {
    this.setData({ items: getBorrowItems() });
    this.applyFilters();
  },

  handleSearchInput(e) {
    this.setData({ searchValue: e.detail.value }, () => {
      this.applyFilters();
    });
  },

  selectCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.value }, () => {
      this.applyFilters();
    });
  },

  applyFilters() {
    const { activeCategory, items, searchValue } = this.data;
    const keyword = searchValue.trim().toLowerCase();
    const filteredItems = items.filter((item) => {
      const matchCategory = activeCategory === "all" || item.category === activeCategory;
      const haystack = [item.name, item.desc, item.rules, item.location, item.categoryLabel].join(" ").toLowerCase();
      return matchCategory && (!keyword || haystack.indexOf(keyword) !== -1);
    });
    this.setData({ filteredItems });
  },

  goItemDetail(e) {
    wx.navigateTo({ url: `/pages/item-detail/index?id=${e.currentTarget.dataset.id}` });
  },

  goItemPublish() {
    wx.navigateTo({ url: "/pages/item-publish/index" });
  }
});
