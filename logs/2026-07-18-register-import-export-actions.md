# 2026-07-18 注册导入任务和导出接口（云函数路由）

## 任务

阶段 3 任务 11：在 `cloudfunctions/rencai/index.js` 中注册 CSV 导入导出相关的 6 个 action 接口，
将任务 10 创建的 `lib/import-task.js` 模块暴露给客户端调用，并新增 `exportAdminItems` 接口用于按条件导出数据。

## 改动

- 修改 `cloudfunctions/rencai/index.js`
  - 顶部新增 `require("./lib/import-task")`，解构出 5 个函数：
    `createImportTask`、`previewImport`、`confirmImport`、`getImportTask`、`listImportTasks`
  - 新增 `exportAdminItems(targetType, filters = {})` 函数，按 `district`/`status` 可选条件查询集合并返回 `{ ok, items }`
  - 在 `exports.main` 的 switch 中新增 6 个 case：
    - `createImportTask`：传入 `event.targetType`/`event.fileName`/`event.csvContent`/`event.operator`
    - `previewImport`：传入 `event.taskId`
    - `confirmImport`：传入 `event.taskId`
    - `getImportTask`：传入 `event.taskId`
    - `listImportTasks`：传入 `event.targetType`/`event.page`/`event.pageSize`
    - `exportAdminItems`：传入 `event.targetType`/`event.filters || {}`

## 步骤 2 说明（getAdminDataset 返回 apartment_code）

简报步骤 2 要求确认 `getAdminDataset` 返回的数据包含 `apartment_code` 字段。
当前实现 `getAdminDataset(type)` 直接 `db.collection(colName).orderBy("id", "desc").get()` 返回全部字段，
云数据库会自动返回文档中存储的所有字段（包括 `apartment_code`），无需额外处理。
只要上游导入/迁移时写入了 `apartment_code`，本接口会原样返回。

## 路由完整性

原有路由全部保持不变（共 21 个 case）：
loginUser, getUserByOpenid, getPhoneByCode, isUserAdmin,
getAdminDataset, getNextAdminId, saveAdminItem, deleteAdminItem,
updateAdminItemStatus, importAdminItems,
registerActivity, submitComment, toggleFavorite, toggleCommentLike,
createBorrowRequest, createBorrowItem, createRoommatePost,
createServiceOrder, isActivityRegistered,
migrateApartments, migrateRoomTypes。

新增 6 个 case 后，总计 27 个 action 路由，`default` 分支仍兜底返回 `{ ok: false, error: "unknown_action" }`。

## 验证

```bash
$ node -c cloudfunctions/rencai/index.js
SYNTAX_OK
```

exit code 0，无任何错误输出。

## 提交

- feat(cloud): 注册导入任务和导出接口
- 分支：feat/csv-import-export
