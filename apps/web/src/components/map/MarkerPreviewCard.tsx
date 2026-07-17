import {
  PRICE_BAND_LABELS,
  formatDistance,
  googleMapsDirectionsUrl,
  type MapRestaurantDto,
} from '@ku-food-hunt/shared';
import { ExternalLink, X } from 'lucide-react';
import { Link } from 'react-router';

import { SmartImage } from '../feedback/SmartImage';
import { OpenStatusBadge } from '../restaurant/OpenStatusBadge';
import { RatingStars } from '../restaurant/RatingStars';
import { Button } from '../ui/button';

interface MarkerPreviewCardProps {
  restaurant: MapRestaurantDto;
  distanceMeters?: number | null;
  onClose: () => void;
}

export function MarkerPreviewCard({ restaurant, distanceMeters, onClose }: MarkerPreviewCardProps) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-lift">
      <div className="relative">
        <SmartImage src={restaurant.coverImageUrl} alt={restaurant.name} ratio="16/9" />
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-surface/85 text-muted backdrop-blur transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <div className="absolute top-2 left-2">
          <OpenStatusBadge todayHours={restaurant.todayHours} isOpenNow={restaurant.isOpenNow} />
        </div>
      </div>

      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/restaurants/${restaurant.slug}`} className="font-semibold hover:underline">
            {restaurant.name}
          </Link>
          <RatingStars value={restaurant.avgRating} className="shrink-0" />
        </div>
        <p className="mt-1 text-sm text-muted">
          {restaurant.primaryCategory?.name ?? 'Restaurant'} ·{' '}
          {PRICE_BAND_LABELS[restaurant.priceBand]}
          {typeof distanceMeters === 'number' && ` · ${formatDistance(distanceMeters)}`}
        </p>

        <div className="mt-3 flex gap-2">
          <Button asChild size="sm" variant="secondary" className="flex-1">
            <Link to={`/restaurants/${restaurant.slug}`}>Details</Link>
          </Button>
          <Button asChild size="sm" className="flex-1">
            <a
              href={googleMapsDirectionsUrl(restaurant.latitude, restaurant.longitude)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />
              Directions
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
