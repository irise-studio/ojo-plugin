#!/usr/bin/env node

import { readFileSync } from "node:fs";
import spawn from "cross-spawn";
import { install } from "../lib/install.mjs";
import { resolveWindowsOjoCli } from "../codex-plugin/scripts/run-cli.mjs";

const args = process.argv.slice(2);
const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

if (args.length === 1 && ["--version", "-v"].includes(args[0])) {
  console.log(version);
} else if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
  console.log(`OJO installer ${version}

Usage: ojo-plugin [install] [--agent codex|claude-code|other] [--skills-dir <directory>] [--dry-run]

Install the OJO CLI when missing, then install for the selected agent:
  codex        Codex marketplace/plugin (default; requires Codex CLI and Git)
  claude-code  Standalone skills in ~/.claude/skills (or CLAUDE_CONFIG_DIR/skills)
  other        Standalone skills in ~/.agents/skills

--skills-dir overrides the standalone skills directory; unavailable for Codex.
Other agents must support SKILL.md and load the chosen directory.
Claude Code/other installs do not require Codex or use a plugin manager.

Requires Node.js 20+ and npm. Git is also needed for GitHub-source npx installs.
An existing compatible OJO CLI is preserved. OJO_CLI_BIN selects a custom CLI.
--dry-run prints the install commands without executing them.
--version prints the installer version. --help prints this message.

Start a new agent session after installation. Login is separate: ojo auth login.`);
} else {
  try {
    const options = {};
    const seen = new Set();
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (seen.has(arg) || !["install", "--dry-run", "--agent", "--skills-dir"].includes(arg)) {
        throw new Error("Unknown arguments. Run ojo-plugin --help for usage.");
      }
      seen.add(arg);
      if (arg === "--dry-run") options.dryRun = true;
      if (arg === "--agent" || arg === "--skills-dir") {
        const value = args[++index];
        if (!value?.trim() || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
        options[arg === "--agent" ? "agent" : "skillsDir"] = value;
      }
    }
    install({
      ...options,
      run: (command, parameters, { env, inherit, timeout }) => {
        try {
          const target = process.platform === "win32" && command === (process.env.OJO_CLI_BIN?.trim() || "ojo")
            ? resolveWindowsOjoCli(command, env) : { file: command, prefix: [] };
          return spawn.sync(target.file, [...target.prefix, ...parameters], {
            env, timeout, encoding: "utf8", stdio: inherit ? "inherit" : ["ignore", "pipe", "pipe"],
          });
        } catch (error) {
          return { status: null, error };
        }
      },
    });
  } catch (error) {
    console.error(`Installation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
