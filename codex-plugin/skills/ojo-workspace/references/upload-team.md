# Set and verify the upload Team

Use the same next CLI verified by `check-ojo-cli.mjs --import` and the same explicit server.v1 environment as project creation and publication. The import check requires new-framework Team list/get/set commands.

Default new upload targets to **原型设计团队** unless the user explicitly chooses another Team. Preserve an explicit Team choice on an existing project. Resolve the exact display name or localized name from the current catalog, never reuse an old framework's Team ID.

```sh
ojo project team list --json
ojo project team set <recordedProjectId> --name "原型设计团队" --json
ojo project team get <recordedProjectId> --json
```

For a user-selected Team, pass its exact name or `--team-id <catalogId>`. The CLI requires a unique match, preserves existing workspace context fields such as skillIds, and verifies the saved canonical teamId. Record the Team name/ID, verified=true and verificationScope=project-workspace-context in the import receipt before publishing.

Setting uses `PATCH /api/server/v1/projects/<id>` and catalog lookup uses `/api/server/v1/display-teams`. No AgentEngine workspace-context or legacy CLI is involved. A retry first reads the project; an already-saved Team returns changed=false without another write. A denied request or readback mismatch leaves the same target pending and stops publication.

After prototype publication, read the Team again and verify it remains unchanged. API readback proves durable project selection. A previous run retains its original configuration, and the browser's restored selection or a subsequent agent run needs separate verification.
