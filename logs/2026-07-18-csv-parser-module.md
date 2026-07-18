# 2026-07-18 CSV 解析模块（云函数端）

## 任务

阶段 2 任务 5：创建云函数端 CSV 解析模块，供后续 CSV 导入任务（任务 10）调用。

## 改动

- 新建 `cloudfunctions/rencai/lib/csv-parser.js`（123 行）
- 导出 7 个函数：`stripBOM`、`parseCsv`、`rowsToObjects`、`arrayToCsvString`、`csvStringToArray`、`toNumber`、`toInt`
- 处理能力：UTF-8 BOM 剥离、引号包裹逗号、双引号转义、CRLF/LF 换行、空行过滤、半角/全角 `|` 分隔的数组互转、安全的数字/整数转换

## 验证

- `node -c cloudfunctions/rencai/lib/csv-parser.js`：语法检查通过
- 31 个功能断言全部通过（覆盖 7 个函数的典型路径与边界）
- 临时测试脚本未进入项目目录

## 提交

- 9a46a26 feat(cloud): CSV 解析模块 stripBOM/parseCsv/类型转换
- 分支：feat/csv-import-export
