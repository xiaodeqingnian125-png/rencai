const { getRoommateData, createRoommatePostForUser } = require("../../data/queries");

const priceOptions = [
  { label: "全部价格", min: 0, max: 999999 },
  { label: "¥800以下", min: 0, max: 800 },
  { label: "¥800-1000", min: 800, max: 1000 },
  { label: "¥1000-1500", min: 1000, max: 1500 },
  { label: "¥1500以上", min: 1500, max: 999999 }
];

const districtOptions = ["全部区域", "郑东新区", "高新区", "经开区", "二七区", "中原区"].map((label) => ({ label }));
const roomOptions = ["全部居室", "一居室", "两居/合租", "整租"].map((label) => ({ label }));

function parseBudgetRange(budgetText) {
  const nums = String(budgetText).match(/\d+/g) || [];
  if (!nums.length) return { min: 0, max: 999999 };
  if (nums.length === 1) {
    const value = Number(nums[0]);
    return { min: value, max: value };
  }
  return { min: Number(nums[0]), max: Number(nums[1]) };
}

function priceIntersects(budgetText, option) {
  const budget = parseBudgetRange(budgetText);
  return budget.max >= option.min && budget.min <= option.max;
}

function roomMatches(roomText, activeRoom) {
  if (activeRoom === "全部居室") return true;
  if (activeRoom === "一居室") {
    return /1居|一居|单间/.test(roomText);
  }
  if (activeRoom === "两居/合租") {
    return /2居|两居|合租|次卧/.test(roomText);
  }
  if (activeRoom === "整租") {
    return /整租/.test(roomText);
  }
  return true;
}

Page({
  data: {
    activeType: "has_room",
    activeFilter: "",
    activeDistrict: "全部区域",
    activePrice: "全部价格",
    activeRoom: "全部居室",
    tabs: [
      { value: "has_room", label: "有房找室友", count: 0 },
      { value: "need_room", label: "无房找合租", count: 0 }
    ],
    districtOptions,
    priceOptions,
    roomOptions,
    posts: [],
    reviewQueue: [],
    filteredPosts: [],
    detailSheetOpen: false,
    selectedPost: null,
    postSheetOpen: false,
    publishMode: "has_room",
    form: {
      name: "",
      gender: "女",
      age: "",
      apartment: "",
      rooms: "",
      district: "",
      budget: "",
      moveIn: "",
      desc: "",
      contact: "",
      confirmed: false
    },
    loginModalVisible: false
  },

  onLoad() {
    const { posts, reviewQueue } = getRoommateData();
    this.setData({ posts, reviewQueue }, () => this.applyFilter());
  },

  noop() {},

  switchType(e) {
    this.setData({
      activeType: e.currentTarget.dataset.value,
      activeFilter: "",
      detailSheetOpen: false
    }, () => this.applyFilter());
  },

  applyFilter() {
    const { activeType, posts, activeDistrict, activePrice, activeRoom } = this.data;
    const selectedPrice = priceOptions.find((option) => option.label === activePrice) || priceOptions[0];
    const tabs = this.data.tabs.map((tab) => {
      return { ...tab, count: posts.filter((post) => post.type === tab.value).length };
    });
    const filteredPosts = posts.filter((post) => {
      const matchType = post.type === activeType;
      const matchDistrict = activeDistrict === "全部区域" || post.district.indexOf(activeDistrict) >= 0;
      const matchPrice = priceIntersects(post.budget, selectedPrice);
      const matchRoom = roomMatches(post.rooms, activeRoom);
      return matchType && matchDistrict && matchPrice && matchRoom;
    });
    this.setData({
      tabs,
      filteredPosts
    });
  },

  toggleFilter(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeFilter: this.data.activeFilter === key ? "" : key });
  },

  selectDistrict(e) {
    this.setData({
      activeDistrict: e.currentTarget.dataset.value,
      activeFilter: ""
    }, () => this.applyFilter());
  },

  selectPrice(e) {
    this.setData({
      activePrice: e.currentTarget.dataset.value,
      activeFilter: ""
    }, () => this.applyFilter());
  },

  selectRoom(e) {
    this.setData({
      activeRoom: e.currentTarget.dataset.value,
      activeFilter: ""
    }, () => this.applyFilter());
  },

  openPostSheet() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      this.setData({ loginModalVisible: true });
      return;
    }
    this.setData({ postSheetOpen: true, detailSheetOpen: false });
  },

  ensureLogin() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      this.setData({ loginModalVisible: true });
      return false;
    }
    return true;
  },

  onLoginSuccess() {
    this.setData({ loginModalVisible: false });
  },

  onLoginCancel() {
    this.setData({ loginModalVisible: false });
  },

  closePostSheet() {
    this.setData({ postSheetOpen: false });
  },

  closeAllSheets() {
    this.setData({ postSheetOpen: false, detailSheetOpen: false });
  },

  openPostDetail(e) {
    const id = Number(e.currentTarget.dataset.id);
    const selectedPost = this.data.posts.find((post) => post.id === id);
    if (!selectedPost) return;
    this.setData({
      selectedPost,
      detailSheetOpen: true,
      postSheetOpen: false
    });
  },

  closeDetailSheet() {
    this.setData({ detailSheetOpen: false });
  },

  setPublishMode(e) {
    this.setData({ publishMode: e.currentTarget.dataset.value });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  handleConfirm(e) {
    this.setData({ "form.confirmed": e.detail.value.length > 0 });
  },

  submitPost() {
    const { form, publishMode } = this.data;
    if (!form.name || !form.budget || !form.moveIn || !form.contact) {
      wx.showToast({ title: "请完善必填信息", icon: "none" });
      return;
    }
    if (publishMode === "has_room" && (!form.apartment || !form.rooms || !form.confirmed)) {
      wx.showToast({ title: "有房帖子需确认房源信息", icon: "none" });
      return;
    }
    const app = getApp();
    const userId = app.globalData.userId;
    const result = createRoommatePostForUser(userId, {
      type: publishMode,
      name: form.name,
      gender: form.gender,
      age: form.age,
      apartment: form.apartment,
      rooms: form.rooms,
      district: form.district,
      budget: form.budget,
      moveIn: form.moveIn,
      desc: form.desc,
      contact: form.contact,
      confirmed: form.confirmed
    });
    if (!result.ok) {
      wx.showToast({ title: "发布失败，请重试", icon: "none" });
      return;
    }
    // 重新读取数据，拿到包含新帖子的审核队列
    const { posts, reviewQueue } = getRoommateData();
    this.setData({
      posts,
      reviewQueue,
      postSheetOpen: false,
      form: {
        name: "",
        gender: "女",
        age: "",
        apartment: "",
        rooms: "",
        district: "",
        budget: "",
        moveIn: "",
        desc: "",
        contact: "",
        confirmed: false
      }
    });
    this.applyFilter();
    wx.showToast({ title: "已提交审核", icon: "none" });
  }
});
