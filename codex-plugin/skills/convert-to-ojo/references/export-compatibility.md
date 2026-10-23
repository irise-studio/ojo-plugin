# Real-export compatibility baseline

Read this before choosing a scaffold. These observations come from the user-provided export `3260a4600c4b376d68994708935ec1ccbf200c78f8e14e685c05326b12a2c8c7`, inspected on 2026-09-07. Its workspace package version is 0.0.21, prototype version 0.1.31, and Rspack version 1.7.2. They describe this export profile, not every OJO release. The export is not bundled with this skill: use the user's supplied path, and inspect new exports before applying these observations. Do not hardcode a Downloads path as a runtime dependency.

## Workspace, not just a prototype folder

The export has root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `AGENTS.md`, and README. Workspace members are `prototype`, `business`, `components`, and `lib/api-client-react`; `specs`, `supabase`, and `lib/integrations` support their contracts.

Preserve root orchestration, package identities, root React overrides, and required workspace packages when creating the separate output. Root scripts use `pnpm --filter prototype`; renaming only that package silently breaks them. Install/update the root lockfile rather than adding an unrelated nested package manager workspace.

Determine dependencies before omitting directories. This export's `prototype/src/core/app.ts` imports `@workspace/api-client-react` even before any business page requests an API. Removing `lib` without adapting and verifying that dependency breaks the runtime. Do not copy the original project's product pages, Supabase deployment configuration, credentials, or project identity as the new app's identity. Preserve generic scaffolding and sanitize project-specific content; remove a package only after its root scripts and imports have been addressed. Never invent remote IDs. Inspect `.ojo` metadata by meaning: this export's `.ojo/meta.json` contains a `version` field, which is not equivalent to CLI `.ojo/project.json` project binding.

## Contract differences to reconcile

| Concern | Supplied export | Additional current CLI gate | Conversion rule |
| --- | --- | --- | --- |
| Page entry | Flat `src/pages/<id>.page.tsx`; Rspack and bundle tool scan it | Flat and nested entries accepted | Keep one flat entry per page; nested implementation is fine, duplicate entries are not |
| Theme source | `src/data/theme.json`; runtime and theme tooling consume it | Requires `delivery/artifacts/theme.json` | Keep the export source authoritative; generate the gate copy deterministically and check equality, never maintain two editable authorities |
| Page inventory | Entries plus `app.json.entryPage`; sample has no `pages` | Requires page manifests and `app.json.pages` containing entry | Add manifests and the entry list without replacing export discovery; verify both inventories match |
| State | `src/stores/*.store.ts`, wrapper-provided actions | Structural checks do not prove hydration | Keep wrapper semantics and verify URL/state behavior in the host |
| Snapshots | `src/snapshots/<id>.snapshots.json`, consumed by blueprint generation | Prototype build does not require snapshots | Do not invent state coverage or disable template generation merely to fit a different skill |
| Build | Rspack 1.7.2, root scripts, inline optimization and page bundles | Direct TypeScript/Rspack calls, staging output | Retain the export toolchain; add staging support without replacing its bundler or artifact protocol |

When generating the supplemental theme artifact, do so before manifest/prebuild/build gates and before any full CLI publish that reruns the gate. Keep this step reproducible and document its command. Ensure `dist/data/theme.json` contains the same theme. Retain the export's token schema and class generator; a generic `colors` object and a few inline CSS variables do not prove editable-theme parity.

Preserve source extensions supported by the actual transform chain. If keeping imported JSX rather than migrating to TSX, provide its loader and state clearly whether TypeScript checks that source. Do not suppress type errors in the retained runtime to make the gate pass.

## State protection

The inspected Zustand wrapper hydrates declared keys from URL parameters and supplies a protected `set` to the state creator. It preserves URL-provided keys on the first conflicting write, then releases that protection. Actions must use that supplied `set`; invoking the external store API's `setState` bypasses this behavior.

Model source state through typed page actions where feasible. Validate a meaningful query override, the first attempted overwrite, a later user change, and the outgoing `update` / `state` envelope in an authorized local host. Do not invent navigation/state message shapes. Functions are stripped from host messages by the existing wrapper; playback DOM handles and session-only blob resources should not be mistaken for reproducible serialized state.

## Packaging and evidence

Run the export's root typecheck, applicable prototype build, relevant template tests, and `build:bundle` using the selected export's command definitions. Verify each expected page appears in the bundle output: this tool can exit successfully after warning that it found no flat page entries. Test that runtime and resource URLs load under the intended host/base path.

The supplied export optimizes production HTML by inlining assets. If the current CLI's HTML regex mistakes script content for an asset reference, record the validator incompatibility. Do not silently switch packaging solely to satisfy it. Repair the validator when that is in scope, or prove the alternate packaging works in the target OJO host before claiming compatibility; otherwise report an unresolved integration gap.

Default conversion includes one source-backed baseline snapshot per page. First inspect the selected snapshot generator and consumer. The sibling snapshot skill writes page-local files, while this export reads `src/snapshots/`. Choose one authoritative source and implement a deterministic adapter if needed; verify the resulting blueprint references actual pages and states. A generated empty blueprint is not evidence of state coverage.

Report these levels independently:

1. Export structure and dependency alignment.
2. Real local compilation, page packaging, and supplemental gate results.
3. Standalone HTML interaction checks.
4. Project-bound OJO canvas loading, resources, state hydration, and navigation.
5. Explicitly requested remote import/publish and remote readback.

Only actual observations justify marking a level passed. Missing credentials or a project reference do not invalidate useful local work, but leave host and remote compatibility unverified. A standalone copy of the CLI gate, even byte-identical, does not establish that the full CLI handshake or server validation passed.
