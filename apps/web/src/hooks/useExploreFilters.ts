import { SORT_OPTIONS, type PriceBand, type SortOption } from '@ku-food-hunt/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import type { RestaurantListParams } from '../api/endpoints';

/** Fetch the whole curated set once; paginate + distance-sort on the client. */
export const EXPLORE_FETCH_SIZE = 100;

const PRICE_TO_URL: Record<PriceBand, string> = {
  BUDGET: 'budget',
  STANDARD: 'standard',
  PREMIUM: 'premium',
};
const URL_TO_PRICE = Object.fromEntries(
  Object.entries(PRICE_TO_URL).map(([band, url]) => [url, band as PriceBand]),
);

export interface ExploreFilters {
  q: string;
  categories: string[];
  price: PriceBand[];
  minRating: number | null;
  open: boolean;
  delivery: boolean;
  qr: boolean;
  veg: boolean;
  distance: number | null; // meters; client-side only
  sort: SortOption;
}

export type BoolFilterKey = 'open' | 'delivery' | 'qr' | 'veg';

const FILTER_KEYS = ['categories', 'price', 'rating', 'open', 'delivery', 'qr', 'veg', 'distance'];

function splitParam(value: string | null): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

/**
 * The single source of truth for Explore state. Everything lives in the URL, so
 * every view is shareable, refresh-safe, and back-button-friendly, and the query
 * cache key derives directly from it (blueprint §8).
 */
export function useExploreFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<ExploreFilters>(() => {
    const rawSort = searchParams.get('sort');
    const rawRating = Number(searchParams.get('rating'));
    const rawDistance = Number(searchParams.get('distance'));

    return {
      q: searchParams.get('q') ?? '',
      categories: splitParam(searchParams.get('categories')),
      // Single-select: only the first valid band from the URL is honored.
      price: splitParam(searchParams.get('price'))
        .map((p) => URL_TO_PRICE[p])
        .filter((b): b is PriceBand => Boolean(b))
        .slice(0, 1),
      minRating: rawRating >= 1 && rawRating <= 5 ? rawRating : null,
      open: searchParams.get('open') === 'true',
      delivery: searchParams.get('delivery') === 'true',
      qr: searchParams.get('qr') === 'true',
      veg: searchParams.get('veg') === 'true',
      distance: rawDistance > 0 ? rawDistance : null,
      sort: (SORT_OPTIONS as readonly string[]).includes(rawSort ?? '')
        ? (rawSort as SortOption)
        : 'rating',
    };
  }, [searchParams]);

  const commit = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      // replace: keep filter tweaks out of the back-history so Back leaves Explore.
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setParam = useCallback(
    (key: string, value: string | null) =>
      commit((p) => (value ? p.set(key, value) : p.delete(key))),
    [commit],
  );

  const toggleInList = useCallback(
    (key: 'categories', value: string) =>
      commit((p) => {
        const list = splitParam(p.get(key));
        const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
        if (next.length) p.set(key, next.join(','));
        else p.delete(key);
      }),
    [commit],
  );

  const setQuery = useCallback((q: string) => setParam('q', q.trim() || null), [setParam]);
  const toggleCategory = useCallback(
    (slug: string) => toggleInList('categories', slug),
    [toggleInList],
  );
  /** Single-select: picking a band replaces the previous one; picking it again clears it. */
  const togglePrice = useCallback(
    (band: PriceBand) => setParam('price', filters.price[0] === band ? null : PRICE_TO_URL[band]),
    [filters.price, setParam],
  );
  const setMinRating = useCallback(
    (rating: number | null) => setParam('rating', rating ? String(rating) : null),
    [setParam],
  );
  const toggleBool = useCallback(
    (key: BoolFilterKey) => setParam(key, filters[key] ? null : 'true'),
    [filters, setParam],
  );
  const setDistance = useCallback(
    (meters: number | null) => setParam('distance', meters ? String(meters) : null),
    [setParam],
  );
  const setSort = useCallback((sort: SortOption) => setParam('sort', sort), [setParam]);

  const clearFilters = useCallback(
    () => commit((p) => FILTER_KEYS.forEach((key) => p.delete(key))),
    [commit],
  );

  /** Clear filters AND the search query — the empty-state escape hatch. */
  const resetAll = useCallback(
    () => commit((p) => [...FILTER_KEYS, 'q'].forEach((key) => p.delete(key))),
    [commit],
  );

  const activeCount =
    filters.categories.length +
    filters.price.length +
    (filters.minRating ? 1 : 0) +
    (filters.open ? 1 : 0) +
    (filters.delivery ? 1 : 0) +
    (filters.qr ? 1 : 0) +
    (filters.veg ? 1 : 0) +
    (filters.distance ? 1 : 0);

  // Server handles filtering + non-distance sorts; distance/closest are applied client-side.
  const serverQuery = useMemo<RestaurantListParams>(
    () => ({
      q: filters.q || undefined,
      categories: filters.categories.join(',') || undefined,
      price: filters.price.join(',') || undefined,
      minRating: filters.minRating ?? undefined,
      open: filters.open || undefined,
      delivery: filters.delivery || undefined,
      qr: filters.qr || undefined,
      veg: filters.veg || undefined,
      sort: filters.sort,
      perPage: EXPLORE_FETCH_SIZE,
    }),
    [filters],
  );

  return {
    filters,
    activeCount,
    serverQuery,
    setQuery,
    toggleCategory,
    togglePrice,
    setMinRating,
    toggleBool,
    setDistance,
    setSort,
    clearFilters,
    resetAll,
  };
}
