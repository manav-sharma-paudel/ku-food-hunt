import type { CreateReviewInput, ReviewDto } from '@ku-food-hunt/shared';
import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/error-handler';

interface RequestMeta {
  ipHash: string;
  userAgentHash: string;
}

/** Round to one decimal so the stored aggregate matches what the UI renders. */
const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Recompute a restaurant's cached `avgRating`/`reviewCount` from its currently
 * PUBLISHED reviews. Shared by review creation and moderation (hiding or deleting
 * a review must move the aggregates too). Runs inside the caller's transaction.
 */
export async function recomputeRestaurantRating(
  tx: Prisma.TransactionClient,
  restaurantId: string,
): Promise<void> {
  // Serialize concurrent recomputes for the same restaurant. Without this row
  // lock, two overlapping review writes can each aggregate a stale snapshot and
  // overwrite each other, desyncing avgRating/reviewCount. Callers run in a tx.
  await tx.$executeRaw`SELECT id FROM "Restaurant" WHERE id = ${restaurantId} FOR UPDATE`;
  const agg = await tx.review.aggregate({
    where: { restaurantId, status: 'PUBLISHED', deletedAt: null },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.restaurant.update({
    where: { id: restaurantId },
    data: { avgRating: round1(agg._avg.rating ?? 0), reviewCount: agg._count._all },
  });
}

/**
 * Persist an anonymous review and refresh the restaurant's cached rating
 * aggregates in the same transaction, so the detail page reflects the new
 * review the moment its query is refetched.
 */
export async function createReview(
  slug: string,
  input: CreateReviewInput,
  meta: RequestMeta,
): Promise<ReviewDto> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, status: 'PUBLISHED', deletedAt: null },
    select: { id: true },
  });
  if (!restaurant) throw new HttpError(404, 'NOT_FOUND', 'Restaurant not found');

  const created = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        restaurantId: restaurant.id,
        authorName: input.authorName ?? null,
        rating: input.rating,
        body: input.body,
        ipHash: meta.ipHash,
        userAgentHash: meta.userAgentHash,
        images: input.imageUrls?.length
          ? { create: input.imageUrls.map((url, sortOrder) => ({ url, sortOrder })) }
          : undefined,
      },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    });

    await recomputeRestaurantRating(tx, restaurant.id);
    return review;
  });

  return {
    id: created.id,
    authorName: created.authorName,
    rating: created.rating,
    body: created.body,
    helpfulCount: created.helpfulCount,
    createdAt: created.createdAt.toISOString(),
    images: created.images.map((i) => ({ id: i.id, url: i.url })),
  };
}

/**
 * Toggle an anonymous "helpful" vote. One vote per fingerprint per review is
 * enforced by the DB unique constraint; the stored count is kept in step inside
 * the same transaction.
 */
export async function toggleHelpful(
  reviewId: string,
  voterHash: string,
): Promise<{ helpfulCount: number; voted: boolean }> {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, status: 'PUBLISHED', deletedAt: null },
    select: { id: true },
  });
  if (!review) throw new HttpError(404, 'NOT_FOUND', 'Review not found');

  return prisma.$transaction(async (tx) => {
    // Toggle off: if a vote already existed, remove it and drop the count.
    const removed = await tx.reviewVote.deleteMany({ where: { reviewId, voterHash } });
    if (removed.count > 0) {
      const updated = await tx.review.update({
        where: { id: reviewId },
        // Guard against ever dropping below zero from any historical drift.
        data: { helpfulCount: { decrement: 1 } },
        select: { helpfulCount: true },
      });
      return { helpfulCount: Math.max(0, updated.helpfulCount), voted: false };
    }

    // Toggle on: insert idempotently. skipDuplicates turns a concurrent
    // double-submit (previously a P2002 → HTTP 500) into a harmless no-op.
    const inserted = await tx.reviewVote.createMany({
      data: [{ reviewId, voterHash }],
      skipDuplicates: true,
    });
    if (inserted.count === 0) {
      // A concurrent request already recorded this exact vote — stay idempotent
      // and report the current count rather than double-incrementing.
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        select: { helpfulCount: true },
      });
      return { helpfulCount: Math.max(0, review?.helpfulCount ?? 0), voted: true };
    }
    const updated = await tx.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
      select: { helpfulCount: true },
    });
    return { helpfulCount: updated.helpfulCount, voted: true };
  });
}
