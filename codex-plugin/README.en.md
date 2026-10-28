<p align="right">
  <a href="README.md">简体中文</a> | <strong>English</strong>
</p>

# OJO Codex Plugin

## Features

The OJO plugin helps Codex connect local websites and applications to OJO workflows. It currently supports:

- read-only compatibility preflight for non-OJO projects;
- behavior-preserving conversion of local projects based on a real OJO export;
- synchronization of a specified project's prototype workspace followed by manifest validation;
- local prototype validation and builds through the OJO export's own scripts, plus state snapshot generation and checks;
- publication of validated content to a specified OJO project only after explicit user authorization;
- default Team selection and API readback for authorized imports;
- verified `ojo chat` and `ojo query` operations for optimization proposals and user-approved remote execution.

The plugin includes these skills:

| Skill | Purpose |
| --- | --- |
| `convert-to-ojo` | Inspect and convert non-OJO local websites or applications |
| `build-irise-prototype` | Implement, repair, validate, and build local prototypes |
| `generate-irise-snapshots` | Generate and validate page state snapshots |
| `ojo-workspace` | Synchronize workspaces, publish with authorization, and run remote OJO chat and query operations |

The plugin is displayed as **OJO**.

## Requirements

- Read access to the `irise-studio/ojo-plugin` repository;
- Node.js 20 or newer;
- automatic installation also requires npm, Git, npm/GitHub network access, and an official Codex CLI supporting `codex plugin add` (verified with `0.163.0`);
- `@touchine/ojo` CLI `>=1.0.9 <2.0.0`, available as `ojo` on `PATH` or selected with `OJO_CLI_BIN`;
- a valid OJO login and the relevant project permissions for synchronization, publication, remote chat, and query operations.

Install the currently verified CLI release:

```bash
npm install -g @touchine/ojo@1.0.9
```

Then verify its version and command signatures with the bundled checker:

```bash
node codex-plugin/scripts/check-ojo-cli.mjs
```

This repository distributes the Codex plugin, not the OJO CLI. The CLI provides workspace sync, project import, Team, chat/query, screen, and conversion-report operations. Local prototype validation and builds use the export's own scripts, not nonexistent `ojo prototype` subcommands.

## Installation

### Automatic installation

Run:

```bash
npx -y @touchine/ojo-plugin@latest install
```

Alternatively, install directly from GitHub:

```bash
npx -y github:irise-studio/ojo-plugin#main install
```

The installer checks Node/Codex and preserves a CLI that passes the version and command checks. Only a missing CLI triggers `npm install --global @touchine/ojo@1.0.9`. It then registers or refreshes this repository's marketplace, runs `codex plugin add ojo@irise-studio`, and reads back installed/enabled state. Rerunning refreshes the same source and verifies again.

Append `--dry-run` to check prerequisites and preview commands without running npm installs or marketplace writes. Login is separate. Start a new Codex task after installation; run `ojo auth login` when remote project access needs authentication.

- `OJO_CLI_BIN` selects a custom executable. Fix or unset an invalid value; the installer never overwrites it.
- Implicit CLI lookup excludes npm-injected cache and `node_modules/.bin` directories. To intentionally use a project-local CLI, set its full path in `OJO_CLI_BIN` and ensure later Codex tasks inherit that variable.
- An incompatible existing CLI requires an explicit decision to install a compatible version; the installer never silently downgrades it.
- If npm reports a permission error, fix the user's global npm directory permissions and retry. A CLI available only inside the current npx process is insufficient.
- If `ojo` is missing after npm installation, inspect `npm prefix -g` and add `<prefix>/bin` on macOS/Linux or `<prefix>` on Windows to `PATH`, then retry.
- If an existing `irise-studio` marketplace points elsewhere, installation stops before changes. Inspect `codex plugin marketplace list`. Only remove the old source manually after confirming it and its plugins are no longer needed; the installer never replaces it automatically.
- Windows, macOS, and Linux use the same installation entrypoint. Windows CI verifies first/repeat installation and the standalone checker with real Codex/OJO npm releases; isolated installation acceptance has also passed on macOS.
- On Windows, the OJO npm `.cmd` shim only locates the JavaScript bin declared by `@touchine/ojo`. The checker and installer run that bin directly with Node, without interpreting batch text. Custom `OJO_CLI_BIN` values may select a JavaScript file or native executable; arbitrary `.cmd`/`.bat` wrappers are unsupported.

### Manual installation

Install and check the OJO CLI as described above, then:

1. Add this repository's marketplace from a terminal:

   ```bash
   codex plugin marketplace add irise-studio/ojo-plugin --ref main
   ```

2. With a Codex CLI supporting command-line installation, run:

   ```bash
   codex plugin add ojo@irise-studio
   ```

   Alternatively, start Codex, enter `/plugins`, select **Irise Studio**, open **OJO**, and install it.
3. Start a new task after installation so that the plugin skills are loaded.

Optional: inspect the configured marketplaces:

```bash
codex plugin marketplace list
```

To fetch a newer version from the repository, refresh the marketplace:

```bash
codex plugin marketplace upgrade irise-studio
```

## Example prompts

```text
Use OJO to inspect and convert this local website, then validate its build and state snapshots. Upload only after I confirm the target project.
```

```text
Download the prototype workspace for project <projectId> and validate its manifests without starting a local canvas.
```

```text
Ask OJO for an optimization proposal for project <projectId>, show me the actual response, and wait for my confirmation before execution.
```

For the underlying marketplace installation model, see the [official OpenAI plugin packaging documentation](https://developers.openai.com/plugins/build/plugins).
