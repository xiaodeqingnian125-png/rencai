# 第一条真实云数据读取链路

> 日期：2026-07-19
> 分支：feat/cloud-apartment-read
> 起点：main 1d3ae89
> 范围：仅公寓/户型读取链路云端化，不扩展到活动/服务/借物/评论/收藏/地图/消息

## 一、任务目标

完成第一条真实云数据读取链路：

首页公寓列表 → 公寓详情 → 该公寓的户型列表 → 户型详情

## 二、修改文件清单

### 修改文件（8 个）

| 文件 | 修改内容 |
|---|---|
| `cloudfunctions/rencai/index.js` | 新增 4 个公开只读 action 实现函数 + 4 个 switch 分支 + 图片路径校验函数 `isValidImagePath` |
| `miniprogram/data/db.js` | 新增 `getApartmentList` / `getApartmentDetail` / `getRoomListByApartment` / `getRoomDetail` 4 个封装，cloud 模式调云函数，mock 模式走 queries 兜底 |
| `miniprogram/pages/index/index.js` | 移除 `require("../../data/queries")`，改为 `require("../../data/db")`；`loadApartments` 改为异步调 `db.getApartmentList`；新增 loading/error/empty 状态；新增 `_isAlive` 防卸载后 setData；新增 `retryLoad`；`onShow` 仅在已加载过一次后重新拉取 |
| `miniprogram/pages/index/index.wxml` | 新增 loading/error/empty 三种状态视图 |
| `miniprogram/pages/apartment-detail/index.js` | 移除 `require("../../data/apartments")` 和顶层 `require("../../data/queries")`；`loadApartment` 改为异步调 `db.getApartmentDetail`；新增 `loadRooms` 异步调 `db.getRoomListByApartment`；字段映射 `mapApartmentToPage`；新增 loading/error/notFound 状态；`goRoomDetail` 传 `apartment_code`；`toggleFavorite/submitComment/likeComment` 云模式提示"功能云端化中" |
| `miniprogram/pages/apartment-detail/index.wxml` | 新增 loading/error/notFound 状态视图；户型卡片新增 `data-apartment-code` |
| `miniprogram/pages/room-detail/index.js` | 移除 `require("../../data/apartments")` 和顶层 `require("../../data/queries")`；`loadRoom` 改为异步调 `db.getRoomDetail`；字段映射 `mapRoomToPage`/`mapApartmentToPage`；新增 loading/error/notFound 状态；云模式缺 `apartment_code` 时提示参数不完整；`toggleFavorite/submitComment/likeComment` 云模式提示"功能云端化中" |
| `miniprogram/pages/room-detail/index.wxml` | 新增 loading/error/notFound 状态视图 |

### 未修改

- 管理员鉴权（`lib/auth.js`）保持不变
- 登录链路（`loginUser`/`getUserByOpenid`/`getPhoneByCode`）保持不变
- `initCloud` 与数据库初始化代码保持不变
- CSV 导入导出逻辑保持不变
- 其他页面（活动/服务/借物/室友/收藏/评论/消息/地图/个人中心/管理后台）保持不变
- `queries.js` / `mock-store.js` / `apartments.js` / `tables.js` 保持不变（mock 模式仍可用）

## 三、新增云函数 action

### 4 个公开只读 action（游客可访问，无需登录）

| action | 用途 | 入参 | 返回 |
|---|---|---|---|
| `getApartmentList` | 公寓列表 | `limit`（可选，默认 20，上限 100） | `{ ok: true, data: [apartmentCard] }` |
| `getApartmentDetail` | 单个公寓详情 | `id`（必填，正整数） | `{ ok: true, data: apartment }` 或 `{ ok: false, code: "not_found" }` |
| `getRoomListByApartment` | 某公寓的户型列表 | `apartmentCode`（必填，字母数字下划线，≤32 字符）, `limit`（可选） | `{ ok: true, data: [room] }` |
| `getRoomDetail` | 单个户型详情 | `apartmentCode`（必填）, `id`（必填，正整数） | `{ ok: true, data: { room, apartment } }` 或 `{ ok: false, code: "not_found" }` |

### 安全特性

- **公开访问**：4 个 action 均在 `exports.main` 的公开 action 分组，无需登录
- **不信任前端传入 collection**：action 内部硬编码集合名，不接受 `collection` 参数
- **不复用管理员接口**：与管理员 `getAdminDataset` 完全独立
- **输入校验**：`isValidApartmentCode`（字母数字下划线，≤32 字符）+ `isValidNumericId`（正整数，<1e8）
- **status 过滤**：默认只返回 `status === "active"` 的数据；兼容旧数据无 status 字段（fallback 查全量）
- **分页安全上限**：limit 默认 20，上限 100
- **not_found 明确返回**：数据不存在时返回 `{ ok: false, code: "not_found", message: "..." }`
- **统一返回格式**：成功 `{ ok: true, data }`，失败 `{ ok: false, code, message }`
- **无 db 命令对象**：所有返回数据经过 `toApartmentPage`/`toRoomPage`/`toApartmentCard` 映射，剥离 `_id` 和内部字段
- **图片路径校验**：`isValidImagePath` 仅保留 `cloud://`/`http://`/`https://` 开头的图片，本地文件名（如 `apt-1.jpg`）置空，由前端走占位图

## 四、数据链路对比

### 修改前

```
pages/index → require("../../data/queries") → getHomeApartmentCards() → tables (mock-store 内存快照)
pages/apartment-detail → require("../../data/apartments") → getApartmentById() → queries → tables (mock)
pages/room-detail → require("../../data/apartments") → getRoomById() → queries → tables (mock)
```

### 修改后（DATA_MODE = "cloud"）

```
pages/index → db.getApartmentList() → wx.cloud.callFunction("getApartmentList") → cloud DB apartments 集合
pages/apartment-detail → db.getApartmentDetail(id) → wx.cloud.callFunction("getApartmentDetail") → cloud DB apartments 集合
                    → db.getRoomListByApartment(code) → wx.cloud.callFunction("getRoomListByApartment") → cloud DB room_types 集合
pages/room-detail → db.getRoomDetail(code, id) → wx.cloud.callFunction("getRoomDetail") → cloud DB room_types + apartments 集合
```

### 修改后（DATA_MODE = "mock"，保留）

```
pages/index → db.getApartmentList() → queries.getHomeApartmentCards() → tables (mock)
pages/apartment-detail → db.getApartmentDetail(id) → queries.getApartmentById(id) → tables (mock)
                    → db.getRoomListByApartment(code) → mock-store 查询
pages/room-detail → db.getRoomDetail(code, id) → queries.getRoomById() → tables (mock)
```

## 五、静态检查结果

| 检查项 | 结果 |
|---|---|
| 所有 JS 文件 `node --check` 语法 | **通过**（0 失败） |
| 所有 JSON 文件 `JSON.parse` | **通过**（0 失败） |
| `git diff --check`（空白错误） | **通过**（无错误） |
| 三个页面顶层 `require("../../data/queries")` 扫描 | **0 命中**（已移除） |
| 三个页面顶层 `require("../../data/apartments")` 扫描 | **0 命中**（已移除） |
| 三个页面 `require("../../data/mock-store")` 扫描 | **0 命中** |
| 新增敏感信息扫描 | **0 命中**（历史文档中的敏感信息为旧记录，本次未新增） |

## 六、缺失图片清单

### 数据库 image 字段引用的图片

| 公寓 image | room_types image | 本地文件是否存在 |
|---|---|---|
| `apt-1.jpg` | `room-1.jpg` ~ `room-14.jpg` | **均不存在** |

`miniprogram/assets/` 目录下仅有 `icons/` 和 `tabbar/` 子目录，无 `apt-*.jpg` 或 `room-*.jpg` 文件。

### 处理方式

- 云函数 `isValidImagePath` 判断：本地文件名（如 `apt-1.jpg`）非 `cloud://`/`http://`/`https://` 开头 → 返回空字符串
- 前端 wxml：`wx:if="{{item.image}}"` 为 false → 走 `<view wx:else class="grad-cover grad-{{(item.id % 6) + 1}}"></view>` 渐变占位图
- **不影响公寓和户型数据展示**

### 后续修复方向（不在本阶段范围）

- 管理员在管理后台上传真实公寓/户型图片到云存储，`saveAdminItem` 会将 `cloud://` 路径写入数据库
- 或在 CSV 导入时填写云存储路径

## 七、需要在微信开发者工具执行的部署步骤

### 必须执行（否则云模式不生效）

1. **部署云函数**：右键 `cloudfunctions/rencai` → "上传并部署：云端安装依赖"
   - 本次新增了 4 个公开只读 action，必须重新部署

2. **重新编译小程序**：微信开发者工具 → 编译
   - 让前端代码的新 db.js 封装生效

### 无需执行

- 不需要调用 `initCloud`（已在上一阶段执行过，15 个集合已创建）
- 不需要修改云数据库记录
- 不需要创建索引（本阶段未引入新的查询模式，`where` + `orderBy` 在小数据量下无需索引）

## 八、完整手动验收清单

### 游客未登录场景

- [ ] 1. 清除本地缓存 → 重新编译 → 进入首页 → 显示 6 条公寓数据（来自云数据库）
- [ ] 2. 首页显示加载中状态（短暂）→ 数据加载完成
- [ ] 3. 下拉刷新 → 重新拉取公寓列表
- [ ] 4. 点击某公寓 → 进入公寓详情 → 显示该公寓完整信息（名称/地址/价格/设施等）
- [ ] 5. 公寓详情页显示该公寓的户型列表（按 `apartment_code` 关联）
- [ ] 6. 点击某户型 → 进入户型详情 → 显示该户型完整信息 + 所属公寓名称
- [ ] 7. 返回首页 → 再次点击同一公寓 → 数据正常显示（不重复叠加）

### 数据一致性场景

- [ ] 8. 在云开发控制台修改某公寓的 `name` 字段 → 重新编译 → 首页显示新名称
- [ ] 9. 修改 `mock-store.js` 中某公寓的名称 → 重新编译 → 首页**不显示** mock 数据（显示云端数据）
- [ ] 10. 修改某户型的 `price` → 重新编译 → 公寓详情页的户型列表显示新价格

### 异常处理场景

- [ ] 11. 使用微信开发者工具"自定义编译"：编译模式添加启动页面 `/pages/apartment-detail/index`，参数 `id=9999` → 编译后显示"公寓不存在"空状态（不白屏）
- [ ] 12. 使用微信开发者工具"自定义编译"：编译模式添加启动页面 `/pages/room-detail/index`，参数 `aptId=1&roomId=9999&apartmentCode=A001` → 显示"户型不存在"空状态
- [ ] 13. 临时断网 → 首页显示"网络异常，请稍后重试"错误状态 + "重新加载"按钮
- [ ] 14. 点击"重新加载"按钮 → 恢复网络后重新加载成功

### 图片处理场景

- [ ] 15. 首页公寓卡片显示渐变占位图（无 broken image 图标）
- [ ] 16. 公寓详情 hero 区域显示渐变占位图
- [ ] 17. 户型详情 gallery 显示渐变占位图

### 不影响其他功能

- [ ] 18. 管理员登录 → 显示管理员徽章（未受影响）
- [ ] 19. 进入管理后台 → `getAdminDataset` 正常返回（鉴权未受影响）
- [ ] 20. 退出登录 → 回到个人中心游客态（未受影响）
- [ ] 21. 点击公寓详情底部"收藏"按钮 → 提示"收藏功能云端化中"（不报错）
- [ ] 22. 点击公寓详情"写评价"按钮 → 提示"评论功能云端化中"（不报错）

### 云函数 action 鉴权

- [ ] 23. 未登录游客调 `getApartmentList` → 正常返回 6 条公寓（公开接口）
- [ ] 24. 未登录游客调 `getApartmentDetail({id:1})` → 正常返回公寓详情（公开接口）
- [ ] 25. **使用普通非管理员微信账号**（在云数据库 users 集合中 role 不是 admin 的账号）调 `getAdminDataset({type:"apartments"})` → 返回 `{ ok: false, code: "forbidden" }`（管理员鉴权未受影响）
- [ ] 26. 管理员在前端退出登录后，云函数仍能通过 OPENID 识别其管理员身份（这是当前 OPENID 鉴权机制的正常结果：前端退出登录只清除 `app.globalData`，不改变 users.role；管理员调 `getAdminDataset` 仍返回数据，普通用户仍返回 forbidden）

## 九、当前 git diff 和 git status

### git status --short

```
 M cloudfunctions/rencai/index.js
 M miniprogram/data/db.js
 M miniprogram/pages/apartment-detail/index.js
 M miniprogram/pages/apartment-detail/index.wxml
 M miniprogram/pages/index/index.js
 M miniprogram/pages/index/index.wxml
 M miniprogram/pages/room-detail/index.js
 M miniprogram/pages/room-detail/index.wxml
```

### git diff --check

无空白错误。

### 当前分支

`feat/cloud-apartment-read`（基于 `main` 1d3ae89 创建）

### 未提交

- 未提交 Git
- 未推送 GitHub
- 未合并 main
- 未部署云函数
- 未修改线上数据库记录
- 未继续开发其他模块

---

## 十、部署前小范围修正（2026-07-19 追加）

### 修正 1：真分页参数

**修改前**：`getApartmentList(limit)` 和 `getRoomListByApartment(apartmentCode, limit)` 只支持 limit 参数，无分页信息。

**修改后**：
- 云函数新增 `parsePaging(params)` 统一校验：`page` 正整数默认 1，`pageSize` 默认 20 上限 100
- 返回结构新增 `page` / `pageSize` / `hasMore` 字段
- 用 `skip((page-1)*pageSize).limit(pageSize)` 实现真分页
- 用 `skip(skip+pageSize).limit(1)` probe 探测 `hasMore`，避免 `count` 性能问题
- `db.js` 封装改为 `getApartmentList({page, pageSize})` 和 `getRoomListByApartment(apartmentCode, {page, pageSize})`
- mock 模式返回相同分页结构，前端无感切换
- 首页仍只加载第一页（`page:1, pageSize:100` 覆盖当前 6 条数据）

### 修正 2：status 兼容查询

**修改前**（错误逻辑）：先查 `status === "active"`，若为空 fallback 查全量 → "只要查到 active 就不读取旧数据"。

**修改后**（正确逻辑）：
```js
col.where({ status: _.in(["active", null]) })
```
- 使用 `db.command` 的 `_.in(["active", null])` 一次性匹配 `status === "active"` **和** status 字段不存在的旧数据
- 不再使用 fallback 逻辑
- 微信云数据库 `where({ field: _.in([value, null]) })` 会匹配字段值为 value 或字段缺失的记录

**索引建议**（不在本阶段执行，仅报告）：
- `apartments` 集合：建议在 `status` 字段创建索引（当前 6 条数据无需索引，数据量增长后建议）
- `room_types` 集合：建议在 `(apartment_code, status)` 创建组合索引（当前 14 条数据无需索引）
- 用户可在云开发控制台 → 数据库 → 索引管理 中手动创建

### 修正 3：页面生命周期保护

apartment-detail 和 room-detail 已有的保护（确认无误）：
- `onLoad` 设置 `this._isAlive = true`
- `onUnload` 设置 `this._isAlive = false`
- 所有 Promise 回调开头 `if (!this._isAlive) return;`

**本次新增**：
- `loadApartment()` 和 `loadRoom()` 开头新增 `if (!this._isAlive) return;`（防止 onShow 触发时页面正在卸载）
- `loadApartment` 的 setData callback 中检查 `this._isAlive` 后再调用 `loadRooms`
- 快速进入并返回场景：Promise 回调被 `_isAlive` 拦截，不会对已卸载页面 setData，不报错

### 修正 4：图片路径仅允许 cloud:// 和 https://

**修改前**：`/^cloud:\/\/|^https?:\/\//i` 允许 `http://`

**修改后**：`/^cloud:\/\/|^https:\/\//i` 仅允许 `cloud://` 和 `https://`
- 数据库中的 `apt-*.jpg` 和 `room-*.jpg` 仍置空，前端走渐变占位图

### 修正 5：验收说明更新

- 第 25 项：明确"使用普通非管理员微信账号"测试 forbidden
- 第 26 项新增：说明管理员退出登录后云函数仍能通过 OPENID 识别其管理员身份（正常行为）
- 第 11/12 项：从"地址栏手动输入"改为"微信开发者工具自定义编译条件"

### 修正 6：下拉刷新检查

- `pages/index/index.json` 已开启 `"enablePullDownRefresh": true`
- `onPullDownRefresh` 调用 `loadApartments(callback)`，callback 中调 `wx.stopPullDownRefresh()`
- **修正边界情况**：Promise 回调中 `if (!this._isAlive)` 分支也调用 `callback()`，避免页面卸载后下拉刷新卡住
- 成功路径：`setData` 后调 `callback()` → 停止刷新
- 失败路径（`!res.ok`）：`setData` 后调 `callback()` → 停止刷新
- 异常路径（catch）：`setData` 后调 `callback()` → 停止刷新
- 页面已卸载路径：不再 setData，但仍调 `callback()` → 停止刷新

### 修正后静态检查

| 检查项 | 结果 |
|---|---|
| 所有 JS 文件 `node --check` 语法 | **通过**（0 失败） |
| 所有 JSON 文件 `JSON.parse` | **通过**（0 失败） |
| `git diff --check`（空白错误） | **通过**（无错误） |
| 代码文件敏感信息扫描 | **0 命中** |

### 修正后未执行

- 未提交 Git
- 未推送 GitHub
- 未合并 main
- 未部署云函数
- 未修改线上数据库记录
- 未创建索引
- 未继续开发其他模块

---

## 十一、真实云函数测试反馈修正（2026-07-19 追加）

### 真实测试证据

1. `getApartmentList` 成功返回 6 条数据
2. 所有记录的 `priceMin` 和 `priceMax` 都是 `undefined`
3. 数据库实际字段是 `price_min` 和 `price_max`（snake_case）
4. 页面筛选使用 `priceMin` 和 `priceMax`（camelCase）
5. "郑东人才公寓"的 id 是字符串 `"1"`，其他 id 是 number

### 根因

**云函数映射函数字段名不匹配**：

- `toApartmentCard` 返回 `price_min`/`price_max`/`apartment_code`/`image_class`（snake_case）
- 但首页 wxml 和 `applyFilters` 使用 `priceMin`/`priceMax`/`imageClass`（camelCase）
- 导致首页卡片价格显示 `¥undefined-undefined`，价格筛选时 `undefined >= priceRange.min` 返回 false，全部公寓被过滤掉

**id 类型不一致**：
- 数据库中存在 `id: 1`（number）和 `id: "1"`（string）两种
- `where({ id: 1 })` 只匹配数字，字符串 id 的公寓无法被 `getApartmentDetail` 查到

### 修正内容

#### 1. `toApartmentCard` 重写（输出 camelCase）

```js
function toApartmentCard(apt) {
  if (!apt) return null;
  const id = Number(apt.id);
  if (!Number.isInteger(id) || id <= 0) return null;  // 无效 id 返回 null
  const priceMin = Number(apt.price_min ?? apt.priceMin);
  const priceMax = Number(apt.price_max ?? apt.priceMax);
  return {
    id,
    apartmentCode: apt.apartment_code ?? apt.apartmentCode ?? "",
    name: apt.name || "",
    district: apt.district || "",
    priceMin: Number.isFinite(priceMin) ? priceMin : 0,
    priceMax: Number.isFinite(priceMax) ? priceMax : 0,
    rooms: apt.room_summary ?? apt.rooms ?? "",
    location: apt.address ?? apt.location ?? "",
    tags: Array.isArray(apt.tags) ? apt.tags : [],
    imageClass: apt.image_class ?? apt.imageClass ?? "",
    image: isValidImagePath(apt.image) ? apt.image : "",
    favorite: false
  };
}
```

#### 2. `toApartmentPage` 和 `toRoomPage` 加固

- id 强制 `Number()` 转换，无效 id 返回 null
- `price_min`/`price_max`/`longitude`/`latitude`/`price` 用 `Number.isFinite` 校验
- 兼容 snake_case 和 camelCase 两套字段名（`??` fallback）

#### 3. 字符串/数字 id 兼容

- `publicGetApartmentDetail`：`where({ id: _.in([id, String(id)]) })` 同时匹配数字和字符串
- `publicGetRoomDetail`：同样用 `_.in([id, String(id)])`
- 返回给前端的 id 统一为 number（`toApartmentPage`/`toRoomPage` 内 `Number(apt.id)`）
- `publicGetApartmentList`：用 `cards.sort((a, b) => a.id - b.id)` 保证数字正序
- 无效 id 记录被 `filter((card) => card !== null)` 跳过

#### 4. 首页 `applyFilters` 价格防御

- 强制 `Number(apartment.priceMin) || 0` 转换
- "全部价格"时即使价格异常也保留记录（不因单条异常导致全列表消失）
- 选择具体价格区间时，价格无效（0）的记录不参与匹配
- `console.error` 保留详细信息

#### 5. 详情页字段映射加固

- `apartment-detail/index.js` 的 `mapApartmentToPage`：`priceMin`/`priceMax`/`latitude`/`longitude` 强制转 number
- `room-detail/index.js` 的 `mapRoomToPage`：`price` 强制转 number

### 修正后的公寓卡片数据结构

```js
{
  id: 1,                      // number，统一为数字
  apartmentCode: "A001",       // string，camelCase
  name: "春藤美寓",
  district: "高新区",
  priceMin: 800,               // number，来自 price_min
  priceMax: 1500,              // number，来自 price_max
  rooms: "3居室",              // string，来自 room_summary
  location: "高新区·春藤路",   // string，来自 address
  tags: [...],                 // array
  imageClass: "apt-1",         // string，来自 image_class
  image: "",                   // string，仅 cloud:// 或 https://
  favorite: false              // boolean，固定 false
}
```

### 静态检查结果

| 检查项 | 结果 |
|---|---|
| 所有 JS 文件 `node --check` 语法 | **通过**（0 失败） |
| 所有 JSON 文件 `JSON.parse` | **通过**（0 失败） |
| `git diff --check`（空白错误） | **通过**（无错误） |
| 代码文件敏感信息扫描 | **0 命中** |

### 部署后需要重新运行的测试命令

部署云函数后，在微信开发者工具云函数测试面板执行：

```js
// 1. 验证公寓列表字段（重点看 priceMin/priceMax 不为 undefined）
{ "action": "getApartmentList", "page": 1, "pageSize": 100 }
// 预期：data[0].priceMin 和 data[0].priceMax 均为 number

// 2. 验证字符串 id 兼容（"郑东人才公寓" id="1"）
{ "action": "getApartmentDetail", "id": 1 }
// 预期：返回 ok:true，data.id 为 number 1

// 3. 验证户型详情字符串 id 兼容
{ "action": "getRoomDetail", "apartmentCode": "A001", "id": 1 }
// 预期：返回 ok:true，data.room.id 为 number 1

// 4. 验证价格筛选不再导致空列表
// 在小程序首页选择"全部价格" → 应显示 6 条公寓
// 在小程序首页选择"¥500-1000" → 应显示该区间公寓，价格异常的记录不显示
```

### 修正后未执行

- 未提交 Git
- 未推送 GitHub
- 未合并 main
- 未部署云函数
- 未修改线上数据库记录
- 未继续开发其他模块

---

## 十三、户型详情费用/设施空白修复（2026-07-19 追加）

### 真实测试证据

- 户型详情页"费用信息"和"配套设施"标题下完全空白
- 公寓详情接口和户型详情接口此前均返回 ok:true
- 户型名称、价格、面积、朝向、户型、楼层、介绍正常

### 根因追踪（逐层检查）

| 层级 | costs/facilities 状态 | 证据 |
|---|---|---|
| 1. 云函数 `publicGetRoomDetail` 返回 | **存在** | `toRoomPage(data[0], apartmentRaw)` 已填充 `room.costs` 和 `room.facilities` |
| 2. `db.js` `getRoomDetail` | **完整透传** | `callCloud` 直接返回云函数结果，未删除字段 |
| 3. **`mapRoomToPage`（`room-detail/index.js:3-24`）** | **丢失** | 函数重新构造 room 对象时**遗漏了 `costs` 和 `facilities` 字段** |
| 4. `_applyRoomResult` 的 setData | 无覆盖问题 | 但 `mapRoomToPage` 返回的对象本就不含这两个字段 |

**结论：数据在第 3 层 `mapRoomToPage` 丢失**。该函数重新构造 room 对象时只保留了 `id, apartment_id, apartment_code, name, area, orient, layout, floor, price, priceValue, status, image, desc, favorite, comments`，遗漏了 `costs` 和 `facilities`。

### 修正内容

#### 1. `mapRoomToPage` 明确保留 costs/facilities

```js
function mapRoomToPage(room, apartment) {
  if (!room) return null;
  const price = Number(room.price) || 0;
  return {
    // ... 其他字段
    costs: Array.isArray(room.costs) ? room.costs : [],
    facilities: Array.isArray(room.facilities) ? room.facilities : [],
    comments: []
  };
}
```

#### 2. `room-detail/index.wxml` 增加空状态

```xml
<view wx:if="{{room.costs.length}}" class="cost-grid">...</view>
<view wx:else class="empty-block">暂无费用信息</view>

<view wx:if="{{room.facilities.length}}" class="fac-grid">...</view>
<view wx:else class="empty-block">暂无配套设施</view>
```

#### 3. `room-detail/index.wxss` 新增 `.empty-block` 样式

```css
.empty-block {
  padding: 40rpx 32rpx;
  text-align: center;
  color: #9a8f80;
  font-size: 26rpx;
  line-height: 1.6;
}
```

### 修复后的 room 页面数据结构

```js
{
  id: 1,
  apartment_id: 1,
  apartment_code: "A001",
  name: "精致一居室",
  area: "35㎡",
  orient: "南",
  layout: "一室一厅",
  floor: "3F",
  price: "¥1200",
  priceValue: 1200,
  status: "active",
  image: "",
  desc: "...",
  favorite: false,
  costs: [
    { label: "水费", value: "按实际用量", active: true },
    { label: "电费", value: "按实际用量", active: true }
  ],
  facilities: [
    { label: "独立卫浴", icon: "卫", active: true },
    { label: "空调", icon: "空", active: true },
    { label: "热水器", icon: "热", active: true }
  ],
  comments: []
}
```

### 是否需要重新部署云函数

**不需要重新部署云函数，只需要重新编译小程序**。

原因：
- 云函数 `publicGetRoomDetail` 已经正确返回 `room.costs` 和 `room.facilities`（上一轮已修复并部署）
- 本次丢失发生在前端 `mapRoomToPage`，是纯前端 bug
- 修复仅涉及 `miniprogram/pages/room-detail/index.js` 和 `index.wxml` 和 `index.wxss`
- 在微信开发者工具点击"编译"即可生效

### 底部留白检查

- `scroll-view.scroll-y` 包裹所有内容
- 末尾有 `<view class="scroll-spacer"></view>`，高度 128rpx
- `.bottom-bar` 是 `position: fixed`，高度约 128rpx（含 safe-area-inset-bottom）
- 128rpx 留白足够，底部操作栏不会遮挡详细参数、评价、最后一行内容

### 静态检查结果

| 检查项 | 结果 |
|---|---|
| 所有 JS 文件 `node --check` 语法 | **通过**（0 失败） |
| 所有 JSON 文件 `JSON.parse` | **通过**（0 失败） |
| `git diff --check`（空白错误） | **通过**（无错误） |
| 代码文件敏感信息扫描 | **0 命中** |

### 验收步骤

1. **重新编译小程序**（不需要部署云函数）
2. 进入公寓详情 → 点击某户型 → 进入户型详情
3. 验证：
   - "费用信息"区域显示费用卡片（label + value）
   - "配套设施"区域显示设施卡片（icon + label）
   - 费用和设施内容与所属公寓一致
4. 边界验证：
   - 若某公寓无 costs/facilities，户型详情显示"暂无费用信息"/"暂无配套设施"（不再是大块空白）

### 修正后未执行

- 未提交 Git
- 未推送 GitHub
- 未合并 main
- 未部署云函数（本次修复纯前端，不需要重新部署）
- 未修改线上数据库记录
- 未继续开发其他模块

---

## 十二、设施数据规范化（2026-07-19 追加）

### 真实测试证据

- 公寓详情中的"配套设施"和"公共设施"显示为空白方框
- 云数据库 `private_facilities`/`public_facilities` 是字符串数组（如 `["空调","热水器"]`）
- WXML 使用 `item.icon`、`item.label`、`item.active`
- 字符串没有这些属性，所以只渲染出空框

### 修正内容

#### 1. 新增 `normalizeFacilityList` 函数

兼容字符串和对象两种输入：

```js
// 字符串输入
"空调" → { label:"空调", icon:"空", active:true }

// 对象输入
{ label:"空调", icon:"空", active:true } → 清洗后保留
{ label:"空调", active:false } → { label:"空调", icon:"空", active:false }
```

规则：
- 非数组返回 `[]`
- 空字符串/无有效 label 的项过滤
- `active` 缺失默认 `true`，明确 `false` 保留 `false`
- `icon` 缺失时先查映射表 `FACILITY_ICON_MAP`，再取 label 第一个汉字
- 不允许返回 `undefined` 的 label

图标映射表（15 项）：
```
独立卫浴→卫, 空调→空, 热水器→热, 宽带→网, 衣柜→柜,
书桌→桌, 自助洗衣房→衣, 洗衣房→衣, 公共厨房→厨,
健身区→健, 健身房→健, 快递柜→柜, 休闲区→休,
充电桩→电, 自习室→习
```

#### 2. 新增 `normalizeCostList` 函数

规范化费用列表，兼容缺失的 `active` 字段：

```js
// 输入
{ label:"物业费", value:"¥1.2/平米/月" }
// 输出
{ label:"物业费", value:"¥1.2/平米/月", active:true }

// active 明确为 false
{ label:"物业费", value:"¥1.2/平米/月", active:false }
// 输出 active:false 保留
```

#### 3. `toApartmentPage` 应用规范化

```js
costs: normalizeCostList(apt.costs),
private_facilities: normalizeFacilityList(apt.private_facilities),
public_facilities: normalizeFacilityList(apt.public_facilities),
```

#### 4. `toRoomPage` 同步规范化

户型本身无 `facilities`/`costs` 字段（room_types 表无此字段），改为从所属公寓继承：

```js
function toRoomPage(room, apartment) {
  // ...
  const facilities = apartment
    ? normalizeFacilityList(apartment.private_facilities ?? apartment.privateFacilities)
    : [];
  const costs = apartment
    ? normalizeCostList(apartment.costs)
    : [];
  return { ..., costs, facilities };
}
```

`publicGetRoomDetail` 调整顺序：先拉取公寓原始记录，再传给 `toRoomPage(data[0], apartmentRaw)`，最后用 `toApartmentPage` 规范化返回 apartment。

#### 5. 公寓详情返回的设施示例

```js
{
  private_facilities: [
    { label: "空调", icon: "空", active: true },
    { label: "热水器", icon: "热", active: true },
    { label: "独立卫浴", icon: "卫", active: true },
    { label: "宽带", icon: "网", active: true }
  ],
  public_facilities: [
    { label: "自助洗衣房", icon: "衣", active: true },
    { label: "健身区", icon: "健", active: true },
    { label: "快递柜", icon: "柜", active: true }
  ],
  costs: [
    { label: "物业费", value: "¥1.2/平米/月", active: true },
    { label: "水费", value: "¥3.5/吨", active: true }
  ]
}
```

### 静态检查结果

| 检查项 | 结果 |
|---|---|
| 所有 JS 文件 `node --check` 语法 | **通过**（0 失败） |
| 所有 JSON 文件 `JSON.parse` | **通过**（0 失败） |
| `git diff --check`（空白错误） | **通过**（无错误） |
| 代码文件敏感信息扫描 | **0 命中** |

### 重新部署和验收步骤

1. **部署云函数**：右键 `cloudfunctions/rencai` → "上传并部署：云端安装依赖"
2. **重新编译小程序**

部署后在微信开发者工具云函数测试面板执行：

```js
// 1. 验证公寓详情设施规范化
{ "action": "getApartmentDetail", "id": 1 }
// 预期：data.private_facilities 和 data.public_facilities 均为对象数组
// 每项含 { label, icon, active }

// 2. 验证户型详情设施来自公寓
{ "action": "getRoomDetail", "apartmentCode": "A001", "id": 1 }
// 预期：data.room.facilities 和 data.room.costs 为对象数组
// data.apartment.private_facilities 与 data.room.facilities 内容一致
```

在小程序中验收：
- 进入公寓详情 → "配套设施"/"公共设施"区域显示带图标和 label 的卡片（不再是空框）
- 进入户型详情 → 设施区域显示与所属公寓一致的设施
- 费用区域显示带 label 和 value 的卡片

### 修正后未执行

- 未提交 Git
- 未推送 GitHub
- 未合并 main
- 未部署云函数
- 未修改线上数据库记录
- 未继续开发其他模块
