# 2026-07-18 户型详情页返回按钮适配胶囊样式并删除顶部收藏按钮

## 背景

户型详情页（room-detail）顶部返回按钮原为圆形深色半透明样式，与右侧微信原生胶囊按钮不统一。同时顶部右上角有收藏按钮，与公寓详情页布局不一致。需同步公寓详情页的返回按钮样式，并删除右上角收藏按钮。

## 改动内容

### 1. JS 获取胶囊按钮位置（`pages/room-detail/index.js`）

- 新增 `navTop`、`navHeight`、`navWidth`、`navRadius`、`navIconSize` 数据字段
- 新增 `initNavBar()` 方法，通过 `wx.getMenuButtonBoundingClientRect()` 获取原生胶囊按钮位置和尺寸
- 在 `onLoad` 中调用，带 `try/catch` 降级兜底

### 2. WXML 重构（`pages/room-detail/index.wxml`）

- 删除 `.gallery-nav` 包裹容器
- 删除右上角收藏按钮（`nav-btn fav`）
- 返回按钮改为独立绝对定位，通过内联 `style` 绑定 `top`、`width`、`height`、`line-height`、`border-radius`
- 图标改为 `nav-back-dark.svg`（深色箭头），尺寸通过 `navIconSize` 动态设置

### 3. WXSS 样式调整（`pages/room-detail/index.wxss`）

- 删除 `.gallery-nav` 容器样式
- `.nav-btn` 改为 `position: absolute; left: 24rpx; z-index: 5`（独立定位）
- 新增 `.back-btn` 覆盖：背景 `rgba(255, 255, 255, 0.6)`，边框 `1rpx solid rgba(0, 0, 0, 0.06)`，颜色 `#2d2318`
- 删除 `.nav-btn.fav` 和 `.nav-btn.fav.on` 样式（保留 `.bottom-fav.on`）

### 4. 复用已有资源

- 复用上一步创建的 `nav-back-dark.svg` 深色返回箭头图标

## 效果

- 返回按钮与右侧胶囊按钮在同一水平线上，形状为胶囊形
- 背景风格与胶囊统一：浅色半透明 + 细边框 + 深色图标
- 右上角收藏按钮已删除，底部操作栏的收藏按钮保留
- 与公寓详情页返回按钮样式完全一致
- 适配不同机型（动态获取胶囊尺寸）

## 影响范围

- 仅修改 `pages/room-detail/` 目录下的 3 个文件
- `toggleFavorite` 方法保留，底部操作栏收藏功能不受影响
