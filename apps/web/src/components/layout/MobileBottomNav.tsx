import { motion, useReducedMotion } from 'motion/react';
import { Search } from 'lucide-react';
import { NavLink } from 'react-router';

import { cn } from '../../lib/cn';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import { useSearchOverlay } from '../search/SearchProvider';
import { PRIMARY_LINKS } from './nav-links';

export function MobileBottomNav() {
  const direction = useScrollDirection();
  const reduceMotion = useReducedMotion();
  const search = useSearchOverlay();
  const hidden = direction === 'down';

  return (
    <nav
      aria-label="Bottom navigation"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md transition-transform duration-300 md:hidden',
        hidden && 'translate-y-full',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex h-14 max-w-md items-stretch justify-around">
        {PRIMARY_LINKS.map((link) => (
          <li key={link.to} className="flex-1">
            <NavLink
              to={link.to}
              end={link.end}
              className="group relative flex h-full flex-col items-center justify-center gap-0.5 text-muted"
            >
              {({ isActive }) => (
                <>
                  {isActive && !reduceMotion && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute top-0 h-0.5 w-8 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    />
                  )}
                  <link.icon
                    className={cn('size-5 transition-colors', isActive && 'text-primary-strong')}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  <span
                    className={cn('text-[11px] font-medium', isActive && 'text-primary-strong')}
                  >
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex-1">
          <button
            type="button"
            onClick={search.open}
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-muted"
          >
            <Search className="size-5" strokeWidth={2} />
            <span className="text-[11px] font-medium">Search</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
