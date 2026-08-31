import { describe, expect, it } from "vitest";
import {
  readDatabaseAppEnv,
  readFullAppEnv,
  readMigrationEnv,
} from "../../src/config/env-schema";
import {
  assertNeonUrlPair,
  parseNeonConnectionUrl,
} from "../../src/config/neon-url";

const pooled =
  "postgresql://alice:secret@ep-test-123-pooler.c-123.us-east-2.aws.neon.tech/dreamlining?sslmode=require&channel_binding=require";
const direct =
  "postgresql://alice:secret@ep-test-123.c-123.us-east-2.aws.neon.tech/dreamlining?channel_binding=require&sslmode=require";

describe("scoped environment readers", () => {
  it("accepts pooled app configuration without requiring app secrets", () => {
    expect(
      readDatabaseAppEnv({ DATABASE_URL: pooled }).databaseIdentity.kind,
    ).toBe("pooled");
  });

  it("accepts migration configuration without app-only variables", () => {
    const result = readMigrationEnv({
      DATABASE_URL_UNPOOLED: direct,
      NEON_BRANCH: "codex-local",
    });
    expect(result.databaseIdentity.kind).toBe("direct");
  });

  it("validates the full secret scope and never logs values", () => {
    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
    try {
      const result = readFullAppEnv({
        DATABASE_URL: pooled,
        APP_ORIGIN: "https://dreamlining.example",
        ADMIN_PASSWORD_HASH: "scrypt$version=1$hash".padEnd(32, "x"),
        ADMIN_SESSION_SECRET: "s".repeat(32),
        CONTACT_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
        MAINTENANCE_SECRET: "m".repeat(32),
        NODE_ENV: "test",
      });
      expect(result.contactEncryptionKey.length).toBe(32);
    } finally {
      console.log = original;
    }
    expect(logs).toEqual([]);
  });
});

describe("Neon URL and endpoint invariants", () => {
  it("parses the paired fixture and redacts credentials", () => {
    const identity = parseNeonConnectionUrl(pooled, "pooled");
    expect(identity).toMatchObject({
      kind: "pooled",
      endpointId: "ep-test-123",
      host: expect.stringContaining("neon.tech"),
    });
    expect(identity).not.toHaveProperty("username");
    expect(identity).not.toHaveProperty("password");
    expect(assertNeonUrlPair(pooled, direct).pooled.databaseName).toBe(
      "dreamlining",
    );
  });

  it.each([
    [direct, "pooled"],
    [pooled.replace("channel_binding=require", "unknown=require"), "pooled"],
    [pooled.replace("ep-test-123-pooler", "127-0-0-1-pooler"), "pooled"],
    [
      pooled
        .replace("ep-test-123-pooler", "ep-test-123-pooler")
        .replace("sslmode=require", "sslmode=prefer"),
      "pooled",
    ],
    [pooled.replace("ep-test-123-pooler", "ep--bad-pooler"), "pooled"],
  ])("rejects malformed URL fixture", (value, kind) => {
    expect(() =>
      parseNeonConnectionUrl(value, kind as "pooled" | "direct"),
    ).toThrow();
  });

  it("rejects mismatched endpoint and database", () => {
    expect(() =>
      assertNeonUrlPair(pooled, direct.replace("ep-test-123.", "ep-other.")),
    ).toThrow();
    expect(() =>
      assertNeonUrlPair(pooled, direct.replace("dreamlining", "other")),
    ).toThrow();
  });
});
