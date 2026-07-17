import { Link } from 'react-router';

import { cn } from '../../lib/cn';

/** Wordmark + steaming-bowl mark. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}
      aria-label="KU Food Hunt — home"
    >
      <span
        className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-5" strokeWidth={2}>
          <path
            d="M6 5c0-1 .8-1.6 1.4-.8M10 4.6c0-1 .8-1.6 1.4-.8M14 5c0-1 .8-1.6 1.4-.8"
            stroke="currentColor"
            strokeLinecap="round"
          />
          <path
            d="M3.5 10.5h17a8.5 8.5 0 0 1-8.5 8 8.5 8.5 0 0 1-8.5-8Z"
            stroke="currentColor"
            strokeLinejoin="round"
          />
          <path d="M2.5 21h19" stroke="currentColor" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-lg">
        KU <span className="text-primary-strong">Food</span> Hunt
      </span>
    </Link>
  );
}
