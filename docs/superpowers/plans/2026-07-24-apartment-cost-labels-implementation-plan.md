# 公寓费用标签统一 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 统一公寓详情、导入导出与云数据库的六项费用标签和金额显示。

**Architecture:** 云函数费用列定义是 Excel 的唯一来源；小程序展示层把数据库费用转换为固定六项。数据库迁移只改“网费”标签。

**Tech Stack:** 微信小程序原生 JavaScript、微信云开发、Node.js `node:test`。

## Global Constraints

- 保留现有未提交改动。
- 无新增第三方依赖。
- 测试先行；旧表头必须拒绝。

### Task 1: 费用定义与展示测试

**Files:** 修改 `tests/apartment-option-display.test.js`、`tests/import-address-only.test.js`、`tests/export-file.test.js`。

- [ ] 写入断言：六项固定标题、数字加“元”、文字原样显示；新暖气表头可导入，旧网费表头不被识别。
- [ ] 运行 `node --test tests/apartment-option-display.test.js tests/import-address-only.test.js tests/export-file.test.js`，确认失败。

### Task 2: 最小实现

**Files:** 修改 `miniprogram/utils/apartment-display-options.js`、`miniprogram/pages/apartment-detail/index.js`、`cloudfunctions/rencai/lib/apartment-import-options.js`、`miniprogram/pages/admin/index.js`、`cloudfunctions/rencai/seed/apartments.json`。

- [ ] 用统一费用定义生成详情展示与新版 Excel 列；纯数字写入/展示遵循单位规则，文字原样保留。
- [ ] 删除旧网费表头的兼容入口。
- [ ] 运行同一测试命令并确认通过。

### Task 3: 云数据迁移与核验

**Files:** 新建备份与 `logs/2026-07-24-apartment-cost-labels.md`。

- [ ] 备份 `apartments`，仅把每个 `costs` 数组中 `label === "网费"` 改为 `"暖气费"`。
- [ ] 回读并断言 77 条记录没有“网费”，且迁移前后的值、状态和数组顺序一致。
- [ ] 运行全量相关测试和开发者工具编译检查。
