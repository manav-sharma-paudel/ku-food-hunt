import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { useExploreFilters } from '../../hooks/useExploreFilters';
import type { GeolocationStatus } from '../../hooks/useGeolocation';
import { Button } from '../ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '../ui/sheet';
import { FilterControls } from './FilterControls';

interface FilterSheetProps {
  geo: { status: GeolocationStatus; request: () => void; hasCoords: boolean };
  resultCount: number;
}

/** Mobile filter entry point: a button with an active-count badge opening a bottom sheet. */
export function FilterSheet({ geo, resultCount }: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const { activeCount, clearFilters } = useExploreFilters();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary-strong text-xs font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="flex max-h-[88vh] flex-col" showClose={false}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <SheetTitle className="text-lg font-semibold">Filters</SheetTitle>
          {activeCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm font-medium text-primary-strong hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <FilterControls geo={geo} />
        </div>

        <div className="border-t border-border p-4">
          <SheetClose asChild>
            <Button className="w-full" size="lg">
              Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
