import { cn } from '../../lib/cn';
import { Skeleton } from '../ui/skeleton';

/** Matches RestaurantCard geometry so loading swaps in without layout shift. */
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3', className)}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
