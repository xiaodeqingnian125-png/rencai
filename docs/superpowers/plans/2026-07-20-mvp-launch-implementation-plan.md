# 晓得青年极速上线版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 2026-07-22 至 2026-07-23 提交审核前，完成真实房源浏览、管理员公寓/户型云端维护、CSV 往返、图片与平面图管理，并把未完成模块安全降级为功能预览。

**Architecture:** 页面统一通过 `miniprogram/data/db.js` 调用 `rencai` 云函数；管理员页面使用纯函数适配器在云数据库字段与现有 UI 字段之间转换。公寓平面图作为 `apartments.floor_plans` 数组保存，详情展示前3张，独立页面展示其余图片。未完成模块通过共享预览守卫阻止写操作。

**Tech Stack:** 微信小程序原生 WXML/WXSS/JavaScript、微信云开发、Node.js 内置 `node:test`、无新增第三方依赖。

## Global Constraints

- 保留当前 `feat/mvp-launch` 工作区已有未提交改动，不覆盖或回滚。
- 只使用 `apply_patch` 修改文件。
- 新行为必须测试先行，使用 `node --test` 观察 RED 后再写生产代码。
- 云模式失败不回退 Mock。
- 用户详情页不包含任何管理员维护组件。
- 管理员 action 继续通过服务端 `requireAdmin` 鉴权。
- 每个任务完成后更新对应 `logs/2026-07-20-*.md`。
- 每次提交只暂存任务明确列出的文件。

---

### Task 1: 建立无第三方依赖的测试基线

**Files:**
- Create: `tests/helpers/load-miniprogram-module.js`
- Create: `tests/baseline.test.js`
- Create: `logs/2026-07-20-mvp-test-baseline.md`

**Interfaces:**
- Produces: `loadPage(filePath, moduleStubs, globals)`、`loadComponent(...)`，供后续页面测试捕获 `Page`/`Component` 定义。

- [ ] **Step 1: 写测试加载器规格测试**

```js
// tests/baseline.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadDefinition } = require("./helpers/load-miniprogram-module");

test("loadDefinition captures a Page definition", () => {
  const definition = loadDefinition("Page({ data: { ok: true } })", "Page");
  assert.equal(definition.data.ok, true);
});
```

- [ ] **Step 2: 运行并确认 RED**

Run: `node --test tests/baseline.test.js`
Expected: FAIL，原因是 `tests/helpers/load-miniprogram-module.js` 不存在。

- [ ] **Step 3: 实现最小加载器**

```js
// tests/helpers/load-miniprogram-module.js
const vm = require("node:vm");

function loadDefinition(source, kind, options = {}) {
  let definition;
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    require(request) {
      if (Object.prototype.hasOwnProperty.call(options.modules || {}, request)) {
        return options.modules[request];
      }
      throw new Error(`Unexpected require: ${request}`);
    },
    wx: options.wx || {},
    getApp: options.getApp || (() => ({ globalData: {} })),
    getCurrentPages: options.getCurrentPages || (() => [{}]),
    Page(value) { if (kind === "Page") definition = value; },
    Component(value) { if (kind === "Component") definition = value; }
  };
  vm.runInNewContext(source, sandbox);
  return definition;
}

module.exports = { loadDefinition };
```

- [ ] **Step 4: 运行 GREEN 与全量静态基线**

Run: `node --test tests/baseline.test.js`
Expected: PASS 1 test。

Run: `find miniprogram cloudfunctions/rencai -name '*.js' -type f -print0 | xargs -0 -n1 node --check`
Expected: exit 0。

- [ ] **Step 5: 记录并提交**

```bash
git add tests/helpers/load-miniprogram-module.js tests/baseline.test.js logs/2026-07-20-mvp-test-baseline.md
git commit -m "test: add miniprogram module harness"
```

---

### Task 2: 建立管理员云数据适配器

**Files:**
- Create: `miniprogram/data/admin-adapter.js`
- Create: `tests/admin-adapter.test.js`
- Modify: `miniprogram/pages/admin/index.js`
- Create: `logs/2026-07-20-admin-cloud-adapter.md`

**Interfaces:**
- Produces: `toAdminItem(type, record, apartmentMap)` 和 `toCloudItem(type, item, original)`。
- `toAdminItem` 保留原始云字段并增加现有 UI 所需派生字段。
- `toCloudItem` 只返回云端规范字段，禁止把 `apartment`、`rent` 等展示字段当作权威字段。

- [ ] **Step 1: 写公寓与户型双向转换测试**

```js
// tests/admin-adapter.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const { toAdminItem, toCloudItem } = require("../miniprogram/data/admin-adapter");

test("apartment cloud record maps to existing admin UI fields", () => {
  const item = toAdminItem("apartments", {
    id: 1, apartment_code: "A001", name: "郑东青年公寓",
    price_min: 1200, price_max: 1800, room_summary: "1-2居"
  });
  assert.equal(item.rent, "¥1200-1800/月");
  assert.equal(item.rooms, "1-2居");
});

test("apartment admin form writes canonical cloud fields", () => {
  const item = toCloudItem("apartments", {
    id: 1, apartment_code: "A001", name: "郑东青年公寓",
    rent: "¥1300-1900/月", rooms: "1-2居", floor_plans: []
  });
  assert.equal(item.price_min, 1300);
  assert.equal(item.price_max, 1900);
  assert.equal(item.room_summary, "1-2居");
  assert.equal("rent" in item, false);
});

test("room adapter keeps apartment_code and numeric price", () => {
  const cloud = toCloudItem("rooms", {
    id: 2, apartment_code: "A001", name: "精致一居室", rent: "¥1200/月起"
  });
  assert.equal(cloud.apartment_code, "A001");
  assert.equal(cloud.price, 1200);
});
```

- [ ] **Step 2: 运行并确认 RED**

Run: `node --test tests/admin-adapter.test.js`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现最小适配器**

实现内容必须包括：

```js
function parseNumbers(value) {
  return String(value || "").match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
}

function toAdminItem(type, record, apartmentMap = {}) {
  if (type === "apartments") {
    return {
      ...record,
      rent: `¥${Number(record.price_min) || 0}-${Number(record.price_max) || 0}/月`,
      rooms: record.room_summary || ""
    };
  }
  if (type === "rooms") {
    return {
      ...record,
      apartment: record.apartment_name || apartmentMap[record.apartment_code] || record.apartment_code || "",
      rent: `¥${Number(record.price) || 0}/月起`,
      rooms: record.layout || ""
    };
  }
  return { ...record };
}
```

`toCloudItem` 对公寓输出 `id/apartment_code/name/district/address/price_min/price_max/room_summary/desc/status/image/latitude/longitude/floor_plans`；对户型输出 `id/apartment_code/name/area/orient/layout/floor/price/desc/status/image`。

- [ ] **Step 4: 运行 GREEN**

Run: `node --test tests/admin-adapter.test.js`
Expected: PASS 3 tests。

- [ ] **Step 5: 在 admin 页面引入适配器但暂不切换调用**

```js
const { toAdminItem, toCloudItem } = require("../../data/admin-adapter");
```

- [ ] **Step 6: 语法与回归验证后提交**

Run: `node --check miniprogram/data/admin-adapter.js`
Run: `node --check miniprogram/pages/admin/index.js`
Run: `node --test tests/admin-adapter.test.js tests/baseline.test.js`

```bash
git add miniprogram/data/admin-adapter.js miniprogram/pages/admin/index.js tests/admin-adapter.test.js logs/2026-07-20-admin-cloud-adapter.md
git commit -m "feat: add admin cloud data adapter"
```

---

### Task 3: 管理员公寓与户型 CRUD 全量切到云端

**Files:**
- Modify: `miniprogram/pages/admin/index.js`
- Modify: `miniprogram/pages/admin/index.wxml`
- Modify: `miniprogram/pages/admin/index.wxss`
- Create: `tests/admin-cloud-crud.test.js`
- Create: `logs/2026-07-20-admin-cloud-crud.md`

**Interfaces:**
- Consumes: Task 2 `toAdminItem/toCloudItem`。
- Produces: `loadAdminItems()` Promise；公寓/户型保存、删除和状态切换均 await `db.*`。

- [ ] **Step 1: 写页面调用测试**

测试通过加载 `admin/index.js`，注入 `db.getAdminDataset/getNextAdminId/saveAdminItem/deleteAdminItem/updateAdminItemStatus`，断言：

```js
assert.equal(calls.getAdminDataset[0], "apartments");
assert.equal(calls.saveAdminItem[0].type, "apartments");
assert.equal(calls.saveAdminItem[0].item.price_min, 1200);
assert.equal(calls.legacyWrites.length, 0);
```

同时断言 `activities/services/items/comments/users` 设置 `previewOnly: true` 且不读取管理员数据集。

- [ ] **Step 2: 运行并确认 RED**

Run: `node --test tests/admin-cloud-crud.test.js`
Expected: FAIL，因为当前页面调用 `queries` 同步接口。

- [ ] **Step 3: 实现异步加载**

将 `onLoad` 改为只初始化 config，然后：

```js
if (type !== "apartments" && type !== "rooms") {
  this.setData({ type, config, previewOnly: true, loading: false, items: [], visibleItems: [] });
  return;
}
await this.loadAdminItems();
```

`loadAdminItems` 使用 `Promise.all([db.getAdminDataset(type), db.getNextAdminId(type)])`，公寓/户型通过适配器转换；失败设置 `loadError` 并显示“重新加载”。

- [ ] **Step 4: 实现异步写操作**

`saveItem/deleteItem/updateStatus` 必须：

- 使用 `operationPending` 防重复点击。
- await 对应 `db` 方法。
- 检查 `{ ok: false }` 或 Promise reject。
- 失败时保留表单和列表。
- 成功后 await `loadAdminItems()`。
- 仅在真实成功后显示成功 Toast。

- [ ] **Step 5: 增加加载、错误和预览状态 WXML/WXSS**

新增 `loading/loadError/previewOnly/operationPending` 状态视图；未开放管理员类型显示“该管理模块暂未开放”，不渲染 CRUD 按钮。

- [ ] **Step 6: 运行 GREEN 与静态检查**

Run: `node --test tests/admin-cloud-crud.test.js tests/admin-adapter.test.js`
Run: `node --check miniprogram/pages/admin/index.js`
Run: `git diff --check -- miniprogram/pages/admin`

- [ ] **Step 7: 记录并提交**

```bash
git add miniprogram/pages/admin/index.js miniprogram/pages/admin/index.wxml miniprogram/pages/admin/index.wxss tests/admin-cloud-crud.test.js logs/2026-07-20-admin-cloud-crud.md
git commit -m "feat: move apartment admin crud to cloud"
```

---

### Task 4: 管理入口集中化与图片上传失败保护

**Files:**
- Modify: `miniprogram/pages/apartment-detail/index.js`
- Modify: `miniprogram/pages/apartment-detail/index.wxml`
- Modify: `miniprogram/pages/apartment-detail/index.wxss`
- Modify: `miniprogram/pages/room-detail/index.js`
- Modify: `miniprogram/pages/room-detail/index.wxml`
- Modify: `miniprogram/components/image-uploader/index.js`
- Modify: `miniprogram/components/image-uploader/index.wxml`
- Create: `tests/detail-admin-controls.test.js`
- Create: `tests/image-uploader.test.js`
- Create: `logs/2026-07-20-admin-media-centralization.md`

**Interfaces:**
- Produces: 用户详情页纯展示；image uploader 失败时触发 `uploaderror`，不触发 `change`。

- [ ] **Step 1: 写详情页静态回归测试**

```js
test("public detail pages contain no admin maintenance components", () => {
  const apartment = fs.readFileSync("miniprogram/pages/apartment-detail/index.wxml", "utf8");
  const room = fs.readFileSync("miniprogram/pages/room-detail/index.wxml", "utf8");
  for (const source of [apartment, room]) {
    assert.doesNotMatch(source, /image-uploader/);
    assert.doesNotMatch(source, /admin-(image|location)-section/);
  }
});
```

- [ ] **Step 2: 写上传失败测试并确认 RED**

加载组件后模拟 `wx.cloud.uploadFile.fail`，断言：

```js
assert.deepEqual(changeEvents, []);
assert.equal(component.data.imageUrl, "cloud://old-image");
assert.equal(errorEvents.length, 1);
```

Run: `node --test tests/detail-admin-controls.test.js tests/image-uploader.test.js`
Expected: FAIL，当前详情仍有组件且失败会写入临时路径。

- [ ] **Step 3: 移除用户详情页管理员维护区**

删除 apartment-detail 的 `onMapTap/onImageChange`、`locationMarkers/isAdmin` 和管理员 WXML/WXSS；删除 room-detail 的 `onImageChange/isAdmin` 和管理员 WXML。保留地图查看功能 `goMap`。

- [ ] **Step 4: 修复上传失败行为和5MB限制**

组件新增 `previousImageUrl`；选择文件时检查 `res.tempFiles[0].size <= 5 * 1024 * 1024`。云上传失败时恢复旧值、触发 `uploaderror`，不触发 `change`。

- [ ] **Step 5: 运行 GREEN 并提交**

Run: `node --test tests/detail-admin-controls.test.js tests/image-uploader.test.js`
Run: `node --check miniprogram/components/image-uploader/index.js`
Run: `node --check miniprogram/pages/apartment-detail/index.js`
Run: `node --check miniprogram/pages/room-detail/index.js`

```bash
git add miniprogram/pages/apartment-detail/index.js miniprogram/pages/apartment-detail/index.wxml miniprogram/pages/apartment-detail/index.wxss miniprogram/pages/room-detail/index.js miniprogram/pages/room-detail/index.wxml miniprogram/pages/room-detail/index.wxss miniprogram/components/image-uploader/index.js tests/detail-admin-controls.test.js tests/image-uploader.test.js logs/2026-07-20-admin-media-centralization.md
git commit -m "fix: keep admin media tools in admin pages"
```

---

### Task 5: 地址自动定位、封面路径和平面图 CSV 往返

**Files:**
- Modify: `cloudfunctions/rencai/lib/geocode.js`
- Modify: `cloudfunctions/rencai/lib/import-task.js`
- Modify: `cloudfunctions/rencai/lib/csv-parser.js`
- Modify: `cloudfunctions/rencai/index.js`
- Modify: `miniprogram/pages/admin/index.js`
- Create: `miniprogram/utils/floor-plans.js`
- Create: `tests/floor-plans.test.js`
- Create: `tests/import-address-only.test.js`
- Create: `logs/2026-07-20-import-address-and-media.md`

**Interfaces:**
- Produces: `normalizeFloorPlans/encodeFloorPlans/decodeFloorPlans`。
- 公寓 CSV 字段“封面图路径”“平面图”；户型 CSV 字段“封面图路径”。
- 最多10条缺坐标公寓地址进入单次预览；失败行不写入。

- [ ] **Step 1: 写 floor plan codec RED 测试**

```js
test("floor plan JSON round-trips names and cloud paths", () => {
  const plans = [{ name: "项目总平面图", image: "cloud://env/a.jpg" }];
  assert.deepEqual(decodeFloorPlans(encodeFloorPlans(plans)), plans);
});

test("invalid floor plan rows are removed", () => {
  assert.deepEqual(normalizeFloorPlans([{ name: "", image: "tmp/a.jpg" }]), []);
});
```

- [ ] **Step 2: 写地址导入 RED 测试**

使用现有 wx-server-sdk/geocode 模块注入方式加载 `import-task.js`，断言10条缺坐标地址允许预览，第11条返回“请分批导入”，地图解析失败的行进入 `error_log` 且 `preview_data` 不含 `(0,0)`。

- [ ] **Step 3: 实现 codec 与 CSV 列**

`normalizeFloorPlans` 只保留名称非空且路径以 `cloud://` 或 `https://` 开头的项。`encodeFloorPlans` 返回紧凑 JSON；`decodeFloorPlans` 捕获解析错误并返回空数组。

更新公寓和户型 CSV headers/row mapping/import validation，保证导出→导入保持封面路径、平面图名称和顺序。

- [ ] **Step 4: 调整地址解析上限和失败规则**

- `MAX_GEOCODE_ROWS = 10`。
- `axios` 单地图请求超时调整为3000ms，维持腾讯→高德回退。
- `GEOCODE_BATCH = 5`。
- geocode 失败不把该行放入 `preview_data`。
- 有效导出坐标可直接复用。

- [ ] **Step 5: 公开接口规范化平面图**

`toApartmentCard/toApartmentPage` 返回规范化后的 `floor_plans`，剥离无效路径和内部字段。

- [ ] **Step 6: 运行 GREEN 与安全检查**

Run: `node --test tests/floor-plans.test.js tests/import-address-only.test.js`
Run: `node --check cloudfunctions/rencai/lib/import-task.js`
Run: `node --check cloudfunctions/rencai/index.js`
Run: `git diff --check`

- [ ] **Step 7: 提交**

```bash
git add cloudfunctions/rencai/lib/geocode.js cloudfunctions/rencai/lib/import-task.js cloudfunctions/rencai/lib/csv-parser.js cloudfunctions/rencai/index.js miniprogram/pages/admin/index.js miniprogram/utils/floor-plans.js tests/floor-plans.test.js tests/import-address-only.test.js logs/2026-07-20-import-address-and-media.md
git commit -m "feat: round trip apartment media in csv"
```

---

### Task 6: 管理员平面图编辑与用户侧展示

**Files:**
- Modify: `miniprogram/pages/admin/index.js`
- Modify: `miniprogram/pages/admin/index.wxml`
- Modify: `miniprogram/pages/admin/index.wxss`
- Modify: `miniprogram/pages/apartment-detail/index.js`
- Modify: `miniprogram/pages/apartment-detail/index.wxml`
- Modify: `miniprogram/pages/apartment-detail/index.wxss`
- Modify: `miniprogram/app.json`
- Create: `miniprogram/pages/apartment-plans/index.js`
- Create: `miniprogram/pages/apartment-plans/index.json`
- Create: `miniprogram/pages/apartment-plans/index.wxml`
- Create: `miniprogram/pages/apartment-plans/index.wxss`
- Create: `tests/floor-plan-pages.test.js`
- Create: `logs/2026-07-20-apartment-floor-plans.md`

**Interfaces:**
- Consumes: Task 5 floor plan codec和公开详情字段。
- Produces: 管理表单按数组顺序保存；详情前3张；更多页 `slice(3)`。

- [ ] **Step 1: 写页面行为 RED 测试**

断言：

```js
assert.deepEqual(detail.data.visibleFloorPlans, plans.slice(0, 3));
assert.equal(detail.data.hasMoreFloorPlans, plans.length > 3);
assert.deepEqual(morePage.data.floorPlans, plans.slice(3));
```

静态断言详情 WXML 名称位于图片节点后的 caption，且 caption 样式包含 `text-align: center`。

- [ ] **Step 2: 管理员编辑 UI**

公寓表单新增 `floorPlans` 列表；每项包含名称 input、`image-uploader`、上移、下移、删除；“添加平面图”追加 `{name:"", image:""}`。保存前过滤不完整项并调用 `toCloudItem`。

- [ ] **Step 3: 公寓详情 UI**

在周边服务和户型选择之间加入平面图区：前3张使用 `mode="widthFix"` 纵向展示；名称在图下居中；大于3张显示右上角“更多”；点击调用 `wx.previewImage`。

- [ ] **Step 4: 更多页面**

页面根据 `id` 调 `db.getApartmentDetail`，规范化后展示 `floor_plans.slice(3)`；实现 loading/error/empty/retry 和 `wx.previewImage`。

- [ ] **Step 5: 运行 GREEN 和页面完整性检查**

Run: `node --test tests/floor-plan-pages.test.js tests/floor-plans.test.js`
Run: `node -e 'JSON.parse(require("fs").readFileSync("miniprogram/app.json")); console.log("OK")'`
Run: `node --check miniprogram/pages/apartment-plans/index.js`

- [ ] **Step 6: 提交**

```bash
git add miniprogram/pages/admin/index.js miniprogram/pages/admin/index.wxml miniprogram/pages/admin/index.wxss miniprogram/pages/apartment-detail/index.js miniprogram/pages/apartment-detail/index.wxml miniprogram/pages/apartment-detail/index.wxss miniprogram/pages/apartment-plans/index.js miniprogram/pages/apartment-plans/index.json miniprogram/pages/apartment-plans/index.wxml miniprogram/pages/apartment-plans/index.wxss miniprogram/app.json tests/floor-plan-pages.test.js logs/2026-07-20-apartment-floor-plans.md
git commit -m "feat: add apartment floor plan gallery"
```

---

### Task 7: 未开放模块统一功能预览

**Files:**
- Create: `miniprogram/utils/preview-mode.js`
- Create: `tests/preview-mode.test.js`
- Modify: `miniprogram/pages/service/index.*`
- Modify: `miniprogram/pages/activity-detail/index.*`
- Modify: `miniprogram/pages/activity-publish/index.*`
- Modify: `miniprogram/pages/service-detail/index.*`
- Modify: `miniprogram/pages/borrow/index.*`
- Modify: `miniprogram/pages/item-detail/index.*`
- Modify: `miniprogram/pages/item-publish/index.*`
- Modify: `miniprogram/pages/roommate/index.*`
- Modify: `miniprogram/pages/messages/index.*`
- Modify: `miniprogram/pages/profile/index.*`
- Create: `logs/2026-07-20-preview-mode.md`

**Interfaces:**
- Produces: `PREVIEW_MESSAGE` 和 `showPreviewNotice()`。

- [ ] **Step 1: 写预览守卫 RED 测试**

```js
test("preview notice uses one honest message", () => {
  const calls = [];
  showPreviewNotice({ showToast: (args) => calls.push(args) });
  assert.equal(calls[0].title, "该功能正在准备中，暂未正式开放");
});
```

- [ ] **Step 2: 实现共享守卫**

```js
const PREVIEW_MESSAGE = "该功能正在准备中，暂未正式开放";
function showPreviewNotice(wxApi = wx) {
  wxApi.showToast({ title: PREVIEW_MESSAGE, icon: "none" });
  return { ok: false, reason: "preview_only" };
}
module.exports = { PREVIEW_MESSAGE, showPreviewNotice };
```

- [ ] **Step 3: 页面增加统一预览条**

每个未开放页面顶部显示“功能预览 · 即将开放”，示例卡片增加“示例内容”。不隐藏5个 tabBar。

- [ ] **Step 4: 替换所有假写操作**

报名、发布活动、下单、申请借用、发布物品、发布室友帖、删除消息、确认服务、个人业务动作均直接调用 `showPreviewNotice()`；不得继续调用 `queries` 写函数或显示成功弹窗。

- [ ] **Step 5: 静态扫描与测试**

Run: `node --test tests/preview-mode.test.js`
Run: `rg -n '报名成功|发布成功|需求已提交|申请已发送|已提交审核|服务已确认完成|消息已删除' miniprogram/pages`
Expected: 未开放模块没有假成功文案。

- [ ] **Step 6: 提交**

```bash
git add miniprogram/utils/preview-mode.js miniprogram/pages/service/index.js miniprogram/pages/service/index.wxml miniprogram/pages/service/index.wxss miniprogram/pages/activity-detail/index.js miniprogram/pages/activity-detail/index.wxml miniprogram/pages/activity-detail/index.wxss miniprogram/pages/activity-publish/index.js miniprogram/pages/activity-publish/index.wxml miniprogram/pages/activity-publish/index.wxss miniprogram/pages/service-detail/index.js miniprogram/pages/service-detail/index.wxml miniprogram/pages/service-detail/index.wxss miniprogram/pages/borrow/index.js miniprogram/pages/borrow/index.wxml miniprogram/pages/borrow/index.wxss miniprogram/pages/item-detail/index.js miniprogram/pages/item-detail/index.wxml miniprogram/pages/item-detail/index.wxss miniprogram/pages/item-publish/index.js miniprogram/pages/item-publish/index.wxml miniprogram/pages/item-publish/index.wxss miniprogram/pages/roommate/index.js miniprogram/pages/roommate/index.wxml miniprogram/pages/roommate/index.wxss miniprogram/pages/messages/index.js miniprogram/pages/messages/index.wxml miniprogram/pages/messages/index.wxss miniprogram/pages/profile/index.js miniprogram/pages/profile/index.wxml miniprogram/pages/profile/index.wxss tests/preview-mode.test.js logs/2026-07-20-preview-mode.md
git commit -m "fix: make unfinished modules preview only"
```

---

### Task 8: 全量验证、交接与部署清单

**Files:**
- Modify: `EXECUTION-PLAN.md`
- Modify: `PROJECT-HANDOFF.md`
- Create: `logs/2026-07-20-mvp-launch-verification.md`

**Interfaces:**
- Produces: 审核前可逐项勾选的部署与真机验收清单。

- [ ] **Step 1: 运行全量自动检查**

```bash
node --test tests/*.test.js
find miniprogram cloudfunctions/rencai -name '*.js' -type f -print0 | xargs -0 -n1 node --check
node -e 'const fs=require("fs"),cp=require("child_process"); const files=cp.execFileSync("find",["miniprogram","cloudfunctions/rencai","-name","*.json","-type","f"]).toString().trim().split(/\n/).filter(Boolean); for(const f of files) JSON.parse(fs.readFileSync(f,"utf8")); console.log(`JSON_OK ${files.length}`);'
git diff --check
```

- [ ] **Step 2: 验证页面文件完整性和 Mock/假成功扫描**

检查 `app.json` 每个页面的 JS/JSON/WXML/WXSS；扫描公开房源链路不得引用 `queries`；扫描未开放写操作不得调用写函数。

- [ ] **Step 3: 微信开发者工具手工验收**

- iPhone SE 和 iPhone 15：首页→公寓→平面图→更多→户型→地图。
- 管理员：公寓/户型 CRUD、封面上传、平面图顺序、地址定位。
- CSV：模板→地址导入→预览→确认→导出→再导入。
- 普通用户：管理员 action 返回 forbidden。
- 未开放模块：保留入口、显示预览态、所有写按钮不产生成功结果。

- [ ] **Step 4: 云端部署清单**

部署 `rencai` 云函数（云端安装依赖），确认环境 ID、地图 Key、管理员 role、集合与数据库权限；重新编译并上传体验版。任何云端步骤未实际执行时必须在日志中标记“待用户操作”，不得声称完成。

- [ ] **Step 5: 更新文档并提交**

```bash
git add EXECUTION-PLAN.md PROJECT-HANDOFF.md logs/2026-07-20-mvp-launch-verification.md
git commit -m "docs: record mvp launch verification"
```
