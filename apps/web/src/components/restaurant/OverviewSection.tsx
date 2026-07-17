import type { RestaurantDetailDto } from '@ku-food-hunt/shared';
import { MapPin, Phone } from 'lucide-react';

import { AmenityBadges } from './AmenityBadges';
import { DetailSection } from './RestaurantGallery';
import { OpeningHoursAccordion } from './OpeningHoursAccordion';

export function OverviewSection({ restaurant }: { restaurant: RestaurantDetailDto }) {
  const hasAmenities =
    restaurant.hasQrPayment || restaurant.hasDelivery || restaurant.hasVegOptions;

  return (
    <DetailSection id="overview" title="Overview">
      {restaurant.description && (
        <p className="max-w-2xl leading-relaxed text-foreground/90">{restaurant.description}</p>
      )}

      {hasAmenities && (
        <AmenityBadges
          className="mt-5"
          hasQrPayment={restaurant.hasQrPayment}
          hasDelivery={restaurant.hasDelivery}
          hasVegOptions={restaurant.hasVegOptions}
        />
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-4">
          <InfoRow icon={MapPin} label="Address">
            {restaurant.address}
          </InfoRow>
          {restaurant.phone && (
            <InfoRow icon={Phone} label="Phone">
              <a href={`tel:${restaurant.phone}`} className="hover:underline">
                {restaurant.phone}
              </a>
            </InfoRow>
          )}
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-muted">Hours</p>
          <OpeningHoursAccordion hours={restaurant.openingHours} />
        </div>
      </div>
    </DetailSection>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" />
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="text-foreground">{children}</p>
      </div>
    </div>
  );
}
