# 单按钮导出文件操作 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不增加新入口的前提下，让管理员从现有批量导出按钮明确打开、保存或转发 CSV 文件。

**Architecture:** 云函数仍返回 CSV 的 `fileID`。前端工具层先把云文件下载到临时路径，再由管理员页展示一次性操作弹窗；弹窗只调用工具层的“打开文件”或“转发文件”能力。文件路径不持久化、不新增下载中心。

**Tech Stack:** 微信小程序原生 WXML、WXSS、JavaScript、微信云开发、Node.js `node:test`。

## Global Constraints

- 保留公寓和户型页的唯一“批量导出”入口，不新增页面、tab、历史记录或下载中心。
- 真机微信通过系统文件菜单保存或转发；开发者工具不得宣称保存到 Mac。
- 不引入第三方库；所有失败提示必须如实表达状态。
- 每个任务先写失败测试，再写最小实现；完成后把任务日志写入 `logs/`。
- 不修改或暂存 `.gitignore` 和 `logs/2026-07-19-project-local-ponytail-plugin.md`。

---

### Task 1: 分离云端 CSV 的下载、打开与转发能力

**Files:**
- Modify: `miniprogram/utils/csv-share.js:181-220`
- Modify: `tests/cloud-csv-open.test.js`

**Interfaces:**
- Produces `downloadCloudCsv({ fileID }) -> Promise<{ ok: true, filePath: string } | { ok: false, code: 'download_failed' | 'unsupported' }>`.
- Produces `openCloudCsv({ filePath }) -> Promise<{ ok: true } | { ok: false, code: 'open_failed' | 'unsupported' }>`.
- Produces `shareCloudCsv({ filePath, fileName }) -> Promise<{ ok: true } | { ok: false, code: 'share_failed' | 'unsupported' }>`.
- Keeps `downloadAndOpenCloudCsv` as a compatibility wrapper for existing callers and its existing callback result values.

- [ ] **Step 1: Write failing tests for explicit cloud-file operations**

Add tests that mock `wx.cloud.downloadFile`, `wx.openDocument`, and `wx.shareFileMessage` and assert:

```js
const downloaded = await downloadCloudCsv({ fileID: "cloud://env/export.csv" });
assert.deepEqual(downloaded, { ok: true, filePath: "/tmp/export.csv" });
assert.deepEqual(await openCloudCsv({ filePath: downloaded.filePath }), { ok: true });
assert.deepEqual(await shareCloudCsv({ filePath: downloaded.filePath, fileName: "公寓导出.csv" }), { ok: true });
```

Also assert missing `shareFileMessage` returns `{ ok: false, code: "unsupported" }` without a success toast.

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `node --test tests/cloud-csv-open.test.js`

Expected: FAIL because the three explicit functions are not exported.

- [ ] **Step 3: Implement the smallest utilities**

Implement Promise wrappers that do not display page copy:

```js
function openCloudCsv({ filePath } = {}) {
  if (!filePath || typeof wx.openDocument !== "function") {
    return Promise.resolve({ ok: false, code: "unsupported" });
  }
  return new Promise((resolve) => {
    wx.openDocument({ filePath, fileType: "csv", showMenu: true,
      success: () => resolve({ ok: true }),
      fail: () => resolve({ ok: false, code: "open_failed" })
    });
  });
}
```

Use the same result convention for download and share. Reimplement the legacy helper by composing these functions and preserving its prior toast/callback contract.

- [ ] **Step 4: Run targeted tests to verify they pass**

Run: `node --test tests/cloud-csv-open.test.js`

Expected: PASS with zero failures.

- [ ] **Step 5: Commit Task 1**

```bash
git add miniprogram/utils/csv-share.js tests/cloud-csv-open.test.js
git commit -m "feat: add explicit CSV file actions"
```

### Task 2: 在管理员页显示一次性文件操作弹窗

**Files:**
- Modify: `miniprogram/pages/admin/index.js:1-8,760-785,1358-1369`
- Modify: `miniprogram/pages/admin/index.wxml:282-300`
- Modify: `miniprogram/pages/admin/index.wxss:1213-1258`
- Modify: `tests/admin-cloud-crud.test.js`

**Interfaces:**
- Consumes `downloadCloudCsv`, `openCloudCsv`, `shareCloudCsv` from `csv-share.js`.
- Adds page data: `exportFileOpen: boolean`, `exportFilePath: string`, `exportFileName: string`.
- Adds page methods: `closeExportFileActions()`, `openExportFile()`, `shareExportFile()`.
- `downloadCsv(type, csvText)` opens the action dialog only after cloud file creation and successful download.

- [ ] **Step 1: Write a failing page behavior test**

Extend the page harness to mock `downloadCloudCsv` as returning a temporary CSV file. Add:

```js
await page.downloadCsv("apartments", "编号,名称");
assert.equal(page.data.exportFileOpen, true);
assert.equal(page.data.exportFileName, "公寓导出.csv");
assert.equal(page.data.exportFilePath, "/tmp/export.csv");
```

Add a source assertion that `index.wxml` includes the labels `打开并保存文件` and `转发到微信`, and each has its own tap handler.

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `node --test tests/admin-cloud-crud.test.js`

Expected: FAIL because export action state and handlers do not exist.

- [ ] **Step 3: Implement action state and handlers**

Replace the immediate `downloadAndOpenCloudCsv` call in `downloadCsv` with:

```js
const downloaded = await downloadCloudCsv({ fileID: created.fileID });
if (!downloaded.ok) {
  wx.showToast({ title: "导出文件下载失败，请重试", icon: "none" });
  return;
}
this.setData({
  exportFileOpen: true,
  exportFilePath: downloaded.filePath,
  exportFileName: created.fileName || "导出文件.csv"
});
```

`openExportFile` calls `openCloudCsv` and shows `文件已打开，请在右上角保存或转发` only on success. `shareExportFile` calls `shareCloudCsv`; when unsupported or failed it reports the correct fallback. Both retain the dialog so the other action remains available. `closeExportFileActions` clears the temporary path and name.

Add a modal after the existing export filter dialog:

```xml
<view wx:if="{{exportFileOpen}}" class="modal-mask" catchtap="closeExportFileActions"></view>
<view wx:if="{{exportFileOpen}}" class="export-file-card">
  <view class="export-file-icon">▧</view>
  <view class="modal-title">导出文件已生成</view>
  <text class="export-file-name">{{exportFileName}}</text>
  <text class="export-file-tip">真机微信可在右上角菜单保存或转发</text>
  <button class="export-file-open" bindtap="openExportFile">打开并保存文件</button>
  <button class="export-file-share" bindtap="shareExportFile">转发到微信</button>
  <view class="export-file-cancel" bindtap="closeExportFileActions">取消</view>
</view>
```

Style `.export-file-card` as a centered rounded white card with the existing orange, beige, and dark brown palette; add a solid orange primary action and outlined secondary action.

- [ ] **Step 4: Run targeted tests to verify they pass**

Run: `node --test tests/admin-cloud-crud.test.js`

Expected: PASS with zero failures.

- [ ] **Step 5: Commit Task 2**

```bash
git add miniprogram/pages/admin/index.js miniprogram/pages/admin/index.wxml miniprogram/pages/admin/index.wxss tests/admin-cloud-crud.test.js
git commit -m "feat: show CSV file action dialog"
```

### Task 3: 验证、记录与交付

**Files:**
- Create: `logs/2026-07-20-single-button-export-file-actions.md`

- [ ] **Step 1: Document behavior and real-device limitation**

Create a Markdown log describing the one-button flow, the exact true-device save/forward behavior, and the fact that the developer tool cannot save into Mac Downloads.

- [ ] **Step 2: Run complete verification**

Run:

```bash
node --test tests/*.test.js
node --check miniprogram/utils/csv-share.js
node --check miniprogram/pages/admin/index.js
git diff --check
```

Expected: all tests pass, syntax checks exit 0, no whitespace errors.

- [ ] **Step 3: Commit Task 3**

```bash
git add logs/2026-07-20-single-button-export-file-actions.md
git commit -m "docs: record CSV file action verification"
```
