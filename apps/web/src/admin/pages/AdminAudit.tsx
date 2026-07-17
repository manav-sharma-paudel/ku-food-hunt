import { Seo } from '../../components/seo/Seo';
import { Spinner } from '../../components/ui/spinner';
import { formatRelativeDate } from '../../lib/date';
import { useAdminAudit } from '../api/adminQueries';
import { AdminPageHeader } from '../components/AdminPageHeader';

export default function AdminAudit() {
  const { data, isPending, isError } = useAdminAudit();

  return (
    <>
      <Seo title="Activity log" noindex />
      <AdminPageHeader title="Activity" description="Every admin action, most recent first." />

      <div className="px-5 py-5 sm:px-8">
        {isPending ? (
          <div className="grid place-items-center py-20">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : isError || !data ? (
          <p className="text-sm text-danger">Could not load the activity log.</p>
        ) : data.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">No activity yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="border-b border-border bg-surface-2/50 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Who</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                  <th className="px-4 py-2.5 font-medium">Entity</th>
                  <th className="px-4 py-2.5 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((entry) => (
                  <tr key={entry.id} className="bg-surface">
                    <td className="px-4 py-2.5 font-medium">{entry.adminName ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
                        {entry.action}
                      </code>
                    </td>
                    <td className="px-4 py-2.5 text-muted">{entry.entityType}</td>
                    <td className="px-4 py-2.5 text-muted">
                      {formatRelativeDate(entry.createdAt)}
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
