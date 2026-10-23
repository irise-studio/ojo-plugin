---
name: convert-to-ojo
description: Start here when the user asks to use OJO to optimize, beautify, redesign, or edit a local website or app (用 OJO 优化、美化、改版本地项目), even without saying import or convert. Preflight non-OJO projects, adapt supported apps using a real OJO export, and prepare validated artifacts for authorized upload before optimization. Route already conforming prototypes to build-irise-prototype; analysis-only requests remain read-only.
---

# Convert a local project to OJO

Follow [CLI and API only](../ojo-workspace/references/transport-policy.md) for all operations. Browser automation is prohibited, including login, Team setup, remote chat retrieval and visual verification. Report unsupported client operations explicitly; never fall back to a browser.

Produce an editable OJO workspace aligned with the user-provided export and a passing prototype build while preserving the source application's appearance and meaningful interactions. This is an agent-driven conversion workflow, not a universal converter or a new CLI command.

This skill ships in the OJO Codex plugin. Resolve sibling links relative to this file. No production template is bundled: the artifact checklist does not supply a runtime implementation.

## Local optimization entrypoint

For “use OJO to optimize this local project,” select this skill before requiring a remote project ID or editing business pages. Read [optimization handoff](references/optimization-handoff.md) to distinguish conversion preparation, authorized upload, and the user’s optimization approval. React + Vite is the adaptation baseline, not a dependency-name filter: inspect other frameworks such as Vinext before classifying them.

## Preflight before generating files

Run the evidence-based [conversion preflight](references/preflight.md) before creating the target workspace, installing dependencies, or changing source. Inspect the selected app and candidate export read-only, then classify it as **ready**, **adaptation_required**, or **unsupported**. Dependency names alone are not a verdict.

Summarize the decision, source evidence, route/business-page inventory, adaptation tasks, and blockers to the user. For `ready`, proceed within the existing request. For `adaptation_required`, proceed with understood, authorized adaptations that preserve behavior; keep dependent work blocked when required facts or a material behavior choice are unresolved. Ask only for that missing information, not routine approval. For `unsupported`, stop conversion and publication and explain which requirement cannot be preserved by the current workflow; do not generate a placeholder project or silently drop functionality.

An analysis-only or blocked preflight does not create an output directory merely to hold a report. After conversion is admitted, record preflight findings in `conversion-report.md`. Reassess when new evidence changes the source, required behavior, or target runtime. Preflight is an agent workflow, not an executable compatibility scanner or proof of successful conversion. Build, snapshot, publication, and the currently unavailable canvas verification remain separate outcomes.

For an actual conversion attempt, report its initial preflight classification once using [preflight telemetry](references/preflight-telemetry.md), including `unsupported` before stopping. Honor the telemetry opt-out. Send only the bounded event schema through the existing authenticated CLI, never source files or the full conversion report. Telemetry failure does not block conversion, start login, or change the classification. Analysis-only questions and later reassessments within the same attempt do not create additional events.

## Establish scope and inventory

1. Resolve the source application. Read its local instructions, package/lockfile, Vite/TypeScript configuration, HTML/React entry, routes, and providers. For monorepos, identify the application and required workspace packages.
2. If already OJO-compatible, use [build-irise-prototype](../build-irise-prototype/SKILL.md). For other frameworks or server-dependent apps, identify additional adapter work; do not silently rewrite them or remove server behavior.
3. Default to a separate sibling directory `<source-name>-ojo`, preserving the selected export's root workspace structure and `prototype/`. Do not overwrite a nonempty destination or modify the source unless already authorized. On a repeated conversion, inspect the existing report and user edits before updating anything.
4. Read [React + Vite adaptation](references/react-vite.md). Inspect source code and available user-provided baseline views/interactions; do not launch browser automation. Ask only for undiscoverable information that affects behavior, such as dynamic-route examples or an inaccessible API's intended replacement.
5. For a conversion request, keep `conversion-report.md` in the output workspace: source/output paths, scaffold provenance, stable route-to-page mapping, adaptations, unresolved items, and actual validation results. An analysis-only request does not authorize file generation.

## Obtain a working scaffold

Read [export compatibility](references/export-compatibility.md) first. A user-provided real OJO export takes precedence over another cached workspace as the conversion baseline. Inspect its root scripts, workspace packages, lockfile, page discovery, mounting, navigation, theme, state, and packaging tools. Record its actual versions; a matching prototype version alone does not prove equivalent contracts.

Read the [prototype build contract](../build-irise-prototype/references/generate-prototype-build-gate.md) as an additional file and artifact checklist, not as a substitute for the export. When the two differ, preserve the export and add only justified compatibility adapters. Do not replace the export's build configuration with another template merely to match the checklist.

If an explicit OJO project is provided as the scaffold source, use [ojo-workspace](../ojo-workspace/SKILL.md) for workspace sync and authentication. Download into separate staging, never over the source or conversion output. An empty project may have no source workspace; do not select or create an unrelated remote project to obtain one.

Record scaffold provenance/version. Retain its runtime/build implementation and replace unrelated business pages with the imported page set. Repository test fixtures, empty Rspack configs, invented bridge messages, and arbitrary empty runtime JSON are not production templates.

If targeted inspection cannot locate a usable scaffold/runtime contract, complete the inventory and mapping, identify the exact missing dependency, and report conversion as incomplete. Do not fabricate compatibility to satisfy structural checks.

For an authorized upload, follow [project import](../ojo-workspace/references/legacy-import.md): run the plugin's `../../scripts/check-ojo-cli.mjs`, retain the export's native build and validation, and inspect every page and snapshot. The checker targets `@touchine/ojo >=1.0.9 <2.0.0`. Source analysis and local conversion can continue while CLI setup is unresolved.

## Convert

- Preserve compatible business components, assets, providers, and dependency versions. Add necessary scaffold/build dependencies, reconcile peer requirements, and update the root workspace lockfile through its package manager. Preserve the export's package names used by root filter scripts and workspace dependencies. Do not copy installed dependencies or relabel another package manager's lockfile.
- Inventory top-level sidebar/menu destinations and state-driven content branches as well as URL routes. A shared component or one URL does not mean one business page. Map independently meaningful destinations (for example discovery, favorites, and local library) to distinct OJO page IDs, entries, manifests, and default snapshot groups; keep transient filters, dialogs, and cosmetic tabs within their page. Record the mapping and verify every primary navigation destination is represented.
- Establish stable page IDs and ordered manifests before page implementation. Derive semantic fields from real pages instead of filler. Declare shared components once. Keep the manifest inventory aligned with every export page-discovery tool. Preserve `app.json.entryPage`; add `pages` including that entry when required by the additional CLI gate.
- For the supplied export profile, expose exactly one flat `prototype/src/pages/<page_id>.page.tsx` entry per page. Its implementation may live under `<page_id>/source/`, but do not add a second discoverable nested entry. Check both Rspack and `build-page-bundle.ts` discovery. Preserve reusable components in shared source. Adapt router context and navigation using the reference and actual scaffold bridge, not invented messages.
- Reuse the scaffold's real theme/store mechanisms. Preserve compatible React state; adapt page-local state where the runtime requires it and verify consumption. Use actions defined through the wrapper-provided `set`; direct external `store.setState` can bypass its URL-hydration protection. A generated `store.json` alone does not integrate Redux, Zustand, or Context.
- Translate used Vite features and resource paths into the Rspack pipeline. Preserve or minimally add `IRISE_BUILD_OUTPUT_DIR` support so the additional gate builds into staging before promoting stable dist. Preserve the export's bundler version and packaging behavior until compatibility evidence justifies a change.
- Copy only required source/configuration/assets. Exclude credentials, secret environment files, `.git`, caches, installed dependencies, and unrelated files. The publisher snapshots the output workspace; its limited directory exclusions are not an import filter. Record required environment variable names without their secret values.

## Validate and hand off

Run the export's applicable root typecheck, prototype build, template or manifest tests, and page-bundle command in the converted workspace. Verify actual outputs: a zero-exit page-bundle command that skips every page is a failure. Use the selected export's checked-in package manager, lockfile, and scripts; the supported CLI does not provide `ojo prototype validate` or `ojo prototype build`.

Apply [export compatibility](references/export-compatibility.md) and the sibling build skill's artifact checks without overriding the selected export's source layout. Rebuild after source or metadata changes; never patch stable dist. Ensure the scaffold emits `dist/data/app.json` with the intended entry and verify every declared compiled page and snapshot group.

Local Irise Web canvas startup and OJO visual verification are temporarily disabled. Do not request an Irise Web checkout, run `workspace dev`, export a local canvas, or return a loopback project URL. A standalone source preview may provide source-level evidence when the user already has one, but it is not OJO integration evidence.

Compare default content, layouts, navigation/parameters, meaningful interactions, and image/font/lazy-chunk loading against the source baseline. Test under the canvas path. Use available artifact/API evidence and manual user feedback. Report visual and interactive checks still pending separately from build success; do not claim end-to-end completion.

## Generate default page snapshots

A normal conversion includes at least one default UI-state snapshot per declared page, unless the user explicitly requests an export without snapshots. This is required for OJO's current-page/related-status panel: an HTML frame alone can render the main prototype while an empty blueprint snapshot list hides that panel.

After implementing and initially building the pages, use [generate-irise-snapshots](../generate-irise-snapshots/SKILL.md) and its schema to extract each page's actual default store/query state. Put a stable, data-rich default first; use `state: {}` only when the page has no meaningful state inputs. Do not invent fields or require extra loading/error/playback scenarios merely to complete conversion. Honor any explicitly required page-stage states.

Reconcile page-local snapshot files with the export's `src/snapshots/` consumer using [export compatibility](references/export-compatibility.md). Choose one authoritative source and add a deterministic build adapter when paths differ. Generate the blueprint through the build pipeline, never by manually patching dist. Run the snapshot validation gate and rebuild; verify every declared compiled page has a matching blueprint group with at least one snapshot, unique ids and a source-backed default. Rebuild once more to ensure snapshots survive normal builds. Report current-page panel verification separately if no authenticated canvas is available.

Projects that pass this workflow may be uploaded to `https://ojo.art` under the
[publication policy](references/publication-policy.md). An upload request or the
user's standing authorization for checked projects is sufficient; do not ask
again solely because the destination is production. Resolve the selected target
or authorized new project, use the target-compatible CLI, and preserve its
empty-project and version constraints. A same-ZIP retry cannot publish changed
snapshots. Report the actual target and result separately from canvas verification.

As part of the authorized upload, apply the [default upload team](../ojo-workspace/references/upload-team.md):
select **原型设计团队** unless the user specifies another team, and verify that
the setting persists. For new targets, save and verify Team before ZIP upload, then hand the project to OJO for optimization.


Finish with the output link, page mapping, validation results, behavior changes, and blockers. Update the report with evidence. Distinguish export-format alignment, local build/package checks, optional standalone HTML evidence, unavailable project-bound OJO canvas validation, and remote publication. Claim OJO runtime compatibility only for a tested target and its observed behavior, never from local compilation alone.
