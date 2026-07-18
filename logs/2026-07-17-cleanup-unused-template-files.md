# 清理未使用的模板文件与图片

## 日期
2026-07-17

## 背景
项目中保留了微信云开发模板自带的示例页面（example）、云函数提示弹窗组件（cloudTipModal）以及一批配套截图/图标。这些资源未注册在 `app.json` 中，也未被任何实际业务页面引用，属于冗余文件，需清理以减小包体积。

## 变更范围

### 1. 删除整个 `pages/example/` 目录
模板示例页，未注册在 `app.json` 的 pages 列表中。
- `pages/example/index.js`
- `pages/example/index.json`
- `pages/example/index.wxml`
- `pages/example/index.wxss`

### 2. 删除整个 `components/cloudTipModal/` 目录
云开发模板的提示弹窗组件，仅被已删除的 example 页面引用。
- `components/cloudTipModal/index.js`
- `components/cloudTipModal/index.json`
- `components/cloudTipModal/index.wxml`
- `components/cloudTipModal/index.wxss`

### 3. 删除未使用的模板图片（仅被 example 页或云开发模板使用）
位于 `images/` 目录下：
- `images/create_cbr.png`
- `images/create_cbrf.png`
- `images/ai_example1.png`
- `images/ai_example2.png`
- `images/env-select.png`
- `images/database.png`
- `images/create_env.png`
- `images/function_deploy.png`
- `images/database_add.png`
- `images/scf-enter.png`
- `images/cloud_dev.png`
- `images/copy.svg`
- `images/avatar.png`
- `images/default-goods-image.png`
- `images/arrow.svg`

### 4. 删除整个 `images/icons/` 目录
仅被 cloudTipModal 与 example 使用，随上述文件一并删除：
- `images/icons/avatar.png`
- `images/icons/business-active.png`
- `images/icons/business.png`
- `images/icons/close.png`
- `images/icons/copy.png`
- `images/icons/customer-service.svg`
- `images/icons/examples-active.png`
- `images/icons/examples.png`
- `images/icons/goods-active.png`
- `images/icons/goods.png`
- `images/icons/home-active.png`
- `images/icons/home.png`
- `images/icons/question.svg`
- `images/icons/setting.svg`
- `images/icons/share.svg`
- `images/icons/usercenter-active.png`
- `images/icons/usercenter.png`

### 5. 删除整个 `images/` 目录
上述文件删除后 `images/` 目录已无业务内容（仅剩 macOS 的 `.DS_Store`），整个目录一并移除。

## 验证

### 引用安全性检查（删除前）
通过全局检索确认：
- `pages/example/` 未出现在 `app.json` 的 pages 列表；
- `cloudTipModal` 仅被 `pages/example/index.json` 引用；
- 待删图片仅出现在 `pages/example/index.wxml`；
- `images/icons/` 仅出现在 `components/cloudTipModal/index.wxml`。

均未被任何实际业务页面引用，删除安全。

### 删除后结构检查
- `components/` 目录仅保留 `login-modal` 组件；
- `assets/` 目录及其子目录（含 `assets/tabbar/`）完整保留，未受影响；
- `miniprogram` 目录大小：**5.6M**（`du -sh` 确认）。

## 保留说明
- `assets/` 目录下所有文件均保留，未做任何改动；
- `assets/tabbar/` 的 10 个 tabBar 图标全部完好。
