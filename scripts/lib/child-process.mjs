import { spawn } from "node:child_process";
import { once } from "node:events";
import { redact } from "./redact.mjs";

export const HERMETIC_STRIPPED_ENV_KEYS = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "NEON_BRANCH",
  "APP_ORIGIN",
  "ADMIN_PASSWORD_HASH",
  "ADMIN_SESSION_SECRET",
  "CONTACT_ENCRYPTION_KEY",
  "MAINTENANCE_SECRET",
];

const RUNTIME_ENV_KEYS = [
  "PATH",
  "HOME",
  "TMPDIR",
  "LANG",
  "LC_ALL",
  "NODE_ENV",
];

export function createHermeticEnv(source = process.env, additions = {}) {
  const env = {};
  for (const key of RUNTIME_ENV_KEYS) {
    if (source[key] !== undefined) env[key] = source[key];
  }
  for (const key of HERMETIC_STRIPPED_ENV_KEYS) delete env[key];
  return { ...env, ...additions };
}

function terminateTree(child) {
  if (!child.pid)
    return Promise.resolve({ terminated: true, method: "not-started" });
  if (process.platform === "win32") {
    return new Promise((resolve) => {
      const killer = spawn(
        "taskkill",
        ["/pid", String(child.pid), "/T", "/F"],
        { shell: false },
      );
      killer.once("close", (code) =>
        resolve({ terminated: code === 0, method: "taskkill" }),
      );
    });
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      return Promise.resolve({ terminated: false, method: "sigterm" });
    }
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
        resolve({ terminated: true, method: "sigterm-sigkill" });
      } catch {
        resolve({ terminated: false, method: "sigterm-sigkill" });
      }
    }, 2_000);
    child.once("close", () => {
      clearTimeout(timer);
      resolve({ terminated: true, method: "sigterm" });
    });
  });
}

export async function runChild(command, args = [], options = {}) {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const started = process.hrtime.bigint();
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env ?? createHermeticEnv(),
    shell: false,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stdout = [];
  const stderr = [];
  child.stdout?.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
  child.stderr?.on("data", (chunk) => stderr.push(Buffer.from(chunk)));

  let timedOut = false;
  let cleanupPromise;
  const timeout = setTimeout(() => {
    timedOut = true;
    cleanupPromise = terminateTree(child);
  }, timeoutMs);
  const [code, signal] = await once(child, "close");
  clearTimeout(timeout);
  const cleanup = cleanupPromise
    ? await cleanupPromise
    : { terminated: true, method: "not-needed" };
  const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  const secrets = options.secrets ?? [];
  const result = {
    command,
    status: timedOut ? "timeout" : code === 0 ? "passed" : "failed",
    code: timedOut ? 124 : code,
    signal: signal ?? null,
    durationMs: Math.round(durationMs),
    stdout: redact(Buffer.concat(stdout).toString("utf8"), secrets),
    stderr: redact(Buffer.concat(stderr).toString("utf8"), secrets),
    cleanup: cleanup.terminated ? cleanup.method : `failed:${cleanup.method}`,
  };
  return result;
}
