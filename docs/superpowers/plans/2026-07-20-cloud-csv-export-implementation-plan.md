# 真机 CSV 文件导出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让管理员现有的“批量导出”按钮在真机微信生成并打开可转发、可保存的 CSV 文件。

**Architecture:** 前端仍负责按既有规则生成 CSV；它将 CSV 内容与 `apartments` 或 `room_types` 类型交给受管理员鉴权的 `rencai` 云函数。云函数通过 `wx-server-sdk` 上传 CSV 到云存储并返回 `fileID`，前端下载后使用 `wx.openDocument({ showMenu: true })` 打开文件。

**Tech Stack:** 微信小程序原生 JavaScript、微信云开发 `wx-server-sdk`、Node.js 内置 `node:test`；不新增第三方依赖。

## Global Constraints

- 不新增页面、按钮或下载链接入口；只改现有“批量导出”按钮的内部行为。
- 仅支持管理员、公寓和户型两种导出类型。
- 保留 CSV 的既有字段、筛选、UTF-8 BOM、封面路径和平面图 JSON。
- 不再复制完整 CSV 内容到剪贴板。
- 每项生产代码变更先写失败测试，再实现最小逻辑。
- 云端新文件写入 `exports/`，内容不超过 1 MiB。
- 完成后更新 `logs/2026-07-20-cloud-csv-export.md`。

---

### Task 1: 创建可测试的云端 CSV 文件生成器

**Files:**
- Create: `cloudfunctions/rencai/lib/export-file.js`
- Create: `tests/export-file.test.js`

**Interfaces:**
- Produces: `createExportFile(cloudClient, targetType, csvContent, now)`。
- Success result: `{ ok: true, fileID, fileName }`。
- Invalid type/result size/upload failure: `{ ok: false, code, message }`。

- [ ] **Step 1: 写失败测试**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { createExportFile } = require("../cloudfunctions/rencai/lib/export-file");

test("creates a timestamped apartment CSV in cloud storage", async () => {
  let received;
  const result = await createExportFile({
    uploadFile(options) {
      received = options;
      return Promise.resolve({ fileID: "cloud://env/exports/apartments-123.csv" });
    }
  }, "apartments", "\ufeff编号,名称", () => 123);

  assert.equal(result.ok, true);
  assert.equal(result.fileName, "公寓导出.csv");
  assert.equal(result.fileID, "cloud://env/exports/apartments-123.csv");
  assert.equal(received.cloudPath, "exports/apartments-123.csv");
  assert.equal(received.fileContent.toString("utf8"), "\ufeff编号,名称");
});

test("rejects non-export types and oversized CSV content", async () => {
  const cloudClient = { uploadFile() { throw new Error("should not upload"); } };
  assert.equal((await createExportFile(cloudClient, "users", "x", () => 1)).code, "invalid_export_type");
  assert.equal((await createExportFile(cloudClient, "apartments", "x".repeat(1024 * 1024 + 1), () => 1)).code, "export_too_large");
});
```

- [ ] **Step 2: 运行确认 RED**

Run: `node --test tests/export-file.test.js`

Expected: FAIL，原因是 `lib/export-file.js` 尚不存在。

- [ ] **Step 3: 实现最小生成器**

```js
const EXPORT_FILES = {
  apartments: "公寓导出.csv",
  room_types: "户型导出.csv"
};
const MAX_EXPORT_BYTES = 1024 * 1024;

async function createExportFile(cloudClient, targetType, csvContent, now = Date.now) {
  const fileName = EXPORT_FILES[targetType];
  if (!fileName) return { ok: false, code: "invalid_export_type", message: "不支持的导出类型" };
  const fileContent = Buffer.from(String(csvContent || ""), "utf8");
  if (fileContent.length > MAX_EXPORT_BYTES) return { ok: false, code: "export_too_large", message: "导出数据过大，请缩小筛选范围" };
  try {
    const uploaded = await cloudClient.uploadFile({
      cloudPath: `exports/${targetType}-${Number(now())}.csv`,
      fileContent
    });
    if (!uploaded || !uploaded.fileID) return { ok: false, code: "export_upload_failed", message: "导出文件生成失败，请重试" };
    return { ok: true, fileID: uploaded.fileID, fileName };
  } catch (error) {
    return { ok: false, code: "export_upload_failed", message: "导出文件生成失败，请重试" };
  }
}

module.exports = { createExportFile };
```

- [ ] **Step 4: 运行 GREEN**

Run: `node --test tests/export-file.test.js`

Expected: PASS 2 tests。

- [ ] **Step 5: 提交**

```bash
git add cloudfunctions/rencai/lib/export-file.js tests/export-file.test.js
git commit -m "feat: create cloud CSV export files"
```

### Task 2: 接入管理员云函数与数据适配器

**Files:**
- Modify: `cloudfunctions/rencai/index.js`
- Modify: `miniprogram/data/db.js`
- Modify: `tests/admin-cloud-crud.test.js`

**Interfaces:**
- Consumes: `createExportFile(cloud, targetType, csvContent)`。
- Produces: `db.createExportFile(targetType, csvContent)`，在云模式调用 `rencai` action `createExportFile`。

- [ ] **Step 1: 写失败测试**

在 `tests/admin-cloud-crud.test.js` 的 `db` stub 加入：

```js
async createExportFile(type, content) {
  calls.createExportFile.push({ type, content });
  return { ok: true, fileID: "cloud://env/exports/apartments-1.csv", fileName: "公寓导出.csv" };
}
```

并在 `calls` 中定义 `createExportFile: []`，新增断言：

```js
assert.deepEqual(calls.createExportFile[0], {
  type: "apartments",
  content: expectedCsv
});
```

Run: `node --test tests/admin-cloud-crud.test.js`

Expected: FAIL，因为页面尚未调用新适配器。

- [ ] **Step 2: 扩展云函数路由**

在 `cloudfunctions/rencai/index.js` 顶部添加：

```js
const { createExportFile } = require("./lib/export-file");
```

把 `createExportFile` 加到受 `requireAdmin(wxContext)` 保护的 action 列表，并在该列表的 `switch` 添加：

```js
case "createExportFile":
  return await createExportFile(cloud, event.targetType, event.csvContent);
```

- [ ] **Step 3: 扩展前端数据适配器**

在 `miniprogram/data/db.js` 添加：

```js
function createExportFile(targetType, csvContent) {
  if (!isCloudMode()) {
    return Promise.resolve({ ok: false, code: "cloud_required", message: "导出文件需在云模式下生成" });
  }
  return callCloud("createExportFile", { targetType, csvContent });
}
```

并将其加入 `module.exports`。

- [ ] **Step 4: 验证**

Run: `node --test tests/export-file.test.js tests/admin-cloud-crud.test.js`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add cloudfunctions/rencai/index.js miniprogram/data/db.js tests/admin-cloud-crud.test.js
git commit -m "feat: expose admin CSV export files"
```

### Task 3: 由现有按钮下载并打开 CSV 文件

**Files:**
- Modify: `miniprogram/utils/csv-share.js`
- Modify: `miniprogram/pages/admin/index.js`
- Create: `tests/cloud-csv-open.test.js`
- Create: `logs/2026-07-20-cloud-csv-export.md`

**Interfaces:**
- Produces: `downloadAndOpenCloudCsv({ fileID, fileName, complete })`。
- `complete` receives `{ result: "opened" | "download_failed" | "open_failed" }`.

- [ ] **Step 1: 写失败测试**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { downloadAndOpenCloudCsv } = require("../miniprogram/utils/csv-share");

test("downloads a cloud CSV and opens it with the share menu", async () => {
  const calls = [];
  global.wx = {
    cloud: { downloadFile({ fileID, success }) { calls.push(["download", fileID]); success({ tempFilePath: "/tmp/export.csv" }); } },
    openDocument({ filePath, fileType, showMenu, success }) { calls.push(["open", filePath, fileType, showMenu]); success(); }
  };
  await new Promise((resolve) => downloadAndOpenCloudCsv({ fileID: "cloud://env/export.csv", fileName: "公寓导出.csv", complete: resolve }));
  assert.deepEqual(calls, [["download", "cloud://env/export.csv"], ["open", "/tmp/export.csv", "csv", true]]);
});
```

- [ ] **Step 2: 运行确认 RED**

Run: `node --test tests/cloud-csv-open.test.js`

Expected: FAIL，因为工具函数尚未导出。

- [ ] **Step 3: 实现文件下载与打开**

在 `csv-share.js` 添加 Promise 包装的 `downloadAndOpenCloudCsv`：调用 `wx.cloud.downloadFile`；仅接受非空 `tempFilePath`；调用 `wx.openDocument({ filePath, fileType: "csv", showMenu: true })`；成功提示“文件已打开，可转发或保存”；下载和打开失败分别显示设计文档中的准确提示。保留现有 `writeAndShareCsv` 给导入错误报告使用，但管理员导出不再调用它。

在 `admin/index.js` 把 `downloadCsv(type, csvText)` 改为 async：

```js
const exportType = type === "rooms" ? "room_types" : type;
const created = await db.createExportFile(exportType, csvText);
if (!created || !created.ok || !created.fileID) {
  wx.showToast({ title: (created && created.message) || "导出文件生成失败，请重试", icon: "none" });
  return;
}
downloadAndOpenCloudCsv({ fileID: created.fileID, fileName: created.fileName });
```

将两处 `this.downloadCsv(...)` 改为 `await this.downloadCsv(...)`，使加载态覆盖云端生成请求。

- [ ] **Step 4: 运行 GREEN 与完整回归**

Run: `node --test tests/cloud-csv-open.test.js tests/export-file.test.js tests/admin-cloud-crud.test.js`

Expected: PASS。

Run: `node --test tests/*.test.js`

Expected: 全部通过。

Run: `find miniprogram cloudfunctions/rencai tests -name '*.js' -type f -print0 | xargs -0 -n1 node --check`

Expected: exit 0。

- [ ] **Step 5: 写日志并提交**

日志包含真机验收步骤：管理员进入公寓或户型管理 → 点击现有“批量导出” → 选择筛选条件 → 导出 → 检查 CSV 打开与 `showMenu` 转发。

```bash
git add miniprogram/utils/csv-share.js miniprogram/pages/admin/index.js tests/cloud-csv-open.test.js logs/2026-07-20-cloud-csv-export.md
git commit -m "feat: open exported CSV files on device"
```
