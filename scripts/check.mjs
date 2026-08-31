import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createHermeticEnv, runChild } from "./lib/child-process.mjs";
import { writeArtifact } from "./lib/run-suite.mjs";

const runId = randomUUID();
const shards = [
  "format:check",
  "typecheck",
  "lint",
  "test:unit",
  "test:security",
];
await mkdir("artifacts", { recursive: true });
const started = Date.now();
const results = await Promise.all(
  shards.map(async (name) => {
    const result = await runChild(process.execPath, ["run", name], {
      cwd: process.cwd(),
      env: createHermeticEnv(process.env, { NODE_ENV: "test" }),
      timeoutMs: 60_000,
    });
    const artifactPath = await writeArtifact(
      {
        runId,
        commandName: name,
        status: result.status,
        durationMs: result.durationMs,
        branch: process.env.NEON_BRANCH ? "[REDACTED-BRANCH]" : undefined,
        branchResolution: "not-run",
      },
      { stdout: result.stdout, stderr: result.stderr },
    );
    return { name, ...result, artifactPath };
  }),
);

for (const result of results) {
  const indicator = result.status === "passed" ? "PASS" : "FAIL";
  console.log(
    `${indicator} ${result.name} (${result.durationMs}ms); artifact ${result.artifactPath}`,
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}
const failed = results.filter((result) => result.status !== "passed");
console.log(
  `check ${failed.length ? "failed" : "passed"} in ${Date.now() - started}ms; branchResolution=not-run`,
);
process.exitCode = failed.length ? 1 : 0;
