import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const bundle = fileURLToPath(new URL("../codex-plugin/", import.meta.url));
const receiptName = ".ojo-install.json";
const owner = "irise-studio/ojo-plugin";

function stat(path) {
  try { return lstatSync(path); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

function filesUnder(directory, prefix = "") {
  if (!stat(directory)?.isDirectory()) throw new Error(`Skills conflict: expected a directory at ${directory}`);
  const files = Object.create(null);
  for (const name of readdirSync(directory).sort()) {
    const path = join(directory, name);
    const key = prefix + name;
    const info = lstatSync(path);
    if (info.isDirectory()) Object.assign(files, filesUnder(path, `${key}/`));
    else if (info.isFile()) files[key] = readFileSync(path);
    else throw new Error(`Skills conflict: symbolic links or special files are unsupported at ${path}`);
  }
  return files;
}

function hashes(files) {
  return Object.fromEntries(Object.keys(files).sort().map((key) => [key, createHash("sha256").update(files[key]).digest("hex")]));
}

function checkDestination(path) {
  if (!stat(path)) return false;
  const files = filesUnder(path);
  let receipt;
  try { receipt = JSON.parse(files[receiptName]?.toString()); } catch { /* Report as unmanaged below. */ }
  if (receipt?.owner !== owner || receipt?.schemaVersion !== 1) {
    throw new Error(`Skills conflict: unmanaged skill at ${path}. Choose another --skills-dir or move it aside before retrying.`);
  }
  delete files[receiptName];
  if (JSON.stringify(hashes(files)) !== JSON.stringify(receipt.files)) {
    throw new Error(`Managed skill was locally modified at ${path}. Preserve your edits or choose another --skills-dir before retrying.`);
  }
  return true;
}

function standaloneFiles(name) {
  const files = filesUnder(join(bundle, "skills", name));
  for (const [path, contents] of Object.entries(files)) {
    if (!path.endsWith(".md")) continue;
    // The standalone bundle keeps helpers inside a discoverable skill, and all
    // four skills are installed together so sibling links remain portable.
    files[path] = Buffer.from(contents.toString()
      .replaceAll("../../scripts/check-ojo-cli.mjs", "../ojo-workspace/scripts/check-ojo-cli.mjs")
      .replaceAll("<plugin>/scripts/check-ojo-cli.mjs", "<skills-dir>/ojo-workspace/scripts/check-ojo-cli.mjs")
      .replaceAll("This skill ships in the OJO Codex plugin.", "This skill ships in the OJO skills bundle.")
      .replaceAll("Codex-authored", "Agent-authored")
      .replaceAll("asks Codex", "asks the agent")
      .replaceAll("local Codex authoring", "local agent authoring"));
  }
  if (name === "ojo-workspace") {
    for (const helper of ["check-ojo-cli.mjs", "cli-contract.mjs", "run-cli.mjs"]) {
      files[`scripts/${helper}`] = readFileSync(join(bundle, "scripts", helper));
    }
  }
  files[receiptName] = Buffer.from(JSON.stringify({ owner, schemaVersion: 1, files: hashes(files) }, null, 2) + "\n");
  return files;
}

export function prepareSkills({ agent, skillsDir, homeDir, env }) {
  if (skillsDir !== undefined && (typeof skillsDir !== "string" || !skillsDir.trim())) {
    throw new Error("--skills-dir requires a nonempty directory.");
  }
  const root = resolve(skillsDir ?? (agent === "claude-code"
    ? join(env.CLAUDE_CONFIG_DIR?.trim() || join(homeDir, ".claude"), "skills")
    : join(homeDir, ".agents", "skills")));
  // Validate the nearest existing ancestor before a missing CLI can be installed.
  let ancestor = root;
  while (!stat(ancestor)) ancestor = dirname(ancestor);
  // Parent directory symlinks (common for user configuration) are allowed;
  // managed skill directories and their contents must be real directories/files.
  if (!statSync(ancestor).isDirectory()) {
    throw new Error(`Skills conflict: expected a directory at ${ancestor}`);
  }
  const skills = readdirSync(join(bundle, "skills")).sort().map((name) => ({ name, files: standaloneFiles(name) }));
  function preflight() {
    for (const skill of skills) checkDestination(join(root, skill.name));
  }
  preflight();
  return {
    root,
    names: skills.map(({ name }) => name),
    apply() {
      preflight();
      mkdirSync(root, { recursive: true });
      const staging = mkdtempSync(join(root, ".ojo-install-"));
      const changed = [];
      let recovered = true;
      try {
        for (const { name, files } of skills) {
          for (const [path, contents] of Object.entries(files)) {
            const destination = join(staging, "new", name, path);
            mkdirSync(dirname(destination), { recursive: true });
            writeFileSync(destination, contents);
          }
        }
        preflight();
        for (const { name } of skills) {
          const destination = join(root, name);
          const backup = join(staging, "old", name);
          const previous = checkDestination(destination);
          if (previous) {
            mkdirSync(dirname(backup), { recursive: true });
            renameSync(destination, backup);
          }
          const entry = { destination, backup, previous, installed: false };
          changed.push(entry);
          renameSync(join(staging, "new", name), destination);
          entry.installed = true;
        }
        for (const { destination } of changed) checkDestination(destination);
      } catch (error) {
        for (const entry of changed.reverse()) {
          try {
            if (entry.installed) rmSync(entry.destination, { recursive: true, force: true });
            if (entry.previous) renameSync(entry.backup, entry.destination);
          } catch { recovered = false; }
        }
        if (!recovered) throw new Error(`Skills installation failed; recovery files remain at ${staging}: ${error.message}`, { cause: error });
        throw error;
      } finally {
        if (recovered) rmSync(staging, { recursive: true, force: true });
      }
    },
  };
}
