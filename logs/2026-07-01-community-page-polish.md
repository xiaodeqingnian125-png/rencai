# 2026-07-01 加入社群页精修

## 本次改动
- 精修 `pages/community/index`，只调整加入社群页，不影响其他快捷入口页面。
- 优化二维码卡片层次，增加轻量背景标记、内阴影和卡片阴影。
- 将二维码点阵从 grid 调整为 flex 换行布局，提升小程序基础库兼容稳定性。
- 补充微信号展示胶囊，复制微信号时读取页面 data 中的 `wechatId`。
- 优化保存二维码、复制微信号按钮的层级、按压反馈和视觉权重。
- 优化加入社群权益列表，去掉最后一项分割线并补充底部安全区间距。

## 校验
- 已执行 `node --check miniprogram/pages/community/index.js`。
- 已解析 `miniprogram/pages/community/index.json` 与 `miniprogram/app.json`。
- 已检查 `community` 页面未使用 `web-view`、`document`、`window`、`filter` 等禁用或高风险写法。
- 已静态核对保存二维码、复制微信号事件仍有对应页面方法。
