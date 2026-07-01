# 政策攻略页精修

## Scope
- 本次只调整 `miniprogram/pages/guide`。
- 继续使用微信小程序原生 WXML / WXSS / JS。
- 未引入第三方库，未使用 `web-view`。

## Changes
- 将顶部标签从原生 `button` 改为 `view`，避免默认按钮样式影响高度、边距和点击态。
- 新增政策摘要区：根据当前 Tab 展示标题、说明和数量徽标，让页面首屏信息更聚焦。
- 优化申请条件：由纯文本列表升级为标题 + 说明的清单结构，重点条件增加左侧强调线。
- 优化申请流程：改为时间线布局，增加步骤编号、节点标签和竖向连接线。
- 优化材料清单：增加材料简称图标、说明文本和份数/状态标签，长材料名和说明保持稳定排版。
- 优化常见 Q&A：增加独立 Q / A 标识，提升问答块扫描效率。
- 底部内容增加安全区间距，适配 iPhone home indicator。

## Validation
- `node --check miniprogram/pages/guide/index.js` 通过。
- `miniprogram/pages/guide/index.json` 与 `miniprogram/app.json` JSON 解析通过。
- `app.json` 页面路由确认包含 `pages/guide/index`。
- 事件方法检查通过：`switchTab` 存在。
- 静态检查未发现 `web-view`、`document`、`window`、`filter:` 或原生 `<button>`。

## iPhone Visual Check Notes
- 四个顶部 Tab 单行展示，`常见Q&A` 不换行。
- 摘要区右侧数量徽标宽高固定，不挤压标题说明。
- 流程时间线编号与文案对齐，长描述自然换行。
- 材料清单右侧标签固定，不压缩主体文本。
