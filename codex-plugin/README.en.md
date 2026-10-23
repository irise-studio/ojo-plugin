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

1. Add this repository's marketplace from a terminal:

   ```bash
   codex plugin marketplace add irise-studio/ojo-plugin --ref main
   ```

2. Start Codex and enter `/plugins` to open the plugin directory.
3. Select the **Irise Studio** marketplace, open **OJO**, and install it.
4. Start a new task after installation so that the plugin skills are loaded.

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
