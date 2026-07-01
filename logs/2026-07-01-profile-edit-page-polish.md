# 2026-07-01 个人信息页精修

## 本次改动
- 精修 `pages/profile-edit/index`，只调整个人信息页，不影响个人中心其他二级页。
- 优化头像区域层次，增加头像外圈、阴影和更稳定的视觉重心。
- 优化资料表单卡片，补充按压反馈、阴影层次和更贴近设计稿的圆角节奏。
- 优化入住状态开关，调整为独立状态卡片并强化开关动效。
- 优化编辑弹层与公寓选择器，补充动态占位文案、回车确认、选中勾选态和安全区间距。

## 校验
- 已执行 `node --check miniprogram/pages/profile-edit/index.js`。
- 已解析 `miniprogram/pages/profile-edit/index.json` 与 `miniprogram/app.json`。
- 已检查 `profile-edit` 页面未使用 `web-view`、`document`、`window` 等禁用写法。
- 已检查页面使用的 `/assets/icons/chevron-muted.svg` 图标路径存在。
