import { formatMinutes, getNepalClock, type OpeningHourSlot } from '@ku-food-hunt/shared';

/** Live open/closed label from today's slots, evaluated in Nepal time. */
export function openStatus(
  todayHours: OpeningHourSlot[],
  fallbackOpen: boolean,
): { open: boolean; label: string } {
  const { minutes } = getNepalClock();
  const current = todayHours.find((s) => minutes >= s.opensAt && minutes < s.closesAt);

  if (current) return { open: true, label: `Open · closes ${formatMinutes(current.closesAt)}` };

  // Not inside a slot today — could still be open from yesterday's late shift.
  if (fallbackOpen) return { open: true, label: 'Open now' };

  const next = todayHours.find((s) => s.opensAt > minutes);
  return { open: false, label: next ? `Closed · opens ${formatMinutes(next.opensAt)}` : 'Closed' };
}
