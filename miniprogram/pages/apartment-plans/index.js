const db = require("../../data/db");
const { normalizeFloorPlans } = require("../../utils/floor-plans");

Page({
  data: {
    apartmentName: "",
    floorPlans: [],
    loading: true,
    error: "",
    notFound: false
  },

  onLoad(options) {
    this.apartmentId = options.id;
    this.loadFloorPlans();
  },

  async loadFloorPlans() {
    this.setData({ loading: true, error: "", notFound: false });
    try {
      const result = await db.getApartmentDetail(this.apartmentId);
      if (!result || !result.ok) {
        if (result && result.code === "not_found") {
          this.setData({ loading: false, notFound: true });
          return;
        }
        throw new Error(result && result.message || "加载平面图失败");
      }
      const apartment = result.data || {};
      const floorPlans = normalizeFloorPlans(apartment.floor_plans);
      this.setData({
        apartmentName: apartment.name || "",
        floorPlans: floorPlans.slice(3),
        loading: false
      });
      if (apartment.name) {
        wx.setNavigationBarTitle({ title: `${apartment.name} · 更多平面图` });
      }
    } catch (error) {
      this.setData({
        loading: false,
        error: error && error.message || "网络异常，请稍后重试"
      });
    }
  },

  retryLoad() {
    this.loadFloorPlans();
  },

  previewFloorPlan(e) {
    const index = Number(e.currentTarget.dataset.index);
    const current = this.data.floorPlans[index];
    if (!current) return;
    wx.previewImage({
      current: current.image,
      urls: this.data.floorPlans.map((item) => item.image)
    });
  }
});
