import { PRICE_BAND_LABELS, formatDistance, type RestaurantDetailDto } from '@ku-food-hunt/shared';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router';

import { SmartImage } from '../feedback/SmartImage';
import { Badge } from '../ui/badge';
import { CallButton, OpenInMapsButton, ShareButton } from './DetailActions';
import { OpenStatusBadge } from './OpenStatusBadge';
import { RatingStars } from './RatingStars';

interface RestaurantHeaderProps {
  restaurant: RestaurantDetailDto;
  distanceMeters?: number | null;
}

export function RestaurantHeader({ restaurant, distanceMeters }: RestaurantHeaderProps) {
  return (
    <header className="mx-auto max-w-[1000px] px-4 sm:px-6">
      <div className="relative mt-4 h-[32vh] max-h-[380px] min-h-[200px] overflow-hidden rounded-card sm:mt-6">
        <SmartImage src={restaurant.coverImageUrl} alt={restaurant.name} fill loading="eager" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <Link
          to="/explore"
          className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full bg-surface/90 text-foreground shadow-soft backdrop-blur transition-colors hover:bg-surface"
          aria-label="Back to explore"
        >
          <ChevronLeft className="size-5" />
        </Link>
      </div>

      <div className="relative -mt-16 px-3 sm:px-5">
        <div className="rounded-card border border-border bg-surface p-5 shadow-soft sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {restaurant.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <a href="#reviews" className="hover:underline">
                  <RatingStars
                    value={restaurant.avgRating}
                    count={restaurant.reviewCount}
                    showCount
                  />
                </a>
                <span className="text-border">·</span>
                <span className="text-muted">
                  {restaurant.priceMinNpr && restaurant.priceMaxNpr
                    ? `Rs. ${restaurant.priceMinNpr}–${restaurant.priceMaxNpr}`
                    : PRICE_BAND_LABELS[restaurant.priceBand]}
                </span>
                {typeof distanceMeters === 'number' && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-muted">{formatDistance(distanceMeters)} away</span>
                  </>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <OpenStatusBadge
                  todayHours={restaurant.todayHours}
                  isOpenNow={restaurant.isOpenNow}
                  variant="soft"
                  showLabel
                />
                {restaurant.categories.map((c) => (
                  <Link key={c.slug} to={`/categories/${c.slug}`}>
                    <Badge variant="outline" className="hover:bg-surface-2">
                      {c.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <OpenInMapsButton restaurant={restaurant} className="flex-1 sm:flex-none" />
            {restaurant.phone && <CallButton phone={restaurant.phone} />}
            <ShareButton title={restaurant.name} />
          </div>
        </div>
      </div>
    </header>
  );
}
