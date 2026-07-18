# 公寓与户型 CSV 批量导入导出 · 设计文档

## 元信息

- **日期**：2026-07-18
- **状态**：待用户审查
- **范围**：公寓详情页 + 户型详情页全量信息的批量导入导出
- **数据载体**：CSV（UTF-8 BOM），Excel/WPS 可直接打开编辑
- **存储后端**：微信云开发数据库
- **前置条件**：用户已确认方案方向（CSV + 云数据库 + 地址自动转经纬度 + 运营优化建议）

---

## 一、背景与目标

### 1.1 当前现状

项目已有以下基础设施：

- **CSV 导入导出骨架**（2026-07-02）：`admin/index.js` 中已实现 `toCsvText` / `parseDelimitedRows` / `tableTextToRows` 等函数，支持中文表头、按 ID 合并、TSV 兜底
- **云开发适配器**（2026-07-17）：`data/db.js` 支持 mock/cloud 双模式切换，云函数 `rencai` 已编写（含 `importAdminItems` 接口），云环境 ID 已配置（`cloud1-d4gbiicxhcd67b748`）
- **当前仍为 mock 模式**：`DATA_MODE = "mock"`，数据来自 `tables.js`，未真正读写云数据库
- **图片上传组件**：`components/image-uploader` 已存在，可复用

### 1.2 核心问题

现有 CSV 方案存在以下局限：

1. 数据只存在内存（mock 模式），刷新即丢，未真正写云数据库
2. 导出字段不全（核心字段，缺经纬度、位置摘要、封面图路径、周边配套等）
3. 无图片处理机制
4. 管理员需手动填经纬度，实际运营不可行
5. 导入失败静默跳过，运营人员无法定位问题
6. 无导入历史记录

### 1.3 设计目标

| 目标 | 衡量标准 |
|------|---------|
| 全量字段导入导出 | 公寓10列 + 户型10列，覆盖详情页所有信息 |
| 数据持久化 | 导入数据写入云数据库，多用户共享，刷新不丢 |
| 地址自动定位 | 管理员只填地址，经纬度自动获取 |
| 运营可追溯 | 导入任务记录 + 错误报告 |
| 图片可管理 | CSV 填文件名，后台单条上传到云存储 |

---

## 二、整体架构

### 2.1 数据流

```
管理员 Excel/CSV
      ↓
小程序后台上传
      ↓
创建导入任务（import_tasks 集合）
      ↓
云函数解析 + 校验
      ↓
┌─────────┴─────────┐
↓                   ↓
错误数据            正常数据
↓                   ↓
错误报告            地址转经纬度
（行号+原因）        ↓
                  腾讯地图 → 高德地图 → 0,0标记
                    ↓
                  预览（管理员确认）
                    ↓
                  分批写入云数据库
                    ↓
                  更新任务状态
                    ↓
                  小程序展示
```

### 2.2 技术选型

| 组件 | 选型 | 理由 |
|------|------|------|
| 数据载体 | CSV（UTF-8 BOM） | 小程序原生可解析，不引入第三方库，Excel 可直接打开 |
| 数据存储 | 微信云开发数据库 | 多用户共享、持久化、与现有 db.js 适配器兼容 |
| 文件解析 | 云函数 Node.js | 前端不引入第三方库，云函数可装 npm 包 |
| 地理编码 | 腾讯位置服务 + 高德位置服务 | 二级策略提高成功率，免费配额充足 |
| 图片存储 | 微信云存储 | 路径规范：covers/apartments/、covers/rooms/ |

### 2.3 集合设计

#### apartments 集合

```javascript
{
  _id: "自动生成",
  apartment_code: "A001",           // ★ 新增：公寓编号（唯一）
  name: "郑东人才公寓",
  district: "郑东新区",
  address: "郑东新区·复兴美寓",
  longitude: 113.7484,              // ★ 云函数自动获取
  latitude: 34.7597,                // ★ 云函数自动获取
  location_meta: "距离地铁1号线东风南路站约500米",
  price_min: 1200,
  price_max: 1800,
  room_summary: "1-2居",
  status: "active",
  image: "apt-1.jpg",               // 文件名，运行时拼接云存储路径
  nearby: ["超市/便利店", "快餐小吃", "药店"],  // 数组
  hero_class: "hero-zd",
  image_class: "apt-img-1",
  tags: [{ label: "热门", className: "tag-hot" }],
  costs: [...],                     // 共享配置，不入CSV
  private_facilities: [...],        // 共享配置，不入CSV
  public_facilities: [...],         // 共享配置，不入CSV
  create_time: db.serverDate(),
  update_time: db.serverDate()
}
```

#### room_types 集合

```javascript
{
  _id: "自动生成",
  apartment_code: "A001",           // ★ 关联公寓编号（替代 apartment_id）
  apartment_id: "云数据库_id",       // 云函数根据 code 反查后填充
  name: "精致一居室",
  area: "35㎡",
  orient: "南向",
  layout: "1室1卫",
  floor: "3层 / 总8层",
  price: 1200,
  status: "active",
  image: "room-1.jpg",
  desc: "独立一居室户型...",
  create_time: db.serverDate(),
  update_time: db.serverDate()
}
```

#### import_tasks 集合（★ 新增）

```javascript
{
  _id: "自动生成",
  task_id: "IMP-20260718-001",      // 任务编号
  file_name: "公寓-批量导入.csv",
  target_type: "apartments",        // apartments | room_types
  operator: "u_current",            // 操作人 user_id
  total_count: 100,                 // 总数据条数
  success_count: 95,                // 成功数量
  fail_count: 5,                    // 失败数量
  status: "completed",              // pending | previewing | completed | failed
  error_log: [                      // 错误报告
    { row: 23, reason: "地址无法解析" },
    { row: 88, reason: "公寓名称为空" },
    { row: 120, reason: "租金格式错误" }
  ],
  preview_data: [...],              // 预览数据（校验通过的正常数据）
  create_time: db.serverDate(),
  complete_time: db.serverDate()
}
```

---

## 三、CSV 字段设计

### 3.1 公寓 CSV（10列）

| # | 中文表头 | 字段 key | 必填 | 说明 |
|---|---------|---------|------|------|
| 1 | 公寓编号 | apartment_code | 是 | 如 A001，唯一标识，用于户型关联 |
| 2 | 公寓名称 | name | 是 | 如 郑东人才公寓 |
| 3 | 区域 | district | 否 | 如 郑东新区 |
| 4 | 地址 | address | 是 | 如 郑东新区·复兴美寓，用于地理编码 |
| 5 | 位置摘要 | location_meta | 否 | 如 距离地铁1号线东风南路站约500米 |
| 6 | 最低租金 | price_min | 否 | 数字，如 1200 |
| 7 | 最高租金 | price_max | 否 | 数字，如 1800 |
| 8 | 居室类型 | room_summary | 否 | 如 1-2居 |
| 9 | 状态 | status | 否 | active / hidden |
| 10 | 封面图文件名 | image | 否 | 如 apt-1.jpg |

**已删除字段**：经度、纬度（云函数自动获取）
**不入 CSV 字段**：costs / private_facilities / public_facilities（共享配置，后台单独维护）、tags / hero_class / image_class（样式配置，后台单独维护）、nearby（本期暂不入，后续可扩展）

### 3.2 户型 CSV（10列）

| # | 中文表头 | 字段 key | 必填 | 说明 |
|---|---------|---------|------|------|
| 1 | 户型名称 | name | 是 | 如 精致一居室 |
| 2 | 公寓编号 | apartment_code | 是 | 如 A001，关联公寓 |
| 3 | 所属公寓名称 | apartment_name | 是 | 如 郑东人才公寓，二次校验 |
| 4 | 面积 | area | 否 | 如 35㎡ |
| 5 | 朝向 | orient | 否 | 如 南向 |
| 6 | 居室 | layout | 否 | 如 1室1卫 |
| 7 | 楼层 | floor | 否 | 如 3层 / 总8层 |
| 8 | 租金 | price | 否 | 数字，如 1200 |
| 9 | 状态 | status | 否 | active / hidden |
| 10 | 封面图文件名 | image | 否 | 如 room-1.jpg |

**已删除字段**：apartment_id（改用 apartment_code）、desc（本期暂不入，后续可扩展）

### 3.3 CSV 格式规范

- **编码**：UTF-8 with BOM（导出拼接 `\ufeff`，导入 stripBOM）
- **分隔符**：英文逗号 `,`
- **数组字段**：周边配套等用竖线 `|` 分隔（如 `超市|快餐|药店`）
- **换行**：`\n`
- **引号转义**：含逗号/引号/换行的字段用双引号包裹，内部双引号用 `""` 转义

### 3.4 CSV 示例

**公寓 CSV 示例**：

```csv
公寓编号,公寓名称,区域,地址,位置摘要,最低租金,最高租金,居室类型,状态,封面图文件名
A001,郑东人才公寓,郑东新区,郑东新区·复兴美寓,距离地铁1号线东风南路站约500米,1200,1800,1-2居,active,apt-1.jpg
A002,高新人才家园,高新区,高新区·春藤美寓,距离地铁8号线冬青街站约800米,800,1200,开间/1居,active,apt-2.jpg
```

**户型 CSV 示例**：

```csv
户型名称,公寓编号,所属公寓名称,面积,朝向,居室,楼层,租金,状态,封面图文件名
精致一居室,A001,郑东人才公寓,35㎡,南向,1室1卫,3层 / 总8层,1200,active,room-1.jpg
舒适两居室,A001,郑东人才公寓,55㎡,东南向,2室1厅1卫,5层 / 总8层,1500,active,room-2.jpg
```

---

## 四、核心机制设计

### 4.1 七个修复点

| # | 修复点 | 归属 | 核心措施 |
|---|--------|------|---------|
| 1 | BOM 编码双向处理 | 阶段2 | 导出拼接 `\ufeff`，导入 stripBOM |
| 2 | 公寓 code 校验+名称反查 | 阶段3 | 导入户型时先按 code 查公寓，失败按 name 反查，都失败记录错误行 |
| 3 | 数据类型转换管道 | 阶段3 | parseFloat（经纬度）、parseInt（租金）、split（数组） |
| 4 | 批量写入分批并发 | 阶段3 | Promise.all 每批20条，config.json 超时20秒 |
| 5 | 地址自动转经纬度 | 阶段3 | 腾讯地图 → 高德地图 → 0,0 标记人工修正 |
| 6 | 导入任务记录 | 阶段3 | import_tasks 集合，记录每次导入的完整信息 |
| 7 | 错误报告机制 | 阶段3 | 失败行号+原因，存入任务记录，后台可查 |

### 4.2 地址转经纬度（地理编码）

**二级策略流程**：

```
地址（如 "高新区·春藤美寓"）
    ↓
拼接城市前缀："郑州" + 地址
    ↓
调用腾讯地图 Geocoder API
    ↓
成功 → 返回 { lng, lat }
    ↓
失败 → 调用高德地图 Geocoder API
    ↓
成功 → 返回 { lng, lat }
    ↓
失败 → 返回 { lng: 0, lat: 0 }，标记需人工修正
```

**API 调用规范**：

- **腾讯位置服务**：`https://apis.map.qq.com/ws/geocoder/v1/?address=郑州{地址}&key={TENCENT_KEY}`
- **高德位置服务**：`https://restapi.amap.com/v3/geocode/geo?address=郑州{地址}&key={AMAP_KEY}`
- **key 管理**：配置在云函数环境变量，不入代码仓库
- **配额**：腾讯免费每日1万次，高德免费每日5000次，足够使用

**容错策略**：

- API 返回状态码非成功 → 视为失败，尝试备用 API
- 返回经纬度为 0 或超出郑州范围 → 视为失败
- 失败的行经纬度设为 0,0，在 error_log 中记录，管理员可在后台用地图选点组件手动修正

### 4.3 导入任务流程

```
1. 管理员上传 CSV
2. 云函数 createImportTask：
   - 生成 task_id（如 IMP-20260718-001）
   - 写入 import_tasks 集合，status=pending
   - 返回 task_id
3. 云函数 previewImport（异步）：
   - 读取 CSV 内容
   - stripBOM
   - 逐行解析 + 校验（类型转换、公寓code校验）
   - 正常数据：地址转经纬度
   - 错误数据：收集到 error_log
   - 更新任务：status=previewing，preview_data=正常数据，error_log=错误报告
4. 管理员后台预览：
   - 查看正常数据预览
   - 查看错误报告（行号+原因）
   - 点击"确认导入"
5. 云函数 confirmImport：
   - 读取 preview_data
   - Promise.all 分批20条写入云数据库
   - 更新任务：status=completed，success_count，fail_count，complete_time
6. 管理员查看导入历史
```

### 4.4 图片处理机制

**CSV 侧**：只填文件名（如 `apt-1.jpg`），不填完整路径

**云存储路径规范**：

- 公寓封面图：`covers/apartments/{文件名}`（如 `covers/apartments/apt-1.jpg`）
- 户型封面图：`covers/rooms/{文件名}`（如 `covers/rooms/room-1.jpg`）

**上传流程**：

1. 管理员在后台公寓/户型编辑页点击"上传图片"
2. image-uploader 组件调用 `wx.cloud.uploadFile`
3. cloudPath 按规范拼接：`covers/apartments/{文件名}` 或 `covers/rooms/{文件名}`
4. 上传成功后，文件名写入数据库 image 字段
5. 详情页渲染时，拼接完整云存储路径显示

**地图选点修正**：

- 公寓编辑页新增"地图选点"组件
- 复用现有 map 页能力，管理员在地图上点击修正经纬度
- 修正后直接更新数据库 longitude / latitude 字段

---

## 五、云函数接口设计

### 5.1 新增接口

| 接口 | 入参 | 出参 | 说明 |
|------|------|------|------|
| createImportTask | { targetType, fileName, csvContent } | { taskId } | 创建导入任务 |
| previewImport | { taskId } | { totalCount, successCount, failCount, errorLog, previewData } | 解析校验预览 |
| confirmImport | { taskId } | { successCount, failCount } | 确认写入数据库 |
| getImportTask | { taskId } | { task } | 查询任务状态 |
| listImportTasks | { targetType, page, pageSize } | { tasks, total } | 导入历史列表 |
| geocodeAddress | { address } | { lng, lat, source } | 地址转经纬度（内部调用） |

### 5.2 现有接口升级

| 接口 | 变更 |
|------|------|
| importAdminItems | 废弃，被 createImportTask + previewImport + confirmImport 替代 |
| getAdminDataset | 适配云数据库，返回 apartment_code 字段 |
| saveAdminItem | 新增 apartment_code 字段处理 |
| exportAdminItems（新增） | 支持按条件导出（区域/状态筛选） |

### 5.3 云函数配置

```json
// cloudfunctions/rencai/config.json
{
  "permissions": {
    "openapi": ["phonenumber.getPhoneNumber"]
  },
  "timeout": 20,
  "env": {}
}
```

**环境变量**（在云开发控制台配置，不入代码）：

- `TENCENT_MAP_KEY`：腾讯位置服务 key
- `AMAP_KEY`：高德位置服务 key

---

## 六、实施阶段

### 阶段1：云数据库 + 数据迁移

**任务**：

1. 创建云数据库集合：apartments / room_types / import_tasks
2. apartments 增加 apartment_code 字段，现有6公寓编为 A001-A006
3. 创建索引：
   - apartments：apartment_code 唯一索引、name 索引、经纬度 2dsphere 索引
   - room_types：apartment_code 索引
   - import_tasks：task_id 索引、create_time 索引
4. 生成种子数据 JSON，把 tables.js 现有数据写入云数据库
5. `db.js` 的 DATA_MODE 改为 "cloud"
6. 验证首页、详情页数据正常

**验证标准**：

- 首页公寓列表正常显示
- 公寓详情页信息完整
- 户型详情页信息完整
- 地图页定位正常

### 阶段2：CSV 字段优化 + BOM 处理

**任务**：

1. 公寓 CSV：删除经纬度2列，新增 apartment_code 列，共10列
2. 户型 CSV：apartment_id → apartment_code + apartment_name，共10列
3. 导出函数 `toCsvText` 优化：拼接 `\ufeff` BOM 头
4. 导入函数 `parseDelimitedRows` 优化：stripBOM 处理
5. 数组字段（周边配套）用竖线 `|` 分隔
6. 表头保持中文，兼容旧格式（导入时做表头映射）

**验证标准**：

- 导出的 CSV 在 Excel/WPS 打开无乱码
- 导入时第一列（公寓名称）解析正常
- 旧格式 CSV 仍可导入（向后兼容）

### 阶段3：云函数升级（任务+校验+地理编码+批量）

**任务**：

1. 新增 createImportTask / previewImport / confirmImport / getImportTask / listImportTasks 接口
2. 新增 geocodeAddress 内部函数：腾讯→高德二级策略
3. previewImport 实现：
   - stripBOM
   - 逐行解析 + 类型转换管道（parseFloat / parseInt / split）
   - 公寓 code 校验：先按 code 查，失败按 name 反查，都失败记录错误行
   - 地址转经纬度
   - 错误收集：行号 + 原因
4. confirmImport 实现：
   - Promise.all 分批20条并发写入
   - 失败行不影响其他行
5. config.json 超时改为 20 秒
6. 错误报告存入 import_tasks.error_log

**验证标准**：

- 上传 CSV → 创建任务 → 预览正常数据 + 错误报告
- 确认导入 → 数据写入云数据库
- 故意上传含错误的 CSV → 错误报告准确显示行号和原因
- 地址转经纬度成功（腾讯或高德）
- 批量导入100条不超时

### 阶段4：后台 UI（导入任务列表 + 预览确认）

**任务**：

1. 公寓/户型管理页新增"导入历史"入口
2. 导入历史页：任务列表（时间、文件名、成功数、失败数、状态）
3. 导入预览页：正常数据表格 + 错误报告列表
4. 确认导入按钮（错误行可选择"跳过错误行继续"或"全部中止"）
5. 按条件导出：区域/状态筛选 + 导出按钮
6. 导出全部按钮

**验证标准**：

- 上传 CSV 后跳转预览页，显示正常数据和错误报告
- 点击确认导入后，数据写入数据库并更新列表
- 导入历史页可查看历史任务
- 按条件导出生成的 CSV 仅包含筛选后的数据

### 阶段5：图片上传 + 地图选点修正

**任务**：

1. 公寓/户型编辑页接入 image-uploader 组件
2. cloudPath 按规范拼接：`covers/apartments/{文件名}` 或 `covers/rooms/{文件名}`
3. 公寓编辑页新增"地图选点"组件（复用 map 页能力）
4. CSV 只填文件名，上传拼接云存储路径
5. 详情页渲染时拼接完整云存储路径

**验证标准**：

- 后台上传图片 → 云存储对应路径存在
- 详情页显示上传的图片
- 地图选点修正经纬度 → 数据库更新 → 地图页定位正确

### 阶段6：验证与文档

**任务**：

1. 全量 JS 语法检查：`miniprogram` + `cloudfunctions`
2. 闭环验证：导出 → 修改 → 导入 → 预览 → 确认 → 云数据库 → 详情页显示
3. 错误报告准确性验证
4. 经纬度自动获取准确性验证（郑州实际地址）
5. 写入 logs 文档

**验证标准**：

- 全量语法检查通过
- 闭环流程无报错
- 错误报告准确
- 经纬度偏差在合理范围（500米内）

---

## 七、后续扩展（本期不做）

| 扩展项 | 说明 | 触发条件 |
|--------|------|---------|
| 图片 zip 打包上传 | 管理员上传 zip，云函数解压到云存储 | 图片数量超过50张时 |
| 三级权限分级 | 超管/运营/只读，admin_users 集合 | 多运营人员协作时 |
| 多城市支持 | 增加 city 字段，地理编码不拼接"郑州" | 扩展到其他城市时 |
| nearby 字段入 CSV | 周边配套纳入 CSV 导入导出 | 需要批量维护周边配套时 |
| desc 字段入 CSV | 户型描述纳入 CSV | 需要批量维护户型描述时 |
| 批量修改 | 基于导入任务做增量更新 | 需要批量修改部分字段时 |

---

## 八、约束与风险

### 8.1 技术约束

- **不引入第三方库**（前端）：CSV 解析在小程序原生完成，云函数可用 npm 包
- **云函数超时**：默认3秒，改为20秒，单次导入上限约500条
- **云数据库连接数**：分批20条并发，避免连接数超限
- **地理编码配额**：腾讯1万次/日 + 高德5000次/日，足够使用

### 8.2 数据约束

- **apartment_code 唯一性**：数据库建唯一索引，导入时校验
- **地址格式**：建议"区域·小区名"格式，地理编码成功率最高
- **图片文件名**：不含路径分隔符，不含特殊字符

### 8.3 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 地理编码失败 | 中 | 经纬度为0 | 二级策略 + 后台地图选点修正 |
| CSV 编码错误 | 低 | 解析失败 | UTF-8 BOM 双向处理 |
| 云函数超时 | 低 | 导入中断 | 分批20条 + 超时20秒 |
| 公寓 code 重复 | 低 | 数据冲突 | 数据库唯一索引 + 导入校验 |
| 图片上传失败 | 低 | 图片缺失 | 保留 CSS 渐变兜底显示 |

---

## 九、需要用户配合的前提

1. **云数据库集合创建**：在微信开发者工具云开发控制台手动创建 apartments / room_types / import_tasks 三个集合
2. **腾讯位置服务 key**：在 [lbs.qq.com](https://lbs.qq.com) 申请（免费，个人开发者即可，每日1万次配额）
3. **高德位置服务 key**：在 [lbs.amap.com](https://lbs.amap.com) 申请（免费，备用，每日5000次配额）
4. **云函数部署**：代码完成后，右键 `cloudfunctions/rencai` → 上传并部署：云端安装依赖
5. **环境变量配置**：在云开发控制台配置 TENCENT_MAP_KEY 和 AMAP_KEY

---

## 十、验证清单

- [ ] 阶段1：云数据库3个集合创建，种子数据导入，首页/详情页正常
- [ ] 阶段2：CSV 导出 Excel 打开无乱码，导入第一列解析正常，旧格式兼容
- [ ] 阶段3：导入任务流程完整，错误报告准确，地理编码成功，批量不超时
- [ ] 阶段4：后台导入历史/预览/确认 UI 正常，按条件导出正常
- [ ] 阶段5：图片上传到云存储正确路径，地图选点修正经纬度
- [ ] 阶段6：闭环验证通过，语法检查通过，logs 文档完成

---

## 附录 A：现有6公寓的 apartment_code 编号

| apartment_code | name | address |
|---------------|------|---------|
| A001 | 郑东人才公寓 | 郑东新区·复兴美寓 |
| A002 | 高新人才家园 | 高新区·春藤美寓 |
| A003 | 经开青年公寓 | 经开区·观湖美寓 |
| A004 | 港区人才社区 | 航空港区·润丰锦尚 |
| A005 | 二七人才公寓 | 二七区·金沙美寓 |
| A006 | 中原青年社区 | 中原区·华山美寓 |

## 附录 B：现有14户型的 apartment_code 对应

| name | apartment_code | apartment_name |
|------|---------------|---------------|
| 精致一居室 | A001 | 郑东人才公寓 |
| 舒适两居室 | A001 | 郑东人才公寓 |
| 阳光大单间 | A001 | 郑东人才公寓 |
| 高新阳光单间 | A002 | 高新人才家园 |
| 高新舒适一居 | A002 | 高新人才家园 |
| 青年独立一居 | A002 | 高新人才家园 |
| 经开标准一居 | A003 | 经开青年公寓 |
| 经开舒适两居 | A003 | 经开青年公寓 |
| 港区经济单间 | A004 | 港区人才社区 |
| 港区独立一居 | A004 | 港区人才社区 |
| 二七舒适两居 | A005 | 二七人才公寓 |
| 二七通透三居 | A005 | 二七人才公寓 |
| 中原温馨一居 | A006 | 中原青年社区 |
| 中原合租两居 | A006 | 中原青年社区 |

## 附录 C：与现有代码的集成点

| 现有文件 | 变更类型 | 说明 |
|---------|---------|------|
| `miniprogram/data/tables.js` | 数据迁移 | 现有数据迁移到云数据库，补 apartment_code |
| `miniprogram/data/db.js` | 配置变更 | DATA_MODE 改为 "cloud" |
| `miniprogram/data/queries.js` | 适配 | apartmentToDetail 等函数适配云数据库返回 |
| `miniprogram/pages/admin/index.js` | 重构 | CSV 导入导出逻辑升级，接入任务流程 |
| `cloudfunctions/rencai/index.js` | 扩展 | 新增6个接口，升级现有接口 |
| `cloudfunctions/rencai/config.json` | 配置 | 超时改20秒 |
| `cloudfunctions/rencai/package.json` | 依赖 | 如需可加 axios（地理编码HTTP请求） |
