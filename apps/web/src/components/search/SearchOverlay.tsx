import * as DialogPrimitive from '@radix-ui/react-dialog';
import { formatNpr } from '@ku-food-hunt/shared';
import { Clock, Search, Store, Tag, UtensilsCrossed, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { useHome, useSearchSuggest } from '../../api/queries';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useRecentSearches } from '../../hooks/useRecentSearches';
import { cn } from '../../lib/cn';
import { SmartImage } from '../feedback/SmartImage';
import { Spinner } from '../ui/spinner';

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query.trim(), 220);
  const navigate = useNavigate();
  const { recent, add: addRecent, clear: clearRecent } = useRecentSearches();
  const { data: home } = useHome();
  const { data: suggestions, isFetching } = useSearchSuggest(debounced);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  function go(to: string) {
    onOpenChange(false);
    navigate(to);
  }

  function submitTerm(term: string) {
    const value = term.trim();
    if (!value) return;
    addRecent(value);
    go(`/explore?q=${encodeURIComponent(value)}`);
  }

  const showSuggestions = debounced.length >= 1;
  const hasResults =
    suggestions &&
    (suggestions.restaurants.length > 0 ||
      suggestions.dishes.length > 0 ||
      suggestions.categories.length > 0);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out data-[state=open]:fade-in" />
        <DialogPrimitive.Content
          className="fixed top-[8vh] left-1/2 z-50 flex max-h-[84vh] w-[92vw] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-sheet border border-border bg-surface shadow-lift data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-top-4"
          aria-label="Search"
        >
          <DialogPrimitive.Title className="sr-only">
            Search restaurants and dishes
          </DialogPrimitive.Title>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitTerm(query);
            }}
            className="flex items-center gap-3 border-b border-border px-4"
          >
            {isFetching ? (
              <Spinner className="size-5 text-muted" />
            ) : (
              <Search className="size-5 shrink-0 text-muted" />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search momo, cafés, thakali…"
              className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              aria-label="Search query"
            />
            <DialogPrimitive.Close className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-foreground">
              <X className="size-5" />
              <span className="sr-only">Close search</span>
            </DialogPrimitive.Close>
          </form>

          <div className="overflow-y-auto p-2">
            {!showSuggestions ? (
              <EmptyPanel
                recent={recent}
                popular={home?.popularSearches ?? []}
                onPick={submitTerm}
                onClearRecent={clearRecent}
              />
            ) : hasResults ? (
              <div className="py-1">
                {suggestions.restaurants.length > 0 && (
                  <Group label="Restaurants">
                    {suggestions.restaurants.map((r) => (
                      <button
                        key={r.slug}
                        onClick={() => go(`/restaurants/${r.slug}`)}
                        className="flex w-full items-center gap-3 rounded-btn px-3 py-2 text-left hover:bg-surface-2"
                      >
                        <SmartImage
                          src={r.coverImageUrl}
                          alt=""
                          ratio="1/1"
                          containerClassName="size-9 shrink-0 rounded-lg"
                        />
                        <span className="flex-1 truncate text-sm font-medium">{r.name}</span>
                        <Store className="size-4 text-muted" />
                      </button>
                    ))}
                  </Group>
                )}

                {suggestions.dishes.length > 0 && (
                  <Group label="Dishes">
                    {suggestions.dishes.map((d, i) => (
                      <button
                        key={`${d.restaurantSlug}-${d.name}-${i}`}
                        onClick={() => go(`/restaurants/${d.restaurantSlug}`)}
                        className="flex w-full items-center gap-3 rounded-btn px-3 py-2 text-left hover:bg-surface-2"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                          <UtensilsCrossed className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{d.name}</span>
                          <span className="block truncate text-xs text-muted">
                            {formatNpr(d.priceNpr)} · {d.restaurantName}
                          </span>
                        </span>
                      </button>
                    ))}
                  </Group>
                )}

                {suggestions.categories.length > 0 && (
                  <Group label="Categories">
                    {suggestions.categories.map((c) => (
                      <button
                        key={c.slug}
                        onClick={() => go(`/explore?categories=${c.slug}`)}
                        className="flex w-full items-center gap-3 rounded-btn px-3 py-2 text-left hover:bg-surface-2"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
                          <Tag className="size-4" />
                        </span>
                        <span className="flex-1 truncate text-sm font-medium">{c.name}</span>
                      </button>
                    ))}
                  </Group>
                )}
              </div>
            ) : (
              !isFetching && (
                <p className="px-3 py-8 text-center text-sm text-muted">
                  No matches for “{debounced}”. Press Enter to search all restaurants.
                </p>
              )
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

function EmptyPanel({
  recent,
  popular,
  onPick,
  onClearRecent,
}: {
  recent: string[];
  popular: string[];
  onPick: (term: string) => void;
  onClearRecent: () => void;
}) {
  return (
    <div className="p-2">
      {recent.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs font-semibold tracking-wide text-muted uppercase">Recent</span>
            <button onClick={onClearRecent} className="text-xs text-muted hover:text-foreground">
              Clear
            </button>
          </div>
          {recent.map((term) => (
            <button
              key={term}
              onClick={() => onPick(term)}
              className="flex w-full items-center gap-3 rounded-btn px-3 py-2 text-left text-sm hover:bg-surface-2"
            >
              <Clock className="size-4 text-muted" />
              {term}
            </button>
          ))}
        </div>
      )}

      {popular.length > 0 && (
        <div className="px-2 pb-2">
          <span className="text-xs font-semibold tracking-wide text-muted uppercase">Popular</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {popular.map((term) => (
              <button
                key={term}
                onClick={() => onPick(term)}
                className={cn(
                  'rounded-full border border-border bg-surface px-3 py-1.5 text-sm capitalize',
                  'transition-colors hover:bg-surface-2',
                )}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
