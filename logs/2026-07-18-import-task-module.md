# 2026-07-18 导入任务模块（云函数端）

## 任务

阶段 3 任务 10：创建云函数端导入任务模块，实现 CSV 导入的完整流程（创建 → 预览 → 确认 → 查询）。
本任务是 CSV 导入导出功能阶段 3 中最复杂的任务，依赖任务 5（csv-parser.js）和任务 9（geocode.js）。

## 改动

- 新建 `cloudfunctions/rencai/lib/import-task.js`（333 行）
- 导出 5 个函数：
  - `createImportTask(targetType, fileName, csvContent, operator)`：创建导入任务，生成 `IMP-YYYYMMDD-NNNNNN` 格式任务编号
  - `previewImport(taskId)`：解析 CSV → 校验 → 地理编码，生成预览数据和错误报告，返回前 20 条预览
  - `confirmImport(taskId)`：分批写入云数据库（BATCH_SIZE=20，Promise.all），支持新增/更新（按 `_existing_id` 判定）
  - `getImportTask(taskId)`：查询单个任务（清理 csv_content、preview_data 大字段）
  - `listImportTasks(targetType, page, pageSize)`：分页查询任务列表（按 create_time 倒序）
- 内部辅助函数：`generateTaskId()`、`validateApartmentRow(row)`、`validateRoomRow(row, apartmentMap)`
- 数据模型：任务记录存于 `import_tasks` 集合，字段含 task_id、file_name、target_type、operator、total_count、success_count、fail_count、status、error_log、preview_data、csv_content、create_time、complete_time
- 状态机：pending → previewing → completed
- 依赖：`wx-server-sdk`、`./csv-parser`（parseCsv、rowsToObjects、toInt）、`./geocode`（geocodeAddress）

## 校验逻辑

- 公寓行（apartments）：
  - 必填：公寓编号、公寓名称、地址
  - 重复检查：apartment_code 已存在则记录 `_existing_id`（confirm 时改为 update）
  - 地理编码：调用 geocodeAddress，source 为 "failed" 时附加 `_warning`
- 户型行（room_types）：
  - 必填：户型名称、公寓编号
  - 外键关联：先按 apartment_code 在 apartmentMap 中查公寓，未命中则按 name 反查数据库；仍无则报错"公寓不存在"

## 错误报告格式

- 每条错误：`{ row: <行号>, reason: <错误描述> }`
- 行号从 2 开始（第 1 行为表头），与 rowsToObjects 的 `__rowNum` 一致

## 批量写入

- 每批 20 条，使用 Promise.all 并发
- 单条失败不阻塞同批其他条目，失败信息收集到 writeErrors
- 完成后清理 csv_content（设为 null）以节省存储

## 验证

- `node -c cloudfunctions/rencai/lib/import-task.js`：语法检查通过（输出 SYNTAX_OK）
- 代码与简报中"逐字使用的精确代码"完全一致

## 提交

- 1d556c8 feat(cloud): 导入任务模块 创建/预览/确认/查询
- 分支：feat/csv-import-export

## 备注

- 简报注意事项提到 `apartment_code` 格式校验（正则 `/^A\d{3}$/`），但简报中的精确代码未实现此校验。本任务严格遵循简报"逐字使用的精确代码"要求，未追加该正则校验。如后续需要可单独补丁。
- 错误报告字段结构与注意事项"包含行号、字段名、错误描述"略有差异：当前实现为 `{row, reason}`，字段名信息内嵌在 reason 文本中（如"公寓编号为空"）。同样遵循简报精确代码。
