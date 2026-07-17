import type { LucideIcon } from 'lucide-react';
import { UtensilsCrossed } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = UtensilsCrossed,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Icon className="size-7" aria-hidden strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
