# Agent installation implementation plan

**Goal:** Deliver separate Codex, Claude Code and other-agent installation paths.

**Architecture:** Keep CLI validation shared. Route Codex to the existing
marketplace flow and standalone hosts to a filesystem installer using the
bundled skills as the source. Use Node built-ins and existing cross-spawn.

**Spec:** ../specs/2026-11-18-agent-installation-design.md

## Constraints and review focus

- Node.js 20+, current next-generation CLI contract, no new dependencies.
- Default install remains Codex; standalone installs never invoke Codex.
- Dry-run cannot write; unknown targets and conflicting skills fail early.
- Installed resources must survive npm cache removal and retain working paths.
- Reruns cannot delete unrelated content or overwrite local edits.
- Cross-platform paths and npm subprocess environment retain existing behavior.

## Tasks

1. Add failing behavioral tests for standalone routing, real filesystem copies,
   portable helpers, repeat installs, conflicts, dry-run and error boundaries.
2. Implement `lib/skills.mjs`, extend `install()` with agent/skillsDir/homeDir,
   and parse the new arguments in `bin/ojo-plugin.mjs`. Run affected tests.
3. Include skills in the GitHub distribution and rewrite bilingual root
   installation docs around the three audiences. Link Codex-specific docs.
4. Run the whole suite, inspect and execute the packed installer in isolated
   directories, review the diff and required checks, and prepare a linked PR.
   Preserve existing publishing settings; do not merge or publish.
