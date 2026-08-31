import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../factories";

describe("router foundation boundary", () => {
  it("keeps generic reproducibility available; DREAM-16 is not applicable yet", () => {
    const a = createSeededRandom(7);
    const b = createSeededRandom(7);
    expect([a(), a()]).toEqual([b(), b()]);
    expect({ evidence: "not-applicable", owner: "DREAM-16" }).toEqual({
      evidence: "not-applicable",
      owner: "DREAM-16",
    });
  });
});
