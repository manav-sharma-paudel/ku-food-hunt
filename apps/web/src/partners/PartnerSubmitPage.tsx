import {
  KU_COORDINATES,
  PARTNER_DESCRIPTION_MAX,
  PARTNER_DESCRIPTION_MIN,
  PARTNER_MAX_GALLERY_PHOTOS,
  PRICE_BANDS,
  PRICE_BAND_LABELS,
  partnerSubmissionSchema,
  type PartnerSubmissionDto,
  type PriceBand,
} from '@ku-food-hunt/shared';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ImagePlus, Loader2, X } from 'lucide-react';
import { Suspense, lazy, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { ApiError, apiGet, apiPost, apiUpload } from '../api/client';
import { useCategories } from '../api/queries';
import { Seo } from '../components/seo/Seo';
import { SmartImage } from '../components/feedback/SmartImage';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Spinner } from '../components/ui/spinner';
import { cn } from '../lib/cn';

const LocationPicker = lazy(() => import('../components/map/LocationPicker'));

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const inputCls =
  'w-full rounded-btn border border-border bg-surface-2/40 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary focus:bg-surface';
const labelCls = 'mb-2 block text-sm font-medium';

interface DayHours {
  open: boolean;
  from: string;
  to: string;
}
const defaultDay = (): DayHours => ({ open: false, from: '10:00', to: '20:00' });

const toMinutes = (t: string): number => {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
};
const toTime = (mins: number): string => {
  const m = mins % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export default function PartnerSubmitPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  // Edit link: load the existing submission back into the form.
  const prefill = useQuery({
    queryKey: ['partner-submission', token],
    queryFn: () => apiGet<{ data: PartnerSubmissionDto }>(`/partners/submissions/${token}`),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });

  if (token && prefill.isPending) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }
  if (token && (prefill.isError || !prefill.data)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <Seo title="Edit link expired" noindex />
        <h1 className="text-xl font-semibold">This edit link is no longer valid</h1>
        <p className="mt-2 text-sm text-muted">
          It may have been used already, or the submission has since been processed. You can submit
          the restaurant again from scratch.
        </p>
        <Button asChild className="mt-6">
          <a href="/partners">Open a blank form</a>
        </Button>
      </div>
    );
  }

  return <SubmissionForm token={token} existing={prefill.data?.data ?? null} />;
}

function SubmissionForm({
  token,
  existing,
}: {
  token: string | null;
  existing: PartnerSubmissionDto | null;
}) {
  const navigate = useNavigate();
  const { data: categories } = useCategories();

  const [form, setForm] = useState(() => ({
    name: existing?.name ?? '',
    legalName: existing?.legalName ?? '',
    description: existing?.description ?? '',
    address: existing?.address ?? '',
    latitude: existing?.latitude ?? KU_COORDINATES.latitude,
    longitude: existing?.longitude ?? KU_COORDINATES.longitude,
    phone: existing?.phone ?? '',
    websiteUrl: existing?.websiteUrl ?? '',
    categorySlugs: existing?.categorySlugs ?? [],
    priceBand: (existing?.priceBand ?? 'STANDARD') as PriceBand,
    priceMin: existing?.priceMinNpr?.toString() ?? '',
    priceMax: existing?.priceMaxNpr?.toString() ?? '',
    hasDelivery: existing?.hasDelivery ?? false,
    hasQrPayment: existing?.hasQrPayment ?? false,
    hasVegOptions: existing?.hasVegOptions ?? false,
    coverPhotoUrl: existing?.coverPhotoUrl ?? null,
    galleryPhotoUrls: existing?.galleryPhotoUrls ?? [],
    menuPhotoUrl: existing?.menuPhotoUrl ?? null,
    submitterName: existing?.submitterName ?? '',
    submitterEmail: existing?.submitterEmail ?? '',
    submitterPhone: existing?.submitterPhone ?? '',
    website: '', // honeypot
  }));
  const [hours, setHours] = useState<DayHours[]>(() => {
    const days = Array.from({ length: 7 }, defaultDay);
    for (const h of existing?.hours ?? []) {
      days[h.dayOfWeek] = { open: true, from: toTime(h.opensAt), to: toTime(h.closesAt) };
    }
    return days;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const err = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-danger">{errors[key]}</p> : null;

  const setDay = (day: number, patch: Partial<DayHours>) =>
    setHours((prev) => prev.map((d, i) => (i === day ? { ...d, ...patch } : d)));

  const toggleCategory = (slug: string) =>
    set(
      'categorySlugs',
      form.categorySlugs.includes(slug)
        ? form.categorySlugs.filter((s) => s !== slug)
        : [...form.categorySlugs, slug],
    );

  const buildPayload = () => ({
    name: form.name,
    legalName: form.legalName,
    description: form.description,
    address: form.address,
    latitude: form.latitude,
    longitude: form.longitude,
    phone: form.phone,
    websiteUrl: form.websiteUrl,
    categorySlugs: form.categorySlugs,
    priceBand: form.priceBand,
    priceMinNpr: form.priceMin.trim() === '' ? null : Number(form.priceMin),
    priceMaxNpr: form.priceMax.trim() === '' ? null : Number(form.priceMax),
    hasDelivery: form.hasDelivery,
    hasQrPayment: form.hasQrPayment,
    hasVegOptions: form.hasVegOptions,
    hours: hours.flatMap((d, day) => {
      if (!d.open || !d.from || !d.to) return [];
      const opensAt = toMinutes(d.from);
      let closesAt = toMinutes(d.to);
      if (closesAt <= opensAt) closesAt += 1440; // past-midnight closing
      return [{ dayOfWeek: day, opensAt, closesAt }];
    }),
    coverPhotoUrl: form.coverPhotoUrl ?? undefined,
    galleryPhotoUrls: form.galleryPhotoUrls,
    menuPhotoUrl: form.menuPhotoUrl ?? undefined,
    submitterName: form.submitterName,
    submitterEmail: form.submitterEmail,
    submitterPhone: form.submitterPhone,
    resubmitToken: token ?? undefined,
    website: form.website || undefined,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const parsed = partnerSubmissionSchema.safeParse(buildPayload());
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setSubmitError('Please fix the highlighted fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await apiPost<{ data: { name: string; isResubmission: boolean } }>(
        '/partners/submissions',
        parsed.data,
      );
      navigate('/partners/success', { state: res.data, replace: Boolean(token) });
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Seo
        title={token ? 'Update your submission' : 'List your restaurant'}
        description="Get your restaurant, café, or chiya pasal in front of thousands of KU students — free."
        path="/partners"
      />

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {token ? 'Update your submission' : 'List your restaurant on KU Food Hunt'}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {token
          ? 'Make your changes below and resubmit — our team will take another look.'
          : 'Free for every eatery around KU. Fill this in (it takes about five minutes), and our team will review and publish your listing.'}
      </p>

      {existing?.status === 'REJECTED' && existing.rejectionReason && (
        <div className="mt-5 flex gap-3 rounded-card border border-danger/30 bg-danger/5 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-medium">Your previous submission needs changes</p>
            <p className="mt-1 text-sm text-muted">{existing.rejectionReason}</p>
          </div>
        </div>
      )}

      {submitError && (
        <p className="mt-5 rounded-btn bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {submitError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-10">
        <Section title="The basics">
          <div>
            <label htmlFor="p-name" className={labelCls}>
              Restaurant name
            </label>
            <input
              id="p-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Sunrise Sekuwa House"
              className={inputCls}
            />
            {err('name')}
          </div>
          <div>
            <label htmlFor="p-legal" className={labelCls}>
              Legal / registered business name{' '}
              <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="p-legal"
              value={form.legalName}
              onChange={(e) => set('legalName', e.target.value)}
              className={inputCls}
            />
            {err('legalName')}
          </div>
          <div>
            <label htmlFor="p-desc" className={labelCls}>
              Short description
            </label>
            <textarea
              id="p-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value.slice(0, PARTNER_DESCRIPTION_MAX))}
              rows={4}
              placeholder="What do you serve? What makes your place worth the walk?"
              className={cn(inputCls, 'resize-y')}
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>
                {form.description.trim().length < PARTNER_DESCRIPTION_MIN
                  ? `At least ${PARTNER_DESCRIPTION_MIN} characters`
                  : ''}
              </span>
              <span className="tabular-nums">
                {form.description.length}/{PARTNER_DESCRIPTION_MAX}
              </span>
            </div>
            {err('description')}
          </div>
          <div>
            <span className={labelCls}>Cuisine — pick all that apply</span>
            <div className="flex flex-wrap gap-2">
              {(categories ?? []).map((c) => {
                const active = form.categorySlugs.includes(c.slug);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggleCategory(c.slug)}
                    aria-pressed={active}
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
            {err('categorySlugs')}
          </div>
        </Section>

        <Section
          title="Location"
          hint="Type the address, then drop the pin exactly on your entrance — students navigate by it."
        >
          <div>
            <label htmlFor="p-address" className={labelCls}>
              Address
            </label>
            <input
              id="p-address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="e.g. KU Road, Dhulikhel"
              className={inputCls}
            />
            {err('address')}
          </div>
          <div className="h-64 overflow-hidden rounded-card border border-border">
            <Suspense
              fallback={
                <div className="grid h-full place-items-center">
                  <Spinner className="size-5 text-primary" />
                </div>
              }
            >
              <LocationPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onPick={(latitude, longitude) => setForm((f) => ({ ...f, latitude, longitude }))}
              />
            </Suspense>
          </div>
          <p className="text-xs text-muted">
            Pin: {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
          </p>
        </Section>

        <Section title="Contact & links">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-phone" className={labelCls}>
                Restaurant phone <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="p-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                className={inputCls}
              />
              {err('phone')}
            </div>
            <div>
              <label htmlFor="p-web" className={labelCls}>
                Website or social link <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="p-web"
                value={form.websiteUrl}
                onChange={(e) => set('websiteUrl', e.target.value)}
                placeholder="Facebook, Instagram, TikTok…"
                className={inputCls}
              />
              {err('websiteUrl')}
            </div>
          </div>
        </Section>

        <Section title="Opening hours" hint="Leave a day unticked if you're closed.">
          <div className="space-y-2">
            {DAY_NAMES.map((name, day) => {
              const d = hours[day] ?? defaultDay();
              return (
                <div key={name} className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex w-32 cursor-pointer items-center gap-2.5">
                    <Checkbox
                      checked={d.open}
                      onCheckedChange={(v) => setDay(day, { open: v === true })}
                    />
                    {name}
                  </label>
                  {d.open ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={d.from}
                        onChange={(e) => setDay(day, { from: e.target.value })}
                        aria-label={`${name} opening time`}
                        className={cn(inputCls, 'w-auto py-1.5')}
                      />
                      <span className="text-muted">to</span>
                      <input
                        type="time"
                        value={d.to}
                        onChange={(e) => setDay(day, { to: e.target.value })}
                        aria-label={`${name} closing time`}
                        className={cn(inputCls, 'w-auto py-1.5')}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Pricing">
          <div>
            <span className={labelCls}>Typical price per person</span>
            <div className="flex flex-wrap gap-2">
              {PRICE_BANDS.map((band) => (
                <button
                  key={band}
                  type="button"
                  onClick={() => set('priceBand', band)}
                  aria-pressed={form.priceBand === band}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                    form.priceBand === band
                      ? 'border-primary/30 bg-primary/10 text-primary-strong'
                      : 'border-border text-muted hover:bg-surface-2',
                  )}
                >
                  {PRICE_BAND_LABELS[band]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-min" className={labelCls}>
                Cheapest dish (Rs.) <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="p-min"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.priceMin}
                onChange={(e) => set('priceMin', e.target.value)}
                className={inputCls}
              />
              {err('priceMinNpr')}
            </div>
            <div>
              <label htmlFor="p-max" className={labelCls}>
                Priciest dish (Rs.) <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="p-max"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.priceMax}
                onChange={(e) => set('priceMax', e.target.value)}
                className={inputCls}
              />
              {err('priceMaxNpr')}
            </div>
          </div>
        </Section>

        <Section title="Photos" hint="A good cover photo doubles the taps your listing gets.">
          <SinglePhotoField
            label="Cover photo"
            value={form.coverPhotoUrl}
            onChange={(url) => set('coverPhotoUrl', url)}
          />
          <GalleryPhotoField
            urls={form.galleryPhotoUrls}
            onChange={(urls) => set('galleryPhotoUrls', urls)}
          />
          <SinglePhotoField
            label="Menu photo (optional)"
            value={form.menuPhotoUrl}
            onChange={(url) => set('menuPhotoUrl', url)}
          />
        </Section>

        <Section title="Options">
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <label className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                checked={form.hasDelivery}
                onCheckedChange={(v) => set('hasDelivery', v === true)}
              />
              Delivery available
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                checked={form.hasQrPayment}
                onCheckedChange={(v) => set('hasQrPayment', v === true)}
              />
              QR payment
            </label>
            <label className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                checked={form.hasVegOptions}
                onCheckedChange={(v) => set('hasVegOptions', v === true)}
              />
              Vegetarian options
            </label>
          </div>
        </Section>

        <Section
          title="Your contact details"
          hint="Only for approval updates — never shown on your public listing."
        >
          <div>
            <label htmlFor="p-oname" className={labelCls}>
              Your name
            </label>
            <input
              id="p-oname"
              value={form.submitterName}
              onChange={(e) => set('submitterName', e.target.value)}
              autoComplete="name"
              className={inputCls}
            />
            {err('submitterName')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-oemail" className={labelCls}>
                Your email
              </label>
              <input
                id="p-oemail"
                type="email"
                value={form.submitterEmail}
                onChange={(e) => set('submitterEmail', e.target.value)}
                autoComplete="email"
                className={inputCls}
              />
              {err('submitterEmail')}
            </div>
            <div>
              <label htmlFor="p-ophone" className={labelCls}>
                Your phone
              </label>
              <input
                id="p-ophone"
                type="tel"
                value={form.submitterPhone}
                onChange={(e) => set('submitterPhone', e.target.value)}
                autoComplete="tel"
                className={inputCls}
              />
              {err('submitterPhone')}
            </div>
          </div>
        </Section>

        {/* Honeypot — hidden from real users, catches bots. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor="p-website">Website</label>
          <input
            id="p-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
          />
        </div>

        <div className="border-t border-border pt-6">
          <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
            {submitting && <Loader2 className="animate-spin" />}
            {token ? 'Resubmit for review' : 'Submit for review'}
          </Button>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            By submitting you confirm you’re authorized to list this business. Nothing goes live
            until our team approves it.
          </p>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Upload one photo to the partner endpoint, with client-side size/type checks. */
function usePhotoUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Photos must be under 4 MB.');
      return null;
    }
    if (!PHOTO_ACCEPT.split(',').includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images work.');
      return null;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await apiUpload<{ data: { url: string } }>('/partners/photo', form);
      return res.data.url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That photo could not be uploaded.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}

function SinglePhotoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = usePhotoUpload();

  return (
    <div>
      <span className={labelCls}>{label}</span>
      {value ? (
        <div className="relative h-40 w-full max-w-sm overflow-hidden rounded-card sm:h-44">
          <SmartImage src={value} alt="" fill />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            aria-label={`Remove ${label.toLowerCase()}`}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-full max-w-sm flex-col items-center justify-center gap-1.5 rounded-card border border-dashed border-border text-muted transition-colors hover:border-primary hover:text-primary-strong"
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          <span className="text-xs">{uploading ? 'Uploading…' : 'Tap to upload'}</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={PHOTO_ACCEPT}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          const url = await upload(file);
          if (url) onChange(url);
        }}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

function GalleryPhotoField({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = usePhotoUpload();

  return (
    <div>
      <span className={labelCls}>
        More photos{' '}
        <span className="font-normal text-muted">(up to {PARTNER_MAX_GALLERY_PHOTOS})</span>
      </span>
      <div className="flex flex-wrap gap-2.5">
        {urls.map((url) => (
          <div key={url} className="relative size-24 overflow-hidden rounded-lg">
            <SmartImage src={url} alt="" ratio="1/1" containerClassName="size-24" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((u) => u !== url))}
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              aria-label="Remove photo"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {urls.length < PARTNER_MAX_GALLERY_PHOTOS && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex size-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-muted transition-colors hover:border-primary hover:text-primary-strong"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ImagePlus className="size-5" />
            )}
            <span className="text-[11px]">Add</span>
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={PHOTO_ACCEPT}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file || urls.length >= PARTNER_MAX_GALLERY_PHOTOS) return;
          const url = await upload(file);
          if (url) onChange([...urls, url]);
        }}
        className="hidden"
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
