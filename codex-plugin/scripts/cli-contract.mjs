const requirements = {
  workspaceSync: [["workspace", "sync"], [/Usage: ojo workspace sync/, /--path <dir>/, /--json/]],
  projectImport: [["project", "import"], [/<workspacePath>/, /--name <name>/, /--team-id <id>/, /--project-id <id>/, /--json/]],
  projectTeamList: [["project", "team", "list"], [/Usage: ojo project team list/, /--json/]],
  projectTeamGet: [["project", "team", "get"], [/Usage: ojo project team get/, /<projectId>/, /--json/]],
  projectTeamSet: [["project", "team", "set"], [/Usage: ojo project team set/, /<projectId>/, /--team-id <id>/, /--name <name>/, /--json/]],
  authLogin: [["auth", "login"], [/--mode <mode>/, /--no-open/, /--json/]],
  chat: [["chat"], [/--message <msg>/, /--project-id <projectId>/, /--json/]],
  query: [["query"], [/--project-id <projectId>/, /--json/]],
  conversionReport: [["conversion", "report"], [/<eventFile>/, /--json/]],
  screen: [["screen"], [/--project-id <projectId>/, /--json/]],
};

// run receives an argument array and returns stdout, or throws a process error.
export function checkOjoCli(run) {
  try {
    const version = run(["--version"]).trim();
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:\+[\w.-]+)?$/);
    const supportedVersion = match && Number(match[1]) === 1 &&
      (Number(match[2]) > 0 || Number(match[3]) >= 9);
    const checks = {};
    for (const [name, [args, patterns]] of Object.entries(requirements)) {
      const output = run([...args, "--help"]);
      checks[name] = patterns.every((pattern) => pattern.test(output));
    }
    const ok = Boolean(supportedVersion && Object.values(checks).every(Boolean));
    return { ok, version, checks, ...(ok ? {} : { reason: "unsupported_touchine_ojo_cli" }) };
  } catch (error) {
    return { ok: false, reason: error?.code === "ENOENT" ? "not_found" : "cli_check_failed" };
  }
}
