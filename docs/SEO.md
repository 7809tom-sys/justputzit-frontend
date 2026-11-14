# SEO: prerendered public pages, sitemap, robots, Search Console

## One address: https://www.justputzit.com

`justputzit.com` permanently redirects to `www.justputzit.com`, so every canonical, `og:url`, sitemap
`<loc>` and the robots.txt `Sitemap:` line uses `https://www.justputzit.com` (`shared/site.ts`).

## What the build produces

`pnpm build` runs the `seoPrerender` Vite plugin (`scripts/seoPrerenderPlugin.ts`) after the bundle is
written and before the PWA service worker is generated. From the route list in `shared/seoRoutes.ts` it writes
into `dist/public`:

| File | What it is |
| --- | --- |
| `index.html` | Homepage, prerendered |
| `<route>/index.html` | `/safety`, `/campus`, `/campus/carroll`, `/activity-board`, `/community`, `/events`, `/city/<slug>` for each city in `shared/cities.ts` |
| `app-shell.html` | The plain SPA shell (unchanged `index.html`) for every other route |
| `sitemap.xml` | Every route above, www URLs, `lastmod` = build date |
| `robots.txt` | Same allow/disallow rules as before, `Sitemap: https://www.justputzit.com/sitemap.xml` |

Each prerendered page has its own `<title>`, description, canonical, Open Graph/Twitter tags (and JSON-LD for
city pages) plus a readable static version of the page inside `#root`: heading, intro, highlights, and links to
the other public pages. When the JavaScript loads, `createRoot` in `main.tsx` replaces that static content with
the app, and each page's `useSEO(seoTagsFor(...))` call keeps the same tags.

`vercel.json` rewrites each prerendered route to its file and everything else to `/app-shell.html`. The PWA
service worker falls back to `/app-shell.html` too. sitemap.xml and robots.txt are no longer proxied to the API.

### Adding a public page

Add it to `shared/seoRoutes.ts` (or a city to `shared/cities.ts`), add its rewrite to `vercel.json`, and call
`useSEO(seoTagsFor("/path"))` in the page. `tests/seoPrerender.test.ts` fails if the rewrite is missing.

## Google Search Console (manual, needs Tom's Google account)

As of 2026-11-14 there was no google-site-verification meta tag in the site, no verification file in the repo, and no TXT record on justputzit.com, so the site has not been verified yet. The build can add the HTML tag: set
`VITE_GOOGLE_SITE_VERIFICATION` in Vercel (Production) to the token and redeploy. Leave it unset otherwise.

Recommended: a **Domain property** (covers www and non-www, http and https; verified by DNS, no code needed).

1. Go to https://search.google.com/search-console and sign in with the Google account that should own the site.
2. **Add property** → **Domain** → enter `justputzit.com` → Continue.
3. Copy the `google-site-verification=...` TXT record it shows. justputzit.com's DNS is on Cloudflare: in the
   Cloudflare dashboard → DNS → Records, add a TXT record, name `@`, content = that value. Wait a few minutes, then click **Verify**.
   - Alternative: **URL prefix** property `https://www.justputzit.com/`, method **HTML tag**. Copy only the
     `content="..."` value into the Vercel env var `VITE_GOOGLE_SITE_VERIFICATION`, redeploy production, then
     click **Verify**.
4. In the new property: **Sitemaps** → enter `https://www.justputzit.com/sitemap.xml` → **Submit**.
   (The robots.txt also points crawlers at it.) Status should become "Success" with 12 discovered URLs.
5. **URL inspection** → enter `https://www.justputzit.com/` → **Request indexing**. Optionally repeat for
   `/events`, `/activity-board` and a city page such as `/city/milwaukee-wi`.
6. Use **Test live URL → View tested page → HTML** on the homepage to confirm Google sees the prerendered
   heading and the www canonical.
