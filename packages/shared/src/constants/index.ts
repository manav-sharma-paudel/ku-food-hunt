export const APP_NAME = 'KU Food Hunt';
export const APP_TAGLINE = 'Every great bite around KU.';

/** KU main campus, Dhulikhel (approximate — refined with on-the-ground data in Phase 1). */
export const KU_COORDINATES = { latitude: 27.6194, longitude: 85.5386 } as const;

/** Nepal has a single, DST-free timezone: UTC+5:45. All "Open Now" logic uses this. */
export const NEPAL_TIME_ZONE = 'Asia/Kathmandu';

export const PRICE_BANDS = ['BUDGET', 'STANDARD', 'PREMIUM'] as const;
export type PriceBand = (typeof PRICE_BANDS)[number];

export const PRICE_BAND_LABELS: Record<PriceBand, string> = {
  BUDGET: 'Under Rs. 200',
  STANDARD: 'Rs. 200–500',
  PREMIUM: 'Rs. 500+',
};

export const SORT_OPTIONS = ['rating', 'closest', 'reviews', 'cheapest', 'newest'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
