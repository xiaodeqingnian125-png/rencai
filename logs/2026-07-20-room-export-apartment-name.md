# 户型导出所属公寓名称修复

日期：2026-07-20

## 根因

户型记录保存的是 `apartment_code`，不保证包含 `apartment_name`。原导出流程只读取户型原始数据，却直接读取 `apartment_name`，导致“所属公寓名称”列为空。

## 修复

- 户型导出时并行读取户型与公寓数据。
- 通过 `apartment_code` 匹配公寓名称。
- 复用既有 `exportRoomCsv` 映射生成导出数据；不修改 XLSX 表头或导入流程。
- 若公寓列表读取失败，停止导出并提示“无法读取所属公寓”，不生成缺失关联名称的文件。

## 验证

- 新增回归测试：没有 `apartment_name` 的户型记录仍会导出匹配的所属公寓名称。
- `node --test tests/*.test.js`：49 项通过。
- `node --check miniprogram/pages/admin/index.js`：通过。

## 发布

本次只修改小程序端导出流程；重新编译并上传小程序代码即可，无需为本修复重新部署云函数。
