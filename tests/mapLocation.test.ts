import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  FALLBACK_MAP_CENTER,
  MAX_MILES_FROM_NAMED_CITY,
  cityCenterFromName,
  hasUsableCoordinates,
  resolveCityMapCenter,
  resolveMapCenter,
} from "../shared/mapLocation";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("map centering follows the selected city", () => {
  it("uses the selected city's center so the map matches the heading", () => {
    const center = resolveCityMapCenter({ city: "Milwaukee", state: "WI" });
    expect(center.lat).toBeCloseTo(43.0389, 4);
    expect(center.lng).toBeCloseTo(-87.9065, 4);
    expect(center.label).toBe("Milwaukee, WI");
    expect(center.source).toBe("city");

    const waukesha = resolveCityMapCenter({ city: "Waukesha", state: "WI" });
    expect(waukesha.lat).toBeCloseTo(43.0117, 4);
    expect(waukesha.lng).toBeCloseTo(-88.2315, 4);
  });

  it("accepts a comma-separated city label and surrounding whitespace", () => {
    const center = resolveCityMapCenter({ city: "  Waukesha, WI " });
    expect(center.lat).toBeCloseTo(43.0117, 4);
    expect(center.label).toBe("Waukesha, WI");
  });

  it("recenters when the member switches cities", () => {
    const before = resolveCityMapCenter({ city: "Milwaukee", state: "WI" });
    const after = resolveCityMapCenter({ city: "Chicago", state: "IL" });
    expect(after.lat).not.toBeCloseTo(before.lat, 2);
    expect(after.lng).not.toBeCloseTo(before.lng, 2);
    expect(after.label).toBe("Chicago, IL");
  });

  it("keeps exact coordinates when they belong to the named city", () => {
    const center = resolveMapCenter({ city: "Milwaukee", state: "WI", lat: 43.07, lng: -87.95 });
    expect(center.source).toBe("coordinates");
    expect(center.lat).toBeCloseTo(43.07, 4);
  });

  it("ignores coordinates that do not belong to the named city", () => {
    // An old San Francisco pair saved under a Milwaukee selection must not win.
    const center = resolveCityMapCenter({ city: "Milwaukee", state: "WI", lat: 37.7749, lng: -122.4194 });
    expect(center.lat).toBeCloseTo(43.0389, 4);
    expect(center.lng).toBeCloseTo(-87.9065, 4);

    const nearby = resolveMapCenter({ city: "Milwaukee", state: "WI", lat: 37.7749, lng: -122.4194 });
    expect(nearby.source).toBe("city");
  });

  it("falls back to the selected city when stored coordinates are missing or invalid", () => {
    expect(resolveCityMapCenter({ city: "Waukesha", state: "WI", lat: null, lng: null }).source).toBe("city");
    expect(resolveCityMapCenter({ city: "Waukesha", state: "WI", lat: Number.NaN, lng: Number.NaN }).source).toBe("city");
    expect(resolveCityMapCenter({ city: "Waukesha", state: "WI", lat: 0, lng: 0 }).source).toBe("city");
  });

  it("uses Milwaukee, WI — never San Francisco — when nothing about the city is known", () => {
    const center = resolveMapCenter({});
    expect(center).toEqual(FALLBACK_MAP_CENTER);
    expect(center.lat).toBeCloseTo(43.0389, 4);
    expect(center.lng).toBeCloseTo(-87.9065, 4);
    expect(center.label).toBe("Milwaukee, WI");

    const unknownCity = resolveCityMapCenter({ city: "Nowhereville" });
    expect(unknownCity.source).toBe("fallback");
    expect(unknownCity.lat).toBeCloseTo(43.0389, 4);
  });

  it("recognizes city spellings with a county or area suffix", () => {
    expect(cityCenterFromName("Milwaukee County")).not.toBeNull();
    expect(cityCenterFromName("Greater Milwaukee Area")).not.toBeNull();
    expect(cityCenterFromName("")).toBeNull();
  });

  it("validates coordinates before trusting them", () => {
    expect(hasUsableCoordinates(43.0389, -87.9065)).toBe(true);
    expect(hasUsableCoordinates(undefined, -87.9065)).toBe(false);
    expect(hasUsableCoordinates(Number.POSITIVE_INFINITY, -87.9065)).toBe(false);
    expect(hasUsableCoordinates(51.5, -0.12)).toBe(false); // London is outside the US market
  });

  it("keeps the stale-coordinate allowance wide enough for a whole metro", () => {
    expect(MAX_MILES_FROM_NAMED_CITY).toBeGreaterThanOrEqual(50);
  });
});

describe("map surfaces cannot fall back to an unrelated city", () => {
  it("gives the shared MapView no default center at all", () => {
    const map = read("client/src/components/Map.tsx");
    expect(map).not.toContain("37.7749");
    expect(map).not.toContain("-122.4194");
    expect(map).toContain("center: { lat: number; lng: number };");
    expect(map).toContain("easeTo(");
  });

  it("recenters the Activity Board map and pins the listed activities", () => {
    const board = read("client/src/pages/ActivityBoard.tsx");
    expect(board).toContain("useMapCenter(");
    expect(board).toContain("center={mapCenter}");
    // Pins come from the listed activities and events, not a generic nearby-place search.
    expect(board).toContain("getActivityMapPins(");
    expect(board).toContain("addMarker(");
    expect(board).not.toContain("loadNearbyMarkers");
    expect(board).not.toContain("searchNearbyPlaces");
    expect(board).not.toContain("map.getCenter()");
    expect(board).not.toContain("37.7749");
  });

  it("passes the selected city into the Activities map instead of a US-wide default", () => {
    const activities = read("client/src/pages/Activities.tsx");
    expect(activities).toContain("center={mapCenter}");
    expect(activities).not.toContain("39.8283");
    expect(activities).not.toContain("-98.5795");
  });

  it("geocodes a city that is not in the built-in table rather than defaulting", () => {
    const hook = read("client/src/hooks/useMapCenter.ts");
    expect(hook).toContain("geocodePlace(");
    expect(hook).toContain("resolveCityMapCenter");
    expect(hook).toContain("resolveMapCenter");
  });
});
