import { RefreshCw, TriangleAlert } from 'lucide-react';

import { ApiError } from '../../api/client';
import { cn } from '../../lib/cn';
import { Button } from '../ui/button';

interface ErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  const message =
    error instanceof ApiError
      ? error.message
      : 'Something went wrong while loading this. Please try again.';

  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center justify-center px-6 py-16 text-center', className)}
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-danger/12 text-danger">
        <TriangleAlert className="size-7" aria-hidden strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Couldn’t load this</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          <RefreshCw />
          Try again
        </Button>
      )}
    </div>
  );
}
