# 2026-07-01 Home Visual Bugfix

## 本次改动

- 修复首页筛选栏右侧结果数被挤压成竖排的问题，将结果数独立为右对齐单行。
- 将公寓卡片收藏控件从原生 `button` 改为 `view`，避免微信默认按钮样式造成大椭圆。
- 新增 5 组 tabBar 单线图标 SVG 源文件，并生成透明背景 PNG 用于原生 tabBar。
- 更新 `app.json`，将 tabBar 图标从 QuickStart 旧图标切换到晓得青年风格图标。

## 说明

- PNG 图标由 `miniprogram/assets/tabbar-src` 下的 SVG 源文件生成，输出到 `miniprogram/assets/tabbar`。
- 本次只修首页视觉问题和 tabBar 图标，不新增业务页面。
