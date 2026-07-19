# 地图选房页改用真实云数据

## 任务

将地图选房页面从本地 mock 数据改为真实云数据，补齐加载、错误、空状态和生命周期保护。

## 修改文件清单

| 文件 | 改动 |
|------|------|
| cloudfunctions/rencai/index.js | toApartmentCard 增加 latitude / longitude 字段（number，无效值为 0） |
| miniprogram/pages/map/index.js | 移除 data/queries 依赖，改用 db.getApartmentList；增加经纬度校验、生命周期保护、请求竞争保护、openLocation 安全校验、loading/error/empty/no-location 状态 |
| miniprogram/pages/map/index.wxml | 增加 loading/error/empty/no-location 状态层（cover-view 覆盖在地图区域上）；成功状态布局不变 |
| miniprogram/pages/map/index.wxss | 增加 .map-status / .map-status-text / .map-status-btn 样式，复用米白橙色设计 |

## 数据链路

- 旧：getApartments() from ../../data/queries（mock 全量详情）
- 新：db.getApartmentList({ page: 1, pageSize: 100 }) → 云函数 publicGetApartmentList → toApartmentCard（含 latitude/longitude）

## 分页限制说明

- 当前地图请求固定 `pageSize: 100`，仅适用于当前数据量（云端 apartments 集合 6 条记录）。
- **超过 100 条需循环分页**：当公寓总数超过 100 条时，当前实现只会拉取前 100 条，后续公寓不会出现在地图上。
- 后续若数据量增长，需改为循环分页拉取（hasMore 判断 + 累积到 markers），或调大 pageSize，或在云函数侧增加全量返回的专用 action。
- 此为已知限制，首发版本不处理。

## 经纬度合法性规则

- latitude / longitude 均为有限数字
- latitude 在 [-90, 90]
- longitude 在 [-180, 180]
- 不能同时为 0
- 非法坐标不生成 marker、不调用 wx.openLocation

## 生命周期保护

- onLoad 设置 _isAlive = true
- onUnload 设置 _isAlive = false
- 云请求 success / catch 前检查 _isAlive
- 请求序号 _reqId，旧请求回调不覆盖新请求
- _loading 标记防止重复请求
- onShow 不再无条件重新加载

## 范围限制遵守

- 未修改管理员导入导出功能
- 未修改首页 / 公寓详情 / 户型详情布局
- 未新增 contact_phone / makePhoneCall
- 未调用 wx.chooseLocation
- env.js 未进入 diff
- requireAdmin 保持完好
- 未部署、未提交、未推送、未修改线上数据库
