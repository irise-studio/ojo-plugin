#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const configuredCli = process.env.OJO_CLI_BIN?.trim();
const target = configuredCli
  ? { executable: configuredCli, label: configuredCli }
  : {
      executable: process.platform === "win32" ? "ojo.cmd" : "ojo",
      label: "ojo",
    };

const expectedPackage = "@touchine/ojo";
const minimumVersion = [1, 0, 9];

function run(args) {
  return execFileSync(target.executable, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function parseVersion(value) {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  return match ? match.slice(1).map(Number) : null;
}

function isSupportedVersion(version) {
  if (!version || version[0] !== 1) return false;
  return version.some((part, index) => part > minimumVersion[index]) ||
    version.every((part, index) => part === minimumVersion[index]);
}

function requireHelp(args, patterns) {
  const help = run([...args, "--help"]);
  return patterns.every((pattern) => pattern.test(help));
}

try {
  const version = run(["--version"]);
  const parsedVersion = parseVersion(version);
  const checks = {
    workspaceSync: requireHelp(["workspace", "sync"], [
      /Usage: ojo workspace sync/,
      /--path <dir>/,
      /--json/,
    ]),
    projectImport: requireHelp(["project", "import"], [
      /<workspacePath>/,
      /--name <name>/,
      /--team-id <id>/,
      /--project-id <id>/,
      /--json/,
    ]),
    projectTeamList: requireHelp(["project", "team", "list"], [
      /Usage: ojo project team list/,
      /--json/,
    ]),
    projectTeamGet: requireHelp(["project", "team", "get"], [
      /Usage: ojo project team get/,
      /<projectId>/,
      /--json/,
    ]),
    projectTeamSet: requireHelp(["project", "team", "set"], [
      /Usage: ojo project team set/,
      /<projectId>/,
      /--team-id <id>/,
      /--name <name>/,
      /--json/,
    ]),
    authLogin: requireHelp(["auth", "login"], [
      /--mode <mode>/,
      /--no-open/,
      /--json/,
    ]),
    chat: requireHelp(["chat"], [/--message <msg>/, /--project-id <projectId>/, /--json/]),
    query: requireHelp(["query"], [/--project-id <projectId>/, /--json/]),
    conversionReport: requireHelp(["conversion", "report"], [/<eventFile>/, /--json/]),
    screen: requireHelp(["screen"], [/--project-id <projectId>/, /--json/]),
  };
  const supported = isSupportedVersion(parsedVersion) && Object.values(checks).every(Boolean);

  process.stdout.write(`${JSON.stringify({
    ok: supported,
    command: target.label,
    package: expectedPackage,
    version,
    workflow: "touchine-ojo-1x",
    checks,
    ...(supported ? {} : {
      reason: "unsupported_touchine_ojo_cli",
      requiredVersion: ">=1.0.9 <2.0.0",
      cliSetup: "Install with: npm install -g @touchine/ojo@1.0.9",
    }),
  })}\n`);
  process.exitCode = supported ? 0 : 1;
} catch (error) {
  const missing = error && typeof error === "object" && error.code === "ENOENT";
  process.stdout.write(`${JSON.stringify({
    ok: false,
    command: target.label,
    package: expectedPackage,
    workflow: "touchine-ojo-1x",
    reason: missing ? "not_found" : "cli_check_failed",
    requiredVersion: ">=1.0.9 <2.0.0",
    cliSetup: "Install with: npm install -g @touchine/ojo@1.0.9",
  })}\n`);
  process.exitCode = 1;
}
