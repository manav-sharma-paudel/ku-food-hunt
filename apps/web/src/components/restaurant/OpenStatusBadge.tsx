import type { OpeningHourSlot } from '@ku-food-hunt/shared';

import { cn } from '../../lib/cn';
import { openStatus } from './open-status';

interface OpenStatusBadgeProps {
  todayHours: OpeningHourSlot[];
  isOpenNow: boolean;
  /** solid = over an image (cards); soft = on a surface (detail/summary). */
  variant?: 'solid' | 'soft';
  showLabel?: boolean;
  className?: string;
}

export function OpenStatusBadge({
  todayHours,
  isOpenNow,
  variant = 'solid',
  showLabel = false,
  className,
}: OpenStatusBadgeProps) {
  const { open, label } = openStatus(todayHours, isOpenNow);
  const text = showLabel ? label : open ? 'Open' : 'Closed';

  const styles =
    variant === 'solid'
      ? open
        ? 'bg-basil text-basil-foreground'
        : 'bg-danger text-danger-foreground'
      : open
        ? 'bg-basil/12 text-basil'
        : 'bg-danger/12 text-danger';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        styles,
        className,
      )}
    >
      <span
        className={cn('size-1.5 rounded-full', open ? 'bg-current' : 'bg-current opacity-70')}
      />
      {text}
    </span>
  );
}
