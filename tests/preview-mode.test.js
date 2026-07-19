const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { PREVIEW_MESSAGE, showPreviewNotice } = require("../miniprogram/utils/preview-mode");

const PREVIEW_PAGES = [
  "service",
  "activity-list",
  "service-list",
  "activity-detail",
  "activity-publish",
  "service-detail",
  "borrow",
  "item-detail",
  "item-publish",
  "roommate",
  "messages",
  "profile",
  "community",
  "favorites",
  "my-comments"
];

test("preview notice uses one honest message", () => {
  const calls = [];
  const result = showPreviewNotice({ showToast: (args) => calls.push(args) });

  assert.equal(PREVIEW_MESSAGE, "该功能正在准备中，暂未正式开放");
  assert.equal(calls[0].title, PREVIEW_MESSAGE);
  assert.deepEqual(result, { ok: false, reason: "preview_only" });
});

test("unfinished pages visibly label sample content as preview", () => {
  for (const page of PREVIEW_PAGES) {
    const wxml = fs.readFileSync(path.join(__dirname, `../miniprogram/pages/${page}/index.wxml`), "utf8");
    assert.match(wxml, /功能预览 · 即将开放/);
    assert.match(wxml, /示例内容/);
  }
});

test("unfinished write pages call the shared guard without fake success copy", () => {
  const writePages = [
    "activity-detail",
    "activity-publish",
    "service-detail",
    "item-detail",
    "item-publish",
    "roommate",
    "messages",
    "profile",
    "community",
    "my-comments"
  ];
  const fakeSuccess = /报名成功|发布成功|需求已提交|申请已发送|已提交审核|服务已确认完成|消息已删除|已确认完成|操作已提交/;

  for (const page of writePages) {
    const source = fs.readFileSync(path.join(__dirname, `../miniprogram/pages/${page}/index.js`), "utf8");
    assert.match(source, /showPreviewNotice/);
    assert.doesNotMatch(source, fakeSuccess);
  }
});
