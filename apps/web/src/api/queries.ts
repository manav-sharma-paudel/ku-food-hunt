import type { CreateReviewInput } from '@ku-food-hunt/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints, type RestaurantListParams } from './endpoints';

export const queryKeys = {
  home: ['home'] as const,
  categories: ['categories'] as const,
  restaurants: (params: RestaurantListParams) => ['restaurants', params] as const,
  restaurant: (slug: string) => ['restaurant', slug] as const,
  reviews: (slug: string, params: RestaurantListParams) => ['reviews', slug, params] as const,
  mapRestaurants: ['map', 'restaurants'] as const,
  searchSuggest: (q: string) => ['search', 'suggest', q] as const,
};

export function useHome() {
  return useQuery({ queryKey: queryKeys.home, queryFn: () => endpoints.home() });
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: () => endpoints.categories() });
}

export function useRestaurants(params: RestaurantListParams) {
  return useQuery({
    queryKey: queryKeys.restaurants(params),
    queryFn: ({ signal }) => endpoints.restaurants(params, signal),
  });
}

export function useRestaurant(slug: string) {
  return useQuery({
    queryKey: queryKeys.restaurant(slug),
    queryFn: () => endpoints.restaurant(slug),
    enabled: Boolean(slug),
  });
}

export function useReviews(slug: string, params: RestaurantListParams) {
  return useQuery({
    queryKey: queryKeys.reviews(slug, params),
    queryFn: () => endpoints.reviews(slug, params),
    enabled: Boolean(slug),
  });
}

export function useMapRestaurants() {
  return useQuery({
    queryKey: queryKeys.mapRestaurants,
    queryFn: () => endpoints.mapRestaurants(),
  });
}

export function useSearchSuggest(q: string) {
  return useQuery({
    queryKey: queryKeys.searchSuggest(q),
    queryFn: ({ signal }) => endpoints.searchSuggest(q, signal),
    enabled: q.trim().length >= 1,
    staleTime: 30_000,
  });
}

/** Submit an anonymous review, then refresh the list + the cached rating aggregate. */
export function useCreateReview(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => endpoints.createReview(slug, input),
    onSuccess: async () => {
      // Refetch every sort variant of this restaurant's review list plus its detail
      // (whose cached avgRating/reviewCount just changed). A predicate matches all
      // ['reviews', slug, …params] keys regardless of the active sort.
      await Promise.all([
        queryClient.invalidateQueries({
          predicate: (q) => q.queryKey[0] === 'reviews' && q.queryKey[1] === slug,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.restaurant(slug) }),
      ]);
    },
  });
}

/** Upload one review photo, resolving to its served URL. */
export function useUploadReviewPhoto() {
  return useMutation({ mutationFn: (file: File) => endpoints.uploadReviewPhoto(file) });
}

/** Toggle a helpful vote on a review. */
export function useVoteHelpful() {
  return useMutation({ mutationFn: (reviewId: string) => endpoints.voteHelpful(reviewId) });
}
