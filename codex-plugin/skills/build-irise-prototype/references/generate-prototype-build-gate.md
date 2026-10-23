# generate_prototype build gate contract

This reference mirrors the current server ownership boundaries used by `generate_prototype`. The CLI exposes the locally executable deterministic subset as `generate-prototype-build-gate.v1`.

## Server workflow

1. `plan_prototype_pages` writes the complete ordered per-page manifest set and optional shared component requirements.
2. The runtime starts planned page branches together.
3. Each `implement_page_code` branch writes only its page-local source and passes `build_prototype`.
4. Each review branch validates the existing page dist and deterministic visual/package rules with `review_prototype`.
5. After page branches pass, the runtime assembles and publishes the cumulative dist once.
6. Prototype delivery stops there. The separate `generate_state_page` workflow owns state discovery, page-local snapshot JSON, state review, and blueprint publication.

Local builds preserve the same ordering: metadata establishes page truth, independent page source may be developed concurrently, and stable dist publication happens only after all deterministic phases pass.

Each page branch owns exactly one page's source/work/dist boundary. A passing page build is invalidated by any later source write. Page-code review validates the existing browser-ready page dist and rebuilds only after a focused source repair or when that dist is missing or stale.

## Page manifest

Path: `prototype/delivery/artifacts/page-manifests/<page_id>.json`.

Required root fields:

- identity: `page_id`, `stage_id`, `route_path`, `title`, `role`, `platform`, `split_reason`
- structure: `navigation`, `sections`, `responsive`
- downstream guidance: `functionality_hint`, `visual_hint`, `user_intent`, `not_owned`

Rules:

- `page_id` is lowercase and URL/file-safe; filename equals `<page_id>.json`.
- `stage_id` uses unique stable `M1`, `M2`, ... values.
- the earliest stage is the entry page and uses `split_reason: single_page_entry`.
- `route_path` starts with `/`, is unique, and is not a hash route.
- `platform` is exactly `mobile`, `tablet`, or `desktop`.
- navigation targets are typed `page` or `section` targets. External URLs, `mailto:`, `tel:`, and hash-anchor navigation are not prototype targets.
- page targets reference declared page ids. Section targets include a declared `owner_page_id` and `section_id`.
- `navigation.uses_components` references components declared in `component-requirements.json`.

## Shared component metadata

Path: `prototype/delivery/artifacts/component-requirements.json`.

The root contains `components`, `usage_by_page`, and `page_component_requirements`. Shared shell/navigation belongs here. Page source consumes the shared kit and does not recreate page-local Navbar, Header, BottomNav, or Footer replacements.

## Source workspace

The service template contract requires:

- `prototype/package.json` with pnpm `packageManager`, `scripts.typecheck`, and `scripts.build`
- `prototype/rspack.config.ts`
- `prototype/tsconfig.json`
- `prototype/src/data/app.json`
- `prototype/delivery/artifacts/theme.json`
- page source under `prototype/src/pages/<page_id>/source/`
- one Rspack page entry per declared page

`src/data/app.json.entryPage` references a declared page and is included in `pages`. Additional pages are discovered from the complete manifest set and Rspack entries; `app.json.pages` is not required to duplicate that full set.

## Build phases

The server page gate validates source contracts, then starts TypeScript and Rspack as one concurrent group. The local CLI performs the same concurrency against a staging output directory. It does not write directly into the stable dist.

The compiled package must contain:

- `<page_id>.html` for every declared page
- `data/theme.json`
- `data/store.json`

Each HTML frame must be renderable, contain no uncompiled module imports, use package-relative local asset references, and reference only files present in the final package. `data/blueprint.json` belongs to the separate state/snapshot boundary: it is not required for prototype dist publication, but when present its `entryPage` must reference a published page and `snapshots` must be an array.

Prototype source must not contain debug/snapshot controls, marker-only state, placeholder media/copy, or visible controls wired to empty handlers. Business state stays page-local and its default render must be valid and non-empty so later snapshot extraction has real implementation evidence.

## Result contract

Both CLI commands emit one JSON result:

```json
{
  "ok": true,
  "status": "passed",
  "protocol": "generate-prototype-build-gate.v1",
  "protocolVersion": 1,
  "mode": "build",
  "workspacePath": "/absolute/workspace",
  "prototypeRoot": "/absolute/workspace/prototype",
  "distPath": "/absolute/workspace/prototype/dist",
  "pageIds": ["home"],
  "phases": [
    { "name": "manifest", "status": "passed", "errors": [], "warnings": [], "durationMs": 1 }
  ]
}
```

Failure sets `ok=false`, `status=failed`, and process exit status 1. Machine callers must inspect the structured phase errors instead of parsing human log text.
