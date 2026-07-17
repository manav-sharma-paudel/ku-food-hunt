import type { PriceBand } from '../constants';
import type { OpeningHourSlot } from '../utils/open-hours';

export type ImageType = 'COVER' | 'GALLERY' | 'MENU_SCAN';

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  icon: string;
  restaurantCount: number;
}

export interface CategoryRefDto {
  slug: string;
  name: string;
}

export interface OpeningHourDto extends OpeningHourSlot {
  id: string;
  note: string | null;
}

export interface RestaurantImageDto {
  id: string;
  url: string;
  alt: string;
  type: ImageType;
  sortOrder: number;
  width: number | null;
  height: number | null;
}

export interface MenuItemDto {
  id: string;
  name: string;
  description: string | null;
  priceNpr: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isPopular: boolean;
  isVegetarian: boolean;
}

export interface MenuCategoryDto {
  id: string;
  name: string;
  items: MenuItemDto[];
}

export interface ReviewDto {
  id: string;
  authorName: string | null;
  rating: number;
  body: string;
  helpfulCount: number;
  createdAt: string;
  images: { id: string; url: string }[];
}

export interface RestaurantCardDto {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  categories: CategoryRefDto[];
  priceBand: PriceBand;
  avgRating: number;
  reviewCount: number;
  latitude: number;
  longitude: number;
  hasQrPayment: boolean;
  hasDelivery: boolean;
  hasVegOptions: boolean;
  isFeatured: boolean;
  /** Today's slots (Nepal time) so the client can render "closes 9 PM" and recompute live. */
  todayHours: OpeningHourSlot[];
  /** Server-computed snapshot; clients should recompute with isOpenNow() for live accuracy. */
  isOpenNow: boolean;
  createdAt: string;
}

export interface RestaurantDetailDto extends RestaurantCardDto {
  description: string;
  address: string;
  phone: string | null;
  googlePlaceId: string | null;
  priceMinNpr: number | null;
  priceMaxNpr: number | null;
  images: RestaurantImageDto[];
  openingHours: OpeningHourDto[];
  menuCategories: MenuCategoryDto[];
  popularDishes: MenuItemDto[];
  nearby: RestaurantCardDto[];
  /** Published-review counts per star, index 0 = 1★ … index 4 = 5★. */
  ratingDistribution: number[];
}

export interface MapRestaurantDto {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  avgRating: number;
  reviewCount: number;
  priceBand: PriceBand;
  primaryCategory: CategoryRefDto | null;
  coverImageUrl: string | null;
  todayHours: OpeningHourSlot[];
  isOpenNow: boolean;
}

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface HeroContent {
  headline: string;
  subheadline: string;
  searchPlaceholder: string;
}

export interface Testimonial {
  quote: string;
  author: string;
  detail: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RestaurantSuggestion {
  slug: string;
  name: string;
  coverImageUrl: string | null;
}

export interface DishSuggestion {
  name: string;
  priceNpr: number;
  restaurantSlug: string;
  restaurantName: string;
}

export interface CategorySuggestion {
  slug: string;
  name: string;
}

export interface SearchSuggestionsDto {
  restaurants: RestaurantSuggestion[];
  dishes: DishSuggestion[];
  categories: CategorySuggestion[];
}

export interface HomePayloadDto {
  hero: HeroContent | null;
  featured: RestaurantCardDto[];
  popularNearKu: RestaurantCardDto[];
  recentlyAdded: RestaurantCardDto[];
  categories: CategoryDto[];
  testimonials: Testimonial[];
  faq: FaqItem[];
  popularSearches: string[];
}
