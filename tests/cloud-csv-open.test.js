const test = require("node:test");
const assert = require("node:assert/strict");
const { downloadAndOpenCloudCsv } = require("../miniprogram/utils/csv-share");

test("downloads a cloud CSV and opens it with the share menu", async () => {
  const calls = [];
  global.wx = {
    cloud: {
      downloadFile({ fileID, success }) {
        calls.push(["download", fileID]);
        success({ tempFilePath: "/tmp/export.csv" });
      }
    },
    openDocument({ filePath, fileType, showMenu, success }) {
      calls.push(["open", filePath, fileType, showMenu]);
      success();
    },
    showToast() {}
  };

  const result = await new Promise((resolve) => {
    downloadAndOpenCloudCsv({
      fileID: "cloud://env/export.csv",
      fileName: "公寓导出.csv",
      complete: resolve
    });
  });

  assert.deepEqual(calls, [
    ["download", "cloud://env/export.csv"],
    ["open", "/tmp/export.csv", "csv", true]
  ]);
  assert.deepEqual(result, { result: "opened" });
});

test("reports a download failure without copying CSV text", async () => {
  const toasts = [];
  global.wx = {
    cloud: { downloadFile({ fail }) { fail(new Error("network")); } },
    showToast(args) { toasts.push(args); }
  };

  const result = await new Promise((resolve) => {
    downloadAndOpenCloudCsv({ fileID: "cloud://env/export.csv", complete: resolve });
  });

  assert.deepEqual(result, { result: "download_failed" });
  assert.equal(toasts[0].title, "导出文件下载失败，请重试");
});
