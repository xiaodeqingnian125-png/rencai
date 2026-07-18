# 2026-07-17 微信授权登录与管理员权限控制

## 背景

此前 `app.js` 只有空 `onLaunch`，无任何登录逻辑，用户身份固定为 `u_current`。需要实现：
- 微信授权登录（昵称 + 手机号）
- 普通用户登录后看不到管理员模块
- 特定用户（昵称"晓邱" + 手机号"17739768562"）登录后显示管理员权限
- "我的"页顶部增加管理员小标识

## 改动范围

### 数据层

- `data/mock-store.js`：新增用户登录与身份识别
  - `loginOrCreateUser(openid, nickname, phone)` — 按 openid 查找或创建用户，判定管理员身份
  - `getUserByOpenid(openid)` — 按 openid 查询用户
  - `isUserAdmin(userId)` — 检查用户是否为管理员
  - 管理员判定条件：昵称为"晓邱"且手机号为"17739768562"，两者必须同时匹配
  - 新用户字段：`openid`、`role`（admin/tenant）、`role_label`（管理员/住户）
- `data/queries.js`：暴露 `loginUser`、`getUserInfoByOpenid`、`checkIsAdmin`

### 应用入口

- `app.js`：重写为完整登录管理
  - `globalData`：`userInfo`、`isLoggedIn`、`isAdmin`、`openid`、`userId`
  - `onLaunch` → `restoreLogin()`：从本地缓存恢复登录态
  - `login(nickname, phone)`：模拟 openid 生成，调用数据层登录，持久化到 `wx.setStorageSync`
  - `logout()`：清除 globalData 和本地缓存

### 登录组件（新增）

- `components/login-modal/`：可复用的登录弹窗组件
  - 输入昵称 + 手机号（11位）
  - 校验后调用 `app.login()`，触发 `loginsuccess` 事件
  - 支持"暂不登录"取消

### 页面改动

| 页面 | 改动 |
|------|------|
| `profile` | 用户卡片点击触发登录；登录后显示昵称/状态；`wx:if="{{isAdmin}}"` 控制管理员面板显示；头像旁增加"管理员"标识徽章（深色渐变背景 + 金色文字）；未登录时隐藏管理员面板；菜单项未登录时弹登录窗 |
| `activity-detail` | 报名前检查登录，未登录弹登录窗；登录后用 `app.globalData.userId` 替代固定用户 ID |
| `apartment-detail` | 收藏/评论/点赞前检查登录；同上用户 ID 切换 |
| `room-detail` | 同 apartment-detail |
| `item-detail` | 借用申请前检查登录；同上 |
| `item-publish` | 进入页面即检查登录，未登录弹窗，取消则返回上一页 |
| `roommate` | 发帖前检查登录；`submitPost` 用动态 userId |
| `service-detail` | 下单前检查登录；同上 |

所有 7 个写操作页面的 `.json` 均注册了 `login-modal` 组件，`.wxml` 末尾均添加了 `<login-modal>` 元素。

### 样式

- `profile/index.wxss`：
  - `.user-avatar.admin-avatar`：管理员头像深色渐变背景 + 橙色边框
  - `.user-name-row`：昵称与标识横向排列
  - `.admin-badge`：管理员标识徽章，深色渐变背景 + 金色文字 + 圆角

## 权限控制效果

| 场景 | 游客 | 普通用户 | 管理员（晓邱） |
|------|------|---------|--------------|
| 浏览首页公寓 | ✅ | ✅ | ✅ |
| 查看公寓/户型详情 | ✅ | ✅ | ✅ |
| 报名/评论/收藏/借用 | 弹登录窗 | ✅ | ✅ |
| "我的"页用户信息 | 显示"点击登录" | 显示昵称 | 显示昵称 |
| "我的"页管理员标识 | 不显示 | 不显示 | ✅ 深色徽章 |
| "我的"页管理员面板 | 不显示 | 不显示 | ✅ 可展开 |
| 进入管理员页面 | — | 提示"仅管理员可访问" | ✅ |

## 验证

- 全量 JS 语法检查通过
- Node 冒烟测试覆盖：
  - 普通用户登录 → tenant 角色
  - 管理员登录（晓邱 + 17739768562）→ admin 角色
  - 仅昵称匹配 → tenant（非管理员）
  - 仅手机号匹配 → tenant（非管理员）
  - 重复登录同一 openid → 更新信息不创建新用户
  - `isUserAdmin` / `getUserByOpenid` 正常返回

## 约束

- 当前 openid 为模拟生成（真实环境需用 `wx.login` 获取 code 换 openid）
- 登录态持久化在 `wx.setStorageSync`，重新编译后保留登录态但 mock 数据会重置
- 手机号目前为手动输入，真实环境应使用微信手机号快速验证组件
