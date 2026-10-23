# Project Team settings

For a newly created upload target, use the `--team-id` import flow in
[legacy import](legacy-import.md). The CLI creates the project, saves Team through AgentEngine, verifies it, then uploads the ZIP. The separate set command supports an authorized existing target.

Default the uploaded project's agent Team to **原型设计团队**, unless the user
explicitly chooses another. Apply this before remote optimization and only to
the authorized upload target. This does not change organization membership or
send a chat message. Follow [CLI and API only](transport-policy.md); no browser
fallback is permitted.

Team persistence is part of the authorized project upload under the
[publication policy](../../convert-to-ojo/references/publication-policy.md),
including production workspace-context writes. Reuse the user's upload authorization
and explicit repository-rule exception; do not ask again solely because this is
a production Team write. Tool/service denials still apply.

## Existing zk-agent-engine API

Resolve the base from the same environment as the upload. For production it is
`https://ojo.art/api/agent-engine`; append the paths below once.

1. `GET /v2/catalog/teams` returns `{ "teams": [...] }`. Resolve the unique team
   with the requested catalog name and use its actual `id`. Do not guess an ID,
   reuse a staging ID, or silently substitute “原型设计大师”. A missing or ambiguous
   match leaves Team setup pending.
2. `GET /v2/project-workspace-context?projectId=<encoded-project-id>` returns
   `{ "workspaceContext": null | { "selectedTeamIds": [...], "selectedSkills": [...] } }`.
   Preserve the returned `selectedSkills`. Only a successful explicit `null`
   response means an empty context; errors or malformed responses do not.
3. `POST /v2/project-workspace-context` saves the full context:

   ```json
   {
     "projectId": "<uploaded-project-id>",
     "workspaceContext": {
       "selectedTeamIds": ["<resolved-team-id>"],
       "selectedSkills": []
     }
   }
   ```

   The example's empty skills array is valid only when the read returned no
   selected skills. This is a replacement, not a PATCH: omitting selectedSkills
   clears them. Preserve explicit user Team choices; if the desired selection
   is already present, skip the write. The API exposes no version/CAS field;
   avoid concurrent workspace-context edits and never blindly retry a write.
4. Require `{ "success": true, "workspaceContext": ... }`, then GET again and
   verify both selectedTeamIds and preserved selectedSkills. After a timeout,
   read back before considering a retry. On conflicting readback, report it
   without overwriting again. Record the actual team name/ID and verified result.

## Verification scope

The old-framework Team setting uses this AgentEngine API; it does not require
`design-project` CreateProject/UpdateProject to persist `workspace_context`.
API readback verifies the saved context at that moment, not frontend rendering.
An already-open page or cached frontend state may subsequently change it. If
selection reverts, compare a later API read with the manual UI result and
investigate frontend initialization separately; do not repeatedly overwrite it.

## Maintenance CLI command

The maintenance branch now implements a separate Team command. Verify the actual
installed executable's help includes `Usage: ojo project team set`, `<projectId>`,
`--name`, `--team-id`, and `--json`; parent help or a zero exit code is insufficient.
An older global 1.0.8 installation may still lack it. Do not switch to next CLI.

Use the same environment and CLI executable as the successful upload:

```sh
OJO_API_BASE=https://ojo.art/api \
OJO_AUTH_WEB_ORIGIN=https://ojo.art \
IRISE_AGENT_ENGINE_BASE=https://ojo.art/api/agent-engine \
ojo project team set <uploaded-project-id> --name "原型设计团队" --json
```

For an explicit user choice, pass its exact name or `--team-id <catalog-id>`
instead. `ojo project team list --json` lists IDs and localized names;
`ojo project team get <project-id> --json` reads the AgentEngine context. Keep the same
environment for all commands. The set command resolves the catalog, preserves
skills, skips an identical selection, and reads back after saving; require the
same projectId, selected Team, `verified=true`, and `verificationScope="agent-workspace-context"`. `changed=false` means the
selection was already correct. `recovered=true` means readback confirmed a write
whose response was uncertain, without sending another POST.

The command uses existing CLI session authentication and does not open a browser.
If the installed binary lacks it, report **uploaded; default team setup pending
(CLI update required)**. Source implementation is not evidence of installation;
build/reinstall only within the user's authorized scope. Do not fake an import
`--team` flag, repeat the upload, or claim prototype import configured Team.
No new backend interface is needed.

Source contracts: zk-agent-engine's `internal/server/http/routes/catalog.routes.ts`,
`project-workspace-context.routes.ts`, and
`internal/service/project-workspace-context.ts`.
