# GitHub 仓库配置与上传

## 本次改动

- 新增 `.gitignore`，排除 macOS 临时文件、微信开发者工具私有配置、依赖目录和常见构建产物。
- 将项目初始化为 Git 仓库，并关联 GitHub 远程仓库。
- HTTPS 推送因命令行缺少有效 GitHub token 未完成，已改为 SSH remote：`git@github.com:xiaodeqingnian125-png/rencai.git`。
- 已生成本机 SSH key：`/Users/xiaode/.ssh/id_ed25519_github_rencai`，等待将公钥添加到 GitHub 后继续推送。
- 上传前纳入当前工作区的地图页定位权限、地图 pin 图标等最新文件状态。

## 说明

- `project.config.json` 保留在版本库中，便于微信开发者工具打开项目。
- `project.private.config.json` 属于本地私有配置，已加入忽略规则，不随仓库上传。
