import { z } from 'zod';

import { PRICE_BANDS } from '../constants';
import { RESTAURANT_PHOTO_PATH } from './admin';

/** Shared limits — the single source of truth for the partner form UI and the API guard. */
export const PARTNER_DESCRIPTION_MIN = 20;
export const PARTNER_DESCRIPTION_MAX = 2000;
export const PARTNER_MAX_GALLERY_PHOTOS = 4;

/** Empty strings from an untouched optional field collapse to `undefined`. */
const optionalTrimmed = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max).optional(),
  );

/** Uploaded partner photos must point at our own uploads origin (see review schema). */
const uploadedPhoto = z.string().regex(RESTAURANT_PHOTO_PATH);

/**
 * Owner-supplied links must be real http(s) URLs — anything else (`javascript:`,
 * `data:`, bare text) is a stored-XSS trap for whatever UI renders them later.
 */
const optionalHttpUrl = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z
    .url({ protocol: /^https?$/, error: 'Enter a full link starting with http:// or https://' })
    .max(300)
    .optional(),
);

export const partnerSubmissionSchema = z
  .object({
    // Public restaurant details — these map 1:1 onto the Restaurant model.
    name: z.string().trim().min(2).max(120),
    legalName: optionalTrimmed(160),
    description: z.string().trim().min(PARTNER_DESCRIPTION_MIN).max(PARTNER_DESCRIPTION_MAX),
    address: z.string().trim().min(2).max(200),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    phone: optionalTrimmed(40),
    websiteUrl: optionalHttpUrl,
    categorySlugs: z.array(z.string().trim().min(1)).min(1, 'Pick at least one cuisine').max(6),
    priceBand: z.enum(PRICE_BANDS),
    priceMinNpr: z.number().int().min(0).max(1_000_000).nullish(),
    priceMaxNpr: z.number().int().min(0).max(1_000_000).nullish(),
    hasQrPayment: z.boolean().default(false),
    hasDelivery: z.boolean().default(false),
    hasVegOptions: z.boolean().default(false),
    hours: z
      .array(
        z.object({
          dayOfWeek: z.number().int().min(0).max(6),
          opensAt: z.number().int().min(0).max(1440),
          // closesAt may exceed 1440 to model past-midnight closings.
          closesAt: z.number().int().min(1).max(2880),
        }),
      )
      .max(21)
      .default([]),
    coverPhotoUrl: uploadedPhoto.optional(),
    galleryPhotoUrls: z.array(uploadedPhoto).max(PARTNER_MAX_GALLERY_PHOTOS).default([]),
    menuPhotoUrl: uploadedPhoto.optional(),
    // Approval correspondence — kept private, never rendered on the public site.
    submitterName: z.string().trim().min(2).max(120),
    submitterEmail: z.email().max(200),
    submitterPhone: z.string().trim().min(5).max(40),
    /** Present when editing via the emailed link — targets the existing record. */
    resubmitToken: z.string().max(200).optional(),
    /** Cloudflare Turnstile token; verified server-side only when a secret is configured. */
    turnstileToken: z.string().optional(),
    /** Honeypot (see review schema): hidden field that must stay empty. */
    website: z.string().max(0).optional(),
  })
  .refine((v) => v.priceMinNpr == null || v.priceMaxNpr == null || v.priceMinNpr <= v.priceMaxNpr, {
    message: 'Min price cannot be greater than max price',
    path: ['priceMinNpr'],
  });

export type PartnerSubmissionInput = z.infer<typeof partnerSubmissionSchema>;
