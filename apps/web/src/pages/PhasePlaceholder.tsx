import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PhasePlaceholderProps {
  icon: LucideIcon;
  title: string;
  phase: string;
  description: string;
  children?: ReactNode;
}

/**
 * Interim page body for routes whose full experience lands in a later phase.
 * The shell, routing, theming, and (where shown) live data are already wired.
 */
export function PhasePlaceholder({
  icon: Icon,
  title,
  phase,
  description,
  children,
}: PhasePlaceholderProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary-strong">
        <Icon className="size-8" strokeWidth={1.5} aria-hidden />
      </div>
      <span className="mb-3 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium tracking-wide text-muted uppercase">
        {phase}
      </span>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-muted">{description}</p>
      {children && <div className="mt-8 w-full">{children}</div>}
    </div>
  );
}
