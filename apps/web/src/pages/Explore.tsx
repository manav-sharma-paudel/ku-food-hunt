import { haversineDistanceMeters } from '@ku-food-hunt/shared';
import { SearchX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useCategories, useRestaurants } from '../api/queries';
import { CardGridSkeleton } from '../components/feedback/CardSkeleton';
import { EmptyState } from '../components/feedback/EmptyState';
import { ErrorState } from '../components/feedback/ErrorState';
import { ActiveFilterPills } from '../components/filters/ActiveFilterPills';
import { FilterSheet } from '../components/filters/FilterSheet';
import { FilterSidebar } from '../components/filters/FilterSidebar';
import { SortSelect } from '../components/filters/SortSelect';
import { RestaurantCard } from '../components/restaurant/RestaurantCard';
import { Seo } from '../components/seo/Seo';
import { Button } from '../components/ui/button';
import { useExploreFilters } from '../hooks/useExploreFilters';
import { useGeolocation } from '../hooks/useGeolocation';

const PAGE_SIZE = 12;

export default function Explore() {
  const { filters, serverQuery, setSort, resetAll } = useExploreFilters();
  const { data: categories } = useCategories();
  const geo = useGeolocation();
  const { data, isPending, isError, error, refetch } = useRestaurants(serverQuery);

  const [visible, setVisible] = useState(PAGE_SIZE);

  // Auto-request location when the user picks a distance-dependent view.
  useEffect(() => {
    if ((filters.sort === 'closest' || filters.distance) && geo.status === 'idle') geo.request();
  }, [filters.sort, filters.distance, geo]);

  // Client-side distance annotation, distance filter, and "closest" sort (blueprint §8).
  const items = useMemo(() => {
    const list = data?.data ?? [];
    let withDistance = list.map((card) => ({
      card,
      distance: geo.coords
        ? haversineDistanceMeters(geo.coords, {
            latitude: card.latitude,
            longitude: card.longitude,
          })
        : null,
    }));

    if (geo.coords && filters.distance) {
      withDistance = withDistance.filter((i) => (i.distance ?? Infinity) <= filters.distance!);
    }
    if (geo.coords && filters.sort === 'closest') {
      withDistance = [...withDistance].sort(
        (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
      );
    }
    return withDistance;
  }, [data, geo.coords, filters.distance, filters.sort]);

  // Reset pagination whenever the effective query changes.
  const resetKey = JSON.stringify(serverQuery) + String(filters.distance) + geo.coords;
  useEffect(() => setVisible(PAGE_SIZE), [resetKey]);

  const shown = items.slice(0, visible);
  const total = items.length;

  const activeCategory =
    filters.categories.length === 1
      ? categories?.find((c) => c.slug === filters.categories[0])
      : undefined;
  const title = activeCategory ? activeCategory.name : filters.q ? `“${filters.q}”` : 'Explore';

  const seoTitle = activeCategory
    ? `${activeCategory.name} near KU`
    : filters.q
      ? `Search: ${filters.q}`
      : 'Explore restaurants near KU';
  const seoDescription = activeCategory
    ? `Browse ${activeCategory.name.toLowerCase()} around Kathmandu University — menus, NPR prices, and honest student reviews.`
    : 'Search and filter every restaurant, café, and food stall around Kathmandu University by category, price, rating, and distance.';

  const geoForControls = {
    status: geo.status,
    request: geo.request,
    hasCoords: Boolean(geo.coords),
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">
      <Seo title={seoTitle} description={seoDescription} path="/explore" />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {isPending ? 'Finding restaurants…' : `${total} ${total === 1 ? 'place' : 'places'}`}
            {filters.q && !activeCategory ? ' matching your search' : ' around KU'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="lg:hidden">
            <FilterSheet geo={geoForControls} resultCount={total} />
          </div>
          <SortSelect value={filters.sort} onChange={setSort} />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[17.5rem_1fr] lg:gap-8">
        <FilterSidebar geo={geoForControls} className="hidden lg:block" />

        <div className="min-w-0">
          <div className="mb-5 empty:mb-0">
            <ActiveFilterPills />
          </div>

          {isError ? (
            <ErrorState error={error} onRetry={() => refetch()} />
          ) : isPending ? (
            <CardGridSkeleton count={6} />
          ) : total === 0 ? (
            <EmptyState
              icon={SearchX}
              title={filters.q ? `No results for “${filters.q}”` : 'Nothing matches those filters'}
              description="Try removing a filter or widening your search to see more places around KU."
              action={<Button onClick={resetAll}>Clear all</Button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shown.map(({ card, distance }) => (
                  <RestaurantCard key={card.id} restaurant={card} distanceMeters={distance} />
                ))}
              </div>

              {visible < total && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  >
                    Load more ({total - visible} left)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
