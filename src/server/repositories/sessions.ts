import "server-only";

import { eq } from "drizzle-orm";
import { getDb } from "../../../db/client";
import { sessions } from "../../../db/schema";
import {
  assertAdminSession,
  assertSessionScope,
} from "../authorization/context";
import { NotFoundError } from "../../domain/errors";
import type {
  AdminActor,
  AdminSessionProjection,
  PhaseConfig,
  SessionActor,
  SessionProjection,
  SessionPhase,
} from "../../domain/types";
import { requireParticipantMember } from "./helpers";

const participantSessionProjection = {
  id: sessions.id,
  createdAt: sessions.createdAt,
  title: sessions.title,
  phase: sessions.phase,
  phaseStartedAt: sessions.phaseStartedAt,
  phaseEndsAt: sessions.phaseEndsAt,
  pausedAt: sessions.pausedAt,
  closedAt: sessions.closedAt,
};

export async function readSession(
  actor: SessionActor,
  sessionId: string,
): Promise<SessionProjection> {
  assertSessionScope(actor, sessionId);
  if (actor.kind === "participant")
    await requireParticipantMember(getDb(), actor);
  const row = await getDb()
    .select(participantSessionProjection)
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!row[0]) throw new NotFoundError();
  return row[0];
}

export async function readAdminSession(
  actor: AdminActor,
  sessionId: string,
): Promise<AdminSessionProjection> {
  assertAdminSession(actor);
  assertSessionScope(actor, sessionId);
  const rows = await getDb()
    .select({
      ...participantSessionProjection,
      phaseConfig: sessions.phaseConfig,
      retentionDays: sessions.retentionDays,
    })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function updateSession(
  actor: AdminActor,
  sessionId: string,
  input: Partial<
    Pick<
      typeof sessions.$inferInsert,
      | "title"
      | "phase"
      | "phaseStartedAt"
      | "phaseEndsAt"
      | "phaseConfig"
      | "pausedAt"
      | "closedAt"
      | "retentionDays"
    >
  >,
): Promise<AdminSessionProjection> {
  assertAdminSession(actor);
  assertSessionScope(actor, sessionId);
  const rows = await getDb()
    .update(sessions)
    .set(input)
    .where(eq(sessions.id, sessionId))
    .returning({
      ...participantSessionProjection,
      phaseConfig: sessions.phaseConfig,
      retentionDays: sessions.retentionDays,
    });
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export type CreateSessionInput = {
  id?: string;
  publicJoinTokenHash: string;
  title: string;
  phase?: SessionPhase;
  phaseConfig?: PhaseConfig;
  retentionDays?: number;
};

/** Session creation is called by an already verified admin service. */
export async function createSession(
  actor: AdminActor,
  input: CreateSessionInput,
): Promise<AdminSessionProjection> {
  assertAdminSession(actor);
  const rows = await getDb()
    .insert(sessions)
    .values({
      id: input.id,
      publicJoinTokenHash: input.publicJoinTokenHash,
      title: input.title,
      phase: input.phase,
      phaseConfig: input.phaseConfig ?? {},
      retentionDays: input.retentionDays ?? 30,
    })
    .returning({
      ...participantSessionProjection,
      phaseConfig: sessions.phaseConfig,
      retentionDays: sessions.retentionDays,
    });
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}
