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

/** Upper Rs. bound of each non-open band, mirroring PRICE_BAND_LABELS. */
export const PRICE_BAND_MAX_NPR = { BUDGET: 200, STANDARD: 500 } as const;

/**
 * Coarse price bucket for the public price filter, derived from a restaurant's
 * exact Rs. range: the midpoint when both ends are set, the single known end when
 * only one is, and `null` when neither is — the admin panel no longer sets the
 * band by hand, so this keeps it consistent with the min/max the admin enters.
 */
export function derivePriceBand(
  minNpr: number | null | undefined,
  maxNpr: number | null | undefined,
): PriceBand | null {
  const lo = typeof minNpr === 'number' ? minNpr : null;
  const hi = typeof maxNpr === 'number' ? maxNpr : null;
  const ref = lo !== null && hi !== null ? (lo + hi) / 2 : (lo ?? hi);
  if (ref === null) return null;
  if (ref < PRICE_BAND_MAX_NPR.BUDGET) return 'BUDGET';
  if (ref <= PRICE_BAND_MAX_NPR.STANDARD) return 'STANDARD';
  return 'PREMIUM';
}

export const SORT_OPTIONS = ['rating', 'closest', 'reviews', 'cheapest', 'newest'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
