import {
  getNepalClock,
  haversineDistanceMeters,
  isOpenAt,
  type MenuItemDto,
  type OpeningHourSlot,
  type Paginated,
  type RestaurantCardDto,
  type RestaurantDetailDto,
  type RestaurantListQuery,
  type ReviewDto,
  type ReviewListQuery,
} from '@ku-food-hunt/shared';
import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/error-handler';

type NepalClock = ReturnType<typeof getNepalClock>;

export const publishedWhere = {
  status: 'PUBLISHED',
  deletedAt: null,
} satisfies Prisma.RestaurantWhereInput;

export const cardInclude = Prisma.validator<Prisma.RestaurantInclude>()({
  categories: { include: { category: true } },
  images: { where: { type: 'COVER' }, take: 1 },
  openingHours: true,
});

type CardRow = Prisma.RestaurantGetPayload<{ include: typeof cardInclude }>;

export function toCard(row: CardRow, clock: NepalClock): RestaurantCardDto {
  const slots: OpeningHourSlot[] = row.openingHours.map((h) => ({
    dayOfWeek: h.dayOfWeek,
    opensAt: h.opensAt,
    closesAt: h.closesAt,
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    coverImageUrl: row.images[0]?.url ?? null,
    categories: row.categories.map((rc) => ({ slug: rc.category.slug, name: rc.category.name })),
    priceBand: row.priceBand,
    avgRating: row.avgRating,
    reviewCount: row.reviewCount,
    latitude: row.latitude,
    longitude: row.longitude,
    hasQrPayment: row.hasQrPayment,
    hasDelivery: row.hasDelivery,
    hasVegOptions: row.hasVegOptions,
    isFeatured: row.isFeatured,
    todayHours: slots
      .filter((s) => s.dayOfWeek === clock.dayOfWeek)
      .sort((a, b) => a.opensAt - b.opensAt),
    isOpenNow: isOpenAt(slots, clock.dayOfWeek, clock.minutes),
    createdAt: row.createdAt.toISOString(),
  };
}

function buildWhere(query: RestaurantListQuery): Prisma.RestaurantWhereInput {
  return {
    ...publishedWhere,
    ...(query.q && {
      OR: [
        { name: { contains: query.q, mode: 'insensitive' } },
        { menuItems: { some: { name: { contains: query.q, mode: 'insensitive' } } } },
      ],
    }),
    ...(query.categories?.length && {
      categories: { some: { category: { slug: { in: query.categories } } } },
    }),
    ...(query.price?.length && { priceBand: { in: query.price } }),
    ...(query.minRating && { avgRating: { gte: query.minRating } }),
    ...(query.delivery && { hasDelivery: true }),
    ...(query.qr && { hasQrPayment: true }),
    ...(query.veg && { hasVegOptions: true }),
  };
}

function orderFor(sort: RestaurantListQuery['sort']): Prisma.RestaurantOrderByWithRelationInput[] {
  switch (sort) {
    case 'reviews':
      return [{ reviewCount: 'desc' }, { avgRating: 'desc' }];
    case 'cheapest':
      // PriceBand enum order (BUDGET < STANDARD < PREMIUM) matches price order.
      return [{ priceBand: 'asc' }, { priceMinNpr: { sort: 'asc', nulls: 'last' } }];
    case 'newest':
      return [{ createdAt: 'desc' }];
    case 'rating':
    case 'closest': // distance is computed client-side; serve the strongest default order
      return [{ avgRating: 'desc' }, { reviewCount: 'desc' }];
  }
}

export async function listRestaurants(
  query: RestaurantListQuery,
): Promise<Paginated<RestaurantCardDto>> {
  // Full fetch + in-memory paging is deliberate: the "open now" filter needs the
  // hours engine, and the whole dataset is ≤ ~150 rows (see blueprint §1).
  const rows = await prisma.restaurant.findMany({
    where: buildWhere(query),
    orderBy: orderFor(query.sort),
    include: cardInclude,
  });

  const clock = getNepalClock();
  let cards = rows.map((r) => toCard(r, clock));
  if (query.open) cards = cards.filter((c) => c.isOpenNow);

  const total = cards.length;
  const start = (query.page - 1) * query.perPage;

  return {
    data: cards.slice(start, start + query.perPage),
    meta: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    },
  };
}

export async function getRestaurantDetail(slug: string): Promise<RestaurantDetailDto> {
  const row = await prisma.restaurant.findFirst({
    where: { slug, ...publishedWhere },
    include: {
      categories: { include: { category: true } },
      images: { orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] },
      openingHours: true,
      menuCategories: {
        orderBy: { sortOrder: 'asc' },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      },
    },
  });

  if (!row) throw new HttpError(404, 'NOT_FOUND', 'Restaurant not found');

  const clock = getNepalClock();
  const card = toCard({ ...row, images: row.images.filter((i) => i.type === 'COVER') }, clock);

  const toMenuItem = (i: (typeof row.menuCategories)[number]['items'][number]): MenuItemDto => ({
    id: i.id,
    name: i.name,
    description: i.description,
    priceNpr: i.priceNpr,
    imageUrl: i.imageUrl,
    isAvailable: i.isAvailable,
    isPopular: i.isPopular,
    isVegetarian: i.isVegetarian,
  });

  const [nearby, ratingGroups] = await Promise.all([
    findNearby(row.id, row.latitude, row.longitude, clock),
    prisma.review.groupBy({
      by: ['rating'],
      where: { restaurantId: row.id, status: 'PUBLISHED', deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  // Index 0 = 1★ … index 4 = 5★.
  const ratingDistribution = [0, 0, 0, 0, 0];
  for (const g of ratingGroups) ratingDistribution[g.rating - 1] = g._count._all;

  return {
    ...card,
    description: row.description,
    address: row.address,
    phone: row.phone,
    googlePlaceId: row.googlePlaceId,
    priceMinNpr: row.priceMinNpr,
    priceMaxNpr: row.priceMaxNpr,
    images: row.images.map((i) => ({
      id: i.id,
      url: i.url,
      alt: i.alt,
      type: i.type,
      sortOrder: i.sortOrder,
      width: i.width,
      height: i.height,
    })),
    openingHours: row.openingHours
      .map((h) => ({
        id: h.id,
        dayOfWeek: h.dayOfWeek,
        opensAt: h.opensAt,
        closesAt: h.closesAt,
        note: h.note,
      }))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.opensAt - b.opensAt),
    menuCategories: row.menuCategories.map((mc) => ({
      id: mc.id,
      name: mc.name,
      items: mc.items.map(toMenuItem),
    })),
    popularDishes: row.menuCategories
      .flatMap((mc) => mc.items)
      .filter((i) => i.isPopular && i.isAvailable)
      .slice(0, 8)
      .map(toMenuItem),
    nearby,
    ratingDistribution,
  };
}

async function findNearby(
  excludeId: string,
  latitude: number,
  longitude: number,
  clock: NepalClock,
): Promise<RestaurantCardDto[]> {
  const others = await prisma.restaurant.findMany({
    where: { ...publishedWhere, id: { not: excludeId } },
    include: cardInclude,
  });

  return others
    .map((o) => ({
      row: o,
      distance: haversineDistanceMeters(
        { latitude, longitude },
        { latitude: o.latitude, longitude: o.longitude },
      ),
    }))
    .filter(({ distance }) => distance <= 1500)
    .sort((a, b) => b.row.avgRating - a.row.avgRating || a.distance - b.distance)
    .slice(0, 4)
    .map(({ row }) => toCard(row, clock));
}

export async function listReviews(
  slug: string,
  query: ReviewListQuery,
): Promise<Paginated<ReviewDto>> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, ...publishedWhere },
    select: { id: true },
  });
  if (!restaurant) throw new HttpError(404, 'NOT_FOUND', 'Restaurant not found');

  const where = {
    restaurantId: restaurant.id,
    status: 'PUBLISHED',
    deletedAt: null,
  } satisfies Prisma.ReviewWhereInput;

  const orderBy: Prisma.ReviewOrderByWithRelationInput[] =
    query.sort === 'top'
      ? [{ rating: 'desc' }, { createdAt: 'desc' }]
      : query.sort === 'helpful'
        ? [{ helpfulCount: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

  const [rows, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: rows.map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      body: r.body,
      helpfulCount: r.helpfulCount,
      createdAt: r.createdAt.toISOString(),
      images: r.images.map((i) => ({ id: i.id, url: i.url })),
    })),
    meta: {
      page: query.page,
      perPage: query.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.perPage)),
    },
  };
}
