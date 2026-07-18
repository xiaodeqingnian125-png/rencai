# 公寓详情页地图栏改造（方案A）

## 日期
2026-07-18

## 背景
原公寓详情页地图栏为单行布局：定位图标 + 位置文字 + "查看地图"按钮。参考美团民宿信息条样式，改为两行布局：上行为收藏数胶囊（社会认同），下行为可点击的位置条（点击查看地图）。

## 修改内容

### 1. 数据层：`miniprogram/data/queries.js`
新增 2 个收藏数统计函数和 2 个详情字段：

**新增函数：**
- `countFavorites(targetType, targetId)`：统计指定目标的收藏数
- `countRoomFavoritesByApartment(apartmentId)`：统计公寓下所有户型的收藏数合计

**`apartmentToDetail` 新增字段：**
- `apartmentFavoriteCount`：公寓收藏数（`favorites` 表中 `target_type='apartment'` 的记录数）
- `roomFavoriteCount`：户型收藏数（该公寓下所有户型的收藏数合计）

### 2. 视图层：`miniprogram/pages/apartment-detail/index.wxml`
原 `.location-bar` 单行布局替换为 `.location-section` 两行布局：

**第一行（收藏胶囊）：**
- 公寓收藏胶囊：心形图标 + "X人收藏公寓"
- 户型收藏胶囊：定位图标 + "X人收藏户型"

**第二行（可点击位置条）：**
- 橙色边框圆角卡片
- 左侧定位图标 + 中间地址（加粗）+ 位置摘要（绿色）+ 右侧"地图 ›"
- 整块可点击，复用现有 `goMap` 方法跳转地图页

### 3. 样式层：`miniprogram/pages/apartment-detail/index.wxss`
替换原 `.location-bar` 相关样式，新增：
- `.location-section`：容器
- `.favorite-chips` / `.fav-chip` / `.fav-num`：收藏胶囊样式（圆角胶囊，浅色背景）
- `.location-tap` / `.location-tap-text` / `.location-tap-addr` / `.location-tap-meta` / `.location-tap-arrow`：可点击位置条样式（橙色边框，按下缩放反馈）

### 4. 逻辑层：`miniprogram/pages/apartment-detail/index.js`
`toggleFavorite` 方法中，收藏状态改变后同步更新 `apartment.apartmentFavoriteCount`，保持收藏数实时显示。

### 5. 新增图标：`miniprogram/assets/icons/location-accent.svg`
橙色版定位图标（#e8723c），用于位置条和户型收藏胶囊（原 `location.svg` 为灰色，不适合橙色主题）。

## 布局结构
```
┌─────────────────────────────────┐
│ [♥ 12人收藏公寓] [📍 8人收藏户型] │  ← 收藏胶囊行
├─────────────────────────────────┤
│ 📍 高新区·春藤美寓        地图 › │  ← 可点击位置条
│    距离地铁8号线冬青街站约800米  │
└─────────────────────────────────┘
```

## 数据流
```
queries.js apartmentToDetail()
  → apartment.apartmentFavoriteCount (公寓收藏数)
  → apartment.roomFavoriteCount (户型收藏数)
  → apartment.location (地址)
  → apartment.locationMeta (位置摘要)
  ↓
apartment-detail/index.js loadApartment()
  → setData({ apartment })
  ↓
apartment-detail/index.wxml
  → 收藏胶囊显示 favoriteCount
  → 位置条显示 location + locationMeta
  → 点击位置条 → goMap() → 跳转地图页
```

## 验证要点
- [x] queries.js 新增 countFavorites 和 countRoomFavoritesByApartment 函数
- [x] apartmentToDetail 新增 apartmentFavoriteCount 和 roomFavoriteCount 字段
- [x] wxml 采用方案A两行布局
- [x] wxss 收藏胶囊和位置条样式完整
- [x] 位置条点击复用现有 goMap 方法
- [x] toggleFavorite 同步更新收藏数
- [x] 新增 location-accent.svg 橙色图标
- [x] getApartmentById 通过 apartments.js 代理到 queries.js，返回新字段

## 影响范围
- 仅影响公寓详情页 (`apartment-detail`) 的地图栏区域
- 不影响其他页面
- 收藏数数据来源为现有 `favorites` 表，无数据迁移

## 样式调整（2026-07-18 追加）
位置条样式从橙色凸显改为与水费单元格（`.cost-cell`）一致的低调米色风格：

| 属性 | 调整前 | 调整后 |
|------|--------|--------|
| border | `1rpx solid #e8723c`（橙色） | `1rpx solid #f0eae0`（浅米色） |
| background | `#fff8f2`（浅橙） | `#fffdf7`（浅米色） |
| border-radius | `20rpx` | `16rpx` |
| hover background | `#fff2e8`（浅橙） | `#f0eae0`（浅米色） |

定位图标、地址文字、位置摘要（绿色）、右侧"地图 ›"（橙色）颜色保持不变，仅调整边框和背景，使位置条融入页面整体米色调。
