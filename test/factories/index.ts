export type Clock = { now: () => Date };

export function createSeededRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

export function createFixedClock(instant = "2026-01-01T00:00:00.000Z"): Clock {
  const timestamp = new Date(instant);
  if (Number.isNaN(timestamp.valueOf()))
    throw new Error("Invalid fixed clock instant");
  return { now: () => new Date(timestamp) };
}

export function createIdFactory(prefix = "id") {
  let counter = 0;
  return () => `${prefix}_${String(++counter).padStart(4, "0")}`;
}

export function createUuidFactory() {
  const nextId = createIdFactory("00000000-0000-4000-8000");
  return () => `${nextId()}-000000000000`;
}

export function boundedSequence<T>(
  values: readonly T[],
  limit = values.length,
): T[] {
  if (!Number.isInteger(limit) || limit < 0 || limit > values.length)
    throw new Error("Sequence limit is out of bounds");
  return values.slice(0, limit);
}

export function buildObject<T extends Record<string, unknown>>(
  defaults: T,
  overrides: Partial<T> = {},
): T {
  return { ...defaults, ...overrides };
}

export type DomainFactoryDeps = {
  clock?: Clock;
  id?: () => string;
  random?: () => number;
};

export type DomainFixture = ReturnType<typeof buildDomainFixture>;

/**
 * A complete, deterministic fixture for authorization and projection tests.
 * The envelope below is deliberately fake ciphertext; no contact value or
 * bearer credential is present in this fixture.
 */
export function buildDomainFixture(deps: DomainFactoryDeps = {}) {
  const clock = deps.clock ?? createFixedClock();
  const next = deps.id ?? createUuidFactory();
  const now = () => clock.now();
  const id = () => next();
  const sessionA = id();
  const sessionB = id();
  const owner = id();
  const requester = id();
  const viewer = id();
  const otherViewer = id();
  const submission = id();
  const otherSubmission = id();
  const root = id();
  const privateReply = id();
  const report = id();
  const emailMethod = id();
  const phoneMethod = id();
  const pendingRequest = id();
  const approvedRequest = id();
  const deniedRequest = id();
  const pendingGrant = id();
  const approvedGrant = id();
  const deniedGrant = id();

  const envelope = {
    version: 1 as const,
    algorithm: "aes-256-gcm" as const,
    ivB64: "AAAAAAAAAAAAAAAA",
    ciphertextB64: "ZmFrZQ",
    authTagB64: "AAAAAAAAAAAAAAAAAAAAAA",
  };
  const snapshot = {
    havingEntries: ["A quiet home"],
    beingEntries: ["A patient climber"],
    doingEntries: ["Host a dinner"],
    blockers: "Time feels scarce",
  };
  const session = (idValue: string) => ({
    id: idValue,
    createdAt: now(),
    publicJoinTokenHash: `join-${idValue}`,
    title: "Dreamline circle",
    phase: "feedback" as const,
    phaseStartedAt: now(),
    phaseEndsAt: null,
    phaseConfig: {},
    pausedAt: null,
    retentionDays: 30,
    closedAt: null,
  });
  return {
    sessions: [session(sessionA), session(sessionB)],
    participants: [
      {
        id: owner,
        sessionId: sessionA,
        displayName: "Owner",
        tokenHash: Buffer.alloc(32, 1),
        state: "active" as const,
        joinedAt: now(),
        lastSeenAt: now(),
        leftAt: null,
      },
      {
        id: requester,
        sessionId: sessionA,
        displayName: "Requester",
        tokenHash: Buffer.alloc(32, 2),
        state: "active" as const,
        joinedAt: now(),
        lastSeenAt: now(),
        leftAt: null,
      },
      {
        id: viewer,
        sessionId: sessionA,
        displayName: "Viewer",
        tokenHash: Buffer.alloc(32, 3),
        state: "active" as const,
        joinedAt: now(),
        lastSeenAt: now(),
        leftAt: null,
      },
      {
        id: otherViewer,
        sessionId: sessionB,
        displayName: "Other viewer",
        tokenHash: Buffer.alloc(32, 4),
        state: "active" as const,
        joinedAt: now(),
        lastSeenAt: now(),
        leftAt: null,
      },
    ],
    drafts: [
      {
        id: id(),
        sessionId: sessionA,
        participantId: owner,
        havingEntries: snapshot.havingEntries,
        beingEntries: snapshot.beingEntries,
        doingEntries: snapshot.doingEntries,
        blockers: snapshot.blockers,
        revision: 1,
        savedAt: now(),
      },
    ],
    submissions: [
      {
        id: submission,
        sessionId: sessionA,
        participantId: owner,
        immutableSnapshot: snapshot,
        submittedAt: now(),
      },
      {
        id: otherSubmission,
        sessionId: sessionB,
        participantId: otherViewer,
        immutableSnapshot: snapshot,
        submittedAt: now(),
      },
    ],
    impressions: [
      {
        id: id(),
        sessionId: sessionA,
        viewerParticipantId: viewer,
        submissionId: submission,
        algorithmVersion: "router-v1",
        servedAt: now(),
        dedupeBucket: now(),
      },
    ],
    views: [
      {
        id: id(),
        sessionId: sessionA,
        viewerParticipantId: viewer,
        submissionId: submission,
        source: "recommendation" as const,
        viewedAt: now(),
        commentedAt: null,
      },
    ],
    comments: [
      {
        id: root,
        sessionId: sessionA,
        submissionId: submission,
        authorParticipantId: requester,
        parentCommentId: null,
        kind: "root" as const,
        body: "A useful thought",
        visibility: "public" as const,
        createdAt: now(),
        updatedAt: now(),
      },
      {
        id: privateReply,
        sessionId: sessionA,
        submissionId: submission,
        authorParticipantId: owner,
        parentCommentId: root,
        kind: "reply" as const,
        body: "A private note",
        visibility: "private" as const,
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    reports: [
      {
        id: report,
        sessionId: sessionA,
        commentId: privateReply,
        reporterParticipantId: owner,
        reason: "Please review",
        disclosedAt: null,
        status: "open" as const,
        action: "none" as const,
        actionAt: null,
      },
    ],
    contactMethods: [
      {
        id: emailMethod,
        sessionId: sessionA,
        participantId: owner,
        type: "email" as const,
        label: "Email",
        ciphertextEnvelope: envelope,
        revokedAt: null,
      },
      {
        id: phoneMethod,
        sessionId: sessionA,
        participantId: owner,
        type: "phone" as const,
        label: "Phone",
        ciphertextEnvelope: envelope,
        revokedAt: null,
      },
    ],
    contactRequests: [
      {
        id: pendingRequest,
        sessionId: sessionA,
        ownerParticipantId: owner,
        requesterParticipantId: requester,
        context: "Collaborate",
        reason: "Keep in touch",
        status: "pending" as const,
        decidedAt: null,
      },
      {
        id: approvedRequest,
        sessionId: sessionA,
        ownerParticipantId: owner,
        requesterParticipantId: viewer,
        context: "Shared project",
        reason: "Continue the idea",
        status: "approved" as const,
        decidedAt: now(),
      },
      {
        id: deniedRequest,
        sessionId: sessionA,
        ownerParticipantId: owner,
        requesterParticipantId: viewer,
        context: "Another project",
        reason: "Follow up",
        status: "denied" as const,
        decidedAt: now(),
      },
    ],
    contactGrants: [
      {
        id: pendingGrant,
        sessionId: sessionA,
        requestId: pendingRequest,
        ownerParticipantId: owner,
        requesterParticipantId: requester,
        methodId: emailMethod,
        expiresAt: new Date(now().valueOf() + 86_400_000),
        revokedAt: null,
        revealedAt: null,
      },
      {
        id: approvedGrant,
        sessionId: sessionA,
        requestId: approvedRequest,
        ownerParticipantId: owner,
        requesterParticipantId: viewer,
        methodId: phoneMethod,
        expiresAt: new Date(now().valueOf() + 86_400_000),
        revokedAt: null,
        revealedAt: null,
      },
      {
        id: deniedGrant,
        sessionId: sessionA,
        requestId: deniedRequest,
        ownerParticipantId: owner,
        requesterParticipantId: viewer,
        methodId: emailMethod,
        expiresAt: new Date(now().valueOf() + 86_400_000),
        revokedAt: null,
        revealedAt: null,
      },
    ],
    commitments: [
      {
        id: id(),
        sessionId: sessionA,
        participantId: owner,
        submissionId: submission,
        outcome: "Make it real",
        firstAction: "Block an hour",
        firstActionDate: "2026-01-04",
        helpWanted: "An accountability buddy",
        collaborators: "Requester",
        confirmedAt: now(),
      },
    ],
    receipts: [
      {
        id: id(),
        sessionId: sessionA,
        participantId: owner,
        adminActor: null,
        operation: "submit",
        idempotencyKeyHash: Buffer.alloc(32, 9),
        resultType: "submission",
        resultId: submission,
        expiresAt: new Date(now().valueOf() + 86_400_000),
      },
    ],
    audit: [
      {
        id: id(),
        sessionId: sessionA,
        action: "report.reviewed",
        targetType: "comment",
        targetId: privateReply,
        actor: "admin",
        requestId: "request-1",
        metadataRedacted: { status: "reviewed" },
        occurredAt: now(),
      },
    ],
  };
}

export function createDomainFactory(deps: DomainFactoryDeps = {}) {
  const random = deps.random ?? createSeededRandom(1);
  return {
    random,
    build: () => buildDomainFixture(deps),
  };
}
