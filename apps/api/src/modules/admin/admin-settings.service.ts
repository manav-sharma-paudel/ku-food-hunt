import type {
  AdminOverviewDto,
  AdminReviewCountsDto,
  AuditLogDto,
  HeroSettingInput,
} from '@ku-food-hunt/shared';
import type { AuditLog, Prisma } from '@prisma/client';

import { writeAudit } from '../../lib/audit';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/error-handler';

const HERO_KEY = 'hero_content';

const asJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

function toAuditDto(row: AuditLog & { admin: { name: string } | null }): AuditLogDto {
  return {
    id: row.id,
    adminName: row.admin?.name ?? null,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getOverview(): Promise<AdminOverviewDto> {
  const [total, published, draft, pending, reviewGroups, featuredCount, audit] = await Promise.all([
    prisma.restaurant.count({ where: { deletedAt: null } }),
    prisma.restaurant.count({ where: { deletedAt: null, status: 'PUBLISHED' } }),
    prisma.restaurant.count({ where: { deletedAt: null, status: 'DRAFT' } }),
    prisma.restaurant.count({ where: { deletedAt: null, status: 'PENDING' } }),
    prisma.review.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } }),
    prisma.restaurant.count({ where: { deletedAt: null, isFeatured: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { admin: { select: { name: true } } },
    }),
  ]);

  const reviews: AdminReviewCountsDto = { PUBLISHED: 0, HIDDEN: 0, FLAGGED: 0 };
  for (const g of reviewGroups) reviews[g.status] = g._count._all;

  return {
    restaurants: { total, published, draft, pending },
    reviews,
    featuredCount,
    recentAudit: audit.map(toAuditDto),
  };
}

/** Replace the featured set: the given ids become featured in order; all others are cleared. */
export async function setFeatured(ids: string[], adminId: string): Promise<void> {
  // Check the ids up front. Feeding an unknown id straight to `update` throws a
  // raw Prisma error that surfaces as a bare 500, and featuring a draft or
  // archived listing puts a row in the homepage manager that the public
  // homepage will never render.
  if (ids.length) {
    const found = await prisma.restaurant.findMany({
      where: { id: { in: ids }, status: 'PUBLISHED', deletedAt: null },
      select: { id: true },
    });
    if (found.length !== ids.length) {
      const known = new Set(found.map((r) => r.id));
      const missing = ids.filter((id) => !known.has(id));
      throw new HttpError(
        400,
        'VALIDATION_ERROR',
        `Only published restaurants can be featured; ${missing.length} of the selected ${ids.length} are not.`,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.restaurant.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false, featuredRank: null },
    });
    for (const [index, id] of ids.entries()) {
      await tx.restaurant.update({
        where: { id },
        data: { isFeatured: true, featuredRank: index },
      });
    }
  });
  await writeAudit(adminId, 'settings.featured', 'settings', 'featured', asJson({ ids }));
}

export async function getHero(): Promise<HeroSettingInput | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: HERO_KEY } });
  return row ? (row.value as HeroSettingInput) : null;
}

export async function setHero(input: HeroSettingInput, adminId: string): Promise<HeroSettingInput> {
  await prisma.siteSetting.upsert({
    where: { key: HERO_KEY },
    update: { value: input },
    create: { key: HERO_KEY, value: input },
  });
  await writeAudit(adminId, 'settings.hero', 'settings', HERO_KEY);
  return input;
}

export async function listAuditLogs(): Promise<AuditLogDto[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { admin: { select: { name: true } } },
  });
  return rows.map(toAuditDto);
}
