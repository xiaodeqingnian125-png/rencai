# 2026-07-18 地理编码模块（云函数端）

## 任务

阶段 3 任务 9：创建云函数端地理编码模块，将地址字符串转换为经纬度坐标。
为公寓 CSV 导入流程提供地理编码能力——公寓 CSV 已删除经纬度列，改由本模块根据地址自动生成。

## 改动

- 新建 `cloudfunctions/rencai/lib/geocode.js`（约 100 行）
- 修改 `cloudfunctions/rencai/package.json`：dependencies 增加 `axios: ^1.6.0`
- 模块能力：
  - 腾讯位置服务 Geocoder API（主）
  - 高德位置服务 Geocoder API（备）
  - 郑州经纬度范围校验（112.7–114.0, 34.25–34.95）
  - 二级 fallback 策略：腾讯 → 高德 → 0,0
  - API key 通过环境变量读取（TENCENT_MAP_KEY、AMAP_KEY），不硬编码
- 导出：`geocodeAddress(address)`、`isInRange(lng, lat)`

## 验证

- `node -c cloudfunctions/rencai/lib/geocode.js`：语法检查通过
- `cloudfunctions/rencai/package.json` JSON 解析合法
- 36 个功能断言全部通过（覆盖 isInRange 边界、geocodeAddress 二级策略、key 缺失、API 抛错、坐标越界等场景）
- 临时测试脚本（含 mock axios）位于 work 目录，未进入项目目录与 git

## 提交

- d462adb feat(cloud): 地理编码模块 腾讯+高德二级策略
- 分支：feat/csv-import-export
