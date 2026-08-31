import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { redactObject } from "./redact.mjs";

export async function writeArtifact(metadata, output, secrets = []) {
  const runId = metadata.runId ?? randomUUID();
  const safeName = String(metadata.commandName ?? "run").replace(
    /[^a-z0-9_-]+/gi,
    "-",
  );
  const artifactPath =
    metadata.artifactPath ?? `artifacts/${runId}-${safeName}.json`;
  const safe = redactObject(
    { ...metadata, runId, artifactPath, output },
    secrets,
  );
  await mkdir("artifacts", { recursive: true });
  await writeFile(artifactPath, `${JSON.stringify(safe, null, 2)}\n`, "utf8");
  return artifactPath;
}

export function summarizeResult(result) {
  return {
    status: result.status,
    code: result.code,
    durationMs: result.durationMs,
    cleanup: result.cleanup,
  };
}
