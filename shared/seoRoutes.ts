/**
 * Public, indexable pages. This list drives three things so they cannot drift apart:
 *   - the build-time prerender (one static HTML file per route with its own head and visible content),
 *   - sitemap.xml and robots.txt (generated into the build output),
 *   - the per-page useSEO() call in the app, so the tags stay the same after React takes over.
 * Private routes (profile, chat, admin, ...) are intentionally not here and keep the plain SPA shell.
 */
import { CITIES } from "./cities";
import { siteUrl } from "./site";

export interface SeoLink {
  href: string;
  label: string;
}

export interface SeoRoute {
  /** URL path, no trailing slash ("/" for the homepage). */
  path: string;
  title: string;
  description: string;
  /** Visible content for the static HTML (replaced by the app once JavaScript runs). */
  heading: string;
  intro: string;
  highlights: string[];
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
  jsonLd?: Record<string, unknown>;
}

const HOME: SeoRoute = {
  path: "/",
  title: "Just Putzit — Meet Somewhere Real.",
  description:
    "A free local connection app: match for dates, friends, or activity partners, then choose a safe public plan at an independent local spot or official event.",
  heading: "Don’t text forever. Meet somewhere real.",
  intro:
    "Just Putzit is the alternative to swipe-only apps and conversations that go nowhere. Sally helps you connect for dates, friends, activities, and workouts—then makes a real public plan at an independent local place or official event.",
  highlights: [
    "Match with intent. Then show up somewhere real.",
    "Connection before convenience: less anonymous swiping, more room to decide.",
    "A place is part of the match: plans start at public local spots and official events.",
    "Safety tools are visible: private report and block tools for every member.",
    "Gym Buddy: pick a gym, set your style, show up.",
  ],
  changefreq: "weekly",
  priority: "1.0",
};

const STATIC_ROUTES: SeoRoute[] = [
  HOME,
  {
    path: "/safety",
    title: "Safety & Trust — Just Putzit",
    description:
      "How Just Putzit keeps real-world meetups safe: public-event invitations, member-controlled opt-ins, and private report and block tools.",
    heading: "Real-world connections, on your terms",
    intro:
      "Just Putzit helps members discover public local activities, control connection preferences, and use private report and block tools when something does not feel right.",
    highlights: [
      "You choose your connection settings: friendship and dating introductions are private opt-ins.",
      "Block closes the connection in both directions, and the other member is not told.",
      "Reports are private and go to the moderation queue without identifying the reporter.",
      "Plans start in public places; invitations never share contact details or a home address.",
      "Meet in a public venue, tell someone you trust where you are going, and trust your instincts.",
    ],
    changefreq: "monthly",
    priority: "0.6",
  },
  {
    path: "/campus",
    title: "Campus Dating Pool — Just Putzit",
    description:
      "Join your university’s dating pool on Just Putzit and meet verified students from your campus for real dates and activities.",
    heading: "Campus Dating Pool",
    intro:
      "Sign in to join your university’s dating pool and meet people from your campus. Browse campuses near you, join yours, and let Sally set up a real plan.",
    highlights: [
      "Campus pools for universities near you, Waukesha first.",
      "Join or leave your campus pool at any time.",
      "Real dates with students from your own campus.",
    ],
    changefreq: "weekly",
    priority: "0.7",
  },
  {
    path: "/campus/carroll",
    title: "Just Putzit at Carroll University",
    description:
      "Just Putzit is coming to Carroll University. Real dates, real people, no swiping: Sally sets it up and you just show up. Join the waitlist.",
    heading: "Just Putzit is coming to Carroll.",
    intro: "Real dates. Real people. No swiping. Sally sets it up — you just show up.",
    highlights: [
      "Sally sets it up: tell her what you like and she plans the date.",
      "Verified students only.",
      "Games and icebreakers to make the first meeting easy.",
    ],
    changefreq: "weekly",
    priority: "0.7",
  },
  {
    path: "/activity-board",
    title: "What’s Happening Near You — Just Putzit",
    description:
      "Local activities, date ideas, and things to do this weekend. Find something to do near you and someone to go with on Just Putzit.",
    heading: "What’s Happening Near You",
    intro: "Stop putzing around alone — find something amazing to do this weekend.",
    highlights: [
      "Local activities and date ideas, sorted by what is near you.",
      "Save events for later and share them with a friend.",
      "Independent local spots and official events.",
    ],
    changefreq: "daily",
    priority: "0.8",
  },
  {
    path: "/community",
    title: "Community Groups — Just Putzit",
    description:
      "Find your people. Join a local community group for books, outdoors, food, music, art, fitness, and more, then show up together.",
    heading: "Community Groups",
    intro: "Find your people. Join a group, show up, and stop putzing around alone.",
    highlights: [
      "Groups for book clubs, hiking, cooking, music, arts, fitness, travel, gaming, and more.",
      "Start your own group and invite locals who share your interests.",
      "Group meetups happen in public local places.",
    ],
    changefreq: "weekly",
    priority: "0.7",
  },
  {
    path: "/events",
    title: "Free & Fun Events Near You — Just Putzit",
    description:
      "Free and low-cost community events near you, including Milwaukee and Waukesha library, park, and city events. Find one and bring someone along.",
    heading: "Free & Fun Near You",
    intro: "Milwaukee & Waukesha community events.",
    highlights: [
      "Free and low-cost local community events.",
      "See how far each event is from you.",
      "Pick one and bring someone along.",
    ],
    changefreq: "daily",
    priority: "0.8",
  },
];

const CITY_ROUTES: SeoRoute[] = Object.values(CITIES).map((city) => ({
  path: `/city/${city.slug}`,
  title: `Dating App ${city.name} ${city.stateAbbr} — Just Putzit`,
  description: city.description,
  heading: `The Dating App Built for ${city.name}`,
  intro: city.description,
  highlights: [
    ...city.activities.map((activity) => `Date idea: ${activity}`),
    ...(city.neighborhoods.length ? [`Popular areas: ${city.neighborhoods.join(", ")}`] : []),
  ],
  changefreq: "monthly",
  priority: "0.9",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Just Putzit — ${city.name}`,
    description: city.description,
    url: siteUrl(`/city/${city.slug}`),
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: { "@type": "State", name: city.state },
    },
    applicationCategory: "SocialNetworkingApplication",
  },
}));

/** Every prerendered, sitemap-listed route, in sitemap order. */
export const SEO_ROUTES: SeoRoute[] = [...STATIC_ROUTES, ...CITY_ROUTES];

export function getSeoRoute(path: string): SeoRoute {
  const route = SEO_ROUTES.find((r) => r.path === path);
  if (!route) throw new Error(`No SEO route for ${path}`);
  return route;
}

/** useSEO() options for a public route, so the live page keeps the tags its prerendered HTML shipped with. */
export function seoTagsFor(path: string) {
  const route = getSeoRoute(path);
  return { title: route.title, description: route.description, canonical: siteUrl(route.path), jsonLd: route.jsonLd };
}

/** Links rendered in the static HTML of every public page so crawlers can reach the others. */
export const SEO_NAV_LINKS: SeoLink[] = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/activity-board", label: "Activity Board" },
  { href: "/community", label: "Community" },
  { href: "/campus", label: "Campus" },
  { href: "/safety", label: "Safety" },
  ...Object.values(CITIES).map((city) => ({ href: `/city/${city.slug}`, label: `${city.name}, ${city.stateAbbr}` })),
];

/** Paths robots.txt keeps out of the index (private or signed-in areas). */
export const ROBOTS_DISALLOW = [
  "/api/",
  "/onboarding",
  "/interview",
  "/profile",
  "/matches",
  "/chat/",
  "/games/",
  "/admin",
  "/verify-account",
  "/concierge",
  "/marketplace",
  "/bookings",
  "/vendor",
  "/couples",
];

export const ROBOTS_ALLOW = ["/", "/city/", "/events", "/activity-board", "/community", "/safety", "/campus"];
