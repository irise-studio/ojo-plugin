#!/usr/bin/env node

import { checkOjoCli, NEXT_CLI_PACKAGE } from "./cli-contract.mjs";
import { runCliSync } from "./run-cli.mjs";

const legacyImport = process.argv.includes("--legacy-import");
const command = process.env.OJO_CLI_BIN?.trim()
  || (process.platform === "win32" ? "ojo.cmd" : "ojo");
const result = checkOjoCli((args) => runCliSync(command, args), { legacyImport, importProject: process.argv.includes("--import") });

process.stdout.write(`${JSON.stringify({
  ...result,
  command,
  ...(result.ok ? {} : {
    cliSetup: `Install a next CLI supporting project create, project team and prototype publish: npm install -g ${NEXT_CLI_PACKAGE}`,
  }),
})}\n`);
process.exitCode = result.ok ? 0 : 1;
