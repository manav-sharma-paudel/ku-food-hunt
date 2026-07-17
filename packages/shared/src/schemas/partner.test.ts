import { describe, expect, it } from 'vitest';

import { partnerSubmissionSchema } from './partner';

const valid = {
  name: 'Sunrise Sekuwa House',
  description: 'Charcoal-grilled sekuwa and momos, two minutes from the KU gate.',
  address: 'KU Road, Dhulikhel',
  latitude: 27.6194,
  longitude: 85.5386,
  categorySlugs: ['nepali'],
  priceBand: 'BUDGET',
  submitterName: 'Sita Shrestha',
  submitterEmail: 'sita@example.com',
  submitterPhone: '9800000000',
};

describe('partnerSubmissionSchema', () => {
  it('accepts a minimal valid submission and applies defaults', () => {
    const parsed = partnerSubmissionSchema.parse(valid);
    expect(parsed.hasDelivery).toBe(false);
    expect(parsed.hours).toEqual([]);
    expect(parsed.galleryPhotoUrls).toEqual([]);
  });

  it('collapses empty optional strings to undefined', () => {
    const parsed = partnerSubmissionSchema.parse({ ...valid, phone: '  ', websiteUrl: '' });
    expect(parsed.phone).toBeUndefined();
    expect(parsed.websiteUrl).toBeUndefined();
  });

  it('rejects a filled honeypot', () => {
    expect(partnerSubmissionSchema.safeParse({ ...valid, website: 'spam.biz' }).success).toBe(
      false,
    );
  });

  it('rejects min price above max price', () => {
    expect(
      partnerSubmissionSchema.safeParse({ ...valid, priceMinNpr: 500, priceMaxNpr: 100 }).success,
    ).toBe(false);
    expect(
      partnerSubmissionSchema.safeParse({ ...valid, priceMinNpr: 100, priceMaxNpr: 500 }).success,
    ).toBe(true);
  });

  it('requires at least one cuisine', () => {
    expect(partnerSubmissionSchema.safeParse({ ...valid, categorySlugs: [] }).success).toBe(false);
  });

  it('rejects a photo URL outside our uploads origin', () => {
    expect(
      partnerSubmissionSchema.safeParse({ ...valid, coverPhotoUrl: 'https://evil.example/x.jpg' })
        .success,
    ).toBe(false);
    expect(
      partnerSubmissionSchema.safeParse({
        ...valid,
        coverPhotoUrl: '/uploads/restaurants/abc-123.webp',
      }).success,
    ).toBe(true);
  });

  it('rejects an invalid submitter email', () => {
    expect(
      partnerSubmissionSchema.safeParse({ ...valid, submitterEmail: 'not-an-email' }).success,
    ).toBe(false);
  });

  it('rejects a too-short description', () => {
    expect(partnerSubmissionSchema.safeParse({ ...valid, description: 'Nice.' }).success).toBe(
      false,
    );
  });
});
