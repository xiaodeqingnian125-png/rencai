# 2026-07-18 公寓详情页地图选点修正经纬度

## 任务

CSV 导入导出计划任务 22：在公寓详情页添加地图选点功能，让管理员能修正公寓经纬度。

## 改动文件

### 1. `miniprogram/app.json`

在 `requiredPrivateInfos` 数组中追加 `"chooseLocation"`，使 `wx.chooseLocation` 可以正常调用。简报未提及此步，但 `wx.chooseLocation` 是隐私相关接口，必须在 `requiredPrivateInfos` 中声明，否则真机调用会失败。

### 2. `miniprogram/pages/apartment-detail/index.js`

- 在 `data` 中新增 `locationMarkers: []` 字段。
- 在 `loadApartment` 的现有 `setData` 中合并 `locationMarkers` 初始化（保留任务 20 已有的 `apartment`、`isAdmin`、`favorite`，不替换）。
- 新增 `onMapTap` 方法：调用 `wx.chooseLocation`，成功后通过 `db.saveAdminItem("apartments", { id, longitude, latitude })` 以 patch 语义更新数据库，再局部刷新 `apartment.longitude/latitude` 与 `locationMarkers`。

### 3. `miniprogram/pages/apartment-detail/index.wxml`

在 `admin-image-section` 之后、`scroll-spacer` 之前插入管理员可见的 `admin-location-section`，包含经纬度展示文本、`map` 组件（scale=15，绑定 markers 与 bindtap="onMapTap"）、点击提示文案。

### 4. `miniprogram/pages/apartment-detail/index.wxss`

追加 4 个样式类：`.admin-location-section`、`.location-display`、`.location-map`、`.location-tip`。

## 上下文依赖

- `const db = require("../../data/db");` 与 `data.isAdmin` 均为任务 20 已引入，未重复添加。
- `queries.js` 的 `apartmentToDetail` 已传递 `latitude` 与 `longitude` 字段。
- `db.saveAdminItem` 为 patch 语义，传 `{ id, longitude, latitude }` 安全。
- `app.globalData.isAdmin` (boolean) 已存在。

## 验证

```bash
$ node -c miniprogram/pages/apartment-detail/index.js
SYNTAX_OK

$ node -e "JSON.parse(require('fs').readFileSync('miniprogram/app.json', 'utf8')); console.log('JSON_OK')"
JSON_OK
```

JS 语法检查通过，`app.json` JSON 格式合法。WXML/WXSS/JS 改动均按简报逐字落地，未引入第三方依赖。

## 提交

- 分支：`feat/csv-import-export`
- Commit message：`feat(detail): 公寓编辑页地图选点修正经纬度`
- SHA：`4d054698eddf9d00515ba6b6c70019b40f2b6539`
- 变更：4 files changed, 87 insertions(+), 3 deletions(-)

## 疑虑

1. `map` 组件在开发者工具中可能显示为模拟地图，真机才会显示真实地图，需真机预览验证 `wx.chooseLocation` 的调用与回调。
2. `wx.chooseLocation` 首次调用会触发 scope.userLocation 授权弹窗，当前 `permission.scope.userLocation` 的 desc 文案与"修正公寓经纬度"场景略有偏差但功能可用，可后续优化文案。
3. `loadApartment` 在 `onShow` 中也会触发，会重新 setData locationMarkers，可能覆盖管理员刚修正但尚未保存的中间态；当前流程中修正成功后会直接刷新 apartment 数据，不构成问题。
