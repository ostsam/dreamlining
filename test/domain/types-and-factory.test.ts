import { describe, expect, it } from "vitest";
import {
  buildDomainFixture,
  createFixedClock,
  createSeededRandom,
} from "../factories";
import {
  hashIdempotencyKey,
  stripSensitiveMetadata,
} from "../../src/server/repositories/helpers";

describe("domain fixtures and safe primitives", () => {
  it("reproduces the complete fixture without global randomness", () => {
    const first = buildDomainFixture({
      clock: createFixedClock(),
      random: createSeededRandom(7),
    });
    const second = buildDomainFixture({
      clock: createFixedClock(),
      random: createSeededRandom(7),
    });
    expect(first).toEqual(second);
    expect(first.sessions).toHaveLength(2);
    expect(first.participants).toHaveLength(4);
    expect(first.contactMethods[0]).not.toHaveProperty("value");
    expect(first.contactMethods[0].ciphertextEnvelope).toEqual(
      expect.objectContaining({ algorithm: "aes-256-gcm" }),
    );
  });

  it("hashes only canonical UUID idempotency keys", () => {
    const hash = hashIdempotencyKey("00000000-0000-4000-8000-000000000001");
    expect(hash).toBeInstanceOf(Buffer);
    expect(hash).toHaveLength(32);
    expect(() => hashIdempotencyKey("not-a-key")).toThrow();
  });

  it("removes sensitive keys from redacted audit metadata", () => {
    expect(
      stripSensitiveMetadata({
        action: "report",
        body: "private",
        tokenHash: "x",
        ok: true,
      }),
    ).toEqual({ action: "report", ok: true });
  });
});
