# 2026-07-17 图片优先 + 渐变 fallback 模式改造

## 背景

此前多个页面用纯 CSS 渐变占位（`grad-cover grad-N`）充当封面图。本次将其改回为「有图片用 image 标签，无图片用渐变 fallback」模式，以便在数据源提供 `image` 字段时优先展示真实图片，否则降级到渐变占位。

## 改动范围

在 `miniprogram/pages` 下共修改 8 个 wxml 文件、10 处节点。统一模式：

```html
<image wx:if="{{xxx.image}}" class="XXX" src="{{xxx.image}}" mode="aspectFill"[ lazy-load]></image>
<view wx:else class="XXX grad-cover grad-{{(xxx.id % N) + 1}}"></view>
```

列表卡片类节点带 `lazy-load`；详情页大图不带 `lazy-load`。

## 修改明细

### 1. pages/index/index.wxml — 首页公寓卡片
- `<view class="apt-card-cover grad-cover grad-{{(item.id % 6) + 1}}"></view>`
  → 改为 `image wx:if="{{item.image}}"`（lazy-load） + `view wx:else` 渐变 fallback

### 2. pages/apartment-detail/index.wxml — 公寓详情
a) 大图 `hero-cover`：`apartment.image` 优先 + 渐变 fallback
b) 房型列表小图 `room-cover`：`item.image` 优先（lazy-load） + 渐变 fallback

### 3. pages/room-detail/index.wxml — 户型图库（3 张图）
- 第 1 张 `gallery-img`：`room.image` 优先 + 渐变 fallback
- 第 2 张 `gallery-img`：`apartment.image` 优先 + 渐变 fallback
- 第 3 张 `gallery-img`：按需求保持纯渐变占位（无对应 image 字段，不加 wx:if/wx:else）

### 4. pages/activity-detail/index.wxml — 活动详情大图
- `hero-img`：`activity.image` 优先 + 渐变 fallback

### 5. pages/service-detail/index.wxml — 服务详情大图
- `service-hero-img`：`service.image` 优先 + 渐变 fallback

### 6. pages/service/index.wxml — 服务页（2 处）
a) 活动卡片 `activity-cover-img`：`item.image` 优先（lazy-load） + 渐变 fallback
b) 服务卡片 `service-cover-img`：`item.image` 优先（lazy-load） + 渐变 fallback

### 7. pages/service-list/index.wxml — 服务列表卡片
- `service-cover-img`：`item.image` 优先（lazy-load） + 渐变 fallback

### 8. pages/favorites/index.wxml — 收藏列表卡片
- `card-cover`：`item.image` 优先（lazy-load） + 渐变 fallback

## 验证

用 Grep 在 `miniprogram/pages` 下搜索 `grad-cover`，共 10 条命中：
- 9 条 `grad-cover` 所在的 `view` 均带 `wx:else`，且上一行有对应 `image wx:if`
- 1 条为 room-detail 第 3 张图库图，按要求保留纯渐变（无 `wx:if`/`wx:else`）

未触及 WXSS、JS 与数据层。数据源中若不提供 `image` 字段，渲染效果与改造前一致（渐变占位）。

## 交付

- 修改文件均位于 `miniprogram/pages` 下，可在微信开发者工具中直接编译运行。
- 建议在 iPhone 尺寸模拟器下回归查看首页、详情页、服务页、收藏页的封面展示效果。
