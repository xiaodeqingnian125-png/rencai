# 2026-07-01 找室友页筛选与按钮修正

## 本次改动
- 调整 `pages/roommate/index` 顶部类型栏，只保留“有房找室友”和“无房找合租”，默认选中“有房找室友”。
- 新增二级筛选栏：区域、价格、居室，支持展开选项并按当前静态帖子数据筛选。
- 区域按帖子 `district` 文本匹配，价格按预算区间交集匹配，居室按 `rooms` 关键词匹配。
- 删除帖子卡片和详情弹层中的“联系TA”按钮，联系方式仅在详情弹层中展示为文本。
- 修复右下角发布按钮，固定宽高、居中 `+`，并避开 iPhone 底部安全区。

## 校验
- 已执行 `node --check miniprogram/pages/roommate/index.js`。
- 已解析 `miniprogram/pages/roommate/index.json` 与 `miniprogram/app.json`。
- 已检查 `roommate` 页面未使用 `web-view`、`document`、`window`、`filter` 等禁用或高风险写法。
- 已检查页面内不再残留 `联系TA`、`contactOwner`、`post-contact`。
- 已静态核对新增筛选、发布弹层和详情弹层点击事件均有对应页面方法。
