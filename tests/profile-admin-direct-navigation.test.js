const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const profileDir = path.join(__dirname, "../miniprogram/pages/profile");
const script = fs.readFileSync(path.join(profileDir, "index.js"), "utf8");
const wxml = fs.readFileSync(path.join(profileDir, "index.wxml"), "utf8");

test("profile removes settings and renders administrator menus directly", () => {
  assert.doesNotMatch(wxml, /设置/);
  assert.doesNotMatch(wxml, /admin-toggle|admin-panel/);
  assert.match(wxml, /wx:if="\{\{isAdmin\}\}"/);
  assert.match(wxml, /内容管理/);
  assert.doesNotMatch(script, /adminOpen|toggleAdmin|action: "settings"/);
  assert.match(script, /title: "公寓管理"/);
  assert.match(script, /title: "用户管理"/);
});
