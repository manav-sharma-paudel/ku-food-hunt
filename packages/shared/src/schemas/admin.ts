import { z } from 'zod';

import { PRICE_BANDS } from '../constants';

export const RESTAURANT_STATUSES = [
  'DRAFT',
  'PENDING',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
] as const;
export type RestaurantStatusValue = (typeof RESTAURANT_STATUSES)[number];

export const IMAGE_TYPES = ['COVER', 'GALLERY', 'MENU_SCAN'] as const;
export type ImageTypeValue = (typeof IMAGE_TYPES)[number];

export const REVIEW_STATUSES = ['PUBLISHED', 'HIDDEN', 'FLAGGED'] as const;
export type ReviewStatusValue = (typeof REVIEW_STATUSES)[number];

export const ADMIN_ROLES = ['SUPERADMIN', 'EDITOR'] as const;
export type AdminRoleValue = (typeof ADMIN_ROLES)[number];

const slug = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers, and dashes only')
  .min(2)
  .max(120);

const nullableText = (max: number) => z.string().trim().max(max).nullish();
const optionalPrice = z.number().int().min(0).max(1_000_000).nullish();

/** Links must be http(s) — see the partner schema's optionalHttpUrl for the rationale. */
const nullableHttpUrl = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z
    .url({ protocol: /^https?$/, error: 'Enter a full link starting with http:// or https://' })
    .max(300)
    .nullish(),
);

// ————————————————————————————————— Auth

export const adminLoginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// ————————————————————————————————— Restaurant core

export const restaurantCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slug.optional(),
  legalName: nullableText(160),
  description: nullableText(2000),
  address: z.string().trim().min(2).max(200),
  phone: nullableText(40),
  websiteUrl: nullableHttpUrl,
  googlePlaceId: nullableText(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  priceBand: z.enum(PRICE_BANDS),
  priceMinNpr: optionalPrice,
  priceMaxNpr: optionalPrice,
  hasQrPayment: z.boolean().default(false),
  hasDelivery: z.boolean().default(false),
  hasVegOptions: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  status: z.enum(RESTAURANT_STATUSES).default('DRAFT'),
  categorySlugs: z.array(slug).max(6).default([]),
});
export type RestaurantCreateInput = z.infer<typeof restaurantCreateSchema>;

export const restaurantUpdateSchema = restaurantCreateSchema.partial();
export type RestaurantUpdateInput = z.infer<typeof restaurantUpdateSchema>;

// ————————————————————————————————— Opening hours (replace-all)

/**
 * A closing time must come after the opening time on the same clock. Past-midnight
 * closings are encoded by carrying past 1440 (18:00–02:00 is 1080 → 1560), so
 * writing that 02:00 as `120` is the natural mistake — and it produces a slot that
 * `isOpenAt()` can never satisfy, silently marking the restaurant closed at every
 * instant, in the filters, on the map, and in the JSON-LD served to search engines.
 */
export const openingHourSlotError =
  'Closing time must be after opening time (past midnight: add 1440 — 2 AM is 1560)';

export const hoursUpsertSchema = z.object({
  hours: z
    .array(
      z
        .object({
          dayOfWeek: z.number().int().min(0).max(6),
          opensAt: z.number().int().min(0).max(1440),
          // closesAt may exceed 1440 to model past-midnight closings.
          closesAt: z.number().int().min(1).max(2880),
          note: nullableText(80),
        })
        .refine((h) => h.closesAt > h.opensAt, {
          message: openingHourSlotError,
          path: ['closesAt'],
        }),
    )
    .max(40),
});
export type HoursUpsertInput = z.infer<typeof hoursUpsertSchema>;

// ————————————————————————————————— Menu (replace-all)

export const menuUpsertSchema = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(80),
        items: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(120),
              description: nullableText(400),
              priceNpr: z.number().int().min(0).max(1_000_000),
              isAvailable: z.boolean().default(true),
              isPopular: z.boolean().default(false),
              isVegetarian: z.boolean().default(false),
            }),
          )
          .max(120),
      }),
    )
    .max(30),
});
export type MenuUpsertInput = z.infer<typeof menuUpsertSchema>;

// ————————————————————————————————— Images

export const RESTAURANT_PHOTO_PATH = /^\/uploads\/restaurants\/[\w-]+\.(jpe?g|png|webp)$/i;

export const imageCreateSchema = z.object({
  url: z.string().regex(RESTAURANT_PHOTO_PATH),
  type: z.enum(IMAGE_TYPES).default('GALLERY'),
  alt: nullableText(160),
});
export type ImageCreateInput = z.infer<typeof imageCreateSchema>;

export const imageUpdateSchema = z.object({
  alt: z.string().trim().max(160).nullish().optional(),
  type: z.enum(IMAGE_TYPES).optional(),
});
export type ImageUpdateInput = z.infer<typeof imageUpdateSchema>;

export const imageReorderSchema = z.object({ ids: z.array(z.uuid()).max(60) });
export type ImageReorderInput = z.infer<typeof imageReorderSchema>;

// ————————————————————————————————— Moderation & homepage

/** Rejecting a partner submission always requires a reason — it is emailed to the owner. */
export const submissionRejectSchema = z.object({
  reason: z.string().trim().min(3, 'Give the owner a reason').max(500),
});
export type SubmissionRejectInput = z.infer<typeof submissionRejectSchema>;

export const reviewModerationSchema = z.object({ status: z.enum(REVIEW_STATUSES) });
export type ReviewModerationInput = z.infer<typeof reviewModerationSchema>;

export const reviewModerationQuerySchema = z.object({
  status: z.enum(REVIEW_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});
export type ReviewModerationQuery = z.infer<typeof reviewModerationQuerySchema>;

export const featuredUpdateSchema = z.object({ ids: z.array(z.uuid()).max(12) });
export type FeaturedUpdateInput = z.infer<typeof featuredUpdateSchema>;

export const heroSettingSchema = z.object({
  headline: z.string().trim().min(2).max(120),
  subheadline: z.string().trim().min(2).max(240),
});
export type HeroSettingInput = z.infer<typeof heroSettingSchema>;

export const adminRestaurantListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  status: z.enum(RESTAURANT_STATUSES).optional(),
});
export type AdminRestaurantListQuery = z.infer<typeof adminRestaurantListQuerySchema>;
