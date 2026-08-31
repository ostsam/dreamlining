import "server-only";

import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../db/client";
import { mutationReceipts } from "../../../db/schema";
import { ConflictError, IdempotencyConflictError } from "../../domain/errors";
import type {
  AdminActor,
  MutationReceiptProjection,
  ParticipantActor,
} from "../../domain/types";
import { hashIdempotencyKey } from "./helpers";

const projection = {
  id: mutationReceipts.id,
  operation: mutationReceipts.operation,
  resultType: mutationReceipts.resultType,
  resultId: mutationReceipts.resultId,
  expiresAt: mutationReceipts.expiresAt,
};

export type ReceiptActor = ParticipantActor | AdminActor;

export async function findReceipt(
  actor: ReceiptActor,
  operation: string,
  idempotencyKey: string,
  now = new Date(),
): Promise<MutationReceiptProjection | null> {
  const keyHash = hashIdempotencyKey(idempotencyKey);
  const rows = await getDb()
    .select(projection)
    .from(mutationReceipts)
    .where(
      and(
        eq(mutationReceipts.sessionId, actor.sessionId),
        eq(mutationReceipts.idempotencyKeyHash, keyHash),
        gt(mutationReceipts.expiresAt, now),
        actor.kind === "participant"
          ? eq(mutationReceipts.participantId, actor.participantId)
          : eq(mutationReceipts.adminActor, actor.actor),
      ),
    )
    .limit(1);
  if (rows[0] && rows[0].operation !== operation) {
    throw new IdempotencyConflictError();
  }
  return rows[0] ?? null;
}

export type ReceiptResult = {
  resultType: string;
  resultId?: string;
  expiresAt: Date;
};

/** Record the receipt after the effect has committed inside the caller's transaction. */
export async function recordReceipt(
  actor: ReceiptActor,
  operation: string,
  idempotencyKey: string,
  result: ReceiptResult,
): Promise<MutationReceiptProjection> {
  const keyHash = hashIdempotencyKey(idempotencyKey);
  const values = {
    sessionId: actor.sessionId,
    operation,
    idempotencyKeyHash: keyHash,
    resultType: result.resultType,
    resultId: result.resultId,
    expiresAt: result.expiresAt,
    ...(actor.kind === "participant"
      ? { participantId: actor.participantId }
      : { adminActor: actor.actor }),
  };
  const rows = await getDb()
    .insert(mutationReceipts)
    .values(values)
    .returning(projection);
  if (!rows[0])
    throw new ConflictError("Mutation receipt could not be recorded");
  return rows[0];
}

export async function runIdempotent<T>(
  actor: ReceiptActor,
  operation: string,
  idempotencyKey: string,
  effect: () => Promise<{ value: T; resultType: string; resultId?: string }>,
  readExisting: (receipt: MutationReceiptProjection) => Promise<T>,
  expiresAt = new Date(Date.now() + 86_400_000),
): Promise<T> {
  const prior = await findReceipt(actor, operation, idempotencyKey);
  if (prior) return readExisting(prior);
  const result = await effect();
  try {
    await recordReceipt(actor, operation, idempotencyKey, {
      ...result,
      expiresAt,
    });
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
      const retry = await findReceipt(actor, operation, idempotencyKey);
      if (retry) return readExisting(retry);
      throw new IdempotencyConflictError();
    }
    throw error;
  }
  return result.value;
}
