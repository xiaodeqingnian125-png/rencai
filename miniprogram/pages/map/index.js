const db = require("../../data/db");

// 郑州默认中心（无有效坐标且无指定公寓时的兜底视图，不作为假数据定位）
const DEFAULT_CENTER = {
  latitude: 34.7466,
  longitude: 113.6254,
  scale: 10
};

const MARKER_ICON = "/assets/icons/map-pin.png";
const ACTIVE_MARKER_ICON = "/assets/icons/map-pin-active.png";

// 区域简称：去掉"新区"/"区"后缀，兼容空值
function getDistrictShort(district) {
  return (district || "").replace("新区", "").replace("区", "");
}

// 下方房源条目的位置文案，复用 location（即 address）
function getLocationShort(apartment) {
  return apartment.location || "";
}

// 价格文案：¥min-max（与首页 mock 时代的 priceText 格式保持一致）
function buildPriceText(priceMin, priceMax) {
  const min = Number.isFinite(Number(priceMin)) ? Number(priceMin) : 0;
  const max = Number.isFinite(Number(priceMax)) ? Number(priceMax) : 0;
  return "¥" + min + "-" + max;
}

// 经纬度合法性校验
// 规则：
//   1. latitude / longitude 均为有限数字
//   2. latitude 在 [-90, 90]
//   3. longitude 在 [-180, 180]
//   4. 不能同时为 0（避免无效坐标定位到几内亚湾）
// 非法坐标不得生成 marker，也不得调用 wx.openLocation
function isValidCoordinate(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  if (latitude === 0 && longitude === 0) return false;
  return true;
}

// 将云函数返回的公寓卡片规范化为地图页展示对象
// 注意：toApartmentCard 不返回 location_meta，locationMeta 置空，不破坏原有 WXML 结构
function toMapApartment(card) {
  const id = Number(card.id);
  const latitude = Number(card.latitude);
  const longitude = Number(card.longitude);
  const priceMin = Number(card.priceMin) || 0;
  const priceMax = Number(card.priceMax) || 0;
  return {
    id,
    apartmentCode: card.apartmentCode || "",
    name: card.name || "",
    district: card.district || "",
    priceMin,
    priceMax,
    priceText: buildPriceText(priceMin, priceMax),
    rooms: card.rooms || "",
    location: card.location || "",
    locationMeta: "",
    latitude: Number.isFinite(latitude) ? latitude : 0,
    longitude: Number.isFinite(longitude) ? longitude : 0,
    tags: Array.isArray(card.tags) ? card.tags : [],
    image: card.image || "",
    imageClass: card.imageClass || "",
    locShort: getLocationShort({ location: card.location || "" }),
    districtShort: getDistrictShort(card.district),
    coordValid: isValidCoordinate(latitude, longitude)
  };
}

Page({
  data: {
    // 加载 / 错误 / 空状态
    loading: true,
    error: "",
    loaded: false,
    // 公寓数据
    apartments: [],        // 云端全量公寓（规范化后，含无效坐标）
    validApartments: [],   // 合法坐标子集
    markers: [],           // = validApartments，用于下方房源条目
    mapMarkers: [],        // 微信 map 组件 markers
    activeApartment: null,
    activeId: 0,
    mapCenter: DEFAULT_CENTER,
    locationLabel: "腾讯地图 · 郑州"
  },

  onLoad(options) {
    // 生命周期保护：标记页面存活
    this._isAlive = true;
    // 请求序号：旧请求回调不能覆盖新请求结果
    this._reqId = 0;
    // 请求进行中标记：防止 onLoad / retryLoad 重复触发
    this._loading = false;
    // 兼容字符串和数字 id（公寓详情页传入的是数字字符串）
    const rawId = options && options.id;
    this.initialApartmentId = rawId ? Number(rawId) : 0;
    this.loadApartments(this.initialApartmentId);
  },

  onUnload() {
    // 页面卸载后禁止继续 setData
    this._isAlive = false;
  },

  // onShow 不再无条件重新加载：
  //   - 首次进入由 onLoad 加载
  //   - 从公寓详情返回时不重复请求
  //   - 仅 retryLoad 显式触发重新加载
  onShow() {
    // no-op
  },

  onReady() {
    this.mapCtx = wx.createMapContext("apartmentMap", this);
    // 数据可能已加载（onReady 晚于 onLoad 同步部分，但可能早于云请求回调）
    // 在 loadApartments 的 setData 回调中也会调用 includeAllApartments
    wx.nextTick(() => {
      this.includeAllApartments();
    });
  },

  loadApartments(targetId) {
    // 防止重复请求（onLoad / retryLoad 竞争）
    if (this._loading) return;
    this._loading = true;
    const reqId = ++this._reqId;
    this.setData({ loading: true, error: "" });

    // 复用首页已验证的云返回解析方式：db.getApartmentList 返回 { ok, data, page, pageSize, hasMore }
    // DATA_MODE=cloud 时失败不降级 mock，网络失败显示错误状态
    db.getApartmentList({ page: 1, pageSize: 100 }).then((res) => {
      // 页面已卸载：不再 setData
      if (!this._isAlive) {
        this._loading = false;
        return;
      }
      // 旧请求回调：忽略，避免覆盖新请求
      if (reqId !== this._reqId) {
        this._loading = false;
        return;
      }
      // 云函数返回失败（非网络异常，如集合未初始化）
      if (!res || !res.ok) {
        const message = (res && res.message) || "加载公寓失败";
        console.error("[map] loadApartments failed:", res);
        this._loading = false;
        this.setData({
          loading: false,
          loaded: true,
          error: message,
          apartments: [],
          validApartments: [],
          markers: [],
          mapMarkers: [],
          activeApartment: null,
          activeId: 0
        });
        return;
      }
      // 成功：解析公寓列表
      const cards = Array.isArray(res.data) ? res.data : [];
      const apartments = cards.map(toMapApartment);
      // 仅合法坐标的公寓进入 markers
      const validApartments = apartments.filter((item) => item.coordValid);

      // 选中公寓规则：
      //   1. 指定 id 且有合法坐标 → 选中该公寓，地图中心定位到该公寓
      //   2. 指定 id 不存在或无合法坐标 → 选择第一条有合法坐标的公寓
      //   3. 没有指定 id → 选择第一条有合法坐标的公寓
      //   4. 没有任何合法坐标 → activeApartment = null，显示"暂无可导航的公寓"
      let activeApartment = null;
      if (targetId) {
        const target = validApartments.find((item) => item.id === targetId);
        if (target) activeApartment = target;
      }
      if (!activeApartment && validApartments.length > 0) {
        activeApartment = validApartments[0];
      }

      const mapCenter = activeApartment
        ? { latitude: activeApartment.latitude, longitude: activeApartment.longitude, scale: 13 }
        : DEFAULT_CENTER;

      this._loading = false;
      this.setData({
        loading: false,
        loaded: true,
        error: "",
        apartments,
        validApartments,
        markers: validApartments,
        activeApartment,
        activeId: activeApartment ? activeApartment.id : 0,
        mapCenter,
        mapMarkers: this.buildMapMarkers(validApartments, activeApartment ? activeApartment.id : 0)
      }, () => {
        // 无指定公寓且有合法坐标时，框选所有 marker
        if (!this.initialApartmentId) {
          this.includeAllApartments();
        }
      });
    }).catch((err) => {
      console.error("[map] loadApartments exception:", err);
      if (!this._isAlive) {
        this._loading = false;
        return;
      }
      if (reqId !== this._reqId) {
        this._loading = false;
        return;
      }
      // 网络异常：显示错误状态，不降级 mock
      this._loading = false;
      this.setData({
        loading: false,
        loaded: true,
        error: "网络异常，请稍后重试",
        apartments: [],
        validApartments: [],
        markers: [],
        mapMarkers: [],
        activeApartment: null,
        activeId: 0
      });
    });
  },

  // 重试加载：进行中时防止重复点击
  retryLoad() {
    if (this._loading) return;
    this.loadApartments(this.initialApartmentId);
  },

  // 微信 map markerId 必须为数字：公寓业务 id 已在 toMapApartment 中转为 number
  // markerId === apartment.id（数字），不依赖隐式类型转换
  buildMapMarkers(markers, activeId) {
    return markers.map((apartment) => {
      const active = apartment.id === activeId;
      return {
        id: apartment.id,
        latitude: apartment.latitude,
        longitude: apartment.longitude,
        title: apartment.name,
        iconPath: active ? ACTIVE_MARKER_ICON : MARKER_ICON,
        width: active ? 34 : 30,
        height: active ? 42 : 38,
        anchor: { x: 0.5, y: 1 },
        callout: {
          content: apartment.name + "\n" + apartment.priceText + "/月",
          color: active ? "#2d2318" : "#5c4a38",
          fontSize: 12,
          borderRadius: 8,
          bgColor: "#fffdf7",
          padding: 8,
          display: active ? "ALWAYS" : "BYCLICK",
          textAlign: "center"
        }
      };
    });
  },

  // marker 点击：同步 activeId / 地图中心 / 当前卡片
  selectMarkerFromMap(e) {
    this.setActiveApartment(Number(e.detail.markerId), true);
  },

  // 下方房源条目点击：同步 activeId / 地图中心 / 当前卡片
  selectApartment(e) {
    this.setActiveApartment(Number(e.currentTarget.dataset.id), true);
  },

  setActiveApartment(id, shouldMoveMap) {
    const activeApartment = this.data.markers.find((item) => item.id === id);
    if (!activeApartment) return;
    this.setData({
      activeApartment,
      activeId: activeApartment.id,
      mapCenter: {
        latitude: activeApartment.latitude,
        longitude: activeApartment.longitude,
        scale: 13
      },
      mapMarkers: this.buildMapMarkers(this.data.markers, activeApartment.id)
    }, () => {
      if (shouldMoveMap) {
        this.moveToApartment(activeApartment, 13);
      }
    });
  },

  moveToApartment(apartment, scale) {
    if (!apartment) return;
    const targetScale = scale || 13;
    this.setData({
      mapCenter: {
        latitude: apartment.latitude,
        longitude: apartment.longitude,
        scale: targetScale
      }
    });
  },

  // 框选所有 marker：仅在无指定公寓且有合法坐标时生效
  includeAllApartments() {
    if (!this._isAlive) return;
    if (!this.mapCtx || !this.mapCtx.includePoints) return;
    if (this.initialApartmentId) return;
    const markers = this.data.markers;
    if (!markers || markers.length === 0) return;
    const points = markers.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude
    }));
    this.mapCtx.includePoints({
      points,
      padding: [96, 56, 180, 56]
    });
  },

  goDetail(e) {
    const fallbackId = this.data.activeApartment ? this.data.activeApartment.id : 0;
    const id = Number(e.currentTarget.dataset.id || this.data.activeId || fallbackId);
    if (!id) return;
    wx.navigateTo({ url: "/pages/apartment-detail/index?id=" + id });
  },

  // 真实地图导航：调用前再次校验经纬度
  openLocation(e) {
    const id = Number(e.currentTarget.dataset.id || this.data.activeId);
    const apartment = this.data.markers.find((item) => item.id === id) || this.data.activeApartment;
    if (!apartment) return;
    // 经纬度无效时不调用 wx.openLocation
    if (!isValidCoordinate(apartment.latitude, apartment.longitude)) {
      wx.showModal({
        title: "无法导航",
        content: "该公寓暂无有效位置信息",
        showCancel: false
      });
      return;
    }
    wx.openLocation({
      latitude: apartment.latitude,
      longitude: apartment.longitude,
      name: apartment.name,
      address: apartment.location,
      scale: 16
    });
  },

});
