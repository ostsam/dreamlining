import "server-only";

import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type {
  AdminActor,
  ParticipantActor,
  SessionActor,
} from "../../domain/types";

const SAFE_DENIAL = "The requested resource is not available";

export function assertSessionScope(
  actor: SessionActor,
  sessionId: string,
): void {
  if (!sessionId || actor.sessionId !== sessionId) {
    throw new NotFoundError(SAFE_DENIAL);
  }
}

export function assertParticipantOwner(
  actor: ParticipantActor,
  participantId: string,
): void {
  if (actor.kind !== "participant" || actor.participantId !== participantId) {
    throw new ForbiddenError(SAFE_DENIAL);
  }
}

export function assertAdminSession(
  actor: SessionActor,
): asserts actor is AdminActor {
  if (actor.kind !== "admin" || !actor.actor) {
    throw new ForbiddenError(SAFE_DENIAL);
  }
}

export function assertParticipantSession(
  actor: SessionActor,
  participant: { sessionId: string; id: string },
): void {
  assertSessionScope(actor, participant.sessionId);
  if (actor.kind === "participant" && actor.participantId === participant.id)
    return;
  if (actor.kind === "admin") return;
  // Membership must be checked by the repository before this helper is called.
  throw new ForbiddenError(SAFE_DENIAL);
}
