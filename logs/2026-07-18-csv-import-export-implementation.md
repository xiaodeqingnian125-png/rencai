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
- [x] 全量语法检查通过（13 JS + 6 JSON）
- [ ] 首页/详情页数据正常（云数据库）— 需手动验证
- [ ] CSV 导出 Excel 打开无乱码 — 需手动验证
- [ ] 导入任务流程完整 — 需手动验证
- [ ] 错误报告准确 — 需手动验证
- [ ] 地址转经纬度成功 — 需手动验证（需配置 API key）
- [ ] 图片上传到云存储 — 需手动验证
- [ ] 地图选点修正经纬度 — 需手动验证

## 已知问题
1. getImportTask 剥离 preview_data，导入预览页的"有效数据"区域可能不渲染
2. previewImport 不写 success_count，预览阶段计数显示为 0
3. wx.chooseLocation 缺少 fail 回调，用户取消时控制台有警告
4. db.collection().get() 默认限制 100 条，大数据集导出可能被截断
5. room_types 导入无去重/更新路径（总是新增记录）
