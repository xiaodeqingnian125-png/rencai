# 2026-07-01 找室友筛选与发布按钮修复

## 本次改动
- 修复 `pages/roommate/index` 二级筛选栏中“居室”未显示的问题。
- 将二级筛选栏从 grid 改为 flex 三等分布局，确保“区域 / 价格 / 居室”在小程序模拟器中稳定展示。
- 将右下角发布入口从 `button` 改为 `view`，避免小程序 button 默认宽度导致按钮变成椭圆。
- 固定发布按钮宽高、最大宽高和内部 `+` 的居中样式，确保显示为正圆。

## 校验
- 已执行 `node --check miniprogram/pages/roommate/index.js`。
- 已解析 `miniprogram/pages/roommate/index.json` 与 `miniprogram/app.json`。
- 已检查 `roommate` 页面未使用 `web-view`、`document`、`window`、`filter` 等禁用或高风险写法。
- 已确认页面中 `float-pub` 不再使用 `button`，且“居室”筛选项仍存在。
