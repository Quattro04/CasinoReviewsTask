/**
 * Canonical site origin, used for canonical URLs, OpenGraph, JSON-LD and the
 * sitemap. Prefers NEXT_PUBLIC_SITE_URL; falls back to the Vercel-provided URL,
 * then localhost for dev. Never has a trailing slash.
 */
export function siteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    "http://localhost:3000";
  return fromEnv.replace(/\/+$/, "");
}

/** Build an absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
