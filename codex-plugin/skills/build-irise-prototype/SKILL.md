---
name: build-irise-prototype
description: Build or modify a local Irise prototype project with the same page-manifest, source, TypeScript, Rspack, package, and publish-order boundaries used by the server generate_prototype workflow. Use when the user asks Codex to build, implement, edit, compile, validate, or repair local prototype pages. Local Irise Web canvas preview is temporarily disabled.
---

# Build Irise Prototype

Follow [CLI and API only](../ojo-workspace/references/transport-policy.md) for all operations. Browser automation is prohibited, including login, Team setup, remote chat retrieval and visual verification. Report unsupported client operations explicitly; never fall back to a browser.

Build into a staging dist, pass the versioned local gate, and only then atomically replace the stable dist.

Read [generate_prototype gate contract](references/generate-prototype-build-gate.md) before editing a prototype.

This workflow ends with a validated prototype dist. It does not generate state-page snapshots. When the user explicitly asks for state pages or snapshot coverage after the prototype passes, hand off to `generate-irise-snapshots`.

## Bootstrap

1. Run the plugin's bundled `../../scripts/check-ojo-cli.mjs` with Node.
2. Require `localPrototypeBuildGateProtocol=1`; do not invoke local-canvas capabilities while the plugin restriction is active.
3. Do not install npm `latest`. Use a compatible preinstalled CLI from `PATH` or `OJO_CLI_BIN`; this distribution repository does not contain the CLI source.
4. Resolve an existing workspace containing either `prototype/package.json` or a prototype root containing both `package.json` and `rspack.config.ts`. When the user asks the plugin to download a project first, run `ojo workspace sync <projectId> --path <localParent> --json` and use its returned `path`; this is read-only with respect to the server.
5. If `workspace sync` returns `AUTH_REQUIRED`, use the CLI-only manual authentication flow in the transport policy, then retry the same sync once.
6. Keep the persistent synced source and its stable `prototype/dist` in the selected authoring workspace. Do not start `ojo workspace dev` or request an `irise-web` checkout.

## Downloaded manifest gate

Immediately after a project workspace is downloaded, run:

```bash
ojo prototype validate <workspacePath> --manifest-only --json
```

Require `protocol=generate-prototype-build-gate.v1`, `protocolVersion=1`, exactly one `manifest` phase, and `status=passed`. This mode deliberately does not require source scaffolding, dependencies, or dist, so the downloaded authoring contract is proven before any local modification. It never uploads or mutates server state.

## Authoring workflow

1. Inspect the existing files before editing. Treat these as distinct authorities:
   - page outline metadata: `prototype/delivery/artifacts/page-manifests/<page_id>.json`
   - shared component metadata: `prototype/delivery/artifacts/component-requirements.json`
   - page implementation: `prototype/src/pages/<page_id>/source/`
   - page entry: `prototype/src/pages/<page_id>/entry.page.tsx`, `index.page.tsx`, or `prototype/src/pages/<page_id>.page.tsx`
   - runtime data: `prototype/src/data/app.json` and `prototype/delivery/artifacts/theme.json`
2. Establish the complete ordered page-manifest set before implementation. Do not infer the page list from source files.
3. Develop independent pages concurrently when the environment supports parallel work. Each page branch must keep its page manifest, page source, and page entry aligned and must not edit sibling page source.
4. Develop shared components once from `component-requirements.json`; pages consume declared component ids instead of duplicating a local shell/nav.
5. Keep business state in one page-local store and make its default state render valid, non-empty content. Visible controls must mutate real state, use the approved local navigation bridge, or render disabled; do not ship empty handlers or debug/snapshot controls.
6. Use real local/runtime-approved assets and package-relative references. Do not ship placeholder images, fabricated URLs, root-absolute package paths, lorem text, or TODO markers.
7. Do not write `prototype/src/pages/*/states/*.snapshots.json` or author `dist/data/blueprint.json` in this phase. Those belong to `generate-irise-snapshots` after the prototype is complete.
8. Never hand-edit stable dist as source. Never use a normal build command that writes directly into the watched stable dist.
9. If dependencies are missing, install from the existing pnpm lockfile before running the gate. Do not add or upgrade packages merely to bypass a gate failure.

## Prebuild gate

After metadata and source edits, run:

```bash
ojo prototype validate <workspacePath> --prebuild --json
```

Require `protocol=generate-prototype-build-gate.v1`, `protocolVersion=1`, and `status=passed`. Repair every error in the named phase before continuing. Warnings do not authorize ignoring an error.

## Build and publish locally

Run:

```bash
ojo prototype build <workspacePath> --dist <stableDistPath> --json
```

The CLI must run the service-aligned phases in order:

1. page manifest and shared component contract
2. source/workspace contract
3. prepared dependency executables
4. TypeScript and Rspack concurrently against a staging dist
5. compiled package/frame/data/reference validation
6. atomic promotion to the stable dist

Require every emitted phase to pass. A failed build must leave the prior stable dist unchanged. Any source or metadata edit after a passing gate invalidates that result; rerun the command.

If and only if the user explicitly asks to upload the finished local prototype, hand off to the OJO Workspace skill and run its project-bound `ojo prototype publish` step. Publish reruns this entire build gate and refuses stale or partial dist output.

Do not chain snapshot generation from a plain continuation after prototype delivery. Run `generate-irise-snapshots` only when snapshot/state-page work is explicitly in scope.

## Preview restriction

Local Irise Web canvas startup and preview are temporarily disabled. Do not run `ojo workspace dev`, request an `irise-web` checkout, wait for `prototype_updated`, or return a localhost canvas URL. Report visual and interactive verification as unavailable. This build skill does not upload source, metadata, or dist unless the user explicitly requests the separate `prototype publish` handoff above.

## Failure handling

- `manifest`: repair page identity, order, navigation, section, or shared-component references.
- `source`: repair missing service scaffold files, app entry metadata, or page entries.
- `dependencies`: install the existing lockfile; do not change the package contract silently.
- `typecheck` or `bundle`: repair only the reported source/build issue.
- `package`: repair missing frames/data, uncompiled imports, root-absolute references, or missing package assets.
- `promote`: preserve the prior stable dist and report the filesystem failure.

Do not claim completion from a successful raw `pnpm build` or an existing HTML file. Report the passing versioned gate and the temporarily unavailable visual canvas verification separately.
