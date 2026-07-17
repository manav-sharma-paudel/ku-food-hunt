import { describe, expect, it } from 'vitest';

import { KU_COORDINATES } from '../constants';
import { formatNpr } from './format';
import { formatDistance, haversineDistanceMeters } from './geo';
import { slugify } from './slugify';

describe('haversineDistanceMeters', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistanceMeters(KU_COORDINATES, KU_COORDINATES)).toBe(0);
  });

  it('measures ~1.11 km per 0.01° of latitude', () => {
    const north = {
      latitude: KU_COORDINATES.latitude + 0.01,
      longitude: KU_COORDINATES.longitude,
    };
    const d = haversineDistanceMeters(KU_COORDINATES, north);
    expect(d).toBeGreaterThan(1_050);
    expect(d).toBeLessThan(1_170);
  });
});

describe('formatDistance', () => {
  it('uses meters under 1 km', () => {
    expect(formatDistance(650)).toBe('650 m');
  });

  it('uses km at 1 km and above', () => {
    expect(formatDistance(1_234)).toBe('1.2 km');
  });

  it('returns empty string for invalid input', () => {
    expect(formatDistance(Number.NaN)).toBe('');
    expect(formatDistance(-5)).toBe('');
  });
});

describe('slugify', () => {
  it('builds clean URL slugs', () => {
    expect(slugify('Himalayan Momo House!')).toBe('himalayan-momo-house');
    expect(slugify('  Café  Déjà Vu ')).toBe('cafe-deja-vu');
  });
});

describe('formatNpr', () => {
  it('formats with lakh-style digit grouping', () => {
    expect(formatNpr(250)).toBe('Rs. 250');
    expect(formatNpr(125000)).toBe('Rs. 1,25,000');
  });
});
