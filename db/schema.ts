import {
  check,
  customType,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { DreamlineSnapshot, PhaseConfig } from "../src/domain/types";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

const instant = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });

export const sessionPhase = pgEnum("session_phase", [
  "lobby",
  "drafting",
  "feedback",
  "commitment",
  "closed",
]);
export const participantState = pgEnum("participant_state", [
  "active",
  "abandoned",
  "left",
]);
export const viewSource = pgEnum("view_source", ["manual", "recommendation"]);
export const commentKind = pgEnum("comment_kind", ["root", "reply"]);
export const commentVisibility = pgEnum("comment_visibility", [
  "public",
  "private",
]);
export const reportStatus = pgEnum("report_status", [
  "open",
  "reviewed",
  "resolved",
  "dismissed",
]);
export const reportAction = pgEnum("report_action", [
  "none",
  "disclosed",
  "hidden",
]);
export const contactMethodType = pgEnum("contact_method_type", [
  "email",
  "phone",
  "other",
]);
export const contactRequestStatus = pgEnum("contact_request_status", [
  "pending",
  "approved",
  "denied",
  "revoked",
]);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    publicJoinTokenHash: text("public_join_token_hash").notNull(),
    title: text("title").notNull(),
    phase: sessionPhase("phase").default("lobby").notNull(),
    phaseStartedAt: instant("phase_started_at"),
    phaseEndsAt: instant("phase_ends_at"),
    phaseConfig: jsonb("phase_config")
      .$type<PhaseConfig>()
      .default({})
      .notNull(),
    pausedAt: instant("paused_at"),
    retentionDays: integer("retention_days").default(30).notNull(),
    closedAt: instant("closed_at"),
  },
  (table) => ({
    joinHashUnique: uniqueIndex("sessions_public_join_token_hash_uq").on(
      table.publicJoinTokenHash,
    ),
    phaseIndex: index("sessions_phase_closed_idx").on(
      table.phase,
      table.closedAt,
    ),
    retentionPositive: check(
      "sessions_retention_days_positive",
      sql`${table.retentionDays} > 0`,
    ),
    phaseTimingCoherent: check(
      "sessions_phase_timing_coherent",
      sql`${table.phaseEndsAt} is null or ${table.phaseStartedAt} is not null`,
    ),
  }),
);

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    displayName: text("display_name").notNull(),
    tokenHash: bytea("token_hash").notNull(),
    state: participantState("state").default("active").notNull(),
    joinedAt: instant("joined_at").defaultNow().notNull(),
    lastSeenAt: instant("last_seen_at").defaultNow().notNull(),
    leftAt: instant("left_at"),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "participants_session_fk",
    }).onDelete("cascade"),
    sessionIdUnique: uniqueIndex("participants_id_session_uq").on(
      table.id,
      table.sessionId,
    ),
    tokenUnique: uniqueIndex("participants_session_token_hash_uq").on(
      table.sessionId,
      table.tokenHash,
    ),
    rosterIndex: index("participants_session_state_joined_idx").on(
      table.sessionId,
      table.state,
      table.joinedAt,
    ),
  }),
);

type Child = {
  sessionId: AnyPgColumn;
  participantId: AnyPgColumn;
};
const participantSessionFk = (table: Child, name: string) =>
  foreignKey({
    columns: [table.sessionId, table.participantId],
    foreignColumns: [participants.sessionId, participants.id],
    name,
  }).onDelete("cascade");

export const dreamlineDrafts = pgTable(
  "dreamline_drafts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    participantId: uuid("participant_id").notNull(),
    havingEntries: jsonb("having_entries")
      .$type<string[]>()
      .default([])
      .notNull(),
    beingEntries: jsonb("being_entries")
      .$type<string[]>()
      .default([])
      .notNull(),
    doingEntries: jsonb("doing_entries")
      .$type<string[]>()
      .default([])
      .notNull(),
    blockers: text("blockers"),
    revision: integer("revision").default(0).notNull(),
    savedAt: instant("saved_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "dreamline_drafts_session_fk",
    }).onDelete("cascade"),
    participantFk: participantSessionFk(
      table,
      "dreamline_drafts_participant_session_fk",
    ),
    ownerUnique: uniqueIndex("dreamline_drafts_session_participant_uq").on(
      table.sessionId,
      table.participantId,
    ),
    ownerIndex: index("dreamline_drafts_session_participant_idx").on(
      table.sessionId,
      table.participantId,
    ),
    revisionPositive: check(
      "dreamline_drafts_revision_nonnegative",
      sql`${table.revision} >= 0`,
    ),
    havingLimit: check(
      "dreamline_drafts_having_max_five",
      sql`jsonb_typeof(${table.havingEntries}) = 'array' and jsonb_array_length(${table.havingEntries}) <= 5`,
    ),
    beingLimit: check(
      "dreamline_drafts_being_max_five",
      sql`jsonb_typeof(${table.beingEntries}) = 'array' and jsonb_array_length(${table.beingEntries}) <= 5`,
    ),
    doingLimit: check(
      "dreamline_drafts_doing_max_five",
      sql`jsonb_typeof(${table.doingEntries}) = 'array' and jsonb_array_length(${table.doingEntries}) <= 5`,
    ),
  }),
);

export const dreamlineSubmissions = pgTable(
  "dreamline_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    participantId: uuid("participant_id").notNull(),
    immutableSnapshot: jsonb("immutable_snapshot")
      .$type<DreamlineSnapshot>()
      .notNull(),
    submittedAt: instant("submitted_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "dreamline_submissions_session_fk",
    }).onDelete("cascade"),
    participantFk: participantSessionFk(
      table,
      "dreamline_submissions_participant_session_fk",
    ),
    ownerUnique: uniqueIndex("dreamline_submissions_session_participant_uq").on(
      table.sessionId,
      table.participantId,
    ),
    submittedIndex: index("dreamline_submissions_session_submitted_idx").on(
      table.sessionId,
      table.submittedAt,
    ),
  }),
);

export const recommendationImpressions = pgTable(
  "recommendation_impressions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    viewerParticipantId: uuid("viewer_participant_id").notNull(),
    submissionId: uuid("submission_id").notNull(),
    algorithmVersion: text("algorithm_version").notNull(),
    servedAt: instant("served_at").defaultNow().notNull(),
    dedupeBucket: instant("dedupe_bucket").notNull(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "recommendation_impressions_session_fk",
    }).onDelete("cascade"),
    viewerFk: foreignKey({
      columns: [table.sessionId, table.viewerParticipantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "recommendation_impressions_viewer_session_fk",
    }).onDelete("cascade"),
    submissionFk: foreignKey({
      columns: [table.sessionId, table.submissionId],
      foreignColumns: [dreamlineSubmissions.sessionId, dreamlineSubmissions.id],
      name: "recommendation_impressions_submission_session_fk",
    }).onDelete("cascade"),
    dedupeUnique: uniqueIndex("recommendation_impressions_dedupe_uq").on(
      table.viewerParticipantId,
      table.submissionId,
      table.dedupeBucket,
    ),
    submissionIndex: index(
      "recommendation_impressions_session_submission_served_idx",
    ).on(table.sessionId, table.submissionId, table.servedAt),
    viewerIndex: index(
      "recommendation_impressions_session_viewer_served_idx",
    ).on(table.sessionId, table.viewerParticipantId, table.servedAt),
  }),
);

export const dreamlineViews = pgTable(
  "dreamline_views",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    viewerParticipantId: uuid("viewer_participant_id").notNull(),
    submissionId: uuid("submission_id").notNull(),
    source: viewSource("source").default("manual").notNull(),
    viewedAt: instant("viewed_at").defaultNow().notNull(),
    commentedAt: instant("commented_at"),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "dreamline_views_session_fk",
    }).onDelete("cascade"),
    viewerFk: foreignKey({
      columns: [table.sessionId, table.viewerParticipantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "dreamline_views_viewer_session_fk",
    }).onDelete("cascade"),
    submissionFk: foreignKey({
      columns: [table.sessionId, table.submissionId],
      foreignColumns: [dreamlineSubmissions.sessionId, dreamlineSubmissions.id],
      name: "dreamline_views_submission_session_fk",
    }).onDelete("cascade"),
    viewerSubmissionUnique: uniqueIndex(
      "dreamline_views_viewer_submission_uq",
    ).on(table.viewerParticipantId, table.submissionId),
    viewerIndex: index("dreamline_views_session_viewer_comment_idx").on(
      table.sessionId,
      table.viewerParticipantId,
      table.commentedAt,
      table.viewedAt,
    ),
  }),
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    submissionId: uuid("submission_id").notNull(),
    authorParticipantId: uuid("author_participant_id").notNull(),
    parentCommentId: uuid("parent_comment_id"),
    kind: commentKind("kind").default("root").notNull(),
    body: text("body").notNull(),
    visibility: commentVisibility("visibility").default("public").notNull(),
    updatedAt: instant("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "comments_session_fk",
    }).onDelete("cascade"),
    submissionFk: foreignKey({
      columns: [table.sessionId, table.submissionId],
      foreignColumns: [dreamlineSubmissions.sessionId, dreamlineSubmissions.id],
      name: "comments_submission_session_fk",
    }).onDelete("cascade"),
    authorFk: foreignKey({
      columns: [table.sessionId, table.authorParticipantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "comments_author_session_fk",
    }).onDelete("cascade"),
    parentFk: foreignKey({
      columns: [table.sessionId, table.parentCommentId],
      foreignColumns: [table.sessionId, table.id],
      name: "comments_parent_session_fk",
    }).onDelete("cascade"),
    threadIndex: index("comments_session_submission_created_idx").on(
      table.sessionId,
      table.submissionId,
      table.createdAt,
    ),
    parentIndex: index("comments_submission_parent_idx").on(
      table.submissionId,
      table.parentCommentId,
    ),
    authorIndex: index("comments_session_author_idx").on(
      table.sessionId,
      table.authorParticipantId,
    ),
    kindParentCoherent: check(
      "comments_kind_parent_coherent",
      sql`(${table.kind} = 'root' and ${table.parentCommentId} is null) or (${table.kind} = 'reply' and ${table.parentCommentId} is not null)`,
    ),
  }),
);

export const commentReports = pgTable(
  "comment_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    commentId: uuid("comment_id").notNull(),
    reporterParticipantId: uuid("reporter_participant_id").notNull(),
    reason: text("reason").notNull(),
    disclosedAt: instant("disclosed_at"),
    status: reportStatus("status").default("open").notNull(),
    action: reportAction("action").default("none").notNull(),
    actionAt: instant("action_at"),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "comment_reports_session_fk",
    }).onDelete("cascade"),
    commentFk: foreignKey({
      columns: [table.sessionId, table.commentId],
      foreignColumns: [comments.sessionId, comments.id],
      name: "comment_reports_comment_session_fk",
    }).onDelete("cascade"),
    reporterFk: foreignKey({
      columns: [table.sessionId, table.reporterParticipantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "comment_reports_reporter_session_fk",
    }).onDelete("cascade"),
    reporterUnique: uniqueIndex("comment_reports_comment_reporter_uq").on(
      table.commentId,
      table.reporterParticipantId,
    ),
    statusIndex: index("comment_reports_session_status_created_idx").on(
      table.sessionId,
      table.status,
      table.createdAt,
    ),
    commentIndex: index("comment_reports_session_comment_idx").on(
      table.sessionId,
      table.commentId,
    ),
  }),
);

export const contactMethods = pgTable(
  "contact_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    participantId: uuid("participant_id").notNull(),
    type: contactMethodType("type").notNull(),
    label: text("label").notNull(),
    ciphertextEnvelope: jsonb("ciphertext_envelope")
      .$type<Record<string, unknown>>()
      .notNull(),
    revokedAt: instant("revoked_at"),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "contact_methods_session_fk",
    }).onDelete("cascade"),
    ownerFk: foreignKey({
      columns: [table.sessionId, table.participantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "contact_methods_owner_session_fk",
    }).onDelete("cascade"),
    ownerIndex: index("contact_methods_session_participant_revoked_idx").on(
      table.sessionId,
      table.participantId,
      table.revokedAt,
    ),
    envelopeShape: check(
      "contact_methods_ciphertext_envelope_shape",
      sql`${table.ciphertextEnvelope} ? 'version' and ${table.ciphertextEnvelope} ? 'algorithm' and ${table.ciphertextEnvelope} ? 'ivB64' and ${table.ciphertextEnvelope} ? 'ciphertextB64' and ${table.ciphertextEnvelope} ? 'authTagB64'`,
    ),
  }),
);

export const contactRequests = pgTable(
  "contact_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    ownerParticipantId: uuid("owner_participant_id").notNull(),
    requesterParticipantId: uuid("requester_participant_id").notNull(),
    context: text("context").notNull(),
    reason: text("reason").notNull(),
    status: contactRequestStatus("status").default("pending").notNull(),
    decidedAt: instant("decided_at"),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "contact_requests_session_fk",
    }).onDelete("cascade"),
    ownerFk: foreignKey({
      columns: [table.sessionId, table.ownerParticipantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "contact_requests_owner_session_fk",
    }).onDelete("cascade"),
    requesterFk: foreignKey({
      columns: [table.sessionId, table.requesterParticipantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "contact_requests_requester_session_fk",
    }).onDelete("cascade"),
    pendingPairUnique: uniqueIndex("contact_requests_pending_pair_uq")
      .on(
        table.sessionId,
        table.ownerParticipantId,
        table.requesterParticipantId,
      )
      .where(sql`${table.status} = 'pending'`),
    ownerStatusIndex: index("contact_requests_owner_status_idx").on(
      table.sessionId,
      table.ownerParticipantId,
      table.status,
    ),
    requesterStatusIndex: index("contact_requests_requester_status_idx").on(
      table.sessionId,
      table.requesterParticipantId,
      table.status,
    ),
    notSelf: check(
      "contact_requests_owner_requester_distinct",
      sql`${table.ownerParticipantId} <> ${table.requesterParticipantId}`,
    ),
  }),
);

export const contactGrants = pgTable(
  "contact_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    requestId: uuid("request_id").notNull(),
    ownerParticipantId: uuid("owner_participant_id").notNull(),
    requesterParticipantId: uuid("requester_participant_id").notNull(),
    methodId: uuid("method_id").notNull(),
    expiresAt: instant("expires_at").notNull(),
    revokedAt: instant("revoked_at"),
    revealedAt: instant("revealed_at"),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "contact_grants_session_fk",
    }).onDelete("cascade"),
    requestFk: foreignKey({
      columns: [table.sessionId, table.requestId],
      foreignColumns: [contactRequests.sessionId, contactRequests.id],
      name: "contact_grants_request_session_fk",
    }).onDelete("cascade"),
    ownerFk: foreignKey({
      columns: [table.sessionId, table.ownerParticipantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "contact_grants_owner_session_fk",
    }).onDelete("cascade"),
    requesterFk: foreignKey({
      columns: [table.sessionId, table.requesterParticipantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "contact_grants_requester_session_fk",
    }).onDelete("cascade"),
    methodFk: foreignKey({
      columns: [table.sessionId, table.methodId],
      foreignColumns: [contactMethods.sessionId, contactMethods.id],
      name: "contact_grants_method_session_fk",
    }).onDelete("cascade"),
    requestUnique: uniqueIndex("contact_grants_request_uq").on(table.requestId),
    requesterIndex: index("contact_grants_requester_expiry_idx").on(
      table.sessionId,
      table.requesterParticipantId,
      table.expiresAt,
      table.revokedAt,
    ),
    ownerIndex: index("contact_grants_owner_idx").on(
      table.sessionId,
      table.ownerParticipantId,
    ),
    identitiesDistinct: check(
      "contact_grants_owner_requester_distinct",
      sql`${table.ownerParticipantId} <> ${table.requesterParticipantId}`,
    ),
  }),
);

export const commitments = pgTable(
  "commitments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    participantId: uuid("participant_id").notNull(),
    submissionId: uuid("submission_id").notNull(),
    outcome: text("outcome").notNull(),
    firstAction: text("first_action").notNull(),
    firstActionDate: date("first_action_date"),
    helpWanted: text("help_wanted"),
    collaborators: text("collaborators"),
    confirmedAt: instant("confirmed_at"),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "commitments_session_fk",
    }).onDelete("cascade"),
    participantFk: foreignKey({
      columns: [table.sessionId, table.participantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "commitments_participant_session_fk",
    }).onDelete("cascade"),
    submissionFk: foreignKey({
      columns: [table.sessionId, table.submissionId],
      foreignColumns: [dreamlineSubmissions.sessionId, dreamlineSubmissions.id],
      name: "commitments_submission_session_fk",
    }).onDelete("cascade"),
    ownerUnique: uniqueIndex("commitments_session_participant_uq").on(
      table.sessionId,
      table.participantId,
    ),
    confirmedIndex: index("commitments_session_confirmed_idx").on(
      table.sessionId,
      table.confirmedAt,
    ),
  }),
);

export const mutationReceipts = pgTable(
  "mutation_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    participantId: uuid("participant_id"),
    adminActor: text("admin_actor"),
    operation: text("operation").notNull(),
    idempotencyKeyHash: bytea("idempotency_key_hash").notNull(),
    resultType: text("result_type").notNull(),
    resultId: uuid("result_id"),
    expiresAt: instant("expires_at").notNull(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "mutation_receipts_session_fk",
    }).onDelete("cascade"),
    participantFk: foreignKey({
      columns: [table.sessionId, table.participantId],
      foreignColumns: [participants.sessionId, participants.id],
      name: "mutation_receipts_participant_session_fk",
    }).onDelete("cascade"),
    participantUnique: uniqueIndex("mutation_receipts_participant_scope_uq")
      .on(
        table.sessionId,
        table.participantId,
        table.operation,
        table.idempotencyKeyHash,
      )
      .where(sql`${table.participantId} is not null`),
    adminUnique: uniqueIndex("mutation_receipts_admin_scope_uq")
      .on(
        table.sessionId,
        table.adminActor,
        table.operation,
        table.idempotencyKeyHash,
      )
      .where(sql`${table.adminActor} is not null`),
    actorExactlyOne: check(
      "mutation_receipts_exactly_one_actor",
      sql`(${table.participantId} is not null and ${table.adminActor} is null) or (${table.participantId} is null and ${table.adminActor} is not null)`,
    ),
    expiryIndex: index("mutation_receipts_expiry_idx").on(table.expiresAt),
  }),
);

export const adminAuditEvents = pgTable(
  "admin_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    createdAt: instant("created_at").defaultNow().notNull(),
    sessionId: uuid("session_id").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id"),
    actor: text("actor").notNull(),
    requestId: text("request_id").notNull(),
    metadataRedacted: jsonb("metadata_redacted")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    occurredAt: instant("occurred_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionFk: foreignKey({
      columns: [table.sessionId],
      foreignColumns: [sessions.id],
      name: "admin_audit_events_session_fk",
    }).onDelete("cascade"),
    occurrenceIndex: index("admin_audit_events_session_occurred_idx").on(
      table.sessionId,
      table.occurredAt,
    ),
    targetIndex: index("admin_audit_events_session_target_idx").on(
      table.sessionId,
      table.targetType,
      table.targetId,
    ),
  }),
);

export type Session = typeof sessions.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type DreamlineDraft = typeof dreamlineDrafts.$inferSelect;
export type DreamlineSubmission = typeof dreamlineSubmissions.$inferSelect;
export type RecommendationImpression =
  typeof recommendationImpressions.$inferSelect;
export type DreamlineView = typeof dreamlineViews.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type CommentReport = typeof commentReports.$inferSelect;
export type ContactMethod = typeof contactMethods.$inferSelect;
export type ContactRequest = typeof contactRequests.$inferSelect;
export type ContactGrant = typeof contactGrants.$inferSelect;
export type Commitment = typeof commitments.$inferSelect;
export type MutationReceipt = typeof mutationReceipts.$inferSelect;
export type AdminAuditEvent = typeof adminAuditEvents.$inferSelect;

export const schema = {
  sessions,
  participants,
  dreamlineDrafts,
  dreamlineSubmissions,
  recommendationImpressions,
  dreamlineViews,
  comments,
  commentReports,
  contactMethods,
  contactRequests,
  contactGrants,
  commitments,
  mutationReceipts,
  adminAuditEvents,
};
