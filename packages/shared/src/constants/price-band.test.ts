import { describe, expect, it } from 'vitest';

import { derivePriceBand } from './index';

describe('derivePriceBand', () => {
  it('buckets by the midpoint when both ends are set', () => {
    expect(derivePriceBand(100, 150)).toBe('BUDGET'); // mid 125
    expect(derivePriceBand(100, 500)).toBe('STANDARD'); // mid 300
    expect(derivePriceBand(600, 900)).toBe('PREMIUM'); // mid 750
  });

  it('uses the single known end when only one is set', () => {
    expect(derivePriceBand(150, null)).toBe('BUDGET');
    expect(derivePriceBand(null, 350)).toBe('STANDARD');
    expect(derivePriceBand(800, null)).toBe('PREMIUM');
  });

  it('returns null when neither end is known', () => {
    expect(derivePriceBand(null, null)).toBeNull();
    expect(derivePriceBand(undefined, undefined)).toBeNull();
  });

  it('honours the label thresholds at the boundaries (<200, 200–500, >500)', () => {
    expect(derivePriceBand(199, 199)).toBe('BUDGET');
    expect(derivePriceBand(200, 200)).toBe('STANDARD');
    expect(derivePriceBand(500, 500)).toBe('STANDARD');
    expect(derivePriceBand(501, 501)).toBe('PREMIUM');
  });

  it('treats 0 as a real value, not missing', () => {
    expect(derivePriceBand(0, 0)).toBe('BUDGET');
    expect(derivePriceBand(0, null)).toBe('BUDGET');
  });
});
