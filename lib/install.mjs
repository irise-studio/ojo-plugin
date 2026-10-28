import { delimiter } from "node:path";
import { checkOjoCli } from "../codex-plugin/scripts/cli-contract.mjs";

const repository = "irise-studio/ojo-plugin";
const marketplaceName = "irise-studio";
const selector = "ojo@irise-studio";

function sameSource(marketplace) {
  if (marketplace.marketplaceSource?.sourceType !== "git") return false;
  const source = marketplace.marketplaceSource.source
    .replace(/^(?:git\+)?https:\/\/github\.com\//i, "")
    .replace(/^git@github\.com:/i, "")
    .replace(/^ssh:\/\/git@github\.com\//i, "")
    .replace(/\/$/, "").replace(/\.git$/i, "");
  return source.toLowerCase() === repository;
}

export function install({ run, env = process.env, nodeVersion = process.versions.node, log = console.log, dryRun = false }) {
  if (Number(nodeVersion.split(".")[0]) < 20) throw new Error("Node.js 20 or newer is required.");

  // npm injects cache/local .bin directories; use OJO_CLI_BIN for an intentional custom CLI.
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") || "PATH";
  const persistentEnv = {
    ...env,
    [pathKey]: (env[pathKey] || "").split(delimiter)
      .filter((entry) => !/[\\/]_npx[\\/]/i.test(entry) && !/[\\/]node_modules[\\/]\.bin[\\/]?$/i.test(entry)).join(delimiter),
  };
  function execute(command, args, { mutation = false, inherit = false } = {}) {
    if (mutation) log(`${dryRun ? "[dry-run] " : ""}${command} ${args.join(" ")}`);
    if (mutation && dryRun) return "";
    const result = run(command, args, { env: persistentEnv, inherit, timeout: mutation ? 300_000 : 30_000 });
    if (result.error || result.status !== 0) {
      const error = new Error(`${command} ${args.join(" ")} failed: ${result.error?.message || result.stderr?.trim() || `exit ${result.status}`}`);
      error.code = result.error?.code;
      throw error;
    }
    return result.stdout || "";
  }
  function json(args) {
    try {
      return JSON.parse(execute("codex", args));
    } catch (error) {
      throw new Error(`Cannot read Codex JSON output (${args.join(" ")}): ${error.message}`);
    }
  }

  log("Checking Codex plugin support...");
  for (const args of [["plugin", "add"], ["plugin", "list"], ["plugin", "marketplace", "add"], ["plugin", "marketplace", "list"], ["plugin", "marketplace", "upgrade"]]) {
    try {
      execute("codex", [...args, "--help"]);
    } catch {
      throw new Error("Codex with 'plugin add' and marketplace commands is required on PATH (verified with codex-cli 0.163.0). Install or update the official Codex CLI, then retry.");
    }
  }
  const catalog = json(["plugin", "marketplace", "list", "--json"]);
  if (!Array.isArray(catalog.marketplaces)) throw new Error("Unsupported Codex marketplace JSON response.");
  const existing = catalog.marketplaces.find((entry) => entry.name === marketplaceName);
  if (existing && !sameSource(existing)) {
    throw new Error("The 'irise-studio' marketplace already has a different source. Review 'codex plugin marketplace list' and resolve the name conflict before retrying. No marketplace was replaced.");
  }

  const customCli = env.OJO_CLI_BIN?.trim();
  const command = customCli || "ojo";
  log(`Checking ${command}...`);
  let cli = checkOjoCli((args) => execute(command, args));
  if (!cli.ok) {
    if (customCli) throw new Error(`OJO_CLI_BIN '${customCli}' did not pass the OJO CLI contract (${cli.reason}). Fix or unset OJO_CLI_BIN before retrying.`);
    if (cli.reason !== "not_found") throw new Error(`Existing OJO CLI did not pass the contract (${cli.version || cli.reason}). A stable @touchine/ojo >=1.0.9 <2.0.0 is required; review it before explicitly reinstalling @touchine/ojo@1.0.9.`);
    execute("npm", ["install", "--global", "@touchine/ojo@1.0.9"], { mutation: true, inherit: true });
    if (!dryRun) {
      cli = checkOjoCli((args) => execute(command, args));
      if (!cli.ok) throw new Error("The installed OJO CLI could not be verified on PATH. Check 'npm prefix -g', add its executable directory to PATH, then retry. Marketplace installation has not started.");
    }
  } else {
    log(`Keeping compatible OJO CLI ${cli.version}.`);
  }

  if (existing) {
    execute("codex", ["plugin", "marketplace", "upgrade", marketplaceName], { mutation: true });
  } else {
    execute("codex", ["plugin", "marketplace", "add", repository, "--ref", "main", "--json"], { mutation: true });
  }
  execute("codex", ["plugin", "add", selector, "--json"], { mutation: true });
  if (dryRun) {
    log("Dry-run finished. No installation commands were executed.");
    return;
  }
  const plugins = json(["plugin", "list", "--marketplace", marketplaceName, "--json"]);
  const plugin = plugins.installed?.find((entry) => entry.pluginId === selector && entry.installed === true && entry.enabled === true);
  if (!plugin) throw new Error("OJO plugin verification failed: Codex did not report ojo@irise-studio as installed and enabled.");
  log("Installation verified: OJO CLI and ojo@irise-studio are ready.");
  log("Start a new Codex task to load the plugin skills. For remote OJO operations, run 'ojo auth login' if needed (or use your OJO_CLI_BIN executable).");
}
