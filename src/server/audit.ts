import "server-only";

import { db } from "@/lib/db";

/**
 * Audit trail for administrative writes.
 *
 * Every mutating admin action records who did what to which entity. Failures to
 * write the log never fail the action itself — losing an order because the audit
 * table hiccuped would be worse than a gap in the log.
 */
export async function recordAudit(input: {
  /** Null for anonymous events such as a failed sign-in attempt. */
  actor: { id: string; email: string } | null;
  action: string;
  entity: string;
  entityId?: string | null;
  summary?: string | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        adminUserId: input.actor?.id ?? null,
        actorEmail: input.actor?.email ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        summary: input.summary ?? null,
      },
    });
  } catch {
    // Intentionally swallowed; see above.
  }
}

export async function listAuditLog(limit = 50) {
  return db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

/** History for one entity, shown alongside the record it describes. */
export async function listAuditFor(entity: string, entityId: string, limit = 20) {
  return db.auditLog.findMany({
    where: { entity, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
