// Umami analytics. The script is added only when both variables are set at build time; a static
// <script src="%VITE_ANALYTICS_ENDPOINT%/umami"> in index.html is left unreplaced (and requested literally) when
// they are not.
//
// Events are queued until the script reports it is ready, so a signup that happens before the analytics
// script finishes downloading is still recorded. With no configuration everything here is a no-op.

type UmamiApi = {
  track: (event: string, data?: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    umami?: UmamiApi;
  }
}

export type FunnelEvent =
  | "signup_submitted"
  | "signup_succeeded"
  | "signup_failed"
  | "login_succeeded"
  | "login_failed"
  | "google_signin_started"
  | "landing_cta_clicked"
  | "city_cta_clicked";

const MAX_QUEUED_EVENTS = 25;

let ready = false;
let enabled = false;
const queue: Array<{ event: string; data?: Record<string, unknown> }> = [];

export const isAnalyticsEnabled = () => enabled;

function flush() {
  ready = true;
  while (queue.length > 0) {
    const next = queue.shift();
    if (!next) break;
    try {
      window.umami?.track(next.event, next.data);
    } catch {
      // An analytics failure must never surface to the user.
    }
  }
}

export function track(event: FunnelEvent, data?: Record<string, unknown>) {
  if (!enabled) return;
  if (ready && window.umami) {
    try {
      window.umami.track(event, data);
    } catch {
      // Ignore; instrumentation is best-effort.
    }
    return;
  }
  if (queue.length >= MAX_QUEUED_EVENTS) queue.shift();
  queue.push({ event, data });
}

export function loadAnalytics() {
  const endpoint = (
    import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined
  )
    ?.trim()
    .replace(/\/+$/, "");
  const websiteId = (
    import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined
  )?.trim();
  if (!endpoint || !websiteId) return;

  enabled = true;

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint}/umami`;
  script.dataset.websiteId = websiteId;
  script.addEventListener("load", flush);
  // If the script never loads we stop queueing rather than growing the array forever.
  script.addEventListener("error", () => {
    queue.length = 0;
    enabled = false;
  });
  document.head.appendChild(script);
}
