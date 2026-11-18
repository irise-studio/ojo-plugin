import assert from "node:assert/strict";
import test from "node:test";
import { delimiter, join } from "node:path";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { install } from "../lib/install.mjs";
import { checkOjoCli } from "../codex-plugin/scripts/cli-contract.mjs";

// External processes are the boundary: npm/Codex would otherwise write real user state.
const help = {
  "workspace sync": "Usage: ojo workspace sync --path <dir> --json",
  "project create": "Usage: ojo project create --name <name> --json",
  "prototype validate": "Usage: ojo prototype validate --json",
  "prototype build": "Usage: ojo prototype build --json",
  "prototype publish": "Usage: ojo prototype publish --project-id <projectId> --json",
  "auth login": "Usage: ojo auth login --mode <mode> --no-open --json",
  chat: "Usage: ojo chat --message <msg> --project-id <projectId> --json",
  query: "Usage: ojo query --project-id <projectId> --json",
  "conversion report": "Usage: ojo conversion report <eventFile> --json",
  screen: "Usage: ojo screen --project-id <projectId> --json",
};

function environment(options = {}) {
  const state = {
    cli: "2.0.0-next.13", marketplace: null, installed: false, enabled: true,
    mutations: [], calls: [], output: [], ...options,
  };
  const ok = (value = "") => ({ status: 0, stdout: typeof value === "string" ? value : JSON.stringify(value), stderr: "" });
  const fail = (message) => ({ status: 1, stdout: "", stderr: message });
  const run = (command, args, settings) => {
    state.calls.push({ command, args, settings });
    if (command !== "codex" && command !== "npm") {
      if (state.cli === null) return { status: null, error: Object.assign(new Error("missing"), { code: "ENOENT" }) };
      if (args[0] === "--version") return ok(settings.env.npm_package_version || state.cli);
      if (args[0] === "capabilities") return ok(state.capabilities ?? { schemaVersion: 2, generation: "next", serviceApi: "server.v1" });
      return ok(state.brokenCli ? "missing subcommand" : help[args.slice(0, -1).join(" ")]);
    }
    if (args.includes("--help")) return state.oldCodex ? fail("unknown command") : ok("help");
    if (args.join(" ") === "plugin marketplace list --json") {
      return state.badJson ? ok("not JSON") : ok({ marketplaces: state.marketplace ? [state.marketplace] : [] });
    }
    if (args.join(" ") === "plugin list --marketplace irise-studio --json") {
      return ok({ installed: state.installed ? [{ pluginId: "ojo@irise-studio", installed: true, enabled: state.enabled }] : [], available: [] });
    }
    state.mutations.push([command, ...args]);
    if (state.failAt === args[1]) return fail("network or permission failure");
    if (command === "npm") state.cli = state.installNotOnPath ? null : "2.0.0-next.10";
    else if (args[1] === "marketplace") state.marketplace = ownMarketplace();
    else if (args[1] === "add" && !state.missingReadback) state.installed = true;
    return ok({});
  };
  return {
    state,
    execute: (extra = {}) => install({ run, env: { PATH: "/usr/bin" }, nodeVersion: "20.0.0", log: (line) => state.output.push(line), ...extra }),
  };
}

function ownMarketplace() {
  return { name: "irise-studio", marketplaceSource: { sourceType: "git", source: "https://github.com/irise-studio/ojo-plugin.git" } };
}

test("missing CLI is persisted before installing and verifying the plugin", () => {
  const { state, execute } = environment({ cli: null });
  execute();
  assert.equal(state.installed, true);
  assert.deepEqual(state.mutations, [
    ["npm", "install", "--global", "@touchine-ai/ojo@latest"],
    ["codex", "plugin", "marketplace", "add", "irise-studio/ojo-plugin", "--ref", "main", "--json"],
    ["codex", "plugin", "add", "ojo@irise-studio", "--json"],
  ]);
  assert.match(state.output.join("\n"), /verified/i);
});

test("a compatible CLI is preserved and a second install refreshes the marketplace", () => {
  const { state, execute } = environment();
  execute();
  state.mutations = [];
  execute();
  assert.deepEqual(state.mutations, [
    ["codex", "plugin", "marketplace", "upgrade", "irise-studio"],
    ["codex", "plugin", "add", "ojo@irise-studio", "--json"],
  ]);
});

test("the installer preserves a compatible next CLI without requiring legacy import commands", () => {
  const { state, execute } = environment({ cli: "2.0.0-next.10" });
  execute();
  assert.equal(state.installed, true);
  assert.equal(state.mutations.some(([command]) => command === "npm"), false);
  assert.equal(state.calls.some(({ command, args }) => command === "ojo" && args[0] === "project"), false);
});

test("legacy import mode refuses a next CLI before looking up upload commands", () => {
  const result = checkOjoCli((args) => {
    assert.deepEqual(args, ["--version"]);
    return "2.0.0-next.10";
  }, { legacyImport: true });
  assert.equal(result.ok, false);
});

test("old Codex, old Node and invalid CLI versions stop before mutations", () => {
  for (const options of [{ oldCodex: true }, { cli: "2.0.0", capabilities: { generation: "legacy" } }, { cli: "3.0.0" }, { cli: "1.0.8" }, { cli: "1.0.9-beta.1" }, { brokenCli: true }]) {
    const { state, execute } = environment(options);
    assert.throws(() => execute());
    assert.equal(state.mutations.length, 0);
  }
  const { state, execute } = environment();
  assert.throws(() => execute({ nodeVersion: "18.20.0" }), /Node.js 20/);
  assert.equal(state.calls.length, 0);
});

test("a conflicting marketplace stops before installing even a missing OJO CLI", () => {
  const { state, execute } = environment({ cli: null, marketplace: { name: "irise-studio", marketplaceSource: { sourceType: "git", source: "https://github.com/irise-studio/irise-extension.git" } } });
  assert.throws(() => execute(), /already.*different source/i);
  assert.equal(state.mutations.length, 0);
});

test("an explicit missing CLI is not overwritten and paths with spaces remain a single executable", () => {
  const missing = environment({ cli: null });
  assert.throws(() => missing.execute({ env: { PATH: "/usr/bin", OJO_CLI_BIN: "/custom path/ojo" } }), /OJO_CLI_BIN/);
  assert.equal(missing.state.mutations.length, 0);
  const valid = environment();
  valid.execute({ env: { PATH: "/usr/bin", OJO_CLI_BIN: "/custom path/ojo" } });
  assert.equal(valid.state.calls.some(({ command }) => command === "/custom path/ojo"), true);
  assert.equal(valid.state.calls.some(({ command }) => command === "npm"), false);
});

test("dry-run describes all missing components without mutations or success claim", () => {
  const { state, execute } = environment({ cli: null });
  execute({ dryRun: true });
  assert.equal(state.mutations.length, 0);
  assert.match(state.output.join("\n"), /npm install --global @touchine-ai\/ojo@latest/);
  assert.match(state.output.join("\n"), /codex plugin add ojo@irise-studio/);
  assert.doesNotMatch(state.output.join("\n"), /Installation verified/);
});

test("a failed global install stops marketplace writes and surfaces the failure", () => {
  const { state, execute } = environment({ cli: null, failAt: "--global" });
  assert.throws(() => execute(), /network or permission failure/);
  assert.equal(state.mutations.length, 1);
  assert.equal(state.installed, false);
});

test("an installed CLI outside PATH stops before marketplace writes", () => {
  const { state, execute } = environment({ cli: null, installNotOnPath: true });
  assert.throws(() => execute(), /PATH/);
  assert.equal(state.mutations.length, 1);
});

test("failed marketplace refresh or plugin installation cannot report success", () => {
  for (const options of [{ failAt: "marketplace", marketplace: ownMarketplace() }, { failAt: "add" }]) {
    const { state, execute } = environment(options);
    assert.throws(() => execute(), /network or permission failure/);
    assert.doesNotMatch(state.output.join("\n"), /Installation verified/);
  }
});

test("missing or disabled plugin readback fails verification", () => {
  for (const options of [{ missingReadback: true }, { enabled: false }]) {
    const { state, execute } = environment(options);
    assert.throws(() => execute(), /verification/i);
    assert.doesNotMatch(state.output.join("\n"), /Installation verified/);
  }
});

test("malformed marketplace JSON fails closed", () => {
  const { state, execute } = environment({ badJson: true });
  assert.throws(() => execute(), /JSON/);
  assert.equal(state.mutations.length, 0);
});

test("npm-injected cache and local executables are removed from subprocess PATH", () => {
  const { state, execute } = environment();
  execute({ env: { PATH: ["/cache/_npx/123/node_modules/.bin", "/project/node_modules/.bin", "/node_modules/.bin", "/usr/bin"].join(delimiter), npm_config_cache: "/cache" } });
  assert.equal(state.calls.every(({ settings }) => settings.env.PATH === "/usr/bin"), true);
});

test("an invoking project's npm version cannot override the installed OJO CLI version", () => {
  const { state, execute } = environment();
  execute({ env: { PATH: "/usr/bin", npm_package_version: "0.1.0" } });
  assert.equal(state.installed, true);
  assert.equal(state.mutations.some(([command]) => command === "npm"), false);
});

test("contract rejects all legacy releases and missing next commands", () => {
  for (const version of ["1.0.9", "1.1.0"]) {
    assert.equal(checkOjoCli(() => version).ok, false);
  }
  const result = checkOjoCli((args) => args[0] === "--version" ? "2.0.0-next.13"
    : args[0] === "capabilities" ? JSON.stringify({schemaVersion:2,generation:"next",serviceApi:"server.v1"})
    : "unknown subcommand");
  assert.equal(result.ok, false);
  assert.equal(result.checks.workspaceSync, false);
});

test("the actual entrypoint exposes help/version and rejects unknown arguments", () => {
  const entrypoint = new URL("../bin/ojo-plugin.mjs", import.meta.url);
  const { version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  for (const [args, status, output] of [
    [["--help"], 0, /Usage: ojo-plugin/],
    [["--version"], 0, (output) => assert.equal(output.trim(), version)],
    [["uninstall"], 1, /Unknown arguments/],
    [["install", "--force"], 1, /Unknown arguments/],
  ]) {
    const result = spawnSync(process.execPath, [fileURLToPath(entrypoint), ...args], { encoding: "utf8" });
    assert.equal(result.status, status);
    if (typeof output === "function") output(result.stdout + result.stderr);
    else assert.match(result.stdout + result.stderr, output);
    assert.doesNotMatch(result.stdout, /Checking Codex/);
  }
});

function isolatedHome(t) {
  const homeDir = mkdtempSync(join(tmpdir(), "ojo agent home "));
  t.after(() => rmSync(homeDir, { recursive: true, force: true }));
  return homeDir;
}

test("Claude Code installs persistent skills and runnable helpers without Codex", (t) => {
  const homeDir = isolatedHome(t);
  const { state, execute } = environment({ cli: null, oldCodex: true });
  execute({ agent: "claude-code", homeDir });
  const root = join(homeDir, ".claude", "skills");
  assert.deepEqual(readdirSync(root).sort(), ["build-irise-prototype", "convert-to-ojo", "generate-irise-snapshots", "ojo-workspace"]);
  assert.equal(state.calls.some(({ command }) => command === "codex" || command === "claude"), false);
  assert.deepEqual(state.mutations, [["npm", "install", "--global", "@touchine-ai/ojo@latest"]]);
  const skill = readFileSync(join(root, "build-irise-prototype", "SKILL.md"), "utf8");
  assert.match(skill, /\.\.\/ojo-workspace\/scripts\/check-ojo-cli\.mjs/);
  assert.equal(existsSync(join(root, "generate-irise-snapshots", "scripts", "build-local-snapshots.mjs")), true);
  const checker = spawnSync(process.execPath, [join(root, "ojo-workspace", "scripts", "check-ojo-cli.mjs")], {
    env: { ...process.env, OJO_CLI_BIN: process.execPath }, encoding: "utf8",
  });
  assert.equal(checker.status, 1);
  assert.equal(JSON.parse(checker.stdout).reason, "unsupported_ojo_cli_version");
  assert.match(state.output.join("\n"), /skills.*installed/i);
});

test("other agents use a shared default or a custom skills directory", (t) => {
  const homeDir = isolatedHome(t);
  for (const skillsDir of [undefined, join(homeDir, "custom agent", "skills")]) {
    const { state, execute } = environment({ oldCodex: true });
    execute({ agent: "other", homeDir, skillsDir });
    assert.equal(existsSync(join(skillsDir || join(homeDir, ".agents", "skills"), "convert-to-ojo", "SKILL.md")), true);
    assert.equal(state.calls.some(({ command }) => command === "codex"), false);
    assert.equal(state.mutations.length, 0);
  }
});

test("Claude Code respects its configured directory", (t) => {
  const homeDir = isolatedHome(t);
  environment().execute({ agent: "claude-code", homeDir, env: { PATH: "/usr/bin", CLAUDE_CONFIG_DIR: join(homeDir, "claude config") } });
  assert.equal(existsSync(join(homeDir, "claude config", "skills", "ojo-workspace", "SKILL.md")), true);
});

test("repeat installs refresh managed skills and preserve unrelated skills", (t) => {
  const homeDir = isolatedHome(t);
  const root = join(homeDir, ".claude", "skills");
  mkdirSync(join(root, "unrelated"), { recursive: true });
  writeFileSync(join(root, "unrelated", "SKILL.md"), "user content");
  const { execute } = environment();
  execute({ agent: "claude-code", homeDir });
  execute({ agent: "claude-code", homeDir });
  assert.equal(readFileSync(join(root, "unrelated", "SKILL.md"), "utf8"), "user content");
  assert.equal(readdirSync(root).length, 5);
});

test("conflicts and locally edited managed skills stop before any CLI install", (t) => {
  const homeDir = isolatedHome(t);
  const root = join(homeDir, ".agents", "skills");
  mkdirSync(join(root, "ojo-workspace"), { recursive: true });
  writeFileSync(join(root, "ojo-workspace", "SKILL.md"), "local skill");
  const conflict = environment({ cli: null });
  assert.throws(() => conflict.execute({ agent: "other", homeDir }), /conflict|unmanaged/i);
  assert.equal(conflict.state.calls.length, 0);
  assert.equal(existsSync(join(root, "convert-to-ojo")), false);
  rmSync(join(root, "ojo-workspace"), { recursive: true });
  environment().execute({ agent: "other", homeDir });
  writeFileSync(join(root, "ojo-workspace", "SKILL.md"), "edited by user");
  const edited = environment({ cli: null });
  assert.throws(() => edited.execute({ agent: "other", homeDir }), /modified|edited/i);
  assert.equal(edited.state.calls.length, 0);
  assert.equal(readFileSync(join(root, "ojo-workspace", "SKILL.md"), "utf8"), "edited by user");
});

test("standalone dry-run and failed CLI installation leave no skills or directories", (t) => {
  const homeDir = isolatedHome(t);
  const dry = environment({ cli: null, oldCodex: true });
  dry.execute({ agent: "claude-code", homeDir, dryRun: true });
  assert.deepEqual(readdirSync(homeDir), []);
  assert.equal(dry.state.mutations.length, 0);
  assert.match(dry.state.output.join("\n"), /skills/i);
  assert.doesNotMatch(dry.state.output.join("\n"), /Installation verified|skills installed/i);
  const failed = environment({ cli: null, failAt: "--global" });
  assert.throws(() => failed.execute({ agent: "claude-code", homeDir }), /network or permission/);
  assert.deepEqual(readdirSync(homeDir), []);
});

test("invalid targets and Codex skills-dir are rejected before processes run", (t) => {
  const homeDir = isolatedHome(t);
  for (const options of [{ agent: "unknown" }, { agent: "codex", skillsDir: homeDir }, { agent: "other", skillsDir: "" }]) {
    const { state, execute } = environment();
    assert.throws(() => execute(options), /agent|skills-dir/i);
    assert.equal(state.calls.length, 0);
  }
});

test("entrypoint rejects missing, duplicate, and invalid target flags before installation", () => {
  const entrypoint = fileURLToPath(new URL("../bin/ojo-plugin.mjs", import.meta.url));
  for (const args of [["--agent"], ["--agent", "other", "--agent", "codex"], ["--skills-dir"], ["--agent", "unknown"], ["--agent", "codex", "--skills-dir", "/tmp/unused"]]) {
    const result = spawnSync(process.execPath, [entrypoint, "install", ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stdout, /Checking/);
  }
});

test("standalone installs refuse symbolic links and preserve added user files", (t) => {
  const homeDir = isolatedHome(t);
  const skillsDir = join(homeDir, "skills");
  const outside = join(homeDir, "outside");
  mkdirSync(skillsDir);
  mkdirSync(outside);
  writeFileSync(join(outside, "SKILL.md"), "outside skill");
  symlinkSync(outside, join(skillsDir, "ojo-workspace"), process.platform === "win32" ? "junction" : "dir");
  const linked = environment({ cli: null });
  assert.throws(() => linked.execute({ agent: "other", skillsDir }), /conflict/i);
  assert.equal(linked.state.calls.length, 0);
  assert.equal(readFileSync(join(outside, "SKILL.md"), "utf8"), "outside skill");
  rmSync(join(skillsDir, "ojo-workspace"));
  environment().execute({ agent: "other", skillsDir });
  writeFileSync(join(skillsDir, "ojo-workspace", "my-notes.txt"), "keep me");
  assert.throws(() => environment().execute({ agent: "other", skillsDir }), /modified/i);
  assert.equal(readFileSync(join(skillsDir, "ojo-workspace", "my-notes.txt"), "utf8"), "keep me");
});

test("standalone installs reject invalid or missing override CLIs without writing files", (t) => {
  const homeDir = isolatedHome(t);
  for (const cli of [null, "1.0.9"]) {
    const { state, execute } = environment({ cli });
    assert.throws(() => execute({ agent: "other", homeDir, env: { PATH: "/usr/bin", OJO_CLI_BIN: "/custom cli/ojo" } }), /OJO_CLI_BIN/);
    assert.equal(state.mutations.length, 0);
    assert.deepEqual(readdirSync(homeDir), []);
  }
});

test("a skills root symlink to a file is rejected before installing a missing CLI", (t) => {
  const homeDir = isolatedHome(t);
  const target = join(homeDir, "file");
  const skillsDir = join(homeDir, "skills");
  writeFileSync(target, "keep");
  if (process.platform === "win32") {
    // File symlinks require extra Windows privileges; a plain file exercises
    // the same preflight boundary there.
    writeFileSync(skillsDir, "keep");
  } else symlinkSync(target, skillsDir);
  const { state, execute } = environment({ cli: null });
  assert.throws(() => execute({ agent: "other", skillsDir }));
  assert.equal(state.calls.length, 0);
});

test("a dangling skills root symlink stops before installing the CLI", { skip: process.platform === "win32" }, (t) => {
  const homeDir = isolatedHome(t);
  const skillsDir = join(homeDir, "skills");
  symlinkSync(join(homeDir, "missing"), skillsDir);
  const { state, execute } = environment({ cli: null });
  assert.throws(() => execute({ agent: "other", skillsDir }));
  assert.equal(state.calls.length, 0);
});

test("reinstall protects a user file named __proto__", (t) => {
  const homeDir = isolatedHome(t);
  const { execute } = environment();
  execute({ agent: "other", homeDir });
  const userFile = join(homeDir, ".agents", "skills", "ojo-workspace", "__proto__");
  writeFileSync(userFile, "user content");
  assert.throws(() => execute({ agent: "other", homeDir }), /modified/i);
  assert.equal(readFileSync(userFile, "utf8"), "user content");
});
