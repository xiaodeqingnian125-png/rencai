# 修复云登录失败：云函数返回格式不一致 + db.serverDate() 序列化

> 时间：2026-07-19
> 关联日志：2026-07-19-cloud-login-fix.md、2026-07-19-cloud-deploy-and-bugfix.md

## 现象

开发者工具控制台出现关键证据：

```
[login] 登录失败: <Undefined> <Undefined>
位置：app.js:163
调用栈显示 wx.cloud.callFunction 进入了 success 回调
```

- `result` 存在（通过了 `if (!result)` 检查）
- `result.ok` 为 falsy（进入了错误分支）
- `result.code` 和 `result.message` 均为 undefined

## 根因

两条并行根因，任一触发都会导致「登录失败」且无具体错误信息：

### 根因 A：云函数总 catch 返回旧格式（最可能）

`cloudfunctions/rencai/index.js` 的总 catch 与 `default` 分支返回：

```js
{ ok: false, error: err.message || String(err), action }
```

只有 `error` 字段，没有 `code` / `message`。

而 `miniprogram/app.js` 的 `loginWithCloud` 在错误分支中只读取 `result.code` / `result.message`：

```js
code: result.code || "login_user_failed",
message: result.message || "登录失败"
```

两者格式不匹配 → `result.code` / `result.message` 为 undefined → 前端打印 `<Undefined> <Undefined>` → toast 退化为「登录失败」。

触发条件：`loginUser` 内部任何未被内层 try/catch 捕获的异常（或旧版云函数未做内层 try/catch，users 集合不存在时直接抛错进入总 catch）。

### 根因 B：loginUser 新建用户返回 db.serverDate() 命令对象

`loginUser` 新建用户分支原实现：

```js
const newUser = {
  ...,
  created_at: db.serverDate(),  // 命令对象
  updated_at: db.serverDate()    // 命令对象
};
await userCol.add({ data: newUser });
return { ok: true, user: newUser, isNew: true };
```

`db.serverDate()` 返回的是服务端命令对象（非真实日期）。当它作为云函数返回值的一部分经 `wx.cloud.callFunction` 序列化回传前端时，可能导致 result 字段异常或整体序列化失败，前端拿到的 `result` 可能为空或字段错乱。

## 修改内容

### 1. `miniprogram/app.js`

`loginWithCloud` 的 `wx.cloud.callFunction.success` 回调：

- 在回调最前面增加完整返回日志：

```js
console.error("[login] loginUser完整返回：", JSON.stringify(cfRes && cfRes.result));
```

- 空结果错误码从 `invalid_result` 改为 `empty_cloud_result`，提示语改为「云函数没有返回有效结果」。

- 错误分支兼容旧格式：当云函数返回 `{ ok:false, error:"..." }`（无 code/message）时，前端保留并展示 `result.error`，不再变成 undefined：

```js
code: result.code || (result.error ? "cloud_action_failed" : "login_user_failed"),
message: result.message || result.error || "登录失败"
```

### 2. `cloudfunctions/rencai/index.js`

- 总 catch 返回格式统一为 `code` + `message`：

```js
return { ok: false, code: "cloud_action_failed", message: err.message || String(err), action };
```

- `default` 分支同步：

```js
return { ok: false, code: "unknown_action", message: `未知 action: ${action}`, action };
```

- `loginUser` 新建用户分支不再返回 `db.serverDate()` 命令对象：写入数据库的 `newUser` 仍带 `db.serverDate()`（由数据库服务端填充实际时间），但返回给前端的对象改为 `safeUser`，不含 `created_at` / `updated_at` 字段，避免命令对象经序列化导致前端 result 异常。

### 3. `miniprogram/components/login-modal/index.js`

`mapLoginErrorToToast` 新增两个错误码映射：

- `empty_cloud_result` → 「云函数返回异常，请重试」（与原 `invalid_result` 合并）
- `cloud_action_failed` → 「云函数执行异常，请重试」

## 未修改范围

- `getPhoneByCode` 仍用旧格式 `{ ok:false, error }`：该函数由 login-modal 单独处理（失败时降级为手动输入手机号），不在 `app.login()` 登录链路上，不影响当前问题。
- `import-task.js` 的旧格式返回：CSV 导入流程，不影响登录。
- `restoreLoginWithCloud`：不在本次修复范围。后续可统一加 `result.error` 兼容。
- 未修改任何页面样式，未切换回 mock。

## 验证

- 语法检查：`node -c` 对 `miniprogram/app.js`、`miniprogram/components/login-modal/index.js`、`cloudfunctions/rencai/index.js` 全部通过。
- 需要在微信开发者工具中重新部署 `rencai` 云函数后进行真实登录验证。

## 部署与验证步骤（用户操作）

1. 在微信开发者工具中，右键 `cloudfunctions/rencai` → 「上传并部署：云端安装依赖」。
2. 部署完成后，在小程序中重新尝试登录。
3. 观察开发者工具控制台：
   - 应出现 `[login] loginUser完整返回：{...}` 日志，显示云函数实际返回内容。
   - 如果登录成功：根因确认是 db.serverDate() 序列化问题或旧版云函数。
   - 如果仍失败：日志会显示具体的 `code` / `message`（或 `error`），可据此判断是 `users_collection_missing`、`cloud_action_failed` 还是其他。
4. 检查云开发控制台 → 数据库 → `users` 集合是否有新记录产生。
   - 有记录：说明写入成功，问题在返回值序列化（根因 B 已修复）。
   - 无记录：查看云函数日志中的真实数据库错误。
5. 如出现 `users_collection_missing`，在云开发控制台调用 `rencai` 云函数，参数 `{ "action": "initCloud" }` 初始化数据库。
