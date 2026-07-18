# 2026-07-18 云开发初始化逻辑解耦与手机号获取配置指南

## 背景

登录窗口点击「获取微信手机号」→ 弹窗选择绑定手机号 → 点击允许后，仍提示"请手动输入手机号"。

根因：`app.js` 的 `initCloud()` 条件为 `db.isCloudMode() && envList.envList.length > 0`，要求 `DATA_MODE === "cloud"` 且配置了云环境 ID 才会初始化云开发。但当前项目 `DATA_MODE = "mock"`，导致 `cloudReady` 始终为 `false`，`onGetPhoneNumber` 直接走降级分支。

## 改动内容

### `miniprogram/app.js` — 解耦云开发初始化条件

将 `initCloud()` 的条件从：
```js
if (db.isCloudMode() && envList.envList.length > 0)
```
改为：
```js
if (envList.envList.length > 0)
```

**含义**：只要配置了云环境 ID，就初始化云开发（`wx.cloud.init`），使 `cloudReady = true`，手机号获取等云能力可用。数据层模式（mock/cloud）由 `db.js` 的 `DATA_MODE` 单独控制，互不影响。

这样你可以保持 `DATA_MODE = "mock"`（公寓列表、评论等仍用本地 mock 数据），同时手机号获取走云函数。

## 用户需手动完成的操作步骤

### 1. 创建云开发环境

1. 打开微信开发者工具
2. 点击工具栏「云开发」按钮（云朵图标）
3. 首次使用会提示开通，点击「开通」
4. 创建一个环境，输入名称（如 `rencai-dev`），选择免费配额
5. 创建完成后，在环境列表中复制**环境 ID**（一串类似 `rencai-dev-0g12345678` 的字符串）

### 2. 填入环境 ID

打开 `miniprogram/envList.js`，把环境 ID 填入数组：

```js
const envList = ["你的环境ID"];  // 替换为实际环境 ID
```

### 3. 部署云函数

1. 在开发者工具左侧文件树中，找到 `cloudfunctions/rencai` 文件夹
2. **右键** → 「上传并部署：云端安装依赖」
3. 等待上传完成（控制台会提示部署成功）

### 4. 验证

1. 重新编译小程序
2. 打开登录窗口
3. 填写昵称
4. 点击手机号输入框 → 弹出微信手机号授权弹窗
5. 选择绑定的手机号 → 点击允许
6. 预期：手机号自动填入，并自动触发登录

## 注意事项

- `phonenumber.getPhoneNumber` 接口要求小程序已完成微信认证（企业主体）
- 云函数部署后需等待几秒钟生效
- 如果仍失败，检查云开发控制台的云函数日志，查看 `getPhoneByCode` 的报错信息
- `DATA_MODE` 保持 `"mock"` 不变，数据层不受影响
