const SITE_NAME = "AirQuality Ukraine";
const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://airquality.ua";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface SEOMetaProps {
  title: string;
  description: string;
  /** Path relative to the root, e.g. "/map" */
  path?: string;
  ogImage?: string;
  /** JSON-LD object(s) for this specific page */
  schema?: object | object[];
}

/**
 * React 19 hoists <title>, <meta>, and <link> elements rendered anywhere in
 * the tree straight into <head>, so no react-helmet / portal needed.
 */
export function SEOMeta({
  title,
  description,
  path = "/",
  ogImage = DEFAULT_OG_IMAGE,
  schema,
}: SEOMetaProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Per-page JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(
            Array.isArray(schema)
              ? { "@context": "https://schema.org", "@graph": schema }
              : { "@context": "https://schema.org", ...schema }
          )}
        </script>
      )}
    </>
  );
}
