import { type AdminRestaurantDto } from '@ku-food-hunt/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { ApiError } from '../../api/client';
import { Seo } from '../../components/seo/Seo';
import { Button } from '../../components/ui/button';
import { Spinner } from '../../components/ui/spinner';
import { cn } from '../../lib/cn';
import { adminEndpoints } from '../api/adminEndpoints';
import { useAdminRestaurant } from '../api/adminQueries';
import { DetailsTab } from '../components/editor/DetailsTab';
import { HoursTab } from '../components/editor/HoursTab';
import { LocationTab } from '../components/editor/LocationTab';
import { MenuTab } from '../components/editor/MenuTab';
import { PhotosTab } from '../components/editor/PhotosTab';
import { SubmissionBanner } from '../components/editor/SubmissionBanner';
import { StatusBadge } from './AdminRestaurantList';
import { adminInput, adminLabel } from '../components/adminStyles';

const TABS = ['Details', 'Location', 'Hours', 'Menu', 'Photos'] as const;
type Tab = (typeof TABS)[number];

export default function AdminRestaurantEditor() {
  const { id } = useParams();
  if (!id) return <CreateRestaurantView />;
  return <EditRestaurantView id={id} />;
}

function CreateRestaurantView() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toNum = (s: string): number | null => (s.trim() === '' ? null : Number(s));

  const create = useMutation({
    mutationFn: () =>
      adminEndpoints.createRestaurant({
        name: name.trim(),
        address: address.trim(),
        priceMinNpr: toNum(priceMin),
        priceMaxNpr: toNum(priceMax),
        // Sensible default; refined on the Location tab right after creation.
        latitude: 27.6194,
        longitude: 85.5386,
      } as Parameters<typeof adminEndpoints.createRestaurant>[0]),
    onSuccess: (r) => navigate(`/admin/restaurants/${r.id}`, { replace: true }),
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : 'Could not create the restaurant.'),
  });

  return (
    <>
      <Seo title="New restaurant" noindex />
      <div className="border-b border-border px-5 py-5 sm:px-8">
        <BackLink />
        <h1 className="mt-2 text-xl font-semibold tracking-tight">New restaurant</h1>
        <p className="mt-0.5 text-sm text-muted">
          Start with the basics — you can add hours, menu, and photos next.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const min = toNum(priceMin);
          const max = toNum(priceMax);
          if (min !== null && max !== null && min > max) {
            setError('Min price cannot be greater than max price.');
            return;
          }
          create.mutate();
        }}
        className="max-w-lg space-y-4 px-5 py-6 sm:px-8"
      >
        <div>
          <label htmlFor="name" className={adminLabel}>
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={adminInput}
          />
        </div>
        <div>
          <label htmlFor="address" className={adminLabel}>
            Address
          </label>
          <input
            id="address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. KU Road, Dhulikhel"
            className={adminInput}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price-min" className={adminLabel}>
              Min price (Rs.)
            </label>
            <input
              id="price-min"
              type="number"
              inputMode="numeric"
              min={0}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="e.g. 100"
              className={adminInput}
            />
          </div>
          <div>
            <label htmlFor="price-max" className={adminLabel}>
              Max price (Rs.)
            </label>
            <input
              id="price-max"
              type="number"
              inputMode="numeric"
              min={0}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="e.g. 500"
              className={adminInput}
            />
          </div>
        </div>
        <p className="text-xs text-muted">
          Optional — the exact Rs. range shown on the restaurant page. The public price
          filter&apos;s coarse bucket is derived from this range automatically.
        </p>

        {error && (
          <p className="rounded-btn bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={create.isPending || name.trim().length < 2}>
          {create.isPending && <Loader2 className="animate-spin" />}
          Create & continue
        </Button>
      </form>
    </>
  );
}

function EditRestaurantView({ id }: { id: string }) {
  const { data: restaurant, isPending, isError } = useAdminRestaurant(id);
  const [tab, setTab] = useState<Tab>('Details');

  if (isPending) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }
  if (isError || !restaurant) {
    return (
      <div className="px-5 py-16 text-center sm:px-8">
        <p className="text-sm text-danger">This restaurant could not be loaded.</p>
        <BackLink className="mt-3 inline-flex" />
      </div>
    );
  }

  return (
    <>
      <Seo title={restaurant.name} noindex />
      <div className="border-b border-border px-5 pt-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <BackLink />
            <div className="mt-2 flex items-center gap-2.5">
              <h1 className="truncate text-xl font-semibold tracking-tight">{restaurant.name}</h1>
              <StatusBadge status={restaurant.status} />
            </div>
          </div>
          <Link
            to={`/restaurants/${restaurant.slug}`}
            className="ml-auto text-sm font-medium text-primary-strong hover:underline"
          >
            View public page →
          </Link>
        </div>

        <SubmissionBanner restaurant={restaurant} />

        <nav className="-mb-px mt-4 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === t
                  ? 'border-primary text-primary-strong'
                  : 'border-transparent text-muted hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      <div className="px-5 py-6 sm:px-8">
        {tab === 'Details' && <DetailsTab restaurant={restaurant} />}
        {tab === 'Location' && <LocationTab restaurant={restaurant} />}
        {tab === 'Hours' && <HoursTab restaurant={restaurant} />}
        {tab === 'Menu' && <MenuTab restaurant={restaurant} />}
        {tab === 'Photos' && <PhotosTab restaurant={restaurant} />}
      </div>
    </>
  );
}

function BackLink({ className }: { className?: string }) {
  return (
    <Link
      to="/admin/restaurants"
      className={cn(
        'inline-flex items-center gap-1 text-sm text-muted hover:text-foreground',
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      All restaurants
    </Link>
  );
}

/** Shared by the edit tabs: push the fresh restaurant into cache + refresh the list. */
export function useSaveRestaurant(id: string) {
  const queryClient = useQueryClient();
  return (updated: AdminRestaurantDto) => {
    queryClient.setQueryData(['admin', 'restaurant', id], updated);
    queryClient.invalidateQueries({ queryKey: ['admin', 'restaurants'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };
}
