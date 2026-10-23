# Initial preflight telemetry

This measures incoming conversion attempts, not unique projects, completed conversions or market-wide compatibility. Record one initial verdict per actual conversion attempt. Re-analysis and adaptation work in that attempt retain the original event; report final validation separately in the conversion report, not as another initial preflight.

## Respect configuration and discover the command

`OJO_CONVERSION_TELEMETRY=off` (also `0` / `false`) or `DO_NOT_TRACK=1` disables reporting. If disabled, do not create an event file. Otherwise use the same CLI executable selected for this workflow. Check `ojo conversion report --help` for availability; the next CLI also advertises `conversionPreflightTelemetryProtocol: 1`. The local maintenance CLI supports the same command. Do not install another CLI or switch accounts/environments just for telemetry. Missing command, login, endpoint or network means report skipped/failed and continue the authorized conversion decision.

## Build a minimal event

Use a random UUID v4 as `eventId` and the initial assessment time from `new Date().toISOString()` as `occurredAt`. The event is a separate JSON file, never the full report. Store it in a temporary directory outside the source workspace, even when conversion is rejected. Only these six fields are accepted:

```json
{
  "schemaVersion": 1,
  "eventId": "f1b18a5e-62c2-4d4a-bba7-0568b29265af",
  "occurredAt": "2026-09-08T00:00:00.000Z",
  "framework": "vue",
  "decision": "unsupported",
  "reason": "framework_adapter_missing"
}
```

The example ID/time are illustrative: generate fresh values only for a new actual attempt. `framework` identifies the primary rendered application: `react`, `vue`, `angular`, `svelte`, `other`, `unknown`. Next.js with React maps to `react`; server dependence belongs in the reason. Unknown stays `unknown` until there is source evidence.

Choose one principal reason from the matching decision list; retain additional blockers only in the local report:

| Decision | Allowed reasons |
| --- | --- |
| `ready` | `none` |
| `adaptation_required` | `navigation_adapter_required`, `state_lifetime_unresolved`, `api_auth_adaptation_required`, `build_adapter_required`, `missing_evidence` |
| `unsupported` | `framework_adapter_missing`, `server_runtime_required`, `router_unsupported`, `build_unsupported`, `target_runtime_incompatible`, `browser_capability_unsupported` |

Choose the reason that most directly prevents preserving required behavior, not an unused package name. Inaccessible source/baseline is `adaptation_required / missing_evidence`; expired CLI login is a reporting/publication failure, never a conversion rejection. The full evidence checklist and decision rules remain in [preflight.md](preflight.md).

## Send and retry

```bash
ojo conversion report /absolute/path/to/preflight-event.json --json
```

Keep the invocation outside build/convert command chains that gate progress on telemetry. Results are `sent` (with `duplicate`), `skipped` or `failed` (with a bounded code). The command exits successfully for reporting failures and does not prompt for login. One HTTP attempt has a two-second timeout; do not spin on failures. If a retry is useful after the reported issue is resolved, reuse the exact event file and current authorized account/environment, within seven days. Never replace its ID or timestamp to make a retry count again. Delete the temporary file after acknowledgement or when retry is no longer useful; no source/output folder is created solely for reporting.

The transport uses current session credentials. Endpoint base precedence: `OJO_AGENT_API_BASE`, `IRISE_AGENT_ENGINE_BASE`, `NEXIGHT_AGENT_ENGINE_BASE`, then the configured OJO API origin plus `/api/agent-engine`. Local testing may explicitly use `IRISE_AGENT_ENGINE_BASE=http://localhost:50052`. Do not silently redirect failed staging requests to production.

No project names, paths, IDs, users, source code, credentials, URLs, free-text errors or full package lists belong in event fields or metric labels. The backend publishes only framework, decision and reason. Successful telemetry does not prove conversion or upload success.
