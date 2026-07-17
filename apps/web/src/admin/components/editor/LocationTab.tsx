import type { AdminRestaurantDto } from '@ku-food-hunt/shared';
import { useMutation } from '@tanstack/react-query';
import { lazy, Suspense, useState } from 'react';

import { Spinner } from '../../../components/ui/spinner';
import { adminEndpoints } from '../../api/adminEndpoints';
import { useSaveRestaurant } from '../../pages/AdminRestaurantEditor';
import { adminInput, adminLabel } from '../adminStyles';
import { SaveButton } from './SaveButton';

const LocationPicker = lazy(() => import('../../../components/map/LocationPicker'));

export function LocationTab({ restaurant }: { restaurant: AdminRestaurantDto }) {
  const onSaved = useSaveRestaurant(restaurant.id);
  const [address, setAddress] = useState(restaurant.address);
  const [lat, setLat] = useState(restaurant.latitude);
  const [lng, setLng] = useState(restaurant.longitude);

  const save = useMutation({
    mutationFn: () =>
      adminEndpoints.updateRestaurant(restaurant.id, {
        address: address.trim(),
        latitude: lat,
        longitude: lng,
      }),
    onSuccess: onSaved,
  });

  const parse = (value: string, fallback: number) => {
    const n = Number(value);
    return value.trim() === '' || Number.isNaN(n) ? fallback : n;
  };

  return (
    <div className="max-w-2xl space-y-4">
      <label className="block">
        <span className={adminLabel}>Address</span>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={adminInput}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className={adminLabel}>Latitude</span>
          <input
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(parse(e.target.value, lat))}
            className={adminInput}
          />
        </label>
        <label className="block">
          <span className={adminLabel}>Longitude</span>
          <input
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(parse(e.target.value, lng))}
            className={adminInput}
          />
        </label>
      </div>

      <div className="h-72 overflow-hidden rounded-card border border-border">
        <Suspense
          fallback={
            <div className="grid size-full place-items-center bg-surface-2">
              <Spinner className="size-5 text-primary" />
            </div>
          }
        >
          <LocationPicker
            latitude={lat}
            longitude={lng}
            onPick={(la, lo) => {
              setLat(la);
              setLng(lo);
            }}
          />
        </Suspense>
      </div>
      <p className="text-xs text-muted">Click or drag the pin to set the exact spot.</p>

      <SaveButton
        onSave={() => save.mutate()}
        isPending={save.isPending}
        isSuccess={save.isSuccess}
        error={save.error}
        disabled={address.trim().length < 2}
      />
    </div>
  );
}
