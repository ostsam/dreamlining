import { describe, expect, it } from "vitest";
import { redact } from "../../scripts/lib/redact.mjs";
import {
  HERMETIC_STRIPPED_ENV_KEYS,
  createHermeticEnv,
} from "../../scripts/lib/child-process.mjs";
import { validateInjectedBranch } from "../../scripts/assert-neon-test-branch.mjs";
import { resolveNeonBranch } from "../../scripts/neon-provider.mjs";

describe("guard, redaction, and hermetic process primitives", () => {
  it("accepts only a non-default injected branch in pure mode", () => {
    expect(
      validateInjectedBranch({
        NEON_BRANCH: "codex-local",
        NEON_BRANCH_ID: "br-child",
        NEON_DEFAULT_BRANCH_ID: "br-default",
        NEON_BRANCH_IS_DEFAULT: "false",
      }),
    ).toMatchObject({ source: "injected" });
    expect(() =>
      validateInjectedBranch({
        NEON_BRANCH: "production",
        NEON_BRANCH_ID: "br",
        NEON_DEFAULT_BRANCH_ID: "def",
        NEON_BRANCH_IS_DEFAULT: "false",
      }),
    ).toThrow();
    expect(() =>
      validateInjectedBranch({
        NEON_BRANCH: "local",
        NEON_BRANCH_ID: "def",
        NEON_DEFAULT_BRANCH_ID: "def",
        NEON_BRANCH_IS_DEFAULT: "false",
      }),
    ).toThrow();
  });

  it("strips exact contract keys and sentinel values before forwarding", () => {
    const source = Object.fromEntries(
      HERMETIC_STRIPPED_ENV_KEYS.map((key) => [key, `sentinel-${key}`]),
    );
    const env = createHermeticEnv({
      ...source,
      PATH: "/bin",
      NODE_ENV: "test",
    });
    for (const key of HERMETIC_STRIPPED_ENV_KEYS)
      expect(env).not.toHaveProperty(key);
    expect(
      redact(
        `child says sentinel-secret and postgres://user:password@host/db`,
        ["sentinel-secret"],
      ),
    ).not.toContain("sentinel-secret");
    expect(
      redact(`child says sentinel-secret and postgres://user:password@host/db`),
    ).not.toContain("password@host");
  });

  it("resolves provider metadata with header-only authentication", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    const response = await resolveNeonBranch({
      projectId: "project",
      branchName: "codex-local",
      apiKey: "sentinel-api-key",
      pooledHost: "ep-test-pooler.c-123.us-east-2.aws.neon.tech",
      directHost: "ep-test.c-123.us-east-2.aws.neon.tech",
      apiBaseUrl: undefined,
      fetchImpl: async (url: string | URL | Request, init?: RequestInit) => {
        requestUrl = String(url);
        requestInit = init;
        return new Response(
          JSON.stringify({
            branches: [
              {
                id: "br-default",
                name: "production",
                current_state: "ready",
                is_default: true,
              },
              {
                id: "br-child",
                name: "codex-local",
                current_state: "ready",
                is_default: false,
                endpoints: [
                  {
                    id: "ep-pooler-record",
                    host: "ep-test-pooler.c-123.us-east-2.aws.neon.tech",
                    branch_id: "br-child",
                  },
                  {
                    id: "ep-direct-record",
                    host: "ep-test.c-123.us-east-2.aws.neon.tech",
                    branch_id: "br-child",
                  },
                ],
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    });
    expect(requestUrl).toBe(
      "https://console.neon.tech/api/v2/projects/project/branches",
    );
    expect(requestInit?.headers).toMatchObject({
      Authorization: "Bearer sentinel-api-key",
    });
    expect(JSON.stringify(response)).not.toContain("sentinel-api-key");
    expect(response.branch).toEqual({
      projectId: "project",
      branchId: "br-child",
      isDefault: false,
    });
    expect(response.defaultBranchId).toBe("br-default");
  });
});
