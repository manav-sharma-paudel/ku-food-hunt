import type { AdminRoleValue, RestaurantStatusValue } from '../schemas/admin';

/**
 * Statuses an EDITOR (moderator) may move a listing into. Everything else —
 * PUBLISHED and ARCHIVED — is SUPERADMIN-only.
 *
 * The asymmetry matters: publishing was always gated, but taking a live listing
 * down is equally consequential and an EDITOR cannot undo it, because putting it
 * back requires SUPERADMIN. Deletion is already SUPERADMIN-only, so leaving the
 * unpublish path open would let the weaker role reach the same outcome by a
 * different route.
 */
const EDITOR_STATUSES: readonly RestaurantStatusValue[] = ['DRAFT', 'PENDING', 'REJECTED'];

/**
 * Whether `role` may move a restaurant from `current` to `next`. Shared so the
 * admin UI can grey out the options the API would reject, rather than letting a
 * moderator pick one and discover the 403 on save.
 *
 * `current` is omitted when creating a restaurant, which has no prior status.
 */
export function canSetRestaurantStatus(
  role: AdminRoleValue,
  next: RestaurantStatusValue,
  current?: RestaurantStatusValue,
): boolean {
  if (role === 'SUPERADMIN') return true;
  // A no-op is always allowed: editing a live listing without touching its
  // status is ordinary moderation work.
  if (next === current) return true;
  if (!EDITOR_STATUSES.includes(next)) return false;
  // Reached only for an EDITOR-allowed target, so this is the unpublish case.
  return current !== 'PUBLISHED';
}

/** Human-readable reason a status change is refused, for the API error and the UI hint. */
export function restaurantStatusDeniedReason(
  next: RestaurantStatusValue,
  current?: RestaurantStatusValue,
): string {
  if (next === 'PUBLISHED') {
    return 'Only an administrator can publish a restaurant. Save it as a draft for an admin to review.';
  }
  if (current === 'PUBLISHED') {
    return 'Only an administrator can unpublish a live restaurant.';
  }
  return `Only an administrator can move a restaurant to ${next.charAt(0) + next.slice(1).toLowerCase()}.`;
}
