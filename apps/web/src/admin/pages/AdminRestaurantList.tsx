import type { RestaurantStatusValue } from '@ku-food-hunt/shared';
import { Plus, Search, Sparkles, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { Seo } from '../../components/seo/Seo';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { cn } from '../../lib/cn';
import { formatRelativeDate } from '../../lib/date';
import { useAdminRestaurants } from '../api/adminQueries';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminInput } from '../components/adminStyles';

const STATUS_TABS: { value: '' | RestaurantStatusValue; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export default function AdminRestaurantList() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | RestaurantStatusValue>('');
  const { data, isPending, isError } = useAdminRestaurants({}); // small set — filter client-side

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => (status ? r.status === status : true))
      .filter((r) => (term ? r.name.toLowerCase().includes(term) : true));
  }, [data, q, status]);

  const pendingCount = useMemo(
    () => (data ?? []).filter((r) => r.status === 'PENDING').length,
    [data],
  );

  return (
    <>
      <Seo title="Restaurants" noindex />
      <AdminPageHeader
        title="Restaurants"
        description={data ? `${data.length} total` : undefined}
        action={
          <Button asChild size="sm">
            <Link to="/admin/restaurants/new">
              <Plus />
              New restaurant
            </Link>
          </Button>
        }
      />

      <div className="px-5 py-5 sm:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name…"
              className={cn(adminInput, 'pl-9')}
            />
          </div>
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-btn px-3 py-2 text-sm font-medium transition-colors',
                  status === tab.value
                    ? 'bg-primary/10 text-primary-strong'
                    : 'text-muted hover:bg-surface-2',
                )}
              >
                {tab.label}
                {tab.value === 'PENDING' && pendingCount > 0 && (
                  <span className="rounded-full bg-primary-strong px-1.5 py-0.5 text-[11px] leading-none font-semibold text-primary-foreground">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isPending ? (
          <div className="grid place-items-center py-20">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : isError ? (
          <p className="text-sm text-danger">Could not load restaurants.</p>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">No restaurants match.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="border-b border-border bg-surface-2/50 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Rating</th>
                  <th className="px-4 py-2.5 font-medium">Updated</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.id} className="bg-surface hover:bg-surface-2/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium">
                        {r.isFeatured && <Sparkles className="size-3.5 text-primary-strong" />}
                        {r.name}
                      </div>
                      <div className="text-xs text-muted">
                        {(r.status === 'PENDING' || r.status === 'REJECTED') && r.submitterName
                          ? `Submitted by ${r.submitterName} · ${r.submitterEmail ?? ''}`
                          : r.categoryNames.join(', ') || 'No categories'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.reviewCount > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="size-3.5 fill-honey text-honey" />
                          {r.avgRating.toFixed(1)}
                          <span className="text-muted">({r.reviewCount})</span>
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatRelativeDate(r.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/restaurants/${r.id}`}
                        className="font-medium text-primary-strong hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export function StatusBadge({ status }: { status: RestaurantStatusValue }) {
  const styles: Record<RestaurantStatusValue, string> = {
    PUBLISHED: 'bg-basil/12 text-basil',
    PENDING: 'bg-primary/10 text-primary-strong',
    DRAFT: 'bg-honey/20 text-foreground',
    REJECTED: 'bg-danger/10 text-danger',
    ARCHIVED: 'bg-surface-2 text-muted',
  };
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        styles[status],
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
