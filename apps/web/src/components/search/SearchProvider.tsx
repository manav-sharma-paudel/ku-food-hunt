import { createContext, use, useMemo, useState, type ReactNode } from 'react';

import { SearchOverlay } from './SearchOverlay';

interface SearchContextValue {
  open: () => void;
  close: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<SearchContextValue>(
    () => ({ open: () => setIsOpen(true), close: () => setIsOpen(false) }),
    [],
  );

  return (
    <SearchContext value={value}>
      {children}
      <SearchOverlay open={isOpen} onOpenChange={setIsOpen} />
    </SearchContext>
  );
}

export function useSearchOverlay(): SearchContextValue {
  const ctx = use(SearchContext);
  if (!ctx) throw new Error('useSearchOverlay must be used within SearchProvider');
  return ctx;
}
