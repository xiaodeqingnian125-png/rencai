# 2026-07-01 个人信息页截图对齐微调

## 本次改动
- 根据截图反馈继续微调 `pages/profile-edit/index` 的视觉细节。
- 将入住状态开关调整为长胶囊样式，更贴近截图中的横向比例。
- 将保存按钮调整为居中短按钮，避免接近满宽导致页面重心偏重。

## 校验
- 已执行 `node --check miniprogram/pages/profile-edit/index.js`。
- 已解析 `miniprogram/pages/profile-edit/index.json` 与 `miniprogram/app.json`。
- 已检查 `profile-edit` 页面未使用 `web-view`、`document`、`window`、`filter` 等禁用或高风险写法。
