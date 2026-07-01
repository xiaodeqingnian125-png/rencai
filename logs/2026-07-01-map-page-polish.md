# 地图选房页精修

## Scope
- 本次只调整 `miniprogram/pages/map`。
- 继续使用微信小程序原生 WXML / WXSS / JS。
- 未引入第三方库，未使用 `web-view`。

## Changes
- 增加地图区域层次：补充绿轴公园、东站片区、青年社区等轻量背景块，并强化道路、河道与底纹层级。
- 优化地图标记：将普通圆点调整为图钉样式，增加中心点、尾针、选中上浮和深色标签反馈。
- 优化底部信息卡：价格与标题同排展示，补充交通/位置摘要，图片占位增加层次，点击反馈更贴近设计稿。
- 优化底部公寓列表：增加当前选中态、左侧强调线、长标题/位置截断和点击反馈，价格保持不被挤压。
- 修复定位按钮形态风险：从原生 `button` 改为普通 `view` 自绘定位图标，保持正圆，不受按钮默认样式影响。
- 保持原跳转接口：详情仍跳转 `/pages/apartment-detail/index?id=...`。

## Validation
- `node --check miniprogram/pages/map/index.js` 通过。
- `miniprogram/pages/map/index.json` 与 `miniprogram/app.json` JSON 解析通过。
- 事件方法检查通过：`selectMarker`、`goDetail`、`locate` 均存在。
- 资源检查通过：`/assets/icons/chevron-muted.svg` 存在。
- 静态检查未发现 `web-view`、`document`、`window`、`filter:` 或地图页原生 `<button>`。

## iPhone Visual Check Notes
- 顶部地图区域保留足够高度，浮层卡片固定在地图底部，不遮挡底部列表。
- 标记点选中态更明显，长公寓名保持单行截断。
- 底部列表价格固定在右侧，不参与挤压标题和位置文本。
- 定位按钮宽高固定为 `80rpx`，使用普通 `view`，应保持正圆。
