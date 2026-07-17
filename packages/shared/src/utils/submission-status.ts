import type { RestaurantStatusValue } from '../schemas/admin';

/**
 * Partner-submission lifecycle. Approval maps onto the existing PUBLISHED status,
 * so an approved submission behaves exactly like an admin-published restaurant —
 * there is no parallel "approved" state.
 *
 *   (public form) → PENDING ─ approve → PUBLISHED
 *                       └──── reject ─→ REJECTED ─ resubmit → PENDING
 */
export function canApproveSubmission(status: RestaurantStatusValue): boolean {
  return status === 'PENDING';
}

export function canRejectSubmission(status: RestaurantStatusValue): boolean {
  return status === 'PENDING';
}

/** A rejected owner may edit and resubmit; a pending one may still amend details. */
export function canResubmit(status: RestaurantStatusValue): boolean {
  return status === 'PENDING' || status === 'REJECTED';
}
