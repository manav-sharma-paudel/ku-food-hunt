import { useQuery } from '@tanstack/react-query';

import { adminEndpoints } from './adminEndpoints';

export const adminKeys = {
  overview: ['admin', 'overview'] as const,
  audit: ['admin', 'audit'] as const,
  restaurants: (params: { q?: string; status?: string }) =>
    ['admin', 'restaurants', params] as const,
  restaurant: (id: string) => ['admin', 'restaurant', id] as const,
  reviews: (params: { status?: string; page?: string }) => ['admin', 'reviews', params] as const,
  hero: ['admin', 'hero'] as const,
};

export function useAdminOverview() {
  return useQuery({ queryKey: adminKeys.overview, queryFn: adminEndpoints.overview });
}

export function useAdminAudit() {
  return useQuery({ queryKey: adminKeys.audit, queryFn: adminEndpoints.audit });
}

export function useAdminRestaurants(params: { q?: string; status?: string }) {
  return useQuery({
    queryKey: adminKeys.restaurants(params),
    queryFn: () => adminEndpoints.listRestaurants(params),
  });
}

export function useAdminRestaurant(id: string | undefined) {
  return useQuery({
    queryKey: adminKeys.restaurant(id ?? 'new'),
    queryFn: () => adminEndpoints.getRestaurant(id!),
    enabled: Boolean(id),
  });
}

export function useAdminReviews(params: { status?: string; page?: string }) {
  return useQuery({
    queryKey: adminKeys.reviews(params),
    queryFn: () => adminEndpoints.listReviews(params),
  });
}

export function useAdminHero() {
  return useQuery({ queryKey: adminKeys.hero, queryFn: adminEndpoints.getHero });
}
