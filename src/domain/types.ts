export type SessionPhase =
  "lobby" | "drafting" | "feedback" | "commitment" | "closed";
export type ParticipantState = "active" | "abandoned" | "left";
export type ViewSource = "manual" | "recommendation";
export type CommentKind = "root" | "reply";
export type CommentVisibility = "public" | "private";
export type ReportStatus = "open" | "reviewed" | "resolved" | "dismissed";
export type ReportAction = "none" | "disclosed" | "hidden";
export type ContactMethodType = "email" | "phone" | "other";
export type ContactRequestStatus =
  "pending" | "approved" | "denied" | "revoked";

export type PhaseConfig = {
  durationMinutes?: number;
  instructions?: string;
  [key: string]: unknown;
};

export type DreamlineSnapshot = {
  havingEntries: string[];
  beingEntries: string[];
  doingEntries: string[];
  blockers?: string;
};

/** Ciphertext only: plaintext contact values are intentionally not modeled here. */
export type EncryptedContactEnvelope = {
  version: 1;
  algorithm: "aes-256-gcm";
  ivB64: string;
  ciphertextB64: string;
  authTagB64: string;
};

export type ParticipantActor = {
  kind: "participant";
  sessionId: string;
  participantId: string;
};

export type AdminActor = {
  kind: "admin";
  sessionId: string;
  actor: string;
};

export type SessionActor = ParticipantActor | AdminActor;

export type ParticipantCommand = ParticipantActor;
export type AdminCommand = AdminActor;

export type SessionProjection = {
  id: string;
  createdAt: Date;
  title: string;
  phase: SessionPhase;
  phaseStartedAt: Date | null;
  phaseEndsAt: Date | null;
  pausedAt: Date | null;
  closedAt: Date | null;
};

export type AdminSessionProjection = SessionProjection & {
  phaseConfig: PhaseConfig;
  retentionDays: number;
};

export type ParticipantPeerProjection = {
  id: string;
  displayName: string;
};

export type ParticipantOwnerProjection = ParticipantPeerProjection & {
  state: ParticipantState;
  joinedAt: Date;
  lastSeenAt: Date;
  leftAt: Date | null;
};

export type DraftProjection = {
  id: string;
  participantId: string;
  havingEntries: string[];
  beingEntries: string[];
  doingEntries: string[];
  blockers: string | null;
  revision: number;
  savedAt: Date;
};

export type SubmissionProjection = {
  id: string;
  participantId: string;
  snapshot: DreamlineSnapshot;
  submittedAt: Date;
};

export type CommentProjection = {
  id: string;
  submissionId: string;
  authorParticipantId: string;
  parentCommentId: string | null;
  kind: CommentKind;
  body: string;
  visibility: CommentVisibility;
  createdAt: Date;
  updatedAt: Date;
};

export type CommentReportProjection = {
  id: string;
  commentId: string;
  reporterParticipantId: string;
  reason: string;
  disclosedAt: Date | null;
  status: ReportStatus;
  action: ReportAction;
  actionAt: Date | null;
};

export type ContactMethodMetadataProjection = {
  id: string;
  participantId: string;
  type: ContactMethodType;
  label: string;
  revokedAt: Date | null;
};

export type ContactRequestProjection = {
  id: string;
  ownerParticipantId: string;
  requesterParticipantId: string;
  context: string;
  reason: string;
  status: ContactRequestStatus;
  decidedAt: Date | null;
};

export type ContactGrantProjection = {
  id: string;
  requestId: string;
  ownerParticipantId: string;
  requesterParticipantId: string;
  methodId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  revealedAt: Date | null;
};

export type CommitmentProjection = {
  id: string;
  participantId: string;
  submissionId: string;
  outcome: string;
  firstAction: string;
  firstActionDate: string | null;
  helpWanted: string | null;
  collaborators: string | null;
  confirmedAt: Date | null;
};

export type ImpressionAggregateInput = {
  submissionId: string;
  algorithmVersion: string;
  servedAt: Date;
  dedupeBucket: Date;
};

export type ViewProjection = {
  id: string;
  submissionId: string;
  source: ViewSource;
  viewedAt: Date;
  commentedAt: Date | null;
};

export type MutationReceiptProjection = {
  id: string;
  operation: string;
  resultType: string;
  resultId: string | null;
  expiresAt: Date;
};

export type AuditProjection = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  actor: string;
  requestId: string;
  metadataRedacted: Record<string, unknown>;
  occurredAt: Date;
};

export type DraftInput = Pick<
  DraftProjection,
  "havingEntries" | "beingEntries" | "doingEntries" | "blockers"
> & { revision?: number };

export type SubmissionInput = { snapshot: DreamlineSnapshot };
export type CommentInput = {
  submissionId: string;
  parentCommentId?: string | null;
  kind: CommentKind;
  body: string;
  visibility: CommentVisibility;
};

export type ContactMethodInput = {
  type: ContactMethodType;
  label: string;
  ciphertextEnvelope: EncryptedContactEnvelope;
};

export type ContactRequestInput = {
  ownerParticipantId: string;
  context: string;
  reason: string;
};

export type CommitmentInput = Omit<
  CommitmentProjection,
  "id" | "participantId"
>;
