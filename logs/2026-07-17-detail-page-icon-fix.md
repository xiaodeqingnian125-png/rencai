# 公寓/户型详情页：修复返回和收藏按钮图标

## 背景

用户反馈公寓详情页顶部的返回和收藏按钮图标显示异常（渲染成乱码/emoji）。

## 根因

两个详情页（apartment-detail、room-detail）的返回按钮和收藏按钮使用 Unicode 文本字符 `‹` 和 `♥` 作为按钮内容。在 iOS 设备上，系统字体会将这些字符替换为 emoji 变体或显示异常，导致图标无法正常呈现。

项目约定所有图标均使用 SVG 文件（`/assets/icons/`），此处违反了约定。

## 改动文件

### 新增 SVG 图标
- `miniprogram/assets/icons/nav-back.svg` — 白色左箭头（用于深色半透明背景）
- `miniprogram/assets/icons/heart-outline.svg` — 白色心形描边（未收藏，深色背景）
- `miniprogram/assets/icons/heart-outline-dark.svg` — 灰色心形描边（未收藏，浅色背景）
- `miniprogram/assets/icons/heart-filled.svg` — 红色心形填充（已收藏）

### apartment-detail
- `index.wxml` — 顶部和底部收藏按钮的 `‹`/`♥` 文本字符替换为 `<image>` 元素，根据 `favorite` 状态切换 outline/filled 图标
- `index.wxss` — hero-btn 和 bottom-fav 增加 `padding: 0`、`border: 0`、`::after { display: none }` 重置 button 默认样式，添加 image 尺寸规则

### room-detail
- `index.wxml` — 同上，顶部 nav-btn 和底部 bottom-fav 的文本字符替换为 image
- `index.wxss` — 同上，重置 button 默认样式并添加 image 尺寸规则

## 验证

- 两个详情页顶部返回按钮显示白色左箭头
- 收藏按钮未收藏时显示心形描边，已收藏时显示红色填充心形
- 无 Unicode 字符残留（grep 确认）
