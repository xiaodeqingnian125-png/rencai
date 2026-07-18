# 2026-07-17 用户侧写操作接入运行时数据层

## 背景

此前用户侧写操作（报名、评论、收藏、借用、发帖、发物品、下单）只更新页面 `data`，未写入数据层，离开页面即丢失，且各页面数据不一致。`business.js` 在模块加载时缓存消息和个人中心记录快照，导致运行时写入后读不到最新数据。

## 改动范围

### 数据层

- `data/mock-store.js`：新增用户侧运行时写入函数
  - `registerActivity` — 活动报名，写入 `activityRegistrations`，更新活动人数，推送消息
  - `isActivityRegistered` — 检查是否已报名
  - `submitComment` — 发布评论，写入 `comments` 表
  - `toggleFavoriteRecord` — 切换收藏状态，写入/删除 `favorites` 表
  - `toggleCommentLike` — 评论点赞，写入 `commentLikes` 并更新 `like_count`
  - `createBorrowRequest` — 发起借用申请，写入 `borrowRequests`，给物主推送消息
  - `createBorrowItem` — 发布物品，写入 `borrowItems`
  - `createRoommatePost` — 发布找室友帖，写入 `roommatePosts`（status: pending）
  - `createServiceOrder` — 提交代办服务订单，写入 `serviceOrders`，推送消息
  - `createActivity` — 用户发起活动，写入 `activities`（status: pending）
  - 辅助函数：`getUserById`、`pushMessage`、`todayLabel`、`timeAgoLabel`
- `data/queries.js`：暴露上述写入函数为 `registerActivityForUser` / `submitUserComment` / `toggleFavoriteForUser` / `toggleCommentLikeForUser` / `createBorrowRequestForUser` / `createBorrowItemForUser` / `createRoommatePostForUser` / `createServiceOrderForUser` / `createActivityForUser` / `isActivityRegisteredByUser`
- `data/business.js`：`messages` 和 `profileRecords` 从模块加载时快照改为 `Object.defineProperty` 动态 getter，确保读取到运行时最新数据

### 页面

| 页面 | 改动 |
|------|------|
| `activity-detail` | 报名写入 `registerActivityForUser`；进入页面检查 `isActivityRegisteredByUser`；报名后重读活动数据 |
| `apartment-detail` | 评论发布写入 `submitUserComment`；收藏写入 `toggleFavoriteForUser`；点赞写入 `toggleCommentLikeForUser`；`onShow` 重读数据 |
| `room-detail` | 同上，target_type 为 `room_type` |
| `item-detail` | 借用申请写入 `createBorrowRequestForUser` |
| `item-publish` | 发布物品写入 `createBorrowItemForUser` |
| `roommate` | 发帖写入 `createRoommatePostForUser`；发帖后重读 `getRoommateData` 刷新审核队列 |
| `service-detail` | 下单写入 `createServiceOrderForUser` |
| `messages` | 移除模块加载时快照，改为 `onShow` 动态读取 `business.messages` |
| `profile` | 移除模块加载时 `businessConfig` 快照，改为打开菜单时动态读取 `business.profileRecords`；`onShow` 同步角标 |

## 同步效果

- 活动报名后，活动列表、服务页、个人中心「我的活动」、消息页均能读到最新报名状态和人数
- 评论发布后，公寓/户型详情页、个人中心「我的评论」均能读到新评论
- 收藏切换后，详情页收藏按钮、个人中心「我的收藏」、首页卡片收藏态一致
- 借用申请提交后，物主消息页收到通知，个人中心「我借入的」可查看记录
- 物品发布后，借个锤子列表立即展示新物品，个人中心「我借出的」可管理
- 找室友发帖后进入审核队列，管理员审核通过后公开展示
- 服务订单提交后，个人中心「我的订单」可查看，消息页收到确认通知

## 验证

- 全量 JS 语法检查通过：`find miniprogram cloudfunctions -name '*.js' | xargs -n1 node --check`
- Node 冒烟测试覆盖全部 9 个写入函数，验证：
  - 报名成功 + 重复报名拦截
  - 评论/收藏/借用/发物品/发帖/订单写入成功
  - `business.messages` 动态 getter 正常返回最新数据
  - 个人中心 `getProfileRecords` 动态读取正常

## 约束

- 运行时 mock 数据只在当前小程序运行会话内有效，刷新/重新编译后恢复种子数据
- 当前用户身份固定为 `u_current`，待微信授权登录（P0-B）落地后切换为真实 openid
- 本轮未接 Supabase、云函数或本地缓存
