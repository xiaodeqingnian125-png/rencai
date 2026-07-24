const test = require("node:test");
const assert = require("node:assert/strict");
const {
  downloadAndOpenCloudCsv,
  downloadCloudCsv,
  openCloudCsv,
  openCloudSpreadsheet,
  prepareCloudSpreadsheetFile,
  shareCloudCsv
} = require("../miniprogram/utils/csv-share");

test("separates downloading, opening and sharing a cloud CSV", async () => {
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
    shareFileMessage({ filePath, fileName, success }) {
      calls.push(["share", filePath, fileName]);
      success();
    }
  };

  const downloaded = await downloadCloudCsv({ fileID: "cloud://env/export.csv" });
  assert.deepEqual(downloaded, { ok: true, filePath: "/tmp/export.csv" });
  assert.deepEqual(await openCloudCsv({ filePath: downloaded.filePath }), { ok: true });
  assert.deepEqual(await shareCloudCsv({ filePath: downloaded.filePath, fileName: "公寓导出.csv" }), { ok: true });
  assert.deepEqual(calls, [
    ["download", "cloud://env/export.csv"],
    ["open", "/tmp/export.csv", "csv", true],
    ["share", "/tmp/export.csv", "公寓导出.csv"]
  ]);
});

test("reports direct share as unsupported without a success toast", async () => {
  global.wx = {};

  assert.deepEqual(
    await shareCloudCsv({ filePath: "/tmp/export.csv", fileName: "公寓导出.csv" }),
    { ok: false, code: "unsupported" }
  );
});

test("opens an XLSX file with the native save menu", async () => {
  const calls = [];
  global.wx = {
    openDocument({ filePath, fileType, showMenu, success }) {
      calls.push([filePath, fileType, showMenu]);
      success();
    }
  };

  assert.deepEqual(await openCloudSpreadsheet({ filePath: "/tmp/export.xlsx" }), { ok: true });
  assert.deepEqual(calls, [["/tmp/export.xlsx", "xlsx", true]]);
});

test("copies a cloud spreadsheet to a dated local filename before opening it", () => {
  const calls = [];
  global.wx = {
    env: { USER_DATA_PATH: "/user-data" },
    getFileSystemManager() {
      return {
        readFileSync(source) {
          calls.push(["read", source]);
          return Buffer.from("xlsx");
        },
        writeFileSync(destination, content) {
          calls.push(["write", destination, content.toString()]);
        }
      };
    }
  };

  assert.deepEqual(
    prepareCloudSpreadsheetFile({
      filePath: "/tmp/random-name.xlsx",
      fileName: "人才公寓-20260720-153045.xlsx"
    }),
    { ok: true, filePath: "/user-data/人才公寓-20260720-153045.xlsx" }
  );
  assert.deepEqual(calls, [
    ["read", "/tmp/random-name.xlsx"],
    ["write", "/user-data/人才公寓-20260720-153045.xlsx", "xlsx"]
  ]);
});

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
