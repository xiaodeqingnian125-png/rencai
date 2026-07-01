# 2026-07-01 我的评论页精修

## 本次改动
- 精修 `pages/my-comments/index`，只调整我的评论页，不影响个人中心其他二级页。
- 优化评论目标入口，补充公寓/户型图标、目标类型、名称层级和跳转箭头。
- 优化评论正文、点赞数量、删除按钮、用户头像和时间信息的排版节奏。
- 优化删除按钮为 `catchtap`，避免触发外层点击行为。
- 优化空态布局，补充说明文案和安全区底部间距。

## 校验
- 已执行 `node --check miniprogram/pages/my-comments/index.js`。
- 已解析 `miniprogram/pages/my-comments/index.json` 与 `miniprogram/app.json`。
- 已检查 `my-comments` 页面未使用 `web-view`、`document`、`window` 等禁用写法。
- 已检查新增图标路径 `/assets/icons/chevron-muted.svg` 存在。
- 已检查评论目标跳转路径仍指向 `pages/apartment-detail/index` 与 `pages/room-detail/index`。
