import { describe, expect, it } from 'vitest';

import { formatMinutes, getNepalClock, isOpenNow } from './open-hours';

// 2026-07-16 is a Thursday. Nepal is UTC+5:45 with no DST, so these are stable.
const THU_10_00_NPT = new Date('2026-07-16T04:15:00Z');
const THU_20_45_NPT = new Date('2026-07-16T15:00:00Z');
const THU_00_00_NPT = new Date('2026-07-15T18:15:00Z'); // crosses the day boundary
const THU_00_31_NPT = new Date('2026-07-15T18:46:00Z');
const THU_11_40_NPT = new Date('2026-07-16T05:55:00Z');
const THU_15_50_NPT = new Date('2026-07-16T10:05:00Z');

describe('getNepalClock', () => {
  it('converts UTC to Nepal weekday + minutes', () => {
    expect(getNepalClock(THU_10_00_NPT)).toEqual({ dayOfWeek: 4, minutes: 600 });
  });

  it('rolls into the next Nepal day across midnight', () => {
    expect(getNepalClock(THU_00_00_NPT)).toEqual({ dayOfWeek: 4, minutes: 0 });
  });
});

describe('isOpenNow', () => {
  const thursday9to20 = [{ dayOfWeek: 4, opensAt: 540, closesAt: 1200 }];

  it('is open inside regular hours', () => {
    expect(isOpenNow(thursday9to20, THU_10_00_NPT)).toBe(true);
  });

  it('is closed outside regular hours', () => {
    expect(isOpenNow(thursday9to20, THU_20_45_NPT)).toBe(false);
  });

  it('handles split shifts (closed during the gap)', () => {
    const splitShift = [
      { dayOfWeek: 4, opensAt: 360, closesAt: 660 },
      { dayOfWeek: 4, opensAt: 900, closesAt: 1200 },
    ];
    expect(isOpenNow(splitShift, THU_11_40_NPT)).toBe(false); // 11:40, in the gap
    expect(isOpenNow(splitShift, THU_15_50_NPT)).toBe(true); // 15:50, second shift
  });

  it("handles yesterday's slot running past midnight", () => {
    const wednesdayLate = [{ dayOfWeek: 3, opensAt: 1080, closesAt: 1470 }]; // 18:00–00:30
    expect(isOpenNow(wednesdayLate, THU_00_00_NPT)).toBe(true); // Thu 00:00
    expect(isOpenNow(wednesdayLate, THU_00_31_NPT)).toBe(false); // Thu 00:31, just closed
  });

  it('is closed on days with no slots', () => {
    expect(isOpenNow([], THU_10_00_NPT)).toBe(false);
  });
});

describe('formatMinutes', () => {
  it('formats on-the-hour and half-hour times', () => {
    expect(formatMinutes(540)).toBe('9 AM');
    expect(formatMinutes(1230)).toBe('8:30 PM');
  });

  it('wraps past-midnight values', () => {
    expect(formatMinutes(1470)).toBe('12:30 AM');
  });
});
