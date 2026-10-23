<p align="right">
  <a href="README.md">简体中文</a> | <strong>English</strong>
</p>

# OJO Plugin Marketplace

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
```
