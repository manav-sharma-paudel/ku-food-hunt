import type { ReviewStatusValue } from '@ku-food-hunt/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { EyeOff, Flag, RotateCcw, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { Seo } from '../../components/seo/Seo';
import { Spinner } from '../../components/ui/spinner';
import { cn } from '../../lib/cn';
import { formatRelativeDate } from '../../lib/date';
import { adminEndpoints } from '../api/adminEndpoints';
import { useAdminReviews } from '../api/adminQueries';
import { AdminPageHeader } from '../components/AdminPageHeader';

type Filter = '' | ReviewStatusValue;

export default function AdminModeration() {
  const [status, setStatus] = useState<Filter>('');
  const { data, isPending, isError } = useAdminReviews({ status: status || undefined });
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };
  const moderate = useMutation({
    mutationFn: (v: { id: string; status: ReviewStatusValue }) =>
      adminEndpoints.moderateReview(v.id, { status: v.status }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminEndpoints.deleteReview(id),
    onSuccess: invalidate,
  });

  const counts = data?.counts;
  const tabs: { value: Filter; label: string; count?: number }[] = [
    { value: '', label: 'All', count: counts && counts.PUBLISHED + counts.HIDDEN + counts.FLAGGED },
    { value: 'PUBLISHED', label: 'Published', count: counts?.PUBLISHED },
    { value: 'FLAGGED', label: 'Flagged', count: counts?.FLAGGED },
    { value: 'HIDDEN', label: 'Hidden', count: counts?.HIDDEN },
  ];

  const busy = moderate.isPending || remove.isPending;

  return (
    <>
      <Seo title="Reviews" noindex />
      <AdminPageHeader title="Reviews" description="Review and moderate student reviews." />

      <div className="px-5 py-5 sm:px-8">
        <div className="mb-4 flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={cn(
                'rounded-btn px-3 py-2 text-sm font-medium transition-colors',
                status === tab.value
                  ? 'bg-primary/10 text-primary-strong'
                  : 'text-muted hover:bg-surface-2',
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs text-muted tabular-nums">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {isPending ? (
          <div className="grid place-items-center py-20">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-danger">Could not load reviews.</p>
        ) : data.data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">Nothing here.</p>
        ) : (
          <div className="space-y-3">
            {data.data.map((r) => (
              <article key={r.id} className="rounded-card border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Star className="size-3.5 fill-honey text-honey" />
                    {r.rating}
                  </span>
                  <span className="text-muted">·</span>
                  <span className="font-medium">{r.authorName || 'KU Student'}</span>
                  <span className="text-muted">on</span>
                  <Link
                    to={`/restaurants/${r.restaurantSlug}`}
                    className="font-medium text-primary-strong hover:underline"
                  >
                    {r.restaurantName}
                  </Link>
                  <StatusPill status={r.status} />
                  <span className="ml-auto text-xs text-muted">
                    {formatRelativeDate(r.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-foreground/90">{r.body}</p>
                {r.imageCount > 0 && (
                  <p className="mt-1 text-xs text-muted">{r.imageCount} photo(s) attached</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status !== 'PUBLISHED' && (
                    <ModAction
                      icon={RotateCcw}
                      label="Publish"
                      disabled={busy}
                      onClick={() => moderate.mutate({ id: r.id, status: 'PUBLISHED' })}
                    />
                  )}
                  {r.status !== 'HIDDEN' && (
                    <ModAction
                      icon={EyeOff}
                      label="Hide"
                      disabled={busy}
                      onClick={() => moderate.mutate({ id: r.id, status: 'HIDDEN' })}
                    />
                  )}
                  {r.status !== 'FLAGGED' && (
                    <ModAction
                      icon={Flag}
                      label="Flag"
                      disabled={busy}
                      onClick={() => moderate.mutate({ id: r.id, status: 'FLAGGED' })}
                    />
                  )}
                  <ModAction
                    icon={Trash2}
                    label="Delete"
                    danger
                    disabled={busy}
                    onClick={() => {
                      if (confirm('Delete this review permanently from public view?'))
                        remove.mutate(r.id);
                    }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ModAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: typeof EyeOff;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-btn border border-border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-muted hover:bg-surface-2 hover:text-foreground',
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: ReviewStatusValue }) {
  if (status === 'PUBLISHED') return null;
  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        status === 'FLAGGED' ? 'bg-honey/20 text-foreground' : 'bg-surface-2 text-muted',
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
