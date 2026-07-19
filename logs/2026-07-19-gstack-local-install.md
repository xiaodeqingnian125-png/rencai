# 2026-07-19 gstack 项目本地安装

## 任务

将 gstack 工具集安装到当前人才开发项目的 `.claude/skills/` 目录（项目本地，非用户全局），并配置 CLAUDE.md。

## 改动文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `.claude/skills/gstack/` | 新增（git 忽略） | gstack 仓库（`git clone --single-branch --depth 1`） |
| `.claude/skills/` 下 55 个技能目录 | 新增（git 忽略） | setup 创建的符号链接，指向 gstack |
| `CLAUDE.md` | 新增 | 项目根目录，含 gstack 部分 |
| `.gitignore` | 修改 | 追加 `.claude/skills/` 忽略规则 |

## 安装过程

1. **克隆仓库**：`git clone https://github.com/garrytan/gstack.git` 到项目 `.claude/skills/gstack`（最新 main 分支，commit `a325940`）。

2. **安装 bun**：setup 脚本硬性依赖 bun（构建 browse 二进制 + 生成 skill 文档）。通过 `brew install bun` 安装 bun 1.3.14。

3. **Playwright Chromium 下载问题**：setup 内置的 `bunx playwright install chromium` 因国内访问 `storage.googleapis.com` 受阻而卡住。改用 curl 直接下载 Chrome for Testing 145.0.7632.6（mac-arm64）的两个 zip：
   - `chrome-mac-arm64.zip`（162MB）→ 解压到 `~/Library/Caches/ms-playwright/chromium-1208/`
   - `chrome-headless-shell-mac-arm64.zip`（91MB）→ 解压到 `~/Library/Caches/ms-playwright/chromium_headless_shell-1208/`
   - 用 `xattr -cr` 移除隔离属性后，Playwright 成功启动 Chromium。

4. **运行 setup**：在 `.claude/skills/gstack` 目录执行 `./setup --no-team`。
   - `--no-team`：禁用团队模式（用户选择保持本地安装，不提交 git）。
   - setup 自动检测到 gstack 已位于 `skills/` 目录内，走项目本地安装分支（无需 `--local` 标志）。
   - 构建了 browse 二进制（`.claude/skills/gstack/browse/dist/browse`，63MB）。
   - 生成 `.agents/skills/` 下 55 个技能文档，并链接到 `.claude/skills/`。
   - 生成 `llms.txt`（55 skills, 76 browse commands）。
   - 输出 `gstack ready (claude).`，EXIT_CODE=0。

## 验证结果

- 55 个 skills 已链接到项目 `.claude/skills/`（browse、office-hours、ship、review、qa、investigate、plan-eng-review 等均存在）。
- browse 二进制可执行，Playwright Chromium 可正常启动。
- `git check-ignore` 确认 `.claude/skills/` 被忽略，CLAUDE.md 可正常提交。

## CLAUDE.md 内容

在项目根目录新建 CLAUDE.md，包含 gstack 部分：
- 网页浏览规则：所有浏览用 `/browse`，禁用 `mcp__claude-in-chrome__*`。
- 列出 35 个可用斜杠命令。
- 维护说明：升级用 `/gstack-upgrade` 或 `git pull && ./setup --no-team`。

## 用户决策

用户选择「保持本地安装，不提交 git」：
- `.claude/skills/` 加入 `.gitignore`，仅作为本地开发工具。
- CLAUDE.md 仍可提交（独立文件，不在 `.claude/` 下）。
- 未启用 `--team` 模式的自动更新 hook。

## 注意事项

- gstack 目录体积较大（含 node_modules、browse 二进制、Playwright Chromium 缓存等），不宜提交 git。
- 如需升级 gstack：`cd .claude/skills/gstack && git pull && ./setup --no-team`。
- 如需重新生成技能文档：`cd .claude/skills/gstack && bun run gen:skill-docs --host claude`。
- Playwright Chromium 缓存在 `~/Library/Caches/ms-playwright/`（用户全局），不在项目目录内。
- bun 通过 Homebrew 安装在 `/opt/homebrew/Cellar/bun/1.3.14/`（用户全局）。
