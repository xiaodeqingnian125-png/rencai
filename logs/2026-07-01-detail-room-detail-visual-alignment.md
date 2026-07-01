# 2026-07-01 公寓详情与户型详情高保真还原

## 本次改动
- 新增 `pages/apartment-detail/index`，对照 `rencai-ui/app-detail.html` 实现顶部大图、费用信息、配套设施、周边服务、户型选择、住户评价、评论抽屉和底部分享/收藏栏。
- 新增 `pages/room-detail/index`，对照 `rencai-ui/app-room-detail.html` 实现横向图库、户型头部、费用信息、配套设施、详细参数、住户评价、评论抽屉和底部分享/收藏栏。
- 新增 `miniprogram/data/apartments.js`，集中维护第一版静态公寓与户型数据。
- 首页公寓卡片已从 toast 改为真实跳转到公寓详情，详情页户型卡片可继续跳转到户型详情。

## 校验
- 已执行 `node --check miniprogram/data/apartments.js`。
- 已执行 `node --check miniprogram/pages/apartment-detail/index.js`。
- 已执行 `node --check miniprogram/pages/room-detail/index.js`。
- 已执行页面 JSON / `app.json` 解析检查。
- 已执行资源路径检查与禁用写法检查。
