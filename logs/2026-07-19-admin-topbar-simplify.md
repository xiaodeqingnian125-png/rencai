# 管理页顶部功能区精简

日期：2026-07-19
分支：feat/mvp-launch

## 背景

公寓管理页和户型管理页顶部功能按键混乱（4-5 行按钮），需要精简为 2 行。

## 改动

### 1. 公寓管理页（apartments）

顶部从 4 行精简为 2 行：
- 第 1 行：搜索框 + ＋新增图标按钮（橙色圆形）
- 第 2 行：批量导出 · 批量导入 · 导入历史（三等分）

移出顶部的功能：
- 「下载模板」→ 并入「批量导入」ActionSheet（选择"下载导入模板"或"选择 CSV 文件导入"）
- 「按条件导出」（区域/状态/导出）→ 并入「批量导出」弹窗（点击批量导出后弹出条件筛选面板）

### 2. 户型管理页（rooms）

- 删除顶部项目筛选标签栏（room-filter-scroll）
- 新增搜索框（原先无）
- 顶部从 4 行精简为 2 行（与公寓页一致）
- 「下载模板」同样并入「批量导入」ActionSheet
- 户型页批量导出直接导出全部（无条件筛选，与原行为一致）

### 3. 新增导出弹窗

公寓页点击「批量导出」弹出条件筛选弹窗：
- 区域 picker（全部区域/郑东新区/...）
- 状态 picker（全部状态/active/hidden）
- 取消 / 导出 按钮

### 4. 样式

- 新增 `.add-icon-btn`（76rpx 橙色圆角方形图标按钮）
- 新增 `.room-search`（与 `.apartment-search` 一致的搜索框样式）
- `.room-toolbar` 改为 flex 行布局
- 新增 `.export-card` / `.export-panel-body` / `.export-panel-row`（导出弹窗样式）
- 复用现有 `.modal-mask` / `.modal-head` / `.modal-title` / `.modal-actions` / `.modal-btn` / `.filter-picker`
- 配色不变：背景 #fafaf6 / 卡片 #fffdf7 / 主色 #e8723c / 主文字 #2d2318 / 辅助文字 #8c7a68 / 边框 #f0eae0

## 修改文件

- `miniprogram/pages/admin/index.wxml`：公寓/户型顶部 4 行→2 行，新增导出弹窗
- `miniprogram/pages/admin/index.wxss`：新增图标按钮/搜索框/导出弹窗样式
- `miniprogram/pages/admin/index.js`：新增 `exportPanelOpen` data、`openExportPanel`/`closeExportPanel` 方法，`openImport` 增加 ActionSheet，`exportFiltered` 先关弹窗

## 静态检查

- `node --check` index.js 通过
- `index.json` 解析通过
- `git diff --check` 无空白错误
- WXML 事件绑定全部对应 JS 方法
- 旧元素（room-filter-scroll / export-filter / admin-action-row / downloadTemplate / room-add）全部清除
- 分支：feat/mvp-launch

## 保留功能

- 条件导出（区域/状态筛选）通过弹窗保留，符合"导出必须支持区域和状态条件筛选"约束
- 下载模板通过 ActionSheet 保留
- 列表卡片样式、编辑/删除按钮、状态标签、底部 tabBar 全部不变
