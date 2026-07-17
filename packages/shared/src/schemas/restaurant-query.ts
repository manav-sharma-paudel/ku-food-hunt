import { z } from 'zod';

import { PRICE_BANDS, SORT_OPTIONS } from '../constants';

const boolish = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true')
  .optional();

const slugList = z
  .string()
  .transform((s) => s.split(',').filter(Boolean))
  .pipe(z.array(z.string().regex(/^[a-z0-9-]+$/)).max(10))
  .optional();

export const restaurantListQuerySchema = z.object({
  q: z.string().trim().min(1).max(80).optional(),
  categories: slugList,
  price: z
    .string()
    .transform((s) => s.split(',').filter(Boolean))
    .pipe(z.array(z.enum(PRICE_BANDS)).max(3))
    .optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  open: boolish,
  delivery: boolish,
  qr: boolish,
  veg: boolish,
  // "closest" is accepted but distance is client-side; the API falls back to rating order.
  sort: z.enum(SORT_OPTIONS).default('rating'),
  page: z.coerce.number().int().min(1).default(1),
  // Cap of 100 supports the Explore page fetching the full curated set in one
  // request, then paginating + distance-sorting client-side (blueprint §8).
  perPage: z.coerce.number().int().min(1).max(100).default(12),
});

export type RestaurantListQuery = z.infer<typeof restaurantListQuerySchema>;

export const searchSuggestQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
});

export type SearchSuggestQuery = z.infer<typeof searchSuggestQuerySchema>;

export const reviewListQuerySchema = z.object({
  sort: z.enum(['recent', 'top', 'helpful']).default('recent'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
});

export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
