# 2026-07-18 登录窗口样式统一与微信手机号获取修复

## 背景

两个问题：
1. 登录窗口中手机号输入框（button 伪装）的尺寸、字体与上方昵称输入框不一致
2. 点击「点击获取微信手机号」选择绑定手机号后，输入框为空并跳到手动输入模式，无法登录

## 问题根因

### 样式问题

`.phone-wechat-btn` 虽然加了 `.field-input` class，但因为是 `<button>` 元素，UA 默认样式覆盖了 class 中的 `height`、`padding`、`font-size`，导致视觉上比昵称输入框矮、字体小。

### 登录失败问题

微信安全策略：`getPhoneNumber` 回调中 `e.detail.phoneNumber` 不再直接返回真实手机号（开发者工具和真机均如此），需要用 `e.detail.code` 通过服务端接口 `phonenumber.getPhoneNumber` 换取。

原代码只检查 `e.detail.phoneNumber`，在开发工具中该字段为空，于是走降级分支切换到手动输入模式。

参考：[微信官方文档 - 获取手机号](https://developers.weixin.qq.com/miniprogram/dev/server/API/user-info/phone-number/api_getphonenumber)

## 改动内容

### 1. 样式统一（`components/login-modal/index.wxss`）

`.phone-wechat-btn` 显式覆盖 button UA 默认样式，与 `.field-input` 完全一致：
- `height: 88rpx`
- `padding: 0 24rpx`
- `font-size: 30rpx`
- `box-sizing: border-box`

### 2. 云函数新增 `getPhoneByCode`（`cloudfunctions/rencai/index.js`）

新增 `getPhoneByCode(code)` 函数：
- 调用 `cloud.openapi.phonenumber.getPhoneNumber({ code })` 换取真实手机号
- 返回 `{ ok: true, phoneNumber }` 或 `{ ok: false, error }`
- 在 switch case 中注册 `getPhoneByCode` action

### 3. 客户端登录流程修复（`components/login-modal/index.js`）

重写 `onGetPhoneNumber` 方法：
1. 校验 `e.detail.errMsg === "getPhoneNumber:ok"`
2. 取 `e.detail.code`，无 code 则降级手动输入
3. 检查 `app.globalData.cloudReady`，云开发未初始化（mock 模式）降级手动输入
4. 调用云函数 `rencai` 的 `getPhoneByCode` action 换取手机号
5. 换取成功：填入 phone + toast 提示，若昵称已填则自动调用 `onLogin()` 完成登录
6. 换取失败：降级手动输入

## 验证步骤

1. **重新部署云函数**：在微信开发者工具中右键 `cloudfunctions/rencai` → 上传并部署
2. 编译小程序，打开登录窗口
3. 检查手机号输入框样式是否与昵称输入框一致（高度、字体）
4. 填写昵称后点击「点击获取微信手机号」
5. 弹窗选择绑定的手机号
6. 预期：手机号自动填入，并自动触发登录（因昵称已填）

## 影响范围

- `miniprogram/components/login-modal/index.wxss` — 样式修复
- `miniprogram/components/login-modal/index.js` — 登录流程修复
- `cloudfunctions/rencai/index.js` — 新增云函数 action（需重新部署）

## 注意事项

- **云函数必须重新部署**才能生效，否则 `getPhoneByCode` action 会返回 `unknown_action`
- `phonenumber.getPhoneNumber` 接口要求小程序已完成微信认证（企业主体），个人主体不可用
- mock 模式（未配置云环境）下自动降级为手动输入，不影响开发
