#!/usr/bin/env node

import { checkOjoCli, LEGACY_CLI_PACKAGE, NEXT_CLI_PACKAGE } from "./cli-contract.mjs";
import { runCliSync } from "./run-cli.mjs";

const legacyImport = process.argv.includes("--legacy-import");
const command = (legacyImport && process.env.OJO_LEGACY_CLI_BIN?.trim())
  || process.env.OJO_CLI_BIN?.trim()
  || (process.platform === "win32" ? "ojo.cmd" : "ojo");
const result = checkOjoCli((args) => runCliSync(command, args), { legacyImport });

process.stdout.write(`${JSON.stringify({
  ...result,
  command,
  ...(result.ok ? {} : {
    cliSetup: legacyImport
      ? `Set OJO_LEGACY_CLI_BIN to the JavaScript entry of a compatible ${LEGACY_CLI_PACKAGE} installation.`
      : `Install with: npm install -g ${NEXT_CLI_PACKAGE}`,
  }),
})}\n`);
process.exitCode = result.ok ? 0 : 1;
