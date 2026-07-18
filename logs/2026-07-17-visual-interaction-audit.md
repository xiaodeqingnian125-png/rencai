# 2026-07-17 全量视觉与交互验收修复

## 背景

按 EXECUTION-PLAN.md 阶段二验收标准，对照设计稿逐页检查色值/间距/圆角/字体/动画/触控反馈。发现核心问题集中在交互动画层面：`:active` 缩放缺少 `transition` 导致硬跳，弹窗无入场动画，缓动曲线不统一（`ease`/`0.16s`/`0.18s`/`160ms` 混用），部分标题字重为 600 而设计稿要求 700。

## 改动范围

### 全局样式（app.wxss）

新增 4 组全局动画工具类，供所有页面复用：
- `@keyframes sheet-slide-up` + `.sheet-enter` — 底部弹窗从底部滑入 + 淡入，220ms
- `@keyframes overlay-fade-in` + `.overlay-enter` — 遮罩层淡入，150ms
- `@keyframes center-pop-in` + `.center-pop-enter` — 居中弹窗缩放淡入，220ms
- `.tap-feedback` / `.btn-feedback` / `.tab-indicator` / `.input-focus` / `.btn-disabled` — 触控反馈与状态过渡工具类

所有动画统一使用 `cubic-bezier(0.28, 0, 0.22, 1)`（与设计稿 `--ease-standard` 一致），时长统一为 150ms（快速反馈）/ 220ms（标准过渡）。

### 缓动曲线统一

将全项目 9 处非标准缓动曲线统一替换：
- `0.16s ease` → `150ms cubic-bezier(0.28, 0, 0.22, 1)`
- `0.18s ease` → `150ms cubic-bezier(0.28, 0, 0.22, 1)`
- `160ms ease` → `150ms cubic-bezier(0.28, 0, 0.22, 1)`
- `220ms ease` → `220ms cubic-bezier(0.28, 0, 0.22, 1)`

涉及文件：favorites、community、profile-edit、map、guide、roommate（共 9 处）

### 触控反馈补全

为所有 `:active { transform: scale(...) }` 选择器补全 `transition`，消除按下时的硬跳：

| 页面 | 修复内容 |
|------|---------|
| 首页 | quick-entry/apt-card 加 transition，filter-btn/filter-option 加状态过渡 |
| 服务页 | activity-card/service-card 加 transition |
| 公寓详情 | room-card 加 transition |
| 借个锤子 | item-card/float-pub 加 transition，cat-chip 加状态过渡 |
| 找室友 | type-tab/post-card/float-pub transition 替换为标准曲线 |
| 登录组件 | login-btn/login-cancel 加触控反馈，field-input 加获焦边框过渡 |

### 弹窗入场动画

为全部 7 个页面的底部弹窗和遮罩加入场动画：

| 页面 | 弹窗 |
|------|------|
| 公寓详情 | 评论弹窗 + 遮罩 |
| 消息页 | 消息详情弹窗 + 遮罩 |
| 找室友 | 发帖弹窗 + 详情弹窗 + 遮罩 |
| 活动详情 | 报名表单弹窗 + 遮罩 |
| 物品详情 | 借用申请弹窗 + 遮罩 |
| 服务详情 | 下单弹窗 + 遮罩 |
| 登录组件 | 居中登录弹窗（缩放淡入）+ 遮罩 |

### 字重修正

将标题级文字字重从 600 修正为 700（与设计稿一致）：
- 首页：slogan-text、apt-card-name、apt-card-price
- 服务页：section-hd-title、activity-title、service-name

## 验证

- `grep` 搜索全项目 wxss：无遗留的非标准 `ease` 缓动曲线
- 全量 JS 语法检查通过
- 所有 `:active` 缩放均有配套 `transition`
- 所有底部弹窗均有 `sheet-slide-up` 动画
- 所有遮罩均有 `overlay-fade-in` 动画
