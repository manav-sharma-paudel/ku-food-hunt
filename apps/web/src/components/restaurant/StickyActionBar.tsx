import type { RestaurantDetailDto } from '@ku-food-hunt/shared';
import { useEffect, useState } from 'react';

import { cn } from '../../lib/cn';
import { CallButton, OpenInMapsButton } from './DetailActions';

/** Mobile-only bar with the two highest-intent actions; appears once scrolled past the header. */
export function StickyActionBar({ restaurant }: { restaurant: RestaurantDetailDto }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-14 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-md transition-transform duration-300 md:hidden',
        visible ? 'translate-y-0' : 'translate-y-[200%]',
      )}
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex gap-2">
        <OpenInMapsButton restaurant={restaurant} className="flex-1" />
        {restaurant.phone && <CallButton phone={restaurant.phone} className="flex-1" />}
      </div>
    </div>
  );
}
