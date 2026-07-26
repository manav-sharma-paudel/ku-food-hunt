import { describe, expect, it } from 'vitest';

import { hoursUpsertSchema } from './admin';

const slot = (opensAt: number, closesAt: number) => ({
  hours: [{ dayOfWeek: 1, opensAt, closesAt }],
});

describe('hoursUpsertSchema', () => {
  it('accepts an ordinary same-day slot', () => {
    expect(hoursUpsertSchema.safeParse(slot(600, 1320)).success).toBe(true);
  });

  it('accepts a past-midnight slot encoded past 1440', () => {
    // 18:00 → 02:00 next day.
    expect(hoursUpsertSchema.safeParse(slot(1080, 1560)).success).toBe(true);
  });

  it('rejects a past-midnight slot written as a wrapped clock time', () => {
    // The natural mistake: 02:00 written as 120 rather than 1560. It satisfies
    // neither branch of isOpenAt(), so the restaurant reads closed at every
    // instant — in the open-now filter, on the map, and in its JSON-LD.
    expect(hoursUpsertSchema.safeParse(slot(1080, 120)).success).toBe(false);
  });

  it('rejects a zero-length slot', () => {
    expect(hoursUpsertSchema.safeParse(slot(600, 600)).success).toBe(false);
  });

  it('reports the failure against closesAt', () => {
    const result = hoursUpsertSchema.safeParse(slot(1080, 120));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['hours', 0, 'closesAt']);
    }
  });

  it('still rejects an out-of-range day or time', () => {
    expect(
      hoursUpsertSchema.safeParse({ hours: [{ dayOfWeek: 7, opensAt: 0, closesAt: 60 }] }).success,
    ).toBe(false);
    expect(hoursUpsertSchema.safeParse(slot(0, 2881)).success).toBe(false);
  });
});
