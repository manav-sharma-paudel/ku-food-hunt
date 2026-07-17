import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'kfh-recent-searches';
const MAX = 6;

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Recent free-text search terms, most-recent first, persisted to localStorage. */
export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => setRecent(read()), []);

  const add = useCallback((term: string) => {
    const value = term.trim();
    if (!value) return;
    setRecent((prev) => {
      const next = [value, ...prev.filter((t) => t.toLowerCase() !== value.toLowerCase())].slice(
        0,
        MAX,
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecent([]);
  }, []);

  return { recent, add, clear };
}
