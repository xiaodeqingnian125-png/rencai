# 2026-07-18 公寓详情页删除右上角收藏按钮

## 背景

公寓详情页右上角原有一个收藏按钮（`fav-btn`），与户型详情页保持一致，需删除顶部收藏按钮，仅保留底部操作栏的收藏入口。

## 改动内容

### 1. WXML 删除收藏按钮（`pages/apartment-detail/index.wxml`）

- 删除 `.hero-btn.fav-btn` 按钮节点及其内部图标

### 2. WXSS 清理样式（`pages/apartment-detail/index.wxss`）

- 删除 `.fav-btn` 定位样式（`right: 24rpx`）
- 删除 `.fav-btn.on` 选择器（保留 `.bottom-fav.on`，底部操作栏仍在使用）

## 效果

- 顶部右上角收藏按钮已删除，仅保留底部操作栏的收藏按钮
- `toggleFavorite` 方法和 `favorite` 数据字段保留，底部收藏功能不受影响
- 与户型详情页布局一致（均无顶部收藏按钮）

## 影响范围

- 仅修改 `pages/apartment-detail/` 目录下的 2 个文件
- 底部操作栏的收藏功能不受影响
