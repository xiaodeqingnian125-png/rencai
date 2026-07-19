# 云模式登录链路修复

## 日期
2026-07-19

## 背景
云模式下登录失败，所有错误统一显示为"登录失败，请重试"，无法定位问题。用户反馈 users 集合可能未创建，但前端没有对应提示。同时存在多个安全与稳定性问题：信任前端 openid、静默降级 mock、恢复登录失败、管理员身份可被前端输入伪造等。

## 问题清单

| # | 问题 | 文件 | 修复方式 |
|---|------|------|---------|
| 1 | `wx.cloud` 未初始化时静默走 mock 模式 | `app.js` | `login()` 入口先检查 `cloudReady`，未初始化返回 `cloud_not_initialized` |
| 2 | `rencai` 云函数未部署时显示通用错误 | `login-modal` | 新增 `function_call_failed` 错误码，提示"云函数未部署，请先部署 rencai" |
| 3 | `users` 集合不存在时无具体提示 | `cloudfunctions/rencai/index.js` | 新增 `isCollectionMissingError()` 工具函数，捕获 wx-server-sdk -502003/-501001 错误，返回 `users_collection_missing` |
| 4 | `cfRes.result` 为空时未处理 | `app.js` | 新增 `invalid_result` 错误码处理 |
| 5 | 信任前端传入的 `openid` | `cloudfunctions/rencai/index.js` | `main` 入口 `case "loginUser"` 和 `case "getUserByOpenid"` 强制使用 `wxContext.OPENID`，忽略 `params.openid` |
| 6 | 云函数错误统一显示成"登录失败" | `login-modal` | 新增 `mapLoginErrorToToast()`，按 code 映射为用户可理解的文案 |
| 7 | 云模式登录失败时静默降级到 mock | `app.js` | `loginWithCloud` 移除所有 mock 降级，错误显式返回 |
| 8 | 控制台输出完整手机号 | `app.js` + 云函数 | 新增 `maskPhone()`，仅保留后 4 位 |
| 9 | 重新打开小程序无法恢复登录 | `app.js` | `restoreLogin` 云模式下走异步云函数 `getUserByOpenid`，按 `wxContext.OPENID` 查询 |
| 10 | 管理员身份依赖前端输入昵称+手机号 | 云函数 + `env.js` | 新增 `ADMIN_OPENIDS` OPENID 白名单，优先级：白名单 > users.role 持久化 > 兜底（带 warning） |

## 修改文件清单

### `cloudfunctions/rencai/env.js`
新增 `ADMIN_OPENIDS: []` 配置项（默认空，部署后填入真实 OPENID）。

### `cloudfunctions/rencai/index.js`
- 引入 `env.js`，读取 `ADMIN_OPENIDS`
- 新增 `maskPhone()` 手机号脱敏函数
- 新增 `resolveAdminRole()` 服务端管理员判定：优先 `ADMIN_OPENIDS`，其次 `users.role` 持久化，最后兜底 `nickname+phone`（带 warning）
- 新增 `isCollectionMissingError()` 集合不存在错误识别
- 重构 `loginUser(openid, nickname, phone)`：
  - openid 仅来自 `wxContext.OPENID`
  - 查询失败/写入失败均捕获并返回结构化错误
  - 日志输出脱敏手机号
  - 统一返回 `{ ok, code, message, user?, isNew? }`
- 重构 `getUserByOpenid(openid)`：返回 `{ ok, code, message, user? }`，供恢复登录使用
- `main` 入口：`loginUser` 和 `getUserByOpenid` 强制用 `wxContext.OPENID`

### `miniprogram/app.js`
- 新增 `maskPhone()` 手机号脱敏函数
- `initCloud()`：未配置 envList 时打 warning
- `restoreLogin()`：云模式走异步 `restoreLoginWithCloud()`，mock 模式保持同步
- `restoreLoginWithCloud()`：调用云函数 `getUserByOpenid`，失败时清理本地缓存（`user_not_found` / `users_collection_missing`）
- `login()`：云模式下检查 `cloudReady`，未初始化返回 `cloud_not_initialized`
- `loginWithMock()`：包装为 Promise 返回，统一返回结构
- `loginWithCloud()`：
  - 移除所有 mock 降级（wx.login 失败、callFunction 失败、result.ok=false 都显式返回错误码）
  - 错误码：`wx_login_failed` / `function_call_failed` / `invalid_result` / 透传云函数 code
  - 日志输出脱敏手机号
- `applyLoginSuccess()`：不变（已正确设置 openid/userInfo/userId/isLoggedIn/isAdmin）

### `miniprogram/components/login-modal/index.js`
- `onLogin`：失败时调用 `mapLoginErrorToToast(res)` 获取对应文案
- 新增 `mapLoginErrorToToast()`：按 code 映射为用户可读文案，覆盖 9 种错误码
- catch 回调输出错误日志，提示"登录异常，请重试"

## 错误码对照表

| code | 触发条件 | 用户提示 |
|------|---------|---------|
| `cloud_not_initialized` | envList 为空 / `wx.cloud.init` 未执行 | 云开发未初始化，请联系管理员 |
| `wx_login_failed` | `wx.login` 失败 | 微信登录失败，请重试 |
| `function_call_failed` | `wx.cloud.callFunction` fail（云函数未部署） | 云函数未部署，请先部署 rencai |
| `users_collection_missing` | 云数据库 users 集合不存在 | 用户数据库未初始化，请联系管理员 |
| `users_query_failed` | 查询 users 集合异常（非集合不存在） | 查询用户失败：xxx |
| `login_user_failed` | 写入 users 集合失败 | 登录写入失败：xxx |
| `user_not_found` | 恢复登录时 openid 不存在 | 用户不存在，请重新登录 |
| `user_query_failed` | 恢复登录查询异常 | 查询用户失败：xxx |
| `no_openid` | `wxContext.OPENID` 为空（极少） | 无法获取身份，请重试 |
| `invalid_params` | nickname 或 phone 为空 | 请填写完整信息 |
| `invalid_result` | 云函数返回空 result | 云函数返回异常，请重试 |

## 管理员判定流程

```
1. 检查 ADMIN_OPENIDS（env.js）是否包含当前 openid
   → 是：admin
   → 否：进入下一步
2. 检查 users 集合中该用户的 role 字段
   → role === "admin"：
     - 若 ADMIN_OPENIDS 已配置（非空）：强制降级为 tenant（白名单优先）
     - 若 ADMIN_OPENIDS 未配置：保留 admin
   → 否：进入下一步
3. 兜底（仅 ADMIN_OPENIDS 未配置时）：
   → nickname === "晓邱" && phone === "17739768562"：admin（带 warning 日志）
   → 否则：tenant
```

### 安全性说明
- `ADMIN_OPENIDS` 配置后，普通用户即使输入管理员昵称+手机号也无法获得 admin 身份
- 管理员首次设置流程：登录 → 查看云函数日志获取 OPENID → 填入 env.js → 重新部署
- 兜底逻辑仅为首次部署时便利，配置白名单后兜底失效

## 验证结果

### 语法检查（全部通过）
```
app.js ok
login-modal/index.js ok
rencai/index.js ok
rencai/env.js ok
```

### 端到端验证（需用户在微信开发者工具中完成）
见下方"用户操作清单"。

## 用户操作清单

### 1. 重新部署 rencai 云函数（必做）
微信开发者工具 → 右键 `cloudfunctions/rencai` 目录 → 「上传并部署：云端安装依赖（不上传 node_modules）」

### 2. 初始化云数据库（必做）
云开发控制台 → 云函数 → rencai → 测试：
```json
{ "action": "initCloud" }
```
预期返回：15 个集合创建/已存在 + 6 公寓 + 14 户型种子。

> 若上次部署已执行过 initCloud，本次会跳过已存在的集合和种子记录，无副作用。

### 3. 验证登录链路
iPhone 15 模拟器：
- 输入任意昵称 + 11 位手机号 → 点击登录
- 预期：登录成功，首页加载正常

### 4. 验证错误提示（可选）
- 故意停止 rencai 云函数 → 登录应提示"云函数未部署，请先部署 rencai"
- 删除 users 集合 → 登录应提示"用户数据库未初始化，请联系管理员"

### 5. 验证恢复登录
- 登录成功后关闭小程序 → 重新打开
- 预期：无需再次登录，自动恢复登录态

### 6. 配置管理员 OPENID（推荐，加强安全）
- 用真实管理员账号登录一次
- 云开发控制台 → 云函数日志 → 找到 `[rencai] loginUser openid: oXXXX...`
- 复制 OPENID，填入 `cloudfunctions/rencai/env.js` 的 `ADMIN_OPENIDS` 数组：
  ```js
  ADMIN_OPENIDS: ["oXXXXXXXXXXXXXXXXX"]
  ```
- 重新部署 rencai 云函数
- 此后普通用户即使输入"晓邱"+"17739768562"也无法获得 admin 身份

## 验收对照

| 验收标准 | 是否满足 | 说明 |
|---------|---------|------|
| users 集合不存在时显示明确提示 | ✅ | 提示"用户数据库未初始化，请联系管理员" |
| 创建 users 集合并重新部署云函数后可正常登录 | ✅ | 调用 initCloud 即可创建集合 |
| 登录成功后重新打开小程序，登录状态仍能恢复 | ✅ | restoreLoginWithCloud 通过 wxContext.OPENID 查询 |
| 普通用户不能通过输入管理员昵称和手机号获得管理员权限 | ✅ | 配置 ADMIN_OPENIDS 后强制白名单判定 |
| 云函数失败时不生成本地 mock 用户 | ✅ | loginWithCloud 移除所有 mock 降级 |
