export type NeonUrlKind = "pooled" | "direct";

export type NeonConnectionIdentity = {
  kind: NeonUrlKind;
  endpointId: string;
  host: string;
  databaseName: string;
};

export type NeonEndpointIdentity = {
  projectId: string;
  branchId: string;
  endpointId: string;
  isDefault: boolean;
  databaseName?: string;
};

const endpointLabel = /^ep-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const tokenizedQuery = new Set(["channel_binding", "sslmode"]);

function fail(message: string): never {
  throw new Error(`Invalid Neon connection configuration: ${message}`);
}

/**
 * Parse the deliberately narrow URL format accepted by this application.
 * The returned identity is safe to use in diagnostics: it never contains
 * credentials or the original connection string.
 */
export function parseNeonConnectionUrl(
  value: string,
  expectedKind?: NeonUrlKind,
): NeonConnectionIdentity {
  if (typeof value !== "string" || value.length === 0) {
    fail("connection URL is required");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail("connection URL is malformed");
  }

  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    fail("scheme must be postgres or postgresql");
  }
  if (!url.username || !url.password || !url.pathname || url.pathname === "/") {
    fail("username, password, and database are required");
  }
  if (url.hash) {
    fail("fragments are not allowed");
  }
  if (url.port && url.port !== "5432") {
    fail("port must be omitted or 5432");
  }

  const labels = url.hostname.split(".");
  if (labels.length < 2 || labels.slice(-2).join(".") !== "neon.tech") {
    fail("host must be a Neon .neon.tech endpoint");
  }
  const endpointHost = labels[0] ?? "";
  if (!endpointLabel.test(endpointHost)) {
    fail("host endpoint label is not canonical");
  }

  const kind: NeonUrlKind = endpointHost.endsWith("-pooler")
    ? "pooled"
    : "direct";
  if (expectedKind && kind !== expectedKind) {
    fail(`expected a ${expectedKind} endpoint`);
  }

  const queryEntries = [...url.searchParams.entries()];
  if (
    queryEntries.length !== 2 ||
    queryEntries.some(
      ([key, queryValue]) =>
        !tokenizedQuery.has(key) || queryValue !== "require",
    ) ||
    new Set(queryEntries.map(([key]) => key)).size !== 2
  ) {
    fail(
      "query must contain one channel_binding=require and one sslmode=require",
    );
  }

  let databaseName: string;
  try {
    databaseName = decodeURIComponent(url.pathname.slice(1));
  } catch {
    fail("database path encoding is malformed");
  }
  if (
    !databaseName ||
    databaseName.includes("/") ||
    databaseName === "." ||
    databaseName === ".."
  ) {
    fail("database name is malformed");
  }

  return {
    kind,
    endpointId: endpointHost.replace(/-pooler$/, ""),
    host: url.hostname,
    databaseName,
  };
}

export function assertNeonUrlPair(
  pooledValue: string,
  directValue: string,
): { pooled: NeonConnectionIdentity; direct: NeonConnectionIdentity } {
  const pooled = parseNeonConnectionUrl(pooledValue, "pooled");
  const direct = parseNeonConnectionUrl(directValue, "direct");
  if (pooled.endpointId !== direct.endpointId) {
    fail("pooled and direct endpoint IDs do not match");
  }
  if (pooled.databaseName !== direct.databaseName) {
    fail("pooled and direct database names do not match");
  }
  return { pooled, direct };
}

function assertIdentityShape(
  identity: NeonEndpointIdentity | undefined,
  role: NeonUrlKind,
  parsed: NeonConnectionIdentity,
): asserts identity is NeonEndpointIdentity {
  if (!identity) fail(`${role} endpoint metadata is unresolved`);
  if (
    !identity.projectId ||
    !identity.branchId ||
    !identity.endpointId ||
    typeof identity.isDefault !== "boolean"
  ) {
    fail(`${role} endpoint metadata is incomplete`);
  }
  if (identity.endpointId !== parsed.endpointId) {
    fail(`${role} endpoint metadata does not own the URL endpoint`);
  }
  if (
    identity.databaseName !== undefined &&
    identity.databaseName !== parsed.databaseName
  ) {
    fail(`${role} endpoint database name does not match the URL`);
  }
}

/**
 * Verify provider-resolved endpoint records before an I/O-capable operation.
 * Callers must obtain the records from the authenticated provider resolver;
 * injected records are intentionally just a pure-test seam.
 */
export function assertNeonEndpointPair(
  pooledValue: string,
  directValue: string,
  identities: {
    pooled?: NeonEndpointIdentity;
    direct?: NeonEndpointIdentity;
    defaultBranchId?: string;
  },
): {
  pooled: NeonEndpointIdentity;
  direct: NeonEndpointIdentity;
  databaseName: string;
} {
  const urls = assertNeonUrlPair(pooledValue, directValue);
  assertIdentityShape(identities.pooled, "pooled", urls.pooled);
  assertIdentityShape(identities.direct, "direct", urls.direct);

  if (identities.pooled.projectId !== identities.direct.projectId) {
    fail("pooled and direct endpoints resolve to different projects");
  }
  if (identities.pooled.branchId !== identities.direct.branchId) {
    fail("pooled and direct endpoints resolve to different branches");
  }
  if (identities.pooled.isDefault || identities.direct.isDefault) {
    fail("default branches are not valid test targets");
  }
  if (
    identities.defaultBranchId &&
    (identities.pooled.branchId === identities.defaultBranchId ||
      identities.direct.branchId === identities.defaultBranchId)
  ) {
    fail("endpoint branch is the provider default branch");
  }
  if (identities.pooled.endpointId !== identities.direct.endpointId) {
    fail("pooled and direct metadata endpoint IDs do not match");
  }

  return {
    pooled: identities.pooled,
    direct: identities.direct,
    databaseName: urls.pooled.databaseName,
  };
}

export function parseHttpOrigin(value: string): string {
  if (!value) fail("APP_ORIGIN is required");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    fail("APP_ORIGIN is malformed");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail("APP_ORIGIN must use http or https");
  }
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname && url.pathname !== "/")
  ) {
    fail("APP_ORIGIN must contain only an origin");
  }
  return url.origin;
}
