import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { schema } from "../../db/schema";

describe("canonical domain schema", () => {
  it("declares exactly the fourteen contracted entities", () => {
    expect(Object.keys(schema).sort()).toEqual([
      "adminAuditEvents",
      "commentReports",
      "comments",
      "commitments",
      "contactGrants",
      "contactMethods",
      "contactRequests",
      "dreamlineDrafts",
      "dreamlineSubmissions",
      "dreamlineViews",
      "mutationReceipts",
      "participants",
      "recommendationImpressions",
      "sessions",
    ]);
  });

  it("keeps the migration provider-independent and complete", () => {
    const migration = readFileSync(
      "db/migrations/0000_loud_marvex.sql",
      "utf8",
    );
    for (const table of Object.values(schema)) {
      expect(migration).toContain(
        `CREATE TABLE "${table[Symbol.for("drizzle:Name") as never]}"`,
      );
    }
    expect(migration).toContain('CREATE TYPE "public"."session_phase"');
    expect(migration).toContain("comments_parent_session_fk");
    expect(migration).toContain("ON DELETE cascade");
    expect(migration).toContain("mutation_receipts_exactly_one_actor");
    expect(migration).toContain("contact_methods_ciphertext_envelope_shape");
  });
});
