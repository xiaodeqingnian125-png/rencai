# queries.js 适配 apartment_code

## 背景

任务 3 已在 `miniprogram/data/tables.js` 中为公寓（apartments）和户型（roomTypes）数据新增 `apartment_code` 字段（如 A001、A002 等），作为公寓的稳定业务编号。本任务负责让 `miniprogram/data/queries.js` 的转换函数将该字段透传到前端页面所需的数据结构中，确保页面层能拿到 `apartment_code`。

## 改动文件

- `miniprogram/data/queries.js`

## 改动内容

### 1. `roomToPage(room)` 新增 `apartment_code`

在返回对象中 `id` 之后、`legacyRoomId` 之前新增一行：

```javascript
apartment_code: room.apartment_code || "",
```

这样所有依赖 `roomToPage` 的出口（如 `apartmentToDetail` 内 `rooms` 数组、`getRoomById` 返回的 `room` 对象）都会带上 `apartment_code`。

### 2. `apartmentToDetail(apartment)` 新增 `apartment_code`

在返回对象中 `id` 之后、`name` 之前新增一行：

```javascript
apartment_code: apartment.apartment_code || "",
```

这样 `getApartments`、`getApartmentById`、`getRoomById` 返回的 `apartment` 对象都会带上 `apartment_code`。

## 字段命名说明

简报明确要求输出对象使用 `apartment_code`（snake_case）作为键名，与 `tables.js` 源字段及 `pages/admin/index.js` 的 CSV 导入导出逻辑保持一致。虽然 `queries.js` 中既有字段命名混用 camelCase（如 `legacyRoomId`、`aptId`、`imageClass`），但本字段按简报要求保留 snake_case，以便与 CSV 外键语义对齐。

## 兼容性

- 使用 `apartment.apartment_code || ""` 兜底，避免旧数据缺失字段时出现 `undefined`。
- 其余字段保持不变，不影响已有页面渲染。

## 验证

- 语法检查：`node -c miniprogram/data/queries.js` 通过（无输出）。
- 运行时抽查：`getApartmentById(1).apartment_code === "A001"`，`getRoomById(1, 101).room.apartment_code === "A001"`，`getApartmentById(1).rooms[0].apartment_code === "A001"`，均符合预期。

## 提交

- commit: `6338d47 feat(queries): apartmentToDetail/roomToPage 适配 apartment_code`
- 分支：`feat/csv-import-export`
