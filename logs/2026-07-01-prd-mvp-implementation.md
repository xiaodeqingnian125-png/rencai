# 2026-07-01 PRD 静态 MVP 实施

## 改动概述

- 按 PRD V2.6 和 AGENTS.md 约束，继续使用微信小程序原生 WXML/WXSS/JavaScript 实现静态 MVP。
- 新增统一静态业务数据模块 `miniprogram/data/business.js`，集中维护活动、代办服务、借用物品、消息和个人中心记录。
- 补齐服务模块页面流：活动列表、活动详情、活动发布、代办服务列表、代办服务详情与提交需求表单。
- 补齐借个锤子页面流：物品详情、借用/预约申请弹层、发布物品表单。
- 更新服务页、借个锤子页、消息页、个人中心的跳转与数据来源，减少散落静态数据和占位提示。
- 对齐评论管理口径：评论无需审核，管理员侧仅保留已展示/已隐藏管理。
- 更新 `project.config.json` 项目名称为 `rencai-weixin`。

## 验证

- 已运行 `node --check` 覆盖 `miniprogram` 与 `cloudfunctions` 下全部 JavaScript 文件。
- 已校验 `miniprogram/app.json` 和 `project.config.json` JSON 可解析。
- 已校验本地业务数据模块可正常导出活动、服务、借物和消息数据。
- 已扫描并清理主要流程中的 `下一步接入`、`showStaticTip`、`replyComment` 开发占位。
- 继续加固新增页面 WXML：将活动详情、借物详情和活动发布页的复杂展示判断下沉到 JS 数据字段，降低小程序编译差异风险。
- 已运行 `git diff --check`，未发现空白错误。
- 本地未发现 `miniprogram-ci` 或小程序端 npm 工具链，暂未执行微信小程序 CI 编译。

## 说明

- 第一版不接 Supabase、微信支付、订阅消息或真实登录。
- 代办服务按 PRD 降级方案实现为提交需求，由客服线下联系确认。
- 表单数据仅在当前页面内模拟校验和成功反馈，不写入云数据库。
