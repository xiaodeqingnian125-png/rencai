const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("map browsing and apartment navigation do not require user location", () => {
  const appConfig = JSON.parse(readProjectFile("miniprogram/app.json"));
  const mapScript = readProjectFile("miniprogram/pages/map/index.js");
  const mapTemplate = readProjectFile("miniprogram/pages/map/index.wxml");

  assert.deepEqual(appConfig.requiredPrivateInfos || [], []);
  assert.doesNotMatch(mapScript, /wx\.getLocation/);
  assert.doesNotMatch(mapTemplate, /bindtap="locate"/);
  assert.match(mapScript, /wx\.openLocation/);
  assert.match(mapTemplate, /catchtap="openLocation"/);
});
