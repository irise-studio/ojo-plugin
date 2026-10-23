# Conversion preflight

Run before generating the converted workspace. Start with static, read-only source inspection; do not execute config files, package scripts, install hooks or remote mutations just to classify the project. Existing build results can be evidence. If runtime investigation is needed, do it as a separate, scoped validation after the inspection; no result means unknown, not passed.

## Evidence checklist

| Area | Inspect | Required finding |
| --- | --- | --- |
| Application boundary | Local instructions, entry HTML/React mount, package and lockfile, workspace imports | Exact app root, actual framework/runtime and reachable required source |
| Runtime | Used SSR/SSG APIs, server components/actions, Node APIs, server routes, middleware | Whether essential behavior executes in the browser; identify every server dependency |
| Business pages | Router declarations, sidebar/menu handlers, state-driven branches, shared layouts/providers | Ordered route or business destination → OJO page ID mapping, including default entry and 404 where applicable |
| Navigation | Router version and actually used APIs; nested routes, dynamic parameters, search/hash, guards, loader/action, history/location state | Concrete parameter examples and a compatible navigation/context strategy; list unverified semantics |
| Cross-page state | Context/Redux/Zustand, playback, forms, File/Blob/Object URLs, storage and subscriptions | Ownership and lifetime after splitting into independent frames; identify data that cannot simply be serialized |
| Data and identity | API call sites, Vite proxy, cookie/redirect assumptions, CORS/origin restrictions, environment variable names | Real API/auth flow usable from the target, or a concrete authorized adapter; no invented login or fixture substitution |
| Build and assets | Used plugins/macros, aliases, dynamic imports/globs, workers/WASM, styles and public paths | A known Rspack/scaffold mapping, or a specifically scoped build adaptation |
| Target baseline | Real export provenance, React/runtime compatibility, entry discovery, navigation/store bridge, snapshot consumer | An inspectable working baseline or an explicitly available source from which it can be obtained |
| Default snapshots | Per-page default content, actual store/query fields, representative dynamic data | At least one renderable baseline per mapped page; `{}` only for genuinely stateless defaults |

Read relevant files and trace used features. A package.json dependency alone does not prove that SSR, router data APIs, or an unsupported feature is actually required. Do not read secret values; record names and expected providers only.

## Decision rules

### ready — eligible to convert

The implemented browser application and target baseline have known mappings, all essential pages/behaviors are inventoried, and no unresolved adaptation affects their preservation. Routine file/layout/build translation is still expected. This does not mean the host has already been tested or that every feature of the framework is supported.

### adaptation_required — identify and resolve specific work

A feasible adaptation is identifiable, but work or evidence remains. Examples include:

- React Router nested layout, dynamic slug, query filters, or navigation history needs a verified OJO bridge adapter.
- State-driven primary destinations must become distinct pages while preserving shared state.
- Vite proxy/API paths or a build plugin require a target-compatible replacement.
- Continuous playback, in-memory uploads, authentication redirects or unsaved forms need a cross-frame lifetime strategy.
- A representative dynamic record, dependency, or usable export is temporarily inaccessible.

For each item record the source path/symbol, user-visible behavior, proposed adapter, verification method, and whether it is resolved or blocked. Continue routine, authorized work when behavior can be preserved. Missing facts block only dependent work. If the only option loses behavior (for example reselecting imported files after navigation), state that tradeoff and obtain the user's choice unless already authorized; do not treat it as an automatic successful conversion. Unknown capability stays here until investigated, rather than being reported ready or permanently unsupported.

### unsupported — stop this conversion workflow

A required behavior has no implemented, verified-compatible adaptation under the current scope. Examples:

- Vue/Angular/Svelte or another non-React app with no available adapter for the React export target. A framework rewrite is a separate scope, not an implicit conversion.
- Required server components/actions, request-time SSR, Node-only execution or backend middleware that cannot be preserved in the browser target and has no usable external service arrangement.
- A required router or browser capability has no available host-compatible implementation, and removing it is not authorized.
- The inspected export/runtime is fundamentally incompatible and no usable alternative exists within the selected scope.

Name the actual source evidence and unsupported behavior. Explain what capability or separately scoped change could remove the block. Do not infer that every Next.js project is unsupported: a separable client-only app may instead require adaptation. Inaccessible files, a missing login, or an unavailable service are operational blockers, not evidence that a framework cannot be converted.

## Publication readiness is separate

Even an eligible source cannot be published until the output passes build, page coverage, snapshot and archive checks. If upload was requested, also verify the selected CLI protocol, target environment, authentication, server feature availability and target project's empty/update constraints. An expired CLI login blocks publication, not local conversion. Never change accounts/environments, remove a prototype, or silently create a different target merely to get past a failure. Follow the user-authorized target or new-project scope. Hosted resource URLs and private iframe resource authentication must be checked separately from API upload success.

## Report format

Use this compact structure in the user-facing preflight summary and, after admission, in conversion-report.md:

- **Decision:** ready / adaptation_required / unsupported.
- **Source and baseline:** paths, versions/provenance, inspected evidence.
- **Pages:** route or navigation state → page ID; parameter/default-data examples.
- **Adaptations:** behavior, evidence, proposed mapping, verification, resolved/blocked status.
- **Blockers:** precise missing input or unsupported requirement and affected phase.
- **Next action:** proceed, resolve a specific adaptation, or stop; preserve existing user authorization.
- **Validation still pending:** source/build, snapshots, browser/host integration, publication.

## Calibration examples

| Evidence | Decision |
| --- | --- |
| Browser-only React + Vite, static content, known compatible export | ready; still run all output checks |
| Blog with Layout/Outlet, slug and category query | adaptation_required until the router adapter and real parameter examples are established |
| One-component music app with three primary views and Object URL uploads | adaptation_required; inventory three pages and resolve file/playback lifetime across frames |
| Required server action performs a database write and no external API preserves it | unsupported in current scope |
| React app is eligible but CLI login expired | retain source decision; publication blocked |
| Framework only appears in unused dependencies | inspect used entry/dependency graph before deciding |
