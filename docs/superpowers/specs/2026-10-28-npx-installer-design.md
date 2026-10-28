# OJO npx installer

Context: https://github.com/irise-studio/ojo-plugin/issues/6

The user confirmed the proposed `npx -y @touchine/ojo-plugin@latest install`
flow: prepare the OJO CLI, register the marketplace, install the plugin,
verify the result, and explain how to start using it.

## Approach

Use a small Node.js 20+ CLI that delegates to npm and the official Codex
plugin commands. A single `cross-spawn` dependency handles Windows command
shims without interpolating user input into shell commands. Keep the plugin
distributed through the existing Git marketplace; npm distributes the installer.
Reusing the existing OJO CLI would require a change in a different repository;
copying skills directly would bypass the plugin manager. Neither is needed.

## Behavior and constraints

- `install` is the default; also support `--help`, `--version`, and `--dry-run`.
- Check Codex's actual supported commands before mutating anything. Do not
  install or upgrade Codex automatically.
- Preserve an OJO CLI that passes the shared version and command contract.
  Install `@touchine/ojo@1.0.9` globally only when `ojo` is absent. Refuse
  incompatible or broken explicit `OJO_CLI_BIN` values rather than overwrite them.
- Check configured marketplace sources. Refuse a different source with the
  same `irise-studio` name; never silently replace another marketplace.
- Add `irise-studio/ojo-plugin --ref main` when missing, refresh the same source
  on rerun, and install `ojo@irise-studio`. Verify installed and enabled state.
- Preserve Codex's model/provider/auth settings. Do not initiate OJO login or
  project actions. Explain the new-task and optional `ojo auth login` steps.
- Dry-run reports intended commands without installing dependencies or changing
  marketplaces. Errors stop subsequent steps and return a nonzero exit status.
- Implicit command lookup excludes npm's cache and local `node_modules/.bin`
  entries. An intentionally persistent project-local OJO CLI must be selected
  explicitly with `OJO_CLI_BIN`, also inherited by later Codex tasks.
- First npm publication is a separate release step. Until it happens, label the
  npm command as pending and offer a GitHub-ref install for reviewing the branch.

## Validation

Node's built-in tests cover failure boundaries, compatible/missing/explicit
CLIs, old Codex, marketplace conflicts, reruns, and installed-state verification.
Run the packed CLI and a real install twice with an isolated npm prefix and
CODEX_HOME. Windows process launching is covered by cross-spawn; a real Windows
acceptance run remains a stated limitation unless a Windows runner is available.
The standalone checker uses a dependency-free Windows command shim runner;
the CI matrix exercises its actual executable in a path containing spaces and
an ampersand on Windows, macOS and Linux (Node 20).

Team OS / Context Bot entrypoints returned 404 during this task. This document
records the agreed local design; it does not claim a Team OS decision or passed
`context-bot/risk-gate`. Confirm required review signals before merge.
