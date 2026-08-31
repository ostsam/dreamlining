import { assertNeonUrlPair } from "../src/config/neon-url.ts";

const DEFAULT_LABELS = new Set(["production", "main", "master", "default"]);

function fail(message) {
  throw new Error(`Neon branch guard failed: ${message}`);
}

/** @typedef {Record<string, string | undefined>} Environment */

/**
 * Validate the configured URL pair and refuse obvious production labels.
 * @param {{ env?: Environment }} [options]
 */
export function assertNeonTestBranch({ env = process.env } = {}) {
  const label = env.NEON_BRANCH?.trim();
  if (!label) fail("NEON_BRANCH is required");
  if (DEFAULT_LABELS.has(label.toLowerCase()))
    fail("obvious default branch label is not allowed");
  const pair = assertNeonUrlPair(env.DATABASE_URL, env.DATABASE_URL_UNPOOLED);
  return { label, ...pair };
}

if (import.meta.main) {
  try {
    const result = assertNeonTestBranch();
    console.log(JSON.stringify({ ok: true, branch: result.label }));
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Neon branch guard failed",
    );
    process.exitCode = 1;
  }
}
