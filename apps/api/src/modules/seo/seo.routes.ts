import { Router } from 'express';

import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';

export const seoRouter = Router();

const escapeXml = (s: string) =>
  s.replace(
    /[<>&'"]/g,
    (c) => `&${{ '<': 'lt', '>': 'gt', '&': 'amp', "'": 'apos', '"': 'quot' }[c]};`,
  );

const STATIC_ROUTES = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/explore', changefreq: 'daily', priority: '0.9' },
  { loc: '/map', changefreq: 'weekly', priority: '0.7' },
  { loc: '/about', changefreq: 'monthly', priority: '0.5' },
];

/** Dynamic sitemap: the static routes plus every published restaurant detail page. */
seoRouter.get('/sitemap.xml', async (_req, res) => {
  const base = env.SITE_URL.replace(/\/$/, '');
  const restaurants = await prisma.restaurant.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    select: { slug: true, updatedAt: true },
    orderBy: { name: 'asc' },
  });

  const entries = [
    ...STATIC_ROUTES.map(
      (r) =>
        `  <url><loc>${escapeXml(base + r.loc)}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`,
    ),
    ...restaurants.map(
      (r) =>
        `  <url><loc>${escapeXml(`${base}/restaurants/${r.slug}`)}</loc><lastmod>${r.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  res.set('Content-Type', 'application/xml; charset=utf-8');
  res.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.send(xml);
});
