# 2026-07-18 导入预览页

## 任务

阶段 4 任务 17：创建导入预览页 `miniprogram/pages/admin/import-preview/index.{js,wxml,wxss,json}`，承接 import-history 的 `viewTask` 跳转，展示导入任务的预览结果（汇总、错误报告、正常数据预览），并提供"确认导入"操作。

## 改动

- 新建 `miniprogram/pages/admin/import-preview/index.json`（4 行）— 页面配置，导航标题"导入预览"
- 新建 `miniprogram/pages/admin/import-preview/index.wxml`（56 行）— 模板：task-summary（文件名/总计/成功失败统计）+ 错误报告列表 + 正常数据预览列表 + 底部操作栏（previewing 状态显示"取消/确认导入"按钮，completed 状态显示"导入已完成"）
- 新建 `miniprogram/pages/admin/import-preview/index.wxss`（158 行）— 样式：沿用 admin 配色（#fafaf6 底 / #fffdf7 卡片 / #e8723c 主色），成功绿/失败红统计卡，固定底部操作栏，error-row 红色高亮，preview-warning 黄色地理编码警告
- 新建 `miniprogram/pages/admin/import-preview/index.js`（64 行）— 逻辑：onLoad 接收 taskId 并调 `db.getImportTask`；loadTask 渲染 task 与前 20 条 preview_data；confirmImport 调 `db.confirmImport` 成功后重新 loadTask；cancel 返回上一页
- 修改 `miniprogram/app.json` — pages 数组新增 `pages/admin/import-preview/index`（任务 16 留下的待办，本任务补齐）

## 校验

- `node -c miniprogram/pages/admin/import-preview/index.js`：语法检查通过
- `JSON.parse` 校验 `app.json` 与 `index.json`：通过
- `db.getImportTask` / `db.confirmImport` 接口存在（`miniprogram/data/db.js` 第 114、121 行实现，第 249、250 行导出）
- 相对路径 `../../../data/db` 从页面文件解析到 `miniprogram/data/db.js`，正确
- import-history 的 `viewTask` 已跳转至 `/pages/admin/import-preview/index?taskId=`，本页面 onLoad 接收参数对齐

## 与简报的偏差

严格按简报 4 个文件的完整代码创建，无偏差。

## 关切点

1. **`preview_data` 被 `getImportTask` 剥离**：云函数 `getImportTask`（`cloudfunctions/rencai/lib/import-task.js` 第 300 行）返回前通过 `const { csv_content, preview_data, ...safeTask } = task;` 删除了 `preview_data` 字段。导致 `loadTask` 中 `res.task.preview_data` 恒为 `undefined`，"正常数据预览"区块永不渲染。简报任务描述提到"调用 db.previewImport(taskId) 获取预览数据"，但简报代码实际用的是 `db.getImportTask`。本任务严格遵循简报代码未改，建议后续任务调整后端 `getImportTask` 保留 `preview_data`（或前端改调 `previewImport`）。
2. **`success_count` 预览阶段为 0**：云函数 `previewImport`（第 110-119 行）更新任务时未写入 `success_count`，初始创建时为 0。导致预览页"成功"统计与"确认导入（N条）"按钮文案在 previewing 状态下都显示 0。后端 `confirmImport` 完成后会写入真实 `success_count`，故 completed 状态显示正确。属后端 bug，不在本 UI 任务范围。
3. **缺少管理员权限校验**：与任务 16 同样的问题，简报代码未包含 `app.globalData.isAdmin` 校验。遵循简报未追加。
4. **导入成功后未返回历史页**：简报任务描述提到"导入成功后返回历史页"，但简报代码 `confirmImport` 成功后调的是 `this.loadTask()`（重新加载本页以切到 completed 态），未 `navigateBack`。遵循简报代码。

## 提交

- feat(admin): 导入预览页（错误报告+确认导入）
- 分支：feat/csv-import-export
