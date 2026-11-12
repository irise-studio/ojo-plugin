# OJO optimization handoff

## Trigger and intended sequence

“Use OJO to optimize this local project” selects conversion preflight first for a non-OJO source. Do not wait for the user to name a framework, ask for conversion, or supply a project ID before inspecting the source. Framework dependencies alone neither admit nor reject a project.

For an authorized import-and-optimize request, the sequence is:

1. Read-only source/scaffold preflight and baseline inventory.
2. Behavior-preserving conversion into a separate workspace, using a verified real OJO export.
3. Export-native typecheck/build/package checks and at least one real default snapshot per page.
4. Authorized new-framework publication with the verified next CLI, followed by artifact readback. Requested Team configuration remains pending until supported by that CLI. Local Irise Web canvas verification is temporarily unavailable.
5. A concrete optimization proposal grounded in the imported page.
6. User confirmation when requested, then prototype edits, rebuild, and snapshots as needed. Publish updated artifacts only within the user's upload scope and report visible verification as unavailable while the local canvas restriction is active.

If upload is blocked, report the exact missing prerequisite and the completed local work. Always report canvas verification as intentionally unavailable while the plugin restriction is active. Do not claim the import or remote optimization succeeded without its required API evidence.

## Preparation versus design approval

Honor the user's actual wording and established preferences. A user may authorize importing/uploading the unchanged baseline before reviewing design changes. In that case, “show a proposal before executing optimization” gates visual, content, and interaction changes; do not ask again to perform already authorized import preparation.

Conversely, “analysis only,” “do not change files,” “do not upload,” or “confirm before any execution” limits preparation too. Keep that phase read-only and explain conversion/upload requirements in the proposal. When the approval boundary is ambiguous, complete source preflight and clarify only whether import preparation is included before generating files or uploading.

An explicit user preference can establish the import-first workflow, for example:

> When I ask to use OJO to optimize a local project, first convert and upload a behavior-preserving copy to the target I specify or explicitly authorize you to create. Proposal confirmation gates design changes. Do not overwrite unrelated projects.

This example is not itself user authorization. Apply a preference only when the user has actually supplied or adopted it in the conversation or accessible user instructions. Do not install a particular user's preference as a universal plugin permission. A request to configure the plugin alone does not authorize uploading the current source project.

## Scaffold and target resolution

Use the source/export inventory and provenance rules in the parent skill. The plugin does not bundle a production scaffold; ask for a usable real OJO export only after targeted local inspection fails. Never create a dummy runtime to pass the gate.

Use an explicitly authorized new-framework project ID, or create an authorized empty target with `project create --name <name> --json`. Follow [publication](../../ojo-workspace/references/project-import.md), persist the identity before uploading, and reuse it on retries. Use remote chat only for a requested message.

For checked projects targeting `ojo.art`, apply the [publication policy](publication-policy.md). Reuse an explicit upload request or the user's standing authorization; production alone does not introduce another confirmation. Passing conversion checks does not override analysis-only or no-upload instructions.

Use the parent's publication requirements and the OJO Workspace CLI contract. Conversion and validation do not upload anything; verify and report the actual publication result separately. Upload only required sanitized source/configuration/assets, never credentials, caches, or unrelated files.

## Remote proposal and approved execution

When the user asks OJO’s remote agent to propose or execute optimization, follow [remote chat](../../ojo-workspace/references/remote-chat.md). Verify the existing `ojo chat` / `ojo query` commands, send a proposal-only request to the imported project, retrieve the actual answer, and wait for the requested confirmation before sending implementation instructions. Upload alone does not send a message. Missing response content or a failed remote call is a capability/runtime limitation, not a blanket chat prohibition. Never present Codex-authored analysis as OJO output.

## Routing examples for review

- “用 OJO 优化当前本地网站”：inspect locally and select convert-to-ojo for a non-OJO source; resolve preparation authorization and target before mutation.
- “先转换上传到这个 OJO 项目，再给方案，我确认后改”：convert, validate, upload to that target, verify, propose, and stop before design changes.
- Same request with an established import-first preference: reuse it without another upload permission question; still resolve missing target facts.
- “只给方案，不改文件，不上传”：read-only preflight and proposal; no output workspace or conversion telemetry event.
- Existing conforming OJO workspace: preserve it and route authorized editing to build-irise-prototype; no reconversion.
- Missing scaffold, project ID, or unsupported required server behavior: report the precise blocker; do not fabricate import success.
