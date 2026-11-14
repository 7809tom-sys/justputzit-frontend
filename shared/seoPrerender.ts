/**
 * Pure string helpers for the build-time prerender. No DOM, no Node APIs, so they run inside the Vite
 * build and in unit tests alike.
 *
 * The prerendered HTML is the built index.html with route-specific head tags and a static, readable
 * version of the page inside #root. main.tsx mounts the app with createRoot, which replaces that static
 * content on load, so there is no hydration mismatch to manage.
 */
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, formatPageTitle, siteUrl } from "./site";
import { ROBOTS_ALLOW, ROBOTS_DISALLOW, SEO_NAV_LINKS, SEO_ROUTES, type SeoRoute } from "./seoRoutes";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replaces <meta {attr}="{key}" ...> (attribute order does not matter) or adds it before </head>. */
export function setHeadMeta(html: string, attr: "name" | "property", key: string, content: string): string {
  const tag = `<meta ${attr}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(`<meta\\b[^>]*\\b${attr}="${escapeRegExp(key)}"[^>]*>`, "i");
  return pattern.test(html) ? html.replace(pattern, () => tag) : html.replace("</head>", () => `    ${tag}\n  </head>`);
}

export function setCanonicalLink(html: string, href: string): string {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
  const pattern = /<link\b[^>]*\brel="canonical"[^>]*>/i;
  return pattern.test(html) ? html.replace(pattern, () => tag) : html.replace("</head>", () => `    ${tag}\n  </head>`);
}

/**
 * Adds <meta name="google-site-verification"> when a token is configured (VITE_GOOGLE_SITE_VERIFICATION).
 * With no token the HTML is returned unchanged.
 */
export function injectSiteVerification(html: string, token: string | undefined): string {
  const value = (token ?? "").trim();
  if (!value) return html;
  return setHeadMeta(html, "name", "google-site-verification", value);
}

function renderBody(route: SeoRoute): string {
  const highlights = route.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const nav = SEO_NAV_LINKS.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`).join("");
  return [
    `<div data-prerendered="${escapeHtml(route.path)}" style="max-width:48rem;margin:0 auto;padding:2rem 1rem;font-family:Nunito,system-ui,sans-serif;line-height:1.5">`,
    `<header><a href="/"><img src="/brand/justputzit-logo-transparent_def33678.png" alt="${SITE_NAME}" height="44" /></a></header>`,
    `<main>`,
    `<h1>${escapeHtml(route.heading)}</h1>`,
    `<p>${escapeHtml(route.intro)}</p>`,
    highlights ? `<ul>${highlights}</ul>` : "",
    `<p><a href="/signup">Join ${SITE_NAME} free</a> · <a href="/login">Sign in</a></p>`,
    `</main>`,
    `<nav aria-label="Explore ${SITE_NAME}"><ul>${nav}</ul></nav>`,
    `<footer><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></footer>`,
    `</div>`,
  ].join("");
}

/** Returns the full static HTML for one public route, built from the app's index.html. */
export function renderPrerenderedPage(template: string, route: SeoRoute): string {
  const rootTag = '<div id="root"></div>';
  if (!template.includes(rootTag)) throw new Error('index.html has no empty <div id="root"></div> to prerender into');

  const title = formatPageTitle(route.title);
  const url = siteUrl(route.path);
  let html = template;

  html = /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(title)}</title>`)
    : html.replace("</head>", () => `    <title>${escapeHtml(title)}</title>\n  </head>`);
  html = setHeadMeta(html, "name", "description", route.description);
  html = setCanonicalLink(html, url);
  html = setHeadMeta(html, "property", "og:title", title);
  html = setHeadMeta(html, "property", "og:description", route.description);
  html = setHeadMeta(html, "property", "og:url", url);
  html = setHeadMeta(html, "property", "og:image", DEFAULT_OG_IMAGE);
  html = setHeadMeta(html, "name", "twitter:title", title);
  html = setHeadMeta(html, "name", "twitter:description", route.description);
  html = setHeadMeta(html, "name", "twitter:image", DEFAULT_OG_IMAGE);
  if (route.jsonLd) {
    // Same id useSEO() writes to, so the app updates this tag instead of adding a second one.
    const json = JSON.stringify(route.jsonLd).replace(/</g, "\\u003c");
    html = html.replace("</head>", () => `    <script type="application/ld+json" id="seo-json-ld">${json}</script>\n  </head>`);
  }

  return html.replace(rootTag, () => `<div id="root">${renderBody(route)}</div>`);
}

/** Output file for a route: "/" -> "index.html", "/city/chicago-il" -> "city/chicago-il/index.html". */
export function prerenderOutputPath(path: string): string {
  return path === "/" ? "index.html" : `${path.replace(/^\/+|\/+$/g, "")}/index.html`;
}

export function buildSitemapXml(lastmod: string): string {
  const entries = SEO_ROUTES.map(
    (route) => `  <url>
    <loc>${escapeHtml(siteUrl(route.path))}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

export function buildRobotsTxt(): string {
  return `User-agent: *
${ROBOTS_ALLOW.map((path) => `Allow: ${path}`).join("\n")}

# Block private/auth pages from indexing
${ROBOTS_DISALLOW.map((path) => `Disallow: ${path}`).join("\n")}

Sitemap: ${SITE_URL}/sitemap.xml
`;
}
