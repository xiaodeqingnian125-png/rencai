const db = require("../../data/db");

const priceRanges = [
  { label: "全部价格", min: 0, max: 99999 },
  { label: "¥500以下", min: 0, max: 500 },
  { label: "¥500-1000", min: 500, max: 1000 },
  { label: "¥1000-1500", min: 1000, max: 1500 },
  { label: "¥1500-2000", min: 1500, max: 2000 },
  { label: "¥2000以上", min: 2000, max: 99999 }
];

Page({
  data: {
    searchValue: "",
    activeDistrict: "全部区域",
    activePrice: "全部价格",
    activeRoom: "全部",
    activeFilter: "",
    quickEntries: [
      {
        key: "roommate",
        title: "找个室友",
        icon: "/assets/icons/roommate.svg",
        tone: "roommate"
      },
      {
        key: "community",
        title: "加入社群",
        icon: "/assets/icons/community.svg",
        tone: "community"
      },
      {
        key: "map",
        title: "地图选房",
        icon: "/assets/icons/map.svg",
        tone: "map"
      },
      {
        key: "guide",
        title: "政策攻略",
        icon: "/assets/icons/guide.svg",
        tone: "guide"
      }
    ],
    districtOptions: ["全部区域", "郑东新区", "高新区", "经开区", "航空港区", "二七区", "中原区", "管城区", "金水区", "惠济区"],
    priceOptions: priceRanges.map((item) => item.label),
    roomOptions: ["全部", "一居室", "二居室", "三居室", "四居室"],
    apartments: [],
    filteredApartments: [],
    loading: true,
    error: "",
    empty: false
  },

  onLoad() {
    this._isAlive = true;
    this.loadApartments();
  },

  onShow() {
    // 仅在已加载过一次后才在 onShow 重新拉取，避免 onLoad + onShow 双重请求
    if (this._loadedOnce) {
      this.loadApartments();
    }
  },

  onUnload() {
    this._isAlive = false;
  },

  onPullDownRefresh() {
    this.loadApartments(() => {
      wx.stopPullDownRefresh();
    });
  },

  loadApartments(callback) {
    this.setData({ loading: true, error: "" });
    // 首页加载第一页，pageSize 100 覆盖当前 6 条数据
    db.getApartmentList({ page: 1, pageSize: 100 }).then((res) => {
      if (!this._isAlive) {
        if (typeof callback === "function") callback();
        return;
      }
      if (!res || !res.ok) {
        const message = (res && res.message) || "加载公寓失败";
        console.error("[index] loadApartments failed:", res);
        this.setData({
          loading: false,
          error: message,
          apartments: [],
          filteredApartments: [],
          empty: false
        });
        if (typeof callback === "function") callback();
        return;
      }
      // 兼容分页结构：res.data 是当前页数组，res.hasMore 标识是否有更多
      const apartments = Array.isArray(res.data) ? res.data : [];
      this._paging = {
        page: res.page || 1,
        pageSize: res.pageSize || 20,
        hasMore: !!res.hasMore
      };
      // 首页卡片字段适配：云函数返回的 cards 已含 location / rooms 字段，但缺少 favorite
      // favorite 状态由用户登录态决定，游客默认 false
      const normalized = apartments.map((item) => ({
        ...item,
        favorite: !!item.favorite
      }));
      this._loadedOnce = true;
      this.setData({
        loading: false,
        error: "",
        apartments: normalized,
        empty: normalized.length === 0
      }, () => {
        this.applyFilters();
        if (typeof callback === "function") callback();
      });
    }).catch((err) => {
      console.error("[index] loadApartments exception:", err);
      if (!this._isAlive) {
        // 页面已卸载，仍需停止下拉刷新（避免卡住），但不再 setData
        if (typeof callback === "function") callback();
        return;
      }
      this.setData({
        loading: false,
        error: "网络异常，请稍后重试",
        apartments: [],
        filteredApartments: [],
        empty: false
      });
      if (typeof callback === "function") callback();
    });
  },

  retryLoad() {
    this.loadApartments();
  },

  handleSearchInput(e) {
    this.setData({ searchValue: e.detail.value }, () => {
      this.applyFilters();
    });
  },

  clearSearch() {
    this.setData({ searchValue: "" }, () => {
      this.applyFilters();
    });
  },

  toggleFilter(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeFilter: this.data.activeFilter === key ? "" : key });
  },

  closeFilter() {
    this.setData({ activeFilter: "" });
  },

  selectDistrict(e) {
    this.setData({ activeDistrict: e.currentTarget.dataset.value, activeFilter: "" }, () => {
      this.applyFilters();
    });
  },

  selectPrice(e) {
    this.setData({ activePrice: e.currentTarget.dataset.value, activeFilter: "" }, () => {
      this.applyFilters();
    });
  },

  selectRoom(e) {
    this.setData({ activeRoom: e.currentTarget.dataset.value, activeFilter: "" }, () => {
      this.applyFilters();
    });
  },

  resetFilters() {
    this.setData({
      searchValue: "",
      activeDistrict: "全部区域",
      activePrice: "全部价格",
      activeRoom: "全部",
      activeFilter: ""
    }, () => {
      this.applyFilters();
    });
  },

  applyFilters() {
    const { apartments, activeDistrict, activePrice, activeRoom, searchValue } = this.data;
    const priceRange = priceRanges.find((item) => item.label === activePrice) || priceRanges[0];
    const keyword = searchValue.trim().toLowerCase();
    const roomNumberMap = {
      "一居室": 1,
      "二居室": 2,
      "三居室": 3,
      "四居室": 4
    };

    const isAllPrice = activePrice === "全部价格";
    const filteredApartments = apartments.filter((apartment) => {
      const matchKeyword = !keyword || [
        apartment.name,
        apartment.district,
        apartment.location,
        apartment.rooms
      ].join(" ").toLowerCase().includes(keyword);
      const matchDistrict = activeDistrict === "全部区域" || apartment.district === activeDistrict;
      // 价格筛选防御：强制转 number，无效值按 0 处理
      // "全部价格"时即使价格异常也保留记录（不因单条异常导致全列表消失）
      // 选择具体价格区间时，价格无效（0）的记录不参与匹配
      const aptPriceMin = Number(apartment.priceMin) || 0;
      const aptPriceMax = Number(apartment.priceMax) || 0;
      let matchPrice;
      if (isAllPrice) {
        matchPrice = true;
      } else {
        // 价格无效的记录在具体区间筛选时不参与匹配
        if (aptPriceMax <= 0 && aptPriceMin <= 0) {
          matchPrice = false;
        } else {
          matchPrice = aptPriceMax >= priceRange.min && aptPriceMin <= priceRange.max;
        }
      }
      const targetRoom = roomNumberMap[activeRoom];
      const matchRoom = !targetRoom || this.matchRoom(apartment.rooms, targetRoom);
      return matchKeyword && matchDistrict && matchPrice && matchRoom;
    });

    this.setData({ filteredApartments });
  },

  matchRoom(roomText, targetRoom) {
    const numbers = roomText.match(/\d+/g) || [];
    if (!numbers.length) {
      return targetRoom === 1 && roomText.indexOf("开间") >= 0;
    }
    if (numbers.length === 1) {
      return Number(numbers[0]) === targetRoom;
    }
    return targetRoom >= Number(numbers[0]) && targetRoom <= Number(numbers[1]);
  },

  toggleFavorite(e) {
    const id = Number(e.currentTarget.dataset.id);
    const apartments = this.data.apartments.map((item) => {
      if (item.id !== id) return item;
      return { ...item, favorite: !item.favorite };
    });
    this.setData({ apartments }, () => {
      this.applyFilters();
    });
  },

  handleQuickEntry(e) {
    const routeMap = {
      roommate: "/pages/roommate/index",
      community: "/pages/community/index",
      map: "/pages/map/index",
      guide: "/pages/guide/index"
    };
    const url = routeMap[e.currentTarget.dataset.key];
    if (url) {
      wx.navigateTo({ url });
    }
  },

  handleApartmentTap(e) {
    wx.navigateTo({
      url: `/pages/apartment-detail/index?id=${e.currentTarget.dataset.id}`
    });
  }
});
