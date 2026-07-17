import { PRICE_BAND_LABELS, formatDistance, type MapRestaurantDto } from '@ku-food-hunt/shared';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { cn } from '../../lib/cn';
import { SmartImage } from '../feedback/SmartImage';
import { OpenStatusBadge } from '../restaurant/OpenStatusBadge';
import { RatingStars } from '../restaurant/RatingStars';

interface MapListPanelProps {
  restaurants: MapRestaurantDto[];
  selectedId: string | null;
  collapsed: boolean;
  distanceFor: (r: MapRestaurantDto) => number | null;
  onSelect: (r: MapRestaurantDto) => void;
  onHover: (id: string | null) => void;
  onToggleCollapse: () => void;
}

/** Desktop-only list synced with the map: hover highlights a pin, click selects it. */
export function MapListPanel({
  restaurants,
  selectedId,
  collapsed,
  distanceFor,
  onSelect,
  onHover,
  onToggleCollapse,
}: MapListPanelProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex h-full flex-col border-r border-border bg-surface transition-[width] duration-300',
        collapsed ? 'w-0' : 'w-80',
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        {!collapsed && (
          <span className="text-sm font-semibold">
            {restaurants.length} {restaurants.length === 1 ? 'place' : 'places'}
          </span>
        )}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand list' : 'Collapse list'}
          className={cn(
            'flex size-8 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground',
            collapsed && 'absolute left-2 top-2 z-10 bg-surface shadow-soft',
          )}
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </button>
      </div>

      {!collapsed && (
        <ul className="flex-1 overflow-y-auto">
          {restaurants.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onSelect(r)}
                onMouseEnter={() => onHover(r.id)}
                onMouseLeave={() => onHover(null)}
                className={cn(
                  'flex w-full gap-3 border-b border-border p-3 text-left transition-colors hover:bg-surface-2',
                  selectedId === r.id && 'bg-surface-2',
                )}
              >
                <SmartImage
                  src={r.coverImageUrl}
                  alt={r.name}
                  ratio="1/1"
                  containerClassName="size-16 shrink-0 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <RatingStars value={r.avgRating} />
                    <OpenStatusBadge
                      todayHours={r.todayHours}
                      isOpenNow={r.isOpenNow}
                      variant="soft"
                    />
                  </div>
                  <p className="mt-1 truncate text-xs text-muted">
                    {r.primaryCategory?.name ?? 'Restaurant'} · {PRICE_BAND_LABELS[r.priceBand]}
                    {(() => {
                      const d = distanceFor(r);
                      return typeof d === 'number' ? ` · ${formatDistance(d)}` : '';
                    })()}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
