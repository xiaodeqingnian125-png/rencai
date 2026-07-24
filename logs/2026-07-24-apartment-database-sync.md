# 公寓数据库批量同步

- 时间：2026-07-24
- 云环境：`cloud1-d4gbiicxhcd67b748`
- 数据源：`人才公寓-20260720-210310.xlsx`
- 导入任务：`IMP-20260724-581946`
- 同步规则：按 `apartment_code` 匹配；Excel 空白保留数据库原值；不删除表格外记录
- 预检：77/77 通过
- 结果：更新 77 条，新增 0 条，失败 0 条
- 回读核验：77 条，字段不一致 0 处
- 特殊处理：A065、A070 的物业费包含“元/间/月”，修正导入器重复追加的单位后按 Excel 原值保存
- 同步前备份：`outputs/db-backups/apartments-before-sync-2026-07-24T06-13-01-222Z.json`
- 同步后快照：`outputs/db-backups/apartments-after-sync-2026-07-24T06-17-19-909Z.json`
