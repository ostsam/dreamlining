import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db/client";
import { participants } from "../../../db/schema";
import {
  assertAdminSession,
  assertSessionScope,
} from "../authorization/context";
import { NotFoundError } from "../../domain/errors";
import type {
  AdminActor,
  ParticipantActor,
  ParticipantOwnerProjection,
  ParticipantPeerProjection,
  ParticipantState,
  SessionActor,
} from "../../domain/types";
import { requireParticipantMember, requireParticipant } from "./helpers";

const peerProjection = {
  id: participants.id,
  displayName: participants.displayName,
};

const ownerProjection = {
  ...peerProjection,
  state: participants.state,
  joinedAt: participants.joinedAt,
  lastSeenAt: participants.lastSeenAt,
  leftAt: participants.leftAt,
};

export type CreateParticipantInput = {
  id?: string;
  displayName: string;
  tokenHash: Buffer;
  state?: ParticipantState;
  joinedAt?: Date;
};

export async function createParticipant(
  actor: AdminActor,
  sessionId: string,
  input: CreateParticipantInput,
): Promise<ParticipantOwnerProjection> {
  assertAdminSession(actor);
  assertSessionScope(actor, sessionId);
  const rows = await getDb()
    .insert(participants)
    .values({
      id: input.id,
      sessionId,
      displayName: input.displayName,
      tokenHash: input.tokenHash,
      state: input.state ?? "active",
      joinedAt: input.joinedAt,
      lastSeenAt: input.joinedAt,
    })
    .returning(ownerProjection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function listPeers(
  actor: SessionActor,
  sessionId: string,
): Promise<ParticipantPeerProjection[]> {
  assertSessionScope(actor, sessionId);
  if (actor.kind === "participant")
    await requireParticipantMember(getDb(), actor);
  return getDb()
    .select(peerProjection)
    .from(participants)
    .where(eq(participants.sessionId, sessionId))
    .orderBy(asc(participants.joinedAt));
}

export async function readOwnParticipant(
  actor: ParticipantActor,
): Promise<ParticipantOwnerProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const rows = await getDb()
    .select(ownerProjection)
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, actor.sessionId),
        eq(participants.id, actor.participantId),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function readParticipantForAdmin(
  actor: AdminActor,
  participantId: string,
): Promise<ParticipantOwnerProjection> {
  assertAdminSession(actor);
  const rows = await getDb()
    .select(ownerProjection)
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, actor.sessionId),
        eq(participants.id, participantId),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function heartbeat(
  actor: ParticipantActor,
  state: ParticipantState = "active",
): Promise<ParticipantOwnerProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const rows = await getDb()
    .update(participants)
    .set({
      state,
      lastSeenAt: new Date(),
      leftAt: state === "left" ? new Date() : null,
    })
    .where(
      and(
        eq(participants.sessionId, actor.sessionId),
        eq(participants.id, actor.participantId),
      ),
    )
    .returning(ownerProjection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}
