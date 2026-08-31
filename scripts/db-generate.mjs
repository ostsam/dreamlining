import { createHermeticEnv, runChild } from "./lib/child-process.mjs";
import { writeArtifact } from "./lib/run-suite.mjs";

const started = Date.now();
const result = await runChild(
  process.execPath,
  [
    "node_modules/drizzle-kit/bin.cjs",
    "generate",
    "--config",
    "drizzle.generate.config.ts",
  ],
  {
    cwd: process.cwd(),
    env: createHermeticEnv(),
    timeoutMs: 60_000,
  },
);
const artifactPath = await writeArtifact(
  {
    commandName: "db:generate",
    branchResolution: "not-run",
    status: result.status,
    durationMs: Date.now() - started,
  },
  { stdout: result.stdout, stderr: result.stderr },
);
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
console.log(`db:generate ${result.status}; artifact ${artifactPath}`);
process.exitCode = result.code ?? 1;
