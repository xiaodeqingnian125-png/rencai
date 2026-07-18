# 个人信息编辑页：缩短入住开关 + 新增退出小程序按钮

## 背景

用户反馈个人信息编辑页（profile-edit）的"已入住"开关过宽，整行显得拥挤；同时需要增加退出小程序入口。

> 说明：首轮误将改动应用到 profile 主页（pages/profile），本轮已回滚主页全部改动，并在正确的 profile-edit 页面完成修改。

## 改动文件

- `miniprogram/pages/profile-edit/index.wxml`
- `miniprogram/pages/profile-edit/index.js`
- `miniprogram/pages/profile-edit/index.wxss`
- `miniprogram/pages/profile/index.js`（回滚）
- `miniprogram/pages/profile/index.wxml`（回滚）
- `miniprogram/pages/profile/index.wxss`（回滚）

## 改动详情

### 1. 缩短入住状态开关

**问题**：`.status-switch` 宽度为 `368rpx`，占整行大半，导致"已入住"选项区域过长。

**优化**：
- 开关宽度 `368rpx` → `88rpx`，高度 `56rpx` → `52rpx`，接近 iOS 标准开关比例。
- knob 尺寸 `44rpx` → `40rpx`，开启位移 `46rpx` → `42rpx`，保持视觉比例协调。

### 2. 新增退出小程序按钮

- 在保存按钮下方新增"退出小程序"按钮，红色文字、描边样式，与保存按钮形成主次区分。
- 点击触发 `wx.showModal` 二次确认，确认后调用 `wx.exitMiniProgram()` 退出。
- 退出失败时 toast 提示（开发者工具中可能不支持，真机生效）。

### 3. 回滚 profile 主页错误改动

- 恢复 `pages/profile/index.js` 的 syncUserState 逻辑和初始数据。
- 恢复 `pages/profile/index.wxml` 的状态行结构和移除退出按钮。
- 恢复 `pages/profile/index.wxss` 的圆点样式和移除退出按钮样式。

## 验证

- 入住开关宽度适中，"已入住"行不再拥挤。
- 退出按钮位于保存按钮下方，二次确认弹窗正常。
- profile 主页恢复原状，无残留改动。
