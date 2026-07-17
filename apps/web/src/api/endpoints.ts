import type {
  CategoryDto,
  CreateReviewInput,
  HomePayloadDto,
  MapRestaurantDto,
  Paginated,
  RestaurantCardDto,
  RestaurantDetailDto,
  ReviewDto,
  SearchSuggestionsDto,
} from '@ku-food-hunt/shared';

import { apiGet, apiPost, apiUpload, toQuery } from './client';

interface DataEnvelope<T> {
  data: T;
}

export type RestaurantListParams = Record<string, string | number | boolean | undefined>;

export const endpoints = {
  home: () => apiGet<DataEnvelope<HomePayloadDto>>('/home').then((r) => r.data),

  categories: () => apiGet<DataEnvelope<CategoryDto[]>>('/categories').then((r) => r.data),

  restaurants: (params: RestaurantListParams, signal?: AbortSignal) =>
    apiGet<Paginated<RestaurantCardDto>>(`/restaurants${toQuery(params)}`, signal),

  restaurant: (slug: string) =>
    apiGet<DataEnvelope<RestaurantDetailDto>>(`/restaurants/${slug}`).then((r) => r.data),

  reviews: (slug: string, params: RestaurantListParams) =>
    apiGet<Paginated<ReviewDto>>(`/restaurants/${slug}/reviews${toQuery(params)}`),

  createReview: (slug: string, input: CreateReviewInput) =>
    apiPost<DataEnvelope<ReviewDto>>(`/restaurants/${slug}/reviews`, input).then((r) => r.data),

  voteHelpful: (reviewId: string) =>
    apiPost<DataEnvelope<{ helpfulCount: number; voted: boolean }>>(
      `/reviews/${reviewId}/helpful`,
    ).then((r) => r.data),

  uploadReviewPhoto: (file: File) => {
    const form = new FormData();
    form.append('photo', file);
    return apiUpload<DataEnvelope<{ url: string }>>('/uploads/review-photo', form).then(
      (r) => r.data,
    );
  },

  mapRestaurants: () =>
    apiGet<DataEnvelope<MapRestaurantDto[]>>('/map/restaurants').then((r) => r.data),

  searchSuggest: (q: string, signal?: AbortSignal) =>
    apiGet<DataEnvelope<SearchSuggestionsDto>>(`/search/suggest${toQuery({ q })}`, signal).then(
      (r) => r.data,
    ),
};
