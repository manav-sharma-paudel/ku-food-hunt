import { useEffect, useState } from 'react';

/** "up" | "down" scroll direction, with a small threshold and a top-of-page reset. */
export function useScrollDirection(threshold = 8): 'up' | 'down' {
  const [direction, setDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) >= threshold) {
        setDirection(y > lastY && y > 64 ? 'down' : 'up');
        lastY = y;
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return direction;
}
