import { randomBytes } from 'node:crypto';

import {
  canResubmit,
  type PartnerSubmissionDto,
  type PartnerSubmissionInput,
} from '@ku-food-hunt/shared';
import { Prisma } from '@prisma/client';

import { sha256Hex } from '../../lib/hash';
import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/error-handler';
import { ensureUniqueSlug, resolveCategoryIds } from '../admin/admin-restaurants.service';
import { sendSubmissionReceived } from './partner-emails';

/** The raw edit-link token is only ever emailed; the DB stores its SHA-256. */
const hashToken = sha256Hex;

export interface SubmissionResult {
  restaurantId: string;
  name: string;
  submitterName: string;
  submitterEmail: string;
  /** Raw token for the confirmation email's edit link — never persisted. */
  resubmitToken: string;
  isResubmission: boolean;
}

const submissionInclude = Prisma.validator<Prisma.RestaurantInclude>()({
  categories: { include: { category: true } },
  openingHours: { orderBy: [{ dayOfWeek: 'asc' as const }, { opensAt: 'asc' as const }] },
  images: { orderBy: [{ type: 'asc' as const }, { sortOrder: 'asc' as const }] },
});

function imageRows(input: PartnerSubmissionInput) {
  return [
    ...(input.coverPhotoUrl ? [{ url: input.coverPhotoUrl, type: 'COVER' as const }] : []),
    ...input.galleryPhotoUrls.map((url) => ({ url, type: 'GALLERY' as const })),
    ...(input.menuPhotoUrl ? [{ url: input.menuPhotoUrl, type: 'MENU_SCAN' as const }] : []),
  ].map((img, i) => ({ ...img, alt: input.name, sortOrder: i }));
}

/**
 * Create a partner submission, or — when a valid edit token is presented —
 * update the existing record in place and reset it to PENDING, so a rejected
 * owner's fixes never create a duplicate listing.
 */
export async function submitPartnerRestaurant(
  input: PartnerSubmissionInput,
): Promise<SubmissionResult> {
  const categoryIds = await resolveCategoryIds(input.categorySlugs);
  if (!categoryIds.length) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Pick at least one valid cuisine.');
  }

  // Rotate the token on every (re)submission so old email links stop working.
  const token = randomBytes(32).toString('hex');

  const core = {
    name: input.name,
    legalName: input.legalName ?? null,
    description: input.description,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    phone: input.phone ?? null,
    websiteUrl: input.websiteUrl ?? null,
    priceBand: input.priceBand,
    priceMinNpr: input.priceMinNpr ?? null,
    priceMaxNpr: input.priceMaxNpr ?? null,
    hasQrPayment: input.hasQrPayment,
    hasDelivery: input.hasDelivery,
    hasVegOptions: input.hasVegOptions,
    submitterName: input.submitterName,
    submitterEmail: input.submitterEmail,
    submitterPhone: input.submitterPhone,
    status: 'PENDING' as const,
    submittedAt: new Date(),
    rejectionReason: null,
    resubmitTokenHash: hashToken(token),
  };
  const categories = { create: categoryIds.map((categoryId) => ({ categoryId })) };
  const openingHours = {
    create: input.hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
    })),
  };
  const images = { create: imageRows(input) };

  if (input.resubmitToken) {
    const existing = await prisma.restaurant.findFirst({
      where: { resubmitTokenHash: hashToken(input.resubmitToken), deletedAt: null },
      select: { id: true, status: true },
    });
    if (!existing) throw new HttpError(404, 'NOT_FOUND', 'This edit link is no longer valid.');
    if (!canResubmit(existing.status)) {
      throw new HttpError(409, 'CONFLICT', 'This submission has already been processed.');
    }

    const row = await prisma.restaurant.update({
      where: { id: existing.id },
      data: {
        ...core,
        categories: { deleteMany: {}, ...categories },
        openingHours: { deleteMany: {}, ...openingHours },
        images: { deleteMany: {}, ...images },
      },
    });
    sendSubmissionReceived({
      to: input.submitterEmail,
      ownerName: input.submitterName,
      restaurantName: row.name,
      token,
    });
    return {
      restaurantId: row.id,
      name: row.name,
      submitterName: input.submitterName,
      submitterEmail: input.submitterEmail,
      resubmitToken: token,
      isResubmission: true,
    };
  }

  const slug = await ensureUniqueSlug(input.name);
  const row = await prisma.restaurant.create({
    data: { slug, ...core, categories, openingHours, images },
  });
  sendSubmissionReceived({
    to: input.submitterEmail,
    ownerName: input.submitterName,
    restaurantName: row.name,
    token,
  });
  return {
    restaurantId: row.id,
    name: row.name,
    submitterName: input.submitterName,
    submitterEmail: input.submitterEmail,
    resubmitToken: token,
    isResubmission: false,
  };
}

/** Load a submission back into the public form via its emailed edit token. */
export async function getSubmissionByToken(rawToken: string): Promise<PartnerSubmissionDto> {
  const row = await prisma.restaurant.findFirst({
    where: { resubmitTokenHash: hashToken(rawToken), deletedAt: null },
    include: submissionInclude,
  });
  if (!row || !canResubmit(row.status)) {
    throw new HttpError(404, 'NOT_FOUND', 'This edit link is no longer valid.');
  }

  return {
    name: row.name,
    legalName: row.legalName,
    description: row.description,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    websiteUrl: row.websiteUrl,
    categorySlugs: row.categories.map((c) => c.category.slug),
    priceBand: row.priceBand,
    priceMinNpr: row.priceMinNpr,
    priceMaxNpr: row.priceMaxNpr,
    hasQrPayment: row.hasQrPayment,
    hasDelivery: row.hasDelivery,
    hasVegOptions: row.hasVegOptions,
    hours: row.openingHours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
    })),
    coverPhotoUrl: row.images.find((i) => i.type === 'COVER')?.url ?? null,
    galleryPhotoUrls: row.images.filter((i) => i.type === 'GALLERY').map((i) => i.url),
    menuPhotoUrl: row.images.find((i) => i.type === 'MENU_SCAN')?.url ?? null,
    submitterName: row.submitterName ?? '',
    submitterEmail: row.submitterEmail ?? '',
    submitterPhone: row.submitterPhone ?? '',
    status: row.status,
    rejectionReason: row.rejectionReason,
  };
}
