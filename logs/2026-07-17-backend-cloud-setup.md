# 2026-07-17 后端接入：云开发基础设施搭建

## 背景

项目此前完全运行在 mock 数据层上（tables.js → mock-store.js → queries.js → 页面），无真实后端。本次搭建云开发基础设施，使项目具备一键切换 mock/cloud 模式的能力，不破坏现有功能。

## 架构设计

```
页面 → queries.js → mock-store.js (mock 模式，当前)
                  → db.js → 云函数 rencai (cloud 模式，未来)
```

核心原则：**默认 mock 模式，零破坏**。切换到 cloud 模式只需修改 `db.js` 中 `DATA_MODE = "cloud"` 并配置云环境 ID。

## 改动范围

### 1. 数据访问适配器 `data/db.js`（新增）

统一封装全部 17 个数据操作函数，mock 模式委托 mock-store/queries.js，cloud 模式调用云函数 `wx.cloud.callFunction`。所有函数统一返回 Promise，消除同步/异步差异。

封装的操作：
- 用户：loginUser, getUserByOpenid, isUserAdmin
- 管理员：getAdminDataset, getNextAdminId, saveAdminItem, deleteAdminItem, updateAdminItemStatus, importAdminItems
- 用户侧写操作：registerActivityForUser, submitUserComment, toggleFavoriteForUser, toggleCommentLikeForUser, createBorrowRequestForUser, createBorrowItemForUser, createRoommatePostForUser, createServiceOrderForUser, isActivityRegisteredByUser

### 2. 核心云函数 `cloudfunctions/rencai/`（新增）

镜像 mock-store 全部 API，通过 wx-server-sdk 访问云数据库。包含：

- `loginUser` — 按 openid 查找或创建用户，管理员判定逻辑与 mock 一致
- `getUserByOpenid` / `isUserAdmin` — 用户查询
- `getAdminDataset` / `getNextAdminId` — 管理员数据集读取
- `saveAdminItem` / `deleteAdminItem` / `updateAdminItemStatus` / `importAdminItems` — 管理员 CRUD（含级联删除）
- `registerActivity` — 活动报名（重复检查 + 满员检查 + 人数自增）
- `submitComment` / `toggleFavorite` / `toggleCommentLike` — 评论与互动
- `createBorrowRequest` / `createBorrowItem` / `createRoommatePost` / `createServiceOrder` — 借物/发帖/下单

云函数使用 `cloud.getWXContext()` 自动获取用户 openid，无需客户端传递。

### 3. app.js 更新

- 新增 `initCloud()` — 当 DATA_MODE 为 cloud 且配置了云环境时初始化 `wx.cloud`
- 新增 `loginWithCloud()` — 真实环境通过 `wx.login` 获取 code，调用云函数换取 openid 和用户信息
- 保留 `loginWithMock()` — mock 模式同步登录，逻辑不变
- `login()` 方法根据 `db.isCloudMode()` 自动路由，cloud 失败时降级到 mock
- 登录组件 `onLogin()` 更新为支持同步和 Promise 异步返回

### 4. envList.js 更新

添加云环境配置说明，当前为空数组（mock 模式）。使用云模式时替换为真实环境 ID。

## 验证

- 全量 JS 语法检查通过（miniprogram + cloudfunctions）
- db.js 适配器冒烟测试 17/17 通过（mock 模式）
  - 所有函数正确返回 Promise
  - mock 模式下委托 mock-store/queries.js 结果正确
  - 现有 app.js 登录流程不受影响（仍调用 queries.js 的 loginUser）

## 启用云模式步骤

1. 在微信开发者工具中创建云开发环境
2. 将环境 ID 填入 `miniprogram/envList.js` 的 `envList` 数组
3. 将 `miniprogram/data/db.js` 中 `DATA_MODE` 改为 `"cloud"`
4. 在云开发控制台创建数据库集合（users, apartments, room_types, activities, services, borrow_items, borrow_requests, comments, comment_likes, favorites, activity_registrations, service_orders, roommate_posts, messages）
5. 导入种子数据（可从 supabase/seed.sql 转换）
6. 右键 `cloudfunctions/rencai` → 上传并部署
7. 重新编译小程序，登录时自动使用 wx.login + 云函数

## 约束

- 当前仍为 mock 模式，现有功能零影响
- 云函数已编写完成但未部署（需用户创建云环境后部署）
- 种子数据需手动导入云数据库（mock 种子数据在 tables.js 中）
- 云数据库安全规则需配置为「仅创建者可读写」+ 云函数可读写
