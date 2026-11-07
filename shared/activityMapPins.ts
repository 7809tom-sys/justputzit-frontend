import { haversineDistanceMiles } from "./geo";

/**
 * Pin selection for the "Activities Near You" map.
 *
 * The map must show the activities and community events being listed on the page, at their real
 * venues — not a generic nearby-place search, and never a hardcoded city. Everything here is pure so
 * the choice of pins and the starting viewport can be tested without a browser or a map key.
 */

export type MapPinKind = "activity" | "event";

export type MapPin = {
  /** Stable key for React and for matching a marker to a list row. */
  key: string;
  kind: MapPinKind;
  /** Title of the activity or event, shown on the marker. */
  title: string;
  lat: number;
  lng: number;
  /** Straight-line miles from the viewer, when their coordinates are known. */
  distanceMiles?: number;
};

/** An activity record; venue coordinates are what the API exposes. */
export type MappableActivity = {
  id: number | string;
  title?: string | null;
  venueLat?: number | string | null;
  venueLng?: number | string | null;
};

/** A community event record; coordinates are on the event itself. */
export type MappableEvent = {
  id: number | string;
  title?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

type Coordinates = { lat: number; lng: number; title: string };

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function toCoordinates(
  id: number | string,
  title: string | null | undefined,
  rawLat: unknown,
  rawLng: unknown
): Coordinates | null {
  // null/undefined must not coerce to 0 — that would pin records at the Gulf of Guinea.
  if (rawLat == null || rawLng == null || rawLat === "" || rawLng === "")
    return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  // 0,0 is the classic "no location recorded" placeholder.
  if (lat === 0 && lng === 0) return null;
  return { lat, lng, title: (title ?? "").trim() || "Untitled" };
}

/** Rounds for de-duplication only; the marker keeps full precision. */
const locationKey = (lat: number, lng: number) =>
  `${lat.toFixed(4)},${lng.toFixed(4)}`;

export function getActivityMapPins(
  activities: readonly MappableActivity[],
  events: readonly MappableEvent[],
  options: { center?: { lat: number; lng: number } | null; max?: number } = {}
): MapPin[] {
  const { center = null, max = 50 } = options;
  const pins = new Map<string, MapPin>();

  const add = (kind: MapPinKind, id: number | string, coords: Coordinates) => {
    const key = `${kind}-${id}`;
    // An event and an activity can describe the same listing; keep the first one at that spot.
    const dedupeKey = `${locationKey(coords.lat, coords.lng)}|${coords.title.toLowerCase()}`;
    if (pins.has(dedupeKey)) return;
    pins.set(dedupeKey, {
      key,
      kind,
      title: coords.title,
      lat: coords.lat,
      lng: coords.lng,
      distanceMiles: center
        ? haversineDistanceMiles(center.lat, center.lng, coords.lat, coords.lng)
        : undefined,
    });
  };

  for (const activity of activities) {
    const coords = toCoordinates(
      activity.id,
      activity.title,
      activity.venueLat,
      activity.venueLng
    );
    if (coords) add("activity", activity.id, coords);
  }
  for (const event of events) {
    const coords = toCoordinates(event.id, event.title, event.lat, event.lng);
    if (coords) add("event", event.id, coords);
  }

  const all = [...pins.values()];
  // Nearest first so the map is about what is actually around the viewer.
  all.sort((a, b) => (a.distanceMiles ?? 0) - (b.distanceMiles ?? 0));
  return all.slice(0, max);
}

/**
 * The viewport to open on: the pins themselves when there are any, otherwise the viewer's own
 * coordinates. Returns null when neither is known, so the map can show an empty state instead of
 * guessing at a city.
 */
export function getActivityMapCenter(
  pins: readonly MapPin[],
  fallback?: { lat: number; lng: number } | null
): { lat: number; lng: number } | null {
  if (pins.length > 0) {
    const total = pins.reduce(
      (acc, pin) => ({ lat: acc.lat + pin.lat, lng: acc.lng + pin.lng }),
      { lat: 0, lng: 0 }
    );
    return { lat: total.lat / pins.length, lng: total.lng / pins.length };
  }
  if (
    fallback &&
    Number.isFinite(fallback.lat) &&
    Number.isFinite(fallback.lng)
  ) {
    return { lat: fallback.lat, lng: fallback.lng };
  }
  return null;
}

/**
 * Zoom that frames the pins. Tight enough to show a neighbourhood, wide enough that a city-wide
 * spread still fits.
 */
export function getActivityMapZoom(
  pins: readonly MapPin[],
  hasFallback: boolean
): number {
  if (pins.length === 0) return hasFallback ? 12 : 12;
  if (pins.length === 1) return 14;
  const latitudes = pins.map(p => p.lat);
  const longitudes = pins.map(p => p.lng);
  const span = Math.max(
    Math.max(...latitudes) - Math.min(...latitudes),
    Math.max(...longitudes) - Math.min(...longitudes)
  );
  if (span > 0.9) return 8;
  if (span > 0.45) return 9;
  if (span > 0.2) return 10;
  if (span > 0.09) return 11;
  if (span > 0.04) return 12;
  return 13;
}
