export const SITE_NAME = 'KU Food Hunt';
export const SITE_TAGLINE = 'Every great bite around KU';
export const SITE_DESCRIPTION =
  'Discover every restaurant, café, and food stall around Kathmandu University — real menus, NPR prices, honest student reviews, and one-tap navigation.';

/**
 * Absolute URL for a path. Prefers the build-time `VITE_SITE_URL`; falls back to
 * the current origin in the browser, or a placeholder during SSR/build. Used for
 * canonical + Open Graph tags and the sitemap.
 */
export function siteUrl(path = '/'): string {
  const base =
    import.meta.env.VITE_SITE_URL ??
    (typeof window !== 'undefined' ? window.location.origin : 'https://kufoodhunt.app');
  return new URL(path, base).toString();
}
