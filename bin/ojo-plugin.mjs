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
  console.log(`OJO Codex plugin installer ${version}

Usage: ojo-plugin [install] [--dry-run]

Install the OJO CLI when missing, register the Irise Studio marketplace,
install ojo@irise-studio, and verify its installed and enabled state.

Requires Node.js 20+, npm, Git, and a Codex CLI supporting 'plugin add'.
An existing compatible OJO CLI is preserved. OJO_CLI_BIN selects a custom CLI.
--dry-run prints the install commands without executing them.
--version prints the installer version. --help prints this message.

Start a new Codex task after installation. Login is separate: ojo auth login.`);
} else if (args.some((arg) => !["install", "--dry-run"].includes(arg)) || args.filter((arg) => arg === "install").length > 1 || args.filter((arg) => arg === "--dry-run").length > 1) {
  console.error("Unknown arguments. Usage: ojo-plugin [install] [--dry-run]");
  process.exitCode = 1;
} else {
  try {
    install({
      dryRun: args.includes("--dry-run"),
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
