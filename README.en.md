<p align="right">
  <a href="README.md">简体中文</a> | <strong>English</strong>
</p>

# OJO: install for your agent

OJO helps agents inspect and convert local websites, synchronize workspaces, build prototypes, generate state snapshots, and perform user-authorized publication and remote conversations. Choose your agent:

| Agent | Installed components | Method |
| --- | --- | --- |
| Codex | OJO CLI + OJO Codex plugin | Codex marketplace |
| Claude Code | OJO CLI + 4 standalone skills | Claude Code skills directory |
| Other agents supporting Agent Skills | OJO CLI + 4 standalone skills | Shared or custom skills directory |

Run the installer directly from GitHub; a separate npm installer release is unnecessary. To test the current source, run `npm ci` and replace the `npx` entrypoint below with `node bin/ojo-plugin.mjs`.

## Codex

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent codex
```

The installer checks Codex command support, prepares the OJO CLI, registers or refreshes the `irise-studio` marketplace, then installs and verifies `ojo@irise-studio`. Requires the official Codex CLI and Git. Start a new Codex task afterwards.

The existing `npx -y github:irise-studio/ojo-plugin#main install` command still defaults to Codex. See [Codex plugin documentation](codex-plugin/README.en.md#installation) for manual installation and full details.

## Claude Code

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent claude-code
```

Installs the OJO CLI and all skills in one operation. Skills default to `~/.claude/skills/`, or `CLAUDE_CONFIG_DIR/skills` when configured. No Codex installation or Claude Code plugin registration is required.

To install for the current project only:

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent claude-code --skills-dir ./.claude/skills
```

Start a new Claude Code session and use `/convert-to-ojo`, or describe your OJO task directly. See [official Claude Code skills documentation](https://code.claude.com/docs/en/skills) for directory discovery rules.

## Other agents

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent other
```

Standalone skills default to `~/.agents/skills/`. If your agent uses another directory, select it explicitly:

```bash
npx -y github:irise-studio/ojo-plugin#main install --agent other --skills-dir ./my-agent/skills
```

Your agent must support `SKILL.md` and load the selected directory. The [Agent Skills documentation](https://agentskills.io/client-implementation/adding-skills-support) describes shared directory conventions; actual discovery depends on the host. The installer verifies files and CLI readiness, not discovery or activation by every agent.

## CLI and skills

All three paths preserve an OJO CLI that passes the contract check, running `npm install --global @touchine-ai/ojo@latest` only when missing. Requires `@touchine-ai/ojo` 2.x with server.v1 capabilities. An incompatible existing CLI stops installation; select a custom executable with `OJO_CLI_BIN`.

Claude Code and other agents receive the same four skills, including references, snapshot scripts, and CLI helpers. Installed skills remain usable after the npx cache is removed.

| Skill | Purpose |
| --- | --- |
| `convert-to-ojo` | Inspect and convert non-OJO local websites or applications |
| `build-irise-prototype` | Implement, repair, validate, and build prototypes |
| `generate-irise-snapshots` | Generate and validate page state snapshots |
| `ojo-workspace` | Synchronize workspaces, publish with authorization, and run remote conversations |

## Requirements and updates

- Node.js 20+, npm, and npm network access. Codex marketplace and GitHub-source installer commands also require Git and GitHub access.
- Append `--dry-run` to any installation command to check and preview without installing CLI or writing skills/marketplace state. Use `--help` for all options.
- Authentication is separate. Run `ojo auth login` when remote operations need it; a valid account and project permissions are required.
- Rerun the same command to refresh the plugin or update installer-managed skills. Conflicting names or locally modified standalone skills stop installation. Preserve edits, move conflicting directories aside, or choose another `--skills-dir` before retrying. Unrelated skills remain untouched.
- If the global npm executable directory is outside `PATH`, installation stops. Inspect `npm prefix -g`, add `<prefix>/bin` on macOS/Linux or `<prefix>` on Windows to `PATH`, and retry.
- Fix or unset an invalid `OJO_CLI_BIN`. On Windows, supported choices are official npm shims, JavaScript entries, or native executables; arbitrary batch wrappers are unsupported.

## Repository and releases

This repository owns the installer, Codex marketplace, and shared skills, not the OJO CLI implementation. Codex plugin assets come from the Git marketplace; Claude Code and other-agent skills ship with the GitHub installer.

```text
.agents/plugins/marketplace.json  # Codex marketplace
codex-plugin/                     # Codex plugin and shared skills/helpers
bin/ojo-plugin.mjs                # installer entrypoint and arguments
lib/install.mjs                   # shared CLI checks and agent routing
lib/skills.mjs                    # standalone installation and conflict checks
```

Maintainers verify the installer and distribution contents in the PR:

```bash
npm ci
npm test
npm pack --dry-run
```

After changes merge to `main`, users rerun the GitHub installation command to update; no separate npm installer publication is needed. A source change or PR does not mean it has merged. Before merging, replace `#main` in the GitHub URL with the branch or commit under review. Installation runs only when the entrypoint is explicitly invoked.
