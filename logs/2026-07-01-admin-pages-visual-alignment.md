# 2026-07-01 管理员页面高保真还原

## 本次改动
- 新增 `pages/admin/index` 原生动态管理页，覆盖 7 个管理员入口：公寓、户型、活动、服务、物品、评论、用户。
- 对照 `admin-shared.css` 与各 `app-admin-*.html` 原型，实现搜索、新增、状态筛选、三格统计、列表卡片、状态标签、编辑/通过/隐藏/删除操作。
- 个人中心管理员入口已接通到对应管理类型，不再停留在 toast 占位。
- 页面数据仍为本地静态数据与基础交互，符合第一版无需真实接口的约束。

## 校验
- 已执行 `node --check miniprogram/pages/admin/index.js` 与 `node --check miniprogram/pages/profile/index.js`。
- 已执行页面 JSON / `app.json` 解析检查。
- 已执行资源路径检查与禁用写法检查。
- 已确认个人中心 7 个管理员入口均跳转到 `pages/admin/index` 对应类型，不再保留管理员入口占位 toast。
