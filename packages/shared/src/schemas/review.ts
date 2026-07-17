import { z } from 'zod';

/** Shared limits — the single source of truth for both the API guard and the form UI. */
export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_MAX = 1000;
export const REVIEW_NAME_MAX = 40;
export const REVIEW_MAX_PHOTOS = 3;

/**
 * Uploaded review photos are stored under this path prefix and served back from
 * our own origin. Validating submitted URLs against it prevents a client from
 * smuggling an arbitrary (or `javascript:`) URL into the stored review.
 */
export const REVIEW_PHOTO_PATH = /^\/uploads\/reviews\/[\w-]+\.(jpe?g|png|webp)$/i;

/** Empty strings from an untouched optional field collapse to `undefined`. */
const optionalTrimmed = (max: number) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(REVIEW_BODY_MIN).max(REVIEW_BODY_MAX),
  authorName: optionalTrimmed(REVIEW_NAME_MAX),
  imageUrls: z.array(z.string().regex(REVIEW_PHOTO_PATH)).max(REVIEW_MAX_PHOTOS).optional(),
  /** Cloudflare Turnstile token; verified server-side only when a secret is configured. */
  turnstileToken: z.string().optional(),
  /**
   * Honeypot: a hidden field real users never see. Bots that auto-fill every input
   * trip this and are rejected. Must be empty.
   */
  website: z.string().max(0).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
