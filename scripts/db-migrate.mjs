import { createHermeticEnv, runChild } from "./lib/child-process.mjs";
import { writeArtifact } from "./lib/run-suite.mjs";
import { assertNeonTestBranch } from "./assert-neon-test-branch.mjs";
import {
  readDatabaseAppEnv,
  readMigrationEnv,
} from "../src/config/env-schema.ts";

const started = Date.now();
let migration;
try {
  const database = readDatabaseAppEnv();
  migration = readMigrationEnv();
  assertNeonTestBranch({
    env: {
      DATABASE_URL: database.databaseUrl,
      DATABASE_URL_UNPOOLED: migration.databaseUrlUnpooled,
      NEON_BRANCH: migration.neonBranch,
    },
  });
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
    [process.env.DATABASE_URL, process.env.DATABASE_URL_UNPOOLED].filter(
      Boolean,
    ),
  );
  console.error(`${message}; artifact ${artifactPath}`);
  process.exitCode = 1;
}

if (!migration || process.exitCode) process.exit(process.exitCode ?? 1);

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
    branchResolution: "local",
    durationMs: Date.now() - started,
  },
  { stdout: drizzle.stdout, stderr: drizzle.stderr },
  [migration.databaseUrlUnpooled],
);
if (drizzle.stdout) process.stdout.write(drizzle.stdout);
if (drizzle.stderr) process.stderr.write(drizzle.stderr);
console.log(`db:migrate ${drizzle.status}; artifact ${artifactPath}`);
process.exitCode = drizzle.code ?? 1;
