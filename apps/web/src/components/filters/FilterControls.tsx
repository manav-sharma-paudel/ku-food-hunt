import { PRICE_BANDS, PRICE_BAND_LABELS, formatDistance } from '@ku-food-hunt/shared';
import { MapPin } from 'lucide-react';
import type { ReactNode } from 'react';

import { useCategories } from '../../api/queries';
import type { GeolocationStatus } from '../../hooks/useGeolocation';
import { useExploreFilters, type BoolFilterKey } from '../../hooks/useExploreFilters';
import { cn } from '../../lib/cn';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';

interface FilterControlsProps {
  geo: { status: GeolocationStatus; request: () => void; hasCoords: boolean };
}

const RATING_OPTIONS = [
  { value: null, label: 'Any' },
  { value: 3.5, label: '3.5+' },
  { value: 4, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
];

const TOGGLES: { key: BoolFilterKey; label: string }[] = [
  { key: 'open', label: 'Open now' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'qr', label: 'QR payment' },
  { key: 'veg', label: 'Vegetarian options' },
];

export function FilterControls({ geo }: FilterControlsProps) {
  const { data: categories } = useCategories();
  const { filters, togglePrice, setMinRating, toggleBool, setDistance, toggleCategory } =
    useExploreFilters();

  return (
    <div className="space-y-6">
      <FilterSection label="Price">
        <div className="space-y-2.5">
          {PRICE_BANDS.map((band) => (
            <label key={band} className="flex cursor-pointer items-center gap-3 text-sm">
              <Checkbox
                checked={filters.price.includes(band)}
                onCheckedChange={() => togglePrice(band)}
              />
              {PRICE_BAND_LABELS[band]}
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Minimum rating">
        <div className="flex gap-2">
          {RATING_OPTIONS.map((opt) => {
            const active = filters.minRating === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => setMinRating(opt.value)}
                className={cn(
                  'flex-1 rounded-btn border px-2 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary-strong'
                    : 'border-border hover:bg-surface-2',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      <FilterSection label="Distance">
        {geo.hasCoords ? (
          <div>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted">Within</span>
              <span className="font-medium">{formatDistance(filters.distance ?? 5000)}</span>
            </div>
            <Slider
              min={500}
              max={5000}
              step={250}
              value={[filters.distance ?? 5000]}
              onValueChange={([v]) => setDistance(!v || v >= 5000 ? null : v)}
              aria-label="Maximum distance"
            />
          </div>
        ) : geo.status === 'denied' ? (
          <p className="text-sm text-muted">
            Location is blocked. Enable it in your browser to filter by distance.
          </p>
        ) : (
          <button
            onClick={geo.request}
            className="flex items-center gap-2 rounded-btn border border-border px-3 py-2 text-sm font-medium hover:bg-surface-2"
          >
            <MapPin className="size-4 text-primary" />
            {geo.status === 'prompting' ? 'Requesting…' : 'Enable location'}
          </button>
        )}
      </FilterSection>

      <FilterSection label="Options">
        <div className="space-y-3">
          {TOGGLES.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center justify-between text-sm">
              {label}
              <Switch checked={filters[key]} onCheckedChange={() => toggleBool(key)} />
            </label>
          ))}
        </div>
      </FilterSection>

      {categories && categories.length > 0 && (
        <FilterSection label="Category">
          <div className="space-y-2.5">
            {categories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={filters.categories.includes(c.slug)}
                  onCheckedChange={() => toggleCategory(c.slug)}
                />
                <span className="flex-1">{c.name}</span>
                <span className="text-xs text-muted">{c.restaurantCount}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{label}</h3>
      {children}
    </div>
  );
}
