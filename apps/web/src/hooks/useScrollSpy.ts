import { useEffect, useState } from 'react';

/**
 * Tracks which section is currently in view for an in-page tab bar. Returns the
 * id of the topmost section whose heading has scrolled past `offset`.
 */
export function useScrollSpy(ids: string[], offset = 140): string {
  const [active, setActive] = useState(ids[0] ?? '');
  // Depend on the id *values*, not the array reference: callers routinely pass a
  // fresh `tabs.map(t => t.id)` every render, which would otherwise re-subscribe
  // the scroll listener on every render. Element ids never contain a newline.
  const idsKey = ids.join('\n');

  useEffect(() => {
    const list = idsKey ? idsKey.split('\n') : [];
    if (list.length === 0) return;

    const onScroll = () => {
      let current = list[0] ?? '';
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [idsKey, offset]);

  return active;
}
