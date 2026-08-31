import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db/client";
import { dreamlineDrafts, dreamlineSubmissions } from "../../../db/schema";
import { assertSessionScope } from "../authorization/context";
import { ConflictError, NotFoundError } from "../../domain/errors";
import type {
  DraftInput,
  DraftProjection,
  DreamlineSnapshot,
  ParticipantActor,
  SessionActor,
  SubmissionProjection,
} from "../../domain/types";
import { requireParticipantMember, requireParticipant } from "./helpers";

const draftProjection = {
  id: dreamlineDrafts.id,
  participantId: dreamlineDrafts.participantId,
  havingEntries: dreamlineDrafts.havingEntries,
  beingEntries: dreamlineDrafts.beingEntries,
  doingEntries: dreamlineDrafts.doingEntries,
  blockers: dreamlineDrafts.blockers,
  revision: dreamlineDrafts.revision,
  savedAt: dreamlineDrafts.savedAt,
};

const submissionProjection = {
  id: dreamlineSubmissions.id,
  participantId: dreamlineSubmissions.participantId,
  snapshot: dreamlineSubmissions.immutableSnapshot,
  submittedAt: dreamlineSubmissions.submittedAt,
};

function validateEntries(input: DraftInput): void {
  for (const values of [
    input.havingEntries,
    input.beingEntries,
    input.doingEntries,
  ]) {
    if (
      !Array.isArray(values) ||
      values.length > 5 ||
      values.some((value) => typeof value !== "string")
    ) {
      throw new Error(
        "Each dream category must contain at most five text entries",
      );
    }
  }
  if (
    input.revision !== undefined &&
    (!Number.isInteger(input.revision) || input.revision < 0)
  ) {
    throw new Error("Draft revision must be a non-negative integer");
  }
}

export async function saveDraft(
  actor: ParticipantActor,
  input: DraftInput,
): Promise<DraftProjection> {
  requireParticipant(actor);
  validateEntries(input);
  await requireParticipantMember(getDb(), actor);
  const db = getDb();
  const rows = await db
    .insert(dreamlineDrafts)
    .values({
      sessionId: actor.sessionId,
      participantId: actor.participantId,
      havingEntries: input.havingEntries,
      beingEntries: input.beingEntries,
      doingEntries: input.doingEntries,
      blockers: input.blockers,
      revision: input.revision ?? 0,
      savedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [dreamlineDrafts.sessionId, dreamlineDrafts.participantId],
      set: {
        havingEntries: input.havingEntries,
        beingEntries: input.beingEntries,
        doingEntries: input.doingEntries,
        blockers: input.blockers,
        revision: input.revision ?? 0,
        savedAt: new Date(),
      },
    })
    .returning(draftProjection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function readOwnDraft(
  actor: ParticipantActor,
): Promise<DraftProjection | null> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const rows = await getDb()
    .select(draftProjection)
    .from(dreamlineDrafts)
    .where(
      and(
        eq(dreamlineDrafts.sessionId, actor.sessionId),
        eq(dreamlineDrafts.participantId, actor.participantId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function submitDreamline(
  actor: ParticipantActor,
): Promise<SubmissionProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const db = getDb();
  return db.transaction(async (tx) => {
    const existing = await tx
      .select(submissionProjection)
      .from(dreamlineSubmissions)
      .where(
        and(
          eq(dreamlineSubmissions.sessionId, actor.sessionId),
          eq(dreamlineSubmissions.participantId, actor.participantId),
        ),
      )
      .limit(1);
    if (existing[0]) return existing[0];
    const draftRows = await tx
      .select({
        havingEntries: dreamlineDrafts.havingEntries,
        beingEntries: dreamlineDrafts.beingEntries,
        doingEntries: dreamlineDrafts.doingEntries,
        blockers: dreamlineDrafts.blockers,
      })
      .from(dreamlineDrafts)
      .where(
        and(
          eq(dreamlineDrafts.sessionId, actor.sessionId),
          eq(dreamlineDrafts.participantId, actor.participantId),
        ),
      )
      .limit(1);
    const draft = draftRows[0];
    if (!draft)
      throw new ConflictError("A draft is required before submitting");
    const snapshot: DreamlineSnapshot = {
      havingEntries: [...draft.havingEntries],
      beingEntries: [...draft.beingEntries],
      doingEntries: [...draft.doingEntries],
      ...(draft.blockers ? { blockers: draft.blockers } : {}),
    };
    if (
      ![
        ...snapshot.havingEntries,
        ...snapshot.beingEntries,
        ...snapshot.doingEntries,
      ].some(Boolean)
    ) {
      throw new ConflictError("Add at least one dream before submitting");
    }
    const inserted = await tx
      .insert(dreamlineSubmissions)
      .values({
        sessionId: actor.sessionId,
        participantId: actor.participantId,
        immutableSnapshot: snapshot,
      })
      .returning(submissionProjection);
    if (!inserted[0])
      throw new ConflictError("Submission could not be created");
    return inserted[0];
  });
}

export async function readSubmission(
  actor: SessionActor,
  submissionId: string,
): Promise<SubmissionProjection> {
  assertSessionScope(actor, actor.sessionId);
  if (actor.kind === "participant")
    await requireParticipantMember(getDb(), actor);
  const rows = await getDb()
    .select(submissionProjection)
    .from(dreamlineSubmissions)
    .where(
      and(
        eq(dreamlineSubmissions.sessionId, actor.sessionId),
        eq(dreamlineSubmissions.id, submissionId),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function listSubmittedDreamlines(
  actor: SessionActor,
): Promise<SubmissionProjection[]> {
  if (actor.kind === "participant")
    await requireParticipantMember(getDb(), actor);
  return getDb()
    .select(submissionProjection)
    .from(dreamlineSubmissions)
    .where(eq(dreamlineSubmissions.sessionId, actor.sessionId))
    .orderBy(asc(dreamlineSubmissions.submittedAt));
}
