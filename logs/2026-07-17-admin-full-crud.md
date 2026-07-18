# 2026-07-17 管理员 7 项 CRUD 全量接入运行时数据层

## 背景

此前管理员页面只有公寓和户型两项 CRUD 写入运行时数据层（mock-store），活动/服务/物品/评论/用户 5 项的增删改只操作页面 `this.data.items`，离开页面即丢失。管理员页面的 config、WXML、表单、搜索/筛选/状态切换 UI 已全部就绪，只是 `isRuntimeManagedType()` 只对 apartments/rooms 返回 true。

## 改动范围

### 数据层

`data/mock-store.js`：

1. 新增 5 个反向映射函数，将管理员表单字段转为内部数据模型字段：
   - `normalizeActivityAdminItem` — name→title, category→category, time→date_label, place→location, quota→max_participants(解析数字), owner→organizer_name, desc→intro
   - `normalizeServiceAdminItem` — name→按名称查找 service 设置 service_id, user→按昵称查找 user 设置 user_id, orderNo→order_no, time→appointment_label, assignee→assignee, desc→remark, status→processing/completed/closed
   - `normalizeBorrowItemAdminItem` — category→category+category_label(双向映射), owner→按昵称查找 user 设置 owner_user_id, rule→rules, desc→desc+detail
   - `normalizeCommentAdminItem` — user→按昵称查找 user 设置 user_id, rating→Number, tags→按顿号/逗号分割为数组, content→body
   - `normalizeUserAdminItem` — name→nickname, role→role+role_label(双向映射), apartment→按名称查找 apartment 设置 apartment_id, room→room_label

2. 新增 2 个状态映射函数：
   - `serviceAdminStatusToInternal` — active→completed, hidden→closed, processing→processing
   - `borrowItemAdminStatusToInternal` — active→available, processing→borrowed, hidden→hidden, pending→pending

3. 扩展 `saveAdminItem` — 新增 activities/services/items/comments/users 5 个分支，各自调用对应 normalize 函数 + `replaceById`

4. 扩展 `deleteAdminItem` — 新增 5 个分支，删除主记录同时级联清理关联数据：
   - 活动：删除关联的 `activityRegistrations`
   - 物品：删除关联的 `borrowRequests`
   - 评论：删除关联的 `commentLikes`

5. 扩展 `updateAdminItemStatus` — 新增 5 个分支，各自映射状态值到内部状态

### 管理员页面

`pages/admin/index.js`：

- `isRuntimeManagedType()` 改为始终返回 `true`，全部 7 种类型走运行时数据层
- `exportData()` 移除类型限制，全部支持批量导出
- `openImport()` 移除类型限制，全部支持批量导入

`saveItem`/`deleteItem`/`updateStatus` 三个方法无需改动——它们已通过 `isRuntimeManagedType()` 分支调用 `saveAdminRuntimeItem`/`deleteAdminRuntimeItem`/`updateAdminRuntimeStatus`，现在这些函数对全部 7 种类型生效。

## 同步效果

| 管理操作 | 用户侧可见效果 |
|---------|--------------|
| 新增活动 | 服务页活动列表、活动详情页立即可见 |
| 活动状态改为 hidden | 服务页活动列表不再展示该活动 |
| 删除活动 | 活动详情页不可访问，关联报名记录清除 |
| 新增物品 | 借个锤子列表立即展示新物品 |
| 物品下架 | 借个锤子列表不再展示，关联借用申请清除 |
| 评论隐藏 | 公寓/户型详情页不再展示该评论 |
| 用户停用 | 该用户登录后无法正常使用（待登录拦截完善） |

## 验证

- 全量 JS 语法检查通过
- Node 冒烟测试覆盖全部 5 种类型：
  - 新增（created）→ 字段映射正确 → 状态更新 → 删除（级联清理）→ 总数恢复
  - 批量导入 2 条活动记录成功
- 管理员在管理后台做的增删改，在用户侧对应页面立即可见

## 约束

- 管理员表单中的用户名/服务名/公寓名等关联字段，在种子数据中找不到对应记录时回退到默认值（u_current/服务1/公寓0）。真实系统中应改为下拉选择器。
- 运行时 mock 数据只在当前会话内有效，重新编译后恢复种子数据。
