# 公寓卡片封面图片替换

**日期**：2026-07-17
**范围**：首页公寓卡片、公寓详情页顶部封面

## 背景

公寓卡片封面此前使用 CSS 渐变背景 + 半透明建筑形状 div 模拟，视觉表现力较弱。本次为 6 个公寓分别生成真实封面图片并替换。

## 改动内容

### 1. 新增封面图片资源

为 6 个公寓分别生成封面图，保存至 `miniprogram/assets/apartments/`：

| 文件 | 对应公寓 | 画面特征 |
| --- | --- | --- |
| apt-1.jpg | 郑东人才公寓 | 郑东新区现代高层住宅，金色夕阳，临近地铁 |
| apt-2.jpg | 高新人才家园 | 高新区当代中层公寓，绿植环绕，清晨光线 |
| apt-3.jpg | 经开青年公寓 | 经开区规整公寓楼，几何阳台，午后光线 |
| apt-4.jpg | 港区人才社区 | 航空港低层公寓，开阔蓝天，明亮日光 |
| apt-5.jpg | 二七人才公寓 | 二七商圈暖色公寓，街树与小店，黄金时刻 |
| apt-6.jpg | 中原青年社区 | 中原老城现代公寓，成熟绿荫，午后柔光 |

### 2. 数据层

- `miniprogram/data/tables.js`：每个公寓记录新增 `image` 字段，指向对应封面图路径
- `miniprogram/data/mock-store.js`：
  - 新增 `apartmentImages` 数组，供管理员新增公寓时轮转分配默认封面
  - `defaultApartmentAssets()` 返回值增加 `image`
  - `normalizeApartmentAdminItem()` 结果对象增加 `image` 字段
- `miniprogram/data/queries.js`：
  - `apartmentToDetail()` 透传 `image` 字段（详情页使用）
  - `getHomeApartmentCards()` 透传 `image` 字段（首页卡片使用）

### 3. 首页（pages/index）

- `index.wxml`：公寓卡片封面区域用 `<image class="apt-card-cover" src="{{item.image}}" mode="aspectFill" lazy-load>` 替换原 `.apt-building` 建筑块；新增 `.apt-card-img-shade` 遮罩层保证标签可读性
- `index.wxss`：
  - 新增 `.apt-card-cover` 样式（绝对定位铺满容器）
  - 新增 `.apt-card-img-shade` 上下渐变遮罩
  - 保留原 `.apt-img-*` 渐变背景作为图片加载前的兜底

### 4. 公寓详情页（pages/apartment-detail）

- `index.wxml`：顶部 hero 区域用 `<image class="hero-cover" src="{{apartment.image}}" mode="aspectFill">` 替换原 `.hero-building` 建筑块；新增 `.hero-cover-shade` 遮罩保证按钮可读性
- `index.wxss`：新增 `.hero-cover` 与 `.hero-cover-shade` 样式，保留原 `.hero-*` 渐变背景作为兜底

## 涉及文件

- `miniprogram/assets/apartments/apt-1.jpg` ~ `apt-6.jpg`（新增）
- `miniprogram/data/tables.js`
- `miniprogram/data/mock-store.js`
- `miniprogram/data/queries.js`
- `miniprogram/pages/index/index.wxml`
- `miniprogram/pages/index/index.wxss`
- `miniprogram/pages/apartment-detail/index.wxml`
- `miniprogram/pages/apartment-detail/index.wxss`

## 验证方式

- 微信开发者工具编译运行，首页公寓卡片应显示真实建筑封面图
- 点击卡片进入公寓详情页，顶部 hero 应显示同一张封面图
- 标签、收藏按钮等浮层在图片上仍清晰可读
- 管理员后台新增公寓时自动轮转分配默认封面图
