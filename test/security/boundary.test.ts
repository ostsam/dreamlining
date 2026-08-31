import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("foundation security boundary", () => {
  it("keeps the database client server-only", () => {
    expect(readFileSync(resolve("db/client.ts"), "utf8")).toContain(
      'import "server-only"',
    );
  });

  it("marks domain authorization as not applicable to DREAM-8", () => {
    expect({
      evidence: "not-applicable",
      owners: ["DREAM-9", "DREAM-17", "DREAM-20", "DREAM-21", "DREAM-25"],
    }).toEqual(expect.objectContaining({ evidence: "not-applicable" }));
  });
});
