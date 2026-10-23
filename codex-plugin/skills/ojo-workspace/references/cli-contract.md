# `@touchine/ojo` CLI contract

The plugin targets the public npm package `@touchine/ojo` and currently supports CLI versions `>=1.0.9 <2.0.0`.

Install the known supported release:

```bash
npm install -g @touchine/ojo@1.0.9
```

Then run the plugin's `scripts/check-ojo-cli.mjs`. Set `OJO_CLI_BIN` when the executable is not named `ojo` or is not on `PATH`.

## Enabled commands

```bash
ojo --version
ojo auth login --mode web --no-open --json
ojo workspace sync [projectRef] --path <dir> --json
ojo project import <workspacePath> --name <name> --team-id <id> --json
ojo project import <workspacePath> --project-id <id> --json
ojo project team list --json
ojo project team get <projectId> --json
ojo project team set <projectId> --team-id <id> --json
ojo conversion report <eventFile> --json
ojo chat --message <message> --project-id <projectId> --json
ojo query --project-id <projectId> --json
ojo screen --project-id <projectId> --json
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

The CLI does not provide the plugin with `capabilities`, `prototype validate`, `prototype build`, `prototype publish`, `workspace dev`, or `workspace publish-resources`. Do not call these commands or claim their protocols passed.

## Authentication

Follow [CLI and API only](transport-policy.md). Prefer:

```bash
ojo auth login --mode web --no-open --json
```

Give the emitted URL to the user for manual completion and keep the process alive until authentication finishes. Never read or copy tokens. Use the same environment variables for login and the operation being retried.

## Visual verification

The plugin does not start a local Irise Web canvas or use browser automation. Report local artifact checks, CLI/API readback, and visual verification as separate outcomes.
