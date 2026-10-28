<p align="right">
  <a href="README.md">简体中文</a> | <strong>English</strong>
</p>

# OJO Plugin Marketplace

## Install with one command

Use the `@touchine/ojo-plugin` npm installer:

```bash
npx -y @touchine/ojo-plugin@latest install
```

Alternatively, run the same installer directly from GitHub:

```bash
npx -y github:irise-studio/ojo-plugin#main install
```

The installer checks prerequisites, preserves a compatible OJO CLI or installs the verified release when absent, registers the marketplace, installs OJO, and verifies its state. Start a new Codex task afterwards. Run `ojo auth login` separately when remote operations need authentication. Requires Node.js 20+, npm, Git, access to npm/GitHub, and an official Codex CLI supporting `codex plugin add` (verified with `0.163.0`).

Append `--dry-run` to preview the installation commands, or replace `install` with `--help`. The installer stops on marketplace name conflicts, incompatible existing CLIs, or a global executable directory outside `PATH`. See the [plugin installation documentation](codex-plugin/README.en.md#installation) for requirements and manual fallback.

## Repository purpose

This repository is the Irise Studio distribution repository for the OJO plugin for Codex. It maintains:

- the Codex marketplace catalog;
- plugin packages that end users can install;
- the skills, documentation, and local helper scripts required by those plugins.

This repository does not contain the OJO CLI implementation, and ordinary plugin users do not need read access to the separate `irise-studio/irise-web` repository.
The current plugin targets `@touchine/ojo >=1.0.9 <2.0.0`; install the verified release with `npm install -g @touchine/ojo@1.0.9`.

## Supported plugins

| Display name | Plugin ID | Directory | Status | Main purpose |
| --- | --- | --- | --- | --- |
| OJO | `ojo` | [`codex-plugin/`](codex-plugin/) | Available | Convert and optimize local websites, synchronize OJO workspaces, validate and build prototypes, generate state snapshots, publish content with explicit user authorization, and run remote OJO chat and query operations |

See [`codex-plugin/README.en.md`](codex-plugin/README.en.md) for installation instructions and the complete feature description.

## Repository layout

```text
.agents/plugins/marketplace.json  # Codex marketplace entry
codex-plugin/                     # OJO plugin package for Codex
bin/ojo-plugin.mjs                # npx installer entrypoint
lib/install.mjs                   # installation and verification flow
```

## Maintainer release

The installer has its own npm version; plugin assets continue to come from the Git marketplace. Releases require publishing access to the `@touchine` scope. Merging a PR does not automatically publish to npm.

```bash
npm ci
npm test
npm pack --dry-run
npm publish --access public
```

Review the package name, version, and packed contents before publishing. After publication, verify the npm command in a clean environment. There are no install lifecycle side effects; installation runs only when the executable is invoked.
