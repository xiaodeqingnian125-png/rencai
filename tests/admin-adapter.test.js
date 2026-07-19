const test = require("node:test");
const assert = require("node:assert/strict");
const { toAdminItem, toCloudItem } = require("../miniprogram/data/admin-adapter");

test("apartment cloud record maps to existing admin UI fields", () => {
  const item = toAdminItem("apartments", {
    id: 1,
    apartment_code: "A001",
    name: "郑东青年公寓",
    price_min: 1200,
    price_max: 1800,
    room_summary: "1-2居"
  });

  assert.equal(item.rent, "¥1200-1800/月");
  assert.equal(item.rooms, "1-2居");
});

test("apartment admin form writes canonical cloud fields", () => {
  const item = toCloudItem("apartments", {
    id: 1,
    apartment_code: "A001",
    name: "郑东青年公寓",
    rent: "¥1300-1900/月",
    rooms: "1-2居",
    floor_plans: []
  });

  assert.equal(item.price_min, 1300);
  assert.equal(item.price_max, 1900);
  assert.equal(item.room_summary, "1-2居");
  assert.equal("rent" in item, false);
});

test("room adapter keeps apartment_code and numeric price", () => {
  const cloud = toCloudItem("rooms", {
    id: 2,
    apartment_code: "A001",
    name: "精致一居室",
    rent: "¥1200/月起"
  });

  assert.equal(cloud.apartment_code, "A001");
  assert.equal(cloud.price, 1200);
});

test("admin records discard legacy local image file names", () => {
  const apartment = toAdminItem("apartments", {
    id: 1,
    apartment_code: "A001",
    name: "郑东青年公寓",
    image: "apt-1.jpg"
  });
  const room = toAdminItem("rooms", {
    id: 2,
    apartment_code: "A001",
    name: "精致一居室",
    image: "room-1.jpg"
  });

  assert.equal(apartment.image, "");
  assert.equal(room.image, "");
});
