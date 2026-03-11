# ojo-plugin

VS Code extension for Ojo integration.

## Commands

- `Ojo: Open Web (Sync Login)` (`ojo-plugin.openWeb`)
  - Reads CLI auth state from `~/.ojo/session.json`.
  - If auth state is valid, requests `/api/auth/v1/create_ide_handoff` and opens the login bridge URL with `ticket`.
  - If auth state is missing/invalid or handoff fails, opens the target web URL directly.

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
