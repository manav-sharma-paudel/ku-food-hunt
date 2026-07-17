import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';

import { SearchProvider } from '../search/SearchProvider';
import { Spinner } from '../ui/spinner';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { Navbar } from './Navbar';
import { SkipLink } from './SkipLink';

/** Root layout: nav + routed content + footer + mobile bottom nav. */
export function PageShell() {
  return (
    <SearchProvider>
      <div className="flex min-h-svh flex-col">
        <SkipLink />
        <Navbar />
        <main id="main" className="flex flex-1 flex-col pb-14 md:pb-0">
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center py-32">
                <Spinner className="size-6 text-primary" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
        <Footer />
        <MobileBottomNav />
        <ScrollRestoration />
      </div>
    </SearchProvider>
  );
}
