const test = require("node:test");
const assert = require("node:assert/strict");
const { buildApartmentDisplayOptions, buildApartmentCostDisplay } = require("../miniprogram/utils/apartment-display-options");

test("apartment detail keeps every option and marks missing selections inactive", () => {
  const display = buildApartmentDisplayOptions({
    private_facilities: ["独立卫浴", "空调"],
    public_facilities: [{ label: "公共厨房", active: true }],
    nearby: ["地铁站"]
  });

  assert.equal(display.privateFacilities.length, 7);
  assert.deepEqual(display.privateFacilities.find((item) => item.label === "空调"), {
    label: "空调", icon: "空", active: true
  });
  assert.deepEqual(display.privateFacilities.find((item) => item.label === "凳子"), {
    label: "凳子", icon: "凳", active: false
  });
  assert.equal(display.publicFacilities.find((item) => item.label === "公共厨房").active, true);
  assert.equal(display.publicFacilities.find((item) => item.label === "充电桩").active, false);
  assert.deepEqual(display.nearby.find((item) => item.label === "地铁站"), {
    label: "地铁站", icon: "地", active: true
  });
  assert.equal(display.nearby.find((item) => item.label === "银行").active, false);
});

test("apartment detail restores uploaded Excel cost text without changing the source", () => {
  const costs = buildApartmentCostDisplay([
    { label: "水费", value: "0.56元/立方", active: true },
    { label: "燃气费", value: "无元/立方", active: true },
    { label: "物业费", value: "已含元/㎡/月", active: true },
    { label: "网费", value: "供暖元/月", active: true }
  ]);

  assert.deepEqual(costs.map((item) => [item.label, item.value]), [
    ["水费（m³）", "0.56"],
    ["电费（度）", ""],
    ["燃气费（m³）", "无"],
    ["物业费（㎡/月）", "已含"],
    ["暖气费（㎡/天）", "供暖"],
    ["停车费（月）", ""]
  ]);
});
