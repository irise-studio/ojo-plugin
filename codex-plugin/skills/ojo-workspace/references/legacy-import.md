# Upload with `@touchine/ojo`

Use this path to upload a validated OJO export with `@touchine/ojo >=1.0.9 <2.0.0`.
It uses design-project for creation and zk-agent-engine for ZIP import.

Apply the [publication policy](../../convert-to-ojo/references/publication-policy.md):
the user's request or standing authorization permits checked projects to be
uploaded to `ojo.art` without an additional production-only confirmation.

Run `node <plugin>/scripts/check-ojo-cli.mjs`. This checks the installed `ojo`
(or explicit `OJO_CLI_BIN`) and verifies the command signatures used by the
plugin. Version 1.0.8 lacks `project import`; install the known supported release
with `npm install -g @touchine/ojo@1.0.9`. The check verifies command shape; an
authenticated hosted import is still needed for end-to-end evidence.

For new plugin-created projects, first use `ojo project team list --json` in the
same environment and resolve the requested/default Team to its unique catalog ID.
Pass it as `--team-id` during import. CreateProject sends only the name; after
receiving projectId, the CLI saves and verifies Team through
`POST /v2/project-workspace-context` before ZIP upload. Its body is
`{ projectId, workspaceContext: { selectedTeamIds: [teamId], selectedSkills: [] } }`
for an empty context; preserve existing selectedSkills when present.
Do not send a top-level teamId or a different workspace-context shape.
The default 原型设计团队 resolves to main in the observed production catalog;
resolve the catalog each time rather than guessing or substituting another Team.

For `ojo.art`, use the same explicit environment for login, queries and import:

```sh
OJO_API_BASE=https://ojo.art/api \
OJO_AUTH_WEB_ORIGIN=https://ojo.art \
IRISE_AGENT_ENGINE_BASE=https://ojo.art/api/agent-engine \
ojo project import /absolute/path/prepared-ojo --name "Project name" --team-id <resolvedTeamId> --json
```

Use `--project-id <id>` instead of `--name` for an explicitly selected empty
project. New project creation requires user authorization. The command requires
a built export workspace; validate its original build, all page entries, and
one default snapshot per business page before importing. It does not convert
source, build artifacts, or overwrite a different existing prototype.

Keep credentials in the CLI. On an authentication failure, use this CLI's
`ojo auth login` with the same environment and supported no-auto-open options, following [transport policy](transport-policy.md). If unavailable, have the user run login manually. A staging
login is not evidence of a production session. Never read or copy tokens.

Inspect `.ojo-import.json` before import: it persists project, environment and
ZIP identity. Never reuse a staging receipt against production. For an authorized
new target, prepare a separate upload directory without old receipts, dependencies,
secrets or caches; retain the source and previous receipt. Retry using the new
receipt/explicit ID. If creation has an uncertain result, query projects before
trying creation again. A changed ZIP needs a new empty target.

Require `initialTeamVerified=true`, the intended `initialTeamId`, and
`teamVerificationScope="agent-workspace-context"`. The CLI verifies AgentEngine
context before uploading and does not require Team in design-project properties.
If Team setup fails, stop upload and reuse the existing receipt; it retains the
Team intent for retries without creating another project. For separate Team
changes, use [Team setting](upload-team.md). API readback does not prove the
frontend's current selection; report visual verification separately.

Report the returned project URL/version and check hosted page/snapshot artifacts through supported CLI/API reads; label visual verification as pending.
Do not describe a CLI success response as browser verification. A local canvas
is not part of this plugin's supported CLI workflow.
