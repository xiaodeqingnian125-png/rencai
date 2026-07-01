# 2026-07-02 公寓管理截图样式还原

## 改动范围

- 将 `pages/admin/index` 在 `type=apartments` 时切换为公寓管理专属布局，不再渲染通用后台的 hero、筛选和统计模块。
- 按截图还原公寓管理主界面：搜索框、`+ 新增` 按钮、浅色圆角卡片、右上角编辑/删除胶囊按钮、三行公寓摘要和底部启用状态。
- 为公寓列表补齐原型静态数据字段 `facilityCount`，并追加二七人才公寓、中原青年社区，列表滚动内容与 `rencai-ui/app-admin-apartments.html` 保持一致。
- 保留其它 6 个管理员子页面现有通用管理布局，避免本次视觉调整影响户型、活动、服务、物品、评论、用户管理。
- 修正管理页保存时的 toast 判断，编辑保存后展示“已保存修改”。

## 验证

- 已运行 `node --check miniprogram/pages/admin/index.js`。
- 已运行 `rg --files -g '*.js' miniprogram cloudfunctions | xargs -n1 node --check`。
- 已运行 `git diff --check`。

## 备注

- 未接入真实接口、云数据库或第三方库，仍使用页面本地 `data` 与 `setData` 模拟增删改查。
- 尚未在微信开发者工具中完成真机/模拟器截图复核，建议重点查看 iPhone 尺寸下公寓卡片高度、按钮间距和底部滚动区域。
