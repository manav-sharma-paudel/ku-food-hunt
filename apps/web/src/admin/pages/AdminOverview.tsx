import { Inbox, Sparkles, Store, MessageSquareText } from 'lucide-react';
import { Link } from 'react-router';

import { Seo } from '../../components/seo/Seo';
import { Spinner } from '../../components/ui/spinner';
import { formatRelativeDate } from '../../lib/date';
import { useAdminOverview } from '../api/adminQueries';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminCard } from '../components/adminStyles';

const ACTION_LABELS: Record<string, string> = {
  'admin.login': 'signed in',
  'restaurant.create': 'created a restaurant',
  'restaurant.update': 'edited a restaurant',
  'restaurant.delete': 'archived a restaurant',
  'restaurant.hours': 'updated hours',
  'restaurant.menu': 'updated the menu',
  'restaurant.image.add': 'added a photo',
  'restaurant.image.update': 'updated a photo',
  'restaurant.image.delete': 'removed a photo',
  'restaurant.image.reorder': 'reordered photos',
  'restaurant.approve': 'approved a partner submission',
  'restaurant.reject': 'rejected a partner submission',
  'review.published': 'restored a review',
  'review.hidden': 'hid a review',
  'review.flagged': 'flagged a review',
  'review.delete': 'deleted a review',
  'settings.featured': 'updated the featured list',
  'settings.hero': 'edited the homepage hero',
};

export default function AdminOverview() {
  const { data, isPending, isError } = useAdminOverview();

  return (
    <>
      <Seo title="Admin overview" noindex />
      <AdminPageHeader title="Overview" description="Everything at a glance." />

      <div className="px-5 py-6 sm:px-8">
        {isPending ? (
          <div className="grid place-items-center py-20">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-danger">Could not load the dashboard.</p>
        ) : (
          <>
            {data.restaurants.pending > 0 && (
              <Link
                to="/admin/restaurants"
                className="mb-4 flex items-center gap-3 rounded-card border border-primary/25 bg-primary/5 px-4 py-3 text-sm font-medium transition-colors hover:bg-primary/10"
              >
                <Inbox className="size-4 text-primary-strong" />
                {data.restaurants.pending} partner submission
                {data.restaurants.pending === 1 ? '' : 's'} waiting for review
                <span className="ml-auto text-primary-strong">Review →</span>
              </Link>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard icon={Store} label="Restaurants" value={data.restaurants.total}>
                <span className="text-basil">{data.restaurants.published} published</span> ·{' '}
                {data.restaurants.draft} draft
                {data.restaurants.pending > 0 && (
                  <>
                    {' · '}
                    <span className="text-primary-strong">{data.restaurants.pending} pending</span>
                  </>
                )}
              </StatCard>
              <StatCard icon={MessageSquareText} label="Reviews" value={data.reviews.PUBLISHED}>
                {data.reviews.HIDDEN} hidden · {data.reviews.FLAGGED} flagged
              </StatCard>
              <StatCard icon={Sparkles} label="Featured on homepage" value={data.featuredCount}>
                <Link to="/admin/homepage" className="text-primary-strong hover:underline">
                  Manage homepage →
                </Link>
              </StatCard>
            </div>

            <div className="mt-8">
              <h2 className="mb-3 text-sm font-semibold text-muted">Recent activity</h2>
              <div className={adminCard}>
                {data.recentAudit.length === 0 ? (
                  <p className="text-sm text-muted">No activity yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.recentAudit.map((entry) => (
                      <li key={entry.id} className="flex items-center gap-2 py-2.5 text-sm">
                        <span className="font-medium">{entry.adminName ?? 'Someone'}</span>
                        <span className="text-muted">
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-muted">
                          {formatRelativeDate(entry.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof Store;
  label: string;
  value: number;
  children: React.ReactNode;
}) {
  return (
    <div className={adminCard}>
      <div className="flex items-center gap-2 text-muted">
        <Icon className="size-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{children}</p>
    </div>
  );
}
