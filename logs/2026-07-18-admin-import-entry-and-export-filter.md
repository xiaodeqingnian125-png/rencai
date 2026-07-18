# 2026-07-18 管理页导入历史入口 + 按条件导出 UI

## 任务

阶段 4 任务 18：升级管理页 `miniprogram/pages/admin/index.{wxml,wxss}`，在公寓/户型管理区新增"导入历史"入口，并在公寓管理区新增按区域/状态筛选的导出 UI。

## 改动

- 修改 `miniprogram/pages/admin/index.wxml`（+16 行）
  - 公寓管理区（`isApartment` 分支）：在 `bulk-bar` 与 `apartment-scroll` 之间新增两块
    - `<view class="admin-action-row">`：内含 `<button class="admin-btn" bindtap="goImportHistory" data-type="apartments">导入历史</button>`
    - `<view class="export-filter">`：包含 `filter-label`、两个 `picker`（区域/状态）、`export-btn`，对应 `onDistrictChange`/`onStatusChange`/`exportFiltered` 三个交互
  - 户型管理区（`isRoom` 分支）：在 `room-bulk-bar` 与 `room-scroll` 之间新增
    - `<view class="admin-action-row">`：内含 `<button class="admin-btn" bindtap="goImportHistory" data-type="room_types">导入历史</button>`
  - 其它分支（活动/服务/物品/评论/用户）保持不变，导入入口仅在公寓与户型页显示

- 修改 `miniprogram/pages/admin/index.wxss`（+49 行）
  - 文件末尾追加任务 18 专用样式块，沿用 admin 页配色（#fffdf7 卡片底 / #e8723c 主色 / #8c7a68 次要文字 / #f0eae0 边框）
  - `.admin-action-row`：横向 flex，gap 12rpx，padding 16rpx 32rpx
  - `.admin-btn`：flex 1，高 64rpx，圆角 32rpx，描边按钮（白底 + #e8723c 边框 + #e8723c 文字）
  - `.export-filter`：横向 flex + flex-wrap，padding 16rpx 32rpx
  - `.filter-label`：24rpx 次要文字色
  - `.filter-picker`：8rpx 20rpx 内边距，浅描边圆角小卡片
  - `.export-btn`：8rpx 24rpx 内边距，#e8723c 实心按钮

## 设计决策

1. **导入入口仅置于公寓/户型两个分支**：简报明确要求"导入入口应只在公寓和户型管理页显示"。WXML 中 `wx:if="{{isApartment}}"` 和 `wx:elif="{{isRoom}}"` 自然限定作用域，其它管理页（活动/服务/物品/评论/用户）不会渲染这两个入口。
2. **`data-type` 取值与云端约定对齐**：公寓用 `apartments`，户型用 `room_types`（而非客户端 configs 的 `rooms`），与 `cloudfunctions/rencai/lib/import-task.js` 中 `target_type` 字段、`import-history/index.wxml` 中 tab 切换值保持一致，便于后续 `goImportHistory` 跳转时传参。
3. **按条件导出 UI 仅置于公寓区**：简报步骤 2 仅在"公寓管理区域"新增筛选和导出 UI，户型区不加。
4. **样式遵循 admin 现有设计语言**：圆角 8rpx/32rpx 与 `bulk-btn`、`apartment-btn` 一致；色彩沿用 `#e8723c` 主色 + `#fffdf7` 卡片底，无新色板。

## 与简报的偏差

无。严格按简报步骤 1-3 实现 WXML + WXSS，未越界修改 JS。

## 关切点

1. **WXML 引用的 4 个 handler 与 4 个 data 字段尚未在 `index.js` 中实现**：
   - handlers：`goImportHistory`、`onDistrictChange`、`onStatusChange`、`exportFiltered`
   - data 字段：`districtOptions`、`statusOptions`、`exportDistrictIndex`、`exportStatusIndex`
   - 当前状态下，点击"导入历史"/"导出"按钮或 picker 时会有控制台告警，但页面不会崩溃
   - picker 的 range 为 undefined 时回退显示"全部区域"/"全部状态"
   - 本任务严格遵循简报范围（仅 WXML/WXSS），handler 与 data 字段应在后续任务（如任务 19/20）补齐
2. **简报的验证命令 `node -c miniprogram/pages/admin/index.js` 只能保证 JS 语法正确**：未修改 JS，验证通过仅说明现有 JS 仍可解析，不能验证 WXML 中引用的 handler 是否存在。这是 SDD 分阶段交付的预期行为。

## 验证

```bash
$ node -c miniprogram/pages/admin/index.js
SYNTAX_OK
```

exit code 0，无任何错误输出。

`git diff --stat` 显示本次提交仅涉及两个文件：
```
miniprogram/pages/admin/index.wxml | 16 +++++++++++++
miniprogram/pages/admin/index.wxss | 49 ++++++++++++++++++++++++++++++++++++++
2 files changed, 65 insertions(+)
```

## 提交

- 5f6448c feat(admin): 导入历史入口 + 按条件导出 UI
- 分支：feat/csv-import-export
