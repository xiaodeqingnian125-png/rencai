# 公寓地址格式统一改造

## 日期
2026-07-18

## 背景
原公寓地址使用"路口交叉口"格式（如"科学大道与长椿路交叉口"），位置摘要使用"通勤圈/就业圈"描述。为提升信息准确性和一致性，统一改为"区域·公寓名"格式，位置摘要改为"距离地铁X号线XX站约XX米"。

## 修改内容

### 1. 数据层：`miniprogram/data/tables.js`
6 个公寓的 `address` 和 `location_meta` 字段全部替换为实际人才公寓项目名称：

| 公寓名称 | 修改后 address | 修改后 location_meta |
|---------|---------------|---------------------|
| 郑东人才公寓 | 郑东新区·复兴美寓 | 距离地铁1号线东风南路站约500米 |
| 高新人才家园 | 高新区·春藤美寓 | 距离地铁8号线冬青街站约800米 |
| 经开青年公寓 | 经开区·观湖美寓 | 距离地铁5号线经开中心广场站约600米 |
| 港区人才社区 | 航空港区·润丰锦尚 | 距离城郊线新郑机场站约1200米 |
| 二七人才公寓 | 二七区·金沙美寓 | 距离地铁5号线大学南路站约400米 |
| 中原青年社区 | 中原区·华山美寓 | 距离地铁1号线秦岭路站约350米 |

**小区名来源**：郑州城发"美寓"系列实际配租项目（郑州本地宝、郑州市住房保障和房地产管理局公告）。航空港区无"美寓"项目，使用实际项目原名"润丰锦尚"。

### 2. 联动修改：地址拆分逻辑
原代码基于"与"字拆分地址生成简短显示，新格式无"与"字，需同步调整：

#### `miniprogram/data/queries.js`（第334、339行）
- 收藏页公寓标签 `detail`：`address.split("与")[0] · district` → `address`（直接用完整地址）
- 收藏页公寓标签 `tags`：`location_meta.split(" · ")[0]` → `location_meta`（整体作为标签）

#### `miniprogram/pages/map/index.js`（第17行）
- 地图页简短位置 `getLocationShort`：`location.split("与")[0] · district` → `location`（直接用完整地址）

## 影响范围
数据层修改后，以下页面自动同步显示新地址：
- 首页公寓卡片（`index` 页 `item.location`）
- 公寓详情页地图栏（`apartment-detail` 页 `apartment.location` + `apartment.locationMeta`）
- 地图页标记和弹窗（`map` 页 `locShort` + `activeApartment.locationMeta`）
- 收藏页公寓标签（`favorites` 页 `item.detail` + `item.tags`）
- 管理后台公寓表（`admin` 页 `address` 字段直接展示）

## 统一显示效果
所有页面地址显示均为"区域·公寓名"格式，与公寓详情页完全一致，不再出现拆分后的碎片地址。

## 验证要点
- [x] 6 个公寓 address 字段全部修改
- [x] 6 个公寓 location_meta 字段全部修改
- [x] queries.js 中 2 处 split("与") 已清除
- [x] map/index.js 中 1 处 split("与") 已清除
- [x] 全项目搜索 split("与") 无残留
- [x] 管理后台 address 直接用 apartment.address，无需改

## 备注
- 距离数值为参考实际地铁站位置的估算值
- 地铁线路为郑州实际线路（1/5/8号线、城郊线）
- 户型详情页本身不显示地址，无需修改
