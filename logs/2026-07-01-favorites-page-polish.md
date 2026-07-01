# 2026-07-01 我的收藏页精修

## 本次改动
- 精修 `pages/favorites/index`，只调整我的收藏页，不影响个人中心其他二级页。
- 优化收藏页分段按钮，补充收藏数量、选中态和按压反馈。
- 重做收藏卡片信息层次，强化标题、价格、位置/户型信息、标签和跳转箭头。
- 优化原生占位图层次，分别处理公寓与户型收藏的视觉差异。
- 优化空态布局，补充说明文案、按钮样式和安全区底部间距。

## 校验
- 已执行 `node --check miniprogram/pages/favorites/index.js`。
- 已解析 `miniprogram/pages/favorites/index.json` 与 `miniprogram/app.json`。
- 已检查 `favorites` 页面未使用 `web-view`、`document`、`window` 等禁用写法。
- 已检查新增图标路径 `/assets/icons/chevron-muted.svg` 存在。
