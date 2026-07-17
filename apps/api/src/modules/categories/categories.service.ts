import type { CategoryDto } from '@ku-food-hunt/shared';

import { prisma } from '../../lib/prisma';

export async function listCategories(): Promise<CategoryDto[]> {
  const rows = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          restaurants: { where: { restaurant: { status: 'PUBLISHED', deletedAt: null } } },
        },
      },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    icon: c.icon,
    restaurantCount: c._count.restaurants,
  }));
}
