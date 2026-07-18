# 2026-07-18 公寓详情页返回按钮适配胶囊样式

## 背景

公寓详情页顶部自定义返回按钮原为圆形（`64rpx × 64rpx`，`border-radius: 50%`），深色半透明背景（`rgba(0,0,0,0.25)`），与右侧微信原生胶囊按钮（三个点）在样式和垂直位置上不统一，视觉上不协调。

## 改动内容

### 1. 新增深色返回箭头图标

- 文件：`miniprogram/assets/icons/nav-back-dark.svg`
- 将描边色由 `#ffffff` 改为 `#2d2318`，适配浅色半透明背景

### 2. JS 获取胶囊按钮位置（`pages/apartment-detail/index.js`）

- 新增 `initNavBar()` 方法，通过 `wx.getMenuButtonBoundingClientRect()` 获取原生胶囊按钮的位置和尺寸
- 计算 `navTop`（与胶囊顶部对齐）、`navHeight`（与胶囊等高）、`navWidth`（高度的 1.3 倍，胶囊形）、`navRadius`（高度的一半，圆角）、`navIconSize`（高度的 50%）
- 在 `onLoad` 中调用，带 `try/catch` 降级兜底

### 3. WXML 动态样式（`pages/apartment-detail/index.wxml`）

- 返回按钮通过 `style` 内联绑定 `top`、`width`、`height`、`line-height`、`border-radius`，精确对齐胶囊
- 图标改为 `nav-back-dark.svg`，尺寸通过 `navIconSize` 动态设置

### 4. WXSS 样式覆盖（`pages/apartment-detail/index.wxss`）

- `.back-btn` 覆盖背景为 `rgba(255, 255, 255, 0.6)`（与胶囊一致的浅色半透明）
- 边框改为 `1rpx solid rgba(0, 0, 0, 0.06)`（与胶囊一致的细边框）
- 文字颜色改为 `#2d2318`

## 效果

- 返回按钮与右侧胶囊按钮在同一水平线上（`top` 一致）
- 返回按钮高度与胶囊一致，形状为胶囊形（pill）
- 背景风格与胶囊统一：浅色半透明 + 细边框 + 深色图标
- 适配不同机型（动态获取胶囊尺寸）
