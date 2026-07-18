# P2 缺陷修复：弹窗遮罩事件、手机号长度限制、Toast 文案

## 日期
2026-07-17

## 背景
修复视觉与交互审计发现的 P2 级缺陷，涉及弹窗遮罩事件冒泡、手机号输入长度限制、Toast 文案超长三类问题。

## 任务1：弹窗遮罩 bindtap 改为 catchtap（13处，11个文件）

将弹窗遮罩层（mask/backdrop/overlay 类的 `<view>`）上的 `bindtap` 改为 `catchtap`，阻止事件冒泡导致弹窗内部点击误触发关闭。弹窗内部按钮（取消/关闭）的 `bindtap` 保持不变。

修改清单（任务指定 11 处 + 验证发现 2 处额外遮罩）：

| 文件 | 行号 | 元素 class | 变更 |
| --- | --- | --- | --- |
| pages/profile-edit/index.wxml | 52 | modal-mask | bindtap → catchtap (closeModal) |
| pages/profile-edit/index.wxml | 71 | picker-mask | bindtap → catchtap (closePicker) |
| pages/roommate/index.wxml | 117 | sheet-mask | bindtap → catchtap (closeAllSheets) |
| pages/room-detail/index.wxml | 94 | sheet-mask | bindtap → catchtap (closeCommentSheet) |
| pages/service-detail/index.wxml | 44 | sheet-mask | bindtap → catchtap (closeOrder) |
| pages/item-detail/index.wxml | 54 | sheet-mask | bindtap → catchtap (closeRequest) |
| pages/activity-detail/index.wxml | 54 | sheet-mask | bindtap → catchtap (closeRegister) |
| pages/profile/index.wxml | 72 | profile-overlay | bindtap → catchtap (closeBusiness) |
| pages/index/index.wxml | 84 | filter-backdrop | bindtap → catchtap (closeFilter) |
| pages/admin/index.wxml | 165 | modal-mask | bindtap → catchtap (closeForm) |
| pages/admin/index.wxml | 209 | modal-mask | bindtap → catchtap (closeImport) |
| pages/apartment-detail/index.wxml | 120 | sheet-mask | bindtap → catchtap (closeCommentSheet)（验证时发现，一并修复） |
| pages/messages/index.wxml | 40 | sheet-mask | bindtap → catchtap (closeDetail)（验证时发现，一并修复） |

## 任务2：手机号输入框添加 maxlength="11"（2处）

为手机号输入框（`type="number"`）添加 `maxlength="11"`，限制输入长度为中国大陆手机号位数。

| 文件 | 行号 | 变更 |
| --- | --- | --- |
| pages/activity-detail/index.wxml | 64 | 添加 maxlength="11" |
| pages/service-detail/index.wxml | 54 | 添加 maxlength="11" |

## 任务3：修复 Toast 文案超 14 字（1处）

| 文件 | 行号 | 原文案（17字） | 新文案（7字） |
| --- | --- | --- | --- |
| pages/roommate/index.js | 205 | 请补充昵称、预算、入住时间和联系方式 | 请完善必填信息 |

## 验证结果

1. `bindtap="close` 搜索：剩余 12 处全部位于 `<button>` 元素上（弹窗内部取消/关闭按钮），遮罩层 `<view>` 上已无 bindtap。
2. `maxlength="11"` 搜索：共 2 处，分别在 activity-detail 与 service-detail。
3. Toast 文案：roommate/index.js 已更新为"请完善必填信息"。

## 影响范围
- 不影响页面逻辑与数据结构。
- 提升弹窗交互稳定性（避免内部点击误关闭）。
- 规范手机号输入长度，提升表单数据质量。
- Toast 文案符合微信小程序建议长度（不超过 14 字）。
