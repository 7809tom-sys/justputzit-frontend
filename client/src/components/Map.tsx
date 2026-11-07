/**
 * MapView: an interactive MapTiler map.
 *
 * - Needs VITE_MAPTILER_KEY (public; restrict it to your site's origins in the MapTiler dashboard).
 * - The MapTiler SDK is large, so it is loaded on demand: it becomes its own chunk, fetched only when a page
 *   that shows a map is opened.
 * - `onMapReady` receives the underlying @maptiler/sdk Map once its style has loaded. The SDK accepts
 *   { lat, lng } objects for setCenter/flyTo; use `addMarker` to put pins on the map.
 * - There is deliberately no default location. A map that opens on a hardcoded city (this used to be
 *   San Francisco) is worse than a map that asks for a location, so callers pass `initialCenter` from
 *   real data and can update it later with `center`.
 */

import type * as MapTilerSDK from "@maptiler/sdk";
import { useEffect, useRef } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import { MAPTILER_KEY } from "@/lib/maptiler";

export type MapInstance = MapTilerSDK.Map;
export type MapMarker = MapTilerSDK.Marker;

let sdk: typeof MapTilerSDK | null = null;

async function loadSdk(): Promise<typeof MapTilerSDK> {
  if (!sdk) {
    const [module] = await Promise.all([
      import("@maptiler/sdk"),
      import("@maptiler/sdk/dist/maptiler-sdk.css"),
    ]);
    sdk = module;
  }
  return sdk;
}

/** Adds a pin (with an optional popup label) to a map that `onMapReady` has handed out. */
export function addMarker(
  map: MapInstance,
  place: { lat: number; lng: number; label?: string; color?: string }
): MapMarker {
  if (!sdk)
    throw new Error("addMarker was called before the map finished loading");
  const marker = new sdk.Marker(
    place.color ? { color: place.color } : undefined
  ).setLngLat([place.lng, place.lat]);
  if (place.label)
    marker.setPopup(new sdk.Popup({ offset: 24 }).setText(place.label));
  return marker.addTo(map);
}

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number } | null;
  initialZoom?: number;
  /** When this changes, the map moves to the new spot and zoom. */
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  /** Shown instead of the map when no location is known yet. */
  emptyState?: React.ReactNode;
  onMapReady?: (map: MapInstance) => void;
}

export function MapView({
  className,
  initialCenter = null,
  initialZoom = 12,
  center,
  zoom,
  emptyState,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapInstance | null>(null);
  const ready = usePersistFn((instance: MapInstance) => onMapReady?.(instance));
  const start = initialCenter ?? center ?? null;

  useEffect(() => {
    if (!start) return;
    if (!MAPTILER_KEY) {
      console.error("MapView: VITE_MAPTILER_KEY is not set");
      return;
    }
    let cancelled = false;
    let instance: MapInstance | null = null;

    loadSdk()
      .then(maptilersdk => {
        if (cancelled || !mapContainer.current) return;
        maptilersdk.config.apiKey = MAPTILER_KEY;
        instance = new maptilersdk.Map({
          container: mapContainer.current,
          style: maptilersdk.MapStyle.STREETS,
          center: [start.lng, start.lat],
          zoom: initialZoom,
          navigationControl: true,
          geolocateControl: false,
        });
        mapInstance.current = instance;
        instance.on("load", () => {
          if (instance && !cancelled) ready(instance);
        });
      })
      .catch(error => console.error("MapView: could not load the map", error));

    return () => {
      cancelled = true;
      instance?.remove();
      mapInstance.current = null;
    };
    // The map is created once; later center/zoom changes are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move an existing map when the caller finds a better location, instead of recreating it.
  useEffect(() => {
    const instance = mapInstance.current;
    if (!instance || !center) return;
    instance.flyTo({
      center: [center.lng, center.lat],
      zoom: zoom ?? instance.getZoom(),
      essential: true,
    });
  }, [center?.lat, center?.lng, zoom]);

  return (
    <div className={cn("relative w-full h-[500px]", className)}>
      <div ref={mapContainer} className="h-full w-full" />
      {!start && emptyState ? (
        <div className="absolute inset-0 flex items-center justify-center">
          {emptyState}
        </div>
      ) : null}
    </div>
  );
}
