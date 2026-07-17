import { Star } from 'lucide-react';

import { cn } from '../../lib/cn';

interface RatingStarsProps {
  value: number;
  count?: number;
  showCount?: boolean;
  /** Compact = single star + number (cards); full = five fractional stars (summaries). */
  variant?: 'compact' | 'full';
  className?: string;
}

export function RatingStars({
  value,
  count,
  showCount = false,
  variant = 'compact',
  className,
}: RatingStarsProps) {
  if (variant === 'compact') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-sm', className)}>
        <Star className="size-4 fill-honey text-honey" aria-hidden />
        <span className="tabular font-medium">{value.toFixed(1)}</span>
        {showCount && count !== undefined && <span className="text-muted">({count})</span>}
      </span>
    );
  }

  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      <span className="relative inline-flex">
        <span className="flex text-border">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="size-4" fill="currentColor" />
          ))}
        </span>
        <span
          className="absolute inset-0 flex overflow-hidden text-honey"
          style={{ width: `${pct}%` }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className="size-4 shrink-0" fill="currentColor" />
          ))}
        </span>
      </span>
      {showCount && count !== undefined && (
        <span className="text-sm text-muted">
          {value.toFixed(1)} ({count})
        </span>
      )}
    </span>
  );
}
