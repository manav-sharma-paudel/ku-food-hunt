import {
  getNepalClock,
  haversineDistanceMeters,
  KU_COORDINATES,
  type FaqItem,
  type HeroContent,
  type HomePayloadDto,
  type Testimonial,
} from '@ku-food-hunt/shared';

import { prisma } from '../../lib/prisma';
import { listCategories } from '../categories/categories.service';
import { cardInclude, publishedWhere, toCard } from '../restaurants/restaurants.service';

const SETTING_KEYS = ['hero_content', 'faq', 'testimonials', 'popular_searches'];

export async function getHomePayload(): Promise<HomePayloadDto> {
  const [settings, rows, categories] = await Promise.all([
    prisma.siteSetting.findMany({ where: { key: { in: SETTING_KEYS } } }),
    prisma.restaurant.findMany({ where: publishedWhere, include: cardInclude }),
    listCategories(),
  ]);

  const setting = <T>(key: string): T | null =>
    (settings.find((s) => s.key === key)?.value as T | undefined) ?? null;

  const clock = getNepalClock();
  const cards = rows.map((r) => ({ row: r, card: toCard(r, clock) }));

  const featured = cards
    .filter(({ row }) => row.isFeatured)
    .sort((a, b) => (a.row.featuredRank ?? 99) - (b.row.featuredRank ?? 99))
    .slice(0, 6)
    .map(({ card }) => card);

  const popularNearKu = cards
    .filter(({ card }) => haversineDistanceMeters(KU_COORDINATES, card) <= 1500)
    .sort((a, b) => b.card.avgRating - a.card.avgRating || b.card.reviewCount - a.card.reviewCount)
    .slice(0, 6)
    .map(({ card }) => card);

  const recentlyAdded = [...cards]
    .sort((a, b) => b.card.createdAt.localeCompare(a.card.createdAt))
    .slice(0, 6)
    .map(({ card }) => card);

  return {
    hero: setting<HeroContent>('hero_content'),
    featured,
    popularNearKu,
    recentlyAdded,
    categories,
    testimonials: setting<Testimonial[]>('testimonials') ?? [],
    faq: setting<FaqItem[]>('faq') ?? [],
    popularSearches: setting<string[]>('popular_searches') ?? [],
  };
}
