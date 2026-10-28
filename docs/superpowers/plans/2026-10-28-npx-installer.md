# OJO npx installer implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this
> small change in the current session, then request a whole-branch review.

**Goal:** Package a complete OJO Codex plugin installer as an executable npm package.

**Architecture:** A thin bin entrypoint uses an installer module and a shared
OJO CLI contract checker. The installer delegates persistence to npm and Codex.

**Tech stack:** Node.js >=20, built-in node:test, cross-spawn.

**Spec:** `docs/superpowers/specs/2026-10-28-npx-installer-design.md`

## Global constraints

- Package: `@touchine/ojo-plugin`; default command: `install`.
- Missing OJO CLI: install `@touchine/ojo@1.0.9`; accepted versions: stable `>=1.0.9 <2.0.0`.
- Marketplace: `irise-studio/ojo-plugin`, ref `main`; selector: `ojo@irise-studio`.
- No model/provider/auth edits, automatic Codex upgrade, login, or project operations.
- First npm publication and merge remain separate release steps.

## Review focus

- Different existing `irise-studio` source must not be overwritten.
- A temporary npx PATH must not make a transient CLI look persistent.
- npm global installation must produce an executable usable in later Codex tasks.
- Nonzero commands or missing/disabled plugin readback must never report success.
- Explicit CLI paths, including spaces, must remain argument-safe.

## Task 1: Installer and shared contract

Files: `package.json`, `package-lock.json`, `bin/ojo-plugin.mjs`,
`lib/install.mjs`, `codex-plugin/scripts/cli-contract.mjs`,
`codex-plugin/scripts/check-ojo-cli.mjs`, `test/install.test.mjs`.

- [x] Write boundary tests; run `node --test` and observe missing-feature failures.
- [x] Implement `install({run, env, nodeVersion, log, dryRun})` and export
  `checkOjoCli(run)` for the standalone checker and installer.
- [x] Add package executable, strict argument parsing, help, version and dry-run.
- [x] Run `npm test`; all tests must pass, including failure stop and rerun tests.

## Task 2: Package, documentation, and delivery

Files: both root READMEs, both plugin READMEs, `.gitignore`.

- [x] Document full install, prerequisites, conflict recovery, first-publication
  status, manual fallback, login/new-task behavior, and maintainer release checks.
- [x] Run `npm pack`, execute its CLI via npx, and verify the shared checker.
- [x] Use a temporary npm prefix and CODEX_HOME for real first/repeat installation;
  record exact results and any unavailable platform coverage.
- [ ] Review the diff, request independent review, fix important findings, run
  focused validation, then commit/push and open a draft PR linked to Issue #6.

Progress: work started after the user's confirmation of the proposed flow.
Ruling: use cross-spawn rather than bespoke Windows shell escaping; this adds
one small runtime dependency and avoids unsafe `.cmd` execution logic.

Validation: packed installer completed a real first installation (missing CLI)
and a repeat installation against an isolated npm prefix and CODEX_HOME on
macOS, using Codex 0.163.0 and OJO 1.0.9. Node 20 tests also passed. The actual
standalone checker passed all ten CLI capability checks against that OJO CLI.
First npm publication remains pending: registry whoami returned HTTP 401.

Independent review found two P2 issues: npm-injected local `.bin` directories
were still accepted, and the standalone checker could not run Windows `.cmd`
shims. The local-PATH regression was observed RED, then fixed. The checker now
has a dependency-free quoted Windows runner and an executable regression test;
the added CI matrix validates that runner on Windows as well as macOS/Linux.
Ruling: implicit lookup excludes every `node_modules/.bin` entry, since npm does
not expose the original PATH. Intentionally persistent local CLIs use explicit
`OJO_CLI_BIN`; otherwise the installer conservatively requires a global CLI.
