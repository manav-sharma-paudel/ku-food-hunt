import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Check, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Seo } from '../../components/seo/Seo';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { cn } from '../../lib/cn';
import { adminEndpoints } from '../api/adminEndpoints';
import { useAdminHero, useAdminRestaurants } from '../api/adminQueries';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminCard, adminInput, adminLabel } from '../components/adminStyles';

const MAX_FEATURED = 12;

export default function AdminHomepage() {
  const { data: restaurants, isPending } = useAdminRestaurants({});
  const { data: hero } = useAdminHero();
  const queryClient = useQueryClient();

  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  useEffect(() => {
    if (hero) {
      setHeadline(hero.headline);
      setSubheadline(hero.subheadline);
    }
  }, [hero]);

  const saveHero = useMutation({
    mutationFn: () =>
      adminEndpoints.putHero({ headline: headline.trim(), subheadline: subheadline.trim() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'hero'] }),
  });

  const published = useMemo(
    () => (restaurants ?? []).filter((r) => r.status === 'PUBLISHED'),
    [restaurants],
  );
  const byId = useMemo(() => new Map(published.map((r) => [r.id, r])), [published]);

  const [featuredIds, setFeaturedIds] = useState<string[] | null>(null);
  useEffect(() => {
    if (restaurants && featuredIds === null) {
      setFeaturedIds(
        published
          .filter((r) => r.isFeatured)
          .sort((a, b) => (a.featuredRank ?? 99) - (b.featuredRank ?? 99))
          .map((r) => r.id),
      );
    }
  }, [restaurants, published, featuredIds]);

  const saveFeatured = useMutation({
    mutationFn: () => adminEndpoints.putFeatured(featuredIds ?? []),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });

  const ids = featuredIds ?? [];
  const available = published.filter((r) => !ids.includes(r.id));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    setFeaturedIds(next);
  };

  return (
    <>
      <Seo title="Homepage" noindex />
      <AdminPageHeader
        title="Homepage"
        description="Control the hero copy and the featured list."
      />

      <div className="grid gap-6 px-5 py-6 sm:px-8 lg:grid-cols-2">
        {/* Hero */}
        <section className={adminCard}>
          <h2 className="text-sm font-semibold">Hero</h2>
          <p className="mt-0.5 text-xs text-muted">Shown at the top of the landing page.</p>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="headline" className={adminLabel}>
                Headline
              </label>
              <input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value.slice(0, 120))}
                className={adminInput}
              />
            </div>
            <div>
              <label htmlFor="subheadline" className={adminLabel}>
                Subheadline
              </label>
              <textarea
                id="subheadline"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value.slice(0, 240))}
                rows={3}
                className={cn(adminInput, 'resize-y')}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => saveHero.mutate()}
                disabled={saveHero.isPending || headline.trim().length < 2}
              >
                {saveHero.isPending && <Loader2 className="animate-spin" />}
                Save hero
              </Button>
              {saveHero.isSuccess && !saveHero.isPending && (
                <span className="inline-flex items-center gap-1 text-xs text-basil">
                  <Check className="size-3.5" /> Saved
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Featured */}
        <section className={adminCard}>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary-strong" />
            <h2 className="text-sm font-semibold">Featured ({ids.length})</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted">Ordered exactly as shown on the homepage.</p>

          {isPending || featuredIds === null ? (
            <div className="grid place-items-center py-10">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <ol className="space-y-2">
                {ids.length === 0 && (
                  <li className="rounded-btn border border-dashed border-border px-3 py-4 text-center text-xs text-muted">
                    Nothing featured yet — add restaurants below.
                  </li>
                )}
                {ids.map((id, i) => {
                  const r = byId.get(id);
                  if (!r) return null;
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-2 rounded-btn border border-border bg-surface-2/30 px-3 py-2 text-sm"
                    >
                      <span className="w-5 text-xs text-muted tabular-nums">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
                      <button
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                        className="text-muted hover:text-foreground disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={i === ids.length - 1}
                        className="text-muted hover:text-foreground disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        onClick={() => setFeaturedIds(ids.filter((x) => x !== id))}
                        className="text-muted hover:text-danger"
                        aria-label="Remove"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ol>

              {available.length > 0 && ids.length < MAX_FEATURED && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted">Add a restaurant</p>
                  <div className="flex flex-wrap gap-1.5">
                    {available.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setFeaturedIds([...ids, r.id])}
                        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-foreground"
                      >
                        <Plus className="size-3" />
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => saveFeatured.mutate()}
                  disabled={saveFeatured.isPending}
                >
                  {saveFeatured.isPending && <Loader2 className="animate-spin" />}
                  Save featured
                </Button>
                {saveFeatured.isSuccess && !saveFeatured.isPending && (
                  <span className="inline-flex items-center gap-1 text-xs text-basil">
                    <Check className="size-3.5" /> Saved
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
