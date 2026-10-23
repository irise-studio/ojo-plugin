# React + Vite adaptation

## Inventory

Trace HTML to React mount, providers, layouts, and routes. Inspect imported configuration when needed; dependency names alone do not establish behavior. Avoid executing arbitrary config solely to inventory it.

| Area | Record evidence and adaptation |
| --- | --- |
| Pages | Source route/component, layout/provider chain, stable target ID, default entry |
| Dynamic routes | Concrete representative parameters/query values; unresolved user inputs |
| Build | Actual plugins/macros, aliases, glob imports, asset query imports, workers, environment use |
| Styles | Global order, CSS Modules, preprocessors, PostCSS/Tailwind, fonts |
| Data | Request URLs, dev-proxy dependency, authentication assumptions, state ownership |
| Dependencies | React compatibility, pinned versions, local/workspace dependencies |

Do not include credentials in the report. Build the source baseline using its own package manager and lockfile when feasible; distinguish pre-existing failures from conversion failures.

## Pages and routing

Inspect sidebar/menu handlers and state-controlled views before declaring an app single-page. Top-level business destinations need separate OJO pages even when the source shares one component and URL; transient filters and dialogs do not. For an app without business navigation, retain the app/providers behind one page entry. For multiple routes, map meaningful pages to OJO pages. Do not create pages for every modal, tab, hash anchor, or dynamic parameter value.

Persist stable lowercase URL-safe IDs and route mappings in the conversion report. Preserve the selected export's entry discovery and use supplemental manifests for stages, sections, shared components, and typed navigation targets. See [export compatibility](export-compatibility.md). Source hash routing needs an explicit mapping: OJO manifest routes cannot contain hashes.

Trace Router hooks before extracting components. Preserve required Layout/Outlet, router context, loaders, error boundaries, and providers through an adapter compatible with the verified target runtime. Do not replace unhandled behavior with no-op handlers.

Dynamic pages require concrete renderable examples and defined navigation payloads. For `/products/:id`, use a real or explicitly approved fixture ID, retain its pattern-to-page relationship, and test list-to-detail navigation. Implement against the scaffold's actual navigation bridge; do not invent a universal query or message protocol.

External links are not internal page/section manifest targets. Preserve their behavior separately when supported and report incompatibilities. Verify query, initial route, back behavior, and cross-page state: independent frames may not share the source SPA's in-memory providers.

## Build and resources

The current gate directly invokes TypeScript and Rspack. Changing `scripts.build` alone cannot make it run Vite. If retaining Vite is required, report the needed build-contract extension rather than pretending the existing gate supports it.

| Source feature | Adaptation |
| --- | --- |
| Aliases / TS paths | Match TypeScript and Rspack resolution, including copied workspace packages |
| `import.meta.env` | Map used public variables and mode/base semantics; never inject the whole process environment |
| `import.meta.glob` | Preserve eager/lazy and matched-module semantics through supported transforms or explicit imports |
| SVG / `?raw` / `?url` | Preserve export types and values; a URL is not a React component |
| `public/` and root paths | Copy required assets and adapt to package-relative serving |
| Styles | Preserve global order, CSS Modules, preprocessors, PostCSS, and font URLs |
| Dynamic imports / workers | Verify emitted chunks and URLs under the canvas and published base paths |
| Vite-only plugins | Identify the transformation and implement its equivalent or report the unsupported feature |

Retain the scaffold's HTML mounting and per-page outputs, theme/store data, and staging output support. Emit `dist/data/app.json` for correct remote entry selection. Audit HTML, CSS, and runtime-loaded resources: the gate's HTML reference checks do not prove transitive references and fetch URLs work. Do not globally replace path strings with regexes.

## Data, theme, and state

A development proxy is not part of a published static package. Identify dependent requests, preserve real APIs when available, or ask about demonstration data when unavailable APIs block the requested experience. Report substitutions and never fake successful writes or authentication silently.

Keep functional source state and integrate with verified store/query mechanisms where needed; avoid a second disconnected store. Define actions inside the template wrapper's state creator using its supplied `set`. Do not route UI updates through external `store.setState`, which bypasses the wrapper's first-write protection for URL-provided keys. Test hydration, the first conflicting update, and subsequent interactive updates separately. Keep audio elements and Object URLs outside serializable host state where practical; never equate an injected `playing=true` flag with actual audio playback. Merely writing empty JSON does not prove integration. Preserve source styling; editable theme extraction requires actual runtime consumption of the mapped tokens.

Default conversion generates at least one source-backed snapshot per business page. Reconcile the sibling snapshot skill with the export's snapshot reader before extracting keys consumed by the converted pages.

## Acceptance scenarios

- Single-page initial content, styles, assets, and a meaningful state interaction survive conversion.
- Two routes retain shared layout and navigate correctly as OJO frames.
- Parameterized detail/query views render the intended entity and selection.
- Lazy chunks, images, and fonts load under the canvas path.
- API-dependent views retain agreed normal/error behavior.
- Repeated conversion respects existing edits/IDs, and failure preserves source and existing output.
- A real React/Rspack build passes; test fixtures with fake pnpm executables are not integration evidence.
- When publication is requested, remote entry/resources work and downloaded source rebuilds; otherwise publication remains untested.

- Root workspace install/filter scripts work with the retained package names and dependencies.
- Page-bundle output covers every declared page; no silent skip from nested-only entries.
- The export theme source feeds both runtime data and theme-class generation.
- URL-provided state retains the wrapper's first-write protection and later user interactions still work.
- Standalone preview evidence is reported separately from actual OJO host validation.
