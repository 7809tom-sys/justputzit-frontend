import { describe, expect, it } from "vitest";
import {
  getActivityMapCenter,
  getActivityMapPins,
  getActivityMapZoom,
} from "../shared/activityMapPins";

const WAUKESHA = { lat: 43.0117, lng: -88.2315 };

describe("activity map pins", () => {
  it("pins activities at their venue and events at their own coordinates", () => {
    const pins = getActivityMapPins(
      [
        {
          id: 1,
          title: "Open gym basketball",
          venueLat: 43.0117,
          venueLng: -88.2315,
        },
      ],
      [{ id: 2, title: "Library board games", lat: "43.0200", lng: "-88.2400" }]
    );

    expect(pins).toHaveLength(2);
    expect(pins.map(p => p.kind).sort()).toEqual(["activity", "event"]);
    expect(pins.find(p => p.key === "event-2")?.lat).toBeCloseTo(43.02);
  });

  it("skips records with no usable coordinates instead of pinning them at 0,0", () => {
    const pins = getActivityMapPins(
      [
        { id: 1, title: "No coords" },
        { id: 2, title: "Empty strings", venueLat: "", venueLng: "" },
        { id: 3, title: "Zero placeholder", venueLat: 0, venueLng: 0 },
        { id: 4, title: "Out of range", venueLat: 91, venueLng: 0 },
        { id: 5, title: "Real", venueLat: 43.01, venueLng: -88.23 },
      ],
      []
    );

    expect(pins).toHaveLength(1);
    expect(pins[0].key).toBe("activity-5");
  });

  it("sorts by distance from the viewer so near activities come first", () => {
    const pins = getActivityMapPins(
      [
        { id: "far", title: "Far", venueLat: 43.2, venueLng: -88.23 },
        { id: "near", title: "Near", venueLat: 43.015, venueLng: -88.231 },
      ],
      [],
      { center: WAUKESHA }
    );

    expect(pins[0].key).toBe("activity-near");
    expect(pins[0].distanceMiles).toBeLessThan(1);
  });

  it("de-duplicates the same listing at the same venue", () => {
    const pins = getActivityMapPins(
      [{ id: 1, title: "Trivia night", venueLat: 43.01, venueLng: -88.23 }],
      [{ id: 99, title: "Trivia night", lat: 43.01, lng: -88.23 }]
    );

    expect(pins).toHaveLength(1);
  });

  it("caps the number of pins", () => {
    const many = Array.from({ length: 90 }, (_, i) => ({
      id: i,
      title: `Activity ${i}`,
      venueLat: 43 + i * 0.001,
      venueLng: -88,
    }));
    expect(getActivityMapPins(many, [], { max: 12 })).toHaveLength(12);
  });
});

describe("activity map viewport", () => {
  it("centres on the pins, not on a hardcoded city", () => {
    const pins = getActivityMapPins(
      [{ id: 1, title: "A", venueLat: 43.01, venueLng: -88.23 }],
      [{ id: 2, title: "B", lat: 43.03, lng: -88.25 }]
    );
    const center = getActivityMapCenter(pins);

    expect(center?.lat).toBeCloseTo(43.02);
    expect(center?.lng).toBeCloseTo(-88.24);
    // The regression this guards: the old default was San Francisco.
    expect(center?.lat).not.toBeCloseTo(37.7749);
    expect(center?.lng).not.toBeCloseTo(-122.4194);
  });

  it("falls back to the viewer when nothing is mappable", () => {
    expect(getActivityMapCenter([], WAUKESHA)).toEqual(WAUKESHA);
  });

  it("returns null when neither pins nor viewer are known, so the map shows an empty state", () => {
    expect(getActivityMapCenter([], null)).toBeNull();
    expect(getActivityMapCenter([])).toBeNull();
  });

  it("zooms in for a tight cluster and out for a wide spread", () => {
    const tight = getActivityMapPins(
      [
        { id: 1, title: "A", venueLat: 43.01, venueLng: -88.23 },
        { id: 2, title: "B", venueLat: 43.012, venueLng: -88.232 },
      ],
      []
    );
    const wide = getActivityMapPins(
      [
        { id: 1, title: "A", venueLat: 43.01, venueLng: -88.23 },
        { id: 2, title: "B", venueLat: 44.5, venueLng: -89.9 },
      ],
      []
    );

    expect(getActivityMapZoom(tight, false)).toBeGreaterThan(
      getActivityMapZoom(wide, false)
    );
    expect(getActivityMapZoom([], true)).toBe(12);
  });
});
