#!/usr/bin/env node

import { execFileSync } from "node:child_process";
const configuredCli = process.env.OJO_CLI_BIN?.trim();
const legacyImport = process.argv.includes("--legacy-import");
const target = configuredCli
  ? { executable: configuredCli, prefixArgs: [], label: configuredCli }
  : {
      executable: process.platform === "win32" ? "ojo.cmd" : "ojo",
      prefixArgs: [],
      label: "ojo",
    };

function run(args) {
  return execFileSync(target.executable, [...target.prefixArgs, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

try {
  const version = run(["--version"]);
  if (legacyImport) {
    // Commander can return parent help successfully for an unknown subcommand.
    // Check the actual command signature and options, not just the exit code.
    const help = run(["project", "import", "--help"]);
    const supported = /^1\./.test(version) &&
      /Usage: ojo project import .*<workspacePath>/.test(help) &&
      ["--name", "--project-id", "--json"].every((option) => help.includes(option));
    process.stdout.write(`${JSON.stringify({
      ok: supported, command: target.label, version,
      workflow: "legacy-project-import",
      ...(supported ? {} : { reason: "legacy_import_missing" }),
    })}\n`);
    process.exit(supported ? 0 : 1);
  }
  const capabilityOutput = run(["capabilities", "--json"]);
  const capabilities = JSON.parse(
    capabilityOutput.split("\n").filter(Boolean).at(-1) ?? "{}",
  );
  const supported =
    capabilities.schemaVersion === 2 &&
    capabilities.generation === "next" &&
    capabilities.pluginInteraction === "local-browser-client" &&
    capabilities.pluginSse === false &&
    capabilities.canvasSource === "local-workspace" &&
    capabilities.browserClientProtocol === 1 &&
    capabilities.browserDevProtocol === 3 &&
    capabilities.canvasExportProtocol === 1 &&
    capabilities.localCanvasStorageProtocol === 2 &&
    capabilities.browserAuthProtocol === 1 &&
    capabilities.localPrototypeUpdateProtocol === 1 &&
    capabilities.localPrototypeBuildGateProtocol === 1 &&
    capabilities.localPrototypePublishProtocol === 1 &&
    capabilities.localResourcePublishProtocol === 2;

  if (!supported) {
    process.stdout.write(
      `${JSON.stringify({
        ok: false,
        command: target.label,
        version,
        reason: "next_cli_required",
        detectedCapabilities: capabilities,
        requiredCapabilities: {
          schemaVersion: 2,
          generation: "next",
          pluginInteraction: "local-browser-client",
          pluginSse: false,
          canvasSource: "local-workspace",
          browserClientProtocol: 1,
          browserDevProtocol: 3,
          canvasExportProtocol: 1,
          localCanvasStorageProtocol: 2,
          browserAuthProtocol: 1,
          localPrototypeUpdateProtocol: 1,
          localPrototypeBuildGateProtocol: 1,
          localPrototypePublishProtocol: 1,
          localResourcePublishProtocol: 2,
        },
        cliSetup:
          "Install a supported OJO CLI through the approved Irise distribution channel, then set OJO_CLI_BIN or make ojo available on PATH.",
      })}\n`,
    );
    process.exitCode = 1;
  } else {
    run(["auth", "login", "--help"]);
    run(["prototype", "build", "--help"]);
    run(["prototype", "validate", "--help"]);
    run(["prototype", "publish", "--help"]);
    run(["workspace", "dev", "--help"]);
    run(["workspace", "publish-resources", "--help"]);
    process.stdout.write(
      `${JSON.stringify({ ok: true, command: target.label, version, capabilities })}\n`,
    );
  }
} catch (error) {
  if (legacyImport) {
    process.stdout.write(`${JSON.stringify({
      ok: false, command: target.label, workflow: "legacy-project-import",
      reason: error?.code === "ENOENT" ? "not_found" : "legacy_import_check_failed",
    })}\n`);
    process.exit(1);
  }
  const missing =
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "ENOENT";
  const payload = {
    ok: false,
    command: target.label,
    reason: missing ? "not_found" : "next_cli_check_failed",
    requiredCapabilities: {
      schemaVersion: 2,
      generation: "next",
      pluginInteraction: "local-browser-client",
      pluginSse: false,
      canvasSource: "local-workspace",
      browserClientProtocol: 1,
      browserDevProtocol: 3,
      canvasExportProtocol: 1,
      localCanvasStorageProtocol: 2,
      browserAuthProtocol: 1,
      localPrototypeUpdateProtocol: 1,
      localPrototypeBuildGateProtocol: 1,
      localPrototypePublishProtocol: 1,
      localResourcePublishProtocol: 2,
    },
    cliSetup:
      "Install a supported OJO CLI through the approved Irise distribution channel, then set OJO_CLI_BIN or make ojo available on PATH.",
  };

  process.stdout.write(`${JSON.stringify(payload)}\n`);
  process.exitCode = 1;
}
