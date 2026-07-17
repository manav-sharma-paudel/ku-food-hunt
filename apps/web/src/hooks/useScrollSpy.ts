import { useEffect, useState } from 'react';

/**
 * Tracks which section is currently in view for an in-page tab bar. Returns the
 * id of the topmost section whose heading has scrolled past `offset`.
 */
export function useScrollSpy(ids: string[], offset = 140): string {
  const [active, setActive] = useState(ids[0] ?? '');

  useEffect(() => {
    if (ids.length === 0) return;

    const onScroll = () => {
      let current = ids[0] ?? '';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ids, offset]);

  return active;
}
