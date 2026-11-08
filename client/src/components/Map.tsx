/**
 * MapView: an interactive MapTiler map.
 *
 * - Needs VITE_MAPTILER_KEY (public; restrict it to your site's origins in the MapTiler dashboard).
 * - `center` is required and is the member's selected city (or the activities being listed): the map opens
 *   there and eases to a new center when it changes. There is intentionally no default city, so a caller can
 *   never silently show a place the page is not about.
 * - Tiles come from MapTiler's live tile service. The service worker deliberately leaves them uncached
 *   (see vite.config.ts), so a style update is picked up instead of an old snapshot.
 * - The MapTiler SDK is large, so it is loaded on demand: it becomes its own chunk, fetched only when a page
 *   that shows a map is opened.
 * - `onMapReady` receives the underlying @maptiler/sdk Map once its style has loaded. The SDK accepts
 *   { lat, lng } objects for setCenter/flyTo; use `addMarker` to put pins on the map.
 */

import type * as MapTilerSDK from "@maptiler/sdk";
import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import { MAPTILER_KEY } from "@/lib/maptiler";

export type MapInstance = MapTilerSDK.Map;
export type MapMarker = MapTilerSDK.Marker;

let sdk: typeof MapTilerSDK | null = null;

async function loadSdk(): Promise<typeof MapTilerSDK> {
  if (!sdk) {
    const [module] = await Promise.all([import("@maptiler/sdk"), import("@maptiler/sdk/dist/maptiler-sdk.css")]);
    sdk = module;
  }
  return sdk;
}

/** Adds a pin (with an optional popup label) to a map that `onMapReady` has handed out. */
export function addMarker(map: MapInstance, place: { lat: number; lng: number; label?: string; color?: string }): MapMarker {
  if (!sdk) throw new Error("addMarker was called before the map finished loading");
  const marker = new sdk.Marker(place.color ? { color: place.color } : undefined).setLngLat([place.lng, place.lat]);
  if (place.label) marker.setPopup(new sdk.Popup({ offset: 24 }).setText(place.label));
  return marker.addTo(map);
}

interface MapViewProps {
  className?: string;
  /** The selected city, or the activities being listed. Required so the map never falls back to an unrelated default. */
  center: { lat: number; lng: number };
  /** Zoom used when the map opens and when it recenters on a new place. */
  zoom?: number;
  onMapReady?: (map: MapInstance) => void;
}

export function MapView({ className, center, zoom = 12, onMapReady }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const [ready, setReady] = useState(false);
  const ready$ = usePersistFn((instance: MapInstance) => onMapReady?.(instance));

  // The map is created once. Keep the latest props in refs so the creation effect stays dependency-free.
  const initialCenter = useRef(center);
  initialCenter.current = center;
  const initialZoom = useRef(zoom);
  initialZoom.current = zoom;
  const shownCenter = useRef({ lat: center.lat, lng: center.lng, zoom });

  useEffect(() => {
    if (!MAPTILER_KEY) {
      console.error("MapView: VITE_MAPTILER_KEY is not set");
      return;
    }
    let cancelled = false;

    loadSdk()
      .then(maptilersdk => {
        if (cancelled || !mapContainer.current) return;
        maptilersdk.config.apiKey = MAPTILER_KEY;
        const instance = new maptilersdk.Map({
          container: mapContainer.current,
          style: maptilersdk.MapStyle.STREETS,
          center: [initialCenter.current.lng, initialCenter.current.lat],
          zoom: initialZoom.current,
          navigationControl: true,
          geolocateControl: false,
        });
        mapRef.current = instance;
        instance.on("load", () => {
          if (cancelled) return;
          setReady(true);
          ready$(instance);
        });
      })
      .catch(error => console.error("MapView: could not load the map", error));

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Recenter when the member's city changes (a new selection, GPS fix, or saved location), or when the
  // listed activities move the frame.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const previous = shownCenter.current;
    if (previous.lat === center.lat && previous.lng === center.lng && previous.zoom === zoom) return;
    shownCenter.current = { lat: center.lat, lng: center.lng, zoom };
    map.easeTo({ center: [center.lng, center.lat], zoom, duration: 700 });
  }, [center.lat, center.lng, zoom, ready]);

  return <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />;
}
