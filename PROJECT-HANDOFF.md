===== BEGIN PROJECT HANDOFF =====

# 晓得青年项目交接报告

> 生成时间：2026-07-19
> 生成方式：纯静态代码审查 + JS 语法检查 + JSON 解析检查 + git 状态检查
> 重要约定：本报告严格区分四种状态：**代码已确认** / **微信开发者工具已验证** / **云端已验证** / **尚未确认/只是推测**
> 敏感信息（地图 Key、AppSecret、完整手机号、完整 OPENID、Token）已脱敏

---

## 1. 项目身份

| 项目 | 值 |
|---|---|
| 当前项目绝对路径 | `/Users/xiaode/Desktop/06 AI Apps/rencai-weixin` |
| 项目名称 | 晓得青年（微信小程序社区产品） |
| 技术栈 | 微信小程序原生（WXML/WXSS/JavaScript）+ 微信云开发（wx-server-sdk） |
| 小程序目录 | `miniprogram/` |
| 云函数目录 | `cloudfunctions/rencai/`（另含未使用的 `cloudfunctions/quickstartFunctions/`） |
| 当前 Git 分支 | `main` |
| 当前 commit 短哈希 | `53ee632` |
| 当前 commit 说明 | `feat(cloud): 接入腾讯/高德地图 key 本地配置回退` |
| 远程仓库名称 | `origin` → `git@github.com:xiaodeqingnian125-png/rencai.git`（SSH，未含凭证） |
| 本地领先 origin/main | **33 个提交未 push** |
| 本地落后 origin/main | 0 |
| 是否存在未跟踪文件 | 是 |

### git status 完整摘要

```
On branch main
Your branch is ahead of 'origin/main' by 33 commits.

Changes not staged for commit:
        modified:   .gitignore
        modified:   cloudfunctions/rencai/index.js
        modified:   miniprogram/app.js
        modified:   miniprogram/components/login-modal/index.js
        modified:   miniprogram/pages/apartment-detail/index.js
        modified:   miniprogram/pages/profile-edit/index.js
        modified:   miniprogram/pages/profile-edit/index.wxml

Untracked files:
        CLAUDE.md
        logs/2026-07-19-cloud-deploy-and-bugfix.md
        logs/2026-07-19-cloud-login-fix.md
        logs/2026-07-19-gstack-local-install.md
        logs/2026-07-19-login-cloud-error-format-fix.md
        logs/2026-07-19-profile-edit-logout-and-hardcoded-data.md
```

### 未提交文件及修改目的

| 文件 | 修改目的 |
|---|---|
| `.gitignore` | 新增 `cloudfunctions/rencai/env.js` 和 `.claude/skills/` 忽略规则 |
| `cloudfunctions/rencai/index.js` | 大幅重构：新增 `initCloud` action、`getPhoneByCode`、脱敏日志、admin 角色服务端权威判定、统一错误返回格式 `{ ok, code, message }` |
| `miniprogram/app.js` | 登录链路改造：移除云失败静默降级 mock、新增 `restoreLoginWithCloud`、脱敏日志、统一 Promise 返回 |
| `miniprogram/components/login-modal/index.js` | 新增 `mapLoginErrorToToast`，将云函数错误码映射为用户可读文案 |
| `miniprogram/pages/apartment-detail/index.js` | 仅新增 `wx.chooseLocation` 的 fail/cancel 处理 |
| `miniprogram/pages/profile-edit/index.js` | 废弃 `exitApp` 调 `wx.exitMiniProgram`，改为 `logoutAccount` 调 `app.logout()` 后 `switchTab` 回个人中心 |
| `miniprogram/pages/profile-edit/index.wxml` | 对应按钮文案调整 |

### 未跟踪文件说明

- `CLAUDE.md`：Claude Code 配置文件（可能含本地路径，未提交）
- `logs/2026-07-19-*.md`（5 个）：今日新增的任务日志，按 AGENTS.md 约定应保留但未提交

---

## 2. 当前代码健康状态

### 实际运行的检查

| 检查项 | 方式 | 结果 |
|---|---|---|
| 所有 `miniprogram/**/*.js` 语法检查 | `node --check` 逐文件 | **全部通过**（0 失败） |
| 所有 `cloudfunctions/rencai/**/*.js` 语法检查 | `node --check` 逐文件 | **全部通过**（0 失败） |
| 所有 `.json` 解析检查 | `JSON.parse` 逐文件 | **全部通过**（0 失败） |
| `app.json` 页面文件完整性 | 逐项核对 `pages/*` 路径与磁盘文件 | **全部存在**（24 个页面） |
| tabBar 图标完整性 | 核对 `assets/tabbar/*.png` | **10 个图标全部存在**（5 组普通/选中态） |

### TODO / 静态演示 / 假成功 / 暂未实现

| 文件:行 | 内容 | 状态 |
|---|---|---|
| `miniprogram/pages/profile-edit/index.js:33` | `wx.showToast({ title: "静态版暂不上传头像" })` | 头像更换是假按钮 |
| `miniprogram/pages/profile-edit/index.js:109-111` | `saveProfile()` 仅 `showToast("个人信息已保存")` | **保存按钮是假成功，不写入任何存储** |
| `miniprogram/pages/profile-edit/index.js:100-107` | `toggleStatus()` 仅 `showToast` | 入住状态切换是假成功 |
| `miniprogram/pages/profile-edit/index.js:5-12` | `form` 硬编码 `nickname:"晓得青年" / phone:"138****8888" / apartment:"郑东人才公寓" / building:"3号楼"` | 个人信息编辑页全部是硬编码 mock |
| `miniprogram/pages/admin/index.js:976` | `"当前原生静态版不引入 Excel 解析库，暂不能直接解析 .xls/.xlsx"` | 已知限制，有兜底提示 |
| `miniprogram/pages/profile/index.js:98` | `"临时切换 CURRENT_USER_ID 为当前登录用户（查询层暂用固定用户）"` | **profile 徽标数字永远是 mock 管理员 `u_current` 的数据，不是当前登录用户的** |
| `miniprogram/components/image-uploader/index.js:81-89` | mock 模式降级为本地临时路径 | 已知降级 |
| `miniprogram/data/tables.js` | 全量 mock 种子数据（6 公寓 / 14 户型 / 7 用户等） | 用于 mock 模式，云模式下不应被读取，但实际仍被多数页面读取（见第 6 节） |

### WXSS 不兼容选择器

未做深度扫描（无 wxss-lint 工具），但人工抽查 `app.wxss` 与主要页面 wxss 未发现 `:nth-child(n+*)` 等已知不兼容写法。**此项无法确认无问题，仅是未发现明显问题。**

### 云函数依赖状态

| 项 | 值 |
|---|---|
| `cloudfunctions/rencai/package.json` 依赖 | `wx-server-sdk: "latest"`, `axios: "^1.6.0"` |
| 本地 `node_modules` | **不存在**（`cloudfunctions/**/node_modules/` 已 gitignore，且未安装） |
| 与线上部署版本是否一致 | **无法确认**（本地无 `node_modules`，无法对比；需用户在微信开发者工具右键云函数"上传并部署：云端安装依赖"后才能一致） |

### 健康状态汇总

- **通过数量**：JS 语法 0 失败 / JSON 解析 0 失败 / 页面完整性 24/24 / tabBar 图标 10/10
- **失败数量**：0
- **需注意的隐患**：profile-edit 整页假数据 + 假保存；profile 徽标用固定 `u_current`；多数页面绕过 `db.js` 直接读 mock（详见第 6 节）

---

## 3. 当前云环境配置

### 本地代码可确认的部分

| 项 | 值 | 来源 |
|---|---|---|
| `miniprogram/envList.js` 是否配置环境 ID | **已配置** | `envList.js:16`（云环境 ID 已配置，值脱敏不输出） |
| 当前 `DATA_MODE` | **`"cloud"`** | `miniprogram/data/db.js:12` |
| `project.config.json` 基础库版本 | `2.20.1` | `project.config.json:49` |
| `project.config.json` appid | 已配置（值脱敏不输出） | `project.config.json:47` |
| `rencai` 云函数 `package.json` 依赖 | `wx-server-sdk: latest`, `axios: ^1.6.0` | `cloudfunctions/rencai/package.json` |
| `rencai` 云函数 `config.json` 权限 | `openapi: ["phonenumber.getPhoneNumber"]`, `timeout: 20` | `cloudfunctions/rencai/config.json` |
| 地图 Key 配置方式 | **混合**：`process.env.TENCENT_MAP_KEY` → 回退 `localEnv.TENCENT_MAP_KEY`（硬编码在 `env.js`） | `cloudfunctions/rencai/lib/geocode.js:10-11` |
| `env.js` 是否被 gitignore | **是**（`.gitignore:23`） | 不会提交到仓库 |
| 地图 Key 是否已配置 | **已配置**（腾讯 + 高德均硬编码在 `env.js:21-22`，值已脱敏不输出） | — |
| `ADMIN_OPENIDS` 配置 | **未配置**（`env.js:25` 为空数组 `[]`） | 管理员判定回退到 nickname+phone 兜底 |
| 管理员兜底手机号 | **已硬编码**（完整手机号写在 `cloudfunctions/rencai/index.js:55`，敏感信息不输出） | 任何用户用此手机号+昵称`晓邱`登录即获管理员权限 |
| 是否存在 `initCloud` action | **是**（`cloudfunctions/rencai/index.js:136-169`，`exports.main` case 第 756 行） | 可调用 |

### 微信开发者工具 / 云开发控制台才能确认的部分

> **以下信息本地代码无法确认，必须用户在微信开发者工具截图或回答**

| 项 | 状态 |
|---|---|
| 当前选中的云环境 | **无法确认，需要用户截图** |
| `rencai` 云函数最后部署时间 | **无法确认，需要用户在云开发控制台查看** |
| 部署方式是否为"云端安装依赖" | **无法确认，需要用户确认** |
| 本地代码与云端部署版本是否一致 | **无法确认**（本地 33 个未 push 提交 + 7 个未提交改动，云函数版本未知） |
| 最近一次 `loginUser` 调用结果 | **无法确认，需要用户提供云函数日志截图** |
| 最近一次云函数错误 | **无法确认，需要用户提供云函数日志截图** |
| `users` 集合是否已创建 | **无法确认，需要用户在云开发控制台查看** |
| 其他 14 个集合是否已创建 | **无法确认，需要用户在云开发控制台查看** |

---

## 4. 数据库真实状态

### A. 代码中计划使用的集合

来源：`cloudfunctions/rencai/index.js:31-47` 的 `ALL_COLLECTIONS` 常量

```
users, apartments, room_types, activities, services,
borrow_items, borrow_requests, comments, comment_likes,
favorites, activity_registrations, service_orders,
roommate_posts, messages, import_tasks
```

共 **15** 个集合。

### B. 云函数当前真实引用的集合

通过 `grep` 扫描 `cloudfunctions/rencai/**/*.js`，实际被 `db.collection(...)` 引用的集合：

| 集合 | 引用位置 |
|---|---|
| `users` | `index.js:195, 301, 348` |
| `apartments` | `index.js:356, 411, 459, 486; import-task.js:84, 147, 192; migrate.js:17` |
| `room_types` | `index.js:357, 411, 414; migrate.js:48` |
| `activities` | `index.js:358, 416, 486` |
| `service_orders` | `index.js:359`（注意：`ADMIN_COLLECTION_MAP.services` 映射到 `service_orders`，不是 `services`） |
| `borrow_items` | `index.js:360, 417` |
| `comments` | `index.js:361, 419, 518, 573, 585` |
| `users`（admin dataset） | `index.js:362` |
| `activity_registrations` | `index.js:416, 474, 680` |
| `borrow_requests` | `index.js:418, 595` |
| `comment_likes` | `index.js:419, 564, 581` |
| `favorites` | `index.js:412, 414, 539, 551` |
| `roommate_posts` | `index.js:638` |
| `import_tasks` | `import-task.js:53, 62, 112, 228, 279, 302, 319` |

**重要发现：`services` 集合从未被云函数直接读写。** `getAdminDataset("services")` 实际读的是 `service_orders`（订单表），不是 `services`（服务目录表）。`services` 集合在 `ALL_COLLECTIONS` 列表中但代码无实际引用。

### C. 微信云开发控制台已经创建的集合

> **无法确认**，本地代码无法访问云开发控制台。需要用户截图。

### D. 仍然缺少的集合

> **无法确认**，依赖 C 项。但根据 `initCloud` action（`index.js:136-169`），用户可在微信开发者工具云函数控制台手动调用一次 `initCloud`，它会自动创建全部 15 个集合并导入 apartments/room_types 种子数据。

### 集合清单表

| 集合 | 用途 | 代码是否读 | 代码是否写 | 是否已创建 | 需要的索引 | 权限规则状态 |
|---|---|---|---|---|---|---|
| `users` | 用户档案 + 管理员身份 | 是 | 是（loginUser/update） | 未知 | `openid` 唯一索引、`id` 索引 | 未知 |
| `apartments` | 公寓目录 | 是 | 是（migrate/import/saveAdminItem） | 未知 | `apartment_code` 唯一索引、`id` 索引 | 未知 |
| `room_types` | 户型目录 | 是 | 是（migrate/import/saveAdminItem） | 未知 | `(name, apartment_code)` 组合唯一索引、`apartment_code` 索引 | 未知 |
| `activities` | 活动目录 | 是 | 是（saveAdminItem/registerActivity 更新 current_count） | 未知 | `id` 索引 | 未知 |
| `services` | 服务目录（计划用） | **否**（代码实际读 `service_orders`） | 否 | 未知 | 无 | 未知 |
| `borrow_items` | 共享物品 | 是 | 是（createBorrowItem/saveAdminItem） | 未知 | `id` 索引、`owner_user_id` 索引 | 未知 |
| `borrow_requests` | 借用申请 | 是 | 是（createBorrowRequest） | 未知 | `item_id` 索引、`borrower_user_id` 索引 | 未知 |
| `comments` | 评论 | 是 | 是（submitComment/toggleCommentLike 更新） | 未知 | `(target_type, target_id)` 组合索引、`id` 索引 | 未知 |
| `comment_likes` | 评论点赞 | 是 | 是（toggleCommentLike） | 未知 | `(comment_id, user_id)` 组合唯一索引 | 未知 |
| `favorites` | 收藏 | 是 | 是（toggleFavorite） | 未知 | `(target_type, target_id, user_id)` 组合唯一索引 | 未知 |
| `activity_registrations` | 活动报名 | 是 | 是（registerActivity） | 未知 | `(activity_id, user_id)` 组合唯一索引 | 未知 |
| `service_orders` | 服务订单 | 是 | 是（createServiceOrder） | 未知 | `id` 索引、`user_id` 索引、`service_id` 索引 | 未知 |
| `roommate_posts` | 找室友帖子 | 是 | 是（createRoommatePost） | 未知 | `id` 索引、`user_id` 索引 | 未知 |
| `messages` | 消息 | **否**（云函数无 action 读写 `messages`） | 否 | 未知 | 无 | 未知 |
| `import_tasks` | CSV 导入任务 | 是 | 是（createImportTask 等） | 未知 | `task_id` 唯一索引、`target_type` 索引 | 未知 |

### 特别检查

| 检查项 | 结论 |
|---|---|
| `apartments` 实际记录数 | **未知**（需云端确认）。种子数据 `cloudfunctions/rencai/seed/apartments.json` 含 6 条（A001-A006） |
| `room_types` 实际记录数 | **未知**（需云端确认）。种子数据 `cloudfunctions/rencai/seed/room_types.json` 含 14 条 |
| `users` 实际记录数 | **未知**（需云端确认） |
| 公寓和户型关联字段 | **混用**：云函数 `confirmImport` 写 `apartment_code`（外键）+ `apartment_id`（云文档 `_id`）；mock-store 用 `apartment_id`（数字）。`queries.js` 读 mock 时用 `apartment_id`，云函数读云数据库时用 `apartment_code` |
| 是否存在关联字段混用 | **是**（见上） |
| 是否配置唯一性或组合索引 | **代码无索引创建逻辑**（`initCloud` 只 `createCollection`，不建索引）。需用户在云开发控制台手动建索引 |
| 数据库权限是否允许小程序前端直接写入 | **未知**（需用户在云开发控制台确认权限规则）。当前代码所有写操作都走云函数，但若权限规则设为"所有用户可读写"，恶意前端可绕过云函数直接写 |

---

## 5. 登录与权限完整链路

### 链路代码追踪

```
login-modal/index.js onGetPhoneNumber / onLogin
  → app.login(nickname, phone)              [miniprogram/app.js:132]
    → if (db.isCloudMode())
        → loginWithCloud(nickname, phone)    [app.js:161]
          → wx.login()                       [app.js:163]
            → wx.cloud.callFunction({
                name: "rencai",
                data: { action: "loginUser", code, nickname, phone }
              })                              [app.js:166-173]
              → cloudfunctions/rencai/index.js exports.main case "loginUser"  [index.js:695]
                → loginUser(wxContext.OPENID, nickname, phone)  [index.js:697]
                  → users 集合按 openid 查询       [index.js:198]
                  → resolveAdminRole(openid, existing, nickname, phone)  [index.js:216]
                  → 更新或新建用户记录             [index.js:226 / 258]
                  → 返回 safeUser（剥离 db.serverDate()）  [index.js:262-275]
                ← { ok: true, user, isNew }
              ← cfRes.result
            ← resolve({ ok: true, user, isNew })
          → applyLoginSuccess(openid, user, isNew)  [app.js:227]
            → globalData.openid/userInfo/userId/isLoggedIn/isAdmin
            → wx.setStorageSync("auth_info", { openid })
```

### 必答问题

| 问题 | 答案 |
|---|---|
| 当前登录是否已成功真机验证 | **无法确认**（需用户提供真机测试截图或云函数日志） |
| 云函数实际返回格式 | **代码已确认**：`{ ok: true, user, isNew }` 或 `{ ok: false, code, message }`（`index.js:237, 276, 189-193`）。新用户 `user` 对象已剥离 `db.serverDate()` 命令对象（`index.js:262-275`） |
| 新用户是否会重复创建 | **代码已确认不会**：`loginUser` 先按 `openid` 查询，已存在则 update，不存在才 add（`index.js:198, 224-258`） |
| 登录状态重新打开后能否恢复 | **代码已确认能**：`app.restoreLogin()` 在 `onLaunch` 调用（`app.js:49`），云模式下调 `restoreLoginWithCloud` → `getUserByOpenid` 云函数查询（`app.js:97-127`） |
| 云模式失败后是否会降级到 mock | **代码已确认不会**：`loginWithCloud` 所有失败路径都显式 `resolve({ ok: false, code, message })`，不再调 `loginWithMock`（`app.js:161-223`，与旧版 `login` 的 diff 对比确认） |
| OPENID 来自哪里 | **代码已确认**：云函数 `cloud.getWXContext().OPENID`（`index.js:691, 697, 700`），**不信任前端传入的 openid 参数**（`index.js:696` 注释明确） |
| 前端是否能传入或伪造 openid/userId | **loginUser/getUserByOpenid**：不能（用 `wxContext.OPENID`）。**但其他写操作（saveAdminItem, toggleFavorite, submitComment 等）的 `userId` 参数完全由前端传入，云函数不校验该 userId 是否属于当前 OPENID**（见下方权限漏洞） |
| 管理员身份根据什么判断 | **代码已确认**：`resolveAdminRole(openid, existing, nickname, phone)`（`index.js:77-91`）优先级：`ADMIN_OPENIDS` 白名单 → users.role 持久化字段 → 兜底 `nickname="晓邱" && phone="1773xxxxxxx"`（硬编码完整手机号，`index.js:54-55`） |
| 普通用户是否能直接调用管理员 action | **能！详见权限漏洞** |
| 退出登录是否真正清除登录状态 | **代码已确认是**：`app.logout()` 清空 5 个 globalData 字段 + `wx.removeStorageSync("auth_info")`（`app.js:241-252`） |
| "退出小程序"是否还调用 `wx.exitMiniProgram` | **代码已确认否**：`profile-edit/index.js:113-117` `exitApp()` 已废弃，改为调 `logoutAccount()`（弹"退出登录"确认框 → `app.logout()` → `switchTab` 回 profile） |
| 个人信息页面是否使用真实用户数据 | **否**：`profile-edit/index.js:5-12` 整个 `form` 硬编码 mock 数据，`onLoad/onShow` 不读取 `app.globalData.userInfo` |

### 权限漏洞清单

| 漏洞 | 证据 | 风险 |
|---|---|---|
| **管理员 CRUD action 无服务端鉴权** | `cloudfunctions/rencai/index.js:705-716` 的 `saveAdminItem/deleteAdminItem/updateAdminItemStatus/importAdminItems/getAdminDataset/getNextAdminId` 均不校验调用者 role。前端 `admin/index.js:689` 仅 `if (!app.globalData.isAdmin)` 客户端拦截，可被任意用户用 `wx.cloud.callFunction` 直接绕过 | **P0 安全风险**：任何登录用户可增删改全部业务数据 |
| **导入导出 action 无服务端鉴权** | `index.js:739-755` 的 `createImportTask/previewImport/confirmImport/getImportTask/listImportTasks/exportAdminItems` 均不校验 role | P0 |
| **`ADMIN_OPENIDS` 未配置，用 nickname+phone 兜底** | `index.js:54-55` + `env.js:25` 空数组 | 任何用户输入昵称"晓邱"+ 该硬编码手机号即获管理员权限（手机号已脱敏，但代码里是明文） |
| **写操作的 `userId` 由前端传入，无 OPENID 校验** | 如 `toggleFavorite(params)` 用 `params.userId`（`index.js:538`），不校验是否属于当前 OPENID | 用户可伪造任意 userId 收藏/评论/报名，绕过身份 |
| **`messages` 集合无云函数 action** | `index.js` 无 `getMessages` 等 action，`messages` 页面读 mock-store | 消息功能云端不可用 |

---

## 6. 页面数据来源清单

### 逐页数据来源

| 页面 | 读取来源 | 写入来源 | cloud/mock/混合 | 是否真实持久化 | 当前问题 |
|---|---|---|---|---|---|
| 首页 `pages/index` | `queries.getHomeApartmentCards`（mock） | 无 | **mock** | 否 | 云模式下仍读 mock |
| 公寓详情 `pages/apartment-detail` | `apartments.getApartmentById`→`queries`（mock） | 图片/经纬度：`db.saveAdminItem`（cloud）；评论/收藏/点赞：`queries`（mock） | **混合** | 部分 | 评论收藏点赞不落云 |
| 户型详情 `pages/room-detail` | `apartments.getRoomById`→`queries`（mock） | 图片：`db.saveAdminItem`（cloud）；评论/收藏/点赞：`queries`（mock） | **混合** | 部分 | 同上 |
| 地图 `pages/map` | `queries.getApartments`（mock） | 无 | **mock** | 否 | 云模式下地图数据不来自云端 |
| 活动列表 `pages/activity-list` | `business.getActivities`→`queries`（mock） | 无 | **mock** | 否 | — |
| 活动详情 `pages/activity-detail` | `business.getActivityById`（mock） | `queries.registerActivityForUser/isActivityRegisteredByUser`（mock） | **mock** | 否 | 报名不落云 |
| 活动发布 `pages/activity-publish` | 未读 | 未确认（需进一步读文件） | 未知 | 未知 | 待查 |
| 服务列表 `pages/service-list` | `business.getServices`（mock） | 无 | **mock** | 否 | — |
| 服务详情 `pages/service-detail` | `business.getServiceById`（mock） | `queries.createServiceOrderForUser`（mock） | **mock** | 否 | 订单不落云 |
| 服务 tab `pages/service` | `business.getActivities/getServices`（mock） | 无 | **mock** | 否 | — |
| 借物列表 `pages/borrow` | `business.getBorrowItems`（mock） | 无 | **mock** | 否 | — |
| 物品详情 `pages/item-detail` | `business.getBorrowItemById`（mock） | `queries.createBorrowRequestForUser`（mock） | **mock** | 否 | 借用申请不落云 |
| 物品发布 `pages/item-publish` | `business.borrowCategories`（mock） | `queries.createBorrowItemForUser`（mock） | **mock** | 否 | 新物品不落云 |
| 室友 `pages/roommate` | `queries.getRoommateData`（mock） | `queries.createRoommatePostForUser`（mock） | **mock** | 否 | 帖子不落云 |
| 收藏 `pages/favorites` | `queries.getFavoriteRecords`（mock） | 无 | **mock** | 否 | 收藏列表不来自云端 |
| 我的评论 `pages/my-comments` | `queries.getMyComments`（mock） | 无 | **mock** | 否 | — |
| 消息 `pages/messages` | `business.messages`→`queries.getMessages`（mock） | 无 | **mock** | 否 | 云端无 messages action |
| 个人中心 `pages/profile` | `app.globalData`（登录态真实） | 无 | 混合 | 部分 | `getProfileBadges` 用固定 `u_current`，徽标数字是 mock 管理员的数据（`profile/index.js:99`） |
| 个人信息编辑 `pages/profile-edit` | 硬编码 mock form | `saveProfile()` 假成功 / `changeAvatar()` 假成功 / `toggleStatus()` 假成功 | **mock** | 否 | 整页是假数据假保存 |
| 管理后台 `pages/admin` | `queries.getAdminDataset`（mock） | `queries.saveAdminRuntimeItem/deleteAdminRuntimeItem/updateAdminRuntimeStatus/importAdminRuntimeItems`（mock）；CSV 导入导出：`db.*`（cloud） | **混合** | 部分 | 列表读 mock，CSV 走云端，导致列表与云端数据不一致 |
| 导入预览 `pages/admin/import-preview` | `db.getImportTask`（cloud） | `db.confirmImport`（cloud） | **cloud** | 是 | 正确 |
| 导入历史 `pages/admin/import-history` | `db.listImportTasks`（cloud） | 无 | **cloud** | 是 | 正确 |

### 直接引用 `tables.js` 的页面

**无**（grep 扫描 `pages/**` 无 `require("...tables")` 命中）。但 `tables.js` 被 `mock-store.js` 间接引用（`mock-store.js:1`），所以所有用 `queries.js` 的页面都间接读 `tables.js`。

### 直接引用 `queries.js` 的页面（14 处）

`profile-edit`, `favorites`, `index`, `room-detail`, `item-publish`, `apartment-detail`, `map`, `roommate`, `my-comments`, `service-detail`, `activity-detail`, `item-detail`, `profile`, `admin`

### 直接引用 `mock-store.js` 的页面

**无**（`mock-store` 只被 `db.js` 和 `queries.js` 引用）。

### 直接引用 `business.js` 的页面（10 处）

`messages`, `service`, `service-detail`, `activity-list`, `borrow`, `profile`, `item-detail`, `item-publish`, `service-list`, `activity-detail`

### 核心结论

**`DATA_MODE = "cloud"` 配置只在 `app.js` 登录链路和 `admin` 的 CSV 导入导出链路生效。其他 14 个页面的读/写仍走 `queries.js` → `mock-store.js`（内存 mock）。** 这意味着即使云端数据库有真实数据，用户在小程序里看到的公寓/户型/活动/服务/借物/室友/收藏/评论/消息仍然是 mock 数据，且用户提交的收藏/评论/报名/订单/帖子都不会落云。

---

## 7. 云函数 action 清单

来源：`cloudfunctions/rencai/index.js:689-764` 的 `exports.main` switch

| action | 用途 | 调用页面 | 使用集合 | 是否鉴权 | 身份是否来自 OPENID | 当前风险 |
|---|---|---|---|---|---|---|
| `loginUser` | 登录/注册 | login-modal | users | 否（公开） | 是（`wxContext.OPENID`） | 低 |
| `getUserByOpenid` | 恢复登录态 | app.js restoreLogin | users | 否 | 是 | 低 |
| `getPhoneByCode` | code 换手机号 | login-modal | 无（调 openapi） | 否 | 是（openapi） | 低 |
| `isUserAdmin` | 查是否管理员 | 未发现调用方 | users | 否 | 否（前端传 userId） | 中 |
| `getAdminDataset` | 管理员列表 | admin | 7 个集合 | **否** | 否 | **P0** |
| `getNextAdminId` | 下一个 ID | admin | 7 个集合 | **否** | 否 | **P0** |
| `saveAdminItem` | 新增/编辑 | admin | 7 个集合 | **否** | 否 | **P0** |
| `deleteAdminItem` | 删除（带级联） | admin | 7 个集合 + 关联集合 | **否** | 否 | **P0** |
| `updateAdminItemStatus` | 改状态 | admin | 7 个集合 | **否** | 否 | **P0** |
| `importAdminItems` | 旧版批量导入 | admin（已废弃，改用任务制） | 7 个集合 | **否** | 否 | **P0** |
| `registerActivity` | 活动报名 | activity-detail（实际走 mock，未调此） | activity_registrations, activities | 否 | 否（前端传 userId） | 中 |
| `submitComment` | 发评论 | apartment-detail/room-detail（实际走 mock） | comments | 否 | 否 | 中 |
| `toggleFavorite` | 切换收藏 | 同上（实际走 mock） | favorites | 否 | 否 | 中 |
| `toggleCommentLike` | 切换点赞 | 同上（实际走 mock） | comment_likes, comments | 否 | 否 | 中 |
| `createBorrowRequest` | 借用申请 | item-detail（实际走 mock） | borrow_requests | 否 | 否 | 中 |
| `createBorrowItem` | 发布物品 | item-publish（实际走 mock） | borrow_items | 否 | 否 | 中 |
| `createRoommatePost` | 发布帖子 | roommate（实际走 mock） | roommate_posts | 否 | 否 | 中 |
| `createServiceOrder` | 下服务订单 | service-detail（实际走 mock） | service_orders | 否 | 否 | 中 |
| `isActivityRegistered` | 查是否已报名 | activity-detail（实际走 mock） | activity_registrations | 否 | 否 | 低 |
| `migrateApartments` | 导入公寓种子 | initCloud 内部调用 | apartments | 否 | — | 低（需手动触发） |
| `migrateRoomTypes` | 导入户型种子 | initCloud 内部调用 | room_types | 否 | — | 低 |
| `createImportTask` | 创建导入任务 | admin importCsvFile | import_tasks | **否** | 否（前端传 operator） | **P0** |
| `previewImport` | 预览导入 | admin importCsvFile | import_tasks, apartments, room_types | **否** | 否 | **P0** |
| `confirmImport` | 确认写入 | import-preview | import_tasks, apartments, room_types | **否** | 否 | **P0** |
| `getImportTask` | 查任务 | import-preview | import_tasks | 否 | 否 | 中 |
| `listImportTasks` | 任务列表 | import-history | import_tasks | 否 | 否 | 中 |
| `exportAdminItems` | 导出 | admin exportData/exportFiltered | apartments, room_types | **否** | 否 | **P0**（数据可被任意用户导出） |
| `initCloud` | 一键建集合+导种子 | 需手动触发 | 全部 15 个 | **否** | 否 | **P0**（任意用户可重置数据库） |

### initCloud 是否存在

**存在**（`index.js:136-169` 函数定义，`index.js:756-757` exports.main case）。可以调用。

### 重点检查结论

- `loginUser`：服务端权威，身份安全
- `getUserByOpenid`：服务端权威，身份安全
- 管理员 CRUD：**无服务端鉴权**，前端 `isAdmin` 拦截可绕过
- `migrateApartments/migrateRoomTypes`：无鉴权，任意用户可触发
- `createImportTask/previewImport/confirmImport`：无鉴权
- `exportAdminItems`：无鉴权，任意用户可导出全部公寓/户型数据

---

## 8. 最近登录问题的真实结论

### 根因（代码已确认）

1. **旧版 `app.js` 在云函数失败时静默降级到 mock**：导致用户授权手机号后仍走 mock，前端显示"已登录"但云端无 user 记录
2. **旧版云函数返回 `db.serverDate()` 命令对象**：`wx.cloud.callFunction` 序列化失败，前端拿到 `result: undefined`
3. **`envList.js` 曾为空数组**：云开发未初始化
4. **`config.json` 曾缺 `phonenumber.getPhoneNumber` 权限**：`getPhoneByCode` 失败
5. **`wx-server-sdk` 版本过旧**：`~2.6.3` 不支持 `phonenumber.getPhoneNumber`

### 修改的文件（未提交）

| 文件 | 修改内容 |
|---|---|
| `cloudfunctions/rencai/index.js` | loginUser 写入后用 `safeUser`（剥离 `db.serverDate()`）返回；新增 `getPhoneByCode`；新增脱敏日志；统一错误格式 `{ ok, code, message }` |
| `cloudfunctions/rencai/config.json` | 新增 `permissions.openapi: ["phonenumber.getPhoneNumber"]` |
| `cloudfunctions/rencai/package.json` | `wx-server-sdk` 改为 `"latest"` |
| `miniprogram/envList.js` | 填入云环境 ID（值脱敏） |
| `miniprogram/app.js` | 移除云失败降级 mock；`restoreLoginWithCloud`；脱敏日志；统一 Promise 返回 |
| `miniprogram/components/login-modal/index.js` | `mapLoginErrorToToast` 错误码映射 |

### 返回格式修复前后对比

| 版本 | 失败返回 | 成功返回 |
|---|---|---|
| 旧版（已废弃） | `{ ok: false, error: "..." }` 或 `{ ok: false, reason: "login_failed" }` | `{ ok: true, user: {...含 db.serverDate()...} }` → 前端序列化失败拿到 undefined |
| 当前代码 | `{ ok: false, code: "users_collection_missing", message: "用户数据库尚未初始化..." }` | `{ ok: true, user: safeUser, isNew: true }`（safeUser 不含 `db.serverDate()`） |

### db.serverDate() 序列化问题处理

**已处理**（`index.js:262-275`）。新用户用 `safeUser` 对象返回，不含 `created_at/updated_at` 命令对象。已有用户 update 后用 `{ ...existing, nickname, phone, role, ... }` 拼装返回（`index.js:236`），`existing` 来自数据库查询，`created_at/updated_at` 是数据库服务端时间戳对象，理论上 `wx.cloud.callFunction` 能正常序列化（因为它已是数据库回传的普通对象，不是命令对象）。**但此处仍有潜在风险**：若 `existing` 含 `db.serverDate()` 字段（理论上不会，因为查询返回的是已填充的时间戳），序列化可能异常。建议用 `safeUser` 模式统一处理。

### 是否重新部署云函数

**无法确认**。本地代码已改，但 33 个未 push 提交 + 7 个未提交改动表明云函数的线上版本可能是旧版。**必须用户在微信开发者工具右键 `cloudfunctions/rencai` → "上传并部署：云端安装依赖" 后才能真正生效。**

### users 集合是否产生真实用户记录

**无法确认**。需用户在云开发控制台查看 `users` 集合记录数。

### 登录成功是否只是开发者工具成功

**无法确认**。代码层面登录链路正确，但真机/预览是否成功需用户测试。

### 当前残留的登录风险

1. **`ADMIN_OPENIDS` 为空**，管理员判定回退到 nickname+phone 兜底，任何用户输入特定昵称+手机号即获管理员权限
2. **`users` 集合是否已创建未知**，若未创建，首次登录会返回 `users_collection_missing`
3. **云函数是否已部署最新版未知**，若线上是旧版，仍会返回 `db.serverDate()` 导致序列化失败
4. **profile-edit 仍用硬编码 mock**，登录后个人信息页不显示真实用户数据

---

## 9. 个人信息与退出功能

| 检查项 | 结论 | 证据 |
|---|---|---|
| 昵称/手机号/公寓/楼栋是否硬编码 | **是** | `profile-edit/index.js:5-12` `form` 全硬编码 |
| 保存按钮是否真正写入 users | **否** | `saveProfile()` 仅 `showToast("个人信息已保存")`，无任何 `db.*` 或 `store.*` 调用（`profile-edit/index.js:109-111`） |
| 更换头像是否真正上传 | **否** | `changeAvatar()` 仅 `showToast("静态版暂不上传头像")`（`profile-edit/index.js:33`） |
| 入住状态是否持久化 | **否** | `toggleStatus()` 仅 `setData` + `showToast`，不落云也不落本地存储（`profile-edit/index.js:100-107`） |
| 手机号是否脱敏显示 | **否** | 直接显示硬编码 `138****8888`（已是脱敏格式，但不是真实用户手机号） |
| 退出按钮是退出登录还是退出小程序 | **退出登录** | `exitApp()` 已废弃，改为调 `logoutAccount()`（`profile-edit/index.js:113-117`） |
| 是否调用 `app.logout()` | **是** | `profile-edit/index.js:130` `app.logout()` |
| 是否调用 `wx.exitMiniProgram()` | **否** | 已移除（diff 确认） |
| 退出后是否回到个人中心并重新显示游客状态 | **是** | `wx.switchTab({ url: "/pages/profile/index" })`（`profile-edit/index.js:133`），`profile/index.js syncUserState` 在 `onShow` 触发会读 `app.globalData.isLoggedIn=false` 显示游客态 |

### 个人信息页问题

- **整页是假数据假保存**：登录后进入个人信息编辑页，看到的是硬编码 mock，不是当前登录用户的真实信息
- **保存按钮不写任何存储**：用户修改昵称/手机号/楼栋后点保存，仅 toast 提示，数据丢失
- **头像更换是空操作**

---

## 10. 导入导出状态

逐项检查最新代码（不依赖旧日志）：

| 检查项 | 结论 | 证据 |
|---|---|---|
| `getImportTask` 是否保留 `preview_data` | **是** | `import-task.js:307-312` 只剥离 `csv_content`，保留 `preview_data`（截断到前 20 条） |
| `previewImport` 是否写 `success_count` | **是** | `import-task.js:116` `success_count: previewData.length` |
| `chooseLocation` 是否有 fail/cancel 处理 | **是** | `apartment-detail/index.js:105-108` `fail: (err) => console.log("[chooseLocation] cancel or fail:", ...)` |
| 导出是否支持超过 100 条 | **是** | `index.js:113-130` `getAll` 分页拉取，单集合最多 5000 条 |
| `room_types` 是否支持去重更新 | **是** | `import-task.js:203-205` 按 `(name, apartment_code)` 查重，命中走 update 路径 |
| `confirmImport` 重复点击是否会重复导入 | **否（有保护）** | `import-preview/index.js:38` `if (this.data.importing) return;` + `setData({ importing: true })`。**但云函数侧 `confirmImport` 不校验任务 status**，若绕过前端直接调云函数会重复写入（update 路径覆盖，add 路径新增重复） |
| CSV 大小和行数限制 | 2MB（`admin/index.js:985` `file.size > 2 * 1024 * 1024`） | 仅公寓/户型走任务制时有此限制；其他类型无显式限制 |
| 导入接口是否有管理员权限 | **否** | 云函数 `createImportTask/previewImport/confirmImport` 均不校验 role（见第 7 节） |
| 地址转经纬度是否腾讯→高德→失败兜底 | **是** | `geocode.js:91-106` `geocodeAddress`：腾讯 → 高德 → `{ lng:0, lat:0, source:"failed" }` |
| 6 个公寓和 14 个户型是否已实际迁移 | **无法确认** | 种子数据存在（`seed/apartments.json` 6 条，`seed/room_types.json` 14 条），但云端是否有记录需用户在云开发控制台确认 |

---

## 11. 当前控制台问题

> **本节无法提供真实控制台截图，只能根据代码推测可能出现的控制台问题。**

### 推测的真正功能错误

| 问题 | 证据 | 是否影响登录 | 是否影响上线 | 修复优先级 | 可能根因 |
|---|---|---|---|---|---|
| 云函数未部署最新版 → 登录返回 undefined | 33 个未 push 提交 + 7 个未提交改动 | 是 | 是 | P0 | 用户未在微信开发者工具重新部署 `rencai` |
| `users` 集合未创建 → 登录返回 `users_collection_missing` | 云端状态未知 | 是 | 是 | P0 | 用户未调 `initCloud` 或手动建集合 |
| `ADMIN_OPENIDS` 为空 → 管理员判定走兜底 | `env.js:25` | 否 | 是（安全） | P0 | 用户未填真实 OPENID |
| profile-edit 整页假数据 | `profile-edit/index.js:5-12` | 否 | 是（体验） | P1 | 未接入真实用户数据 |
| 多数页面走 mock 不走云端 | 见第 6 节 | 否 | 是（功能） | P1 | `queries.js` 未改造为通过 `db.js` 调用云函数 |

### 资源缺失

| 问题 | 证据 |
|---|---|
| 无明显缺失的图片资源 | tabBar 图标 10/10 存在，页面引用的 SVG 图标在 `assets/icons/` 全部存在 |
| 云函数 `node_modules` 未安装 | `cloudfunctions/rencai/node_modules/` 不存在（已 gitignore），本地无法运行云函数调试 |

### WXSS 警告

**未发现**（无 wxss-lint 工具，人工抽查未发现明显问题）

### 热重载/开发者工具警告

**无法确认**（需用户在开发者工具实际运行后截图）

### 不影响功能的提示

- `app.js:65` `console.warn("[cloud] 未配置云环境 ID，云能力不可用")` —— 仅在 `envList` 为空时触发，当前已配置，不会出现
- `app.js:113` `console.warn("[restoreLogin] 恢复失败:", ...)` —— 缓存 openid 失效时出现，属正常
- `index.js:87` `console.warn("[rencai] ADMIN_OPENIDS 未配置...")` —— 管理员兜底时出现，需关注

---

## 12. 测试结果

> **只记录实际跑过的测试。未跑过的一律写"未测试"。**

| 测试项 | 开发者工具 | 预览二维码 | 真机 | 云端数据确认 | 结果 |
|---|---|---|---|---|---|
| 游客进入 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 普通用户登录 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 关闭后恢复登录 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 退出登录 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 管理员识别 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 首页公寓加载 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 公寓与户型关联 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 收藏 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 评论 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 活动报名 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 借物发布和申请 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 室友发布 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 服务订单 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 管理员 CRUD | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| CSV 导入导出 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 地理编码 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |
| 图片上传 | 未测试 | 未测试 | 未测试 | 未测试 | 未测试 |

### 实际跑过的静态检查

| 检查项 | 结果 |
|---|---|
| 所有 JS 文件 `node --check` 语法 | **通过**（0 失败） |
| 所有 JSON 文件 `JSON.parse` | **通过**（0 失败） |
| app.json 页面路径完整性 | **通过**（24/24） |
| tabBar 图标完整性 | **通过**（10/10） |
| 种子数据计数 | 公寓 6 条（A001-A006），户型 14 条 |

**结论：本次只做了静态检查，未做任何运行时测试。所有运行时行为均需用户在微信开发者工具验证。**

---

## 13. 当前问题优先级

### P0：阻止继续开发或存在安全风险

#### P0-1 管理员 action 无服务端鉴权
- **证据**：`cloudfunctions/rencai/index.js:705-716, 739-755, 756-757`（saveAdminItem/deleteAdminItem/updateAdminItemStatus/importAdminItems/createImportTask/previewImport/confirmImport/exportAdminItems/initCloud 均无 role 校验）
- **影响**：任意登录用户可通过 `wx.cloud.callFunction` 直接调用，增删改全部业务数据，导出全部公寓/户型，甚至调 `initCloud` 重置数据库
- **建议修复方向**：在 `exports.main` 入口对管理员 action 统一校验 `wxContext.OPENID` 是否在 `ADMIN_OPENIDS`，或查 `users` 集合 role 字段
- **是否需要重新部署云函数**：是
- **是否需要用户在微信开发者工具操作**：是（重新部署）

#### P0-2 `ADMIN_OPENIDS` 未配置 + 管理员手机号硬编码
- **证据**：`cloudfunctions/rencai/env.js:25` 空数组；`cloudfunctions/rencai/index.js:54-55` 硬编码 `ADMIN_NICKNAME_FALLBACK="晓邱"` + `ADMIN_PHONE_FALLBACK="1773xxxxxxx"`（完整手机号）
- **影响**：任何用户输入该昵称+手机号即获管理员权限；硬编码手机号是敏感信息泄露
- **建议修复方向**：用户首次登录后在云函数日志查看自己的 OPENID，填入 `env.js:25` 的 `ADMIN_OPENIDS` 数组，重新部署；移除硬编码手机号兜底
- **是否需要重新部署云函数**：是
- **是否需要用户在微信开发者工具操作**：是（查 OPENID + 改 env.js + 重新部署）

#### P0-3 云函数线上版本是否最新未知
- **证据**：本地 33 个未 push 提交 + 7 个未提交改动，云函数线上版本无法确认
- **影响**：若线上是旧版，登录仍会返回 `db.serverDate()` 导致序列化失败
- **建议修复方向**：用户在微信开发者工具右键 `cloudfunctions/rencai` → "上传并部署：云端安装依赖"
- **是否需要重新部署云函数**：是
- **是否需要用户在微信开发者工具操作**：是

#### P0-4 `users` 等集合是否已创建未知
- **证据**：云端状态无法从代码确认
- **影响**：若 `users` 未创建，登录直接返回 `users_collection_missing`
- **建议修复方向**：用户在微信开发者工具云开发控制台调用一次 `initCloud` action（或手动创建 15 个集合）
- **是否需要重新部署云函数**：否（`initCloud` 已存在）
- **是否需要用户在微信开发者工具操作**：是

### P1：阻止主要功能正常使用

#### P1-1 多数页面绕过 `db.js` 走 mock
- **证据**：见第 6 节，14 个页面直接 `require("../../data/queries")`，`queries.js` 内部用 `tables`（mock-store 快照）
- **影响**：云模式下首页/详情/地图/活动/服务/借物/室友/收藏/评论/消息仍读 mock；用户提交的收藏/评论/报名/订单/帖子不落云
- **建议修复方向**：将 `queries.js` 的所有读函数改为通过 `db.js` 调用云函数；将 `queries.js` 的写函数（`submitUserComment`, `toggleFavoriteForUser` 等）改为通过 `db.js` 调用云函数
- **是否需要重新部署云函数**：否（云函数 action 已齐全）
- **是否需要用户在微信开发者工具操作**：否（纯前端改造）

#### P1-2 profile-edit 整页假数据假保存
- **证据**：`profile-edit/index.js:5-12` 硬编码 form；`saveProfile()` 仅 toast
- **影响**：用户修改个人信息后数据丢失
- **建议修复方向**：`onLoad` 读 `app.globalData.userInfo` 填表单；`saveProfile` 调 `db.updateUserProfile` 云函数更新 `users` 集合
- **是否需要重新部署云函数**：是（需新增 `updateUserProfile` action）
- **是否需要用户在微信开发者工具操作**：是（重新部署）

#### P1-3 profile 徽标用固定 `u_current`
- **证据**：`profile/index.js:99` `const badges = getProfileBadges();`（未传 userId，默认 `CURRENT_USER_ID="u_current"`）
- **影响**：所有用户看到的徽标数字都是 mock 管理员的数据
- **建议修复方向**：`getProfileBadges(app.globalData.userId)`，并改为通过 `db.js` 走云端
- **是否需要重新部署云函数**：是（需新增 `getProfileBadges` action）
- **是否需要用户在微信开发者工具操作**：是

#### P1-4 `messages` 集合无云函数 action
- **证据**：`cloudfunctions/rencai/index.js` 无 `getMessages` 等 action
- **影响**：消息功能云端不可用
- **建议修复方向**：新增 `getMessages` action 读 `messages` 集合
- **是否需要重新部署云函数**：是
- **是否需要用户在微信开发者工具操作**：是

### P2：影响体验但可继续开发

#### P2-1 `services` 集合实际未被使用
- **证据**：`ADMIN_COLLECTION_MAP.services` 映射到 `service_orders`（`index.js:359`），`services` 集合在 `ALL_COLLECTIONS` 但无代码引用
- **影响**：服务目录数据无法云端持久化
- **建议修复方向**：补充 `services` 集合的 CRUD action，或在 `ALL_COLLECTIONS` 移除
- **是否需要重新部署云函数**：是

#### P2-2 `uploadCloudFunction.sh` 只部署 `quickstartFunctions`
- **证据**：`uploadCloudFunction.sh:1` `--n quickstartFunctions`
- **影响**：脚本无法部署业务云函数 `rencai`
- **建议修复方向**：改为 `--n rencai`
- **是否需要重新部署云函数**：否（脚本仅影响部署流程）
- **是否需要用户在微信开发者工具操作**：否

#### P2-3 README.md 仍是云开发默认模板
- **证据**：`README.md` 内容是"云开发 quickstart"，未更新为项目实际说明
- **影响**：交接时误导
- **建议修复方向**：重写 README

#### P2-4 关联字段混用 `apartment_id`（数字）与 `apartment_code`（字符串）与云文档 `_id`
- **证据**：`import-task.js:210` 写 `apartment_id: apartment._id`（云文档 _id）；mock-store 用 `apartment_id`（数字 id）；`queries.js:54-57` 用 `room.apartment_id === numericApartmentId`
- **影响**：云端导入的户型 `apartment_id` 是 `_id` 字符串，mock 是数字，查询逻辑不一致
- **建议修复方向**：统一用 `apartment_code` 作为外键

### P3：后续优化

- 云函数无单元测试
- 数据库无索引创建逻辑（`initCloud` 只建集合）
- `confirmImport` 云函数侧不校验任务 status，可能重复导入
- `getPhoneByCode` 失败时只返回 `{ ok: false, error }`，未统一为 `{ ok, code, message }` 格式
- `app.js` 登录日志用 `console.error` 打印正常返回（`app.js:176`），应改为 `console.log`

---

## 14. 推荐的下一步

只推荐最优先的 3 个开发任务：

### 任务 1：部署云函数 + 初始化云端集合 + 配置管理员 OPENID

- **目标**：让登录链路真正在云端跑通
- **修改范围**：无代码修改，纯操作
- **前置条件**：
  1. 用户在微信开发者工具右键 `cloudfunctions/rencai` → "上传并部署：云端安装依赖"
  2. 部署后在云开发控制台云函数测试面板，event 填 `{ "action": "initCloud" }` 触发一次
  3. 用真实管理员账号登录一次，在云函数日志查看打印的 OPENID（已脱敏为 `oXXXX...XXXX` 格式）
  4. 将该 OPENID 填入 `cloudfunctions/rencai/env.js:25` 的 `ADMIN_OPENIDS` 数组
  5. 移除 `index.js:54-55` 的硬编码手机号兜底（或保留但加 warning）
  6. 重新部署云函数
- **验收标准**：
  - 普通用户登录后 `users` 集合产生真实记录
  - 非管理员用户无法进入 `pages/admin`
  - 云函数日志显示 `[rencai] loginUser openid(脱敏): oXXX...XXX role: tenant`
- **是否需要部署云函数**：是（2 次）
- **用户需要配合的操作**：见前置条件

### 任务 2：给管理员 action 加服务端鉴权

- **目标**：堵住 P0-1 安全漏洞
- **修改范围**：`cloudfunctions/rencai/index.js` 的 `exports.main` 入口
- **前置条件**：任务 1 完成（`ADMIN_OPENIDS` 已配置）
- **验收标准**：
  - 非管理员用户调 `saveAdminItem` 返回 `{ ok: false, code: "forbidden" }`
  - 管理员用户调 `saveAdminItem` 正常
- **是否需要部署云函数**：是
- **用户需要配合的操作**：重新部署云函数 + 测试

### 任务 3：改造 `queries.js` 让所有页面走云端

- **目标**：让首页/详情/地图/活动/服务/借物/室友/收藏/评论/消息真正读写云数据库
- **修改范围**：
  - `miniprogram/data/queries.js`：所有读函数改为 async，通过 `db.js` 调用云函数
  - `miniprogram/data/db.js`：补充缺失的云函数 action 封装（如 `getApartments`, `getActivities`, `getServices`, `getBorrowItems`, `getRoommateData`, `getFavoriteRecords`, `getMyComments`, `getMessages`）
  - `cloudfunctions/rencai/index.js`：补充对应的云函数 action
  - 所有页面：将同步调用改为 `await`
- **前置条件**：任务 1 完成（云端集合已建 + 种子已导）
- **验收标准**：
  - 首页显示云端真实公寓数据
  - 收藏/评论/报名/订单/帖子落云
  - 管理员在 admin 页面 CRUD 直接反映到云端
- **是否需要部署云函数**：是（新增多个 action）
- **用户需要配合的操作**：重新部署云函数 + 逐页测试

---

## 15. 仍需用户提供的信息

| 项 | 获取方式 |
|---|---|
| `rencai` 云函数最后部署时间 | 微信开发者工具 → 云开发 → 云函数 → `rencai` → 日志 |
| 云函数最近一次 `loginUser` 调用日志 | 同上，看日志面板 |
| 云函数是否有报错 | 同上 |
| 云数据库集合列表 | 微信开发者工具 → 云开发 → 数据库 → 集合列表截图 |
| `users` 集合记录数 | 数据库 → `users` 集合 → 计数 |
| `apartments` 集合记录数 | 数据库 → `apartments` 集合 → 计数 |
| `room_types` 集合记录数 | 数据库 → `room_types` 集合 → 计数 |
| 数据库权限规则 | 数据库 → 每个集合 → 权限设置截图 |
| 是否已调用过 `initCloud` | 数据库是否有 `import_tasks` 集合 + `apartments` 是否有 6 条记录 |
| 真机测试结果 | 预览二维码 → 真机扫码 → 登录 → 截图 |
| 小程序主体类型和服务类目 | 微信公众平台 → 小程序 → 设置 → 基本设置 |
| 当前管理员账号的 OPENID | 登录后看云函数日志 `[rencai] loginUser openid(脱敏): oXXXX...XXXX`（需用户提供完整 OPENID 用于配置 `ADMIN_OPENIDS`） |

---

## 交接摘要

1. **代码层面登录链路已正确改造**：云函数用 `wxContext.OPENID`，前端不降级 mock，`safeUser` 剥离 `db.serverDate()`，错误格式统一为 `{ ok, code, message }`。
2. **但云函数线上版本是否最新未知**：本地 33 个未 push 提交 + 7 个未提交改动，必须用户重新部署 `rencai` 才能生效。
3. **云端集合是否已创建未知**：需用户调一次 `initCloud` 或手动建 15 个集合。
4. **管理员鉴权完全缺失**：所有管理员 action 无服务端 role 校验，前端 `isAdmin` 拦截可绕过，是 P0 安全漏洞。
5. **`ADMIN_OPENIDS` 未配置**：管理员判定回退到硬编码 nickname+phone，任何用户输入特定组合即获管理员权限。
6. **多数页面绕过 `db.js` 走 mock**：14 个页面直接 `require("queries")`，云模式下仍读 mock-store 内存数据，用户提交的收藏/评论/报名/订单/帖子不落云。
7. **profile-edit 整页假数据假保存**：登录后个人信息编辑页显示硬编码 mock，保存按钮不写任何存储。
8. **profile 徽标用固定 `u_current`**：所有用户看到的徽标数字都是 mock 管理员的数据。
9. **`messages` 集合无云函数 action**：消息功能云端不可用。
10. **`services` 集合未被代码引用**：`ADMIN_COLLECTION_MAP.services` 实际映射到 `service_orders`。
11. **CSV 导入导出链路代码完整**：任务制流程、预览、去重、地理编码二级兜底、BOM 处理均正确实现，是少数真正云端的链路。
12. **静态检查全部通过**：JS 语法、JSON 解析、页面路径、tabBar 图标均无错误。
13. **运行时测试全部未做**：本次只做静态审查，所有功能需用户在微信开发者工具验证。
14. **最危险的三个问题**：① 云函数线上版本未知 ② 管理员 action 无鉴权 ③ 多数页面走 mock 不走云端。
15. **下一步第一件事**：用户在微信开发者工具重新部署 `rencai` 云函数 → 调一次 `initCloud` → 用真实账号登录查看 OPENID → 填入 `ADMIN_OPENIDS` → 再部署一次。这步完成后才能判断登录是否真正跑通。

===== END PROJECT HANDOFF =====
