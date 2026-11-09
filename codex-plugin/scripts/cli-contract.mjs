const sharedCommands = {
  workspaceSync: [["workspace", "sync"], [/Usage: ojo workspace sync/, /--path <dir>/, /--json/]],
  authLogin: [["auth", "login"], [/--mode <mode>/, /--no-open/, /--json/]],
  chat: [["chat"], [/--message <msg>/, /--project-id <projectId>/, /--json/]],
  query: [["query"], [/--project-id <projectId>/, /--json/]],
  conversionReport: [["conversion", "report"], [/<eventFile>/, /--json/]],
  screen: [["screen"], [/--project-id <projectId>/, /--json/]],
};

const legacyCommands = {
  projectImport: [["project", "import"], [/<workspacePath>/, /--name <name>/, /--team-id <id>/, /--project-id <id>/, /--json/]],
  projectTeamList: [["project", "team", "list"], [/Usage: ojo project team list/, /--json/]],
  projectTeamGet: [["project", "team", "get"], [/Usage: ojo project team get/, /<projectId>/, /--json/]],
  projectTeamSet: [["project", "team", "set"], [/Usage: ojo project team set/, /<projectId>/, /--team-id <id>/, /--name <name>/, /--json/]],
};

export const NEXT_CLI_PACKAGE = "@touchine-ai/ojo@latest";
export const LEGACY_CLI_PACKAGE = "@touchine/ojo@1.0.9";

// run receives an argument array and returns stdout, or throws a process error.
export function checkOjoCli(run, { legacyImport = false } = {}) {
  try {
    const version = run(["--version"]).trim();
    const legacy = /^1\.(?:[1-9]\d*\.\d+|0\.(?:9|[1-9]\d+))(?:\+[\w.-]+)?$/.test(version);
    const next = /^2\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(version);
    if ((!legacy && !next) || (legacyImport && !legacy)) {
      return { ok: false, version, reason: "unsupported_ojo_cli_version" };
    }

    const generation = legacy ? "legacy" : "next";
    const checks = {};
    if (next) {
      let capabilities;
      try {
        capabilities = JSON.parse(run(["capabilities", "--json"]));
      } catch {
        return { ok: false, version, generation, reason: "next_cli_capabilities_required" };
      }
      if (capabilities?.schemaVersion !== 2 || capabilities.generation !== "next" || capabilities.serviceApi !== "server.v1") {
        return { ok: false, version, generation, reason: "next_cli_capabilities_required" };
      }
    }

    const commands = legacy ? { ...sharedCommands, ...legacyCommands } : sharedCommands;
    for (const [name, [args, patterns]] of Object.entries(commands)) {
      const output = run([...args, "--help"]);
      checks[name] = patterns.every((pattern) => pattern.test(output));
    }
    const ok = Object.values(checks).every(Boolean);
    return { ok, version, generation, checks, legacyImport: legacy && ok, ...(ok ? {} : { reason: "unsupported_ojo_cli_commands" }) };
  } catch (error) {
    return { ok: false, reason: error?.code === "ENOENT" ? "not_found" : "cli_check_failed" };
  }
}
