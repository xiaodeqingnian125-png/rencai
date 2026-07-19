# MVP 测试基线

日期：2026-07-20

## 本次改动

- 新增基于 Node.js 内置 `node:test`、`node:vm` 的微信小程序模块测试加载器。
- 支持捕获 `Page` 与 `Component` 定义，并支持注入模块和全局对象。
- 暴露 `loadPage`、`loadComponent`，供后续管理员页和组件行为测试复用。
- 新增第一条基线测试，验证页面定义可以被正确捕获。

## 验证结果

- RED：首次执行 `node --test tests/baseline.test.js`，因加载器不存在按预期失败。
- GREEN：实现加载器后再次执行，1 条测试通过。
- 静态检查：`miniprogram` 与 `cloudfunctions/rencai` 下全部 JavaScript 文件通过 `node --check`。

## 影响范围

本次只增加测试基础设施和日志，不改变小程序运行时行为，也不引入第三方依赖。
