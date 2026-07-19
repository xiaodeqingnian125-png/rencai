# 2026-07-20 平面图上传后保存丢失修复

## 现象

管理员编辑公寓时，平面图上传后可在上传控件内看到预览；保存并再次打开编辑框后，平面图列表为空。

## 根因

平面图上传控件是自定义组件。它仅在 `change` 事件中返回图片路径，父页面则依赖组件事件的 `data-index` 定位平面图行。该索引不是组件事件的可靠传递契约：父页面可能无法获得它，因此图片只停留在组件内部预览状态，未写入父表单的 `floor_plans[index].image`，保存请求最终没有有效平面图数据。

## 修复

- `image-uploader` 新增 `index` 属性，并在上传、替换、移除时把行号作为 `change.detail.index` 回传。
- 公寓编辑页把循环行号显式传入上传组件，并优先读取 `detail.index` 写回父表单。
- 保留原 `dataset.index` 作为兼容回退。

## 验证

- 新增回归测试，覆盖“上传组件回传行号后父表单保存对应图片路径”。
- `node --test tests/admin-cloud-crud.test.js`：7/7 通过。
- `node --test tests/floor-plans.test.js`：4/4 通过。
- 修改文件已通过 Node 语法检查与 `git diff --check`。
