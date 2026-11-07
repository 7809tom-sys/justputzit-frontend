/**
 * useMapCenter — the center a map should show for the member's selected city.
 *
 * Resolves synchronously from the city table (or the member's exact coordinates) so the map never opens on
 * an unrelated place, then upgrades to a geocoded center when the city is not in the table. The result is
 * always a real place: the member's city, or Milwaukee, WI when nothing is known.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { geocodePlace } from "@/lib/maptiler";
import {
  cityCenterFromName,
  hasUsableCoordinates,
  resolveCityMapCenter,
  resolveMapCenter,
  type MapCenter,
} from "@shared/mapLocation";

export function useMapCenter(input: {
  city?: string | null;
  state?: string | null;
  lat?: number | null;
  lng?: number | null;
  /**
   * "city" (default) keeps a city-wide map aligned with the heading, which is what the Activity Board needs.
   * "coordinates" follows the member's exact position instead, falling back to their city.
   */
  prefer?: "city" | "coordinates";
}): MapCenter {
  const { city, state, lat, lng, prefer = "city" } = input;

  const resolved = useMemo(
    () => (prefer === "coordinates"
      ? resolveMapCenter({ city, state, lat, lng })
      : resolveCityMapCenter({ city, state, lat, lng })),
    [prefer, city, state, lat, lng],
  );

  const [geocoded, setGeocoded] = useState<MapCenter | null>(null);
  const requested = useRef<string | null>(null);

  // Only geocode a city we do not already know and that has no usable coordinates to fall back on.
  const needsGeocode = Boolean(city && city.trim().length >= 2) && !cityCenterFromName(city) && !hasUsableCoordinates(lat, lng);

  useEffect(() => {
    setGeocoded(null);
    if (!needsGeocode || !city) return;
    const query = `${city.split(",")[0].trim()}${state ? `, ${state}` : ""}`;
    if (requested.current === query) return;
    requested.current = query;
    let cancelled = false;
    geocodePlace(query)
      .then(place => {
        if (cancelled || !place) return;
        setGeocoded({ lat: place.lat, lng: place.lng, label: resolved.label, source: "city" });
      })
      .catch(() => {
        // Keep the synchronous center; the map still shows a real place.
      });
    return () => {
      cancelled = true;
    };
  }, [needsGeocode, city, state, resolved.label]);

  return geocoded ?? resolved;
}
