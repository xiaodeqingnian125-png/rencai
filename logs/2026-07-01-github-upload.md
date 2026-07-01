# GitHub 仓库配置与上传

## 本次改动

- 新增 `.gitignore`，排除 macOS 临时文件、微信开发者工具私有配置、依赖目录和常见构建产物。
- 准备将项目初始化为 Git 仓库，并关联 GitHub 远程仓库 `https://github.com/xiaodeqingnian125-png/rencai.git`。

## 说明

- `project.config.json` 保留在版本库中，便于微信开发者工具打开项目。
- `project.private.config.json` 属于本地私有配置，已加入忽略规则，不随仓库上传。
