# P0 权限安全修复

> 日期：2026-07-19
> 范围：仅云函数鉴权层，不改页面、不改数据结构、不部署、不调用 initCloud、不迁移数据

## 一、任务目标

根据 `PROJECT-HANDOFF.md` 第 13 节 P0 项，修复以下安全问题：

1. 删除管理员昵称+手机号兜底逻辑
2. 管理员身份只根据当前 OPENID 对应的 users 记录中的 role 字段判断
3. 所有管理员 action 增加服务端鉴权
4. 所有用户写操作不再信任前端传入的 userId
5. initCloud 和迁移接口必须只有管理员可以调用

## 二、修改文件

### 新增

| 文件 | 用途 |
|---|---|
| `cloudfunctions/rencai/lib/auth.js` | 统一身份与权限校验模块，提供 `getCurrentUser` / `isAdmin` / `requireAdmin` / `requireUser` |

### 修改

| 文件 | 修改内容 |
|---|---|
| `cloudfunctions/rencai/index.js` | 1. 删除 `ADMIN_NICKNAME_FALLBACK`/`ADMIN_PHONE_FALLBACK` 硬编码常量；2. 删除 `resolveAdminRole` 旧函数；3. 删除 `isUserAdmin(userId)` 旧函数；4. 导入 `lib/auth` 模块；5. `loginUser` 改为保留现有 role / 新用户仅 ADMIN_OPENIDS 引导初始化；6. `exports.main` 重构为公开/用户/管理员三组，统一鉴权 |
| `cloudfunctions/rencai/env.js` | 仅更新注释：移除"回退到 nickname+phone"说明，改为说明 ADMIN_OPENIDS 仅用于首次登录引导初始化 |

## 三、受保护 action 清单

### 管理员 action（15 个，需 `requireAdmin`）

统一返回：`{ ok: false, code: "forbidden", message: "无权执行该操作" }`

| action | 用途 |
|---|---|
| `getAdminDataset` | 管理员列表查询 |
| `getNextAdminId` | 下一个 ID |
| `saveAdminItem` | 新增/编辑 |
| `deleteAdminItem` | 删除（带级联） |
| `updateAdminItemStatus` | 改状态 |
| `importAdminItems` | 旧版批量导入 |
| `createImportTask` | 创建导入任务 |
| `previewImport` | 预览导入 |
| `confirmImport` | 确认写入 |
| `getImportTask` | 查任务 |
| `listImportTasks` | 任务列表 |
| `exportAdminItems` | 导出 |
| `migrateApartments` | 导入公寓种子 |
| `migrateRoomTypes` | 导入户型种子 |
| `initCloud` | 一键建集合+导种子 |

### 用户写操作 action（9 个，需 `requireUser`）

统一返回：`{ ok: false, code: "unauthorized", message: "请先登录" }`

调用时用服务端 `auth.user.id` 覆盖前端传入的 `params.userId`：

| action | 用途 |
|---|---|
| `registerActivity` | 活动报名 |
| `submitComment` | 发评论 |
| `toggleFavorite` | 切换收藏 |
| `toggleCommentLike` | 切换点赞 |
| `createBorrowRequest` | 借用申请 |
| `createBorrowItem` | 发布物品 |
| `createRoommatePost` | 发布帖子 |
| `createServiceOrder` | 下服务订单 |
| `isActivityRegistered` | 查是否已报名 |

### 公开 action（3 个，无需鉴权）

| action | 说明 |
|---|---|
| `loginUser` | 登录/注册，用 `wxContext.OPENID` |
| `getUserByOpenid` | 恢复登录态，用 `wxContext.OPENID` |
| `getPhoneByCode` | code 换手机号，调 openapi |

### 身份查询 action（1 个）

| action | 说明 |
|---|---|
| `isUserAdmin` | 改用 `getCurrentUser(wxContext)` + `isAdmin(user)`，不再接受前端 `userId` 参数 |

## 四、管理员身份判定规则

### 身份校验（`requireAdmin`）

唯一依据：`users.role === "admin"`

```
requireAdmin(wxContext)
  → openid = wxContext.OPENID
  → user = getCurrentUser(openid)  // 查 users 集合
  → isAdmin = user && user.role === "admin"
  → 非 admin → { ok: false, code: "forbidden" }
```

### 角色初始化（`loginUser`，仅写入用，不用于校验）

```
loginUser(openid, nickname, phone)
  → 已有用户：保留 existing.role（不覆盖）
  → 新用户：默认 "tenant"
  → 新用户 + openid 在 ADMIN_OPENIDS 中：引导为 "admin"
```

### ADMIN_OPENIDS 的作用

- 位于 `env.js`（已 gitignore，不提交到仓库）
- **仅用于首次登录时引导初始化**：新用户首次登录时若 openid 在白名单中，自动创建 `role="admin"` 的 users 记录
- **不直接用于身份校验**：`requireAdmin` 只查 `users.role`，不查 `ADMIN_OPENIDS`
- 留空时：需在云数据库控制台手动将 `users.role` 设为 `"admin"`

### 已移除的危险逻辑

| 旧逻辑 | 风险 | 状态 |
|---|---|---|
| `ADMIN_NICKNAME_FALLBACK = "晓邱"` | 任何用户输入该昵称即获管理员权限 | 已删除 |
| `ADMIN_PHONE_FALLBACK = "17739768562"` | 硬编码手机号泄露 + 伪造风险 | 已删除 |
| `resolveAdminRole` 的 nickname+phone 兜底分支 | 身份伪造 | 已删除 |
| `isUserAdmin(userId)` 接受前端 userId | 任意用户可查询他人 admin 状态 | 已改为用 OPENID |
| `saveAdminItem` 等管理员 action 无鉴权 | 任意用户可增删改全部数据 | 已加 `requireAdmin` |
| `registerActivity` 等用 `params.userId` | 身份伪造 | 已用服务端 `auth.user.id` 覆盖 |

## 五、兼容性

以下功能未改动，保持原状：

- `loginUser`：仍用 `wxContext.OPENID`，返回格式不变（`{ ok, user, isNew }`）
- `getUserByOpenid`：仍用 `wxContext.OPENID`
- `getPhoneByCode`：仍调 `cloud.openapi.phonenumber.getPhoneNumber`
- `app.restoreLoginWithCloud`：调 `getUserByOpenid`，不受影响
- `app.logout`：纯前端操作，不受影响

## 六、测试方法

### 普通用户测试

部署云函数后，用普通用户（users.role 不是 "admin"）调用：

```js
// 云函数测试面板 event
{ "action": "getAdminDataset", "type": "apartments" }
// 预期返回
{ "ok": false, "code": "forbidden", "message": "无权执行该操作" }

{ "action": "initCloud" }
// 预期返回
{ "ok": false, "code": "forbidden", "message": "无权执行该操作" }

{ "action": "registerActivity", "activityId": 1, "userId": 999, "name": "test", "phone": "13800000000" }
// 预期：用服务端 userId（非 999）创建报名记录
```

### 管理员测试

1. 在云数据库控制台手动将某 users 记录的 `role` 设为 `"admin"`
2. 用该用户 openid 调用：

```js
{ "action": "getAdminDataset", "type": "apartments" }
// 预期返回公寓列表数据

{ "action": "initCloud" }
// 预期返回 { ok: true, collections: {...}, seed: {...} }
```

### 未登录测试

```js
// 云函数测试面板（无 OPENID）
{ "action": "registerActivity", "activityId": 1 }
// 预期返回
{ "ok": false, "code": "unauthorized", "message": "请先登录" }

{ "action": "saveAdminItem", "type": "apartments", "item": {...} }
// 预期返回
{ "ok": false, "code": "unauthorized", "message": "请先登录" }
```

## 七、是否需要重新部署 rencai

**需要重新部署。**

本次修改了 `cloudfunctions/rencai/index.js` 和新增 `cloudfunctions/rencai/lib/auth.js`，必须：

1. 在微信开发者工具右键 `cloudfunctions/rencai` → "上传并部署：云端安装依赖"
2. 部署后鉴权才生效

**本次任务未执行部署。**

## 八、验证清单

- [x] 所有 JS 语法检查通过（`node --check`）
- [x] 所有 JSON 解析检查通过
- [x] `ADMIN_NICKNAME_FALLBACK` / `ADMIN_PHONE_FALLBACK` / `17739768562` / `晓邱` 全部从代码中移除
- [x] `resolveAdminRole` 旧函数无残留引用
- [x] `isUserAdmin(userId)` 旧函数无残留引用
- [x] 15 个管理员 action 全部经过 `requireAdmin`
- [x] 9 个用户写操作全部经过 `requireUser` 并用服务端 userId 覆盖
- [x] `loginUser` / `getUserByOpenid` / `getPhoneByCode` 保持兼容
- [x] 未修改页面代码
- [x] 未修改数据结构
- [x] 未部署云函数
- [x] 未调用 initCloud
- [x] 未迁移数据
- [x] 未提交 Git
- [x] 未 Push

## 九、后续注意事项

1. **首次部署后需手动设置管理员**：由于 `ADMIN_OPENIDS` 为空，新用户登录后 role 都是 "tenant"。需在云数据库控制台手动将管理员账号的 `users.role` 设为 `"admin"`，否则无人能调用 `initCloud` 等管理员 action。

2. **`initCloud` 现在需要管理员身份**：首次部署后若没有任何管理员 users 记录，`initCloud` 将无法调用。解决方案：
   - 方案 A：先在 `env.js` 的 `ADMIN_OPENIDS` 填入真实 OPENID，部署后登录一次自动创建 admin 用户
   - 方案 B：先手动创建 users 集合并插入一条 `role="admin"` 的记录

3. **前端 `admin/index.js` 的客户端 `isAdmin` 拦截保留**：作为第一道防线，但真正的安全保障在服务端。
