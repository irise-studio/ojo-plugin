---
name: generate-irise-snapshots
description: Generate, validate, and materialize local Irise state-page snapshot JSON from an already implemented prototype, following the server generate_state_page workflow and frontend blueprint contract. Use when the user asks Codex to create, update, repair, or render snapshots, state pages, status pages, UI state coverage, or page-local .snapshots.json files locally.
---

# Generate Irise Snapshots

Follow [CLI and API only](../ojo-workspace/references/transport-policy.md) for all operations. Browser automation is prohibited, including login, Team setup, remote chat retrieval and visual verification. Report unsupported client operations explicitly; never fall back to a browser.

Extract page-consumed state from an existing prototype, validate one snapshot file per page, and materialize the combined local blueprint only after every page passes.

Read [generate_state_page contract](references/generate-state-page-contract.md) before editing snapshot files.

## Boundary

- Require an already implemented, compiled prototype. Use `build-irise-prototype` first when source or dist is missing or stale.
- Keep this workflow separate from prototype generation. Do not plan pages or build the shared component kit. The convert-to-ojo workflow may explicitly invoke this skill after its initial build to generate the default snapshot for each converted page; ordinary prototype generation remains separate.
- Treat screenshots and canvas-export snapshots as different concepts. This skill owns renderable UI state JSON only.
- Keep source read-only during extraction. A source repair is allowed only when visible state is required but the implemented page has no real store/query field capable of rendering it; after that repair, rerun `build-irise-prototype` before continuing.

## Discover the page set

1. Read the complete ordered page set from `prototype/delivery/artifacts/page-manifests/<page_id>.json`. Do not infer it from existing snapshot files.
2. Read `prototype/delivery/artifacts/page-stages/<page_id>.json` when present. Its `state_contract.expected_states` entries with `required != false` are required coverage.
3. Process independent pages concurrently when parallel work is available. Keep each page task inside its own source/store evidence and snapshot path.

## Extract one page

1. Inspect the current page source, its single page-local store, selectors, actions, and query-param bridge.
2. Inventory only fields that produce meaningful visible branches: normal content, empty/error/loading/success, page-level modal/drawer, materially different expansion, selection, filter, or tab states.
3. Exclude scroll/viewport position, hover/focus/animation, timers, lifecycle/debug flags, draft values without visible impact, and marker-only scenario fields.
4. Merge aliases and near-duplicates. Do not emit a Cartesian product or multiple snapshots with identical serialized state.
5. Write exactly one complete file:

   `prototype/src/pages/<page_id>/states/<page_id>.snapshots.json`

6. Preserve each required expected-state label exactly in `name` or as an exact substring. Never invent a state key just to satisfy a planned label.
7. Put the data-rich normal render at `snapshots[0]`. Place loading, empty, error, skeleton, and overlay-only states after it. If one snapshot sets a blocking flag true, every normal snapshot must explicitly set that field false.

## Validate and materialize

Resolve the script relative to this `SKILL.md`, then run a read-only gate first:

```bash
node scripts/build-local-snapshots.mjs <workspacePath> --validate-only --json
```

Require `protocol=generate-state-page-build-gate.v1`, `protocolVersion=1`, and `status=passed`. Repair structured errors in the named page snapshot; do not parse human prose or bypass failures.

After the prototype stable dist is current, materialize the combined blueprint atomically:

```bash
node scripts/build-local-snapshots.mjs <workspacePath> --dist <stableDistPath> --json
```

The build requires one compiled `<page_id>.html` per declared page and writes only `<stableDistPath>/data/blueprint.json`. It preserves a valid existing blueprint version, uses `src/data/app.json.entryPage`, and assembles page groups in manifest stage order. A failed gate leaves the prior blueprint unchanged.

## Preview restriction

Local Irise Web canvas startup and preview are temporarily disabled. Do not run `ojo workspace dev`, wait for `prototype_updated`, or provide a canvas URL. Report the passing snapshot gate and materialized blueprint separately from unavailable visual verification; do not claim visual completion from valid JSON alone.

This skill never uploads snapshots, calls `state-page-revision`, emits a remote `set_prototype`, or consumes SSE. Remote publish remains a separate future/user-authorized operation.

## Failure handling

- Missing or stale frame: return to `build-irise-prototype`; do not edit dist HTML.
- Unknown `state` key: map it to a real page-consumed store/query field or surface the missing implementation contract.
- Missing required state with no implementation evidence: report the gap instead of fabricating a marker or duplicate `{}`.
- Duplicate id/name/state: collapse to the smallest representative set.
- Blocking-state interlock: set the same loading/empty/error flag to `false` in every normal snapshot.
- Source repair required: make one focused page-local repair, rebuild the prototype, then regenerate and revalidate that page's snapshots.
