import type {
  AdminLoginInput,
  AdminOverviewDto,
  AdminRestaurantDto,
  AdminRestaurantListItemDto,
  AdminReviewCountsDto,
  AdminReviewDto,
  AdminUserDto,
  AuditLogDto,
  HeroSettingInput,
  HoursUpsertInput,
  ImageCreateInput,
  ImageUpdateInput,
  MenuUpsertInput,
  Paginated,
  RestaurantCreateInput,
  RestaurantUpdateInput,
  ReviewModerationInput,
} from '@ku-food-hunt/shared';

import { adminApi, adminUpload } from './adminClient';

interface Env<T> {
  data: T;
}

export interface AdminSession {
  admin: AdminUserDto;
  csrfToken: string;
}

export type AdminReviewList = Paginated<AdminReviewDto> & { counts: AdminReviewCountsDto };

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) search.set(k, v);
  const s = search.toString();
  return s ? `?${s}` : '';
}

export const adminEndpoints = {
  me: () => adminApi.get<Env<AdminSession>>('/auth/me').then((r) => r.data),
  login: (body: AdminLoginInput) =>
    adminApi.post<Env<AdminSession>>('/auth/login', body).then((r) => r.data),
  logout: () => adminApi.post<void>('/auth/logout'),

  overview: () => adminApi.get<Env<AdminOverviewDto>>('/overview').then((r) => r.data),
  audit: () => adminApi.get<Env<AuditLogDto[]>>('/audit').then((r) => r.data),

  listRestaurants: (params: { q?: string; status?: string }) =>
    adminApi
      .get<Env<AdminRestaurantListItemDto[]>>(`/restaurants${qs(params)}`)
      .then((r) => r.data),
  getRestaurant: (id: string) =>
    adminApi.get<Env<AdminRestaurantDto>>(`/restaurants/${id}`).then((r) => r.data),
  createRestaurant: (body: RestaurantCreateInput) =>
    adminApi.post<Env<AdminRestaurantDto>>('/restaurants', body).then((r) => r.data),
  updateRestaurant: (id: string, body: RestaurantUpdateInput) =>
    adminApi.patch<Env<AdminRestaurantDto>>(`/restaurants/${id}`, body).then((r) => r.data),
  deleteRestaurant: (id: string) => adminApi.del<void>(`/restaurants/${id}`),
  approveSubmission: (id: string) =>
    adminApi.post<Env<AdminRestaurantDto>>(`/restaurants/${id}/approve`).then((r) => r.data),
  rejectSubmission: (id: string, reason: string) =>
    adminApi
      .post<Env<AdminRestaurantDto>>(`/restaurants/${id}/reject`, { reason })
      .then((r) => r.data),

  putHours: (id: string, body: HoursUpsertInput) =>
    adminApi.put<Env<AdminRestaurantDto>>(`/restaurants/${id}/hours`, body).then((r) => r.data),
  putMenu: (id: string, body: MenuUpsertInput) =>
    adminApi.put<Env<AdminRestaurantDto>>(`/restaurants/${id}/menu`, body).then((r) => r.data),

  addImage: (id: string, body: ImageCreateInput) =>
    adminApi.post<Env<AdminRestaurantDto>>(`/restaurants/${id}/images`, body).then((r) => r.data),
  updateImage: (id: string, imageId: string, body: ImageUpdateInput) =>
    adminApi
      .patch<Env<AdminRestaurantDto>>(`/restaurants/${id}/images/${imageId}`, body)
      .then((r) => r.data),
  deleteImage: (id: string, imageId: string) =>
    adminApi
      .del<Env<AdminRestaurantDto>>(`/restaurants/${id}/images/${imageId}`)
      .then((r) => r.data),
  reorderImages: (id: string, ids: string[]) =>
    adminApi
      .put<Env<AdminRestaurantDto>>(`/restaurants/${id}/images/reorder`, { ids })
      .then((r) => r.data),
  uploadPhoto: (file: File) =>
    adminUpload<Env<{ url: string }>>('/uploads/restaurant-photo', file).then((r) => r.data),

  listReviews: (params: { status?: string; page?: string }) =>
    adminApi.get<AdminReviewList>(`/reviews${qs(params)}`),
  moderateReview: (id: string, body: ReviewModerationInput) =>
    adminApi.patch<void>(`/reviews/${id}`, body),
  deleteReview: (id: string) => adminApi.del<void>(`/reviews/${id}`),

  getHero: () => adminApi.get<Env<HeroSettingInput | null>>('/hero').then((r) => r.data),
  putHero: (body: HeroSettingInput) =>
    adminApi.put<Env<HeroSettingInput>>('/hero', body).then((r) => r.data),
  putFeatured: (ids: string[]) => adminApi.put<void>('/featured', { ids }),
};
