# 地图选房接入腾讯地图

## Scope
- 本次主要调整 `miniprogram/pages/map`、`miniprogram/data/apartments.js`、`miniprogram/app.json`。
- 使用微信小程序原生 `map` 组件展示真实腾讯地图底图。
- 未引入第三方库，未使用 `web-view`。

## Changes
- 将地图选房页从手绘静态地图切换为原生 `<map>` 组件。
- 为公寓静态数据补充 GCJ-02 经纬度，地图 marker、底部列表和详情跳转共用同一份房源数据。
- 新增普通/选中态本地 PNG marker 图标：`/assets/icons/map-pin.png`、`/assets/icons/map-pin-active.png`。
- 支持从详情页带 `id` 打开地图时直接选中并居中对应公寓。
- 支持点击腾讯地图 marker 或底部房源列表切换当前选中公寓。
- 新增“导航”入口，调用 `wx.openLocation` 打开选中公寓位置。
- 新增“定位到我”入口，调用 `wx.getLocation` 并在授权后展示用户当前位置。
- 在 `app.json` 中补充 `scope.userLocation` 说明和 `requiredPrivateInfos: ["getLocation"]`。

## Validation
- `node --check miniprogram/pages/map/index.js` 通过。
- `node --check miniprogram/data/apartments.js` 通过。
- `node -e 'JSON.parse(...)'` 校验 `miniprogram/app.json`、`miniprogram/pages/map/index.json`、`project.config.json` 通过。
- `file miniprogram/assets/icons/map-pin.png miniprogram/assets/icons/map-pin-active.png` 确认 marker 图标为 96 x 120 RGBA PNG。
- 尚未在微信开发者工具中执行完整编译，需在 iPhone 模拟器下重点确认原生地图、cover-view 浮层、定位授权弹窗和 `wx.openLocation` 行为。
