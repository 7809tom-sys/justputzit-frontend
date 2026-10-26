// Optional Umami analytics. The script is added only when both variables are set at build time; a static
// <script src="%VITE_ANALYTICS_ENDPOINT%/umami"> in index.html is left unreplaced (and requested literally) when
// they are not.

export function loadAnalytics() {
  const endpoint = (import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined)?.trim().replace(/\/+$/, "");
  const websiteId = (import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined)?.trim();
  if (!endpoint || !websiteId) return;

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint}/umami`;
  script.dataset.websiteId = websiteId;
  document.head.appendChild(script);
}
