---
name: build-irise-prototype
description: Build or modify a local OJO prototype with its own manifest, source, TypeScript, bundler, package, and snapshot contracts. Use when the user asks Codex to build, implement, edit, compile, validate, or repair local prototype pages. Local Irise Web canvas preview is temporarily disabled.
---

# Build an OJO prototype

Follow [CLI and API only](../ojo-workspace/references/transport-policy.md) for all operations. Browser automation is prohibited. Report unsupported client operations explicitly.

Use the workspace's checked-in package manager and scripts as the executable build contract. The supported `@touchine/ojo` CLI synchronizes and imports workspaces, but does not provide `prototype validate`, `prototype build`, or `prototype publish` commands.

Read [generate_prototype gate contract](references/generate-prototype-build-gate.md) as a file and artifact checklist before editing. Do not present that reference as a CLI capability.

This workflow ends with locally validated build artifacts. It does not generate state-page snapshots. When snapshot coverage is explicitly in scope, hand off to `generate-irise-snapshots`.

## Bootstrap

1. Resolve an existing workspace containing `prototype/package.json`, or a prototype root containing its package and build configuration.
2. Inspect the root and prototype `package.json` files, lockfile, workspace configuration, scripts, and existing build documentation before choosing commands.
3. When the user asks to download a project first, run the bundled `../../scripts/check-ojo-cli.mjs`, then use:

   ```bash
   ojo workspace sync <projectId> --path <localParent> --json
   ```

   Use the returned path. This operation is read-only with respect to the server.
4. If sync returns `AUTH_REQUIRED`, use the CLI-only authentication flow in the transport policy, then retry once.
5. Do not start a local canvas or request an `irise-web` checkout.

## Manifest and source checks

Treat these as separate authorities when they exist:

- page metadata under `prototype/delivery/artifacts/page-manifests/`;
- shared component requirements;
- page entries and implementations under `prototype/src/pages/`;
- runtime data such as `prototype/src/data/app.json`;
- theme, store, snapshot, and blueprint artifacts defined by the export.

Before editing, verify that page IDs, order, entry points, navigation, shared-component references, and `app.json.entryPage` agree. Establish the complete page set from manifests and export tooling, not from source filenames alone.

Preserve the export's source layout and build implementation. Keep meaningful business state in real stores, use working navigation, and do not ship empty handlers, placeholders, fabricated URLs, TODO markers, or hand-edited `dist` files.

## Validate and build

1. Install dependencies from the existing lockfile with the matching package manager. Do not upgrade dependencies merely to bypass a failure.
2. Run every applicable checked-in contract command: typecheck, tests, template or manifest validation, prototype build, and page-bundle generation.
3. If the export supports a staging output variable such as `IRISE_BUILD_OUTPUT_DIR`, build into staging, validate the result, and only then replace the stable output according to the export's own scripts.
4. Verify actual output rather than exit code alone:
   - every declared page has exactly one compiled entry;
   - manifest, entry-page, theme, store, and snapshot references resolve;
   - output contains no source-only imports or root-absolute package paths;
   - expected HTML frames and `dist/data/app.json` exist;
   - a page-bundle command did not silently skip all pages.
5. Rerun the applicable checks after any source, metadata, or snapshot change.

Record the exact commands and results. Do not claim a non-existent `ojo prototype` validation or publication gate.

## Authorized upload

If the user explicitly asks to upload the completed workspace, hand off to `ojo-workspace`. The supported publication command is:

```bash
ojo project import <workspacePath> --project-id <emptyProjectId> --json
```

or, for an authorized new project:

```bash
ojo project import <workspacePath> --name <name> --team-id <teamId> --json
```

The import command expects an already built workspace; it does not replace local validation.

## Preview restriction

Local Irise Web canvas startup and OJO visual verification are disabled. Do not run `ojo workspace dev`, return a localhost canvas URL, or use browser automation as a substitute. Report local build evidence, remote import/readback evidence, and pending visual verification separately.
