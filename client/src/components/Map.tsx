/**
 * MapView: an interactive MapTiler map.
 *
 * - Needs VITE_MAPTILER_KEY (public; restrict it to your site's origins in the MapTiler dashboard).
 * - The MapTiler SDK is large, so it is loaded on demand: it becomes its own chunk, fetched only when a page
 *   that shows a map is opened.
 * - `onMapReady` receives the underlying @maptiler/sdk Map once its style has loaded. The SDK accepts
 *   { lat, lng } objects for setCenter/flyTo; use `addMarker` to put pins on the map.
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
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (map: MapInstance) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const ready = usePersistFn((instance: MapInstance) => onMapReady?.(instance));

  useEffect(() => {
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
          center: [initialCenter.lng, initialCenter.lat],
          zoom: initialZoom,
          navigationControl: true,
          geolocateControl: false,
        });
        instance.on("load", () => {
          if (instance && !cancelled) ready(instance);
        });
      })
      .catch(error => console.error("MapView: could not load the map", error));

    return () => {
      cancelled = true;
      instance?.remove();
    };
    // The map is created once; later center/zoom changes are made through the instance.
  }, []);

  return <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />;
}
