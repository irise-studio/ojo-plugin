# OJO CLI contract

Use `node <plugin>/scripts/check-ojo-cli.mjs` to select a compatible CLI. The primary executable comes from `OJO_CLI_BIN` or `PATH`. Next CLI 2.x must report capability schema 2, generation `next`, and service API `server.v1`. Stable 1.x must be at least 1.0.9. Both must pass the shared command checks.

```bash
npm install -g @touchine-ai/ojo@latest
```

ZIP import and Team operations use a separate check, `node <plugin>/scripts/check-ojo-cli.mjs --legacy-import`. If the primary CLI is next, point `OJO_LEGACY_CLI_BIN` to the JavaScript entry of a compatible 1.x installation. See [legacy import](legacy-import.md) for side-by-side setup. Use the exact executable returned as `command`.

## Shared commands

```bash
ojo --version
ojo auth login --mode web --no-open --json
ojo workspace sync [projectRef] --path <dir> --json
ojo conversion report <eventFile> --json
ojo chat --message <message> --project-id <projectId> --json
ojo query --project-id <projectId> --json
ojo screen --project-id <projectId> --json
```

## Legacy import and Team commands

```bash
ojo project import <workspacePath> --name <name> --team-id <id> --json
ojo project import <workspacePath> --project-id <id> --json
ojo project team list --json
ojo project team get <projectId> --json
ojo project team set <projectId> --team-id <id> --json
```

Verify help before dispatch because an unknown nested command can print parent help and exit successfully.

## Responsibility boundaries

- `workspace sync` downloads the selected workspace. It does not validate or build it.
- Local validation and builds use the export's checked-in package scripts and lockfile.
- `project import` expects an already built OJO export. It can upload to an explicit empty project or create a new project when authorized.
- `project team` commands resolve, read, and update the selected Team.
- `chat` and `query` operate on the explicit remote project. Chat without a project ID may create one.
- `conversion report` sends only the bounded preflight telemetry event.
- `screen` retrieves the supported project preview artifact; it is not browser verification.

The next CLI exposes additional prototype commands, but the plugin keeps the export-native build checks and the separate legacy ZIP import flow. A next CLI capability check does not validate publication, canvas, or remote access.

## Authentication

Follow [CLI and API only](transport-policy.md). Prefer:

```bash
ojo auth login --mode web --no-open --json
```

Give the emitted URL to the user for manual completion and keep the process alive until authentication finishes. Never read or copy tokens. Use the same environment variables for login and the operation being retried.

## Visual verification

The plugin does not start a local Irise Web canvas or use browser automation. Report local artifact checks, CLI/API readback, and visual verification as separate outcomes.
