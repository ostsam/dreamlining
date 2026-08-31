import { describe, expect, it } from "vitest";
import {
  buildJoinUrl,
  createQrArtifact,
  generateJoinToken,
  normalizeJoinPath,
  validateJoinToken,
} from "../../src/server/qr";

describe("opaque join URL contract", () => {
  it("generates canonical 32-byte base64url tokens", () => {
    const token = generateJoinToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(validateJoinToken(token)).toBe(token);
  });

  it.each([
    "short",
    `${"a".repeat(43)}=`,
    `${"a".repeat(42)}+`,
    "a".repeat(44),
  ])("rejects unsafe token %s", (token) => {
    expect(() => validateJoinToken(token)).toThrow();
  });

  it("accepts only the canonical join path and origin", () => {
    const token = generateJoinToken();
    const path = `/join/${token}`;
    expect(normalizeJoinPath(path)).toBe(path);
    expect(buildJoinUrl("https://dreamlining.example", path)).toBe(
      `https://dreamlining.example${path}`,
    );
    for (const invalid of [
      `${path}/`,
      `${path}?x=1`,
      `${path}#x`,
      `/admin/${token}`,
      `/join/${token}/extra`,
      `/join/%2e%2e/${token}`,
      path.slice(0, -1),
    ]) {
      expect(() => normalizeJoinPath(invalid)).toThrow();
    }
    expect(() =>
      buildJoinUrl("https://user:pass@dreamlining.example", path),
    ).toThrow();
    expect(() =>
      buildJoinUrl("https://dreamlining.example/app", path),
    ).toThrow();
  });

  it("passes exactly the pure URL to the injected encoder", async () => {
    const token = generateJoinToken();
    const expected = `https://dreamlining.example/join/${token}`;
    let captured = "";
    const artifact = await createQrArtifact(
      "https://dreamlining.example",
      `/join/${token}`,
      (url) => {
        captured = url;
        return "data:image/png;base64,sentinel";
      },
    );
    expect(captured).toBe(expected);
    expect(artifact).toEqual({
      joinUrl: expected,
      dataUrl: "data:image/png;base64,sentinel",
    });
  });
});
