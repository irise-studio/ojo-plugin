# Remote OJO chat

Remote chat is allowed when the user asks OJO to discuss, propose, or execute work. Changing plugin instructions alone does not request a live message. This workflow uses existing CLI commands; it does not add a chat service or consume SSE.

## Verify the client and target

Run the bundled check-ojo-cli script and use exactly the executable it verified. Confirm `chat --help` and `query --help` expose the options below before sending. `pluginSse=false` and `pluginInteraction=local-browser-client` describe the local canvas transport; they do not prohibit these separately verified CLI commands. Do not use legacy npm packages as a fallback.

Use the explicit project ID and expected environment. For optimizing an imported local app, finish the authorized conversion/publication first and use that same target. Missing project ID does not block source preflight, but it blocks dispatch into an existing project. Do not omit `--project-id` accidentally: the current chat command creates a project when it is omitted. Use that behavior only when the user explicitly requests creating a new project and sending its initial message, and capture the returned identity. It is not an empty-project import helper.

## Dispatch once

The current CLI supports:

```bash
ojo chat --project-id <projectId> --json < <message-file>
ojo query --project-id <projectId> --json
```

These are syntax examples; resolve the real CLI, target, and file paths. Write the exact user-visible message to a temporary UTF-8 text file and redirect stdin, or use properly escaped structured process arguments with `--message`. Never interpolate untrusted message content into shell code. No credentials or unrelated files belong in the message.

A request for “a proposal first, execution after my confirmation” authorizes a proposal-only message. Include the selected project/page, requested optimization goals, and an explicit instruction to return the proposal without editing files, changing the prototype, publishing, or executing the proposal. Request a planning-only mode if the verified service supports one; a natural-language instruction is not an enforced read-only server mode. If actual capability evidence shows the endpoint cannot honor this boundary, report that limitation before dispatch. Do not request implementation until the user has confirmed the concrete proposal.

After confirmation, send one follow-up identifying the approved proposal and its exact scope. Preserve rejected items and user corrections. Sending a message is not evidence that work finished.

`chat` currently returns `projectId`, `projectUrl`, and `status: running`; it does not return the completed proposal or a run ID. Require the expected project identity. On an ambiguous network failure, query the project before considering a retry; do not blindly resend a potentially accepted message.

## Observe and retrieve

Query the same project using `query --project-id ... --json`. The current output contains `projectId`, `projectUrl`, `status`, optional `statusText`, and optional `failure`. Status values include `running`, `success`, and `fail`. It describes the project's latest run, not a command-correlated run ID; do not attribute an unrelated concurrent run to this request without evidence.

Use bounded polling with backoff, for example 5, 10, 20, then 30 seconds, keeping the user informed and stopping on a terminal state, required user action, or a reasonable deadline. Do not resend chat to poll. On timeout, report the run as pending with its project link.

Do not assume `statusText` is the complete assistant response. Inspect its actual content; if the full proposal is absent, use an available supported CLI/API conversation-read operation for the same project and environment. Browser retrieval is prohibited by [transport policy](transport-policy.md). Do not invent history endpoints or create an SSE listener. If the complete answer remains inaccessible, report dispatch/status separately from response retrieval instead of inventing a proposal.

Show the actual OJO proposal (or an accurately labeled summary) to the user and stop for the requested confirmation. A success status is not proof that a design change or publication passed verification. Verify resulting artifacts/canvas separately after approved execution. Clearly label any Codex-authored fallback analysis.

## Authentication and failure

Use existing CLI authentication. If chat/query returns `AUTH_REQUIRED`, follow the CLI-only manual login flow in [transport policy](transport-policy.md). Retry once after confirmed authentication; an uncertain dispatch error must first be reconciled with query. Respect provider errors and target identity; do not switch projects or accounts to get past a failure. The plugin must not operate a browser for sign-in.

## Handoff

Report the exact project, whether the message was accepted, observed latest-run status, whether the full response was retrieved, and whether proposal confirmation is pending. Keep remote run outcomes separate from local build, upload, and canvas verification. Never claim remote chat was tested merely because help and capability checks passed.
