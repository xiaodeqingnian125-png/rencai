# 2026-07-19 管理员导入导出上线前三项修复

分支：`feat/mvp-launch`

## 背景

管理员导入导出 UI 基本完成，部署前需修复三个问题：
1. 文件分享失败时的真实降级
2. 错误报告补齐原始数据
3. write_errors 列表的稳定 wx:key

## 修改文件清单

| 文件 | 类型 | 说明 |
|------|------|------|
| `miniprogram/utils/csv-share.js` | 新增（工作区未跟踪） | 重写文件分享降级逻辑，导出 csvCell 供错误报告复用 |
| `cloudfunctions/rencai/lib/import-task.js` | 修改 | previewImport 的 error_log 增加 raw_data 字段 |
| `miniprogram/pages/admin/import-preview/index.js` | 修改 | downloadErrors 使用 raw_data、复用 csvCell、loadTask 生成 _view_key |
| `miniprogram/pages/admin/import-preview/index.wxml` | 修改 | error_log 与 write_errors 的 wx:key 改为 _view_key |

## 修复详情

### 1. 文件分享真实降级（csv-share.js）

重写 `writeAndShareCsv`，基于运行时能力检测决定降级路径，不假设任何平台一定支持某 API：

- 文件系统写入成功 + `wx.shareFileMessage` 可用且成功 → 提示"文件已生成"，结果 `shared`
- `wx.shareFileMessage` 不存在 → 复制完整 CSV 到剪贴板，提示"当前环境不支持文件分享，CSV内容已复制"，结果 `copied`
- `wx.shareFileMessage` 调用失败 → 复制完整 CSV 到剪贴板，提示"文件分享未完成，CSV内容已复制"，结果 `copied`
- 文件系统不可用或写入失败 → 复制完整 CSV 到剪贴板，结果 `copied`
- `wx.setClipboardData` 也失败 → 提示"生成失败，请重试"，结果 `failed`（绝不提示成功）

关键约束：
- 不再出现"文件已保存"这种不真实提示（用户无法访问 USER_DATA_PATH）
- 不向用户暴露 USER_DATA_PATH 等内部路径
- 模板下载（admin/index.js）和错误报告下载（import-preview/index.js）共用同一 `writeAndShareCsv` 函数
- 模块级 `_inFlight` 标记防止快速重复点击同时生成多个文件
- 可选 `complete` 回调报告最终结果：`shared` / `copied` / `failed`

### 2. 错误报告补齐原始数据（import-task.js）

新增 `truncateRawData` / `buildRawData` 纯函数，previewImport 的 error_log 每条增加 `raw_data`：

- 结构兼容：保留原有 `row` + `reason`，新增 `raw_data`
- `raw_data` 为该行原始数据（解析后对象剔除 `__rowNum`）的紧凑 JSON 字符串
- 每行 `raw_data` 最多 1000 字符（含标记总长度），超长截断并追加 `…[已截断]`
- CSV 为空 / 表头错误等早返回场景：`raw_data` 为空字符串
- 不含 `_openid`、管理员身份、地图 Key、环境变量或服务器上下文
- 只保存用户上传 CSV 当前行的内容
- 不修改线上已有 import_tasks 数据（仅影响新预览操作）

### 3. 错误报告下载使用 raw_data（import-preview/index.js）

- 预览错误三列：`error.row` / `error.reason` / `error.raw_data`
- `raw_data` 为字符串直接使用，对象才 `JSON.stringify`，字段缺失输出空字符串
- 写入错误继续兼容 `item` / `error`
- 复用 `utils/csv-share` 的 `csvCell`（移除本地重复定义），保证模板与错误报告 CSV 转义一致
- 继续 UTF-8 BOM、逗号/双引号/换行/公式注入防护
- 文件名规则不变：`{target_type}-import-errors-{YYYYMMDD}.csv`
- 下载失败时由 `writeAndShareCsv` 自动走剪贴板降级

### 4. write_errors 稳定 wx:key（import-preview/index.js + index.wxml）

- 新增 `_decorateTask`：加载任务时为 error_log 与 write_errors 每项生成稳定 `_view_key`
- key 由 `类型 + 行号/item + 数组索引` 组合：`error:{row}:{idx}` / `write:{item}:{idx}`
- 数组索引保证列表内唯一（即使行号或 item 重复）
- 两次渲染 key 稳定可复现
- 仅前端展示用，不修改服务器 error_log/write_errors 数据库结构
- WXML：error_log 与 write_errors 的 `wx:key` 改为 `_view_key`
- 错误列表布局不变（raw_data 只进下载 CSV，不上屏）

## 本地验证（14 项规格 + 2 项补充，全部 PASS）

使用 Node 自带 assert，不安装新依赖，临时测试文件运行后已删除。云函数通过 mock `wx-server-sdk` + `./geocode` 加载，小程序页面通过 mock `Page` + `db` + `csv-share` 加载。

| # | 验证项 | 结果 |
|---|--------|------|
| 1 | 文件分享 API 存在且成功 → shared | PASS |
| 2 | 文件分享 API 不存在 → 自动复制剪贴板 → copied | PASS |
| 3 | 文件分享调用失败 → 自动复制剪贴板 → copied | PASS |
| 4 | 文件系统写入失败 → 自动复制剪贴板 → copied | PASS |
| 4b | 文件系统不可用 → 自动复制剪贴板 → copied | PASS |
| 5 | 剪贴板也失败 → failed，不提示成功 | PASS |
| 5b | 防重复点击：进行中再次调用被拦截 | PASS |
| 6 | 模板与错误报告共用同一 writeAndShareCsv 函数 | PASS |
| 7 | error_log raw_data 正常导出（剔除 __rowNum） | PASS |
| 8 | raw_data 包含逗号时 CSV 正确（引号包裹） | PASS |
| 9 | raw_data 包含双引号时 CSV 正确（转义为两个双引号） | PASS |
| 10 | raw_data 包含换行时 CSV 正确（不破坏行结构） | PASS |
| 11 | raw_data 超过 1000 字符被截断并带 …[已截断] 标记 | PASS |
| 12 | = + - @ 开头文本仍有公式注入防护 | PASS |
| 13 | write_errors 每一项都有稳定 _view_key | PASS |
| 14 | 没有错误时不生成错误报告 | PASS |

## 静态检查

- `node --check`：csv-share.js / import-task.js / import-preview/index.js 全部通过
- JSON 解析：import-preview/index.json 通过
- `git diff --check`：无空白错误
- WXML 事件绑定：downloadErrors / cancel / confirmImport 完整
- WXML wx:key：error_log 与 write_errors 均为 `_view_key`
- 敏感信息扫描：toast 不含 USER_DATA_PATH；raw_data 不含 _openid / 地图 Key / 环境变量
- env.js 未进入 diff（被 gitignore）
- contact_phone / makePhoneCall：本次修改文件中无新增
- requireAdmin：cloudfunctions/rencai/index.js 仍生效（未触碰该文件）

## 范围控制

- 仅修改 4 个文件（csv-share.js / import-task.js / import-preview/index.js / import-preview/index.wxml）
- 未修改首页 / 公寓详情 / 户型详情 / 地图页 / 管理员列表 CRUD 数据源
- 未新增电话字段或电话按钮
- 未部署云函数、未修改线上数据库、未导入线上数据
- 未提交、未推送、未合并
- 未安装新依赖
- 未改变现有 UI 颜色和布局（仅 wx:key 由 *this/row 改为 _view_key）
- 工作区其余已有修改（admin/index.js、csv-parser.js、import-history 等）均为本次之前既存，予以保留

## 未部署、未提交、未推送

等待确认。
