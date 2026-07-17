import { Menu, Search } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router';

import { cn } from '../../lib/cn';
import { useSearchOverlay } from '../search/SearchProvider';
import { Button } from '../ui/button';
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Logo } from './Logo';
import { PRIMARY_LINKS, SECONDARY_LINKS } from './nav-links';
import { ThemeToggle } from './ThemeToggle';

const DESKTOP_LINKS = [
  ...PRIMARY_LINKS.filter((l) => l.to !== '/'),
  ...SECONDARY_LINKS.map((l) => ({ ...l, end: false })),
];

function desktopLinkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'rounded-btn px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-primary-strong' : 'text-foreground hover:bg-surface-2',
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const search = useSearchOverlay();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {DESKTOP_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={desktopLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            onClick={search.open}
            className="hidden h-10 gap-2 rounded-full px-4 text-muted sm:inline-flex"
          >
            <Search className="size-4" />
            <span className="text-sm">Search…</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            aria-label="Search"
            onClick={search.open}
          >
            <Search />
          </Button>

          <ThemeToggle />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-full flex-col p-6">
                <Logo className="mb-8" />
                <nav className="flex flex-col gap-1" aria-label="Mobile">
                  {DESKTOP_LINKS.map((link) => (
                    <SheetClose asChild key={link.to}>
                      <NavLink
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) =>
                          cn(
                            'rounded-btn px-3 py-3 text-base font-medium transition-colors',
                            isActive
                              ? 'bg-surface-2 text-primary-strong'
                              : 'text-foreground hover:bg-surface-2',
                          )
                        }
                      >
                        {link.label}
                      </NavLink>
                    </SheetClose>
                  ))}
                </nav>
                <a
                  href="mailto:hello@kufoodhunt.com?subject=Restaurant suggestion"
                  className="mt-auto text-sm text-muted hover:text-foreground"
                >
                  Suggest a restaurant →
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
