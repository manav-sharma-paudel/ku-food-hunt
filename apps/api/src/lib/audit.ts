import { Prisma } from '@prisma/client';

import { prisma } from './prisma';

/**
 * Append an audit-log entry. Best-effort: a logging failure must never break the
 * mutation it records, so errors are swallowed (and surfaced in server logs by the
 * caller's own error path if needed).
 */
export async function writeAudit(
  adminId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  diff?: Prisma.InputJsonValue,
): Promise<void> {
  await prisma.auditLog
    .create({
      data: { adminId, action, entityType, entityId: entityId ?? null, diff },
    })
    .catch(() => {});
}
