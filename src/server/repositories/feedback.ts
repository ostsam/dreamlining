import "server-only";

import { and, asc, eq, isNull, or } from "drizzle-orm";
import { getDb } from "../../../db/client";
import {
  commentReports,
  comments,
  dreamlineSubmissions,
  dreamlineViews,
  recommendationImpressions,
} from "../../../db/schema";
import {
  assertAdminSession,
  assertSessionScope,
} from "../authorization/context";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type {
  CommentInput,
  CommentProjection,
  CommentReportProjection,
  ImpressionAggregateInput,
  ParticipantActor,
  SessionActor,
  ViewProjection,
  ViewSource,
} from "../../domain/types";
import { requireParticipantMember, requireParticipant } from "./helpers";

const commentProjection = {
  id: comments.id,
  submissionId: comments.submissionId,
  authorParticipantId: comments.authorParticipantId,
  parentCommentId: comments.parentCommentId,
  kind: comments.kind,
  body: comments.body,
  visibility: comments.visibility,
  createdAt: comments.createdAt,
  updatedAt: comments.updatedAt,
};

const reportProjection = {
  id: commentReports.id,
  commentId: commentReports.commentId,
  reporterParticipantId: commentReports.reporterParticipantId,
  reason: commentReports.reason,
  disclosedAt: commentReports.disclosedAt,
  status: commentReports.status,
  action: commentReports.action,
  actionAt: commentReports.actionAt,
};

const viewProjection = {
  id: dreamlineViews.id,
  submissionId: dreamlineViews.submissionId,
  source: dreamlineViews.source,
  viewedAt: dreamlineViews.viewedAt,
  commentedAt: dreamlineViews.commentedAt,
};

export async function recordRecommendationImpression(
  actor: ParticipantActor,
  input: ImpressionAggregateInput,
): Promise<{ recorded: boolean }> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const target = await getDb()
    .select({ participantId: dreamlineSubmissions.participantId })
    .from(dreamlineSubmissions)
    .where(
      and(
        eq(dreamlineSubmissions.sessionId, actor.sessionId),
        eq(dreamlineSubmissions.id, input.submissionId),
      ),
    )
    .limit(1);
  if (!target[0]) throw new NotFoundError();
  if (target[0].participantId === actor.participantId)
    throw new ForbiddenError();
  const rows = await getDb()
    .insert(recommendationImpressions)
    .values({
      sessionId: actor.sessionId,
      viewerParticipantId: actor.participantId,
      submissionId: input.submissionId,
      algorithmVersion: input.algorithmVersion,
      servedAt: input.servedAt,
      dedupeBucket: input.dedupeBucket,
    })
    .onConflictDoNothing({
      target: [
        recommendationImpressions.viewerParticipantId,
        recommendationImpressions.submissionId,
        recommendationImpressions.dedupeBucket,
      ],
    })
    .returning({ id: recommendationImpressions.id });
  return { recorded: rows.length > 0 };
}

export async function recordView(
  actor: ParticipantActor,
  submissionId: string,
  source: ViewSource = "manual",
): Promise<ViewProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const submission = await getDb()
    .select({ participantId: dreamlineSubmissions.participantId })
    .from(dreamlineSubmissions)
    .where(
      and(
        eq(dreamlineSubmissions.sessionId, actor.sessionId),
        eq(dreamlineSubmissions.id, submissionId),
      ),
    )
    .limit(1);
  if (!submission[0]) throw new NotFoundError();
  if (submission[0].participantId === actor.participantId)
    throw new ForbiddenError();
  const now = new Date();
  const rows = await getDb()
    .insert(dreamlineViews)
    .values({
      sessionId: actor.sessionId,
      viewerParticipantId: actor.participantId,
      submissionId,
      source,
      viewedAt: now,
    })
    .onConflictDoUpdate({
      target: [dreamlineViews.viewerParticipantId, dreamlineViews.submissionId],
      set: { source, viewedAt: now },
    })
    .returning(viewProjection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function markViewCommented(
  actor: ParticipantActor,
  submissionId: string,
  commentedAt = new Date(),
): Promise<void> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  await getDb()
    .update(dreamlineViews)
    .set({ commentedAt })
    .where(
      and(
        eq(dreamlineViews.sessionId, actor.sessionId),
        eq(dreamlineViews.viewerParticipantId, actor.participantId),
        eq(dreamlineViews.submissionId, submissionId),
      ),
    );
}

export async function readOwnViewHistory(
  actor: ParticipantActor,
): Promise<ViewProjection[]> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  return getDb()
    .select(viewProjection)
    .from(dreamlineViews)
    .where(
      and(
        eq(dreamlineViews.sessionId, actor.sessionId),
        eq(dreamlineViews.viewerParticipantId, actor.participantId),
        isNull(dreamlineViews.commentedAt),
      ),
    )
    .orderBy(asc(dreamlineViews.viewedAt));
}

async function submissionOwner(
  sessionId: string,
  submissionId: string,
): Promise<string> {
  const rows = await getDb()
    .select({ participantId: dreamlineSubmissions.participantId })
    .from(dreamlineSubmissions)
    .where(
      and(
        eq(dreamlineSubmissions.sessionId, sessionId),
        eq(dreamlineSubmissions.id, submissionId),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0].participantId;
}

export async function addComment(
  actor: ParticipantActor,
  input: CommentInput,
): Promise<CommentProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const ownerId = await submissionOwner(actor.sessionId, input.submissionId);
  if (ownerId === actor.participantId)
    throw new ForbiddenError("You cannot comment on your own dreamline");
  if (!input.body.trim()) throw new Error("Comment body is required");
  if (input.kind === "root" && input.parentCommentId)
    throw new Error("Root comments cannot have a parent");
  if (input.kind === "reply" && !input.parentCommentId)
    throw new Error("Replies require a parent comment");
  const rows = await getDb()
    .insert(comments)
    .values({
      sessionId: actor.sessionId,
      submissionId: input.submissionId,
      authorParticipantId: actor.participantId,
      parentCommentId: input.parentCommentId ?? null,
      kind: input.kind,
      body: input.body,
      visibility: input.visibility,
    })
    .returning(commentProjection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function readComments(
  actor: SessionActor,
  sessionId: string,
  submissionId: string,
): Promise<CommentProjection[]> {
  assertSessionScope(actor, sessionId);
  if (actor.kind === "participant")
    await requireParticipantMember(getDb(), actor);
  const ownerId = await submissionOwner(sessionId, submissionId);
  const visibility =
    actor.kind === "admin"
      ? eq(comments.visibility, "public")
      : or(
          eq(comments.visibility, "public"),
          eq(comments.authorParticipantId, actor.participantId),
          eq(comments.authorParticipantId, ownerId),
        );
  return getDb()
    .select(commentProjection)
    .from(comments)
    .where(
      and(
        eq(comments.sessionId, sessionId),
        eq(comments.submissionId, submissionId),
        visibility,
      ),
    )
    .orderBy(asc(comments.createdAt));
}

export async function reportComment(
  actor: ParticipantActor,
  commentId: string,
  reason: string,
): Promise<CommentReportProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const target = await getDb()
    .select({ id: comments.id, submissionId: comments.submissionId })
    .from(comments)
    .where(
      and(eq(comments.sessionId, actor.sessionId), eq(comments.id, commentId)),
    )
    .limit(1);
  if (!target[0]) throw new NotFoundError();
  const ownerId = await submissionOwner(
    actor.sessionId,
    target[0].submissionId,
  );
  if (ownerId !== actor.participantId)
    throw new ForbiddenError("Only the dreamline owner can report feedback");
  if (!reason.trim()) throw new Error("A report reason is required");
  const rows = await getDb()
    .insert(commentReports)
    .values({
      sessionId: actor.sessionId,
      commentId,
      reporterParticipantId: actor.participantId,
      reason,
    })
    .returning(reportProjection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function readOwnReport(
  actor: ParticipantActor,
  reportId: string,
): Promise<CommentReportProjection> {
  requireParticipant(actor);
  await requireParticipantMember(getDb(), actor);
  const rows = await getDb()
    .select(reportProjection)
    .from(commentReports)
    .where(
      and(
        eq(commentReports.sessionId, actor.sessionId),
        eq(commentReports.id, reportId),
        eq(commentReports.reporterParticipantId, actor.participantId),
      ),
    )
    .limit(1);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function readDisclosedThread(
  actor: SessionActor,
  sessionId: string,
  commentId: string,
): Promise<{ report: CommentReportProjection; comments: CommentProjection[] }> {
  assertAdminSession(actor);
  assertSessionScope(actor, sessionId);
  const reportRows = await getDb()
    .select(reportProjection)
    .from(commentReports)
    .where(
      and(
        eq(commentReports.sessionId, sessionId),
        eq(commentReports.commentId, commentId),
        eq(commentReports.action, "disclosed"),
      ),
    )
    .limit(1);
  if (!reportRows[0]) throw new NotFoundError();
  const thread = await getDb()
    .select(commentProjection)
    .from(comments)
    .where(
      and(
        eq(comments.sessionId, sessionId),
        or(eq(comments.id, commentId), eq(comments.parentCommentId, commentId)),
      ),
    )
    .orderBy(asc(comments.createdAt));
  return { report: reportRows[0], comments: thread };
}
