# XLSX 导出命名与直接导入

日期：2026-07-20

## 本次调整

- 公寓导出文件改为 `人才公寓-YYYYMMDD-HHmmss.xlsx`。
- 户型导出文件改为 `人才户型-YYYYMMDD-HHmmss.xlsx`。
- 云端生成与真机打开前的本地副本均使用该文件名，避免显示云端临时文件名。
- 公寓、户型的“批量导入”改为直接选择 `.xlsx` 文件。
- 移除“下载导入模板”和“选择 CSV 文件导入”的旧入口；管理员可直接选择刚导出的表格，修改后进入原有的预览、确认导入流程。

## 验证

- `node --test tests/*.test.js`：48 项通过。
- `node --check cloudfunctions/rencai/lib/export-file.js`
- `node --check miniprogram/utils/csv-share.js`
- `node --check miniprogram/pages/admin/index.js`

## 上线前操作

- 在微信开发者工具中重新部署云函数 `rencai`（本次云端生成文件名的逻辑在该云函数内）。
- 重新编译并上传小程序代码后，使用真机完成一次“导出 → 保存 → 修改 → 批量导入”的闭环验证。
