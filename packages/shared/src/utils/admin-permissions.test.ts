import { describe, expect, it } from 'vitest';

import { canSetRestaurantStatus } from './admin-permissions';

describe('canSetRestaurantStatus', () => {
  it('lets a superadmin make any transition', () => {
    expect(canSetRestaurantStatus('SUPERADMIN', 'PUBLISHED', 'DRAFT')).toBe(true);
    expect(canSetRestaurantStatus('SUPERADMIN', 'ARCHIVED', 'PUBLISHED')).toBe(true);
    expect(canSetRestaurantStatus('SUPERADMIN', 'DRAFT', 'PUBLISHED')).toBe(true);
  });

  it('stops an editor publishing or archiving', () => {
    expect(canSetRestaurantStatus('EDITOR', 'PUBLISHED', 'DRAFT')).toBe(false);
    expect(canSetRestaurantStatus('EDITOR', 'ARCHIVED', 'DRAFT')).toBe(false);
  });

  it('stops an editor unpublishing a live listing', () => {
    // The gap this closes: publishing was gated, but DRAFT/PENDING/REJECTED are
    // all editor-allowed targets, so an editor could delist anything and then
    // not be able to put it back.
    expect(canSetRestaurantStatus('EDITOR', 'DRAFT', 'PUBLISHED')).toBe(false);
    expect(canSetRestaurantStatus('EDITOR', 'PENDING', 'PUBLISHED')).toBe(false);
    expect(canSetRestaurantStatus('EDITOR', 'REJECTED', 'PUBLISHED')).toBe(false);
  });

  it('lets an editor do ordinary moderation work', () => {
    expect(canSetRestaurantStatus('EDITOR', 'REJECTED', 'PENDING')).toBe(true);
    expect(canSetRestaurantStatus('EDITOR', 'DRAFT', 'PENDING')).toBe(true);
    expect(canSetRestaurantStatus('EDITOR', 'PENDING', 'REJECTED')).toBe(true);
  });

  it('treats a no-op as allowed so editing a live listing still saves', () => {
    expect(canSetRestaurantStatus('EDITOR', 'PUBLISHED', 'PUBLISHED')).toBe(true);
    expect(canSetRestaurantStatus('EDITOR', 'ARCHIVED', 'ARCHIVED')).toBe(true);
  });

  it('gates creation, where there is no prior status', () => {
    expect(canSetRestaurantStatus('EDITOR', 'DRAFT')).toBe(true);
    expect(canSetRestaurantStatus('EDITOR', 'PUBLISHED')).toBe(false);
    expect(canSetRestaurantStatus('EDITOR', 'ARCHIVED')).toBe(false);
  });
});
