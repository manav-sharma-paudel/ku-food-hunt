import { describe, expect, it } from 'vitest';

import { RESTAURANT_STATUSES } from '../schemas/admin';
import { canApproveSubmission, canRejectSubmission, canResubmit } from './submission-status';

describe('submission status transitions', () => {
  it('allows approving only PENDING submissions', () => {
    const allowed = RESTAURANT_STATUSES.filter(canApproveSubmission);
    expect(allowed).toEqual(['PENDING']);
  });

  it('allows rejecting only PENDING submissions', () => {
    const allowed = RESTAURANT_STATUSES.filter(canRejectSubmission);
    expect(allowed).toEqual(['PENDING']);
  });

  it('allows owners to resubmit while PENDING or after REJECTED, never once decided otherwise', () => {
    const allowed = RESTAURANT_STATUSES.filter(canResubmit);
    expect(allowed).toEqual(['PENDING', 'REJECTED']);
    // The critical guards: a published restaurant or an archived (soft-deleted)
    // one can never be overwritten through the public form.
    expect(canResubmit('PUBLISHED')).toBe(false);
    expect(canResubmit('ARCHIVED')).toBe(false);
    expect(canResubmit('DRAFT')).toBe(false);
  });
});
