# 2026-07-18 导入历史页

## 任务

阶段 4 任务 16：创建导入历史页 `miniprogram/pages/admin/import-history/index.{js,wxml,wxss,json}`，作为 CSV 导入导出功能的后台 UI 入口。

## 改动

- 新建 `miniprogram/pages/admin/import-history/index.json`（4 行）— 页面配置，导航标题"导入历史"
- 新建 `miniprogram/pages/admin/import-history/index.wxml`（25 行）— 模板：filter-bar（公寓/户型 tab 切换）+ 空态 + task-list（卡片显示文件名、状态、条数、成功/失败数、时间）
- 新建 `miniprogram/pages/admin/import-history/index.wxss`（84 行）— 样式：沿用 admin 配色（#fafaf6 底 / #fffdf7 卡片 / #e8723c 主色），4 种状态徽标色（completed 绿 / previewing 黄 / pending 蓝 / failed 红）
- 新建 `miniprogram/pages/admin/import-history/index.js`（49 行）— 逻辑：onLoad/onShow 调用 `db.listImportTasks(targetType, 1, 50)` 拉取任务列表；switchType 切换 apartments/room_types tab；viewTask 跳转 `/pages/admin/import-preview/index?taskId=`
- 修改 `miniprogram/app.json` — pages 数组新增 `pages/admin/import-history/index`

## 校验

- `node -c miniprogram/pages/admin/import-history/index.js`：语法检查通过
- `JSON.parse` 校验 `index.json` 和 `app.json`：通过
- `db.listImportTasks` 接口存在（任务 13 在 `miniprogram/data/db.js` 第 128 行实现、第 251 行导出）
- 相对路径 `../../../data/db` 从页面文件解析到 `miniprogram/data/db.js`，正确

## 与简报的偏差

简报步骤 5 要求同时在 app.json 注册 `import-history/index` 和 `import-preview/index`。实际仅注册 `import-history/index`，因为 `import-preview/index` 页面尚未创建（任务 17 才创建），登记不存在的页面会导致微信开发者工具编译报错，违反 AGENTS.md "确保在微信开发者工具中可编译运行"约束。任务 17 应同步注册 `pages/admin/import-preview/index`。

## 关切点

1. **缺少管理员权限校验**：现有 `pages/admin/index.js` 有 `app.globalData.isAdmin` 校验，简报的 import-history 代码未包含。本任务严格遵循简报精确代码，未追加。建议后续统一补齐。
2. **下拉刷新未实现**：用户任务描述提到"下拉刷新"，但简报 `index.json` 未设 `enablePullDownRefresh`，`index.js` 也无 `onPullDownRefresh`。当前刷新依赖 `onShow`。遵循简报未追加。
3. **非云模式空态语义**：`db.listImportTasks` 在非云模式返回 `{ok:false}`，页面显示"暂无导入记录"而非错误提示。任务 15 已切换云模式，正常环境不触发。

## 提交

- 14dca2e feat(admin): 导入历史页
- 分支：feat/csv-import-export
- 变更：5 files changed, 163 insertions(+)
