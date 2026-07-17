import { PRICE_BAND_LABELS, formatNpr, googleMapsDirectionsUrl } from '@ku-food-hunt/shared';
import { ExternalLink, Phone } from 'lucide-react';
import { Link } from 'react-router';

import { useRestaurant } from '../../api/queries';
import { SmartImage } from '../feedback/SmartImage';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { AmenityBadges } from './AmenityBadges';
import { OpenStatusBadge } from './OpenStatusBadge';
import { RatingStars } from './RatingStars';

interface QuickViewDialogProps {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewDialog({ slug, open, onOpenChange }: QuickViewDialogProps) {
  // Only fetches once the dialog opens.
  const { data, isPending } = useRestaurant(open ? slug : '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {isPending || !data ? (
          <QuickViewSkeleton />
        ) : (
          <div className="max-h-[85vh] overflow-y-auto">
            <SmartImage src={data.coverImageUrl} alt={data.name} ratio="16/9" />

            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <DialogTitle className="text-xl font-semibold">{data.name}</DialogTitle>
                <RatingStars
                  value={data.avgRating}
                  count={data.reviewCount}
                  showCount
                  className="shrink-0"
                />
              </div>
              <DialogDescription className="mt-1 text-sm text-muted">
                {data.categories.map((c) => c.name).join(' · ')} ·{' '}
                {PRICE_BAND_LABELS[data.priceBand]}
              </DialogDescription>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <OpenStatusBadge
                  todayHours={data.todayHours}
                  isOpenNow={data.isOpenNow}
                  variant="soft"
                  showLabel
                />
              </div>

              <AmenityBadges
                className="mt-3"
                hasQrPayment={data.hasQrPayment}
                hasDelivery={data.hasDelivery}
                hasVegOptions={data.hasVegOptions}
              />

              {data.popularDishes.length > 0 && (
                <div className="mt-5">
                  <h4 className="mb-2 text-sm font-semibold">Popular dishes</h4>
                  <ul className="space-y-1.5">
                    {data.popularDishes.slice(0, 3).map((dish) => (
                      <li key={dish.id} className="flex justify-between gap-3 text-sm">
                        <span className="text-foreground">{dish.name}</span>
                        <span className="tabular shrink-0 text-muted">
                          {formatNpr(dish.priceNpr)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild className="flex-1">
                  <Link to={`/restaurants/${data.slug}`}>View details</Link>
                </Button>
                <Button asChild variant="secondary" className="flex-1">
                  <a
                    href={googleMapsDirectionsUrl(
                      data.latitude,
                      data.longitude,
                      data.googlePlaceId,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink />
                    Open in Maps
                  </a>
                </Button>
                {data.phone && (
                  <Button asChild variant="secondary" size="icon" aria-label="Call">
                    <a href={`tel:${data.phone}`}>
                      <Phone />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickViewSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-32 rounded-full" />
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 flex-1" />
        </div>
      </div>
    </div>
  );
}
