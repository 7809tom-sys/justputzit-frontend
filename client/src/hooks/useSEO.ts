/**
 * useSEO — sets document title and meta tags dynamically per page.
 * Call this at the top of any page component to override the default SEO tags.
 */
import { useEffect } from "react";
import { SITE_NAME, formatPageTitle, siteUrl } from "@shared/site";

const DEFAULT_OG_IMAGE = "https://www.justputzit.com/brand/just-putzit-og-image_b5de2dfe.png";

interface SEOOptions {
  title: string;
  description: string;
  /** Canonical URL (defaults to the www URL of the current path, without query or hash) */
  canonical?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** JSON-LD structured data object */
  jsonLd?: object;
}


function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

function setJsonLd(data: object) {
  const id = "seo-json-ld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function useSEO({ title, description, canonical, ogImage, jsonLd }: SEOOptions) {
  useEffect(() => {
    const fullTitle = formatPageTitle(title);
    const url = canonical ?? siteUrl(window.location.pathname);
    document.title = fullTitle;

    setMeta("description", description);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:image", ogImage ?? DEFAULT_OG_IMAGE, "property");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage ?? DEFAULT_OG_IMAGE);
    setCanonical(url);

    if (jsonLd) setJsonLd(jsonLd);

    // Cleanup: restore defaults when component unmounts
    return () => {
      document.title = SITE_NAME;
    };
  }, [title, description, canonical, ogImage, jsonLd]);
}
