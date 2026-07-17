import { PRICE_BAND_LABELS, type RestaurantDetailDto } from '@ku-food-hunt/shared';

import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from './site';

const SCHEMA_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Minutes-from-midnight → "HH:MM", wrapping past-midnight closings (e.g. 1500 → 01:00). */
function toClock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** WebSite + SearchAction — lets search engines show a sitelinks search box. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl('/explore')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Restaurant rich result — rating stars, price, address, and geo in search. */
export function restaurantJsonLd(r: RestaurantDetailDto): Record<string, unknown> {
  const priceRange =
    r.priceMinNpr && r.priceMaxNpr
      ? `Rs. ${r.priceMinNpr}–${r.priceMaxNpr}`
      : PRICE_BAND_LABELS[r.priceBand];

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: r.name,
    ...(r.description && { description: r.description }),
    url: siteUrl(`/restaurants/${r.slug}`),
    ...(r.coverImageUrl && { image: r.coverImageUrl }),
    ...(r.phone && { telephone: r.phone }),
    ...(r.categories.length && { servesCuisine: r.categories.map((c) => c.name) }),
    priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: r.address,
      addressLocality: 'Dhulikhel',
      addressRegion: 'Bagmati',
      addressCountry: 'NP',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: r.latitude,
      longitude: r.longitude,
    },
    ...(r.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: r.avgRating,
        reviewCount: r.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    ...(r.openingHours.length && {
      openingHoursSpecification: r.openingHours.map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${SCHEMA_DAYS[h.dayOfWeek]}`,
        opens: toClock(h.opensAt),
        closes: toClock(h.closesAt),
      })),
    }),
  };
}

/** Breadcrumb trail for a restaurant detail page. */
export function restaurantBreadcrumbJsonLd(r: RestaurantDetailDto) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Explore', item: siteUrl('/explore') },
      {
        '@type': 'ListItem',
        position: 2,
        name: r.name,
        item: siteUrl(`/restaurants/${r.slug}`),
      },
    ],
  };
}
