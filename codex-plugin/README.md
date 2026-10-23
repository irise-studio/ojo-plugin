# OJO Codex plugin

The OJO plugin prepares local websites for OJO optimization, validates prototype builds and state snapshots, publishes explicitly authorized artifacts, and supports user-requested remote OJO proposals and execution through verified CLI/API operations.

The stable plugin identifier remains `irise-web` for installation compatibility. The primary operations skill is named `ojo-workspace` so it does not imply a dependency on the separate Irise Web repository.

## Temporarily disabled

The plugin-facing Irise Web local-canvas workflow is temporarily disabled. Plugin skills must not:

- request or start an `irise-web` repository checkout;
- run `ojo workspace dev`;
- directly materialize project canvas export or return a localhost `/p/<projectId>?mode=codex` URL;
- run `ojo workspace publish-resources` for resources dropped into the disabled canvas;
- claim OJO canvas visual or interactive verification;
- replace the disabled flow with Browser/CUA, Playwright, browser-side requests, or undocumented endpoints.

The underlying CLI implementation remains owned outside this distribution package for direct CLI maintenance and later restoration. Ordinary plugin users do not need read access to the separate `irise-studio/irise-web` repository while this restriction is active.

## Enabled workflows

- Read-only compatibility preflight for local websites and apps.
- Behavior-preserving conversion based on a real OJO export.
- Project-bound `workspace sync` followed by manifest validation.
- Local prototype validation/build and state snapshot materialization.
- Explicitly authorized prototype publication or maintenance CLI import.
- Default Team selection and API readback for authorized imports.
- Verified `ojo chat` / `ojo query` for requested remote proposals and execution.

Local build/package evidence, remote API readback, publication success, and unavailable canvas verification are reported separately.

## Requirements

- Codex with the OJO plugin installed.
- Node.js 20 or newer.
- A compatible next-generation OJO CLI available as `ojo` on `PATH`, or selected explicitly with `OJO_CLI_BIN`.

  ```bash
  ojo capabilities --json
  ```

This repository distributes the Codex plugin, not the OJO CLI. Obtain the supported CLI through the approved Irise distribution channel; do not install npm `latest` as a fallback. For checked exports uploaded with an explicitly selected maintenance CLI, follow [legacy import](skills/ojo-workspace/references/legacy-import.md) and verify the installed command surface.

## Local prototype workflow

```bash
ojo workspace sync <projectId> --path /path/to/local/projects --json
ojo prototype validate /path/to/ojo-prototype --manifest-only --json
ojo prototype validate /path/to/ojo-prototype --prebuild --json
ojo prototype build /path/to/ojo-prototype --dist /path/to/ojo-prototype/prototype/dist --json

node codex-plugin/skills/generate-irise-snapshots/scripts/build-local-snapshots.mjs /path/to/ojo-prototype --validate-only --json
node codex-plugin/skills/generate-irise-snapshots/scripts/build-local-snapshots.mjs /path/to/ojo-prototype --dist /path/to/ojo-prototype/prototype/dist --json

# Only after an explicit user request to upload the validated prototype:
ojo prototype publish /path/to/ojo-prototype --project-id <projectId> --json
```

`workspace sync` downloads the explicit project's active prototype workspace. Validation and build are local-only. Publication is a separate authenticated mutation and remains bound to the explicit project and user authorization.

## Install from this repository

```bash
codex plugin marketplace add irise-studio/ojo-plugin --ref main
```

Open `/plugins`, choose **Irise Studio**, install **OJO**, and start a new task so the updated skills are loaded.

## Example prompts

```text
Download project <projectId> and validate its prototype manifests without starting a local canvas.
```

```text
Convert this local site to an OJO-compatible workspace, validate the build and snapshots, and publish only after I authorize the target.
```

```text
Ask OJO for an optimization proposal for project <projectId>, show me the actual response, and wait for confirmation before execution.
```
