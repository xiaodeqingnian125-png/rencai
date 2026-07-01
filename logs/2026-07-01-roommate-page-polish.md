# 2026-07-01 找室友页精修

## 本次改动
- 精修 `pages/roommate/index`，只调整找室友页，不影响其他快捷入口页面。
- 优化顶部筛选条，补充各类型数量、横向滚动和按压反馈。
- 优化审核提示卡，补充“审核中”状态标签与更清晰的信息层级。
- 优化帖子卡片，增强头像、身份、房源/区域、预算、入住时间、联系按钮的视觉层次。
- 新增帖子详情底部弹层，点击帖子可查看预算、入住时间、说明和联系方式。
- 优化发布找室友弹层，补充拖拽提示条、输入占位样式、遮罩关闭和安全区间距。
- 优化空态和浮动发布按钮，适配 iPhone 底部安全区。

## 校验
- 已执行 `node --check miniprogram/pages/roommate/index.js`。
- 已解析 `miniprogram/pages/roommate/index.json` 与 `miniprogram/app.json`。
- 已检查 `roommate` 页面未使用 `web-view`、`document`、`window`、`filter` 等禁用或高风险写法。
- 已检查首页快捷入口仍指向 `pages/roommate/index`，且页面已在 `app.json` 注册。
- 已静态核对新增 WXML 点击事件均有对应页面方法。
