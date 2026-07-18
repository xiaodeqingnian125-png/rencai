# 登录界面昵称和手机号原生授权改造

**日期**: 2026-07-17
**影响范围**: `components/login-modal/` 组件

## 改动概述

移除登录弹窗中手机号字段右侧的「一键获取」按钮，改为点击输入框本身即触发微信授权获取。

## 改动详情

### 昵称输入（index.wxml）
- `<input type="text">` 改为 `<input type="nickname">`
- 微信原生组件，点击后键盘上方自动显示用户微信昵称供快速填充，也可手动输入

### 手机号输入（index.wxml + index.js）
- 移除 `phone-row`（input + button 并排布局）和「一键获取」按钮
- 新增 `phoneInputMode` 状态（`'wechat'` / `'manual'`），默认 `'wechat'`
- **微信获取模式**：用 `<button open-type="getPhoneNumber">` 伪装成输入框样式，placeholder 显示「点击获取微信手机号」，点击触发微信授权
- **手动输入模式**：真实 `<input type="number">` 输入框，授权失败或用户主动切换时使用
- 底部新增切换文字链接：「无法获取？手动输入」/「使用微信获取」
- 授权失败时自动切换到手动输入模式

### 样式（index.wxss）
- 移除 `phone-row`、`phone-input`、`phone-quick-btn`、`phone-hint` 样式
- 新增 `phone-wechat-btn`（按钮伪装输入框）、`phone-toggle`（切换链接）样式
- 按钮左对齐文字，placeholder 状态使用浅色

## 修改文件

- `miniprogram/components/login-modal/index.wxml`
- `miniprogram/components/login-modal/index.js`
- `miniprogram/components/login-modal/index.wxss`
