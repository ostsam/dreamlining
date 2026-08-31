import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { assertNeonTestBranch } from "../../scripts/assert-neon-test-branch.mjs";
import { redact } from "../../scripts/lib/redact.mjs";
import {
  HERMETIC_STRIPPED_ENV_KEYS,
  createHermeticEnv,
} from "../../scripts/lib/child-process.mjs";

const pooled =
  "postgresql://alice:secret@ep-test-123-pooler.c-123.us-east-2.aws.neon.tech/dreamlining?sslmode=require&channel_binding=require";
const direct =
  "postgresql://alice:secret@ep-test-123.c-123.us-east-2.aws.neon.tech/dreamlining?channel_binding=require&sslmode=require";

describe("guard, redaction, and hermetic process primitives", () => {
  it("accepts a feature branch and returns only safe URL identities", () => {
    expect(
      assertNeonTestBranch({
        env: {
          DATABASE_URL: pooled,
          DATABASE_URL_UNPOOLED: direct,
          NEON_BRANCH: "codex-local",
        },
      }),
    ).toMatchObject({
      label: "codex-local",
      pooled: { endpointId: "ep-test-123" },
    });
  });

  it.each(["production", "MAIN", "Master", " default "])(
    "rejects default-like branch label %s",
    (label) => {
      expect(() =>
        assertNeonTestBranch({
          env: {
            DATABASE_URL: pooled,
            DATABASE_URL_UNPOOLED: direct,
            NEON_BRANCH: label,
          },
        }),
      ).toThrow();
    },
  );

  it("rejects blank branch labels, wrong URL roles, and mismatched pairs", () => {
    expect(() =>
      assertNeonTestBranch({
        env: {
          DATABASE_URL: pooled,
          DATABASE_URL_UNPOOLED: direct,
          NEON_BRANCH: " ",
        },
      }),
    ).toThrow();
    expect(() =>
      assertNeonTestBranch({
        env: {
          DATABASE_URL: direct,
          DATABASE_URL_UNPOOLED: pooled,
          NEON_BRANCH: "feature",
        },
      }),
    ).toThrow();
    expect(() =>
      assertNeonTestBranch({
        env: {
          DATABASE_URL: pooled,
          DATABASE_URL_UNPOOLED: direct.replace("dreamlining", "other"),
          NEON_BRANCH: "feature",
        },
      }),
    ).toThrow();
    expect(() =>
      assertNeonTestBranch({
        env: {
          DATABASE_URL: pooled,
          DATABASE_URL_UNPOOLED: direct.replace("ep-test-123.", "ep-other."),
          NEON_BRANCH: "feature",
        },
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
        "child says sentinel-secret and postgres://user:password@host/db",
        ["sentinel-secret"],
      ),
    ).not.toContain("sentinel-secret");
    expect(
      redact("child says sentinel-secret and postgres://user:password@host/db"),
    ).not.toContain("password@host");
  });

  it("does not spawn Drizzle when the migration guard rejects", () => {
    const result = spawnSync("bun", ["scripts/db-migrate.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: pooled,
        DATABASE_URL_UNPOOLED: direct,
        NEON_BRANCH: "production",
      },
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).not.toMatch(
      /drizzle-kit|migration started/i,
    );
  });
});
