const sharedCommands = {
  workspaceSync: [["workspace", "sync"], [/Usage: ojo workspace sync/, /--path <dir>/, /--json/]],
  authLogin: [["auth", "login"], [/--mode <mode>/, /--no-open/, /--json/]],
  chat: [["chat"], [/--message <msg>/, /--project-id <projectId>/, /--json/]],
  query: [["query"], [/--project-id <projectId>/, /--json/]],
  conversionReport: [["conversion", "report"], [/<eventFile>/, /--json/]],
  screen: [["screen"], [/--project-id <projectId>/, /--json/]],
};

const importCommands = {
  projectTeamList: [["project", "team", "list"], [/Usage: ojo project team list/, /--json/]],
  projectTeamGet: [["project", "team", "get"], [/Usage: ojo project team get/, /<projectId>/, /--json/]],
  projectTeamSet: [["project", "team", "set"], [/Usage: ojo project team set/, /<projectId>/, /--name <name>/, /--team-id <id>/, /--sync-skills/, /--json/]],
  projectCreate: [["project", "create"], [/Usage: ojo project create/, /--name <name>/, /--json/]],
  prototypeValidate: [["prototype", "validate"], [/Usage: ojo prototype validate/, /--json/]],
  prototypeBuild: [["prototype", "build"], [/Usage: ojo prototype build/, /--json/]],
  prototypePublish: [["prototype", "publish"], [/Usage: ojo prototype publish/, /--project-id <projectId>/, /--json/]],
};

export const NEXT_CLI_PACKAGE = "@touchine-ai/ojo@latest";

// run receives an argument array and returns stdout, or throws a process error.
export function checkOjoCli(run, { importProject = false, legacyImport = false } = {}) {
  try {
    const version = run(["--version"]).trim();
    const next = /^2\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/.test(version);
    if (!next || legacyImport) {
      return { ok: false, version, reason: legacyImport ? "legacy_import_removed" : "unsupported_ojo_cli_version" };
    }
    const generation = "next";
    const checks = {};
    let capabilities;
    try {
      capabilities = JSON.parse(run(["capabilities", "--json"]));
    } catch {
      return { ok: false, version, generation, reason: "next_cli_capabilities_required" };
    }
    if (capabilities?.schemaVersion !== 2 || capabilities.generation !== "next" || capabilities.serviceApi !== "server.v1") {
      return { ok: false, version, generation, reason: "next_cli_capabilities_required" };
    }
    if (importProject && capabilities.localPrototypePublishProtocol !== 1) {
      return { ok: false, version, generation, reason: "next_cli_publication_required" };
    }

    const commands = importProject ? { ...sharedCommands, ...importCommands } : sharedCommands;
    for (const [name, [args, patterns]] of Object.entries(commands)) {
      const output = run([...args, "--help"]);
      checks[name] = patterns.every((pattern) => pattern.test(output));
    }
    const ok = Object.values(checks).every(Boolean);
    return { ok, version, generation, checks, legacyImport: false, importProject: importProject && ok, ...(ok ? {} : { reason: "unsupported_ojo_cli_commands" }) };
  } catch (error) {
    return { ok: false, reason: error?.code === "ENOENT" ? "not_found" : "cli_check_failed" };
  }
}
