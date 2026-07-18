# 2026-07-02 统一数据表与页面数据同步

## 改动范围

- 新增 `miniprogram/data/tables.js`，集中维护静态 MVP 的规范化业务表：
  - `users`
  - `apartments`
  - `roomTypes`
  - `activities`
  - `activityRegistrations`
  - `roommatePosts`
  - `borrowItems`
  - `borrowRequests`
  - `comments`
  - `commentLikes`
  - `favorites`
  - `messages`
  - `services`
  - `serviceOrders`
- 新增 `miniprogram/data/queries.js`，统一派生页面展示数据、收藏状态、评论目标、个人中心记录、管理员数据集。
- 保留 `miniprogram/data/apartments.js` 和 `miniprogram/data/business.js` 作为兼容出口，内部改为调用统一查询层。
- 同步以下页面的数据来源：
  - 首页公寓列表：由 `getHomeApartmentCards()` 派生。
  - 收藏页：由 `favorites` 反查公寓/户型生成。
  - 我的评论：由 `comments` 按当前用户和目标对象生成。
  - 找室友页：由 `roommatePosts` 生成公开列表和审核队列。
  - 个人中心：记录和角标由报名、帖子、借用、订单、收藏、评论表统计。
  - 管理员 7 个页面：由 `getAdminDataset(type)` 统一生成公寓、户型、活动、服务、物品、评论、用户列表。
- 新增 Supabase 迁移资产：
  - `supabase/schema.sql`
  - `supabase/seed.sql`

## 交互约束

- 本轮未接入 Supabase、云函数、网络请求或真实接口。
- 表单新增、编辑、删除、报名、借用申请等操作仍只更新当前页面 `data/setData`，刷新后回到静态表初始数据。
- 微信支付、订阅消息和真实登录仍保持静态 MVP 降级表达。

## 验证

- 已运行 `rg --files -g '*.js' miniprogram cloudfunctions | xargs -n1 node --check`，通过。
- 已运行 `git diff --check`，通过。

## 后续建议

- 接入真实后端时，以 `supabase/schema.sql` 为建表基准，再把 `queries.js` 的派生逻辑迁移到接口 DTO 或轻量 client adapter。
- 若后续需要跨页面保持表单新增结果，可引入 `app.globalData` 或本地缓存，但当前版本按静态 MVP 不持久化。
