# CLAUDE.md

本文件为 Claude Code 提供项目级指令。项目原生指令仍以 `AGENTS.md` 为准，本文件仅补充 gstack 相关约定。

## gstack

本项目已在 `.claude/skills/` 目录安装 gstack 工具集（项目本地安装，未写入用户全局目录）。

### 网页浏览规则（必须遵守）

- **所有网页浏览一律使用 gstack 的 `/browse` 技能**，不要使用 `mcp__claude-in-chrome__*` 系列工具。
- 如需连接本机 Chrome（复用登录态、Cookie 等），使用 `/connect-chrome` 技能，而非 `mcp__claude-in-chrome__*`。
- 浏览器二进制由 gstack 自带的 Playwright Chromium 提供，路径：`.claude/skills/gstack/browse/dist/browse`。

### 可用技能

以下技能已注册，可通过斜杠命令调用：

`/office-hours`、`/plan-ceo-review`、`/plan-eng-review`、`/plan-design-review`、`/design-consultation`、`/design-shotgun`、`/design-html`、`/review`、`/ship`、`/land-and-deploy`、`/canary`、`/benchmark`、`/browse`、`/connect-chrome`、`/qa`、`/qa-only`、`/design-review`、`/setup-browser-cookies`、`/setup-deploy`、`/setup-gbrain`、`/retro`、`/investigate`、`/document-release`、`/document-generate`、`/codex`、`/cso`、`/autoplan`、`/plan-devex-review`、`/devex-review`、`/careful`、`/freeze`、`/guard`、`/unfreeze`、`/gstack-upgrade`、`/learn`

### 维护

- 升级 gstack：运行 `/gstack-upgrade`，或在 `.claude/skills/gstack` 目录执行 `git pull && ./setup --no-team`。
- 重新生成技能文档：在 `.claude/skills/gstack` 目录执行 `bun run gen:skill-docs --host claude`。
- 当前安装模式：项目本地（`--no-team`），未启用团队模式与 gbrain。
