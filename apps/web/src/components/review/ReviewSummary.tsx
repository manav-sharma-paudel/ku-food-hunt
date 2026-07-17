import { RatingStars } from '../restaurant/RatingStars';

interface ReviewSummaryProps {
  avgRating: number;
  reviewCount: number;
  /** index 0 = 1★ … index 4 = 5★ */
  distribution: number[];
}

export function ReviewSummary({ avgRating, reviewCount, distribution }: ReviewSummaryProps) {
  const max = Math.max(1, ...distribution);

  return (
    <div className="flex flex-col gap-6 rounded-card border border-border bg-surface p-5 sm:flex-row sm:items-center">
      <div className="flex flex-col items-center justify-center sm:w-40">
        <span className="text-5xl font-semibold tracking-tight tabular-nums">
          {avgRating.toFixed(1)}
        </span>
        <RatingStars value={avgRating} variant="full" className="mt-2" />
        <span className="mt-1.5 text-sm text-muted">
          {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star - 1] ?? 0;
          return (
            <div key={star} className="flex items-center gap-3 text-sm">
              <span className="w-3 text-right text-muted tabular-nums">{star}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-honey"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
