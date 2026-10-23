---
name: ojo-workspace
description: Use existing CLI authentication and verified APIs to download an OJO prototype workspace, publish an explicitly authorized validated prototype, or run user-requested remote OJO chat and status queries. Local Irise Web canvas startup, canvas export, dropped-resource publication, and localhost preview are temporarily disabled. Route non-OJO local website optimization through convert-to-ojo first.
---

# OJO Workspace

Follow [CLI and API only](references/transport-policy.md) for all operations. Browser automation is prohibited, including login, Team setup, remote chat retrieval and visual verification. Report unsupported client operations explicitly; never fall back to a browser.

## Temporary local-canvas restriction

The plugin-facing Irise Web canvas workflow is temporarily disabled. This restriction applies even when the CLI still exposes the underlying commands.

- Do not request, clone, inspect, or start an `irise-web` repository checkout.
- Do not run `ojo workspace dev` or directly materialize a project canvas export.
- Do not start a localhost OJO canvas or return a `/p/<projectId>?mode=codex` preview URL.
- Do not run `ojo workspace publish-resources`; that flow depends on resources dropped into the disabled local canvas.
- Do not claim OJO canvas, visual, or interactive verification. Report it as unavailable while this restriction remains active.
- Do not replace the disabled workflow with Browser/CUA, Playwright, browser-side requests, undocumented REST calls, or another canvas implementation.

The stable plugin identifier remains `irise-web` for installation compatibility only. This skill is named `ojo-workspace`; neither identifier authorizes the disabled workflow or implies a repository dependency.

## Route local optimization

When the user asks to use OJO to optimize, beautify, redesign, or edit a local project:

1. Inspect the selected source read-only.
2. Route non-conforming projects to [convert-to-ojo](../convert-to-ojo/SKILL.md). Route an existing conforming prototype to [build-irise-prototype](../build-irise-prototype/SKILL.md).
3. Follow [optimization handoff](../convert-to-ojo/references/optimization-handoff.md) for conversion, explicit publication authorization, Team setup, and proposal approval.
4. If the user requests an OJO proposal or execution, follow [remote chat](references/remote-chat.md) and use only the verified `ojo chat` and `ojo query` commands.
5. Keep local build/package evidence, remote API readback, and unavailable visual verification separate in the result.

## CLI selection and authentication

Run the bundled `../../scripts/check-ojo-cli.mjs` relative to this file and use exactly the executable it verifies. Do not install npm `latest` as a fallback.

For the next-generation workspace and prototype flow, require the CLI capability handshake before using:

```bash
ojo workspace sync <projectId> --path <localParent> --json
ojo prototype validate <workspacePath> --manifest-only --json
ojo prototype validate <workspacePath> --prebuild --json
ojo prototype build <workspacePath> --dist <stableDistPath> --json
ojo prototype publish <workspacePath> --project-id <projectId> --dist <stableDistPath> --json
```

`workspace sync` is read-only with respect to the server. Immediately validate the downloaded manifests before editing. `prototype validate` and `prototype build` are local-only. Run `prototype publish` only after the user explicitly asks to upload the validated prototype to that exact project; it rebuilds before the server prepare/upload/commit sequence.

If a supported operation returns `AUTH_REQUIRED`, follow the no-auto-open login flow in [transport policy](references/transport-policy.md), wait for the user to complete authentication, then retry that operation once. Keep credentials inside the selected CLI.

For an explicitly selected maintenance 1.x import, follow [legacy import](references/legacy-import.md) instead of silently switching CLI generations. Apply and verify the default Team through [upload team](references/upload-team.md) when that authorized workflow requires it.

## Remote proposal and execution

For user-requested remote OJO work, verify the installed CLI exposes the documented chat/query options, bind every request to the explicit project, retrieve actual response content when supported, and preserve any proposal-before-execution confirmation boundary. Omitting a project id can create a project, so use that side effect only when the user explicitly requests a new conversation project.

Do not present Codex-authored text as OJO output. If the supported client cannot retrieve the complete response, report dispatch and status separately from content retrieval.

## Handoff

Report the project id, local workspace path, manifest/build/snapshot evidence, authenticated CLI environment, publication target and readback when applicable, and remote chat/query result when requested. State explicitly that local Irise Web canvas startup, dropped-resource publication, and OJO canvas visual verification were not performed because those plugin features are temporarily disabled.
