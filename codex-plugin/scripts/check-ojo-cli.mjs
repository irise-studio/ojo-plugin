#!/usr/bin/env node

import { checkOjoCli } from "./cli-contract.mjs";
import { runCliSync } from "./run-cli.mjs";

const command = process.env.OJO_CLI_BIN?.trim() || (process.platform === "win32" ? "ojo.cmd" : "ojo");
const result = checkOjoCli((args) => runCliSync(command, args));

process.stdout.write(`${JSON.stringify({
  ...result,
  command,
  package: "@touchine/ojo",
  workflow: "touchine-ojo-1x",
  ...(result.ok ? {} : {
    requiredVersion: ">=1.0.9 <2.0.0",
    cliSetup: "Install with: npm install -g @touchine/ojo@1.0.9",
  }),
})}\n`);
process.exitCode = result.ok ? 0 : 1;
