import { UtensilsCrossed } from 'lucide-react';

import { cn } from '../../lib/cn';

interface RestaurantPinProps {
  open: boolean;
  selected: boolean;
}

/** Teardrop pin: paprika when open, muted when closed; enlarges + rings when selected. */
export function RestaurantPin({ open, selected }: RestaurantPinProps) {
  return (
    <div
      className={cn(
        'relative flex size-8 items-center justify-center rounded-full rounded-bl-none border-2 border-white shadow-md transition-transform',
        '-rotate-45',
        open ? 'bg-primary text-primary-foreground' : 'bg-muted text-white',
        selected && 'z-10 scale-125 ring-2 ring-primary ring-offset-2',
      )}
    >
      <UtensilsCrossed className="size-4 rotate-45" strokeWidth={2.4} />
    </div>
  );
}
