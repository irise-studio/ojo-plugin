import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, writeFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("the standalone checker executes a CLI shim in a path containing spaces and ampersands", () => {
  const folder = mkdtempSync(join(tmpdir(), "ojo & checker "));
  try {
    const cli = join(folder, "fixture.mjs");
    // Command availability is tested by install.test.mjs; this test exercises process launching.
    const output = "Usage: ojo workspace sync Usage: ojo project team list Usage: ojo project team get Usage: ojo project team set --path <dir> --json <workspacePath> --name <name> --team-id <id> --project-id <id> <projectId> --mode <mode> --no-open --message <msg> --project-id <projectId> <eventFile>";
    writeFileSync(cli, `#!/usr/bin/env node\nconsole.log(process.argv[2] === '--version' ? (process.env.npm_package_version || '1.0.9') : ${JSON.stringify(output)});\n`);
    chmodSync(cli, 0o755);
    const executable = process.platform === "win32" ? join(folder, "ojo.cmd") : cli;
    if (process.platform === "win32") writeFileSync(executable, `@echo off\r\n"${process.execPath}" "${cli}" %*\r\n`);
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("../codex-plugin/scripts/check-ojo-cli.mjs", import.meta.url))], {
      encoding: "utf8", env: { ...process.env, npm_package_version: "0.1.0", OJO_CLI_BIN: executable },
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(JSON.parse(result.stdout).ok, true);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
