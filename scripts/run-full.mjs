import { existsSync } from "node:fs";
import { createHermeticEnv, runChild } from "./lib/child-process.mjs";
import { writeArtifact } from "./lib/run-suite.mjs";

const started = Date.now();
const failures = [];
const reports = [];

async function record(name, result, extra = {}) {
  const artifactPath = await writeArtifact(
    {
      commandName: name,
      status: result.status,
      durationMs: result.durationMs ?? 0,
      ...extra,
    },
    { stdout: result.stdout ?? "", stderr: result.stderr ?? "" },
    [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED].filter(
      Boolean,
    ),
  );
  reports.push({ name, ...result, artifactPath });
  if (result.status === "failed" || result.status === "timeout")
    failures.push(name);
}

const build = await runChild(
  process.env.NODE_BIN ?? "node",
  ["node_modules/next/dist/bin/next", "build"],
  {
    cwd: process.cwd(),
    env: createHermeticEnv(process.env, { NODE_ENV: "production" }),
    timeoutMs: 60_000,
  },
);
await record("build", build, { branchResolution: "not-run" });

const providerOptIn = process.env.DREAM_PROVIDER === "neon";
if (providerOptIn) {
  try {
    const { assertNeonTestBranch } =
      await import("./assert-neon-test-branch.mjs");
    assertNeonTestBranch();
    reports.push({
      name: "neon-preflight",
      status: "passed",
      branchResolution: "local",
    });
  } catch (error) {
    failures.push("neon-preflight");
    reports.push({
      name: "neon-preflight",
      status: "failed",
      branchResolution: "failed",
      error: error.message,
    });
  }
} else {
  reports.push({
    name: "provider",
    status: "skipped",
    branchResolution: "not-run",
  });
}

if (providerOptIn && !failures.includes("neon-preflight")) {
  const migration = await runChild(
    process.execPath,
    ["scripts/db-migrate.mjs"],
    {
      cwd: process.cwd(),
      env: createHermeticEnv(process.env, {
        DATABASE_URL: process.env.DATABASE_URL,
        DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
        NEON_BRANCH: process.env.NEON_BRANCH,
      }),
      secrets: [
        process.env.DATABASE_URL,
        process.env.DATABASE_URL_UNPOOLED,
      ].filter(Boolean),
      timeoutMs: 60_000,
    },
  );
  await record("db-migrate", migration, { branchResolution: "local" });
}

const browserNames = ["chromium", "webkit"];
const browserInstallCommand = "bunx playwright install chromium webkit";
if (process.env.DREAM_SKIP_BROWSER === "1") {
  reports.push({
    name: "browser",
    status: "skipped",
    code: 2,
    reason: "DREAM_SKIP_BROWSER=1",
    installCommand: browserInstallCommand,
  });
  failures.push("browser");
} else {
  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    playwright = null;
  }
  const missing = [];
  for (const name of browserNames) {
    const executable = playwright?.[name]?.executablePath?.();
    if (!executable || !existsSync(executable)) missing.push(name);
  }
  if (missing.length > 0) {
    reports.push({
      name: "browser",
      status: "failed",
      code: 2,
      reason: "browser-missing",
      missing,
      installCommand: browserInstallCommand,
    });
    failures.push("browser");
  } else if (
    build.code === 0 &&
    (!providerOptIn || !failures.includes("neon-preflight"))
  ) {
    const e2e = await runChild(
      "bunx",
      ["playwright", "test", "test/e2e/foundation.spec.ts"],
      {
        cwd: process.cwd(),
        env: createHermeticEnv(process.env, { NODE_ENV: "production" }),
        timeoutMs: 60_000,
      },
    );
    await record("browser", e2e, {
      branchResolution: providerOptIn ? "provider" : "not-run",
    });
  }
}

const summary = {
  status: failures.length === 0 ? "passed" : "failed",
  durationMs: Date.now() - started,
  failures,
  reports: reports.map(
    ({ name, status, code, artifactPath, reason, installCommand }) => ({
      name,
      status,
      code,
      artifactPath,
      reason,
      installCommand,
    }),
  ),
};
console.log(JSON.stringify(summary, null, 2));
process.exitCode = failures.length === 0 ? 0 : 2;
