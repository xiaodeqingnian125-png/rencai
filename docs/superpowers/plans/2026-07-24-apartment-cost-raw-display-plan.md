# 公寓费用 Excel 原文显示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 公寓详情页六项费用显示恢复上传 Excel 的原文，而不改数据库、导入或导出。

**Architecture:** 在 `apartment-display-options` 的显示适配层中，仅删除数据库值末尾由导入器自动拼接的费用单位；标题和数据库值均不写回。

**Tech Stack:** 微信小程序原生 JavaScript、Node.js `node:test`。

## Global Constraints

- 不写云数据库，不修改 Excel 导入或导出。
- 保留工作区已有改动。
- 测试先行。

### Task 1: 原文显示测试与实现

**Files:** 修改 `tests/apartment-option-display.test.js`、`miniprogram/utils/apartment-display-options.js`。

- [ ] 写失败断言：`3.7元/立方` 显示 `3.7`，`无元/立方` 显示 `无`，`已含元/㎡/月` 显示 `已含`，空值显示空白。
- [ ] 运行 `node --test tests/apartment-option-display.test.js` 并确认失败。
- [ ] 实现仅移除末尾导入单位的显示函数，不改 `costs` 源数据。
- [ ] 重新运行测试并确认通过。

### Task 2: 核验与记录

**Files:** 创建 `logs/2026-07-24-apartment-cost-raw-display.md`。

- [ ] 运行相关全量测试与 `node --check`。
- [ ] 在开发者工具中编译并查看费用页，不执行数据库写入。
