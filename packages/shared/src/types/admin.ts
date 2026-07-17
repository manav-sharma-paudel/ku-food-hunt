import type { PriceBand } from '../constants';
import type {
  AdminRoleValue,
  ImageTypeValue,
  RestaurantStatusValue,
  ReviewStatusValue,
} from '../schemas/admin';

export interface AdminUserDto {
  id: string;
  email: string;
  name: string;
  role: AdminRoleValue;
  lastLoginAt: string | null;
}

/** Row in the admin restaurant table. */
export interface AdminRestaurantListItemDto {
  id: string;
  slug: string;
  name: string;
  status: RestaurantStatusValue;
  priceBand: PriceBand;
  avgRating: number;
  reviewCount: number;
  categoryNames: string[];
  isFeatured: boolean;
  featuredRank: number | null;
  coverImageUrl: string | null;
  updatedAt: string;
  // Partner-submission context (null for admin-created restaurants).
  submittedAt: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
}

export interface AdminImageDto {
  id: string;
  url: string;
  type: ImageTypeValue;
  alt: string | null;
  sortOrder: number;
}

export interface AdminHourDto {
  dayOfWeek: number;
  opensAt: number;
  closesAt: number;
  note: string | null;
}

export interface AdminMenuItemDto {
  name: string;
  description: string | null;
  priceNpr: number;
  isAvailable: boolean;
  isPopular: boolean;
  isVegetarian: boolean;
}

export interface AdminMenuCategoryDto {
  name: string;
  items: AdminMenuItemDto[];
}

/** Full restaurant payload for the tabbed editor. */
export interface AdminRestaurantDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string;
  phone: string | null;
  googlePlaceId: string | null;
  latitude: number;
  longitude: number;
  priceBand: PriceBand;
  priceMinNpr: number | null;
  priceMaxNpr: number | null;
  hasQrPayment: boolean;
  hasDelivery: boolean;
  hasVegOptions: boolean;
  isFeatured: boolean;
  status: RestaurantStatusValue;
  categorySlugs: string[];
  avgRating: number;
  reviewCount: number;
  images: AdminImageDto[];
  hours: AdminHourDto[];
  menu: AdminMenuCategoryDto[];
  // Partner-submission context (null for admin-created restaurants). The
  // submitter contact is approval correspondence, never exposed publicly.
  legalName: string | null;
  websiteUrl: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterPhone: string | null;
  submittedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewDto {
  id: string;
  restaurantSlug: string;
  restaurantName: string;
  authorName: string | null;
  rating: number;
  body: string;
  status: ReviewStatusValue;
  helpfulCount: number;
  imageCount: number;
  createdAt: string;
}

export interface AdminReviewCountsDto {
  PUBLISHED: number;
  HIDDEN: number;
  FLAGGED: number;
}

export interface AuditLogDto {
  id: string;
  adminName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
}

export interface AdminOverviewDto {
  restaurants: { total: number; published: number; draft: number; pending: number };
  reviews: AdminReviewCountsDto;
  featuredCount: number;
  recentAudit: AuditLogDto[];
}
