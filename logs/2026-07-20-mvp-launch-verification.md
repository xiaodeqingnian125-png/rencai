# MVP 极速上线验证记录

日期：2026-07-20
分支：`feat/mvp-launch`

## 已执行且通过

| 检查 | 命令/范围 | 结果 |
|---|---|---|
| 自动化测试 | `node --test tests/*.test.js` | 30 条全部通过 |
| JavaScript 语法 | `miniprogram`、`cloudfunctions/rencai`、`tests` 全部 `.js` 执行 `node --check` | 通过 |
| JSON 解析 | `miniprogram` 下全部 JSON | 29 个通过 |
| 页面完整性 | `app.json` 注册页面的 JS/JSON/WXML/WXSS | 25/25 完整 |
| 差异格式 | `git diff --check` | 通过 |
| 假成功扫描 | 报名/发布/下单/借用/消息/二维码等历史成功文案与写函数 | 目标页面无命中 |
| 管理数据一致性 | 公寓编号唯一、户型公寓关联、地址失败拦截、媒体往返 | 测试通过 |

## 微信开发者工具验证

检测到 `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`。执行官方 `preview` 前，工具提示服务端口关闭；交互确认开启后，CLI 仍无法读取开发者工具 `.ide` 端口文件，最终返回：

```text
#initialize-error: wait IDE port timeout
```

因此本次**不能声明微信开发者工具编译通过**。需要在开发者工具 GUI 中手动进入“设置 → 安全设置”确认服务端口已打开，重启工具后打开项目编译。

## 本次未执行

- 未重新部署 `rencai` 云函数。
- 未调用线上 `initCloud`，未新建/修改线上集合和索引。
- 未上传体验版、未提交微信审核、未发布正式版。
- 未做 iPhone 真机测试。

## 部署前检查清单

- [ ] 手动开发者工具编译无 WXML/WXSS/组件错误。
- [ ] 确认 `miniprogram/envList.js` 指向目标云环境。
- [ ] `cloudfunctions/rencai/env.js` 配置腾讯地图、高德地图 Key 和管理员 OPENID，且继续被 Git 忽略。
- [ ] `users` 中目标管理员记录的 `role` 为 `admin`。
- [ ] 部署 `rencai`：选择“上传并部署：云端安装依赖”。
- [ ] 确认 `apartments`、`room_types`、`import_tasks` 等集合存在。
- [ ] 创建公寓编号、户型公寓编号、导入任务编号/时间索引。
- [ ] 验收普通用户无法调用管理员读取和写入 action。
- [ ] 验收手工新增公寓只填地址、图片上传、CSV 导入导出、平面图前3张/更多页。
- [ ] iPhone SE 类小屏与 Pro Max 类大屏各测试一次。
