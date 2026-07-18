# 户型卡片封面图片替换

**日期**：2026-07-17
**范围**：公寓详情页户型卡片、收藏页卡片、户型详情页画廊

## 背景

户型卡片封面此前使用 CSS 渐变背景 + 模拟线条/色块来表现户型图，视觉表现力较弱。本次为 3 种户型类型分别生成真实室内实景图并替换所有户型卡片的封面。

## 改动内容

### 1. 新增户型室内图资源

为 3 种户型类型（对应 `image_class`）各生成一张室内实景图，保存至 `miniprogram/assets/rooms/`：

| 文件 | 对应 image_class | 户型类型 | 画面特征 |
| --- | --- | --- | --- |
| room-1.jpg | ri-1 | 一居室 | 独立客厅+卧室，暖色木地板，飘窗阳光 |
| room-2.jpg | ri-2 | 两居室 | 客餐厅连通，四人餐桌，绿植点缀 |
| room-3.jpg | ri-3 | 开间/单间 | 紧凑一体化空间，床+书桌+厨房沿墙排布 |

### 2. 数据层

- `miniprogram/data/tables.js`：
  - 新增 `roomImageMap` 映射表，将 `ri-1/ri-2/ri-3` 映射到对应图片路径
  - 每个 `roomTypes` 记录新增 `image` 字段，通过 `roomImageMap[image_class]` 赋值
- `miniprogram/data/mock-store.js`：
  - 新增 `roomImages` 数组，供管理员新增户型时轮转分配默认封面
  - 新增 `defaultRoomImageAsset()` 函数
  - `normalizeRoomAdminItem()` 结果对象增加 `image` 字段
- `miniprogram/data/queries.js`：
  - `roomToPage()` 透传 `image` 字段（公寓详情页户型卡片使用）
  - `getFavoriteRecords()` 中公寓和户型收藏数据均增加 `image` 字段（收藏页使用）

### 3. 公寓详情页（pages/apartment-detail）

- `index.wxml`：户型卡片的 `room-img` 区域用 `<image class="room-cover" src="{{item.image}}" mode="aspectFill" lazy-load>` 替换原 `.room-plan-line a/b` 模拟线条
- `index.wxss`：新增 `.room-cover` 样式（绝对定位铺满 160×128rpx 容器），保留原 `.ri-*` 渐变背景作为图片加载兜底

### 4. 收藏页（pages/favorites）

- `index.wxml`：收藏卡片的 `card-img` 区域用 `<image class="card-cover" src="{{item.image}}" mode="aspectFill" lazy-load>` 替换原 `.img-glow/.img-block/.img-line` 模拟色块，保留 `.img-badge` 标签
- `index.wxss`：新增 `.card-cover` 样式（绝对定位铺满 160×128rpx 容器），保留原 `.ci-*` 渐变背景作为兜底

### 5. 户型详情页（pages/room-detail）

- `index.wxml`：顶部画廊的 3 个 CSS 渐变 `view` 替换为 `<image>` 组件，第一张和第三张为户型室内图（`room.image`），第二张为公寓外观图（`apartment.image`），形成室内-外观-室内的浏览节奏
- `index.wxss`：`.gallery-img` 样式（`display: inline-block; width: 100%; height: 480rpx`）对 image 标签同样适用，无需修改

## 涉及文件

- `miniprogram/assets/rooms/room-1.jpg` ~ `room-3.jpg`（新增）
- `miniprogram/data/tables.js`
- `miniprogram/data/mock-store.js`
- `miniprogram/data/queries.js`
- `miniprogram/pages/apartment-detail/index.wxml`
- `miniprogram/pages/apartment-detail/index.wxss`
- `miniprogram/pages/favorites/index.wxml`
- `miniprogram/pages/favorites/index.wxss`
- `miniprogram/pages/room-detail/index.wxml`

## 验证方式

- 微信开发者工具编译运行
- 进入公寓详情页，户型选择区域的缩略图应显示真实室内图
- 进入收藏页，公寓和户型收藏卡片均显示真实封面图
- 点击户型进入户型详情页，顶部画廊可横向滑动浏览室内图和外观图
- 管理员后台新增户型时自动轮转分配默认室内图
