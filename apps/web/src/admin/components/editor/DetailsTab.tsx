import {
  canSetRestaurantStatus,
  PRICE_BANDS,
  PRICE_BAND_LABELS,
  RESTAURANT_STATUSES,
  type AdminRestaurantDto,
  type PriceBand,
  type RestaurantStatusValue,
} from '@ku-food-hunt/shared';
import { useMutation } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useCategories } from '../../../api/queries';
import { cn } from '../../../lib/cn';
import { useAdminAuth } from '../../AdminAuthContext';
import { useSaveRestaurant } from '../../pages/AdminRestaurantEditor';
import { adminEndpoints } from '../../api/adminEndpoints';
import { adminInput, adminLabel } from '../adminStyles';
import { SaveButton } from './SaveButton';

const toNum = (s: string): number | null => (s.trim() === '' ? null : Number(s));

export function DetailsTab({ restaurant }: { restaurant: AdminRestaurantDto }) {
  const { data: categories } = useCategories();
  const onSaved = useSaveRestaurant(restaurant.id);
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const isSuperadmin = admin?.role === 'SUPERADMIN';
  // Moderators can prep drafts but not publish, and can't archive (delete) — both
  // are SUPERADMIN-only server-side, so hide/disable those controls for them.
  const alreadyPublished = restaurant.status === 'PUBLISHED';

  const [form, setForm] = useState({
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description ?? '',
    phone: restaurant.phone ?? '',
    priceBand: restaurant.priceBand as PriceBand,
    priceMinNpr: restaurant.priceMinNpr?.toString() ?? '',
    priceMaxNpr: restaurant.priceMaxNpr?.toString() ?? '',
    status: restaurant.status as RestaurantStatusValue,
    isFeatured: restaurant.isFeatured,
    hasQrPayment: restaurant.hasQrPayment,
    hasDelivery: restaurant.hasDelivery,
    hasVegOptions: restaurant.hasVegOptions,
    categorySlugs: restaurant.categorySlugs,
  });
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () =>
      adminEndpoints.updateRestaurant(restaurant.id, {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        phone: form.phone.trim() || null,
        priceBand: form.priceBand,
        priceMinNpr: toNum(form.priceMinNpr),
        priceMaxNpr: toNum(form.priceMaxNpr),
        status: form.status,
        isFeatured: form.isFeatured,
        hasQrPayment: form.hasQrPayment,
        hasDelivery: form.hasDelivery,
        hasVegOptions: form.hasVegOptions,
        categorySlugs: form.categorySlugs,
      }),
    onSuccess: onSaved,
  });

  const archive = useMutation({
    mutationFn: () => adminEndpoints.deleteRestaurant(restaurant.id),
    onSuccess: () => navigate('/admin/restaurants', { replace: true }),
  });

  const toggleCategory = (slug: string) =>
    set(
      'categorySlugs',
      form.categorySlugs.includes(slug)
        ? form.categorySlugs.filter((s) => s !== slug)
        : [...form.categorySlugs, slug],
    );

  return (
    <div className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className={adminInput}
          />
        </Field>
        <Field label="Slug (URL)">
          <input
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
            className={adminInput}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className={cn(adminInput, 'resize-y')}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price band">
          <select
            value={form.priceBand}
            onChange={(e) => set('priceBand', e.target.value as PriceBand)}
            className={adminInput}
          >
            {PRICE_BANDS.map((b) => (
              <option key={b} value={b}>
                {PRICE_BAND_LABELS[b]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Min price (Rs.)">
          <input
            type="number"
            inputMode="numeric"
            value={form.priceMinNpr}
            onChange={(e) => set('priceMinNpr', e.target.value)}
            className={adminInput}
          />
        </Field>
        <Field label="Max price (Rs.)">
          <input
            type="number"
            inputMode="numeric"
            value={form.priceMaxNpr}
            onChange={(e) => set('priceMaxNpr', e.target.value)}
            className={adminInput}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={adminInput}
          />
        </Field>
        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as RestaurantStatusValue)}
            className={adminInput}
          >
            {RESTAURANT_STATUSES.map((s) => (
              <option
                key={s}
                value={s}
                disabled={!admin || !canSetRestaurantStatus(admin.role, s, restaurant.status)}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {!isSuperadmin && (
            <span className="mt-1 block text-xs text-muted">
              {alreadyPublished
                ? 'Only an administrator can publish or unpublish a live restaurant.'
                : 'Only an administrator can set a restaurant to Published or Archived.'}
            </span>
          )}
        </Field>
      </div>

      <Field label="Categories">
        <div className="flex flex-wrap gap-2">
          {(categories ?? []).map((c) => {
            const active = form.categorySlugs.includes(c.slug);
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => toggleCategory(c.slug)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary/30 bg-primary/10 text-primary-strong'
                    : 'border-border text-muted hover:bg-surface-2',
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Check
          label="QR payment"
          checked={form.hasQrPayment}
          onChange={(v) => set('hasQrPayment', v)}
        />
        <Check
          label="Delivery"
          checked={form.hasDelivery}
          onChange={(v) => set('hasDelivery', v)}
        />
        <Check
          label="Veg options"
          checked={form.hasVegOptions}
          onChange={(v) => set('hasVegOptions', v)}
        />
        <Check label="Featured" checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} />
      </div>

      <div className="border-t border-border pt-4">
        <SaveButton
          onSave={() => save.mutate()}
          isPending={save.isPending}
          isSuccess={save.isSuccess}
          error={save.error}
          disabled={form.name.trim().length < 2}
        />
      </div>

      {isSuperadmin && (
        <div className="mt-6 rounded-card border border-danger/30 bg-danger/5 p-4">
          <p className="text-sm font-medium">Archive restaurant</p>
          <p className="mt-0.5 text-xs text-muted">
            Removes it from the public site. This is a soft delete and can be restored in the
            database.
          </p>
          <button
            onClick={() => {
              if (confirm(`Archive “${restaurant.name}”? It will disappear from the public site.`))
                archive.mutate();
            }}
            disabled={archive.isPending}
            className="mt-3 inline-flex items-center gap-1.5 rounded-btn border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            Archive
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={adminLabel}>{label}</span>
      {children}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}
