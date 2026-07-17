import { PRICE_BAND_LABELS, formatDistance, type RestaurantCardDto } from '@ku-food-hunt/shared';
import { Eye, Heart, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { cn } from '../../lib/cn';
import { SmartImage } from '../feedback/SmartImage';
import { Badge } from '../ui/badge';
import { OpenStatusBadge } from './OpenStatusBadge';
import { QuickViewDialog } from './QuickViewDialog';
import { RatingStars } from './RatingStars';

interface RestaurantCardProps {
  restaurant: RestaurantCardDto;
  /** Meters from the user, when geolocation is granted. */
  distanceMeters?: number | null;
}

export function RestaurantCard({ restaurant, distanceMeters }: RestaurantCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const categoryLine = restaurant.categories.map((c) => c.name).join(' · ') || 'Restaurant';

  return (
    <>
      <article className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-soft transition-shadow duration-300 hover:shadow-lift">
        <div className="relative overflow-hidden">
          <SmartImage
            src={restaurant.coverImageUrl}
            alt={restaurant.name}
            ratio="16/10"
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute top-3 left-3">
            <OpenStatusBadge todayHours={restaurant.todayHours} isOpenNow={restaurant.isOpenNow} />
          </div>

          {/* z-10 buttons sit above the stretched title link below */}
          <button
            type="button"
            disabled
            title="Favorites are coming soon"
            aria-label="Save to favorites (coming soon)"
            className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-surface/80 text-muted opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
          >
            <Heart className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 translate-y-2 items-center gap-1.5 rounded-full bg-surface/90 px-3.5 py-2 text-xs font-medium text-foreground opacity-0 shadow-soft backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <Eye className="size-3.5" />
            Quick view
          </button>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">
              {/* Stretched link makes the whole card clickable without nesting interactives */}
              <Link
                to={`/restaurants/${restaurant.slug}`}
                className="after:absolute after:inset-0 after:content-['']"
              >
                {restaurant.name}
              </Link>
            </h3>
            <RatingStars value={restaurant.avgRating} className="shrink-0" />
          </div>

          <p className="mt-1 line-clamp-1 text-sm text-muted">{categoryLine}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Badge variant="outline" size="sm">
              {PRICE_BAND_LABELS[restaurant.priceBand]}
            </Badge>
            <span>{restaurant.reviewCount} reviews</span>
            {typeof distanceMeters === 'number' && (
              <span className="ml-auto inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {formatDistance(distanceMeters)}
              </span>
            )}
          </div>
        </div>
      </article>

      <QuickViewDialog
        slug={restaurant.slug}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </>
  );
}

export function RestaurantCardCompact({ restaurant }: { restaurant: RestaurantCardDto }) {
  return (
    <Link
      to={`/restaurants/${restaurant.slug}`}
      className={cn(
        'flex gap-3 rounded-card border border-border bg-surface p-2.5 shadow-soft transition-shadow hover:shadow-lift',
      )}
    >
      <SmartImage
        src={restaurant.coverImageUrl}
        alt={restaurant.name}
        ratio="1/1"
        containerClassName="w-20 shrink-0 rounded-xl"
      />
      <div className="min-w-0 flex-1 py-0.5">
        <h3 className="truncate font-semibold">{restaurant.name}</h3>
        <p className="truncate text-xs text-muted">
          {restaurant.categories.map((c) => c.name).join(' · ')}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <RatingStars value={restaurant.avgRating} />
          <OpenStatusBadge
            todayHours={restaurant.todayHours}
            isOpenNow={restaurant.isOpenNow}
            variant="soft"
          />
        </div>
      </div>
    </Link>
  );
}
