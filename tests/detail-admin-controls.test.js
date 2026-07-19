const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = path.join(__dirname, "../miniprogram/pages");

test("public detail pages contain no admin maintenance components", () => {
  for (const page of ["apartment-detail", "room-detail"]) {
    const wxml = fs.readFileSync(path.join(ROOT, page, "index.wxml"), "utf8");
    const json = fs.readFileSync(path.join(ROOT, page, "index.json"), "utf8");
    assert.doesNotMatch(wxml, /image-uploader/);
    assert.doesNotMatch(wxml, /admin-(image|location)-section/);
    assert.doesNotMatch(json, /image-uploader/);
  }
});

test("public detail scripts contain no admin media or location write handlers", () => {
  for (const page of ["apartment-detail", "room-detail"]) {
    const source = fs.readFileSync(path.join(ROOT, page, "index.js"), "utf8");
    assert.doesNotMatch(source, /onImageChange\s*\(/);
    assert.doesNotMatch(source, /onMapTap\s*\(/);
    assert.doesNotMatch(source, /saveAdminItem/);
  }
});
