const DEFAULT_API_BASE = "https://console.neon.tech";

function error(message) {
  throw new Error(`Neon provider resolution failed: ${message}`);
}

function endpointIdFromHost(host) {
  const first = host.toLowerCase().split(".")[0] ?? "";
  return first.replace(/-pooler$/, "");
}

function allowlistedBase(value) {
  const candidate = value || DEFAULT_API_BASE;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    error("NEON_API_BASE_URL is malformed");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    error("NEON_API_BASE_URL must be an HTTPS origin");
  }
  if (url.hostname !== "console.neon.tech")
    error("NEON_API_BASE_URL host is not allowlisted");
  return url.origin;
}

function branchIsReady(branch) {
  const state = branch.current_state ?? branch.state;
  return state === "ready" || state === "active";
}

function branchIsDefault(branch) {
  return (
    branch.is_default === true ||
    branch.primary === true ||
    branch.default === true
  );
}

function projectMatches(branch, projectId) {
  return branch.project_id === undefined || branch.project_id === projectId;
}

export async function resolveNeonBranch({
  projectId,
  branchName,
  apiKey,
  pooledHost,
  directHost,
  apiBaseUrl,
  fetchImpl = fetch,
}) {
  if (!projectId || !branchName || !apiKey)
    error("project, branch, and API credentials are required");
  const base = allowlistedBase(apiBaseUrl);
  const url = `${base}/api/v2/projects/${encodeURIComponent(projectId)}/branches`;
  let response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });
  } catch {
    error("provider request failed");
  }
  if (!response.ok) error(`provider request returned HTTP ${response.status}`);
  let body;
  try {
    body = await response.json();
  } catch {
    error("provider response is not JSON");
  }
  const branches = Array.isArray(body?.branches) ? body.branches : null;
  if (!branches) error("provider response has no branches array");
  const branch = branches.find((candidate) => candidate?.name === branchName);
  if (!branch?.id || !projectMatches(branch, projectId))
    error("named branch was not resolved");
  if (!branchIsReady(branch)) error("named branch is not ready");
  const defaultBranch = branches.find(branchIsDefault);
  if (!defaultBranch?.id) error("provider default branch was not resolved");

  const endpoints = Array.isArray(branch.endpoints) ? branch.endpoints : [];
  const findEndpoint = (host, role) => {
    const expected = endpointIdFromHost(host);
    const endpoint = endpoints.find(
      (candidate) =>
        candidate?.host === host ||
        endpointIdFromHost(candidate?.host ?? "") === expected ||
        candidate?.id === expected,
    );
    if (
      !endpoint?.id ||
      (endpoint.branch_id && endpoint.branch_id !== branch.id)
    ) {
      error(`${role} endpoint is not owned by the resolved branch`);
    }
    return {
      projectId,
      branchId: branch.id,
      endpointId: expected,
      isDefault: branchIsDefault(branch),
    };
  };

  return {
    branch: {
      projectId,
      branchId: branch.id,
      isDefault: branchIsDefault(branch),
    },
    defaultBranchId: defaultBranch.id,
    pooled: findEndpoint(pooledHost, "pooled"),
    direct: findEndpoint(directHost, "direct"),
  };
}

export { DEFAULT_API_BASE };
