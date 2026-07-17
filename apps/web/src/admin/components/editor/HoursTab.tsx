import type { AdminRestaurantDto } from '@ku-food-hunt/shared';
import { useMutation } from '@tanstack/react-query';
import { Copy, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../../lib/cn';
import { adminEndpoints } from '../../api/adminEndpoints';
import { useSaveRestaurant } from '../../pages/AdminRestaurantEditor';
import { adminInput } from '../adminStyles';
import { SaveButton } from './SaveButton';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Shift {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

const pad = (n: number) => String(n).padStart(2, '0');
const toTime = (m: number) => `${pad(Math.floor((m % 1440) / 60))}:${pad(m % 60)}`;
const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

type DayMap = Record<number, Shift[]>;

function initialDays(restaurant: AdminRestaurantDto): DayMap {
  const days: DayMap = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const h of restaurant.hours) {
    const closeMin = h.closesAt > 1440 ? h.closesAt - 1440 : h.closesAt;
    (days[h.dayOfWeek] ??= []).push({ open: toTime(h.opensAt), close: toTime(closeMin) });
  }
  return days;
}

export function HoursTab({ restaurant }: { restaurant: AdminRestaurantDto }) {
  const onSaved = useSaveRestaurant(restaurant.id);
  const [days, setDays] = useState<Record<number, Shift[]>>(() => initialDays(restaurant));

  const setDay = (day: number, shifts: Shift[]) => setDays((d) => ({ ...d, [day]: shifts }));

  const save = useMutation({
    mutationFn: () => {
      const hours = Object.entries(days).flatMap(([day, shifts]) =>
        (shifts ?? []).map((s) => {
          const opensAt = toMinutes(s.open);
          let closesAt = toMinutes(s.close);
          if (closesAt <= opensAt) closesAt += 1440; // past-midnight close
          return { dayOfWeek: Number(day), opensAt, closesAt, note: null };
        }),
      );
      return adminEndpoints.putHours(restaurant.id, { hours });
    },
    onSuccess: onSaved,
  });

  return (
    <div className="max-w-2xl space-y-2">
      {DAY_NAMES.map((name, day) => {
        const shifts = days[day] ?? [];
        return (
          <div
            key={day}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-card border border-border bg-surface px-4 py-3"
          >
            <span className="w-24 shrink-0 text-sm font-medium">{name}</span>

            <div className="flex flex-1 flex-wrap items-center gap-2">
              {shifts.length === 0 && <span className="text-sm text-muted">Closed</span>}
              {shifts.map((shift, i) => {
                const overnight = toMinutes(shift.close) <= toMinutes(shift.open);
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={shift.open}
                      onChange={(e) =>
                        setDay(
                          day,
                          shifts.map((s, j) => (j === i ? { ...s, open: e.target.value } : s)),
                        )
                      }
                      className={cn(adminInput, 'w-28 py-1.5')}
                    />
                    <span className="text-muted">–</span>
                    <input
                      type="time"
                      value={shift.close}
                      onChange={(e) =>
                        setDay(
                          day,
                          shifts.map((s, j) => (j === i ? { ...s, close: e.target.value } : s)),
                        )
                      }
                      className={cn(adminInput, 'w-28 py-1.5')}
                    />
                    {overnight && <span className="text-xs text-muted">+1d</span>}
                    <button
                      type="button"
                      onClick={() =>
                        setDay(
                          day,
                          shifts.filter((_, j) => j !== i),
                        )
                      }
                      className="text-muted hover:text-danger"
                      aria-label="Remove shift"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDay(day, [...shifts, { open: '09:00', close: '21:00' }])}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-strong hover:underline"
              >
                <Plus className="size-3.5" /> Add
              </button>
              {shifts.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setDays((d) => {
                      const next = { ...d };
                      for (let k = 0; k < 7; k++) next[k] = shifts.map((s) => ({ ...s }));
                      return next;
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
                  title="Copy these hours to every day"
                >
                  <Copy className="size-3.5" /> To all
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="pt-3">
        <SaveButton
          onSave={() => save.mutate()}
          isPending={save.isPending}
          isSuccess={save.isSuccess}
          error={save.error}
        />
      </div>
    </div>
  );
}
