import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from '../../lib/site';

interface SeoProps {
  /** Page title; the site name is appended automatically unless `bareTitle`. */
  title?: string;
  bareTitle?: boolean;
  description?: string;
  /** Path for the canonical + og:url, e.g. `/restaurants/aroma-cafe-bakery`. */
  path?: string;
  /** Absolute image URL for social cards (restaurant cover, etc.). */
  image?: string | null;
  type?: 'website' | 'article' | 'profile';
  noindex?: boolean;
}

/**
 * Per-route metadata. React 19 hoists `<title>`, `<meta>`, and `<link>` rendered
 * anywhere in the tree into `<head>`, and swaps them on navigation — so no head
 * manager library is needed. Every page renders one <Seo/>.
 */
export function Seo({
  title,
  bareTitle = false,
  description = SITE_DESCRIPTION,
  path,
  image,
  type = 'website',
  noindex = false,
}: SeoProps) {
  const fullTitle = !title
    ? `${SITE_NAME} — ${SITE_TAGLINE}`
    : bareTitle
      ? title
      : `${title} · ${SITE_NAME}`;
  const url = path ? siteUrl(path) : undefined;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {url && <link rel="canonical" href={url} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  );
}

/** Emits a JSON-LD structured-data block. Crawlers read it anywhere in the document. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape every `<` so restaurant-supplied text can never break out of the
  // <script> element (e.g. a name containing "</script>" or "<!--").
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
