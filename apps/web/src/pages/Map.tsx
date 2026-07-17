import { haversineDistanceMeters, type MapRestaurantDto } from '@ku-food-hunt/shared';
import { LocateFixed, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useMapRestaurants } from '../api/queries';
import { ErrorState } from '../components/feedback/ErrorState';
import { MapFilterBar } from '../components/map/MapFilterBar';
import { MapListPanel } from '../components/map/MapListPanel';
import { MapView } from '../components/map/MapView';
import { MarkerPreviewCard } from '../components/map/MarkerPreviewCard';
import { Seo } from '../components/seo/Seo';
import { Spinner } from '../components/ui/spinner';
import { useGeolocation } from '../hooks/useGeolocation';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { cn } from '../lib/cn';

export default function MapPage() {
  const { data, isPending, isError, error, refetch } = useMapRestaurants();
  const [searchParams] = useSearchParams();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const geo = useGeolocation();

  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get('categories'),
  );
  const [openOnly, setOpenOnly] = useState(searchParams.get('open') === 'true');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [listCollapsed, setListCollapsed] = useState(false);
  const [locationNote, setLocationNote] = useState(true);

  const restaurants = useMemo(() => {
    let list = data ?? [];
    if (activeCategory) list = list.filter((r) => r.primaryCategory?.slug === activeCategory);
    if (openOnly) list = list.filter((r) => r.isOpenNow);
    return list;
  }, [data, activeCategory, openOnly]);

  const distanceFor = (r: MapRestaurantDto) =>
    geo.coords
      ? haversineDistanceMeters(geo.coords, { latitude: r.latitude, longitude: r.longitude })
      : null;

  const selected = restaurants.find((r) => r.id === selectedId) ?? null;

  const shellClass = 'relative flex h-[calc(100dvh-4rem)] w-full overflow-hidden';

  if (isError) {
    return (
      <div className={cn(shellClass, 'items-center justify-center')}>
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className={cn(shellClass, 'items-center justify-center')}>
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <Seo
        title="Food map around KU"
        description="Explore restaurants, cafés, and food stalls around Kathmandu University on an interactive map, with live open-now status and one-tap directions."
        path="/map"
      />
      {isDesktop && (
        <MapListPanel
          restaurants={restaurants}
          selectedId={selectedId}
          collapsed={listCollapsed}
          distanceFor={distanceFor}
          onSelect={(r) => setSelectedId(r.id)}
          onHover={setHoveredId}
          onToggleCollapse={() => setListCollapsed((v) => !v)}
        />
      )}

      <div className="relative flex-1">
        <MapView
          restaurants={restaurants}
          selectedId={selectedId}
          hoveredId={hoveredId}
          userCoords={geo.coords}
          onSelect={(r) => setSelectedId(r.id)}
          onBackgroundClick={() => setSelectedId(null)}
        />

        {/* Floating filter bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center p-3">
          <div className="max-w-full">
            <MapFilterBar
              activeCategory={activeCategory}
              openOnly={openOnly}
              onCategoryChange={setActiveCategory}
              onOpenOnlyChange={setOpenOnly}
            />
          </div>
        </div>

        {/* Locate-me FAB */}
        <button
          onClick={geo.request}
          aria-label="Show my location"
          className={cn(
            'absolute right-3 z-10 flex size-11 items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-lift transition-colors hover:bg-surface-2',
            selected && !isDesktop ? 'bottom-[19rem]' : 'bottom-24 md:bottom-28',
            geo.status === 'granted' && 'text-primary',
          )}
        >
          {geo.status === 'prompting' ? (
            <Spinner className="size-5" />
          ) : (
            <LocateFixed className="size-5" />
          )}
        </button>

        {/* Location permission denied / prompt note */}
        {locationNote && geo.status !== 'granted' && (
          <div className="pointer-events-auto absolute inset-x-3 bottom-3 z-10 mx-auto flex max-w-md items-center gap-3 rounded-btn border border-border bg-surface px-4 py-2.5 text-sm shadow-lift md:left-3 md:right-auto md:mx-0">
            <span className="flex-1 text-muted">
              {geo.status === 'denied'
                ? 'Location is blocked — enable it to see distances.'
                : 'Enable location to see distances from you.'}
            </span>
            <button
              onClick={() => setLocationNote(false)}
              aria-label="Dismiss"
              className="text-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Desktop preview: floating corner card */}
        {selected && isDesktop && (
          <div className="absolute bottom-4 left-4 z-20 w-80 duration-200 animate-in fade-in slide-in-from-bottom-4">
            <MarkerPreviewCard
              restaurant={selected}
              distanceMeters={distanceFor(selected)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>

      {/* Mobile preview: bottom sheet above the tab bar */}
      {selected && !isDesktop && (
        <div className="fixed inset-x-3 bottom-[4.25rem] z-30 duration-200 animate-in slide-in-from-bottom-4">
          <MarkerPreviewCard
            restaurant={selected}
            distanceMeters={distanceFor(selected)}
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </div>
  );
}
