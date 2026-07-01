const { getApartmentById } = require("../../data/apartments");

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
    const apartmentOne = getApartmentById(1);
    const apartmentFive = getApartmentById(5);
    const apartments = [apartmentOne, apartmentFive].map((apartment, index) => ({
      id: apartment.id,
      name: apartment.name,
      detail: `${apartment.location.split("与")[0]} · ${apartment.district}`,
      price: `${apartment.priceText.split("-")[0]}起`,
      imageClass: index % 2 === 0 ? "ci-apart" : "ci-apart ci-apart-alt",
      typeLabel: "公寓",
      tags: [apartment.district, apartment.locationMeta.split(" · ")[0]]
    }));
    const rooms = [
      { apartment: apartmentOne, room: apartmentOne.rooms[0] },
      { apartment: apartmentOne, room: apartmentOne.rooms[1] },
      { apartment: apartmentFive, room: apartmentFive.rooms[0] }
    ].map(({ apartment, room }, index) => ({
      id: room.id,
      aptId: apartment.id,
      name: room.name,
      detail: `${apartment.name} · ${room.layout}`,
      price: `${room.price}/月`,
      imageClass: index % 2 === 0 ? "ci-room" : "ci-room ci-room-alt",
      typeLabel: "户型",
      tags: [room.area, room.orient, room.floor.split(" / ")[0]]
    }));
    const tabs = this.data.tabs.map((tab) => ({
      ...tab,
      count: tab.value === "apartment" ? apartments.length : rooms.length
    }));
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
