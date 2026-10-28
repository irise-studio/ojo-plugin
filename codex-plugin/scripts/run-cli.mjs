import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { basename, delimiter, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";

export function cliEnvironment(env = process.env) {
  // OJO 1.x prefers this npm caller metadata over its own package version.
  return Object.fromEntries(Object.entries(env).filter(([key]) => key.toLowerCase() !== "npm_package_version"));
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes(error.code)) return false;
    throw error;
  }
}

function findWindowsExecutable(command, env) {
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path");
  const directories = /[\\/]/.test(command) || isAbsolute(command)
    ? [""] : (env[pathKey] || "").split(delimiter).filter(Boolean);
  const extensions = extname(command) ? [""] : [".com", ".exe", ".cmd", ".bat"];
  for (const directory of directories) {
    for (const extension of extensions) {
      const candidate = resolve(directory.replace(/^"|"$/g, ""), `${command}${extension}`);
      if (isFile(candidate)) return candidate;
    }
  }
  throw Object.assign(new Error(`OJO executable not found: ${command}`), { code: "ENOENT" });
}

// Never interpret batch text. A standard npm shim identifies the adjacent
// @touchine/ojo package; run its declared JS bin with Node and an argv array.
export function resolveWindowsOjoCli(command, env = process.env) {
  const executable = findWindowsExecutable(command, env);
  if (/\.(?:exe|com)$/i.test(executable)) return { file: executable, prefix: [] };
  if (/\.(?:js|cjs|mjs)$/i.test(executable)) return { file: process.execPath, prefix: [executable] };
  const unsupported = () => new Error("Unsupported Windows batch wrapper. Use the installed @touchine/ojo npm shim, its JavaScript entry, or a native executable in OJO_CLI_BIN.");
  if (basename(executable).toLowerCase() !== "ojo.cmd") throw unsupported();

  const directory = dirname(executable);
  const manifests = [join(directory, "node_modules", "@touchine", "ojo", "package.json")];
  if (basename(directory).toLowerCase() === ".bin" && basename(dirname(directory)).toLowerCase() === "node_modules") {
    manifests.push(resolve(directory, "..", "@touchine", "ojo", "package.json"));
  }
  for (const manifest of manifests) {
    if (!isFile(manifest)) continue;
    try {
      const pkg = JSON.parse(readFileSync(manifest, "utf8"));
      const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.ojo;
      if (pkg.name !== "@touchine/ojo" || typeof bin !== "string" || !/\.(?:js|cjs|mjs)$/i.test(bin)) throw unsupported();
      const root = realpathSync(dirname(manifest));
      const withinPackage = (entry) => {
        const path = relative(root, entry);
        return path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
      };
      const declared = resolve(root, bin);
      if (!withinPackage(declared)) throw new Error("OJO npm bin must stay inside its package.");
      const entry = realpathSync(declared);
      if (!withinPackage(entry) || !/\.(?:js|cjs|mjs)$/i.test(entry) || !isFile(entry)) {
        throw new Error("OJO npm bin must be a JavaScript file inside its package.");
      }
      return { file: process.execPath, prefix: [entry] };
    } catch (error) {
      // The shim exists: a broken package must not be treated as an absent CLI.
      throw new Error(`Invalid installed OJO npm package: ${error.message}`, { cause: error });
    }
  }
  throw unsupported();
}

export function runCliSync(command, args) {
  const options = { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000, env: cliEnvironment() };
  const target = process.platform === "win32"
    ? resolveWindowsOjoCli(command, options.env) : { file: command, prefix: [] };
  return execFileSync(target.file, [...target.prefix, ...args], options).trim();
}
