import { formatDistance, type RestaurantDetailDto } from '@ku-food-hunt/shared';
import { MapPin } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { Spinner } from '../ui/spinner';
import { OpenInMapsButton } from './DetailActions';
import { DetailSection } from './RestaurantGallery';

// maplibre is heavy, so only pull it into the detail chunk once the user scrolls here.
const DetailMiniMap = lazy(() => import('../map/DetailMiniMap'));

interface LocationSectionProps {
  restaurant: RestaurantDetailDto;
  distanceMeters?: number | null;
}

export function LocationSection({ restaurant, distanceMeters }: LocationSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '250px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <DetailSection id="location" title="Location">
      <div
        ref={ref}
        className="relative aspect-[16/9] w-full overflow-hidden rounded-card border border-border bg-surface-2 sm:aspect-[21/9]"
      >
        {inView ? (
          <Suspense
            fallback={
              <div className="flex size-full items-center justify-center">
                <Spinner className="size-5 text-muted" />
              </div>
            }
          >
            <DetailMiniMap
              latitude={restaurant.latitude}
              longitude={restaurant.longitude}
              open={restaurant.isOpenNow}
            />
          </Suspense>
        ) : (
          <div className="flex size-full items-center justify-center text-muted">
            <MapPin className="size-8" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
          <p className="text-sm">
            {restaurant.address}
            {typeof distanceMeters === 'number' && (
              <span className="text-muted"> · {formatDistance(distanceMeters)} away</span>
            )}
          </p>
        </div>
        <OpenInMapsButton restaurant={restaurant} />
      </div>
    </DetailSection>
  );
}
