import { createHermeticEnv, runChild } from "./lib/child-process.mjs";
import { writeArtifact } from "./lib/run-suite.mjs";
import { assertNeonUrlPair } from "../src/config/neon-url.ts";
import {
  readDatabaseAppEnv,
  readMigrationEnv,
} from "../src/config/env-schema.ts";

const started = Date.now();
let migration;
try {
  const database = readDatabaseAppEnv();
  migration = readMigrationEnv();
  if (migration.neonBranchSource !== "provider") {
    throw new Error(
      "db:migrate requires provider-authenticated branch resolution; injected mode is test-only",
    );
  }
  if (
    !migration.neonBranch ||
    !migration.neonProjectId ||
    !migration.neonApiKey
  ) {
    throw new Error(
      "db:migrate requires NEON_BRANCH, NEON_PROJECT_ID, and NEON_API_KEY",
    );
  }
  // The pure URL check runs before the first child. The authoritative provider
  // check remains the first child operation below.
  assertNeonUrlPair(database.databaseUrl, migration.databaseUrlUnpooled);
} catch (error) {
  const message =
    error instanceof Error ? error.message : "migration configuration failed";
  const artifactPath = await writeArtifact(
    {
      commandName: "db:migrate",
      status: "failed",
      branchResolution: "not-run",
      durationMs: Date.now() - started,
    },
    { stderr: message },
    [
      process.env.DATABASE_URL,
      process.env.DATABASE_URL_UNPOOLED,
      process.env.NEON_API_KEY,
    ].filter(Boolean),
  );
  console.error(`${message}; artifact ${artifactPath}`);
  process.exitCode = 1;
}

if (!migration || process.exitCode) process.exit(process.exitCode ?? 1);

// Guard is deliberately the first child. Provider credentials are passed only
// in its environment and are stripped from the subsequent Drizzle child.
const guardEnv = createHermeticEnv(process.env, {
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_URL_UNPOOLED: migration.databaseUrlUnpooled,
  NEON_BRANCH: migration.neonBranch,
  NEON_BRANCH_SOURCE: "provider",
  NEON_PROJECT_ID: migration.neonProjectId,
  NEON_API_KEY: migration.neonApiKey,
  NEON_API_BASE_URL: process.env.NEON_API_BASE_URL,
});
const guard = await runChild("bun", ["scripts/assert-neon-test-branch.mjs"], {
  cwd: process.cwd(),
  env: guardEnv,
  secrets: [
    migration.neonApiKey,
    migration.databaseUrlUnpooled,
    process.env.DATABASE_URL,
  ].filter(Boolean),
  timeoutMs: 60_000,
});
if (guard.code !== 0) {
  const artifactPath = await writeArtifact(
    {
      commandName: "db:migrate",
      status: guard.status,
      branchResolution: "failed",
      durationMs: Date.now() - started,
    },
    { guard: { stdout: guard.stdout, stderr: guard.stderr } },
    [
      migration.neonApiKey,
      migration.databaseUrlUnpooled,
      process.env.DATABASE_URL,
    ].filter(Boolean),
  );
  console.error(
    `Neon branch guard failed; no migration started; artifact ${artifactPath}`,
  );
  process.exitCode = guard.code ?? 1;
  process.exit(process.exitCode);
}

const migrateEnv = createHermeticEnv(process.env, {
  DATABASE_URL_UNPOOLED: migration.databaseUrlUnpooled,
});
const drizzle = await runChild(
  "bun",
  [
    "node_modules/drizzle-kit/bin.cjs",
    "migrate",
    "--config",
    "drizzle.config.ts",
  ],
  {
    cwd: process.cwd(),
    env: migrateEnv,
    secrets: [migration.databaseUrlUnpooled],
    timeoutMs: 60_000,
  },
);
const artifactPath = await writeArtifact(
  {
    commandName: "db:migrate",
    status: drizzle.status,
    branchResolution: "provider",
    durationMs: Date.now() - started,
  },
  { stdout: drizzle.stdout, stderr: drizzle.stderr },
  [migration.databaseUrlUnpooled],
);
if (drizzle.stdout) process.stdout.write(drizzle.stdout);
if (drizzle.stderr) process.stderr.write(drizzle.stderr);
console.log(`db:migrate ${drizzle.status}; artifact ${artifactPath}`);
process.exitCode = drizzle.code ?? 1;
