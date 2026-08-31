export type NeonUrlKind = "pooled" | "direct";

export type NeonConnectionIdentity = {
  kind: NeonUrlKind;
  endpointId: string;
  host: string;
  databaseName: string;
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
