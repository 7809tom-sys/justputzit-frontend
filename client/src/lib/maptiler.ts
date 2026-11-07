// MapTiler helpers for the browser: the public key, and nearby-place search on top of MapTiler's geocoding API.
// VITE_MAPTILER_KEY is visible in the browser by design. Restrict it to the site's origins in the MapTiler
// dashboard (Account > Keys > Allowed HTTP origins).

export const MAPTILER_KEY = (import.meta.env.VITE_MAPTILER_KEY as string | undefined) ?? "";

export type NearbyPlace = {
  id: string;
  name: string;
  /** Street address without the place name or country. */
  address: string;
  lat: number;
  lng: number;
  /** MapTiler categories, for example ["library", "public building"]. */
  categories: string[];
};

type Feature = {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  properties?: { categories?: string[] };
};

// The UI uses Google-style type names; MapTiler matches names and categories, so map them to keywords.
const KEYWORD_FOR_TYPE: Record<string, string> = {
  bowling_alley: "bowling",
  movie_theater: "cinema",
  gym: "gym",
};
// "All": a spread of what members usually look for.
const ALL_KEYWORDS = ["library", "park", "cafe", "museum", "gym", "church"];

export const keywordsForType = (type: string): string[] =>
  type === "establishment" ? ALL_KEYWORDS : [KEYWORD_FOR_TYPE[type] ?? type.replace(/_/g, " ")];

const METERS_PER_DEGREE = 111_320;

function boundingBox(lat: number, lng: number, radiusMeters: number): string {
  const dLat = radiusMeters / METERS_PER_DEGREE;
  const dLng = radiusMeters / (METERS_PER_DEGREE * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return [lng - dLng, lat - dLat, lng + dLng, lat + dLat].map(n => n.toFixed(5)).join(",");
}

function toPlace(feature: Feature): NearbyPlace {
  const parts = feature.place_name.split(", ");
  if (parts[0] === feature.text) parts.shift();
  if (parts[parts.length - 1] === "United States") parts.pop();
  return {
    id: feature.id,
    name: feature.text,
    address: parts.join(", "),
    lat: feature.center[1],
    lng: feature.center[0],
    categories: feature.properties?.categories ?? [],
  };
}

async function searchKeyword(keyword: string, center: { lat: number; lng: number }, radiusMeters: number, limit: number): Promise<NearbyPlace[]> {
  const url = new URL(`https://api.maptiler.com/geocoding/${encodeURIComponent(keyword)}.json`);
  url.searchParams.set("key", MAPTILER_KEY);
  url.searchParams.set("types", "poi");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("language", "en");
  url.searchParams.set("proximity", `${center.lng},${center.lat}`);
  url.searchParams.set("bbox", boundingBox(center.lat, center.lng, radiusMeters));
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);
  return (((await response.json()) as { features?: Feature[] }).features ?? []).map(toPlace);
}

/**
 * Places matching the given free-text keywords within `radiusMeters` of `center`,
 * de-duplicated and nearest first. Used by the Things to Do hub to attach real venues to a curated idea.
 * Throws when the key is missing or every lookup fails; a lookup that simply finds nothing returns [].
 */
export async function searchNearbyKeywords(
  center: { lat: number; lng: number },
  keywords: string[],
  options: { radiusMeters?: number; perKeyword?: number; max?: number } = {},
): Promise<NearbyPlace[]> {
  if (!MAPTILER_KEY) throw new Error("Maps are not configured (VITE_MAPTILER_KEY)");
  const { radiusMeters = 5000, perKeyword = 6, max = 3 } = options;
  return searchAndDedupe(center, keywords, radiusMeters, perKeyword, max);
}

/**
 * Places of the given types within `radiusMeters` of `center`, de-duplicated and nearest first.
 * Throws when the key is missing or every lookup fails; a lookup that simply finds nothing returns [].
 */
export async function searchNearbyPlaces(
  center: { lat: number; lng: number },
  type: string,
  options: { radiusMeters?: number; perKeyword?: number; max?: number } = {},
): Promise<NearbyPlace[]> {
  if (!MAPTILER_KEY) throw new Error("Maps are not configured (VITE_MAPTILER_KEY)");
  const { radiusMeters = 5000, perKeyword = 8, max = 12 } = options;
  return searchAndDedupe(center, keywordsForType(type), radiusMeters, perKeyword, max);
}

async function searchAndDedupe(
  center: { lat: number; lng: number },
  keywords: string[],
  radiusMeters: number,
  perKeyword: number,
  max: number,
): Promise<NearbyPlace[]> {
  const settled = await Promise.allSettled(keywords.map(keyword => searchKeyword(keyword, center, radiusMeters, perKeyword)));
  const ok = settled.filter((r): r is PromiseFulfilledResult<NearbyPlace[]> => r.status === "fulfilled");
  if (ok.length === 0) throw new Error("Place search failed");

  const unique = new Map<string, NearbyPlace>();
  for (const result of ok) for (const place of result.value) if (!unique.has(place.id)) unique.set(place.id, place);
  const distance = (p: NearbyPlace) => (p.lat - center.lat) ** 2 + (p.lng - center.lng) ** 2;
  return [...unique.values()].sort((a, b) => distance(a) - distance(b)).slice(0, max);
}

/** A map-app directions link (works without any key). */
export const directionsUrl = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

type GeocodeFeature = {
  center: [number, number];
  place_name: string;
  text: string;
  properties?: { categories?: string[] };
};

/**
 * Coordinates for a free-text place such as "Waukesha, WI" or "53202".
 *
 * Used only when the selected city is not in the built-in center table, so a member's own town still
 * centers the map instead of an unrelated default. Returns null when the lookup finds nothing.
 */
export async function geocodePlace(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  const text = query.trim();
  if (!MAPTILER_KEY || text.length < 2) return null;
  const url = new URL(`https://api.maptiler.com/geocoding/${encodeURIComponent(text)}.json`);
  url.searchParams.set("key", MAPTILER_KEY);
  url.searchParams.set("types", "municipality,place,postal_code");
  url.searchParams.set("limit", "1");
  url.searchParams.set("language", "en");
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Location lookup failed (${response.status})`);
  const feature = ((await response.json()) as { features?: GeocodeFeature[] }).features?.[0];
  if (!feature) return null;
  return { lat: feature.center[1], lng: feature.center[0], name: feature.text || feature.place_name };
}
