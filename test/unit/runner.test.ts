import { describe, expect, it } from "vitest";
import { runChild } from "../../scripts/lib/child-process.mjs";

describe("bounded child runner", () => {
  it("redacts child output before returning it", async () => {
    const result = await runChild(
      process.execPath,
      ["-e", "console.log('sentinel-secret')"],
      {
        timeoutMs: 5_000,
        secrets: ["sentinel-secret"],
      },
    );
    expect(result.status).toBe("passed");
    expect(result.stdout).not.toContain("sentinel-secret");
    expect(result.stdout).toContain("[REDACTED]");
  });

  it("terminates timed-out process trees and returns exit 124", async () => {
    const result = await runChild(
      process.execPath,
      ["-e", "setInterval(() => {}, 1000)"],
      {
        timeoutMs: 100,
      },
    );
    expect(result.status).toBe("timeout");
    expect(result.code).toBe(124);
    expect(result.cleanup).not.toMatch(/^failed:/);
  });
});
