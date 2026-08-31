import { resolveNeonBranch } from "./neon-provider.mjs";

const DEFAULT_LABELS = new Set(["production", "main", "master", "default"]);

function fail(message) {
  throw new Error(`Neon branch guard failed: ${message}`);
}

export function validateInjectedBranch(env) {
  const label = env.NEON_BRANCH;
  const branchId = env.NEON_BRANCH_ID;
  const defaultBranchId = env.NEON_DEFAULT_BRANCH_ID;
  if (!label || !branchId || !defaultBranchId)
    fail("injected branch metadata is incomplete");
  if (DEFAULT_LABELS.has(label.toLowerCase()))
    fail("obvious default branch label is not allowed");
  if (env.NEON_BRANCH_IS_DEFAULT !== "false") {
    fail(
      "injected branch metadata must explicitly set NEON_BRANCH_IS_DEFAULT=false",
    );
  }
  if (branchId === defaultBranchId)
    fail("branch ID equals the provider default branch ID");
  return { label, branchId, defaultBranchId, source: "injected" };
}

export async function assertNeonTestBranch({
  env = process.env,
  ioCapable = false,
} = {}) {
  const source =
    env.NEON_BRANCH_SOURCE === "injected" ? "injected" : "provider";
  if (source === "injected") {
    if (ioCapable)
      fail("injected branch metadata is test-only and cannot authorize I/O");
    return validateInjectedBranch(env);
  }
  if (!env.NEON_PROJECT_ID || !env.NEON_BRANCH || !env.NEON_API_KEY) {
    fail(
      "provider mode requires NEON_PROJECT_ID, NEON_BRANCH, and NEON_API_KEY",
    );
  }
  const { assertNeonEndpointPair, parseNeonConnectionUrl } =
    await import("../src/config/neon-url.ts");
  const direct = parseNeonConnectionUrl(env.DATABASE_URL_UNPOOLED, "direct");
  const pooled = env.DATABASE_URL
    ? parseNeonConnectionUrl(env.DATABASE_URL, "pooled")
    : null;
  const resolved = await resolveNeonBranch({
    projectId: env.NEON_PROJECT_ID,
    branchName: env.NEON_BRANCH,
    apiKey: env.NEON_API_KEY,
    pooledHost: pooled?.host ?? direct.host,
    directHost: direct.host,
    apiBaseUrl: env.NEON_API_BASE_URL,
  });
  if (!pooled) fail("provider mode requires both pooled and direct URLs");
  assertNeonEndpointPair(env.DATABASE_URL, env.DATABASE_URL_UNPOOLED, {
    pooled: resolved.pooled,
    direct: resolved.direct,
    defaultBranchId: resolved.defaultBranchId,
  });
  if (
    resolved.branch.isDefault ||
    resolved.branch.branchId === resolved.defaultBranchId
  ) {
    fail("provider resolved the default branch");
  }
  return {
    label: env.NEON_BRANCH,
    branchId: resolved.branch.branchId,
    defaultBranchId: resolved.defaultBranchId,
    source: "provider",
    pooled: resolved.pooled,
    direct: resolved.direct,
    pooledUrl: env.DATABASE_URL,
    directUrl: env.DATABASE_URL_UNPOOLED,
  };
}

if (import.meta.main) {
  try {
    const result = await assertNeonTestBranch({ ioCapable: true });
    console.log(
      JSON.stringify({
        ok: true,
        branch: result.label,
        branchId: result.branchId,
        defaultBranchId: result.defaultBranchId,
        source: result.source,
      }),
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Neon branch guard failed",
    );
    process.exitCode = 1;
  }
}
