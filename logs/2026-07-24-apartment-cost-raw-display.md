# 公寓详情费用 Excel 原文显示

- 范围：仅修改公寓详情页费用信息显示层；不写数据库，不调整 Excel 导入或导出。
- 显示规则：移除数据库值末尾由导入器自动追加的单位，恢复 Excel 原文。
  - `3.7元/立方` → `3.7`
  - `无元/立方` → `无`
  - `已含元/㎡/月` → `已含`
  - 空值保持空白。
- 已验证：`node --test tests/apartment-option-display.test.js tests/import-address-only.test.js tests/admin-cloud-crud.test.js tests/export-file.test.js` 通过（28 项）。
- 未执行任何数据库写入。
