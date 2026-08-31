import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { and, eq, isNull, or } from "drizzle-orm";
import { getDb } from "../../../db/client";
import { participants } from "../../../db/schema";
import { ForbiddenError, NotFoundError } from "../../domain/errors";
import type {
  AdminActor,
  ParticipantActor,
  SessionActor,
} from "../../domain/types";

export type Db = ReturnType<typeof getDb>;
export type Transaction = Parameters<Db["transaction"]>[0] extends (
  tx: infer T,
) => unknown
  ? T
  : never;

export async function withTransaction<T>(
  work: (tx: Db) => Promise<T>,
): Promise<T> {
  return getDb().transaction((tx) => work(tx as unknown as Db));
}

export function hashIdempotencyKey(value: string): Buffer {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new Error("Idempotency key must be a UUID");
  }
  return createHash("sha256").update(value, "utf8").digest();
}

export function newUuid(): string {
  return randomUUID();
}

export async function requireParticipantMember(
  db: Db,
  actor: ParticipantActor,
): Promise<void> {
  const rows = await db
    .select({ id: participants.id })
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, actor.sessionId),
        eq(participants.id, actor.participantId),
      ),
    )
    .limit(1);
  if (rows.length === 0) throw new NotFoundError();
}

export function requireAdmin(actor: SessionActor): asserts actor is AdminActor {
  if (actor.kind !== "admin" || !actor.actor) throw new ForbiddenError();
}

export function requireParticipant(
  actor: SessionActor,
): asserts actor is ParticipantActor {
  if (actor.kind !== "participant") throw new ForbiddenError();
}

export function publicOrOwnedCommentPredicate(
  visibilityColumn: Parameters<typeof eq>[0],
  authorColumn: Parameters<typeof eq>[0],
  participantId: string,
) {
  return or(
    eq(visibilityColumn as never, "public"),
    and(
      eq(visibilityColumn as never, "private"),
      eq(authorColumn as never, participantId),
    ),
  );
}

export function cloneDate(value: Date | null): Date | null {
  return value ? new Date(value) : null;
}

export function cloneStrings(value: string[]): string[] {
  return [...value];
}

export function stripSensitiveMetadata(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const forbidden = new Set([
    "body",
    "token",
    "tokenHash",
    "token_hash",
    "contact",
    "ciphertext",
    "ciphertextEnvelope",
    "ciphertext_envelope",
    "privateText",
    "private_text",
    "idempotencyKey",
    "idempotency_key",
    "idempotencyKeyHash",
    "idempotency_key_hash",
  ]);
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (!forbidden.has(key)) result[key] = item;
  }
  return result;
}

export const nullOnly = isNull;
