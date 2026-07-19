# 修复个人信息页退出登录功能 + 硬编码数据问题报告

> 时间：2026-07-19
> 关联：pages/profile-edit/（个人信息页）

## 一、退出功能修复

### 背景

原实现 `pages/profile-edit/index.js:113` 的 `exitApp` 方法调用 `wx.exitMiniProgram()`，存在两个问题：

1. 该接口在开发者工具和预览环境中常失败。
2. 不会清除用户登录态（`globalData` 和本地 `auth_info` 缓存都不动）。

### 修改

#### `miniprogram/pages/profile-edit/index.js`

- 将 `exitApp` 方法保留为废弃空壳（仅调用 `this.logoutAccount()`），避免历史引用报错。
- 新增 `logoutAccount` 方法：
  - `wx.showModal` 确认弹窗，标题 `退出登录`，内容 `确定退出当前账号吗？`。
  - 用户确认后调用 `getApp().logout()`。
  - `app.logout()` 内部已清空 `globalData.openid/userInfo/userId/isLoggedIn/isAdmin`，并移除本地 `auth_info` 缓存。
  - 执行 `wx.switchTab({ url: "/pages/profile/index" })` 跳回个人中心 tab。
- 完全删除 `wx.exitMiniProgram()` 调用。
- 不触碰其他业务缓存（如 `menuGroups`、`adminMenus`、`form`、`apartmentOptions` 等页面级数据）。

#### `miniprogram/pages/profile-edit/index.wxml`

- 按钮文案从 `退出小程序` 改为 `退出登录`。
- 绑定从 `bindtap="exitApp"` 改为 `bindtap="logoutAccount"`。
- 不修改任何样式类名（`exit-btn` 保持不变）。

### 验证

- 语法检查：`node -c miniprogram/pages/profile-edit/index.js` 通过。
- 全局搜索确认 `wx.exitMiniProgram` 在 `miniprogram/` 内已无实际调用（仅保留注释中提及历史实现）。
- 全局搜索确认 `退出小程序` 文案已从 `profile-edit` WXML 中移除。

### 需手动验证项

1. 登录后进入个人信息页 → 点击「退出登录」→ 确认弹窗显示正确文案。
2. 确认退出后：
   - 跳回个人中心 tab。
   - 头像/昵称回到游客状态。
   - 管理员入口消失（普通用户身份下）。
3. 再次操作收藏或评论时，重新弹出登录弹窗。

## 二、硬编码静态数据问题报告

### 发现

`pages/profile-edit/index.js` 的 `data.form` 中存在硬编码的静态用户数据，不随登录用户变化：

| 字段 | 硬编码值 | 位置 |
|---|---|---|
| `nickname` | `"晓得青年"` | `index.js:6` |
| `phone` | `"138****8888"` | `index.js:7` |
| `apartment` | `"郑东人才公寓"` | `index.js:8` |
| `building` | `"3号楼"` | `index.js:9` |
| `avatarText` | `"晓"` | `index.js:12` |

### 问题影响

- 任何用户登录后进入个人信息页，看到的都是同一份静态数据。
- 修改昵称/手机号/楼栋后只更新页面 `data`，不会回写到 `app.globalData.userInfo` 或服务端。
- `saveProfile` 方法只显示 toast「个人信息已保存」，实际没有任何持久化逻辑。
- 与 `pages/profile/index.js` 的实现不一致：profile 页通过 `syncUserState` 正确读取 `app.globalData.userInfo`，而 profile-edit 完全脱节。

### 对比

| 页面 | 数据来源 | 是否动态 |
|---|---|---|
| `pages/profile/index.js` | `app.globalData.userInfo` | 是 |
| `pages/profile-edit/index.js` | 硬编码 `data.form` | 否 |

### 修复建议（本次不实施，待后续任务）

1. `onLoad` / `onShow` 中读取 `app.globalData.userInfo`，填充 `form.nickname/phone/apartment/building/avatarText`。
2. `saveProfile` 调用云函数保存用户信息（扩展 `rencai` 云函数 `updateUserProfile` action）。
3. 保存成功后更新 `app.globalData.userInfo`，保证 profile 页和 profile-edit 页数据一致。
4. 手机号从服务端获取，不前端硬编码。

### 未修改范围

- 本次未修改 `data.form` 的硬编码值，仅报告问题。
- 未修改 `saveProfile` 的持久化逻辑。
- 未修改页面样式。
- 未修改 `pages/profile/index.js`。
