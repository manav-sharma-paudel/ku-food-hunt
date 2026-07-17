import type {
  AdminReviewCountsDto,
  AdminReviewDto,
  Paginated,
  ReviewModerationQuery,
  ReviewStatusValue,
} from '@ku-food-hunt/shared';

import { writeAudit } from '../../lib/audit';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/error-handler';
import { recomputeRestaurantRating } from '../reviews/reviews.service';

function emptyCounts(): AdminReviewCountsDto {
  return { PUBLISHED: 0, HIDDEN: 0, FLAGGED: 0 };
}

export async function listReviewsForModeration(
  query: ReviewModerationQuery,
): Promise<Paginated<AdminReviewDto> & { counts: AdminReviewCountsDto }> {
  const where = { deletedAt: null, ...(query.status && { status: query.status }) };

  const [rows, total, grouped] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      include: {
        restaurant: { select: { slug: true, name: true } },
        _count: { select: { images: true } },
      },
    }),
    prisma.review.count({ where }),
    prisma.review.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { _all: true } }),
  ]);

  const counts = emptyCounts();
  for (const g of grouped) counts[g.status] = g._count._all;

  return {
    data: rows.map((r) => ({
      id: r.id,
      restaurantSlug: r.restaurant.slug,
      restaurantName: r.restaurant.name,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      status: r.status,
      helpfulCount: r.helpfulCount,
      imageCount: r._count.images,
      createdAt: r.createdAt.toISOString(),
    })),
    counts,
    meta: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    },
  };
}

export async function moderateReview(
  id: string,
  status: ReviewStatusValue,
  adminId: string,
): Promise<void> {
  const review = await prisma.review.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, restaurantId: true },
  });
  if (!review) throw new HttpError(404, 'NOT_FOUND', 'Review not found');

  await prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id }, data: { status } });
    // Only PUBLISHED reviews count toward a restaurant's rating.
    await recomputeRestaurantRating(tx, review.restaurantId);
  });
  await writeAudit(adminId, `review.${status.toLowerCase()}`, 'review', id);
}

export async function deleteReview(id: string, adminId: string): Promise<void> {
  const review = await prisma.review.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, restaurantId: true },
  });
  if (!review) throw new HttpError(404, 'NOT_FOUND', 'Review not found');

  await prisma.$transaction(async (tx) => {
    await tx.review.update({ where: { id }, data: { deletedAt: new Date(), status: 'HIDDEN' } });
    await recomputeRestaurantRating(tx, review.restaurantId);
  });
  await writeAudit(adminId, 'review.delete', 'review', id);
}
