import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as cliRunner from "../codex-plugin/scripts/run-cli.mjs";

function fixture(local = false) {
  const root = mkdtempSync(join(tmpdir(), "ojo & npm %shim! "));
  const bin = local ? join(root, "node_modules", ".bin") : root;
  const pkg = join(root, "node_modules", "@touchine", "ojo");
  mkdirSync(bin, { recursive: true });
  mkdirSync(join(pkg, "dist"), { recursive: true });
  const shim = join(bin, "ojo.cmd");
  const marker = join(root, "shell-was-executed");
  // A shim is a locator only: executing this file would write the sentinel.
  writeFileSync(shim, `@echo off\r\necho unsafe > "${marker}"\r\nexit /b 9\r\n`);
  writeFileSync(join(pkg, "package.json"), JSON.stringify({ name: "@touchine/ojo", type: "module", bin: { ojo: "dist/index.js" } }));
  writeFileSync(join(pkg, "dist", "index.js"), "console.log(JSON.stringify(process.argv.slice(2)));\n");
  return { root, bin, pkg, shim, marker };
}

test("Windows global and local npm shims execute their declared JS entry without a shell", () => {
  for (const local of [false, true]) {
    const f = fixture(local);
    try {
      const target = cliRunner.resolveWindowsOjoCli("ojo.cmd", { Path: f.bin });
      const args = ["--help", "a&b", "x|y", "%PATH%", 'a"b', "$(echo nope)", "!expanded!", "line\nbreak"];
      const output = execFileSync(target.file, [...target.prefix, ...args], { encoding: "utf8" });
      assert.deepEqual(JSON.parse(output), args);
      assert.equal(existsSync(f.marker), false);
    } finally {
      rmSync(f.root, { recursive: true, force: true });
    }
  }
});

test("Windows shim resolution rejects arbitrary batch wrappers and package bin escapes", () => {
  const f = fixture();
  try {
    const wrapper = join(f.root, "custom.cmd");
    writeFileSync(wrapper, "@echo unexpected\r\n");
    assert.throws(() => cliRunner.resolveWindowsOjoCli(wrapper, {}), /npm.*shim|batch/i);
    for (const pkg of [
      { name: "another-package", bin: { ojo: "dist/index.js" } },
      { name: "@touchine/ojo", bin: { ojo: "../../outside.js" } },
      { name: "@touchine/ojo", bin: { ojo: "dist/wrapper.cmd" } },
    ]) {
      writeFileSync(join(f.pkg, "package.json"), JSON.stringify(pkg));
      assert.throws(() => cliRunner.resolveWindowsOjoCli(f.shim, {}));
    }
    writeFileSync(join(f.pkg, "package.json"), JSON.stringify({ name: "@touchine/ojo", bin: { ojo: "dist/missing.js" } }));
    assert.throws(() => cliRunner.resolveWindowsOjoCli(f.shim, {}), (error) => error.code !== "ENOENT");
    assert.equal(existsSync(f.marker), false);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});

test("missing Windows CLI preserves ENOENT so the installer can prepare the dependency", () => {
  const root = mkdtempSync(join(tmpdir(), "ojo-missing-"));
  try {
    assert.throws(() => cliRunner.resolveWindowsOjoCli("ojo.cmd", { PATH: root }), { code: "ENOENT" });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
