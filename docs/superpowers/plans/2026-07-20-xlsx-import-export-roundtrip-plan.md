# XLSX 文件导入导出闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让管理员导出可保存、编辑并直接回传导入的 `.xlsx` 文件。

**Architecture:** 云函数使用 `xlsx` 生成和解析真实 workbook；现有 CSV 校验和导入任务继续作为唯一业务管线。小程序只上传 Excel 原文件并调用云函数解析，不在客户端解析二进制 Excel。

**Tech Stack:** 微信小程序原生 WXML/WXSS/JavaScript、微信云开发、Node.js、`xlsx`、Node.js `node:test`。

## Global Constraints

- 公寓和户型继续使用现有唯一批量导入/导出入口。
- `.xlsx` 是标准导入导出格式；CSV/TXT 导入兼容保留。
- 仅首个 worksheet、最多 500 数据行；复用当前 CSV 校验和地址地理编码。
- 不伪造文件扩展名；导出必须是实际 XLSX 二进制。
- 删除文件转发操作；微信系统文档页的“保存”是唯一保存方式。
- 添加的 `xlsx` 依赖仅部署在 `cloudfunctions/rencai`，随云函数“上传并部署：云端安装依赖”安装。

---

### Task 1: 云函数生成和解析真实 XLSX

**Files:**
- Modify: `cloudfunctions/rencai/package.json`
- Modify: `cloudfunctions/rencai/lib/export-file.js`
- Modify: `cloudfunctions/rencai/lib/import-task.js`
- Modify: `cloudfunctions/rencai/index.js`
- Modify: `tests/export-file.test.js`
- Create: `tests/xlsx-import-task.test.js`

**Interfaces:**
- `createExportFile(cloudClient, targetType, csvContent, now)` returns `fileName` ending in `.xlsx` and uploads an XLSX buffer.
- `createImportTaskFromFile(targetType, fileName, fileID, operator, cloudClient)` parses the first worksheet to CSV text, then calls `createImportTask`.
- Cloud action `createImportTaskFromFile` is protected by the existing `requireAdmin` branch.

- [ ] Write failing tests that read the uploaded export buffer with `XLSX.read`, asserting `公寓导出.xlsx`, `exports/apartments-123.xlsx`, and the original Chinese headers/data.
- [ ] Write failing tests for xlsx file parsing: first sheet becomes CSV text with headers, invalid file returns `excel_parse_failed`, and CSV task creation receives the parsed text.
- [ ] Run the new tests; expected failures are missing XLSX output/parser interfaces.
- [ ] Add `xlsx` to `cloudfunctions/rencai/package.json` and install it under the cloud function directory.
- [ ] Implement workbook creation with `XLSX.utils.aoa_to_sheet(parseCsv(csvContent))`, `book_new`, `book_append_sheet`, and `XLSX.write(..., { type: "buffer", bookType: "xlsx" })`.
- [ ] Implement first-sheet parsing with `cloud.downloadFile`, `XLSX.read(buffer, { type: "buffer" })`, and `XLSX.utils.sheet_to_csv`; reuse `createImportTask` for task persistence.
- [ ] Register the new cloud action and rerun export/import task tests.
- [ ] Commit cloud-function changes and tests.

### Task 2: 小程序 Excel 文件保存与选择上传

**Files:**
- Modify: `miniprogram/utils/csv-share.js`
- Modify: `miniprogram/data/db.js`
- Modify: `miniprogram/pages/admin/index.js`
- Modify: `miniprogram/pages/admin/index.wxml`
- Modify: `miniprogram/pages/admin/index.wxss`
- Modify: `tests/cloud-csv-open.test.js`
- Modify: `tests/admin-cloud-crud.test.js`

**Interfaces:**
- `openCloudSpreadsheet({ filePath })` uses `{ fileType: "xlsx", showMenu: true }`.
- `createImportTaskFromFile(targetType, fileName, fileID)` calls the new cloud action.
- `importCsvFile` accepts `csv`, `txt`, and `xlsx`; for `xlsx`, uploads file to `imports/` before creating the task from cloud file ID.

- [ ] Write failing tests asserting `openCloudSpreadsheet` uses `xlsx`, export opens that function directly after download, no export-file action modal/transfer button remains, and xlsx selection uploads then calls `createImportTaskFromFile`.
- [ ] Run targeted tests; expected failures are unavailable spreadsheet function/action and obsolete modal behavior.
- [ ] Implement `openCloudSpreadsheet` and remove export action dialog state, handlers, WXML, and WXSS.
- [ ] Replace direct export behavior with `downloadCloudCsv` then `openCloudSpreadsheet`; report real failure states only.
- [ ] Extend the data adapter and import selection logic; CSV/TXT remains local UTF-8 read while XLSX uploads to cloud and starts the existing preview flow.
- [ ] Run targeted tests and commit page/data/tool changes.

### Task 3: 验证与上线交接

**Files:**
- Create: `logs/2026-07-20-xlsx-import-export-roundtrip.md`

- [ ] Record user workflow, CSV compatibility, true-device save limitation, and mandatory cloud function deployment.
- [ ] Run `node --test tests/*.test.js`, syntax checks for changed mini program/cloud JS, and `git diff --check`.
- [ ] Open the project in WeChat DevTools; report service-port or real-device limitations honestly.
- [ ] Commit the log and preserve unrelated worktree changes.
