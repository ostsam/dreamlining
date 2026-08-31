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
    [
      process.env.DATABASE_URL,
      process.env.DATABASE_URL_UNPOOLED,
      process.env.NEON_API_KEY,
    ].filter(Boolean),
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
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL_UNPOOLED)
      throw new Error("both Neon URLs are required");
    if (
      !process.env.NEON_PROJECT_ID ||
      !process.env.NEON_BRANCH ||
      !process.env.NEON_API_KEY
    ) {
      throw new Error(
        "NEON_PROJECT_ID, NEON_BRANCH, and NEON_API_KEY are required",
      );
    }
    const {
      assertNeonEndpointPair,
      assertNeonUrlPair,
      parseNeonConnectionUrl,
    } = await import("../src/config/neon-url.ts");
    const { resolveNeonBranch } = await import("./neon-provider.mjs");
    assertNeonUrlPair(
      process.env.DATABASE_URL,
      process.env.DATABASE_URL_UNPOOLED,
    );
    const pooled = parseNeonConnectionUrl(process.env.DATABASE_URL, "pooled");
    const direct = parseNeonConnectionUrl(
      process.env.DATABASE_URL_UNPOOLED,
      "direct",
    );
    const resolved = await resolveNeonBranch({
      projectId: process.env.NEON_PROJECT_ID,
      branchName: process.env.NEON_BRANCH,
      apiKey: process.env.NEON_API_KEY,
      pooledHost: pooled.host,
      directHost: direct.host,
      apiBaseUrl: process.env.NEON_API_BASE_URL,
    });
    assertNeonEndpointPair(
      process.env.DATABASE_URL,
      process.env.DATABASE_URL_UNPOOLED,
      {
        pooled: resolved.pooled,
        direct: resolved.direct,
        defaultBranchId: resolved.defaultBranchId,
      },
    );
    reports.push({
      name: "neon-preflight",
      status: "passed",
      branchResolution: "provider",
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
    name: "neon-provider",
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
        NEON_BRANCH_SOURCE: "provider",
        NEON_PROJECT_ID: process.env.NEON_PROJECT_ID,
        NEON_API_KEY: process.env.NEON_API_KEY,
        NEON_API_BASE_URL: process.env.NEON_API_BASE_URL,
      }),
      secrets: [
        process.env.DATABASE_URL,
        process.env.DATABASE_URL_UNPOOLED,
        process.env.NEON_API_KEY,
      ].filter(Boolean),
      timeoutMs: 60_000,
    },
  );
  await record("db-migrate", migration, { branchResolution: "provider" });
}

const browserNames = ["chromium", "firefox", "webkit"];
if (process.env.DREAM_SKIP_BROWSER === "1") {
  reports.push({
    name: "browser",
    status: "skipped",
    code: 2,
    reason: "DREAM_SKIP_BROWSER=1",
    installCommand: "bunx playwright install chromium firefox webkit",
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
      installCommand: "bunx playwright install chromium firefox webkit",
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
