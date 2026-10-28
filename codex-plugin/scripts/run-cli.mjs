import { execFileSync } from "node:child_process";

export function cliEnvironment(env = process.env) {
  // OJO 1.x prefers this npm caller metadata over its own package version.
  return Object.fromEntries(Object.entries(env).filter(([key]) => key.toLowerCase() !== "npm_package_version"));
}

// All arguments come from the fixed CLI contract. A quoted cmd invocation is
// needed for Windows npm shims; Git-distributed plugins have no node_modules.
export function runCliSync(command, args) {
  const options = { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30_000, env: cliEnvironment() };
  if (process.platform === "win32" && !/\.(?:exe|com)$/i.test(command)) {
    if ([command, ...args].some((value) => /["%\r\n]/.test(value))) {
      throw new Error("Windows CLI shim paths and arguments must not contain quotes, percent signs, or newlines.");
    }
    const line = `""${command}" ${args.map((arg) => `"${arg}"`).join(" ")}"`;
    return execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/v:off", "/s", "/c", line], {
      ...options, windowsVerbatimArguments: true,
    }).trim();
  }
  return execFileSync(command, args, options).trim();
}
