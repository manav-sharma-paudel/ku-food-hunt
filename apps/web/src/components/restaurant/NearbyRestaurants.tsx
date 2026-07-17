import type { RestaurantCardDto } from '@ku-food-hunt/shared';

import { RestaurantCard } from './RestaurantCard';
import { DetailSection } from './RestaurantGallery';

export function NearbyRestaurants({ restaurants }: { restaurants: RestaurantCardDto[] }) {
  if (restaurants.length === 0) return null;

  return (
    <DetailSection id="nearby" title="More places nearby">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {restaurants.map((r) => (
          <RestaurantCard key={r.id} restaurant={r} />
        ))}
      </div>
    </DetailSection>
  );
}
