import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { cn } from '../../lib/cn';

interface SectionProps {
  title?: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
  children: ReactNode;
  className?: string;
}

/** Standard content section: optional heading row with a "see all" link + body. */
export function Section({
  title,
  subtitle,
  seeAllHref,
  seeAllLabel = 'See all',
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn('py-10 sm:py-14', className)}>
      {(title || seeAllHref) && (
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
            )}
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          {seeAllHref && (
            <Link
              to={seeAllHref}
              className="shrink-0 text-sm font-medium text-primary-strong hover:underline"
            >
              {seeAllLabel} →
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
