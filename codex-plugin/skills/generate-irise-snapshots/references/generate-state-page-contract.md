# generate_state_page contract

This reference mirrors the current `irise-skill` state-page workflow for local Codex authoring.

## Workflow boundary

`generate_state_page` runs only after prototype source and page dist exist and only when state pages, snapshots, or state coverage are explicitly requested. It does not run inside or automatically after `generate_prototype`.

The server workflow is:

1. Reuse persisted page stages from the completed prototype.
2. Start one `generate_page_snapshots` branch per page concurrently.
3. Run `review_page_state` after each page snapshot extraction.
4. Run `publish_prototype_state` once after every page passes.

Local authoring preserves the same ordering: page-local extraction first, a deterministic local gate second, and one combined blueprint materialization last.

## Page snapshot file

Path: `prototype/src/pages/<page_id>/states/<page_id>.snapshots.json`.

```json
{
  "page": "home",
  "snapshots": [
    {
      "id": "home-default",
      "name": "Default content",
      "purpose": "Data-rich default render",
      "priority": "p0",
      "state": {
        "isLoading": false,
        "isEmpty": false
      }
    }
  ]
}
```

Rules:

- Root `page` equals the page manifest `page_id`.
- `snapshots` contains at least one entry.
- Each entry contains stable `id`, descriptive `name`, `purpose`, `priority` (`p0`, `p1`, or `p2`), and an object `state`.
- Ids, normalized names, and serialized state objects are unique within the page.
- Every state key and literal value matches a field consumed by the current page's store or query bridge.
- `__irise_snapshot_scenario`, `__zk_snapshot_scenario`, and other marker-only fields are forbidden.
- `state_contract.expected_states` entries remain required unless `required: false`; their labels stay exact in snapshot names.

## Extraction threshold

Include a snapshot only when the resulting iframe is a meaningful user-visible branch. Good dimensions include normal content, empty/error/loading/success, a page-level modal or drawer, and a selection/filter/tab that materially changes the page.

Never snapshot scroll position, anchor/viewport location, hover/focus/spotlight, animation or timer phases, initialization bookkeeping, debug flags, or input values with no immediate visible result. Do not enumerate every value of a single tab/category control when one representative alternate proves the branch.

If no meaningful page-consumed state exists, use one baseline with `state: {}`. If a required planned state cannot be represented, surface a runtime/source repair need; never create duplicate empty states.

## Default and interlock rules

The frontend chooses `snapshots[0]` as the default preview. Put the normal data-rich state first whenever it exists. Blocking/temporary states follow it.

Snapshot states are mergeable patches. If any snapshot sets a loading, empty, or error flag to `true`, every normal/content snapshot must explicitly set the same flag to `false`; otherwise the preview can inherit a blocking scene.

## Combined blueprint

The local materializer writes `prototype/dist/data/blueprint.json` with the frontend contract:

```json
{
  "version": "0.1.31",
  "entryPage": "home",
  "snapshots": [
    { "page": "home", "snapshots": [] }
  ]
}
```

`entryPage` comes from `prototype/src/data/app.json` and references a declared, compiled page. `snapshots` follows page-manifest stage order. The blueprint is generated from page-local snapshot files; it is not an independently authored source of truth.
