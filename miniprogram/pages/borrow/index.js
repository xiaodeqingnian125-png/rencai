Page({
  data: {
    searchValue: "",
    activeCategory: "all",
    categories: [
      { label: "全部", value: "all" },
      { label: "工具", value: "tool" },
      { label: "户外", value: "outdoor" },
      { label: "小家电", value: "appliance" },
      { label: "其他", value: "other" }
    ],
    items: [
      {
        id: 1,
        name: "锤子",
        category: "tool",
        categoryLabel: "工具",
        thumbClass: "thumb-tool",
        desc: "家用手锤，木柄铁头，适合钉钉子、组装家具",
        rules: "借用2天内归还 · 需自取",
        location: "郑东人才公寓·3号楼",
        status: "available",
        statusLabel: "可借用",
        statusClass: "available"
      },
      {
        id: 2,
        name: "螺丝刀套装",
        category: "tool",
        categoryLabel: "工具",
        thumbClass: "thumb-tool",
        desc: "多功能螺丝刀，一字+十字+六角，带磁吸头",
        rules: "借用3天内归还",
        location: "高新人才家园·1号楼",
        status: "available",
        statusLabel: "可借用",
        statusClass: "available"
      },
      {
        id: 3,
        name: "露营帐篷",
        category: "outdoor",
        categoryLabel: "户外",
        thumbClass: "thumb-outdoor",
        desc: "双人帐篷，防风防雨，适合周边郊游",
        rules: "周五借下周一还 · 押金¥100",
        location: "郑东人才公寓·5号楼",
        status: "borrowed",
        statusLabel: "借用中",
        statusClass: "borrowed"
      },
      {
        id: 4,
        name: "电钻",
        category: "tool",
        categoryLabel: "工具",
        thumbClass: "thumb-tool",
        desc: "冲击电钻，带6/8/10mm钻头，适合墙面打孔",
        rules: "借用1天内归还 · 需自取",
        location: "经开青年公寓·2号楼",
        status: "available",
        statusLabel: "可借用",
        statusClass: "available"
      },
      {
        id: 5,
        name: "电磁炉",
        category: "appliance",
        categoryLabel: "小家电",
        thumbClass: "thumb-appliance",
        desc: "美的电磁炉，9档火力，适合火锅/炒菜",
        rules: "借用1天内归还 · 需自取",
        location: "二七人才公寓·4号楼",
        status: "borrowed",
        statusLabel: "借用中",
        statusClass: "borrowed"
      },
      {
        id: 6,
        name: "折叠椅",
        category: "outdoor",
        categoryLabel: "户外",
        thumbClass: "thumb-outdoor",
        desc: "铝合金折叠椅2把，轻便好拿",
        rules: "借用3天内归还",
        location: "中原青年社区·1号楼",
        status: "available",
        statusLabel: "可借用",
        statusClass: "available"
      }
    ],
    filteredItems: []
  },

  onLoad() {
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

  showStaticTip(e) {
    const name = e.currentTarget.dataset.name || "借用流程";
    wx.showToast({
      title: `${name}下一步接入`,
      icon: "none"
    });
  }
});
