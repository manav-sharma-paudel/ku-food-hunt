import { Check, Loader2 } from 'lucide-react';

import { ApiError } from '../../../api/client';
import { Button } from '../../../components/ui/button';

interface SaveButtonProps {
  onSave: () => void;
  isPending: boolean;
  isSuccess: boolean;
  error?: unknown;
  disabled?: boolean;
  label?: string;
}

/** Consistent save affordance for every editor tab: button + inline success/error. */
export function SaveButton({
  onSave,
  isPending,
  isSuccess,
  error,
  disabled,
  label = 'Save changes',
}: SaveButtonProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" onClick={onSave} disabled={isPending || disabled}>
        {isPending && <Loader2 className="animate-spin" />}
        {label}
      </Button>
      {isSuccess && !isPending && (
        <span className="inline-flex items-center gap-1 text-xs text-basil">
          <Check className="size-3.5" /> Saved
        </span>
      )}
      {error != null && (
        <span className="text-xs text-danger">
          {error instanceof ApiError ? error.message : 'Could not save.'}
        </span>
      )}
    </div>
  );
}
