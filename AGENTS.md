# AGENTS.md

## Product

这是一个微信小程序社区产品，名称为“晓得青年。

## 设计稿

参考 rencai-ui 文件夹中的设计稿：

app-admin-activities.html
app-admin-apartments.html
app-admin-comments.html
app-admin-items.html
app-admin-rooms.html
app-admin-services.html
app-admin-users.html
app-borrow.html
app-community.html
app-detail.html
app-favorites.html
app-guide.html
app-home.html
app-map.html
app-messages.html
app-my-comments.html
app-profile-edit.html
app-profile.html
app-room-detail.html
app-roommate.html
app-service.html

设计稿仅作为视觉和交互参考，最终实现需使用微信小程序原生能力，不直接嵌入 HTML 页面。

## 技术约束

- 使用微信小程序原生开发方式：WXML、WXSS、JavaScript 或 TypeScript
- 不主动引入第三方库
- 不使用 WebView / web-view 承载 HTML 设计稿
- 首页底部导航使用微信小程序原生 tabBar 配置
- 页面状态优先使用页面自身的 data 和 setData
- 公共状态可使用 app.globalData 或轻量模块管理，避免过度设计
- 样式使用 WXSS 实现，注意适配不同 iPhone 屏幕尺寸
- 图片、图标等静态资源放入项目约定的 assets 目录

## 交付要求

- 使用微信小程序原生组件实现，不使用 web-view 承载 HTML
- 每次任务完成时，将本次改动以 markdown 格式写入 logs 文件夹
- 确保在微信开发者工具中可编译运行
- 优先检查 iPhone 尺寸模拟器下的显示效果
- 运行过程中产生的临时文件不要放入 git