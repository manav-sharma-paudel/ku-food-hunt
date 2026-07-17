import { useExploreFilters } from '../../hooks/useExploreFilters';
import type { GeolocationStatus } from '../../hooks/useGeolocation';
import { cn } from '../../lib/cn';
import { FilterControls } from './FilterControls';

interface FilterSidebarProps {
  geo: { status: GeolocationStatus; request: () => void; hasCoords: boolean };
  className?: string;
}

export function FilterSidebar({ geo, className }: FilterSidebarProps) {
  const { activeCount, clearFilters } = useExploreFilters();

  return (
    <aside className={cn('w-70 shrink-0', className)} aria-label="Filters">
      <div className="sticky top-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Filters</h2>
          {activeCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-primary-strong hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <FilterControls geo={geo} />
      </div>
    </aside>
  );
}
