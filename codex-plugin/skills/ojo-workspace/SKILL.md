---
name: ojo-workspace
description: Use OJO CLI authentication and verified APIs to synchronize an OJO workspace, import an explicitly authorized validated prototype, manage its Team, or run user-requested remote OJO chat and status queries. Local Irise Web canvas startup and localhost preview are disabled. Route non-OJO local website optimization through convert-to-ojo first.
---

# OJO Workspace

Follow [CLI and API only](references/transport-policy.md) for all operations. Browser automation is prohibited, including login, Team setup, remote response retrieval, and visual verification.

## Supported CLI

Run the bundled `../../scripts/check-ojo-cli.mjs` and use the exact executable in its `command` field. It accepts only `@touchine-ai/ojo` 2.x with server.v1 capabilities. Select the primary CLI with `OJO_CLI_BIN` when needed.

For a missing primary CLI:

```bash
npm install -g @touchine-ai/ojo@latest
```

For publication run the same checker with `--import`. It verifies empty-project creation and prototype publication on the same next CLI. A missing command stops remote publication.

See [CLI contract](references/cli-contract.md) for the enabled command surface.

## Route local optimization

1. Inspect the selected source read-only.
2. Route non-conforming projects to [convert-to-ojo](../convert-to-ojo/SKILL.md), and conforming prototypes to [build-irise-prototype](../build-irise-prototype/SKILL.md).
3. Keep export-native build/package evidence, remote CLI/API readback, and unavailable visual verification separate.
4. For remote proposals or execution, follow [remote chat](references/remote-chat.md) and preserve any proposal-before-execution boundary.

## Synchronize

Download an explicit project's workspace with:

```bash
ojo workspace sync <projectId> --path <localParent> --json
```

Treat sync as read-only with respect to the server. Inspect and validate the downloaded manifests with the export's own scripts and the build skill before editing.

If an operation returns `AUTH_REQUIRED`, follow the no-auto-open login flow in [transport policy](references/transport-policy.md), let the user complete authentication, and retry once. Keep credentials inside the CLI.

## Import or update a project

Follow [new-framework publication](references/project-import.md) for an explicitly authorized upload. Require a successful `--import` check before remote writes. Use `project create --name <name> --json` for an authorized new target, record the returned ID, then `prototype publish <workspacePath> --project-id <id> --json` on the same executable and environment. Preserve target identity on retries and verify artifacts through `workspace sync`.

The current next CLI has no Team setting command. Follow [Team status](references/upload-team.md) and report any requested Team as pending.

## Remote proposal and execution

Use only verified `ojo chat --message ... --project-id ... --json` and `ojo query --project-id ... --json` commands. Omitting a project ID from chat can create a project, so do so only when the user explicitly requests a new conversation project.

Do not present Codex-authored text as OJO output. If complete response content is unavailable, report dispatch and status separately.

## Disabled canvas workflow

Do not request or start an `irise-web` checkout, run undocumented canvas commands, return a localhost preview URL, or replace the disabled workflow with browser automation. Report OJO canvas visual and interactive verification as unavailable.

## Handoff

Report the CLI version, environment, project ID, local workspace path, exact local validation commands, snapshot evidence, authorized import target and readback, Team verification, and remote chat/query result when requested.
