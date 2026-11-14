/**
 * Vite build plugin: prerenders the public routes, writes sitemap.xml and robots.txt, and keeps an
 * untouched SPA shell for every other route.
 *
 * Output (dist/public):
 *   index.html                      homepage, prerendered
 *   <route>/index.html              each other public route in shared/seoRoutes.ts, prerendered
 *   app-shell.html                  the plain SPA shell; vercel.json sends private/unknown routes here
 *   sitemap.xml, robots.txt         generated from the same route list, all www URLs
 *
 * It runs in writeBundle, before vite-plugin-pwa builds the service worker in closeBundle, so the
 * new HTML files are part of the precache.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { SEO_ROUTES } from "../shared/seoRoutes";
import {
  buildRobotsTxt,
  buildSitemapXml,
  injectSiteVerification,
  prerenderOutputPath,
  renderPrerenderedPage,
} from "../shared/seoPrerender";

export const APP_SHELL_FILE = "app-shell.html";

export function seoPrerender(options: { siteVerification?: string } = {}): Plugin {
  let outDir = "";
  return {
    name: "justputzit-seo-prerender",
    // Runs for the dev server and the build, so the tag is present wherever index.html is served.
    transformIndexHtml(html) {
      return injectSiteVerification(html, options.siteVerification);
    },
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    // Only called by `vite build`.
    writeBundle() {
      const template = readFileSync(path.join(outDir, "index.html"), "utf8");
      writeFileSync(path.join(outDir, APP_SHELL_FILE), template);

      for (const route of SEO_ROUTES) {
        const file = path.join(outDir, prerenderOutputPath(route.path));
        mkdirSync(path.dirname(file), { recursive: true });
        writeFileSync(file, renderPrerenderedPage(template, route));
      }

      const today = new Date().toISOString().slice(0, 10);
      writeFileSync(path.join(outDir, "sitemap.xml"), buildSitemapXml(today));
      writeFileSync(path.join(outDir, "robots.txt"), buildRobotsTxt());
      this.info?.(`prerendered ${SEO_ROUTES.length} public routes, wrote ${APP_SHELL_FILE}, sitemap.xml, robots.txt`);
    },
  };
}
