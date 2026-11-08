/**
 * Map centering for the Activity Board and other map surfaces.
 *
 * The map must always show the member's currently selected or current city. When that city is one we know,
 * its downtown center is used, so the map can never disagree with the heading right above it. Otherwise the
 * exact coordinates (GPS, a saved location, or a searched place) win, and when nothing at all is known the
 * home market — Milwaukee, WI — is used. There is deliberately no unrelated default such as San Francisco.
 */

import { haversineDistanceMiles } from "./geo";

export type MapCoordinates = { lat: number; lng: number };

export type MapCenter = MapCoordinates & {
  /** Human-readable area, for example "Waukesha, WI". */
  label: string;
  /** Where the center came from, so the UI can explain the choice. */
  source: "coordinates" | "city" | "fallback";
};

/** Milwaukee, WI. The only fallback, used when nothing about the member's city is known. */
export const FALLBACK_MAP_CENTER: MapCenter = {
  lat: 43.0389,
  lng: -87.9065,
  label: "Milwaukee, WI",
  source: "fallback",
};

/** Downtown centers for the cities Just Putzit lists events for. */
const CITY_CENTERS: Record<string, MapCoordinates> = {
  milwaukee: { lat: 43.0389, lng: -87.9065 },
  waukesha: { lat: 43.0117, lng: -88.2315 },
  brookfield: { lat: 43.0606, lng: -88.1065 },
  "west allis": { lat: 43.0167, lng: -88.007 },
  wauwatosa: { lat: 43.0495, lng: -88.0076 },
  "la crosse": { lat: 43.8138, lng: -91.2519 },
  racine: { lat: 42.7261, lng: -87.7829 },
  kenosha: { lat: 42.5847, lng: -87.8212 },
  madison: { lat: 43.0731, lng: -89.4012 },
  "green bay": { lat: 44.5133, lng: -88.0133 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  evanston: { lat: 42.0451, lng: -87.6877 },
  "oak park": { lat: 41.885, lng: -87.7845 },
  naperville: { lat: 41.7508, lng: -88.1535 },
  aurora: { lat: 41.7606, lng: -88.3201 },
  joliet: { lat: 41.525, lng: -88.0817 },
  "oklahoma city": { lat: 35.4676, lng: -97.5164 },
  jackson: { lat: 32.2988, lng: -90.1848 },
  atlanta: { lat: 33.749, lng: -84.388 },
};

const US_LAT_MIN = 18;
const US_LAT_MAX = 72;
const US_LNG_MIN = -180;
const US_LNG_MAX = -66;

/**
 * How far saved coordinates may sit from the named city before we treat them as stale. Well beyond any
 * metro area, so a suburb still counts as its city, but an old San Francisco pair under a Milwaukee
 * heading does not.
 */
export const MAX_MILES_FROM_NAMED_CITY = 75;

/** True for finite coordinates inside the United States. Rejects 0,0 and half-filled profiles. */
export function hasUsableCoordinates(lat?: number | null, lng?: number | null): boolean {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= US_LAT_MIN && lat <= US_LAT_MAX && lng >= US_LNG_MIN && lng <= US_LNG_MAX;
}

function cityName(city?: string | null): string {
  if (!city) return "";
  return city.split(",")[0].replace(/\s+/g, " ").trim();
}

function cityKey(city?: string | null): string {
  return cityName(city)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/^(greater|city of|downtown)\s+/, "")
    .replace(/\s+(county|metro|metropolitan|area)$/g, "")
    .trim();
}

/** The known downtown center for a city name (with or without a ", WI" suffix), if we have one. */
export function cityCenterFromName(city?: string | null): MapCoordinates | null {
  const key = cityKey(city);
  if (!key) return null;
  const exact = CITY_CENTERS[key];
  if (exact) return exact;
  // "Greater Milwaukee Area" or "Milwaukee County" still resolves to the Milwaukee center.
  const containing = Object.keys(CITY_CENTERS)
    .filter(name => key.startsWith(name))
    .sort((a, b) => b.length - a.length)[0];
  return containing ? CITY_CENTERS[containing] : null;
}

function displayLabel(city?: string | null, state?: string | null): string {
  const name = cityName(city);
  if (!name) return "your area";
  const region = (state ?? city?.split(",")[1] ?? "").trim();
  return region ? `${name}, ${region}` : name;
}

type ResolveInput = {
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  state?: string | null;
};

/**
 * Picks the center for the member's selected city: the city's known center, then exact coordinates,
 * then Milwaukee. Never returns an unrelated default.
 */
export function resolveMapCenter(input: ResolveInput): MapCenter {
  const label = displayLabel(input.city, input.state);
  const usable = hasUsableCoordinates(input.lat, input.lng);
  const coordinates = usable ? { lat: input.lat as number, lng: input.lng as number } : null;
  const known = cityCenterFromName(input.city);

  if (known && coordinates) {
    // Stored coordinates far from the city named in the heading are stale; the heading wins.
    const milesAway = haversineDistanceMiles(coordinates.lat, coordinates.lng, known.lat, known.lng);
    if (milesAway > MAX_MILES_FROM_NAMED_CITY) return { ...known, label, source: "city" };
  }
  if (coordinates) return { ...coordinates, label, source: "coordinates" };
  if (known) return { ...known, label, source: "city" };
  return { ...FALLBACK_MAP_CENTER };
}

/**
 * The center for a city-wide map such as the Activity Board: the selected city first, so the map always
 * matches the headline, and only then exact coordinates.
 */
export function resolveCityMapCenter(input: ResolveInput): MapCenter {
  const label = displayLabel(input.city, input.state);
  const known = cityCenterFromName(input.city);
  if (known) return { ...known, label, source: "city" };
  return resolveMapCenter(input);
}
