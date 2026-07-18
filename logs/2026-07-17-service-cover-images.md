# 服务页卡片封面图片替换

**日期**：2026-07-17
**范围**：服务页活动卡片、代办服务卡片、服务详情页、活动详情页、服务列表页

## 背景

服务页有两类卡片：活动卡片此前用 CSS 渐变 + 装饰圆球模拟封面；代办服务卡片仅有时钟图标，没有封面图。本次为 4 个活动和 4 个代办服务各生成真实封面图并全链路替换。

## 改动内容

### 1. 新增封面图资源

**活动封面图**（`miniprogram/assets/activities/`）：

| 文件 | 对应活动 | 画面特征 |
| --- | --- | --- |
| act-1.jpg | 郑东公寓周末集市 | 社区共享大厅市集，手作/咖啡/二手交换，暖色灯光 |
| act-2.jpg | 高新区桌游夜 | 活动室桌游夜，年轻人围桌玩策略游戏，暖色灯光 |
| act-3.jpg | 人才公寓篮球友谊赛 | 户外篮球场 3V3 比赛，午后阳光，运动氛围 |
| act-4.jpg | 租房合同避坑分享 | 书桌笔记本电脑+合同文件+茶杯，线上分享会氛围 |

**代办服务封面图**（`miniprogram/assets/services/`）：

| 文件 | 对应服务 | 画面特征 |
| --- | --- | --- |
| svc-1.jpg | 代取快递 | 快递员持包裹站在智能快递柜前，明亮日光 |
| svc-2.jpg | 代办入住手续 | 物业柜台办理入住登记，证件+文件，专业服务 |
| svc-3.jpg | 代排队取号 | 政务大厅排队取号场景，电子叫号屏，冷静色调 |
| svc-4.jpg | 搬家小件协助 | 两名搬运工搬纸箱和书桌进入公寓大堂，温暖色调 |

### 2. 数据层

- `miniprogram/data/tables.js`：
  - 4 个 `activities` 记录新增 `image` 字段
  - 4 个 `services` 记录新增 `image` 字段
- `miniprogram/data/queries.js`：
  - `activityToPage()` 透传 `image` 字段
  - `serviceToPage()` 透传 `image` 字段

### 3. 服务页（pages/service）

- `index.wxml`：
  - 活动卡片：用 `<image class="activity-cover-img">` 替换原 `.cover-orb` 装饰球，新增 `.activity-cover-shade` 遮罩
  - 代办服务卡片：从横向布局（图标+信息+价格）改为纵向卡片（顶部封面图+底部信息行），新增 `.service-cover`、`.service-cover-img`、`.service-cover-shade`、`.service-cover-tag`（分类标签）、`.service-body`
- `index.wxss`：
  - 新增 `.activity-cover-img`、`.activity-cover-shade` 样式
  - 重构 `.service-card` 为 `overflow: hidden` 纵向卡片
  - 新增 `.service-cover`（220rpx 高封面区）、`.service-cover-img`、`.service-cover-shade`、`.service-cover-tag`、`.service-body` 样式
  - 保留原 `.service-icon` 样式（不再使用但保留兼容）

### 4. 服务详情页（pages/service-detail）

- `index.wxml`：hero 区域用 `<image class="service-hero-img">` 替换原时钟图标，新增 `.service-hero-shade` 遮罩
- `index.wxss`：`.service-hero` 改为 `position: relative; overflow: hidden`，高度从 330rpx 调整为 360rpx；新增 `.service-hero-img`、`.service-hero-shade` 样式

### 5. 活动详情页（pages/activity-detail）

- `index.wxml`：hero 区域新增 `<image class="hero-img">` 和 `.hero-shade` 遮罩，保留原有 badge 和日期文字
- `index.wxss`：`.hero` 增加 `overflow: hidden`，新增 `.hero-img`、`.hero-shade` 样式（底部加深遮罩保证日期文字可读）

### 6. 服务列表页（pages/service-list）

- `index.wxml`：封面区域用 `<image class="service-cover-img">` 替换原时钟图标
- `index.wxss`：`.service-cover` 改为 `position: relative; overflow: hidden`，新增 `.service-cover-img` 样式

## 涉及文件

- `miniprogram/assets/activities/act-1.jpg` ~ `act-4.jpg`（新增）
- `miniprogram/assets/services/svc-1.jpg` ~ `svc-4.jpg`（新增）
- `miniprogram/data/tables.js`
- `miniprogram/data/queries.js`
- `miniprogram/pages/service/index.wxml`
- `miniprogram/pages/service/index.wxss`
- `miniprogram/pages/service-detail/index.wxml`
- `miniprogram/pages/service-detail/index.wxss`
- `miniprogram/pages/activity-detail/index.wxml`
- `miniprogram/pages/activity-detail/index.wxss`
- `miniprogram/pages/service-list/index.wxml`
- `miniprogram/pages/service-list/index.wxss`

## 验证方式

- 微信开发者工具编译运行
- 服务页活动卡片应显示真实活动场景图，徽章可读
- 服务页代办服务卡片应显示顶部封面图 + 分类标签 + 底部信息行
- 点击活动进入活动详情页，顶部 hero 显示对应活动封面图
- 点击服务进入服务详情页，顶部 hero 显示对应服务封面图
- 进入服务列表页（更多），服务卡片缩略图显示真实封面
