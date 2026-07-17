import { formatNpr, type MenuItemDto } from '@ku-food-hunt/shared';
import { Leaf } from 'lucide-react';

import { SmartImage } from '../feedback/SmartImage';
import { DetailSection } from './RestaurantGallery';

export function PopularDishes({ dishes }: { dishes: MenuItemDto[] }) {
  if (dishes.length === 0) return null;

  return (
    <DetailSection id="popular" title="Popular dishes">
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {dishes.map((dish) => (
          <div
            key={dish.id}
            className="w-44 shrink-0 snap-start overflow-hidden rounded-card border border-border bg-surface shadow-soft"
          >
            {dish.imageUrl && <SmartImage src={dish.imageUrl} alt={dish.name} ratio="4/3" />}
            <div className="p-3">
              <p className="flex items-center gap-1 text-sm font-medium">
                {dish.name}
                {dish.isVegetarian && <Leaf className="size-3.5 text-basil" />}
              </p>
              <p className="tabular mt-1 text-sm text-muted">{formatNpr(dish.priceNpr)}</p>
            </div>
          </div>
        ))}
      </div>
    </DetailSection>
  );
}
