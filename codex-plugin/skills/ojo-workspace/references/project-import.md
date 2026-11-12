# Publish with the next CLI

Use only `@touchine-ai/ojo` 2.x. Run `node <plugin>/scripts/check-ojo-cli.mjs --import` and use exactly its returned `command` for all steps. This requires capability schema 2, generation next, server.v1, prototype publication protocol 1, `project create` and `prototype publish`. If the installed CLI lacks these features, stop remote publication and report the missing capability. The companion CLI project-create change must be merged and released before npm latest can pass this check. Installing latest cannot supply an unreleased command. Local analysis and conversion may continue.

Use the same explicit environment for authentication, creation, publication and readback. For production set `OJO_SERVER_API_BASE=https://ojo.art/api/server/v1` and `OJO_AUTH_WEB_ORIGIN=https://ojo.art` for every CLI invocation. Keep credentials in the CLI.

## Validate before creation

Apply the publication policy and validate the actual workspace with its native checks and next CLI gates. Ensure page entries, manifests, snapshots and assets satisfy the build contract. Adapt unsupported export metadata locally before attempting upload. Never bypass a gate to preserve an old ZIP-import path.

```sh
ojo prototype validate /absolute/path/prepared-ojo --json
ojo prototype build /absolute/path/prepared-ojo --json
```

Only a passed build permits remote creation. If the user requested an explicitly selected project, use its exact ID. An old-framework project cannot be used as a next-framework target.

## Create and record the new target

For an explicitly authorized new project:

```sh
ojo project create --name "Project name" --json
```

Require `ok=true`, `serviceApi=server.v1`, and a nonempty `projectId`. Immediately persist the exact project ID, environment, source workspace and user intent in `.ojo-next-import.json` beside the workspace. Preserve this receipt before publishing. If the create response is interrupted or lacks an ID, check `project list --json` and resolve the exact target before another create attempt. Do not guess from a project name or create duplicates on upload retries.

Do not create a conversation to obtain a project ID. Do not reuse a legacy `.ojo-import.json` receipt as proof of a new-framework target.

## Publish and read back

```sh
ojo prototype publish /absolute/path/prepared-ojo --project-id <recordedProjectId> --json
```

This rebuilds through the next CLI gates, reads the target via server.v1 canvas-export, prepares prototype uploads, uploads artifacts using server-issued credentials, then commits to `/api/server/v1/projects/<id>/prototype-publish:commit`. Capture `projectId`, `publishId`, `workspaceHash` and `newVersion` from the result and update the receipt. A failed publication keeps the recorded target. Read back its current workspace before retrying after an uncertain commit.

```sh
ojo workspace sync <recordedProjectId> --path /absolute/path/readback --json
```

Verify the returned project ID and downloaded workspace/page/snapshot artifacts against the validated input. Report request acceptance, artifact readback, and hosted rendering as separate results. Browser verification is unavailable in this plugin.

No operation in this workflow uses legacy project import, design-project, `/api/agent-engine/v2/local-projects`, or AgentEngine Team APIs. The next CLI currently has no Team configuration command. Record a requested Team as pending instead of invoking 1.x, assigning an unrelated Team, or claiming it was saved.
