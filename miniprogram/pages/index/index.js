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
    apartments: [
      {
        id: 1,
        name: "郑东人才公寓",
        district: "郑东新区",
        priceMin: 1200,
        priceMax: 1800,
        rooms: "1-2居",
        location: "金水东路与东风南路交叉口",
        tags: [
          { label: "热门", className: "tag-hot" },
          { label: "近地铁", className: "tag-subway" }
        ],
        imageClass: "apt-img-1",
        favorite: false
      },
      {
        id: 2,
        name: "高新人才家园",
        district: "高新区",
        priceMin: 800,
        priceMax: 1200,
        rooms: "开间/1居",
        location: "科学大道与长椿路交叉口",
        tags: [{ label: "新上", className: "tag-new" }],
        imageClass: "apt-img-2",
        favorite: true
      },
      {
        id: 3,
        name: "经开青年公寓",
        district: "经开区",
        priceMin: 900,
        priceMax: 1400,
        rooms: "1-2居",
        location: "航海东路与经开第八大街",
        tags: [{ label: "近地铁", className: "tag-subway" }],
        imageClass: "apt-img-3",
        favorite: false
      },
      {
        id: 4,
        name: "港区人才社区",
        district: "航空港区",
        priceMin: 700,
        priceMax: 1000,
        rooms: "开间/1居",
        location: "华夏大道与迎宾路交叉口",
        tags: [],
        imageClass: "apt-img-4",
        favorite: false
      },
      {
        id: 5,
        name: "二七人才公寓",
        district: "二七区",
        priceMin: 1000,
        priceMax: 1500,
        rooms: "2-3居",
        location: "大学路与航海路交叉口",
        tags: [{ label: "热门", className: "tag-hot" }],
        imageClass: "apt-img-5",
        favorite: false
      },
      {
        id: 6,
        name: "中原青年社区",
        district: "中原区",
        priceMin: 850,
        priceMax: 1300,
        rooms: "1-2居",
        location: "建设路与秦岭路交叉口",
        tags: [
          { label: "新上", className: "tag-new" },
          { label: "近地铁", className: "tag-subway" }
        ],
        imageClass: "apt-img-6",
        favorite: false
      }
    ],
    filteredApartments: []
  },

  onLoad() {
    this.applyFilters();
  },

  onPullDownRefresh() {
    this.applyFilters();
    wx.stopPullDownRefresh();
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

    const filteredApartments = apartments.filter((apartment) => {
      const matchKeyword = !keyword || [
        apartment.name,
        apartment.district,
        apartment.location,
        apartment.rooms
      ].join(" ").toLowerCase().includes(keyword);
      const matchDistrict = activeDistrict === "全部区域" || apartment.district === activeDistrict;
      const matchPrice = apartment.priceMax >= priceRange.min && apartment.priceMin <= priceRange.max;
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
