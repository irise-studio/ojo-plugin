# ojo-plugin

VS Code extension for Ojo integration.

This repository also distributes the OJO Codex plugin from `codex-plugin/`.

## Codex plugin

Add the repository marketplace:

```bash
codex plugin marketplace add irise-studio/ojo-plugin --ref main
```

Open `/plugins`, choose **Irise Studio**, install **OJO**, and start a new
task. The plugin requires Node.js 20 or newer and a compatible OJO CLI available
as `ojo` on `PATH` or through `OJO_CLI_BIN`.

The Codex plugin's local Irise Web canvas startup and preview are temporarily
disabled. Conversion, workspace synchronization, local validation/build,
explicitly authorized publication, and verified remote chat/query remain
available.

## Commands

- `Ojo: Open Project (Built-in Browser)` (`ojo-plugin.openWeb`)
  - Click from status bar `$(globe) Ojo` or activity bar `Ojo` icon.
  - Shows a project picker (loaded via `ojo project list --json --page-size 100`).
  - Selecting a project opens `/p/{projectId}` in IDE built-in browser.
  - If project list fetch fails or returns empty, falls back to manual Project ID input.
  - Reads CLI auth state from `~/.ojo/session.json`.
  - If auth state is valid, requests `/api/auth/v1/create_ide_handoff` and opens the login bridge URL with `ticket`.
  - If auth state is missing/invalid or handoff fails, opens the target web URL directly.
  - Launch URL includes IDE context query params: `ide_in_app`, `ide_client`, `ide_local_server`, `ide_sync_token`.

## CLI Auth State Contract

Global file path:

- `~/.ojo/session.json`

Expected JSON fields:

- `session_id` (string, required)
- `user_id` (string, required)
- `created_at_ms` (number, required)
- `expires_at_ms` (number, required)
- `source` (string, required, e.g. `cli`)

Invalid JSON, missing fields, or expired `expires_at_ms` means "no auth state" and no ticket injection.

## 内置浏览器与链接打开

扩展会将 `productUriGlobs` 中匹配的 URL（如 `https://aneway.ai/**`、`https://ojo.art/**`）配置为在 IDE 内置浏览器中打开，包括：

- **终端**：终端中的匹配链接点击后在内置浏览器打开
- **右侧面板（Chat/Composer）**：使用 `registerExternalUriOpener`（proposed API）拦截链接，在内置浏览器打开

右侧面板支持需要启用 proposed API。调试时在 `.vscode/launch.json` 中已配置 `--enable-proposed-api`。在 Cursor 中若需此功能，可添加启动参数：

```
--enable-proposed-api=undefined_publisher.ojo-plugin
```

## Settings

- `ojoPlugin.accountApiBaseUrl`: account API base URL for `create_ide_handoff`.
- `ojoPlugin.webBaseUrl`: web app base URL.
- `ojoPlugin.productUriGlobs`: URI 模式列表，匹配的链接在内置浏览器中打开（如 `https://aneway.ai/**`）。
- `ojoPlugin.webTargetPath`: fallback target path to open.
- `ojoPlugin.loginBridgePath`: bridge path for ticket consumption.
