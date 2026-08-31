import "server-only";

import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db/client";
import { adminAuditEvents } from "../../../db/schema";
import {
  assertAdminSession,
  assertSessionScope,
} from "../authorization/context";
import { NotFoundError } from "../../domain/errors";
import type { AdminActor, AuditProjection } from "../../domain/types";
import { stripSensitiveMetadata } from "./helpers";

const projection = {
  id: adminAuditEvents.id,
  action: adminAuditEvents.action,
  targetType: adminAuditEvents.targetType,
  targetId: adminAuditEvents.targetId,
  actor: adminAuditEvents.actor,
  requestId: adminAuditEvents.requestId,
  metadataRedacted: adminAuditEvents.metadataRedacted,
  occurredAt: adminAuditEvents.occurredAt,
};

export type AuditInput = {
  action: string;
  targetType: string;
  targetId?: string | null;
  requestId: string;
  metadataRedacted?: Record<string, unknown>;
  occurredAt?: Date;
};

export async function writeAuditEvent(
  actor: AdminActor,
  sessionId: string,
  input: AuditInput,
): Promise<AuditProjection> {
  assertAdminSession(actor);
  assertSessionScope(actor, sessionId);
  const rows = await getDb()
    .insert(adminAuditEvents)
    .values({
      sessionId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      actor: actor.actor,
      requestId: input.requestId,
      metadataRedacted: stripSensitiveMetadata(input.metadataRedacted ?? {}),
      occurredAt: input.occurredAt,
    })
    .returning(projection);
  if (!rows[0]) throw new NotFoundError();
  return rows[0];
}

export async function listAuditEvents(
  actor: AdminActor,
  sessionId: string,
): Promise<AuditProjection[]> {
  assertAdminSession(actor);
  assertSessionScope(actor, sessionId);
  return getDb()
    .select(projection)
    .from(adminAuditEvents)
    .where(eq(adminAuditEvents.sessionId, sessionId))
    .orderBy(asc(adminAuditEvents.occurredAt));
}
