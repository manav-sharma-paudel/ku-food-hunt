import { PRICE_BAND_LABELS, formatDistance } from '@ku-food-hunt/shared';
import { Search, X } from 'lucide-react';

import { useCategories } from '../../api/queries';
import { useExploreFilters } from '../../hooks/useExploreFilters';

const BOOL_LABELS = {
  open: 'Open now',
  delivery: 'Delivery',
  qr: 'QR payment',
  veg: 'Vegetarian',
} as const;

export function ActiveFilterPills() {
  const { data: categories } = useCategories();
  const {
    filters,
    activeCount,
    togglePrice,
    setMinRating,
    toggleBool,
    setDistance,
    toggleCategory,
    setQuery,
    clearFilters,
  } = useExploreFilters();

  if (activeCount === 0 && !filters.q) return null;

  const categoryName = (slug: string) => categories?.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.q && (
        <Pill
          label={`“${filters.q}”`}
          icon={<Search className="size-3.5 text-muted" />}
          onRemove={() => setQuery('')}
        />
      )}
      {filters.categories.map((slug) => (
        <Pill key={slug} label={categoryName(slug)} onRemove={() => toggleCategory(slug)} />
      ))}
      {filters.price.map((band) => (
        <Pill key={band} label={PRICE_BAND_LABELS[band]} onRemove={() => togglePrice(band)} />
      ))}
      {filters.minRating && (
        <Pill label={`${filters.minRating}+ stars`} onRemove={() => setMinRating(null)} />
      )}
      {(['open', 'delivery', 'qr', 'veg'] as const).map((key) =>
        filters[key] ? (
          <Pill key={key} label={BOOL_LABELS[key]} onRemove={() => toggleBool(key)} />
        ) : null,
      )}
      {filters.distance && (
        <Pill
          label={`Within ${formatDistance(filters.distance)}`}
          onRemove={() => setDistance(null)}
        />
      )}

      {activeCount > 0 && (
        <button
          onClick={clearFilters}
          className="ml-1 text-sm font-medium text-primary-strong hover:underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function Pill({
  label,
  icon,
  onRemove,
}: {
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pr-1.5 pl-3 text-sm">
      {icon}
      {label}
      <button
        onClick={onRemove}
        className="flex size-5 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-foreground"
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
