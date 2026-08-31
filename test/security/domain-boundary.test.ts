import { describe, expect, it } from "vitest";
import {
  assertAdminSession,
  assertParticipantOwner,
  assertSessionScope,
} from "../../src/server/authorization/context";
import { ForbiddenError, NotFoundError } from "../../src/domain/errors";
import { readFileSync } from "node:fs";

describe("domain authorization boundary", () => {
  const participant = {
    kind: "participant" as const,
    sessionId: "session-a",
    participantId: "owner",
  };
  const admin = {
    kind: "admin" as const,
    sessionId: "session-a",
    actor: "admin",
  };

  it("rejects cross-session access with a safe not-found error", () => {
    expect(() => assertSessionScope(participant, "session-b")).toThrow(
      NotFoundError,
    );
  });

  it("keeps owner-only and admin-only assertions explicit", () => {
    expect(() => assertParticipantOwner(participant, "other")).toThrow(
      ForbiddenError,
    );
    expect(() => assertAdminSession(participant)).toThrow(ForbiddenError);
    expect(() => assertAdminSession(admin)).not.toThrow();
  });

  it("does not expose sensitive fields in repository projection source", () => {
    const source = readFileSync("src/server/repositories/index.ts", {
      encoding: "utf8",
    });
    expect(source).not.toContain("listAllContacts");
  });
});
