import type { AdminRestaurantDto } from '@ku-food-hunt/shared';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Mail, Phone, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../../components/ui/dialog';
import { formatRelativeDate } from '../../../lib/date';
import { adminEndpoints } from '../../api/adminEndpoints';
import { useSaveRestaurant } from '../../pages/AdminRestaurantEditor';

/**
 * Shown above the editor tabs for partner submissions. The tabs themselves are
 * the detail view — this banner carries the submitter context and the decision.
 */
export function SubmissionBanner({ restaurant }: { restaurant: AdminRestaurantDto }) {
  const onSaved = useSaveRestaurant(restaurant.id);
  const [rejectOpen, setRejectOpen] = useState(false);

  const approve = useMutation({
    mutationFn: () => adminEndpoints.approveSubmission(restaurant.id),
    onSuccess: onSaved,
  });

  if (restaurant.status !== 'PENDING' && restaurant.status !== 'REJECTED') return null;
  const pending = restaurant.status === 'PENDING';

  return (
    <div
      className={
        pending
          ? 'mt-4 rounded-card border border-primary/25 bg-primary/5 p-4'
          : 'mt-4 rounded-card border border-danger/25 bg-danger/5 p-4'
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="font-semibold">
            {pending ? 'Partner submission — awaiting review' : 'Submission rejected'}
            {restaurant.submittedAt && (
              <span className="ml-2 font-normal text-muted">
                submitted {formatRelativeDate(restaurant.submittedAt)}
              </span>
            )}
          </p>

          {!pending && restaurant.rejectionReason && (
            <p className="mt-1 text-muted">
              Reason sent to the owner: “{restaurant.rejectionReason}” — they can edit and resubmit
              via their emailed link.
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
            {restaurant.submitterName && (
              <span className="font-medium text-foreground">{restaurant.submitterName}</span>
            )}
            {restaurant.submitterEmail && (
              <a
                href={`mailto:${restaurant.submitterEmail}`}
                className="inline-flex items-center gap-1 hover:underline"
              >
                <Mail className="size-3.5" />
                {restaurant.submitterEmail}
              </a>
            )}
            {restaurant.submitterPhone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" />
                {restaurant.submitterPhone}
              </span>
            )}
          </div>

          {(restaurant.legalName || restaurant.websiteUrl) && (
            <p className="mt-1.5 text-xs text-muted">
              {restaurant.legalName && <>Legal name: {restaurant.legalName}</>}
              {restaurant.legalName && restaurant.websiteUrl && ' · '}
              {restaurant.websiteUrl && <>Link: {restaurant.websiteUrl}</>}
            </p>
          )}
        </div>

        {pending && (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (confirm(`Approve and publish “${restaurant.name}”?`)) approve.mutate();
              }}
              disabled={approve.isPending}
            >
              {approve.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Approve & publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-danger/40 text-danger hover:bg-danger/10"
              onClick={() => setRejectOpen(true)}
            >
              <XCircle />
              Reject
            </Button>
          </div>
        )}
      </div>

      {approve.error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          Could not approve: {approve.error.message}
        </p>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          {rejectOpen && <RejectForm restaurant={restaurant} onDone={() => setRejectOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RejectForm({
  restaurant,
  onDone,
}: {
  restaurant: AdminRestaurantDto;
  onDone: () => void;
}) {
  const onSaved = useSaveRestaurant(restaurant.id);
  const [reason, setReason] = useState('');

  const reject = useMutation({
    mutationFn: () => adminEndpoints.rejectSubmission(restaurant.id, reason.trim()),
    onSuccess: (updated) => {
      onSaved(updated);
      onDone();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (reason.trim().length >= 3) reject.mutate();
      }}
      className="p-6"
    >
      <DialogTitle className="text-lg font-semibold">Reject this submission?</DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted">
        The reason is emailed to {restaurant.submitterName || 'the owner'} along with a link to fix
        and resubmit. Be specific about what needs to change.
      </DialogDescription>

      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 500))}
        rows={4}
        autoFocus
        placeholder="e.g. The cover photo is too blurry, and the pin is on the wrong building."
        className="mt-4 w-full resize-y rounded-btn border border-border bg-surface-2/40 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary focus:bg-surface"
      />

      {reject.error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          Could not reject: {reject.error.message}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={reason.trim().length < 3 || reject.isPending}
        >
          {reject.isPending && <Loader2 className="animate-spin" />}
          Reject & email owner
        </Button>
      </div>
    </form>
  );
}
