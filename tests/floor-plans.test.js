const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  normalizeFloorPlans,
  encodeFloorPlans,
  decodeFloorPlans
} = require("../miniprogram/utils/floor-plans");

test("floor plan JSON round-trips names and cloud paths", () => {
  const plans = [
    { name: "项目总平面图", image: "cloud://env/a.jpg" },
    { name: "一层平面图", image: "https://cdn.example.com/1.jpg" }
  ];

  assert.deepEqual(decodeFloorPlans(encodeFloorPlans(plans)), plans);
});

test("invalid floor plan rows are removed", () => {
  assert.deepEqual(normalizeFloorPlans([
    { name: "", image: "cloud://env/a.jpg" },
    { name: "临时图", image: "tmp/a.jpg" },
    { name: "有效图", image: "https://cdn.example.com/a.jpg", extra: "remove" }
  ]), [{ name: "有效图", image: "https://cdn.example.com/a.jpg" }]);
});

test("invalid floor plan JSON decodes to an empty list", () => {
  assert.deepEqual(decodeFloorPlans("not-json"), []);
});

test("admin CSV exports cover paths and ordered floor plan JSON", () => {
  const source = fs.readFileSync(path.join(__dirname, "../miniprogram/pages/admin/index.js"), "utf8");

  assert.match(source, /"状态", "封面图路径", "平面图"/);
  assert.match(source, /encodeFloorPlans\(apt\.floor_plans\)/);
  assert.match(source, /floor_plans: decodeFloorPlans/);
  assert.match(source, /"状态", "封面图路径", "描述"/);
});
