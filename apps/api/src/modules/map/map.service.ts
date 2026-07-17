import {
  getNepalClock,
  isOpenAt,
  type MapRestaurantDto,
  type OpeningHourSlot,
} from '@ku-food-hunt/shared';

import { prisma } from '../../lib/prisma';
import { publishedWhere } from '../restaurants/restaurants.service';

export async function listMapRestaurants(): Promise<MapRestaurantDto[]> {
  const rows = await prisma.restaurant.findMany({
    where: publishedWhere,
    include: {
      categories: { include: { category: true } },
      openingHours: true,
      images: { where: { type: 'COVER' }, take: 1 },
    },
  });

  const clock = getNepalClock();

  return rows.map((r) => {
    const slots: OpeningHourSlot[] = r.openingHours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
    }));
    const primary = r.categories[0]?.category;

    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      latitude: r.latitude,
      longitude: r.longitude,
      avgRating: r.avgRating,
      reviewCount: r.reviewCount,
      priceBand: r.priceBand,
      primaryCategory: primary ? { slug: primary.slug, name: primary.name } : null,
      coverImageUrl: r.images[0]?.url ?? null,
      todayHours: slots
        .filter((s) => s.dayOfWeek === clock.dayOfWeek)
        .sort((a, b) => a.opensAt - b.opensAt),
      isOpenNow: isOpenAt(slots, clock.dayOfWeek, clock.minutes),
    };
  });
}
