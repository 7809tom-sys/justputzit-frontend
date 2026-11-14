import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CITY_SLUGS } from "@shared/cities";
import { SEO_ROUTES, seoTagsFor } from "@shared/seoRoutes";
import {
  buildRobotsTxt,
  buildSitemapXml,
  injectSiteVerification,
  prerenderOutputPath,
  renderPrerenderedPage,
} from "@shared/seoPrerender";
import { SITE_URL, siteUrl } from "@shared/site";

const root = resolve(__dirname, "..");
const read = (relative: string) => readFileSync(resolve(root, relative), "utf8");
const template = read("client/index.html");

const EXPECTED_PATHS = [
  "/",
  "/safety",
  "/campus",
  "/campus/carroll",
  "/activity-board",
  "/community",
  "/events",
  "/city/jackson-ms",
  "/city/madison-wi",
  "/city/milwaukee-wi",
  "/city/chicago-il",
  "/city/atlanta-ga",
];

describe("www as the one public address", () => {
  it("uses https://www.justputzit.com", () => {
    expect(SITE_URL).toBe("https://www.justputzit.com");
    expect(siteUrl("/")).toBe("https://www.justputzit.com/");
    expect(siteUrl("/events/?x=1#y")).toBe("https://www.justputzit.com/events");
  });

  it("has no non-www canonical, og:url or og:image left in index.html or page SEO code", () => {
    const sources = [
      "client/index.html",
      "client/src/hooks/useSEO.ts",
      "client/src/pages/Home.tsx",
      "client/src/pages/CityLanding.tsx",
      "client/src/pages/EventDetail.tsx",
      "client/src/pages/ThingsToDo.tsx",
      "client/src/pages/Entertainment.tsx",
    ];
    for (const file of sources) expect(read(file), file).not.toMatch(/https:\/\/justputzit\.com/);
  });
});

describe("public routes", () => {
  it("covers the homepage, the public pages and every city page", () => {
    expect(SEO_ROUTES.map((r) => r.path)).toEqual(EXPECTED_PATHS);
    expect(CITY_SLUGS).toEqual(["jackson-ms", "madison-wi", "milwaukee-wi", "chicago-il", "atlanta-ga"]);
  });

  it("gives each route its own title and description", () => {
    expect(new Set(SEO_ROUTES.map((r) => r.title)).size).toBe(SEO_ROUTES.length);
    expect(new Set(SEO_ROUTES.map((r) => r.description)).size).toBe(SEO_ROUTES.length);
  });

  it("is used by the pages themselves so tags survive after the app loads", () => {
    const pages: Record<string, string> = {
      "client/src/pages/Safety.tsx": "/safety",
      "client/src/pages/Campus.tsx": "/campus",
      "client/src/pages/CampusWaitlist.tsx": "/campus/carroll",
      "client/src/pages/ActivityBoard.tsx": "/activity-board",
      "client/src/pages/Community.tsx": "/community",
      "client/src/pages/Events.tsx": "/events",
    };
    for (const [file, path] of Object.entries(pages)) expect(read(file)).toContain(`useSEO(seoTagsFor("${path}"))`);
    expect(seoTagsFor("/events").canonical).toBe("https://www.justputzit.com/events");
  });
});

describe("prerendered HTML", () => {
  it("writes the homepage to index.html and other routes to <route>/index.html", () => {
    expect(prerenderOutputPath("/")).toBe("index.html");
    expect(prerenderOutputPath("/city/chicago-il")).toBe("city/chicago-il/index.html");
  });

  for (const route of SEO_ROUTES) {
    it(`renders ${route.path} with its own head and visible content`, () => {
      const html = renderPrerenderedPage(template, route);
      const url = siteUrl(route.path);
      expect(html.match(/<link rel="canonical"/g)).toHaveLength(1);
      expect(html).toContain(`<link rel="canonical" href="${url}" />`);
      expect(html).toContain(`<meta property="og:url" content="${url}" />`);
      expect(html.match(/<title>/g)).toHaveLength(1);
      expect(html).not.toContain("<title>Just Putzit</title>");
      expect(html.match(/<meta name="description"/g)).toHaveLength(1);
      expect(html).toContain('<meta name="robots" content="index, follow" />');
      expect(html).toMatch(/<div id="root"><div data-prerendered="[^"]+"[^>]*>.*<h1>.+<\/h1>/s);
      expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
      expect(html).not.toMatch(/https:\/\/justputzit\.com/);
    });
  }

  it("escapes text and embeds city JSON-LD under the id useSEO updates", () => {
    const route = SEO_ROUTES.find((r) => r.path === "/city/chicago-il")!;
    const html = renderPrerenderedPage(template, { ...route, heading: `<script>"x"</script>` });
    expect(html).toContain("&lt;script&gt;&quot;x&quot;&lt;/script&gt;");
    expect(html).toContain('<script type="application/ld+json" id="seo-json-ld">');
  });
});

describe("sitemap.xml and robots.txt", () => {
  it("lists every public route with its www URL", () => {
    const xml = buildSitemapXml("2026-11-14");
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(EXPECTED_PATHS.map((p) => siteUrl(p)));
    expect(xml).not.toContain("https://justputzit.com");
  });

  it("keeps the same rules and points at the www sitemap", () => {
    const robots = buildRobotsTxt();
    expect(robots).toContain("Sitemap: https://www.justputzit.com/sitemap.xml");
    for (const line of ["Allow: /", "Allow: /city/", "Disallow: /api/", "Disallow: /admin", "Disallow: /chat/"]) {
      expect(robots).toContain(line);
    }
  });
});

describe("Search Console verification", () => {
  it("adds the meta tag only when a token is configured", () => {
    expect(injectSiteVerification(template, undefined)).toBe(template);
    expect(injectSiteVerification(template, "  ")).toBe(template);
    const html = injectSiteVerification(template, "abc123");
    expect(html).toContain('<meta name="google-site-verification" content="abc123" />');
  });

  it("is not hard-coded in index.html", () => {
    expect(template).not.toContain("google-site-verification");
  });
});

describe("Vercel routing", () => {
  const vercel = JSON.parse(read("vercel.json")) as { rewrites: { source: string; destination: string }[] };

  it("serves each prerendered route its own file and everything else the app shell", () => {
    for (const path of EXPECTED_PATHS.filter((p) => p !== "/")) {
      expect(vercel.rewrites).toContainEqual({ source: path, destination: `${path}/index.html` });
    }
    expect(vercel.rewrites.at(-1)).toEqual({ source: "/(.*)", destination: "/app-shell.html" });
  });

  it("serves the built sitemap.xml and robots.txt instead of proxying them to the API", () => {
    expect(vercel.rewrites.some((r) => r.source === "/sitemap.xml" || r.source === "/robots.txt")).toBe(false);
  });

  it("uses the app shell as the service worker's navigation fallback", () => {
    const config = read("vite.config.ts");
    expect(config).toContain("navigateFallback: `/${APP_SHELL_FILE}`");
    expect(read("scripts/seoPrerenderPlugin.ts")).toContain('export const APP_SHELL_FILE = "app-shell.html";');
  });
});
