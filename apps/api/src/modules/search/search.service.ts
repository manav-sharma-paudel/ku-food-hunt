import type { SearchSuggestionsDto } from '@ku-food-hunt/shared';

import { prisma } from '../../lib/prisma';
import { publishedWhere } from '../restaurants/restaurants.service';

/**
 * Grouped autocomplete across restaurants, dishes, and categories. Uses
 * case-insensitive contains, which is served by the pg_trgm GIN indexes on
 * restaurant/menu-item names — single-digit ms at this scale.
 */
export async function suggest(q: string): Promise<SearchSuggestionsDto> {
  const [restaurants, dishes, categories] = await Promise.all([
    prisma.restaurant.findMany({
      where: { ...publishedWhere, name: { contains: q, mode: 'insensitive' } },
      orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }],
      take: 5,
      include: { images: { where: { type: 'COVER' }, take: 1 } },
    }),
    prisma.menuItem.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        isAvailable: true,
        restaurant: { is: publishedWhere },
      },
      orderBy: [{ isPopular: 'desc' }],
      take: 5,
      include: { restaurant: { select: { slug: true, name: true } } },
    }),
    prisma.category.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      orderBy: { sortOrder: 'asc' },
      take: 3,
    }),
  ]);

  return {
    restaurants: restaurants.map((r) => ({
      slug: r.slug,
      name: r.name,
      coverImageUrl: r.images[0]?.url ?? null,
    })),
    dishes: dishes.map((d) => ({
      name: d.name,
      priceNpr: d.priceNpr,
      restaurantSlug: d.restaurant.slug,
      restaurantName: d.restaurant.name,
    })),
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
  };
}
