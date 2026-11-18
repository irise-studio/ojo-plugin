# Agent-specific OJO installation

Context: https://github.com/irise-studio/ojo-plugin/issues/18

The user requested distinct installation methods for Codex, Claude Code and
other agents, with CLI plus standalone skills for the latter two. There is no
third requirement. This records that direction and the implementation choices.

## Approach

Extend the existing installer with `--agent codex|claude-code|other`.
Keep the no-target command as a Codex compatibility alias. Codex uses the
existing marketplace/plugin flow. Claude Code and other agents reuse the CLI
contract check and copy the four bundled skills without invoking a plugin
manager or requiring either Codex or Claude Code on PATH.

Separate npm packages would add release coordination without a user benefit.
Documentation-only instructions would leave standalone installation incomplete.
The single installer with explicit targets builds on the existing distribution.

## Standalone skills

Claude Code defaults to `~/.claude/skills` (or `CLAUDE_CONFIG_DIR/skills`).
Other agents default to the shared `~/.agents/skills` convention. Both support
`--skills-dir <directory>`; other hosts must actually support the SKILL.md
format and scan the selected directory. Installation cannot prove activation.

Include the existing skills and helpers in the GitHub npx distribution. Materialize the CLI helpers
inside the installed `ojo-workspace/scripts` directory and adapt Markdown helper
references and Codex-specific wording for standalone consumers. Keep sibling
skill references and local snapshot scripts working. Do not create a Claude
plugin manifest, hooks, model/provider settings, or authentication changes.

Preflight all destinations before installing a missing CLI. Refuse unrelated
same-named skills, symbolic links within managed skills, and local edits to a
previous managed installation. Record file hashes in each skill's installer
receipt. Stage new content, replace only the four managed directories, and
restore old directories if replacement fails. Preserve unrelated skills.
Dry-run reads and describes changes without writing files or installing CLI.

The installer remains Node.js 20+, uses the latest main-branch CLI contract
(`@touchine-ai/ojo@latest`), preserves compatible CLIs, and rejects invalid
`OJO_CLI_BIN`. Use GitHub as the documented installer entrypoint; no separate npm release is
needed. Preserve the existing package name, version and publishing configuration.
Only extend the distribution file list to include standalone skills.

## Validation and review

Exercise real temporary directories and installed helper execution, including
reruns, conflicts, modified files, dry-run, paths with spaces, invalid flags,
and CLI failures. Check the tarball used by npx and run its entrypoint after extraction.
Keep the existing Codex and Windows checks. File installation is verified
separately from Claude/other agent discovery and live OJO project operations.

Host references: [Claude Code skills](https://code.claude.com/docs/en/skills),
[Agent Skills discovery](https://agentskills.io/client-implementation/adding-skills-support).

Team OS context lookups returned 404. This note does not claim a central
decision record or a passed `context-bot/risk-gate`; inspect review signals
before any merge. User direction authorizes the source implementation, not an automatic merge.
The user explicitly chose GitHub installation instead of a separate npm
installer release. This does not authorize changing repository publish settings.
