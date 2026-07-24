# 项目级 Ponytail Plugin 安装记录

日期：2026-07-19

## 本次改动

- 新增项目隔离的 Codex 状态目录 `.codex-local/`，用于保存本项目专属的 Marketplace、Plugin 与运行元数据。
- 将 `.codex-local/` 加入 `.gitignore`，避免本机插件缓存进入 Git。
- 添加 Marketplace：`DietrichGebert/ponytail`。
- 安装 Plugin：`ponytail@ponytail`。
- 已安装版本：`4.8.4`。

## 安装位置

```text
.codex-local/plugins/cache/ponytail/ponytail/4.8.4
```

## 验证结果

- 使用项目隔离状态目录执行 `codex plugin marketplace list --json`，已识别 Marketplace `ponytail`。
- 使用项目隔离状态目录执行 `codex plugin list --json`，显示 `ponytail@ponytail` 已安装并启用，版本为 `4.8.4`。
- 使用默认全局 Codex 状态执行 `codex plugin list --json`，未发现 `ponytail@ponytail`，确认没有安装到全局 Codex 目录。
- `git status` 未显示 `.codex-local/`，确认本地插件文件已被忽略。

## 项目内使用方式

运行 Codex CLI 时，将 `CODEX_HOME` 指向项目目录中的 `.codex-local`：

```bash
CODEX_HOME="$PWD/.codex-local" codex
```

对应的安装命令为：

```bash
CODEX_HOME="$PWD/.codex-local" codex plugin marketplace add DietrichGebert/ponytail
CODEX_HOME="$PWD/.codex-local" codex plugin add ponytail@ponytail
```
