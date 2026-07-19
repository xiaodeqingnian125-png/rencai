# 阶段 A 修复 + 阶段 B/C 操作指南

## 日期
2026-07-19

## 背景
完成 [EXECUTION-PLAN.md](../EXECUTION-PLAN.md) 待做项中的「云环境部署」关键路径。阶段 A 修复 5 个已知 bug，阶段 B 通过新增 `initCloud` action 实现一键部署，阶段 C 给出端到端验证清单。

## 阶段 A：5 个已知 bug 修复情况

| # | 缺陷 | 状态 | 说明 |
|---|------|------|------|
| 1 | `getImportTask` 剥离 `preview_data` 导致预览页不渲染 | 日志过时，代码已修复 | `getImportTask` 已改为只剥离 `csv_content`，保留 `preview_data` 供预览页渲染（前 20 条） |
| 2 | `previewImport` 不写 `success_count` | 日志过时，代码已修复 | `previewImport` 第 116 行已写 `success_count: previewData.length` |
| 3 | `wx.chooseLocation` 缺 `fail` 回调 | 本次修复 | `apartment-detail/index.js` 添加 `fail` 回调，仅打日志不报错 |
| 4 | `db.get()` 默认 100 条限制 | 本次修复 | 云函数新增 `getAll()` 分页拉取函数（100/页，上限 5000），替换 `getAdminDataset` 和 `exportAdminItems` 中的默认 `get()` |
| 5 | `room_types` 导入无去重/更新路径 | 日志过时，代码已修复 | `validateRoomRow` 已按 `name + apartment_code` 查重并走 update 路径 |

## 阶段 B：云环境一键部署

新增 `initCloud` 云函数 action，封装以下能力：
1. 自动创建全部 15 个业务集合（已存在则跳过）
2. 调用 `migrateApartments` / `migrateRoomTypes` 写入种子数据（按 code 查重跳过）

### 集合清单
```
users, apartments, room_types, activities, services,
borrow_items, borrow_requests, comments, comment_likes,
favorites, activity_registrations, service_orders,
roommate_posts, messages, import_tasks
```

### 用户操作步骤

#### 1. 重新部署 rencai 云函数
在微信开发者工具中：
- 右键 `cloudfunctions/rencai` 目录
- 选择「上传并部署：云端安装依赖（不上传 node_modules）」
- 等待部署完成（含 axios 依赖）

#### 2. 触发 initCloud 一次性初始化
在云开发控制台：
- 云开发 → 云函数 → rencai → 测试
- 输入测试参数：
```json
{ "action": "initCloud" }
```
- 点击「运行测试」
- 查看返回结果，预期：
  - `collections.created`: 新建的集合名列表
  - `collections.existed`: 已存在的集合名列表（apartments/room_types/import_tasks 三个应该在此列）
  - `seed.apartments.inserted`: 公寓种子写入条数
  - `seed.room_types.inserted`: 户型种子写入条数

#### 3. 验证数据库
在云开发控制台：
- 数据库 → 各集合 → 检查记录数
- `apartments` 应有 6 条（A001-A006）
- `room_types` 应有 14 条
- 其余集合应为 0 条（等待小程序运行时写入）

## 阶段 C：端到端验证清单

部署完成后，在微信开发者工具中以 iPhone 15 模拟器逐项验证：

| # | 验证项 | 预期结果 | 通过 |
|---|--------|---------|------|
| 1 | 游客浏览 → 手机号授权登录 → 管理员识别 | 首页加载正常；登录弹窗授权手机号自动填入；昵称"晓邱"+手机号"17739768562"显示管理员徽章 | ☐ |
| 2 | 公寓列表 → 公寓详情 → 户型详情 → 地图选点 | 首页公寓列表 6 条；详情页地址/价格/户型正常；户型详情加载正常 | ☐ |
| 3 | 收藏 / 评论 / 报名 / 借用 / 发帖 / 下单 6 项写操作 | 每项操作后 Toast 提示成功；关联页 `onShow` 数据刷新无延迟 | ☐ |
| 4 | 管理员后台 7 项 CRUD | 新增/编辑/删除/上下架全部正常；删除有二次确认；级联删除生效 | ☐ |
| 5 | CSV 导出 → Excel 打开无乱码 | 导出文件 UTF-8 BOM；Excel 打开中文正常；按区域/状态筛选生效 | ☐ |
| 6 | CSV 导入 → 预览 → 确认 → 错误报告 | 导入历史页显示任务列表；预览页显示有效/无效行；确认后数据入库 | ☐ |
| 7 | 地址转经纬度（腾讯→高德→兜底 0,0） | 公寓详情地图定位准确；导入时地址自动转经纬度；失败时标记警告 | ☐ |
| 8 | 图片上传到云存储 | 公寓/户型封面图上传成功；列表页与详情页显示真实图片；无图时显示渐变占位 | ☐ |

### 失败处置
- 任一验证项失败：记录到「缺陷清单」，按 P0/P1/P2/P3 分级，P0/P1 必须修复后发布
- 验证全部通过后，更新 `EXECUTION-PLAN.md` 阶段四状态为「已完成」

## 修改文件清单

| 文件 | 改动 |
|------|------|
| `miniprogram/pages/apartment-detail/index.js` | `onMapTap` 添加 `fail` 回调 |
| `cloudfunctions/rencai/index.js` | 新增 `getAll()` 分页查询工具函数；新增 `initCloud` action 及 `ALL_COLLECTIONS` 集合清单；`getAdminDataset` 和 `exportAdminItems` 改用 `getAll()` |

## 验证结果
- [x] 语法检查通过（`node -c` 两个修改文件）
- [ ] 部署后端到端验证 — 需用户操作微信开发者工具
