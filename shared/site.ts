/**
 * The one public address of the site. justputzit.com permanently redirects to www, so every canonical,
 * og:url, sitemap <loc> and robots.txt Sitemap line uses this origin to give Google a single signal.
 */
export const SITE_URL = "https://www.justputzit.com";

export const SITE_NAME = "Just Putzit";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/just-putzit-og-image_b5de2dfe.png`;

/** Absolute www URL for a site path ("/" stays "https://www.justputzit.com/"). Query and hash are dropped. */
export function siteUrl(path: string): string {
  const clean = (path || "/").split(/[?#]/)[0] || "/";
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
  const normalized = withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
  return `${SITE_URL}${normalized}`;
}

/** The document title used everywhere: page title plus the site name unless it already contains it. */
export function formatPageTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}
