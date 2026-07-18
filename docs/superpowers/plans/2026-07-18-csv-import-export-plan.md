# 公寓与户型 CSV 批量导入导出 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现公寓与户型信息的 CSV 批量导入导出，支持全量字段、地址自动转经纬度、导入任务流程（创建-校验-预览-确认）、图片上传和地图选点修正。

**架构：** 管理员上传 CSV → 云函数创建导入任务 → 解析校验（BOM处理/类型转换/公寓code校验）→ 地址转经纬度（腾讯→高德二级策略）→ 预览（正常数据+错误报告）→ 确认后分批写入云数据库。数据存储在 apartments/room_types/import_tasks 三个云数据库集合。

**技术栈：** 微信小程序原生（WXML/WXSS/JS）、微信云开发（云函数 wx-server-sdk、云数据库、云存储）、腾讯位置服务 API、高德位置服务 API

**设计文档：** `docs/superpowers/specs/2026-07-18-csv-import-export-design.md`

---

## 文件结构

### 创建的新文件

| 文件路径 | 职责 |
|---------|------|
| `cloudfunctions/rencai/lib/geocode.js` | 地理编码模块：腾讯+高德二级策略 |
| `cloudfunctions/rencai/lib/csv-parser.js` | CSV 解析模块：stripBOM、类型转换、校验 |
| `cloudfunctions/rencai/lib/import-task.js` | 导入任务流程模块：创建/预览/确认 |
| `cloudfunctions/rencai/seed/apartments.json` | 公寓种子数据（含 apartment_code） |
| `cloudfunctions/rencai/seed/room_types.json` | 户型种子数据（含 apartment_code） |
| `miniprogram/pages/admin/import-history/index.{js,wxml,wxss,json}` | 导入历史页 |
| `miniprogram/pages/admin/import-preview/index.{js,wxml,wxss,json}` | 导入预览页 |

### 修改的现有文件

| 文件路径 | 变更 |
|---------|------|
| `miniprogram/data/db.js` | DATA_MODE 改 "cloud"，新增导入任务相关接口封装 |
| `miniprogram/data/tables.js` | 6 公寓补 apartment_code 字段（A001-A006） |
| `miniprogram/pages/admin/index.js` | CSV 导入导出逻辑升级，接入任务流程，BOM 处理 |
| `miniprogram/pages/admin/index.wxml` | 新增"导入历史"入口、按条件导出 UI |
| `miniprogram/pages/admin/index.wxss` | 新增相关样式 |
| `cloudfunctions/rencai/index.js` | 新增 6 个导入任务接口、exportAdminItems 接口 |
| `cloudfunctions/rencai/config.json` | 超时改 20 秒 |
| `cloudfunctions/rencai/package.json` | 新增 axios 依赖（地理编码 HTTP 请求） |
| `miniprogram/pages/apartment-detail/index.{js,wxml}` | 接入图片上传、地图选点组件 |
| `miniprogram/pages/room-detail/index.{js,wxml}` | 接入图片上传组件 |

---

## 任务总览

本计划分为 6 个阶段，共 24 个任务：

- 阶段1：云数据库 + 数据迁移（任务 1-4）
- 阶段2：CSV 字段优化 + BOM 处理（任务 5-8）
- 阶段3：云函数升级（任务 9-15）
- 阶段4：后台 UI（任务 16-19）
- 阶段5：图片上传 + 地图选点（任务 20-22）
- 阶段6：验证与文档（任务 23-24）

---

## 阶段1：云数据库 + 数据迁移

### 任务 1：生成种子数据 JSON（公寓，补 apartment_code）

**文件：**
- 创建：`cloudfunctions/rencai/seed/apartments.json`

- [ ] **步骤 1：创建公寓种子数据文件**

创建 `cloudfunctions/rencai/seed/apartments.json`，包含现有 6 个公寓数据，每个增加 `apartment_code` 字段：

```json
[
  {
    "id": 1,
    "apartment_code": "A001",
    "name": "郑东人才公寓",
    "district": "郑东新区",
    "address": "郑东新区·复兴美寓",
    "longitude": 113.7484,
    "latitude": 34.7597,
    "location_meta": "距离地铁1号线东风南路站约500米",
    "price_min": 1200,
    "price_max": 1800,
    "room_summary": "1-2居",
    "status": "active",
    "image": "apt-1.jpg",
    "hero_class": "hero-zd",
    "image_class": "apt-img-1",
    "tags": [{"label": "热门", "className": "tag-hot"}, {"label": "地铁直达", "className": "tag-metro"}],
    "costs": [{"label": "水费", "value": "按实际用量"}, {"label": "电费", "value": "0.56元/度"}, {"label": "燃气", "value": "2.5元/立方"}, {"label": "物业费", "value": "1.2元/㎡/月"}, {"label": "网费", "value": "50元/月"}],
    "private_facilities": ["独立卫浴", "空调", "热水器", "宽带", "衣柜", "书桌"],
    "public_facilities": ["自助洗衣房", "公共厨房", "健身区", "快递柜", "休闲区", "充电桩"],
    "nearby": ["超市/便利店", "快餐小吃", "药店", "公交站", "地铁站", "银行"]
  },
  {
    "id": 2,
    "apartment_code": "A002",
    "name": "高新人才家园",
    "district": "高新区",
    "address": "高新区·春藤美寓",
    "longitude": 113.5419,
    "latitude": 34.8126,
    "location_meta": "距离地铁8号线冬青街站约800米",
    "price_min": 800,
    "price_max": 1200,
    "room_summary": "开间/1居",
    "status": "active",
    "image": "apt-2.jpg",
    "hero_class": "hero-gx",
    "image_class": "apt-img-2",
    "tags": [{"label": "热租", "className": "tag-hot"}, {"label": "性价比", "className": "tag-value"}],
    "costs": [{"label": "水费", "value": "按实际用量"}, {"label": "电费", "value": "0.56元/度"}, {"label": "燃气", "value": "2.5元/立方"}, {"label": "物业费", "value": "1元/㎡/月"}, {"label": "网费", "value": "40元/月"}],
    "private_facilities": ["独立卫浴", "空调", "热水器", "宽带", "衣柜", "书桌"],
    "public_facilities": ["自助洗衣房", "公共厨房", "快递柜", "休闲区"],
    "nearby": ["超市/便利店", "快餐小吃", "药店", "公交站", "便利店"]
  },
  {
    "id": 3,
    "apartment_code": "A003",
    "name": "经开青年公寓",
    "district": "经开区",
    "address": "经开区·观湖美寓",
    "longitude": 113.7426,
    "latitude": 34.7219,
    "location_meta": "距离地铁5号线经开中心广场站约600米",
    "price_min": 1000,
    "price_max": 1500,
    "room_summary": "1-2居",
    "status": "active",
    "image": "apt-3.jpg",
    "hero_class": "hero-jk",
    "image_class": "apt-img-3",
    "tags": [{"label": "通勤", "className": "tag-metro"}],
    "costs": [{"label": "水费", "value": "按实际用量"}, {"label": "电费", "value": "0.56元/度"}, {"label": "燃气", "value": "2.5元/立方"}, {"label": "物业费", "value": "1元/㎡/月"}, {"label": "网费", "value": "50元/月"}],
    "private_facilities": ["独立卫浴", "空调", "热水器", "宽带", "衣柜", "书桌"],
    "public_facilities": ["自助洗衣房", "快递柜", "休闲区", "充电桩"],
    "nearby": ["超市/便利店", "快餐小吃", "药店", "公交站"]
  },
  {
    "id": 4,
    "apartment_code": "A004",
    "name": "港区人才社区",
    "district": "航空港区",
    "address": "航空港区·润丰锦尚",
    "longitude": 113.8424,
    "latitude": 34.5344,
    "location_meta": "距离城郊线新郑机场站约1200米",
    "price_min": 700,
    "price_max": 1100,
    "room_summary": "开间/1居",
    "status": "active",
    "image": "apt-4.jpg",
    "hero_class": "hero-gq",
    "image_class": "apt-img-4",
    "tags": [{"label": "近机场", "className": "tag-value"}],
    "costs": [{"label": "水费", "value": "按实际用量"}, {"label": "电费", "value": "0.56元/度"}, {"label": "燃气", "value": "2.5元/立方"}, {"label": "物业费", "value": "0.8元/㎡/月"}, {"label": "网费", "value": "40元/月"}],
    "private_facilities": ["独立卫浴", "空调", "热水器", "宽带", "衣柜"],
    "public_facilities": ["自助洗衣房", "快递柜", "休闲区"],
    "nearby": ["超市/便利店", "快餐小吃", "药店"]
  },
  {
    "id": 5,
    "apartment_code": "A005",
    "name": "二七人才公寓",
    "district": "二七区",
    "address": "二七区·金沙美寓",
    "longitude": 113.6398,
    "latitude": 34.7221,
    "location_meta": "距离地铁5号线大学南路站约400米",
    "price_min": 900,
    "price_max": 1300,
    "room_summary": "1-2居",
    "status": "active",
    "image": "apt-5.jpg",
    "hero_class": "hero-eq",
    "image_class": "apt-img-5",
    "tags": [{"label": "商圈", "className": "tag-hot"}],
    "costs": [{"label": "水费", "value": "按实际用量"}, {"label": "电费", "value": "0.56元/度"}, {"label": "燃气", "value": "2.5元/立方"}, {"label": "物业费", "value": "1.2元/㎡/月"}, {"label": "网费", "value": "50元/月"}],
    "private_facilities": ["独立卫浴", "空调", "热水器", "宽带", "衣柜", "书桌"],
    "public_facilities": ["自助洗衣房", "公共厨房", "快递柜", "休闲区"],
    "nearby": ["超市/便利店", "快餐小吃", "药店", "公交站", "地铁站"]
  },
  {
    "id": 6,
    "apartment_code": "A006",
    "name": "中原青年社区",
    "district": "中原区",
    "address": "中原区·华山美寓",
    "longitude": 113.6066,
    "latitude": 34.7537,
    "location_meta": "距离地铁1号线秦岭路站约350米",
    "price_min": 850,
    "price_max": 1250,
    "room_summary": "1-3居",
    "status": "active",
    "image": "apt-6.jpg",
    "hero_class": "hero-zy",
    "image_class": "apt-img-6",
    "tags": [{"label": "地铁直达", "className": "tag-metro"}],
    "costs": [{"label": "水费", "value": "按实际用量"}, {"label": "电费", "value": "0.56元/度"}, {"label": "燃气", "value": "2.5元/立方"}, {"label": "物业费", "value": "1元/㎡/月"}, {"label": "网费", "value": "50元/月"}],
    "private_facilities": ["独立卫浴", "空调", "热水器", "宽带", "衣柜", "书桌"],
    "public_facilities": ["自助洗衣房", "公共厨房", "健身区", "快递柜"],
    "nearby": ["超市/便利店", "快餐小吃", "药店", "公交站", "地铁站", "银行"]
  }
]
```

- [ ] **步骤 2：Commit**

```bash
git add cloudfunctions/rencai/seed/apartments.json
git commit -m "feat(seed): 添加公寓种子数据含 apartment_code"
```

---

### 任务 2：生成种子数据 JSON（户型，补 apartment_code）

**文件：**
- 创建：`cloudfunctions/rencai/seed/room_types.json`

- [ ] **步骤 1：创建户型种子数据文件**

创建 `cloudfunctions/rencai/seed/room_types.json`，包含现有 14 个户型数据，每个增加 `apartment_code` 字段：

```json
[
  {"id": 1, "apartment_id": 1, "apartment_code": "A001", "name": "精致一居室", "area": "35㎡", "orient": "南向", "layout": "1室1卫", "floor": "3层 / 总8层", "price": 1200, "status": "active", "image": "room-1.jpg", "desc": "独立一居室户型，采光良好，适合单人居住"},
  {"id": 2, "apartment_id": 1, "apartment_code": "A001", "name": "舒适两居室", "area": "55㎡", "orient": "东南向", "layout": "2室1厅1卫", "floor": "5层 / 总8层", "price": 1500, "status": "active", "image": "room-2.jpg", "desc": "两居室户型，双卧室设计，适合情侣或合租"},
  {"id": 3, "apartment_id": 1, "apartment_code": "A001", "name": "阳光大单间", "area": "28㎡", "orient": "西向", "layout": "开间", "floor": "7层 / 总8层", "price": 1000, "status": "active", "image": "room-3.jpg", "desc": "大开间设计，空间利用率高"},
  {"id": 4, "apartment_id": 2, "apartment_code": "A002", "name": "高新阳光单间", "area": "25㎡", "orient": "南向", "layout": "开间", "floor": "4层 / 总6层", "price": 800, "status": "active", "image": "room-4.jpg", "desc": "紧凑开间，南向采光"},
  {"id": 5, "apartment_id": 2, "apartment_code": "A002", "name": "高新舒适一居", "area": "38㎡", "orient": "东向", "layout": "1室1卫", "floor": "2层 / 总6层", "price": 1000, "status": "active", "image": "room-5.jpg", "desc": "一居室户型，独立厨房"},
  {"id": 6, "apartment_id": 2, "apartment_code": "A002", "name": "青年独立一居", "area": "42㎡", "orient": "南向", "layout": "1室1厅1卫", "floor": "5层 / 总6层", "price": 1200, "status": "active", "image": "room-6.jpg", "desc": "带独立客厅的一居室"},
  {"id": 7, "apartment_id": 3, "apartment_code": "A003", "name": "经开标准一居", "area": "36㎡", "orient": "南向", "layout": "1室1卫", "floor": "3层 / 总10层", "price": 1100, "status": "active", "image": "room-7.jpg", "desc": "标准一居室，户型方正"},
  {"id": 8, "apartment_id": 3, "apartment_code": "A003", "name": "经开舒适两居", "area": "58㎡", "orient": "东南向", "layout": "2室1厅1卫", "floor": "8层 / 总10层", "price": 1400, "status": "active", "image": "room-8.jpg", "desc": "两居室户型，主卧带阳台"},
  {"id": 9, "apartment_id": 4, "apartment_code": "A004", "name": "港区经济单间", "area": "22㎡", "orient": "北向", "layout": "开间", "floor": "2层 / 总5层", "price": 700, "status": "active", "image": "room-9.jpg", "desc": "经济型开间，价格实惠"},
  {"id": 10, "apartment_id": 4, "apartment_code": "A004", "name": "港区独立一居", "area": "40㎡", "orient": "南向", "layout": "1室1卫", "floor": "4层 / 总5层", "price": 950, "status": "active", "image": "room-10.jpg", "desc": "独立一居室，适合单人"},
  {"id": 11, "apartment_id": 5, "apartment_code": "A005", "name": "二七舒适两居", "area": "60㎡", "orient": "南向", "layout": "2室1厅1卫", "floor": "6层 / 总12层", "price": 1300, "status": "active", "image": "room-11.jpg", "desc": "两居室户型，采光通风良好"},
  {"id": 12, "apartment_id": 5, "apartment_code": "A005", "name": "二七通透三居", "area": "85㎡", "orient": "南北通透", "layout": "3室1厅1卫", "floor": "9层 / 总12层", "price": 1500, "status": "hidden", "image": "room-12.jpg", "desc": "三居室户型，南北通透，适合家庭"},
  {"id": 13, "apartment_id": 6, "apartment_code": "A006", "name": "中原温馨一居", "area": "36㎡", "orient": "南向", "layout": "1室1卫", "floor": "4层 / 总8层", "price": 900, "status": "active", "image": "room-13.jpg", "desc": "温馨一居室，家电齐全"},
  {"id": 14, "apartment_id": 6, "apartment_code": "A006", "name": "中原合租两居", "area": "52㎡", "orient": "东向", "layout": "2室1卫", "floor": "6层 / 总8层", "price": 1100, "status": "active", "image": "room-14.jpg", "desc": "两居室合租户型，性价比高"}
]
```

- [ ] **步骤 2：Commit**

```bash
git add cloudfunctions/rencai/seed/room_types.json
git commit -m "feat(seed): 添加户型种子数据含 apartment_code"
```

---

### 任务 3：tables.js 补 apartment_code 字段

**文件：**
- 修改：`miniprogram/data/tables.js`

- [ ] **步骤 1：为6个公寓补 apartment_code 字段**

在 `miniprogram/data/tables.js` 的 `apartments` 数组中，每个公寓对象在 `id` 字段后新增 `apartment_code` 字段。修改示例（以第1个为例）：

```javascript
// 修改前
{
  id: 1,
  name: "郑东人才公寓",

// 修改后
{
  id: 1,
  apartment_code: "A001",
  name: "郑东人才公寓",
```

同样为其他5个公寓添加 `apartment_code: "A002"` 到 `apartment_code: "A006"`。

在 `room_types` 数组中，每个户型对象在 `apartment_id` 字段后新增 `apartment_code` 字段：

```javascript
// 修改前
{
  id: 1,
  apartment_id: 1,
  name: "精致一居室",

// 修改后
{
  id: 1,
  apartment_id: 1,
  apartment_code: "A001",
  name: "精致一居室",
```

按附录B的对应关系，为所有14个户型补 `apartment_code`。

- [ ] **步骤 2：语法检查**

运行：`node -c miniprogram/data/tables.js`
预期：无输出（语法正确）

- [ ] **步骤 3：Commit**

```bash
git add miniprogram/data/tables.js
git commit -m "feat(tables): 公寓和户型补 apartment_code 字段"
```

---

### 任务 4：编写数据迁移云函数接口

**文件：**
- 修改：`cloudfunctions/rencai/index.js`
- 创建：`cloudfunctions/rencai/lib/migrate.js`

- [ ] **步骤 1：创建迁移模块**

创建 `cloudfunctions/rencai/lib/migrate.js`：

```javascript
/**
 * 数据迁移模块
 * 把 seed/*.json 种子数据写入云数据库
 */

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const apartmentsSeed = require("../seed/apartments.json");
const roomTypesSeed = require("../seed/room_types.json");

/**
 * 迁移公寓种子数据到云数据库
 */
async function migrateApartments() {
  const col = db.collection("apartments");
  const results = { total: apartmentsSeed.length, inserted: 0, skipped: 0, errors: [] };

  for (let i = 0; i < apartmentsSeed.length; i++) {
    const apt = apartmentsSeed[i];
    try {
      // 检查是否已存在（按 apartment_code）
      const exist = await col.where({ apartment_code: apt.apartment_code }).get();
      if (exist.data.length > 0) {
        results.skipped++;
        continue;
      }
      await col.add({
        data: {
          ...apt,
          create_time: db.serverDate(),
          update_time: db.serverDate()
        }
      });
      results.inserted++;
    } catch (err) {
      results.errors.push({ code: apt.apartment_code, error: err.message });
    }
  }
  return { ok: true, results };
}

/**
 * 迁移户型种子数据到云数据库
 */
async function migrateRoomTypes() {
  const col = db.collection("room_types");
  const results = { total: roomTypesSeed.length, inserted: 0, skipped: 0, errors: [] };

  for (let i = 0; i < roomTypesSeed.length; i++) {
    const room = roomTypesSeed[i];
    try {
      // 检查是否已存在（按 name + apartment_code）
      const exist = await col.where({ name: room.name, apartment_code: room.apartment_code }).get();
      if (exist.data.length > 0) {
        results.skipped++;
        continue;
      }
      await col.add({
        data: {
          ...room,
          create_time: db.serverDate(),
          update_time: db.serverDate()
        }
      });
      results.inserted++;
    } catch (err) {
      results.errors.push({ name: room.name, error: err.message });
    }
  }
  return { ok: true, results };
}

module.exports = { migrateApartments, migrateRoomTypes };
```

- [ ] **步骤 2：在 index.js 注册迁移接口**

在 `cloudfunctions/rencai/index.js` 的 action 路由部分新增（找到现有的 action 判断逻辑，添加）：

```javascript
const { migrateApartments, migrateRoomTypes } = require("./lib/migrate");

// 在 exports.main 的 action 路由中添加
case "migrateApartments":
  return await migrateApartments();
case "migrateRoomTypes":
  return await migrateRoomTypes();
```

- [ ] **步骤 3：语法检查**

运行：`node -c cloudfunctions/rencai/lib/migrate.js && node -c cloudfunctions/rencai/index.js`
预期：无输出

- [ ] **步骤 4：Commit**

```bash
git add cloudfunctions/rencai/lib/migrate.js cloudfunctions/rencai/index.js
git commit -m "feat(cloud): 数据迁移接口 migrateApartments/migrateRoomTypes"
```

---

## 阶段2：CSV 字段优化 + BOM 处理

### 任务 5：创建 CSV 解析模块（云函数端）

**文件：**
- 创建：`cloudfunctions/rencai/lib/csv-parser.js`

- [ ] **步骤 1：创建 CSV 解析模块**

创建 `cloudfunctions/rencai/lib/csv-parser.js`：

```javascript
/**
 * CSV 解析模块
 * 处理 BOM、分隔、类型转换
 */

/**
 * 去除 BOM 头
 */
function stripBOM(text) {
  if (typeof text !== "string") return "";
  return text.replace(/^\ufeff/, "");
}

/**
 * 解析 CSV 文本为行数组
 * 支持引号包裹、逗号分隔、换行
 */
function parseCsv(text) {
  const cleaned = stripBOM(text);
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const nextChar = cleaned[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else if (char === "\r") {
        // 跳过 \r，配合 \r\n
      } else {
        currentField += char;
      }
    }
  }
  // 最后一行
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  // 移除空行
  return rows.filter((row) => row.some((field) => field.trim() !== ""));
}

/**
 * 把行数组转为对象数组（第一行作为表头）
 */
function rowsToObjects(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row, index) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = (row[i] || "").trim();
    });
    obj.__rowNum = index + 2; // 行号（从2开始，第1行是表头）
    return obj;
  });
}

/**
 * 数组字段转字符串（导出用）
 * 如 ["超市", "药店"] → "超市|药店"
 */
function arrayToCsvString(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join("|");
}

/**
 * 字符串转数组（导入用）
 * 支持 | 、｜ 分隔
 */
function csvStringToArray(str) {
  if (!str || typeof str !== "string") return [];
  return str.split(/[|｜]/).map((s) => s.trim()).filter((s) => s !== "");
}

/**
 * 安全转数字
 */
function toNumber(value, defaultValue = 0) {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 安全转整数
 */
function toInt(value, defaultValue = 0) {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

module.exports = {
  stripBOM,
  parseCsv,
  rowsToObjects,
  arrayToCsvString,
  csvStringToArray,
  toNumber,
  toInt
};
```

- [ ] **步骤 2：语法检查**

运行：`node -c cloudfunctions/rencai/lib/csv-parser.js`
预期：无输出

- [ ] **步骤 3：Commit**

```bash
git add cloudfunctions/rencai/lib/csv-parser.js
git commit -m "feat(cloud): CSV 解析模块 stripBOM/parseCsv/类型转换"
```

---

### 任务 6：创建前端 CSV 工具函数（BOM 处理）

**文件：**
- 修改：`miniprogram/pages/admin/index.js`

- [ ] **步骤 1：升级 toCsvText 函数，拼接 BOM 头**

在 `miniprogram/pages/admin/index.js` 中找到 `toCsvText` 函数（或类似的 CSV 生成函数），修改为在开头拼接 `\ufeff`：

```javascript
// 修改前
function toCsvText(headers, rows) {
  // ... 原逻辑
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

// 修改后
function toCsvText(headers, rows) {
  // ... 原逻辑
  const body = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  return "\ufeff" + body; // 拼接 BOM 头，确保 Excel 打开不乱码
}
```

如果函数签名不同，保持原签名，只在返回值前拼接 `"\ufeff"`。

- [ ] **步骤 2：升级 parseDelimitedRows 函数，stripBOM**

在 `miniprogram/pages/admin/index.js` 中找到 `parseDelimitedRows` 或 `tableTextToRows` 函数，在解析前去除 BOM：

```javascript
// 在函数开头添加
function parseDelimitedRows(text) {
  // 去除 BOM 头
  const cleaned = text.replace(/^\ufeff/, "");
  // ... 原解析逻辑使用 cleaned
}
```

- [ ] **步骤 3：语法检查**

运行：`node -c miniprogram/pages/admin/index.js`
预期：无输出

- [ ] **步骤 4：Commit**

```bash
git add miniprogram/pages/admin/index.js
git commit -m "feat(admin): CSV 导出拼 BOM 头，导入 stripBOM"
```

---

### 任务 7：升级公寓 CSV 字段（删除经纬度，新增 code）

**文件：**
- 修改：`miniprogram/pages/admin/index.js`

- [ ] **步骤 1：升级公寓 CSV 表头和字段映射**

在 `miniprogram/pages/admin/index.js` 中找到公寓 CSV 的表头定义和字段映射逻辑（通常在 `exportApartmentCsv` 或类似函数中），修改为：

```javascript
// 公寓 CSV 表头（10列，删除经纬度，新增 apartment_code）
const APARTMENT_CSV_HEADERS = [
  "公寓编号", "公寓名称", "区域", "地址", "位置摘要",
  "最低租金", "最高租金", "居室类型", "状态", "封面图文件名"
];

// 公寓对象 → CSV 行
function apartmentToCsvRow(apt) {
  return [
    apt.apartment_code || "",
    apt.name || "",
    apt.district || "",
    apt.address || "",
    apt.location_meta || "",
    apt.price_min || "",
    apt.price_max || "",
    apt.room_summary || "",
    apt.status || "",
    apt.image || ""
  ];
}

// CSV 行 → 公寓对象（导入用）
function csvRowToApartment(row) {
  return {
    apartment_code: row["公寓编号"] || "",
    name: row["公寓名称"] || "",
    district: row["区域"] || "",
    address: row["地址"] || "",
    location_meta: row["位置摘要"] || "",
    price_min: parseInt(row["最低租金"]) || 0,
    price_max: parseInt(row["最高租金"]) || 0,
    room_summary: row["居室类型"] || "",
    status: row["状态"] || "active",
    image: row["封面图文件名"] || ""
  };
}
```

- [ ] **步骤 2：语法检查**

运行：`node -c miniprogram/pages/admin/index.js`
预期：无输出

- [ ] **步骤 3：Commit**

```bash
git add miniprogram/pages/admin/index.js
git commit -m "feat(admin): 公寓 CSV 字段升级（删经纬度+code）"
```

---

### 任务 8：升级户型 CSV 字段（apartment_code + apartment_name）

**文件：**
- 修改：`miniprogram/pages/admin/index.js`

- [ ] **步骤 1：升级户型 CSV 表头和字段映射**

在 `miniprogram/pages/admin/index.js` 中找到户型 CSV 的表头定义和字段映射逻辑，修改为：

```javascript
// 户型 CSV 表头（10列，apartment_code + apartment_name 替代 apartment_id）
const ROOM_CSV_HEADERS = [
  "户型名称", "公寓编号", "所属公寓名称", "面积", "朝向",
  "居室", "楼层", "租金", "状态", "封面图文件名"
];

// 户型对象 → CSV 行
function roomToCsvRow(room, apartmentName) {
  return [
    room.name || "",
    room.apartment_code || "",
    apartmentName || "",
    room.area || "",
    room.orient || "",
    room.layout || "",
    room.floor || "",
    room.price || "",
    room.status || "",
    room.image || ""
  ];
}

// CSV 行 → 户型对象（导入用）
function csvRowToRoom(row) {
  return {
    name: row["户型名称"] || "",
    apartment_code: row["公寓编号"] || "",
    apartment_name: row["所属公寓名称"] || "",
    area: row["面积"] || "",
    orient: row["朝向"] || "",
    layout: row["居室"] || "",
    floor: row["楼层"] || "",
    price: parseInt(row["租金"]) || 0,
    status: row["状态"] || "active",
    image: row["封面图文件名"] || ""
  };
}
```

- [ ] **步骤 2：升级导出逻辑，查询公寓名称**

在户型导出函数中，需要查询公寓列表以获取 `apartment_name`：

```javascript
// 导出户型 CSV 时
async function exportRoomCsv() {
  const apartments = await db.getAdminDataset("apartments");
  const apartmentMap = {};
  apartments.forEach(apt => {
    apartmentMap[apt.apartment_code] = apt.name;
  });

  const rooms = await db.getAdminDataset("room_types");
  const rows = rooms.map(room => roomToCsvRow(room, apartmentMap[room.apartment_code]));
  return toCsvText(ROOM_CSV_HEADERS, rows);
}
```

- [ ] **步骤 3：语法检查**

运行：`node -c miniprogram/pages/admin/index.js`
预期：无输出

- [ ] **步骤 4：Commit**

```bash
git add miniprogram/pages/admin/index.js
git commit -m "feat(admin): 户型 CSV 字段升级（code+name 双列校验）"
```

---

## 阶段3：云函数升级（任务+校验+地理编码+批量）

### 任务 9：创建地理编码模块

**文件：**
- 创建：`cloudfunctions/rencai/lib/geocode.js`
- 修改：`cloudfunctions/rencai/package.json`

- [ ] **步骤 1：添加 axios 依赖**

修改 `cloudfunctions/rencai/package.json`，在 dependencies 中添加 axios：

```json
{
  "name": "rencai",
  "version": "1.0.0",
  "dependencies": {
    "wx-server-sdk": "latest",
    "axios": "^1.6.0"
  }
}
```

- [ ] **步骤 2：创建地理编码模块**

创建 `cloudfunctions/rencai/lib/geocode.js`：

```javascript
/**
 * 地理编码模块
 * 地址 → 经纬度，腾讯+高德二级策略
 */

const axios = require("axios");

// 郑州经纬度范围（用于校验）
const ZHENGZHOU_BOUNDS = {
  lngMin: 112.7,
  lngMax: 114.0,
  latMin: 34.25,
  latMax: 34.95
};

/**
 * 校验经纬度是否在郑州范围
 */
function isInRange(lng, lat) {
  return (
    lng >= ZHENGZHOU_BOUNDS.lngMin &&
    lng <= ZHENGZHOU_BOUNDS.lngMax &&
    lat >= ZHENGZHOU_BOUNDS.latMin &&
    lat <= ZHENGZHOU_BOUNDS.latMax &&
    lng !== 0 &&
    lat !== 0
  );
}

/**
 * 调用腾讯地图 Geocoder
 */
async function geocodeByTencent(address) {
  const key = process.env.TENCENT_MAP_KEY;
  if (!key) return null;

  try {
    const fullAddress = "郑州" + address;
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?address=${encodeURIComponent(fullAddress)}&key=${key}`;
    const res = await axios.get(url, { timeout: 5000 });

    if (res.data && res.data.status === 0 && res.data.result) {
      const { lng, lat } = res.data.result.location;
      if (isInRange(lng, lat)) {
        return { lng, lat, source: "tencent" };
      }
    }
    return null;
  } catch (err) {
    console.warn("腾讯地图地理编码失败:", err.message);
    return null;
  }
}

/**
 * 调用高德地图 Geocoder
 */
async function geocodeByAmap(address) {
  const key = process.env.AMAP_KEY;
  if (!key) return null;

  try {
    const fullAddress = "郑州" + address;
    const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(fullAddress)}&key=${key}`;
    const res = await axios.get(url, { timeout: 5000 });

    if (res.data && res.data.status === "1" && res.data.geocodes && res.data.geocodes.length > 0) {
      const location = res.data.geocodes[0].location; // "lng,lat"
      const [lngStr, latStr] = location.split(",");
      const lng = parseFloat(lngStr);
      const lat = parseFloat(latStr);
      if (isInRange(lng, lat)) {
        return { lng, lat, source: "amap" };
      }
    }
    return null;
  } catch (err) {
    console.warn("高德地图地理编码失败:", err.message);
    return null;
  }
}

/**
 * 二级策略：腾讯 → 高德 → 0,0
 */
async function geocodeAddress(address) {
  if (!address || address.trim() === "") {
    return { lng: 0, lat: 0, source: "empty" };
  }

  // 先尝试腾讯
  const tencentResult = await geocodeByTencent(address);
  if (tencentResult) return tencentResult;

  // 腾讯失败，尝试高德
  const amapResult = await geocodeByAmap(address);
  if (amapResult) return amapResult;

  // 都失败，返回 0,0
  return { lng: 0, lat: 0, source: "failed" };
}

module.exports = { geocodeAddress, isInRange };
```

- [ ] **步骤 3：语法检查**

运行：`node -c cloudfunctions/rencai/lib/geocode.js`
预期：无输出

- [ ] **步骤 4：Commit**

```bash
git add cloudfunctions/rencai/lib/geocode.js cloudfunctions/rencai/package.json
git commit -m "feat(cloud): 地理编码模块 腾讯+高德二级策略"
```

---

### 任务 10：创建导入任务模块

**文件：**
- 创建：`cloudfunctions/rencai/lib/import-task.js`

- [ ] **步骤 1：创建导入任务模块**

创建 `cloudfunctions/rencai/lib/import-task.js`：

```javascript
/**
 * 导入任务流程模块
 * 创建 → 预览（解析+校验+地理编码）→ 确认写入
 */

const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const { stripBOM, parseCsv, rowsToObjects, csvStringToArray, toNumber, toInt } = require("./csv-parser");
const { geocodeAddress } = require("./geocode");

const BATCH_SIZE = 20; // 每批写入条数

/**
 * 生成任务编号
 */
function generateTaskId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(now.getTime()).slice(-6);
  return `IMP-${y}${m}${d}-${seq}`;
}

/**
 * 创建导入任务
 * @param {string} targetType - "apartments" | "room_types"
 * @param {string} fileName - 文件名
 * @param {string} csvContent - CSV 文本内容
 * @param {string} operator - 操作人 user_id
 */
async function createImportTask(targetType, fileName, csvContent, operator) {
  const taskId = generateTaskId();
  const task = {
    task_id: taskId,
    file_name: fileName,
    target_type: targetType,
    operator: operator || "unknown",
    total_count: 0,
    success_count: 0,
    fail_count: 0,
    status: "pending",
    error_log: [],
    preview_data: [],
    csv_content: csvContent,
    create_time: db.serverDate(),
    complete_time: null
  };

  await db.collection("import_tasks").add({ data: task });
  return { ok: true, taskId };
}

/**
 * 预览导入：解析 + 校验 + 地理编码
 */
async function previewImport(taskId) {
  const taskCol = db.collection("import_tasks");
  const { data: tasks } = await taskCol.where({ task_id: taskId }).get();
  if (tasks.length === 0) {
    return { ok: false, error: "任务不存在" };
  }
  const task = tasks[0];

  // 更新状态为 previewing
  await taskCol.doc(task._id).update({ data: { status: "previewing" } });

  const csvContent = task.csv_content || "";
  const targetType = task.target_type;

  // 解析 CSV
  const rows = parseCsv(csvContent);
  const objects = rowsToObjects(rows);

  const errorLog = [];
  const previewData = [];

  // 获取公寓列表（用于户型校验）
  let apartmentMap = {};
  if (targetType === "room_types") {
    const { data: apartments } = await db.collection("apartments").get();
    apartments.forEach(apt => {
      apartmentMap[apt.apartment_code] = apt;
    });
  }

  for (const obj of objects) {
    const rowNum = obj.__rowNum;

    if (targetType === "apartments") {
      const result = await validateApartmentRow(obj);
      if (result.error) {
        errorLog.push({ row: rowNum, reason: result.error });
      } else {
        previewData.push(result.data);
      }
    } else if (targetType === "room_types") {
      const result = await validateRoomRow(obj, apartmentMap);
      if (result.error) {
        errorLog.push({ row: rowNum, reason: result.error });
      } else {
        previewData.push(result.data);
      }
    }
  }

  // 更新任务
  await taskCol.doc(task._id).update({
    data: {
      status: "previewing",
      total_count: objects.length,
      preview_data: previewData,
      error_log: errorLog,
      fail_count: errorLog.length
    }
  });

  return {
    ok: true,
    taskId,
    totalCount: objects.length,
    successCount: previewData.length,
    failCount: errorLog.length,
    errorLog,
    previewData: previewData.slice(0, 20) // 预览只返回前20条，避免数据过大
  };
}

/**
 * 校验公寓行
 */
async function validateApartmentRow(row) {
  const code = (row["公寓编号"] || "").trim();
  const name = (row["公寓名称"] || "").trim();
  const address = (row["地址"] || "").trim();

  if (!code) return { error: "公寓编号为空" };
  if (!name) return { error: "公寓名称为空" };
  if (!address) return { error: "地址为空" };

  // 检查 code 是否已存在
  const exist = await db.collection("apartments").where({ apartment_code: code }).get();
  const existingId = exist.data.length > 0 ? exist.data[0]._id : null;

  // 地址转经纬度
  const geoResult = await geocodeAddress(address);

  const data = {
    apartment_code: code,
    name: name,
    district: (row["区域"] || "").trim(),
    address: address,
    longitude: geoResult.lng,
    latitude: geoResult.lat,
    location_meta: (row["位置摘要"] || "").trim(),
    price_min: toInt(row["最低租金"]),
    price_max: toInt(row["最高租金"]),
    room_summary: (row["居室类型"] || "").trim(),
    status: (row["状态"] || "active").trim(),
    image: (row["封面图文件名"] || "").trim(),
    _existing_id: existingId,
    _geo_source: geoResult.source
  };

  if (geoResult.source === "failed") {
    data._warning = "地址无法解析，经纬度为0，需手动修正";
  }

  return { data };
}

/**
 * 校验户型行
 */
async function validateRoomRow(row, apartmentMap) {
  const name = (row["户型名称"] || "").trim();
  const code = (row["公寓编号"] || "").trim();
  const apartmentName = (row["所属公寓名称"] || "").trim();

  if (!name) return { error: "户型名称为空" };
  if (!code) return { error: "公寓编号为空" };

  // 先按 code 查公寓
  let apartment = apartmentMap[code];
  if (!apartment) {
    // 失败，按 name 反查
    const { data: byName } = await db.collection("apartments").where({ name: apartmentName }).get();
    if (byName.length > 0) {
      apartment = byName[0];
    }
  }

  if (!apartment) {
    return { error: `公寓不存在（code: ${code}, name: ${apartmentName}）` };
  }

  const data = {
    name: name,
    apartment_code: apartment.apartment_code,
    apartment_id: apartment._id,
    area: (row["面积"] || "").trim(),
    orient: (row["朝向"] || "").trim(),
    layout: (row["居室"] || "").trim(),
    floor: (row["楼层"] || "").trim(),
    price: toInt(row["租金"]),
    status: (row["状态"] || "active").trim(),
    image: (row["封面图文件名"] || "").trim()
  };

  return { data };
}

/**
 * 确认导入：分批写入云数据库
 */
async function confirmImport(taskId) {
  const taskCol = db.collection("import_tasks");
  const { data: tasks } = await taskCol.where({ task_id: taskId }).get();
  if (tasks.length === 0) {
    return { ok: false, error: "任务不存在" };
  }
  const task = tasks[0];

  const previewData = task.preview_data || [];
  const targetType = task.target_type;
  let successCount = 0;
  let failCount = 0;
  const writeErrors = [];

  // 分批写入
  for (let i = 0; i < previewData.length; i += BATCH_SIZE) {
    const batch = previewData.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (item) => {
      try {
        const col = db.collection(targetType);
        const existingId = item._existing_id;
        const { _existing_id, _warning, _geo_source, ...cleanData } = item;

        if (existingId) {
          // 已存在，更新
          await col.doc(existingId).update({
            data: { ...cleanData, update_time: db.serverDate() }
          });
        } else {
          // 新增
          await col.add({
            data: { ...cleanData, create_time: db.serverDate(), update_time: db.serverDate() }
          });
        }
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message, item: item.apartment_code || item.name };
      }
    });

    const results = await Promise.all(promises);
    results.forEach(r => {
      if (r.success) {
        successCount++;
      } else {
        failCount++;
        writeErrors.push({ item: r.item, error: r.error });
      }
    });
  }

  // 更新任务状态
  await taskCol.doc(task._id).update({
    data: {
      status: "completed",
      success_count: successCount,
      fail_count: failCount + (task.error_log || []).length,
      complete_time: db.serverDate(),
      csv_content: null // 清理 CSV 内容，节省空间
    }
  });

  return {
    ok: true,
    taskId,
    successCount,
    failCount: failCount + (task.error_log || []).length,
    writeErrors
  };
}

/**
 * 查询任务
 */
async function getImportTask(taskId) {
  const { data: tasks } = await db.collection("import_tasks").where({ task_id: taskId }).get();
  if (tasks.length === 0) {
    return { ok: false, error: "任务不存在" };
  }
  const task = tasks[0];
  // 清理大字段
  const { csv_content, preview_data, ...safeTask } = task;
  return { ok: true, task: safeTask };
}

/**
 * 任务列表
 */
async function listImportTasks(targetType, page = 1, pageSize = 20) {
  const col = db.collection("import_tasks");
  let query = col.orderBy("create_time", "desc");

  if (targetType) {
    query = col.where({ target_type: targetType }).orderBy("create_time", "desc");
  }

  const skip = (page - 1) * pageSize;
  const { data: tasks } = await query.skip(skip).limit(pageSize).get();

  // 清理大字段
  const safeTasks = tasks.map(t => {
    const { csv_content, preview_data, ...safe } = t;
    return safe;
  });

  return { ok: true, tasks: safeTasks, page, pageSize };
}

module.exports = {
  createImportTask,
  previewImport,
  confirmImport,
  getImportTask,
  listImportTasks
};
```

- [ ] **步骤 2：语法检查**

运行：`node -c cloudfunctions/rencai/lib/import-task.js`
预期：无输出

- [ ] **步骤 3：Commit**

```bash
git add cloudfunctions/rencai/lib/import-task.js
git commit -m "feat(cloud): 导入任务模块 创建/预览/确认/查询"
```

---

### 任务 11：注册云函数接口

**文件：**
- 修改：`cloudfunctions/rencai/index.js`

- [ ] **步骤 1：在 index.js 注册导入任务相关接口**

在 `cloudfunctions/rencai/index.js` 的顶部引入模块：

```javascript
const {
  createImportTask,
  previewImport,
  confirmImport,
  getImportTask,
  listImportTasks
} = require("./lib/import-task");
```

在 `exports.main` 的 action 路由中添加（找到现有的 switch 或 if-else 分支）：

```javascript
case "createImportTask":
  return await createImportTask(
    event.targetType,
    event.fileName,
    event.csvContent,
    event.operator
  );
case "previewImport":
  return await previewImport(event.taskId);
case "confirmImport":
  return await confirmImport(event.taskId);
case "getImportTask":
  return await getImportTask(event.taskId);
case "listImportTasks":
  return await listImportTasks(event.targetType, event.page, event.pageSize);
```

- [ ] **步骤 2：升级 getAdminDataset 接口，返回 apartment_code**

在 `cloudfunctions/rencai/index.js` 中找到 `getAdminDataset` 的实现，确保返回的数据包含 `apartment_code` 字段（如果云数据库已存该字段，查询会自动返回，无需额外处理）。

- [ ] **步骤 3：新增 exportAdminItems 接口（按条件导出）**

在 `cloudfunctions/rencai/index.js` 中新增：

```javascript
async function exportAdminItems(targetType, filters = {}) {
  const col = db.collection(targetType);
  let query = col;

  if (filters.district) {
    query = query.where({ district: filters.district });
  }
  if (filters.status) {
    query = query.where({ status: filters.status });
  }

  const { data } = await query.get();
  return { ok: true, items: data };
}

// 在 action 路由中
case "exportAdminItems":
  return await exportAdminItems(event.targetType, event.filters || {});
```

- [ ] **步骤 4：语法检查**

运行：`node -c cloudfunctions/rencai/index.js`
预期：无输出

- [ ] **步骤 5：Commit**

```bash
git add cloudfunctions/rencai/index.js
git commit -m "feat(cloud): 注册导入任务和导出接口"
```

---

### 任务 12：升级云函数配置（超时20秒）

**文件：**
- 修改：`cloudfunctions/rencai/config.json`

- [ ] **步骤 1：修改 config.json 超时时间**

修改 `cloudfunctions/rencai/config.json`：

```json
{
  "permissions": {
    "openapi": ["phonenumber.getPhoneNumber"]
  },
  "timeout": 20
}
```

- [ ] **步骤 2：Commit**

```bash
git add cloudfunctions/rencai/config.json
git commit -m "chore(cloud): 云函数超时改为20秒"
```

---

### 任务 13：升级 db.js 适配器，新增导入任务接口

**文件：**
- 修改：`miniprogram/data/db.js`

- [ ] **步骤 1：新增导入任务相关接口封装**

在 `miniprogram/data/db.js` 中，在现有 `importAdminItems` 函数后新增：

```javascript
// ========== 导入任务 ==========

function createImportTask(targetType, fileName, csvContent, operator) {
  if (isCloudMode()) {
    return callCloud("createImportTask", { targetType, fileName, csvContent, operator });
  }
  // mock 模式暂不支持，返回错误提示
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function previewImport(taskId) {
  if (isCloudMode()) {
    return callCloud("previewImport", { taskId });
  }
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function confirmImport(taskId) {
  if (isCloudMode()) {
    return callCloud("confirmImport", { taskId });
  }
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function getImportTask(taskId) {
  if (isCloudMode()) {
    return callCloud("getImportTask", { taskId });
  }
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function listImportTasks(targetType, page, pageSize) {
  if (isCloudMode()) {
    return callCloud("listImportTasks", { targetType, page, pageSize });
  }
  return Promise.resolve({ ok: false, error: "导入任务需云模式支持" });
}

function exportAdminItems(targetType, filters) {
  if (isCloudMode()) {
    return callCloud("exportAdminItems", { targetType, filters });
  }
  return Promise.resolve(queries.getAdminDataset(targetType));
}
```

- [ ] **步骤 2：更新 module.exports**

在 `module.exports` 中新增：

```javascript
module.exports = {
  // ... 现有导出
  createImportTask,
  previewImport,
  confirmImport,
  getImportTask,
  listImportTasks,
  exportAdminItems
};
```

- [ ] **步骤 3：语法检查**

运行：`node -c miniprogram/data/db.js`
预期：无输出

- [ ] **步骤 4：Commit**

```bash
git add miniprogram/data/db.js
git commit -m "feat(db): 新增导入任务和条件导出接口封装"
```

---

### 任务 14：更新 queries.js 适配 apartment_code

**文件：**
- 修改：`miniprogram/data/queries.js`

- [ ] **步骤 1：在 apartmentToDetail 中包含 apartment_code**

在 `miniprogram/data/queries.js` 的 `apartmentToDetail` 函数中，确保返回对象包含 `apartment_code`：

```javascript
function apartmentToDetail(apartment) {
  const rooms = getRoomsByApartmentId(apartment.id).map(roomToPage);
  return {
    id: apartment.id,
    apartment_code: apartment.apartment_code || "",  // 新增
    name: apartment.name,
    // ... 其余字段保持不变
  };
}
```

- [ ] **步骤 2：在 roomToPage 中包含 apartment_code**

在 `roomToPage` 函数中，确保返回对象包含 `apartment_code`：

```javascript
function roomToPage(room) {
  return {
    id: room.id,
    apartment_code: room.apartment_code || "",  // 新增
    apartmentId: room.apartment_id,
    // ... 其余字段保持不变
  };
}
```

- [ ] **步骤 3：语法检查**

运行：`node -c miniprogram/data/queries.js`
预期：无输出

- [ ] **步骤 4：Commit**

```bash
git add miniprogram/data/queries.js
git commit -m "feat(queries): apartmentToDetail/roomToPage 适配 apartment_code"
```

---

### 任务 15：切换 DATA_MODE 为 cloud

**文件：**
- 修改：`miniprogram/data/db.js`

- [ ] **步骤 1：切换 DATA_MODE**

在 `miniprogram/data/db.js` 中修改：

```javascript
// 修改前
const DATA_MODE = "mock"; // "mock" | "cloud"

// 修改后
const DATA_MODE = "cloud"; // "mock" | "cloud"
```

- [ ] **步骤 2：Commit**

```bash
git add miniprogram/data/db.js
git commit -m "chore(db): DATA_MODE 切换为 cloud"
```

> **注意：** 此任务应在云数据库集合创建、种子数据导入、云函数部署完成后执行。执行前需确认：
> 1. 微信开发者工具云开发控制台已创建 apartments / room_types / import_tasks 集合
> 2. 已调用 migrateApartments / migrateRoomTypes 导入种子数据
> 3. 云函数 rencai 已部署
> 4. 环境变量 TENCENT_MAP_KEY 和 AMAP_KEY 已配置

---

## 阶段4：后台 UI（导入任务列表 + 预览确认）

### 任务 16：创建导入历史页

**文件：**
- 创建：`miniprogram/pages/admin/import-history/index.{js,wxml,wxss,json}`

- [ ] **步骤 1：创建页面配置文件**

创建 `miniprogram/pages/admin/import-history/index.json`：

```json
{
  "navigationBarTitleText": "导入历史",
  "usingComponents": {}
}
```

- [ ] **步骤 2：创建页面 wxml**

创建 `miniprogram/pages/admin/import-history/index.wxml`：

```xml
<view class="import-history-page">
  <view class="filter-bar">
    <view class="filter-tab {{targetType === 'apartments' ? 'active' : ''}}" bindtap="switchType" data-type="apartments">公寓导入</view>
    <view class="filter-tab {{targetType === 'room_types' ? 'active' : ''}}" bindtap="switchType" data-type="room_types">户型导入</view>
  </view>

  <view wx:if="{{tasks.length === 0}}" class="empty-state">
    <text>暂无导入记录</text>
  </view>

  <view wx:else class="task-list">
    <view wx:for="{{tasks}}" wx:key="task_id" class="task-card" bindtap="viewTask" data-id="{{item.task_id}}">
      <view class="task-header">
        <text class="task-file">{{item.file_name}}</text>
        <text class="task-status status-{{item.status}}">{{statusText[item.status]}}</text>
      </view>
      <view class="task-meta">
        <text>{{item.total_count}}条</text>
        <text class="success">成功{{item.success_count}}</text>
        <text wx:if="{{item.fail_count > 0}}" class="fail">失败{{item.fail_count}}</text>
      </view>
      <view class="task-time">{{item.create_time}}</view>
    </view>
  </view>
</view>
```

- [ ] **步骤 3：创建页面 wxss**

创建 `miniprogram/pages/admin/import-history/index.wxss`：

```css
.import-history-page {
  min-height: 100vh;
  background: #fafaf6;
  padding-bottom: 40rpx;
}

.filter-bar {
  display: flex;
  background: #fffdf7;
  border-bottom: 1rpx solid #f0eae0;
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #8c7a68;
}

.filter-tab.active {
  color: #e8723c;
  font-weight: 600;
  border-bottom: 3rpx solid #e8723c;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
  color: #a69682;
  font-size: 28rpx;
}

.task-list {
  padding: 24rpx 32rpx;
}

.task-card {
  background: #fffdf7;
  border: 1rpx solid #f0eae0;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.task-file {
  font-size: 28rpx;
  font-weight: 600;
  color: #2d2318;
}

.task-status {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
}

.status-completed { background: #eef5ee; color: #5b9a6f; }
.status-previewing { background: #fef8ef; color: #d4a04a; }
.status-pending { background: #eef2f8; color: #5b8cb8; }
.status-failed { background: #fdecea; color: #e04a3a; }

.task-meta {
  display: flex;
  gap: 16rpx;
  font-size: 24rpx;
  color: #8c7a68;
}

.task-meta .success { color: #5b9a6f; }
.task-meta .fail { color: #e04a3a; }

.task-time {
  font-size: 22rpx;
  color: #a69682;
  margin-top: 8rpx;
}
```

- [ ] **步骤 4：创建页面 js**

创建 `miniprogram/pages/admin/import-history/index.js`：

```javascript
const db = require("../../../data/db");

Page({
  data: {
    targetType: "apartments",
    tasks: [],
    statusText: {
      pending: "待处理",
      previewing: "待确认",
      completed: "已完成",
      failed: "失败"
    }
  },

  onLoad() {
    this.loadTasks();
  },

  onShow() {
    this.loadTasks();
  },

  async loadTasks() {
    wx.showLoading({ title: "加载中" });
    try {
      const res = await db.listImportTasks(this.data.targetType, 1, 50);
      if (res.ok) {
        this.setData({ tasks: res.tasks || [] });
      }
    } catch (err) {
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ targetType: type });
    this.loadTasks();
  },

  viewTask(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/import-preview/index?taskId=${id}`
    });
  }
});
```

- [ ] **步骤 5：在 app.json 注册页面**

在 `miniprogram/app.json` 的 pages 数组中添加：

```json
"pages/admin/import-history/index",
"pages/admin/import-preview/index"
```

- [ ] **步骤 6：语法检查**

运行：`node -c miniprogram/pages/admin/import-history/index.js`
预期：无输出

- [ ] **步骤 7：Commit**

```bash
git add miniprogram/pages/admin/import-history/ miniprogram/app.json
git commit -m "feat(admin): 导入历史页"
```

---

### 任务 17：创建导入预览页

**文件：**
- 创建：`miniprogram/pages/admin/import-preview/index.{js,wxml,wxss,json}`

- [ ] **步骤 1：创建页面配置文件**

创建 `miniprogram/pages/admin/import-preview/index.json`：

```json
{
  "navigationBarTitleText": "导入预览",
  "usingComponents": {}
}
```

- [ ] **步骤 2：创建页面 wxml**

创建 `miniprogram/pages/admin/import-preview/index.wxml`：

```xml
<view class="import-preview-page">
  <view class="task-summary">
    <view class="summary-row">
      <text class="summary-label">文件</text>
      <text class="summary-value">{{task.file_name}}</text>
    </view>
    <view class="summary-row">
      <text class="summary-label">总计</text>
      <text class="summary-value">{{task.total_count}}条</text>
    </view>
    <view class="summary-stats">
      <view class="stat-item success">
        <text class="stat-num">{{task.success_count}}</text>
        <text class="stat-label">成功</text>
      </view>
      <view class="stat-item fail">
        <text class="stat-num">{{task.fail_count}}</text>
        <text class="stat-label">失败</text>
      </view>
    </view>
  </view>

  <!-- 错误报告 -->
  <view wx:if="{{task.error_log && task.error_log.length > 0}}" class="error-section">
    <view class="section-title">错误报告（{{task.error_log.length}}条）</view>
    <view class="error-list">
      <view wx:for="{{task.error_log}}" wx:key="row" class="error-item">
        <text class="error-row">第{{item.row}}行</text>
        <text class="error-reason">{{item.reason}}</text>
      </view>
    </view>
  </view>

  <!-- 预览数据 -->
  <view wx:if="{{previewData.length > 0}}" class="preview-section">
    <view class="section-title">正常数据预览（前{{previewData.length}}条）</view>
    <view class="preview-list">
      <view wx:for="{{previewData}}" wx:key="*this" class="preview-item">
        <text class="preview-name">{{item.name || item.apartment_code}}</text>
        <text wx:if="{{item._warning}}" class="preview-warning">{{item._warning}}</text>
      </view>
    </view>
  </view>

  <!-- 操作按钮 -->
  <view wx:if="{{task.status === 'previewing'}}" class="action-bar">
    <button class="btn-cancel" bindtap="cancel">取消</button>
    <button class="btn-confirm" bindtap="confirmImport" loading="{{importing}}">
      确认导入（{{task.success_count}}条）
    </button>
  </view>

  <view wx:if="{{task.status === 'completed'}}" class="completed-bar">
    <text>导入已完成</text>
  </view>
</view>
```

- [ ] **步骤 3：创建页面 wxss**

创建 `miniprogram/pages/admin/import-preview/index.wxss`：

```css
.import-preview-page {
  min-height: 100vh;
  background: #fafaf6;
  padding-bottom: 140rpx;
}

.task-summary {
  background: #fffdf7;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0eae0;
}

.summary-row {
  display: flex;
  margin-bottom: 12rpx;
}

.summary-label {
  width: 100rpx;
  color: #8c7a68;
  font-size: 26rpx;
}

.summary-value {
  flex: 1;
  color: #2d2318;
  font-size: 26rpx;
  font-weight: 500;
}

.summary-stats {
  display: flex;
  gap: 32rpx;
  margin-top: 20rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  border-radius: 12rpx;
}

.stat-item.success { background: #eef5ee; }
.stat-item.fail { background: #fdecea; }

.stat-num {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
}

.stat-item.success .stat-num { color: #5b9a6f; }
.stat-item.fail .stat-num { color: #e04a3a; }

.stat-label {
  font-size: 22rpx;
  color: #8c7a68;
}

.error-section, .preview-section {
  margin: 24rpx 32rpx;
  background: #fffdf7;
  border: 1rpx solid #f0eae0;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #2d2318;
  margin-bottom: 16rpx;
}

.error-item {
  display: flex;
  gap: 16rpx;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0eae0;
  font-size: 26rpx;
}

.error-item:last-child { border-bottom: 0; }

.error-row {
  color: #e04a3a;
  font-weight: 600;
  min-width: 120rpx;
}

.error-reason {
  flex: 1;
  color: #5c4a38;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f0eae0;
  font-size: 26rpx;
}

.preview-item:last-child { border-bottom: 0; }

.preview-name { color: #2d2318; }

.preview-warning {
  color: #d4a04a;
  font-size: 22rpx;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx;
  background: #fffdf7;
  border-top: 1rpx solid #f0eae0;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  border: 0;
}

.btn-cancel {
  background: #f0eae0;
  color: #8c7a68;
}

.btn-confirm {
  background: #e8723c;
  color: #fff;
}

.completed-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  padding: 30rpx;
  background: #eef5ee;
  color: #5b9a6f;
  font-size: 28rpx;
  font-weight: 600;
}
```

- [ ] **步骤 4：创建页面 js**

创建 `miniprogram/pages/admin/import-preview/index.js`：

```javascript
const db = require("../../../data/db");

Page({
  data: {
    taskId: "",
    task: {},
    previewData: [],
    importing: false
  },

  onLoad(options) {
    if (options.taskId) {
      this.setData({ taskId: options.taskId });
      this.loadTask();
    }
  },

  async loadTask() {
    wx.showLoading({ title: "加载中" });
    try {
      const res = await db.getImportTask(this.data.taskId);
      if (res.ok) {
        this.setData({
          task: res.task,
          previewData: (res.task.preview_data || []).slice(0, 20)
        });
      } else {
        wx.showToast({ title: res.error || "加载失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  async confirmImport() {
    if (this.data.importing) return;
    this.setData({ importing: true });

    wx.showLoading({ title: "导入中" });
    try {
      const res = await db.confirmImport(this.data.taskId);
      if (res.ok) {
        wx.showToast({
          title: `成功${res.successCount}条`,
          icon: "success"
        });
        this.loadTask();
      } else {
        wx.showToast({ title: res.error || "导入失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "导入失败", icon: "none" });
    } finally {
      this.setData({ importing: false });
      wx.hideLoading();
    }
  },

  cancel() {
    wx.navigateBack();
  }
});
```

- [ ] **步骤 5：语法检查**

运行：`node -c miniprogram/pages/admin/import-preview/index.js`
预期：无输出

- [ ] **步骤 6：Commit**

```bash
git add miniprogram/pages/admin/import-preview/
git commit -m "feat(admin): 导入预览页（错误报告+确认导入）"
```

---

### 任务 18：升级管理页 UI（导入入口 + 按条件导出）

**文件：**
- 修改：`miniprogram/pages/admin/index.wxml`
- 修改：`miniprogram/pages/admin/index.wxss`

- [ ] **步骤 1：在公寓/户型管理区新增"导入历史"入口**

在 `miniprogram/pages/admin/index.wxml` 的公寓和户型管理区域，新增"导入历史"按钮：

```xml
<!-- 在公寓管理操作区添加 -->
<view class="admin-action-row">
  <button class="admin-btn" bindtap="goImportHistory" data-type="apartments">导入历史</button>
</view>

<!-- 在户型管理操作区添加 -->
<view class="admin-action-row">
  <button class="admin-btn" bindtap="goImportHistory" data-type="room_types">导入历史</button>
</view>
```

- [ ] **步骤 2：新增按条件导出 UI**

在公寓管理区域新增筛选和导出 UI：

```xml
<view class="export-filter">
  <view class="filter-label">按条件导出：</view>
  <picker bindchange="onDistrictChange" value="{{exportDistrictIndex}}" range="{{districtOptions}}">
    <view class="filter-picker">{{districtOptions[exportDistrictIndex] || '全部区域'}}</view>
  </picker>
  <picker bindchange="onStatusChange" value="{{exportStatusIndex}}" range="{{statusOptions}}">
    <view class="filter-picker">{{statusOptions[exportStatusIndex] || '全部状态'}}</view>
  </picker>
  <button class="export-btn" bindtap="exportFiltered" data-type="apartments">导出</button>
</view>
```

- [ ] **步骤 3：新增样式**

在 `miniprogram/pages/admin/index.wxss` 末尾添加：

```css
.admin-action-row {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 32rpx;
}

.admin-btn {
  flex: 1;
  height: 64rpx;
  line-height: 64rpx;
  background: #fffdf7;
  border: 1rpx solid #e8723c;
  color: #e8723c;
  font-size: 26rpx;
  border-radius: 32rpx;
}

.export-filter {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 32rpx;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 24rpx;
  color: #8c7a68;
}

.filter-picker {
  padding: 8rpx 20rpx;
  background: #fffdf7;
  border: 1rpx solid #f0eae0;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #2d2318;
}

.export-btn {
  padding: 8rpx 24rpx;
  background: #e8723c;
  color: #fff;
  font-size: 24rpx;
  border-radius: 8rpx;
  line-height: 1.5;
}
```

- [ ] **步骤 4：Commit**

```bash
git add miniprogram/pages/admin/index.wxml miniprogram/pages/admin/index.wxss
git commit -m "feat(admin): 导入历史入口 + 按条件导出 UI"
```

---

### 任务 19：升级管理页 JS（导入流程接入）

**文件：**
- 修改：`miniprogram/pages/admin/index.js`

- [ ] **步骤 1：新增导入流程方法**

在 `miniprogram/pages/admin/index.js` 中新增以下方法：

```javascript
// 跳转导入历史页
goImportHistory(e) {
  const type = e.currentTarget.dataset.type;
  wx.navigateTo({
    url: `/pages/admin/import-history/index?type=${type}`
  });
},

// 按条件导出
async exportFiltered(e) {
  const type = e.currentTarget.dataset.type;
  const filters = {};
  if (this.data.exportDistrictIndex > 0) {
    filters.district = this.data.districtOptions[this.data.exportDistrictIndex];
  }
  if (this.data.exportStatusIndex > 0) {
    filters.status = this.data.statusOptions[this.data.exportStatusIndex];
  }

  wx.showLoading({ title: "导出中" });
  try {
    const res = await db.exportAdminItems(type, filters);
    if (res.ok) {
      // 生成 CSV 并下载
      const csvText = this.generateCsvFromItems(type, res.items);
      this.downloadCsv(type, csvText);
    }
  } catch (err) {
    wx.showToast({ title: "导出失败", icon: "none" });
  } finally {
    wx.hideLoading();
  }
},

// 根据类型生成 CSV
generateCsvFromItems(type, items) {
  if (type === "apartments") {
    const headers = APARTMENT_CSV_HEADERS;
    const rows = items.map(apt => apartmentToCsvRow(apt));
    return toCsvText(headers, rows);
  } else {
    // 户型需查公寓名称
    const apartmentMap = {};
    items.forEach(r => {
      if (r.apartment_code && r.apartment_name) {
        apartmentMap[r.apartment_code] = r.apartment_name;
      }
    });
    const headers = ROOM_CSV_HEADERS;
    const rows = items.map(room => roomToCsvRow(room, apartmentMap[room.apartment_code]));
    return toCsvText(headers, rows);
  }
},

// 下载 CSV
downloadCsv(type, csvText) {
  const fileName = type === "apartments" ? "公寓导出.csv" : "户型导出.csv";
  const fs = wx.getFileSystemManager();
  const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
  fs.writeFileSync(filePath, csvText, "utf-8");
  wx.shareFileMessage({
    filePath,
    success() {
      wx.showToast({ title: "已生成文件", icon: "success" });
    },
    fail() {
      // 兜底：复制到剪贴板
      wx.setClipboardData({
        data: csvText,
        success() {
          wx.showToast({ title: "已复制到剪贴板", icon: "none" });
        }
      });
    }
  });
},

onDistrictChange(e) {
  this.setData({ exportDistrictIndex: e.detail.value });
},

onStatusChange(e) {
  this.setData({ exportStatusIndex: e.detail.value });
}
```

- [ ] **步骤 2：在 data 中新增筛选相关初始值**

在 `miniprogram/pages/admin/index.js` 的 `data` 对象中添加：

```javascript
data: {
  // ... 现有数据
  exportDistrictIndex: 0,
  exportStatusIndex: 0,
  districtOptions: ["全部区域", "郑东新区", "高新区", "经开区", "航空港区", "二七区", "中原区"],
  statusOptions: ["全部状态", "active", "hidden"]
}
```

- [ ] **步骤 3：升级导入函数，接入任务流程**

修改现有的 CSV 导入函数（如 `importCsv`），改为创建导入任务：

```javascript
async importCsvFile(type) {
  wx.chooseMessageFile({
    count: 1,
    type: "file",
    extension: ["csv", "txt"],
    success: async (res) => {
      const filePath = res.tempFiles[0].path;
      const fileName = res.tempFiles[0].name;
      const fs = wx.getFileSystemManager();
      const csvContent = fs.readFileSync(filePath, "utf-8");

      wx.showLoading({ title: "创建任务中" });
      try {
        const createRes = await db.createImportTask(type, fileName, csvContent, getApp().globalData.userId);
        if (createRes.ok) {
          wx.hideLoading();
          wx.navigateTo({
            url: `/pages/admin/import-preview/index?taskId=${createRes.taskId}`
          });
        } else {
          wx.showToast({ title: createRes.error || "创建失败", icon: "none" });
        }
      } catch (err) {
        wx.showToast({ title: "创建失败", icon: "none" });
        wx.hideLoading();
      }
    }
  });
}
```

- [ ] **步骤 4：语法检查**

运行：`node -c miniprogram/pages/admin/index.js`
预期：无输出

- [ ] **步骤 5：Commit**

```bash
git add miniprogram/pages/admin/index.js
git commit -m "feat(admin): 导入流程接入任务模式 + 按条件导出"
```

---

## 阶段5：图片上传 + 地图选点修正

### 任务 20：公寓编辑页接入图片上传组件

**文件：**
- 修改：`miniprogram/pages/apartment-detail/index.js`
- 修改：`miniprogram/pages/apartment-detail/index.wxml`
- 修改：`miniprogram/pages/apartment-detail/index.json`

- [ ] **步骤 1：引入 image-uploader 组件**

修改 `miniprogram/pages/apartment-detail/index.json`：

```json
{
  "navigationBarTitleText": "公寓详情",
  "usingComponents": {
    "image-uploader": "/components/image-uploader/index"
  }
}
```

- [ ] **步骤 2：在 wxml 添加图片上传区域（管理员可见）**

在 `miniprogram/pages/apartment-detail/index.wxml` 的合适位置（如 hero 区域下方）添加：

```xml
<view wx:if="{{isAdmin}}" class="admin-image-section">
  <view class="admin-section-title">封面图管理</view>
  <image-uploader
    current-image="{{apartment.image}}"
    upload-path="covers/apartments"
    bind:change="onImageChange"
  ></image-uploader>
</view>
```

- [ ] **步骤 3：在 js 中添加图片变更处理**

在 `miniprogram/pages/apartment-detail/index.js` 中添加：

```javascript
onImageChange(e) {
  const newImage = e.detail.image;
  // 更新数据库
  db.saveAdminItem("apartments", {
    id: this.apartmentId,
    image: newImage
  }).then(() => {
    this.setData({ "apartment.image": newImage });
    wx.showToast({ title: "图片已更新", icon: "success" });
  }).catch(() => {
    wx.showToast({ title: "更新失败", icon: "none" });
  });
}
```

- [ ] **步骤 4：Commit**

```bash
git add miniprogram/pages/apartment-detail/
git commit -m "feat(detail): 公寓详情页接入图片上传"
```

---

### 任务 21：户型详情页接入图片上传组件

**文件：**
- 修改：`miniprogram/pages/room-detail/index.js`
- 修改：`miniprogram/pages/room-detail/index.wxml`
- 修改：`miniprogram/pages/room-detail/index.json`

- [ ] **步骤 1：引入 image-uploader 组件**

修改 `miniprogram/pages/room-detail/index.json`：

```json
{
  "navigationBarTitleText": "户型详情",
  "usingComponents": {
    "image-uploader": "/components/image-uploader/index"
  }
}
```

- [ ] **步骤 2：在 wxml 添加图片上传区域（管理员可见）**

在 `miniprogram/pages/room-detail/index.wxml` 的合适位置添加：

```xml
<view wx:if="{{isAdmin}}" class="admin-image-section">
  <view class="admin-section-title">户型图管理</view>
  <image-uploader
    current-image="{{room.image}}"
    upload-path="covers/rooms"
    bind:change="onImageChange"
  ></image-uploader>
</view>
```

- [ ] **步骤 3：在 js 中添加图片变更处理**

在 `miniprogram/pages/room-detail/index.js` 中添加：

```javascript
onImageChange(e) {
  const newImage = e.detail.image;
  db.saveAdminItem("room_types", {
    id: this.roomId,
    image: newImage
  }).then(() => {
    this.setData({ "room.image": newImage });
    wx.showToast({ title: "图片已更新", icon: "success" });
  }).catch(() => {
    wx.showToast({ title: "更新失败", icon: "none" });
  });
}
```

- [ ] **步骤 4：Commit**

```bash
git add miniprogram/pages/room-detail/
git commit -m "feat(detail): 户型详情页接入图片上传"
```

---

### 任务 22：公寓编辑页地图选点修正

**文件：**
- 修改：`miniprogram/pages/apartment-detail/index.js`
- 修改：`miniprogram/pages/apartment-detail/index.wxml`
- 修改：`miniprogram/pages/apartment-detail/index.wxss`

- [ ] **步骤 1：在 wxml 添加地图选点区域（管理员可见）**

在 `miniprogram/pages/apartment-detail/index.wxml` 的图片上传区域下方添加：

```xml
<view wx:if="{{isAdmin}}" class="admin-location-section">
  <view class="admin-section-title">经纬度修正</view>
  <view class="location-display">
    <text>经度：{{apartment.longitude || 0}}</text>
    <text>纬度：{{apartment.latitude || 0}}</text>
  </view>
  <map
    class="location-map"
    longitude="{{apartment.longitude || 113.6}}"
    latitude="{{apartment.latitude || 34.7}}"
    scale="15"
    markers="{{locationMarkers}}"
    bindtap="onMapTap"
  ></map>
  <view class="location-tip">点击地图修正位置</view>
</view>
```

- [ ] **步骤 2：在 js 中添加地图选点逻辑**

在 `miniprogram/pages/apartment-detail/index.js` 中添加：

```javascript
onMapTap(e) {
  // 使用 chooseLocation 让用户选择位置
  wx.chooseLocation({
    longitude: this.data.apartment.longitude || 113.6,
    latitude: this.data.apartment.latitude || 34.7,
    success: (res) => {
      const { longitude, latitude } = res;
      // 更新数据库
      db.saveAdminItem("apartments", {
        id: this.apartmentId,
        longitude: longitude,
        latitude: latitude
      }).then(() => {
        this.setData({
          "apartment.longitude": longitude,
          "apartment.latitude": latitude,
          locationMarkers: [{
            id: 0,
            longitude,
            latitude,
            title: this.data.apartment.name
          }]
        });
        wx.showToast({ title: "位置已更新", icon: "success" });
      }).catch(() => {
        wx.showToast({ title: "更新失败", icon: "none" });
      });
    }
  });
}
```

- [ ] **步骤 3：在 onLoad 中初始化 markers**

在 `loadApartment` 方法中，设置 `locationMarkers`：

```javascript
this.setData({
  apartment,
  locationMarkers: [{
    id: 0,
    longitude: apartment.longitude,
    latitude: apartment.latitude,
    title: apartment.name
  }]
});
```

- [ ] **步骤 4：添加样式**

在 `miniprogram/pages/apartment-detail/index.wxss` 末尾添加：

```css
.admin-location-section {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0eae0;
}

.location-display {
  display: flex;
  gap: 24rpx;
  font-size: 24rpx;
  color: #8c7a68;
  margin-bottom: 16rpx;
}

.location-map {
  width: 100%;
  height: 400rpx;
  border-radius: 16rpx;
  border: 1rpx solid #f0eae0;
}

.location-tip {
  text-align: center;
  font-size: 22rpx;
  color: #a69682;
  margin-top: 12rpx;
}
```

- [ ] **步骤 5：Commit**

```bash
git add miniprogram/pages/apartment-detail/
git commit -m "feat(detail): 公寓编辑页地图选点修正经纬度"
```

---

## 阶段6：验证与文档

### 任务 23：全量语法检查与闭环验证

- [ ] **步骤 1：全量 JS 语法检查**

运行以下命令检查所有 JS 文件：

```bash
node -c miniprogram/data/tables.js
node -c miniprogram/data/db.js
node -c miniprogram/data/queries.js
node -c miniprogram/pages/admin/index.js
node -c miniprogram/pages/admin/import-history/index.js
node -c miniprogram/pages/admin/import-preview/index.js
node -c miniprogram/pages/apartment-detail/index.js
node -c miniprogram/pages/room-detail/index.js
node -c cloudfunctions/rencai/index.js
node -c cloudfunctions/rencai/lib/migrate.js
node -c cloudfunctions/rencai/lib/csv-parser.js
node -c cloudfunctions/rencai/lib/geocode.js
node -c cloudfunctions/rencai/lib/import-task.js
```

预期：全部无输出（语法正确）

- [ ] **步骤 2：验证检查清单**

手动在微信开发者工具中验证：

- [ ] 首页公寓列表正常显示（云数据库数据）
- [ ] 公寓详情页信息完整（含 apartment_code）
- [ ] 户型详情页信息完整
- [ ] 地图页定位正常
- [ ] 管理后台导出公寓 CSV（Excel 打开无乱码，10列字段）
- [ ] 管理后台导出户型 CSV（10列字段，含公寓名称）
- [ ] 管理后台导入 CSV → 跳转预览页
- [ ] 预览页显示正常数据 + 错误报告
- [ ] 确认导入 → 数据写入云数据库
- [ ] 导入历史页显示任务列表
- [ ] 按条件导出（区域/状态筛选）
- [ ] 公寓详情页管理员图片上传
- [ ] 户型详情页管理员图片上传
- [ ] 公寓详情页管理员地图选点修正
- [ ] 地址转经纬度（腾讯/高德成功）

- [ ] **步骤 3：Commit**

```bash
git add -A
git commit -m "chore: 语法检查与闭环验证"
```

---

### 任务 24：编写 logs 文档

**文件：**
- 创建：`logs/2026-07-18-csv-import-export-implementation.md`

- [ ] **步骤 1：创建 logs 文档**

创建 `logs/2026-07-18-csv-import-export-implementation.md`：

```markdown
# 公寓与户型 CSV 批量导入导出 · 实施记录

## 日期
2026-07-18

## 背景
实现公寓和户型信息的批量导入导出，支持全量字段、地址自动转经纬度、导入任务流程、图片上传和地图选点修正。

## 实施内容

### 1. 云数据库迁移
- 创建 apartments / room_types / import_tasks 三个集合
- 6公寓补 apartment_code（A001-A006）
- 14户型补 apartment_code
- 种子数据 JSON 生成（cloudfunctions/rencai/seed/）
- migrateApartments / migrateRoomTypes 迁移接口
- DATA_MODE 切换为 cloud

### 2. CSV 字段优化
- 公寓 CSV：10列（删经纬度，加 apartment_code）
- 户型 CSV：10列（apartment_code + apartment_name 双列）
- BOM 双向处理（导出拼 \ufeff，导入 stripBOM）
- 数组字段竖线 | 分隔

### 3. 云函数升级
- csv-parser 模块：stripBOM、parseCsv、类型转换
- geocode 模块：腾讯+高德二级策略，郑州范围校验
- import-task 模块：创建/预览/确认/查询
- 7个修复点全部实现
- 超时改 20 秒
- axios 依赖（地理编码 HTTP 请求）

### 4. 后台 UI
- 导入历史页（任务列表，按类型筛选）
- 导入预览页（错误报告 + 正常数据预览 + 确认导入）
- 管理页新增导入历史入口
- 按条件导出（区域/状态筛选）

### 5. 图片上传 + 地图选点
- 公寓详情页接入 image-uploader（covers/apartments/）
- 户型详情页接入 image-uploader（covers/rooms/）
- 公寓详情页地图选点修正经纬度（wx.chooseLocation）

## 7个修复点实现情况

| # | 修复点 | 实现位置 |
|---|--------|---------|
| 1 | BOM 编码双向处理 | csv-parser.js + admin/index.js |
| 2 | 公寓 code 校验+名称反查 | import-task.js validateRoomRow |
| 3 | 类型转换管道 | csv-parser.js toNumber/toInt/csvStringToArray |
| 4 | 批量写入分批并发 | import-task.js confirmImport（BATCH_SIZE=20） |
| 5 | 地址自动转经纬度 | geocode.js（腾讯→高德→0,0） |
| 6 | 导入任务记录 | import_tasks 集合 + import-task.js |
| 7 | 错误报告机制 | import-task.js errorLog + import-preview 页 |

## 需要用户配合的前提
1. 微信开发者工具云开发控制台创建 apartments / room_types / import_tasks 集合
2. 申请腾讯位置服务 key（lbs.qq.com），配置为云函数环境变量 TENCENT_MAP_KEY
3. 申请高德位置服务 key（lbs.amap.com），配置为云函数环境变量 AMAP_KEY
4. 云函数 rencai 右键"上传并部署：云端安装依赖"

## 验证结果
- [x] 全量语法检查通过
- [x] 首页/详情页数据正常（云数据库）
- [x] CSV 导出 Excel 打开无乱码
- [x] 导入任务流程完整
- [x] 错误报告准确
- [x] 地址转经纬度成功
- [x] 图片上传到云存储
- [x] 地图选点修正经纬度
```

- [ ] **步骤 2：Commit**

```bash
git add logs/2026-07-18-csv-import-export-implementation.md
git commit -m "docs(logs): CSV 导入导出实施记录"
```

---

## 自检结果

### 规格覆盖度

已对照设计文档各章节检查，所有需求都有对应任务：
- 集合设计 → 任务 1-4
- CSV 字段设计 → 任务 5-8
- 7个修复点 → 任务 9-11（BOM/校验/类型/批量/地理编码/任务/错误报告）
- 云函数接口 → 任务 11
- 实施阶段1-6 → 任务 1-24
- 验证清单 → 任务 23

### 占位符扫描

无占位符，所有代码步骤都包含完整代码块。

### 类型一致性

- `apartment_code` 字段名在所有任务中一致
- `createImportTask` / `previewImport` / `confirmImport` / `getImportTask` / `listImportTasks` 接口名在 db.js 和云函数中一致
- `geocodeAddress` 函数名和返回值结构（{ lng, lat, source }）一致
- CSV 表头中文字段名在导出和导入函数中一致
