import "server-only";

import { and, asc, eq, isNull, or } from "drizzle-orm";
import { getDb } from "../../../db/client";
import {
  contactGrants,
  contactMethods,
  contactRequests,
  participants,
} from "../../../db/schema";
import { assertSessionScope } from "../authorization/context";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../domain/errors";
import type {
  ContactGrantProjection,
  ContactMethodInput,
  ContactMethodMetadataProjection,
  ContactRequestInput,
  ContactRequestProjection,
  ParticipantActor,
} from "../../domain/types";
import { requireParticipantMember, requireParticipant } from "./helpers";

const methodProjection = {
  id: contactMethods.id,
  participantId: contactMethods.participantId,
  type: contactMethods.type,
  label: contactMethods.label,
  revokedAt: contactMethods.revokedAt,
};
const requestProjection = {
  id: contactRequests.id,
  ownerParticipantId: contactRequests.ownerParticipantId,
  requesterParticipantId: contactRequests.requesterParticipantId,
  context: contactRequests.context,
  reason: contactRequests.reason,
  status: contactRequests.status,
  decidedAt: contactRequests.decidedAt,
};
const grantProjection = {
  id: contactGrants.id,
  requestId: contactGrants.requestId,
  ownerParticipantId: contactGrants.ownerParticipantId,
  requesterParticipantId: contactGrants.requesterParticipantId,
  methodId: contactGrants.methodId,
  expiresAt: contactGrants.expiresAt,
  revokedAt: contactGrants.revokedAt,
  revealedAt: contactGrants.revealedAt,
};

export async function saveContactMethod(
  actor: ParticipantActor,
  input: ContactMethodInput,
): Promise<ContactMethodMetadataProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  if (!input.label.trim()) throw new Error("Contact label is required");
  if (
    input.ciphertextEnvelope.version !== 1 ||
    input.ciphertextEnvelope.algorithm !== "aes-256-gcm"
  ) {
    throw new Error("Contact method must use a versioned AES-GCM envelope");
  }
  const rows = await getDb()
    .insert(contactMethods)
    .values({
      sessionId: actor.sessionId,
      participantId: actor.participantId,
      type: input.type,
      label: input.label,
      ciphertextEnvelope: input.ciphertextEnvelope,
    })
    .returning(methodProjection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function listOwnContactMethods(
  actor: ParticipantActor,
): Promise<ContactMethodMetadataProjection[]> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  return getDb()
    .select(methodProjection)
    .from(contactMethods)
    .where(
      and(
        eq(contactMethods.sessionId, actor.sessionId),
        eq(contactMethods.participantId, actor.participantId),
      ),
    )
    .orderBy(asc(contactMethods.createdAt));
}

export async function createContactRequest(
  actor: ParticipantActor,
  input: ContactRequestInput,
): Promise<ContactRequestProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  assertSessionScope(actor, actor.sessionId);
  if (input.ownerParticipantId === actor.participantId)
    throw new ForbiddenError("You cannot request your own contact");
  const owner = await getDb()
    .select({ id: participants.id })
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, actor.sessionId),
        eq(participants.id, input.ownerParticipantId),
      ),
    )
    .limit(1);
  if (!owner[0]) throw new NotFoundError();
  const rows = await getDb()
    .insert(contactRequests)
    .values({
      sessionId: actor.sessionId,
      ownerParticipantId: input.ownerParticipantId,
      requesterParticipantId: actor.participantId,
      context: input.context,
      reason: input.reason,
    })
    .returning(requestProjection);
  if (!rows[0]) throw new ConflictError("Contact request could not be created");
  return rows[0];
}

export async function listContactRequests(
  actor: ParticipantActor,
): Promise<ContactRequestProjection[]> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  return getDb()
    .select(requestProjection)
    .from(contactRequests)
    .where(
      and(
        eq(contactRequests.sessionId, actor.sessionId),
        or(
          eq(contactRequests.ownerParticipantId, actor.participantId),
          eq(contactRequests.requesterParticipantId, actor.participantId),
        ),
      ),
    )
    .orderBy(asc(contactRequests.createdAt));
}

export async function approveContactRequest(
  actor: ParticipantActor,
  requestId: string,
  methodId: string,
  expiresAt: Date,
): Promise<ContactGrantProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  if (expiresAt <= new Date())
    throw new ConflictError("Contact grant must expire in the future");
  return getDb().transaction(async (tx) => {
    const requestRows = await tx
      .select({
        id: contactRequests.id,
        ownerParticipantId: contactRequests.ownerParticipantId,
        requesterParticipantId: contactRequests.requesterParticipantId,
        status: contactRequests.status,
      })
      .from(contactRequests)
      .where(
        and(
          eq(contactRequests.sessionId, actor.sessionId),
          eq(contactRequests.id, requestId),
          eq(contactRequests.ownerParticipantId, actor.participantId),
        ),
      )
      .limit(1);
    const request = requestRows[0];
    if (!request) throw new NotFoundError();
    if (request.status !== "pending")
      throw new ConflictError("Only pending requests can be approved");
    const methodRows = await tx
      .select({ id: contactMethods.id })
      .from(contactMethods)
      .where(
        and(
          eq(contactMethods.sessionId, actor.sessionId),
          eq(contactMethods.id, methodId),
          eq(contactMethods.participantId, actor.participantId),
          isNull(contactMethods.revokedAt),
        ),
      )
      .limit(1);
    if (!methodRows[0]) throw new NotFoundError();
    await tx
      .update(contactRequests)
      .set({ status: "approved", decidedAt: new Date() })
      .where(
        and(
          eq(contactRequests.sessionId, actor.sessionId),
          eq(contactRequests.id, requestId),
        ),
      );
    const grants = await tx
      .insert(contactGrants)
      .values({
        sessionId: actor.sessionId,
        requestId,
        ownerParticipantId: request.ownerParticipantId,
        requesterParticipantId: request.requesterParticipantId,
        methodId,
        expiresAt,
      })
      .returning(grantProjection);
    if (!grants[0])
      throw new ConflictError("Contact grant could not be created");
    return grants[0];
  });
}

export async function denyContactRequest(
  actor: ParticipantActor,
  requestId: string,
): Promise<ContactRequestProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const rows = await getDb()
    .update(contactRequests)
    .set({ status: "denied", decidedAt: new Date() })
    .where(
      and(
        eq(contactRequests.sessionId, actor.sessionId),
        eq(contactRequests.id, requestId),
        eq(contactRequests.ownerParticipantId, actor.participantId),
        eq(contactRequests.status, "pending"),
      ),
    )
    .returning(requestProjection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function readContactGrant(
  actor: ParticipantActor,
  grantId: string,
): Promise<ContactGrantProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const rows = await getDb()
    .select(grantProjection)
    .from(contactGrants)
    .where(
      and(
        eq(contactGrants.sessionId, actor.sessionId),
        eq(contactGrants.id, grantId),
        or(
          eq(contactGrants.ownerParticipantId, actor.participantId),
          eq(contactGrants.requesterParticipantId, actor.participantId),
        ),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}
