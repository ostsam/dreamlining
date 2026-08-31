import "server-only";

import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db/client";
import { commitments, dreamlineSubmissions } from "../../../db/schema";
import { NotFoundError } from "../../domain/errors";
import type {
  CommitmentInput,
  CommitmentProjection,
  ParticipantActor,
} from "../../domain/types";
import { requireParticipantMember, requireParticipant } from "./helpers";

const projection = {
  id: commitments.id,
  participantId: commitments.participantId,
  submissionId: commitments.submissionId,
  outcome: commitments.outcome,
  firstAction: commitments.firstAction,
  firstActionDate: commitments.firstActionDate,
  helpWanted: commitments.helpWanted,
  collaborators: commitments.collaborators,
  confirmedAt: commitments.confirmedAt,
};

export async function saveCommitment(
  actor: ParticipantActor,
  input: CommitmentInput,
): Promise<CommitmentProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const submission = await getDb()
    .select({ id: dreamlineSubmissions.id })
    .from(dreamlineSubmissions)
    .where(
      and(
        eq(dreamlineSubmissions.sessionId, actor.sessionId),
        eq(dreamlineSubmissions.id, input.submissionId),
        eq(dreamlineSubmissions.participantId, actor.participantId),
      ),
    )
    .limit(1);
  if (!submission[0]) throw new NotFoundError();
  const rows = await getDb()
    .insert(commitments)
    .values({
      sessionId: actor.sessionId,
      participantId: actor.participantId,
      ...input,
    })
    .onConflictDoUpdate({
      target: [commitments.sessionId, commitments.participantId],
      set: {
        submissionId: input.submissionId,
        outcome: input.outcome,
        firstAction: input.firstAction,
        firstActionDate: input.firstActionDate,
        helpWanted: input.helpWanted,
        collaborators: input.collaborators,
        confirmedAt: input.confirmedAt,
      },
    })
    .returning(projection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function readOwnCommitment(
  actor: ParticipantActor,
): Promise<CommitmentProjection | null> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const rows = await getDb()
    .select(projection)
    .from(commitments)
    .where(
      and(
        eq(commitments.sessionId, actor.sessionId),
        eq(commitments.participantId, actor.participantId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
