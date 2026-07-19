const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "../miniprogram");

test("apartment detail shows at most three plans before room selection", () => {
  const script = fs.readFileSync(path.join(ROOT, "pages/apartment-detail/index.js"), "utf8");
  const template = fs.readFileSync(path.join(ROOT, "pages/apartment-detail/index.wxml"), "utf8");
  const styles = fs.readFileSync(path.join(ROOT, "pages/apartment-detail/index.wxss"), "utf8");

  assert.match(script, /visibleFloorPlans:\s*floorPlans\.slice\(0, 3\)/);
  assert.match(script, /hasMoreFloorPlans:\s*floorPlans\.length > 3/);
  assert.ok(template.indexOf("floor-plan-section") < template.indexOf("room-section"));
  assert.match(template, />更多</);
  assert.match(template, /class="floor-plan-caption"/);
  assert.match(styles, /\.floor-plan-caption[\s\S]*text-align:\s*center/);
});

test("more page displays only plans after the first three", () => {
  const scriptPath = path.join(ROOT, "pages/apartment-plans/index.js");
  const templatePath = path.join(ROOT, "pages/apartment-plans/index.wxml");
  const stylesPath = path.join(ROOT, "pages/apartment-plans/index.wxss");
  const script = fs.readFileSync(scriptPath, "utf8");
  const template = fs.readFileSync(templatePath, "utf8");
  const styles = fs.readFileSync(stylesPath, "utf8");

  assert.match(script, /floorPlans\.slice\(3\)/);
  assert.match(script, /previewImage/);
  assert.match(template, /class="plan-caption"/);
  assert.match(styles, /\.plan-caption[\s\S]*text-align:\s*center/);
});

test("admin apartment form supports naming, uploading and reordering floor plans", () => {
  const script = fs.readFileSync(path.join(ROOT, "pages/admin/index.js"), "utf8");
  const template = fs.readFileSync(path.join(ROOT, "pages/admin/index.wxml"), "utf8");

  for (const handler of ["addFloorPlan", "handleFloorPlanNameInput", "onFloorPlanImageChange", "moveFloorPlan", "removeFloorPlan"]) {
    assert.match(script, new RegExp(`${handler}\\s*\\(`));
    assert.match(template, new RegExp(`bind(?:tap|input|:change)="${handler}"`));
  }
});

test("apartment plans page is registered in app.json", () => {
  const app = JSON.parse(fs.readFileSync(path.join(ROOT, "app.json"), "utf8"));
  assert.ok(app.pages.includes("pages/apartment-plans/index"));
});
