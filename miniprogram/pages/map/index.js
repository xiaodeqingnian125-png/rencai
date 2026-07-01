const { apartments } = require("../../data/apartments");

const DEFAULT_CENTER = {
  latitude: 34.7466,
  longitude: 113.6254,
  scale: 10
};

const MARKER_ICON = "/assets/icons/map-pin.png";
const ACTIVE_MARKER_ICON = "/assets/icons/map-pin-active.png";

function getDistrictShort(district) {
  return district.replace("新区", "").replace("区", "");
}

function getLocationShort(apartment) {
  return `${apartment.location.split("与")[0]} · ${apartment.district}`;
}

Page({
  data: {
    markers: [],
    mapMarkers: [],
    activeApartment: null,
    activeId: 0,
    mapCenter: DEFAULT_CENTER,
    showUserLocation: false,
    locating: false,
    locationLabel: "腾讯地图 · 郑州"
  },

  onLoad(options) {
    this.initialApartmentId = Number(options.id) || 0;
    const markers = apartments.map((apartment) => ({
      ...apartment,
      locShort: getLocationShort(apartment),
      districtShort: getDistrictShort(apartment.district)
    }));
    const activeApartment = markers.find((item) => item.id === this.initialApartmentId) || markers[0];

    this.setData({
      markers,
      activeApartment,
      activeId: activeApartment.id,
      mapCenter: this.getApartmentCenter(activeApartment, this.initialApartmentId ? 13 : DEFAULT_CENTER.scale),
      mapMarkers: this.buildMapMarkers(markers, activeApartment.id)
    });
  },

  onReady() {
    this.mapCtx = wx.createMapContext("apartmentMap", this);
    wx.nextTick(() => {
      if (this.initialApartmentId) {
        this.moveToApartment(this.data.activeApartment, 13);
        return;
      }
      this.includeAllApartments();
    });
  },

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
          content: `${apartment.name}\n${apartment.priceText}/月`,
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

  getApartmentCenter(apartment, scale = 13) {
    if (!apartment) return DEFAULT_CENTER;
    return {
      latitude: apartment.latitude,
      longitude: apartment.longitude,
      scale
    };
  },

  selectMarkerFromMap(e) {
    this.setActiveApartment(Number(e.detail.markerId), true);
  },

  selectApartment(e) {
    this.setActiveApartment(Number(e.currentTarget.dataset.id), true);
  },

  setActiveApartment(id, shouldMoveMap) {
    const activeApartment = this.data.markers.find((item) => item.id === id);
    if (!activeApartment) return;

    this.setData({
      activeApartment,
      activeId: activeApartment.id,
      mapCenter: this.getApartmentCenter(activeApartment, 13),
      mapMarkers: this.buildMapMarkers(this.data.markers, activeApartment.id)
    }, () => {
      if (shouldMoveMap) {
        this.moveToApartment(activeApartment, 13);
      }
    });
  },

  moveToApartment(apartment, scale = 13) {
    if (!apartment) return;
    if (this.mapCtx && this.mapCtx.moveToLocation) {
      this.mapCtx.moveToLocation({
        latitude: apartment.latitude,
        longitude: apartment.longitude
      });
      return;
    }
    this.setData({
      mapCenter: this.getApartmentCenter(apartment, scale)
    });
  },

  includeAllApartments() {
    if (!this.mapCtx || !this.mapCtx.includePoints) return;
    const points = this.data.markers.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude
    }));
    this.mapCtx.includePoints({
      points,
      padding: [96, 56, 180, 56]
    });
  },

  goDetail(e) {
    const fallbackId = this.data.activeApartment ? this.data.activeApartment.id : 1;
    const id = Number(e.currentTarget.dataset.id || this.data.activeId || fallbackId);
    wx.navigateTo({ url: `/pages/apartment-detail/index?id=${id}` });
  },

  openLocation(e) {
    const id = Number(e.currentTarget.dataset.id || this.data.activeId);
    const apartment = this.data.markers.find((item) => item.id === id) || this.data.activeApartment;
    if (!apartment) return;

    wx.openLocation({
      latitude: apartment.latitude,
      longitude: apartment.longitude,
      name: apartment.name,
      address: apartment.location,
      scale: 16
    });
  },

  locate() {
    if (this.data.locating) return;

    this.setData({ locating: true });
    wx.getLocation({
      type: "gcj02",
      success: (res) => {
        this.setData({
          locating: false,
          showUserLocation: true,
          locationLabel: "已定位当前位置"
        });
        if (this.mapCtx && this.mapCtx.moveToLocation) {
          this.mapCtx.moveToLocation({
            latitude: res.latitude,
            longitude: res.longitude
          });
          return;
        }
        this.setData({
          mapCenter: {
            latitude: res.latitude,
            longitude: res.longitude,
            scale: 13
          }
        });
      },
      fail: () => {
        this.setData({ locating: false });
        wx.showModal({
          title: "需要位置权限",
          content: "允许定位后，可在腾讯地图中查看你与房源的相对位置。",
          confirmText: "去设置",
          success: (modalRes) => {
            if (modalRes.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  }
});
