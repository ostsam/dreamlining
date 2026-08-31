import { describe, expect, it } from "vitest";
import {
  boundedSequence,
  buildObject,
  createFixedClock,
  createIdFactory,
  createSeededRandom,
  createUuidFactory,
} from "../factories";

describe("deterministic test primitives", () => {
  it("repeats a seeded sequence without global state", () => {
    const first = createSeededRandom(42);
    const second = createSeededRandom(42);
    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("returns defensive fixed-clock dates and bounded sequences", () => {
    const clock = createFixedClock();
    const value = clock.now();
    value.setUTCFullYear(2030);
    expect(clock.now().getUTCFullYear()).toBe(2026);
    expect(boundedSequence([1, 2, 3], 2)).toEqual([1, 2]);
  });

  it("builds generic IDs and typed objects only", () => {
    const id = createIdFactory("row");
    expect([id(), id()]).toEqual(["row_0001", "row_0002"]);
    expect(createUuidFactory()()).toMatch(/^00000000-0000-4000-8000_/);
    expect(buildObject({ value: 1, label: "a" }, { value: 2 })).toEqual({
      value: 2,
      label: "a",
    });
  });
});
