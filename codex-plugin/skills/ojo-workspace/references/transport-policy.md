# CLI and API only

This policy applies to every skill and reference in the OJO plugin. Do not use
Browser/CUA, browser automation, Playwright, browser-side fetch/evaluate, shell
browser openers, or a UI fallback for authentication, Team selection, upload,
conversation retrieval, or canvas verification. Older descriptions of the local
canvas's browser runtime describe the product, not permission to operate it.

Use the installed, user-selected CLI and verified authenticated API clients.
Keep credentials inside their existing authentication provider; never extract
tokens or cookies to compose curl commands. Do not invent commands or endpoints.
If the installed client lacks an operation, report that capability gap instead
of opening a browser or silently switching CLI generations.

On AUTH_REQUIRED, use the selected CLI's supported no-auto-open login flow and
give the user its exact login instructions for manual completion. If that CLI
cannot suppress auto-opening, ask the user to run login in their own terminal.
Wait for confirmed authentication before retrying the original operation once.

Local Irise Web canvas services are temporarily disabled for this plugin. Do not
run `ojo workspace dev`, request an `irise-web` checkout, or return a localhost
canvas URL. Validate local artifacts and supported APIs; report visual/interactive
checks as unavailable unless the user independently supplies evidence. Do not
treat this policy as permission to fabricate visual verification, weaken conversion
eligibility, or use undocumented canvas mutation endpoints.
