# Dormant ojo local-canvas CLI contract

> **Temporarily disabled for the OJO plugin.** This file records the underlying
> CLI implementation contract for later restoration and direct CLI maintenance.
> Plugin workflows must not invoke `ojo workspace dev`, export a local canvas,
> request an `irise-web` checkout, return a localhost canvas URL, or invoke
> `ojo workspace publish-resources` while the restriction in the parent skill is
> active. The command descriptions below are not an allowed plugin tool surface.

The CLI implementation can act as a local canvas process bridge, but that bridge
is currently outside the plugin's enabled behavior.

## Capability handshake

```bash
ojo capabilities --json
```

The plugin requires these fields:

```json
{
  "schemaVersion": 2,
  "generation": "next",
  "pluginInteraction": "local-browser-client",
  "pluginSse": false,
  "canvasSource": "local-workspace",
  "browserClientProtocol": 1,
  "browserDevProtocol": 3,
  "canvasExportProtocol": 1,
  "localCanvasStorageProtocol": 2,
  "browserAuthProtocol": 1,
  "localPrototypeUpdateProtocol": 1,
  "localPrototypeBuildGateProtocol": 1,
  "localPrototypePublishProtocol": 1,
  "localResourcePublishProtocol": 2
}
```

Do not use npm `latest` as a fallback. Published versions target the old service generation.

## Implemented runtime commands (not currently enabled for plugin use)

```bash
ojo workspace dev <localPath> --project-id <projectId> --json
ojo workspace dev <localPath> --project-id <projectId> --port 4173 --json
ojo workspace dev <localPath> --project-id <projectId> --no-install --json
ojo workspace dev <localPath> --project-id <projectId> --prototype-dist <compiledDistPath> --json
ojo workspace sync <projectId> --path <localParent> --json
ojo auth login --mode web --no-open --json
ojo prototype validate <workspacePath> --manifest-only --json
ojo prototype validate <workspacePath> --prebuild --json
ojo prototype validate <workspacePath> --dist <compiledDistPath> --json
ojo prototype build <workspacePath> --dist <compiledDistPath> --json
ojo prototype publish <workspacePath> --project-id <projectId> --dist <compiledDistPath> --json
ojo workspace publish-resources <localExportPath> --project-id <projectId> --json
```

`workspace sync` downloads the explicit project's active source snapshot into a persistent local project directory. If lightweight project metadata omits the active prototype workspace hash, it resolves that hash from the already authorized canvas-export project detail. It never uploads. `prototype validate` and `prototype build` are local filesystem commands and never authenticate, upload, or call the server. `--manifest-only` runs only the page-manifest/shared-component phase; `prototype build` compiles into a staging dist, validates the service-aligned package, and atomically replaces the stable dist only after every phase passes.

`prototype publish` is authenticated and project-bound. It always reruns `prototype build`, creates the source workspace snapshot, asks `POST /projects/{projectId}/prototype-publish:prepare` for the normal generated-artifact upload plan, injects the returned dist base href into HTML frames, uploads dist files plus manifest/theme/store/optional blueprint/acceptance, marks every resource ready, then calls `prototype-publish:commit`. Commit revalidates checksums, JSON metadata, the complete build receipt, resource readiness, and draft base version before the same `EditPrototype(set_prototype)` transaction used by normal generation. A failed upload or validation never switches the project prototype.

`localPath` may be:

- an Irise Web repository root;
- that repository's `apps/canvas` directory;
- a local `ojo-prototype` directory;
- another local frontend directory containing `package.json`.

For a directory returned by `workspace sync`, the CLI resolves the nested `prototype/package.json` package automatically. Standalone Rspack prototypes receive the same explicit loopback host and reserved port contract as the other supported dev servers.

For Irise Web, the CLI starts the canvas dev orchestrator with `canvas`, `no-interactive`, and `no-proxy` options. It does not open a remote canvas.

The project id is mandatory. Before starting the frontend, the CLI calls `GET /api/server/v1/projects/{project_id}/canvas-export`, downloads the returned resource and prototype-dist file plan into an isolated local directory, and emits an `exporting` lifecycle event. That project-scoped directory contains the root `canvas-export.json` index and exactly two on-disk artifact prefixes: `prototype/**` and `resource/{images,videos,audio,html,documents,archives,models,text,other}/**`. The resource type partition mirrors S3 while omitting owner/project segments already represented by the isolated local root. Prototype file metadata uses `/__ojo_local__/prototype-dist/**` as the canonical Browser URL; Irise Web maps that route to the physical `prototype/**` directory and retains `/__ojo_local__/prototype/**` for older clients.

The export-plan GET and every planned artifact GET use finite retries for transient DNS, socket, TLS, timeout, rate-limit, and selected upstream 5xx failures. The CLI does not retry permanent authentication/client errors. Exhausting the retry budget fails startup and removes the incomplete temporary export rather than emitting `ready` for a partial canvas.

When `--prototype-dist` is provided, the CLI atomically overlays that compiled directory onto physical `prototype/` before the frontend starts. It watches later build output, assigns content-addressed resource/frame ids, writes canonical `/__ojo_local__/prototype-dist/**` URLs into `canvas-export.json`, updates `prototype/manifest.json`, and emits the same `IRISE_PROJECT_DRAFT_MUTATION_REQUESTED` / `set_prototype` draft-mutation shape used by the online frontend. Transport is a CLI-owned one-way loopback WebSocket with protocol version 1. It is strictly an artifact refresh channel, not a canvas action or conversation client.

The local Irise Web dev middleware accepts supported resource files from the visible same-origin Browser page, copies them into `resource/<type>/`, and atomically persists resource metadata plus later draft mutations in `canvas-export.json`. Storage protocol 2 initializes `local_resource_schema_version=1` and a `local_resources` index. Each locally added file receives a content-derived `local_id`, typed path, full SHA-256, byte size, source names, local aliases, and nullable remote identity fields. Re-adding identical typed bytes reuses the same local id and aliases. It never requests an OSS signature, calls a remote resource-link API, or uploads the file to the server.

The local id is the durable migration identity, not a promise that the server will reuse the local `resource_key` or `short_id`. `workspace publish-resources` is the only allowed resource uploader. It validates the indexed bytes and typed identity, obtains authoritative server identities through the normal upload-credential/direct-upload/ready/link sequence, verifies the linked short id, normalizes matching local edits into add-only resource nodes, and calls `POST /projects/{projectId}/local-resources:sync`. The server rebases those nodes onto the locked current draft, validates their exact project resource mappings, reuses already-synced node identities, and rejects conflicting node identities. It defaults to unsynced resources referenced by local mutations; `--local-id` is an explicit subset.

The draft service may compact an update into its canonical create mutation. Success verification waits for the committed version and checks the server-issued short id on the same node; it does not require a byte-identical mutation array. If a previous invocation committed successfully but observed a stale or interrupted readback, the next invocation may adopt that verified canonical keyframe and finish the local mapping without repeating the upload or draft PUT.

The command is long-running. With `--json`, stdout contains JSON Lines lifecycle events and frontend logs go to stderr. Wait for:

```json
{
  "event": "ready",
  "source": "local-workspace",
  "healthUrl": "http://127.0.0.1:4173/",
  "url": "http://127.0.0.1:4173/p/project-1?mode=codex",
  "projectId": "project-1",
  "localExportPath": "/tmp/ojo-canvas-project-1-abc123",
  "resourceCount": 6,
  "prototypeDistFileCount": 12,
  "prototypeDistPath": "/path/to/local/prototype/dist",
  "localPrototypeUpdateProtocol": 1,
  "path": "/path/to/local/workspace",
  "port": 4173
}
```

With `--prototype-dist`, stdout also includes:

```json
{"event":"watching_prototype","path":"/path/to/local/prototype/dist","protocol":1}
{"event":"prototype_updated","sequence":2,"workspaceHash":"...","fileCount":12,"frameCount":5,"entryPath":"home.html"}
```

The first materialization uses sequence 1; each completed local rebuild produces a newer sequence and draft version. Consumers wait for a newer `prototype_updated` event and report visual verification separately; browser automation is prohibited.

`healthUrl` proves only that the listener is reachable. Return the exact CLI-issued loopback project URL for manual preview. A download for local editing includes manifest validation and, when requested, a running preview; report visible canvas checks as pending. Do not operate a browser.

## Manual authentication

Follow [CLI and API only](transport-policy.md). If the selected CLI supports
`ojo auth login --mode web --no-open --json`, its `login_required` event provides
the exact URL for the user to open manually. Keep the callback process alive
until `authenticated`, then retry the original operation once. Verify the target
environment; never reconstruct URLs or read authentication material.

## Command scope

The plugin uses `ojo auth` for the documented manual login flow, which also applies after chat/query returns `AUTH_REQUIRED`. User-requested remote chat and run queries use `ojo chat` and `ojo query` as specified in [remote chat](remote-chat.md); verify the selected executable’s help and target before dispatch. The enabled plugin workflow may invoke `prototype publish` after an explicit user upload request, but it must not invoke `workspace publish-resources` while the local-canvas restriction is active. The dormant CLI implementation does not create any SSE, SDK, REST, or WebSocket interaction channel for canvas actions; its loopback WebSocket carries only compiled-artifact refresh events.

## Errors

- `WORKSPACE_DEV_PACKAGE_MISSING`: provide an existing local Irise Web repository, `apps/canvas`, or frontend package path.
- `WORKSPACE_DEV_SCRIPT_MISSING`: inspect the local `package.json`; choose another script only when appropriate.
- `WORKSPACE_DEV_TIMEOUT` or `WORKSPACE_DEV_EARLY_EXIT`: inspect stderr and fix the owning local frontend process before retrying.
- `AUTH_REQUIRED`: complete the manual CLI authentication flow once, then retry the same project export once.
- `LOCAL_PROTOTYPE_DIST_MISSING` or `LOCAL_PROTOTYPE_DIST_EMPTY`: build the prototype into the exact `--prototype-dist` directory and require at least one HTML file before retrying.
