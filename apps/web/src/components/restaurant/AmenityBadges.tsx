import { Bike, Leaf, QrCode } from 'lucide-react';

import { cn } from '../../lib/cn';

interface AmenityBadgesProps {
  hasQrPayment?: boolean;
  hasDelivery?: boolean;
  hasVegOptions?: boolean;
  className?: string;
}

const AMENITIES = [
  { key: 'hasQrPayment', icon: QrCode, label: 'QR payment' },
  { key: 'hasDelivery', icon: Bike, label: 'Delivery' },
  { key: 'hasVegOptions', icon: Leaf, label: 'Veg options' },
] as const;

export function AmenityBadges({ className, ...flags }: AmenityBadgesProps) {
  const active = AMENITIES.filter((a) => flags[a.key]);
  if (active.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {active.map(({ key, icon: Icon, label }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-foreground"
        >
          <Icon className="size-3.5 text-muted" />
          {label}
        </span>
      ))}
    </div>
  );
}
