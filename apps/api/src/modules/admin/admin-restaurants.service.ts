import {
  canApproveSubmission,
  canRejectSubmission,
  canSetRestaurantStatus,
  derivePriceBand,
  restaurantStatusDeniedReason,
  slugify,
  type AdminRestaurantDto,
  type AdminRestaurantListItemDto,
  type AdminRestaurantListQuery,
  type AdminRoleValue,
  type HoursUpsertInput,
  type ImageCreateInput,
  type ImageUpdateInput,
  type MenuUpsertInput,
  type RestaurantCreateInput,
  type RestaurantStatusValue,
  type RestaurantUpdateInput,
} from '@ku-food-hunt/shared';
import { randomBytes } from 'node:crypto';

import { Prisma } from '@prisma/client';

import { writeAudit } from '../../lib/audit';
import { sha256Hex } from '../../lib/hash';
import { prisma } from '../../lib/prisma';
import { deleteStoredPhoto } from '../../lib/uploads';
import { HttpError } from '../../middleware/error-handler';
import { sendSubmissionApproved, sendSubmissionRejected } from '../partners/partner-emails';

const fullInclude = Prisma.validator<Prisma.RestaurantInclude>()({
  categories: { include: { category: true } },
  images: { orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] },
  openingHours: { orderBy: [{ dayOfWeek: 'asc' }, { opensAt: 'asc' }] },
  menuCategories: {
    orderBy: { sortOrder: 'asc' },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  },
});
type FullRow = Prisma.RestaurantGetPayload<{ include: typeof fullInclude }>;

const asJson = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

function toAdminRestaurant(row: FullRow): AdminRestaurantDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    address: row.address,
    phone: row.phone,
    googlePlaceId: row.googlePlaceId,
    latitude: row.latitude,
    longitude: row.longitude,
    priceBand: row.priceBand,
    priceMinNpr: row.priceMinNpr,
    priceMaxNpr: row.priceMaxNpr,
    hasQrPayment: row.hasQrPayment,
    hasDelivery: row.hasDelivery,
    hasVegOptions: row.hasVegOptions,
    isFeatured: row.isFeatured,
    status: row.status,
    categorySlugs: row.categories.map((c) => c.category.slug),
    avgRating: row.avgRating,
    reviewCount: row.reviewCount,
    images: row.images.map((i) => ({
      id: i.id,
      url: i.url,
      type: i.type,
      alt: i.alt || null,
      sortOrder: i.sortOrder,
    })),
    hours: row.openingHours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
      note: h.note,
    })),
    menu: row.menuCategories.map((mc) => ({
      name: mc.name,
      items: mc.items.map((it) => ({
        name: it.name,
        description: it.description,
        priceNpr: it.priceNpr,
        isAvailable: it.isAvailable,
        isPopular: it.isPopular,
        isVegetarian: it.isVegetarian,
      })),
    })),
    legalName: row.legalName,
    websiteUrl: row.websiteUrl,
    submitterName: row.submitterName,
    submitterEmail: row.submitterEmail,
    submitterPhone: row.submitterPhone,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    rejectionReason: row.rejectionReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ensureExists(id: string): Promise<void> {
  const row = await prisma.restaurant.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, 'NOT_FOUND', 'Restaurant not found');
}

/**
 * Role gate for every status transition, in both directions: an EDITOR can move
 * a listing between DRAFT/PENDING/REJECTED, but publishing, archiving, and
 * unpublishing a live listing are all SUPERADMIN-only. (Approving a submission
 * publishes it, so that route is gated separately with requireRole.)
 *
 * The rule itself lives in the shared package so the admin UI greys out exactly
 * the options this would reject — see canSetRestaurantStatus.
 */
function assertMaySetStatus(
  role: AdminRoleValue,
  next: RestaurantStatusValue,
  current?: RestaurantStatusValue,
): void {
  if (!canSetRestaurantStatus(role, next, current)) {
    throw new HttpError(403, 'FORBIDDEN', restaurantStatusDeniedReason(next, current));
  }
}

export async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base) || 'restaurant';
  let candidate = root;
  for (let n = 2; ; n++) {
    const existing = await prisma.restaurant.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${n}`;
  }
}

export async function resolveCategoryIds(slugs: string[]): Promise<string[]> {
  if (!slugs.length) return [];
  const cats = await prisma.category.findMany({
    where: { slug: { in: slugs } },
    select: { id: true },
  });
  return cats.map((c) => c.id);
}

/** Only one image can be the cover; setting a new one demotes the rest to gallery. */
async function demoteOtherCovers(restaurantId: string, keepId: string): Promise<void> {
  await prisma.restaurantImage.updateMany({
    where: { restaurantId, type: 'COVER', id: { not: keepId } },
    data: { type: 'GALLERY' },
  });
}

export async function getAdminRestaurant(id: string): Promise<AdminRestaurantDto> {
  const row = await prisma.restaurant.findFirst({
    where: { id, deletedAt: null },
    include: fullInclude,
  });
  if (!row) throw new HttpError(404, 'NOT_FOUND', 'Restaurant not found');
  return toAdminRestaurant(row);
}

export async function listAdminRestaurants(
  query: AdminRestaurantListQuery,
): Promise<AdminRestaurantListItemDto[]> {
  const rows = await prisma.restaurant.findMany({
    where: {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.q && { name: { contains: query.q, mode: 'insensitive' } }),
    },
    orderBy: [{ updatedAt: 'desc' }],
    include: {
      categories: { include: { category: true } },
      images: { where: { type: 'COVER' }, take: 1 },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    priceBand: row.priceBand,
    avgRating: row.avgRating,
    reviewCount: row.reviewCount,
    categoryNames: row.categories.map((c) => c.category.name),
    isFeatured: row.isFeatured,
    featuredRank: row.featuredRank,
    coverImageUrl: row.images[0]?.url ?? null,
    updatedAt: row.updatedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    submitterName: row.submitterName,
    submitterEmail: row.submitterEmail,
  }));
}

export async function createRestaurant(
  input: RestaurantCreateInput,
  adminId: string,
  actorRole: AdminRoleValue,
): Promise<AdminRestaurantDto> {
  assertMaySetStatus(actorRole, input.status);
  const slug = await ensureUniqueSlug(input.slug ?? input.name);
  const categoryIds = await resolveCategoryIds(input.categorySlugs);

  const row = await prisma.restaurant.create({
    data: {
      slug,
      name: input.name,
      legalName: input.legalName ?? null,
      description: input.description ?? '',
      address: input.address,
      phone: input.phone ?? null,
      websiteUrl: input.websiteUrl ?? null,
      googlePlaceId: input.googlePlaceId ?? null,
      latitude: input.latitude,
      longitude: input.longitude,
      priceBand:
        input.priceBand ??
        derivePriceBand(input.priceMinNpr ?? null, input.priceMaxNpr ?? null) ??
        'STANDARD',
      priceMinNpr: input.priceMinNpr ?? null,
      priceMaxNpr: input.priceMaxNpr ?? null,
      hasQrPayment: input.hasQrPayment,
      hasDelivery: input.hasDelivery,
      hasVegOptions: input.hasVegOptions,
      isFeatured: input.isFeatured,
      status: input.status,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
    include: fullInclude,
  });

  await writeAudit(
    adminId,
    'restaurant.create',
    'restaurant',
    row.id,
    asJson({ slug, name: input.name }),
  );
  return toAdminRestaurant(row);
}

export async function updateRestaurant(
  id: string,
  input: RestaurantUpdateInput,
  adminId: string,
  actorRole: AdminRoleValue,
): Promise<AdminRestaurantDto> {
  const current = await prisma.restaurant.findFirst({
    where: { id, deletedAt: null },
    select: { status: true, priceBand: true, priceMinNpr: true, priceMaxNpr: true },
  });
  if (!current) throw new HttpError(404, 'NOT_FOUND', 'Restaurant not found');
  // Editing an already-live listing without touching its status is normal
  // moderation work; changing the status is role-gated in both directions.
  if (input.status !== undefined) assertMaySetStatus(actorRole, input.status, current.status);

  const data: Prisma.RestaurantUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = await ensureUniqueSlug(input.slug, id);
  if (input.legalName !== undefined) data.legalName = input.legalName ?? null;
  if (input.websiteUrl !== undefined) data.websiteUrl = input.websiteUrl ?? null;
  if (input.description !== undefined) data.description = input.description ?? '';
  if (input.address !== undefined) data.address = input.address;
  if (input.phone !== undefined) data.phone = input.phone ?? null;
  if (input.googlePlaceId !== undefined) data.googlePlaceId = input.googlePlaceId ?? null;
  if (input.latitude !== undefined) data.latitude = input.latitude;
  if (input.longitude !== undefined) data.longitude = input.longitude;
  if (input.priceMinNpr !== undefined) data.priceMinNpr = input.priceMinNpr ?? null;
  if (input.priceMaxNpr !== undefined) data.priceMaxNpr = input.priceMaxNpr ?? null;
  // The band is derived from the Rs. range the admin edits. Recompute it whenever
  // a price field changes; an explicit priceBand (e.g. from an API caller) still
  // wins, and unrelated edits leave the stored band untouched.
  if (input.priceBand !== undefined) {
    data.priceBand = input.priceBand;
  } else if (input.priceMinNpr !== undefined || input.priceMaxNpr !== undefined) {
    const effMin = input.priceMinNpr !== undefined ? input.priceMinNpr : current.priceMinNpr;
    const effMax = input.priceMaxNpr !== undefined ? input.priceMaxNpr : current.priceMaxNpr;
    data.priceBand = derivePriceBand(effMin, effMax) ?? current.priceBand;
  }
  if (input.hasQrPayment !== undefined) data.hasQrPayment = input.hasQrPayment;
  if (input.hasDelivery !== undefined) data.hasDelivery = input.hasDelivery;
  if (input.hasVegOptions !== undefined) data.hasVegOptions = input.hasVegOptions;
  if (input.isFeatured !== undefined) data.isFeatured = input.isFeatured;
  if (input.status !== undefined) data.status = input.status;
  if (input.categorySlugs !== undefined) {
    const categoryIds = await resolveCategoryIds(input.categorySlugs);
    data.categories = { deleteMany: {}, create: categoryIds.map((categoryId) => ({ categoryId })) };
  }

  const row = await prisma.restaurant.update({ where: { id }, data, include: fullInclude });
  await writeAudit(adminId, 'restaurant.update', 'restaurant', id, asJson(input));
  return toAdminRestaurant(row);
}

/** Approve a partner submission: PENDING → PUBLISHED (the normal live status). */
export async function approveSubmission(id: string, adminId: string): Promise<AdminRestaurantDto> {
  const row = await prisma.restaurant.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      status: true,
      name: true,
      slug: true,
      submitterName: true,
      submitterEmail: true,
    },
  });
  if (!row) throw new HttpError(404, 'NOT_FOUND', 'Restaurant not found');
  if (!canApproveSubmission(row.status)) {
    throw new HttpError(409, 'CONFLICT', 'Only pending submissions can be approved.');
  }

  await prisma.restaurant.update({
    where: { id },
    data: { status: 'PUBLISHED', rejectionReason: null },
  });
  await writeAudit(adminId, 'restaurant.approve', 'restaurant', id);

  if (row.submitterEmail) {
    sendSubmissionApproved({
      to: row.submitterEmail,
      ownerName: row.submitterName ?? 'there',
      restaurantName: row.name,
      slug: row.slug,
    });
  }
  return getAdminRestaurant(id);
}

/** Reject a partner submission with a reason the owner can act on. */
export async function rejectSubmission(
  id: string,
  reason: string,
  adminId: string,
): Promise<AdminRestaurantDto> {
  const row = await prisma.restaurant.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, status: true, name: true, submitterName: true, submitterEmail: true },
  });
  if (!row) throw new HttpError(404, 'NOT_FOUND', 'Restaurant not found');
  if (!canRejectSubmission(row.status)) {
    throw new HttpError(409, 'CONFLICT', 'Only pending submissions can be rejected.');
  }

  // Rotate the edit token: the raw value is only known at generation time, and
  // the rejection email is what carries the owner's fix-and-resubmit link.
  const token = randomBytes(32).toString('hex');
  await prisma.restaurant.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason, resubmitTokenHash: sha256Hex(token) },
  });
  await writeAudit(adminId, 'restaurant.reject', 'restaurant', id, asJson({ reason }));

  if (row.submitterEmail) {
    sendSubmissionRejected({
      to: row.submitterEmail,
      ownerName: row.submitterName ?? 'there',
      restaurantName: row.name,
      reason,
      token,
    });
  }
  return getAdminRestaurant(id);
}

export async function softDeleteRestaurant(id: string, adminId: string): Promise<void> {
  await ensureExists(id);
  await prisma.restaurant.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'ARCHIVED', isFeatured: false },
  });
  await writeAudit(adminId, 'restaurant.delete', 'restaurant', id);
}

export async function replaceHours(
  id: string,
  input: HoursUpsertInput,
  adminId: string,
): Promise<AdminRestaurantDto> {
  await ensureExists(id);
  await prisma.$transaction([
    prisma.openingHour.deleteMany({ where: { restaurantId: id } }),
    prisma.openingHour.createMany({
      data: input.hours.map((h) => ({
        restaurantId: id,
        dayOfWeek: h.dayOfWeek,
        opensAt: h.opensAt,
        closesAt: h.closesAt,
        note: h.note ?? null,
      })),
    }),
  ]);
  await writeAudit(adminId, 'restaurant.hours', 'restaurant', id);
  return getAdminRestaurant(id);
}

export async function replaceMenu(
  id: string,
  input: MenuUpsertInput,
  adminId: string,
): Promise<AdminRestaurantDto> {
  await ensureExists(id);
  await prisma.$transaction(async (tx) => {
    await tx.menuCategory.deleteMany({ where: { restaurantId: id } }); // cascades to items
    for (const [ci, cat] of input.categories.entries()) {
      await tx.menuCategory.create({
        data: {
          restaurantId: id,
          name: cat.name,
          sortOrder: ci,
          items: {
            create: cat.items.map((it, ii) => ({
              restaurantId: id,
              name: it.name,
              description: it.description ?? null,
              priceNpr: it.priceNpr,
              isAvailable: it.isAvailable,
              isPopular: it.isPopular,
              isVegetarian: it.isVegetarian,
              sortOrder: ii,
            })),
          },
        },
      });
    }
  });
  await writeAudit(adminId, 'restaurant.menu', 'restaurant', id);
  return getAdminRestaurant(id);
}

export async function addImage(
  id: string,
  input: ImageCreateInput,
  adminId: string,
): Promise<AdminRestaurantDto> {
  await ensureExists(id);
  const max = await prisma.restaurantImage.aggregate({
    where: { restaurantId: id },
    _max: { sortOrder: true },
  });
  const created = await prisma.restaurantImage.create({
    data: {
      restaurantId: id,
      url: input.url,
      type: input.type,
      alt: input.alt ?? '',
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });
  if (input.type === 'COVER') await demoteOtherCovers(id, created.id);
  await writeAudit(adminId, 'restaurant.image.add', 'restaurant', id);
  return getAdminRestaurant(id);
}

/** Look up an image, insisting it belongs to the restaurant named in the URL. */
async function findOwnedImage(restaurantId: string, imageId: string) {
  const img = await prisma.restaurantImage.findFirst({ where: { id: imageId, restaurantId } });
  if (!img) throw new HttpError(404, 'NOT_FOUND', 'Image not found');
  return img;
}

export async function updateImage(
  restaurantId: string,
  imageId: string,
  input: ImageUpdateInput,
  adminId: string,
): Promise<AdminRestaurantDto> {
  const img = await findOwnedImage(restaurantId, imageId);

  const data: Prisma.RestaurantImageUpdateInput = {};
  if (input.alt !== undefined) data.alt = input.alt ?? '';
  if (input.type !== undefined) data.type = input.type;
  await prisma.restaurantImage.update({ where: { id: imageId }, data });
  if (input.type === 'COVER') await demoteOtherCovers(img.restaurantId, imageId);

  await writeAudit(adminId, 'restaurant.image.update', 'restaurant', img.restaurantId);
  return getAdminRestaurant(img.restaurantId);
}

export async function deleteImage(
  restaurantId: string,
  imageId: string,
  adminId: string,
): Promise<AdminRestaurantDto> {
  const img = await findOwnedImage(restaurantId, imageId);
  await prisma.restaurantImage.delete({ where: { id: imageId } });
  // Drop the file too — /uploads is served off disk with a 30-day immutable
  // cache, so a row-only delete leaves the photo publicly fetchable forever.
  await deleteStoredPhoto(img.url);
  await writeAudit(adminId, 'restaurant.image.delete', 'restaurant', img.restaurantId);
  return getAdminRestaurant(img.restaurantId);
}

export async function reorderImages(
  id: string,
  ids: string[],
  adminId: string,
): Promise<AdminRestaurantDto> {
  await ensureExists(id);
  // updateMany scoped to the restaurant: ids belonging to other restaurants are
  // silent no-ops instead of cross-restaurant writes (or a 500 on unknown ids).
  await prisma.$transaction(
    ids.map((imageId, index) =>
      prisma.restaurantImage.updateMany({
        where: { id: imageId, restaurantId: id },
        data: { sortOrder: index },
      }),
    ),
  );
  await writeAudit(adminId, 'restaurant.image.reorder', 'restaurant', id);
  return getAdminRestaurant(id);
}
