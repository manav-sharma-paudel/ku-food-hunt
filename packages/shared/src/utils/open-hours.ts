import { NEPAL_TIME_ZONE } from '../constants';

/**
 * One opening slot. Times are minutes from midnight in Nepal local time
 * (Asia/Kathmandu, UTC+5:45, no DST). closesAt > 1440 means the slot runs
 * past midnight. Multiple slots per day = split shifts; no slots = closed.
 */
export interface OpeningHourSlot {
  dayOfWeek: number; // 0 = Sunday … 6 = Saturday
  opensAt: number;
  closesAt: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Current weekday index and minutes-from-midnight in Nepal, for any instant. */
export function getNepalClock(now: Date = new Date()): { dayOfWeek: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NEPAL_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  return {
    dayOfWeek: WEEKDAYS.indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** Open at a specific Nepal weekday + minute, including yesterday's past-midnight spillover. */
export function isOpenAt(slots: OpeningHourSlot[], dayOfWeek: number, minutes: number): boolean {
  const prevDay = (dayOfWeek + 6) % 7;
  return slots.some(
    (s) =>
      (s.dayOfWeek === dayOfWeek && minutes >= s.opensAt && minutes < s.closesAt) ||
      (s.dayOfWeek === prevDay && s.closesAt > 1440 && minutes + 1440 < s.closesAt),
  );
}

/** Open right now (or at `now`), evaluated in Nepal time regardless of the device timezone. */
export function isOpenNow(slots: OpeningHourSlot[], now: Date = new Date()): boolean {
  const { dayOfWeek, minutes } = getNepalClock(now);
  return isOpenAt(slots, dayOfWeek, minutes);
}

/** "9 AM", "8:30 PM", "12:30 AM" — wraps past-midnight values into the next day. */
export function formatMinutes(totalMinutes: number): string {
  const mm = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(mm / 60);
  const min = mm % 60;
  const period = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return min === 0 ? `${h12} ${period}` : `${h12}:${String(min).padStart(2, '0')} ${period}`;
}
