# 2026-07-01 个人中心二级页高保真还原

## 本次改动
- 新增 `pages/favorites/index`，对照 `rencai-ui/app-favorites.html` 实现公寓/户型分段收藏列表与详情跳转。
- 新增 `pages/my-comments/index`，对照 `rencai-ui/app-my-comments.html` 实现我的评论列表、目标跳转和删除交互。
- 新增 `pages/profile-edit/index`，对照 `rencai-ui/app-profile-edit.html` 实现头像、昵称、手机号、公寓、楼栋、入住状态和底部弹层编辑。
- 个人中心用户卡片、我的收藏、我的评论、帖子记录、订单评价等入口已改成真实页面跳转。

## 校验
- 已执行 `node --check` 检查 `favorites`、`my-comments`、`profile-edit` 三个新页面 JS，以及 `profile/index.js`。
- 已执行页面 JSON / `app.json` 解析检查。
- 已执行资源路径检查与禁用写法检查。
- 已检查个人中心相关入口，不再保留“个人资料/我的收藏/我的评论下一步接入”占位提示。
