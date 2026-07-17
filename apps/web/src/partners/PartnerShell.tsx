import { Outlet } from 'react-router';

import { Logo } from '../components/layout/Logo';

/**
 * Minimal chrome for the partner onboarding pages — owners arrive here from
 * partners.<domain> (or /partners) and shouldn't be distracted by the full
 * consumer navigation.
 */
export function PartnerShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
            For partners
          </span>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        KU Food Hunt · Dhulikhel · Questions? Reach us through the main site.
      </footer>
    </div>
  );
}
