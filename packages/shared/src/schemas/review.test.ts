import { describe, expect, it } from 'vitest';

import { createReviewSchema } from './review';

const valid = {
  rating: 5,
  body: 'Genuinely the best momo near the KU gate, and the tea is unbeatable.',
};

describe('createReviewSchema', () => {
  it('accepts a minimal valid review', () => {
    const parsed = createReviewSchema.parse(valid);
    expect(parsed.rating).toBe(5);
    expect(parsed.authorName).toBeUndefined();
  });

  it('coerces a blank author name to undefined (anonymous)', () => {
    expect(createReviewSchema.parse({ ...valid, authorName: '   ' }).authorName).toBeUndefined();
  });

  it('trims and keeps a real author name', () => {
    expect(createReviewSchema.parse({ ...valid, authorName: '  Sita  ' }).authorName).toBe('Sita');
  });

  it('rejects a body that is too short', () => {
    expect(createReviewSchema.safeParse({ ...valid, body: 'meh' }).success).toBe(false);
  });

  it('rejects an out-of-range rating', () => {
    expect(createReviewSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
    expect(createReviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
  });

  it('rejects a filled honeypot field', () => {
    expect(createReviewSchema.safeParse({ ...valid, website: 'http://spam.example' }).success).toBe(
      false,
    );
  });

  it('accepts our own upload paths but rejects foreign or unsafe URLs', () => {
    expect(
      createReviewSchema.safeParse({ ...valid, imageUrls: ['/uploads/reviews/abc-123.jpg'] })
        .success,
    ).toBe(true);
    expect(
      createReviewSchema.safeParse({ ...valid, imageUrls: ['https://evil.example/x.jpg'] }).success,
    ).toBe(false);
    expect(
      createReviewSchema.safeParse({ ...valid, imageUrls: ['/uploads/reviews/x.svg'] }).success,
    ).toBe(false);
  });

  it('rejects more than the photo limit', () => {
    const urls = Array.from({ length: 4 }, (_, i) => `/uploads/reviews/p${i}.png`);
    expect(createReviewSchema.safeParse({ ...valid, imageUrls: urls }).success).toBe(false);
  });
});
