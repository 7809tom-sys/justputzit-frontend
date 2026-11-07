import { describe, expect, it } from "vitest";
import {
  calendarsForCity,
  calendarsNearCity,
  filterCurrentEntertainment,
  filterVenueListings,
  matchesEntertainmentKind,
  officialEntertainmentCalendars,
} from "../client/src/lib/entertainmentDiscovery";

describe("entertainment discovery", () => {
  const now = new Date("2026-08-12T12:00:00Z");

  it("keeps future music, arts, community, and named entertainment listings while excluding stale items", () => {
    const listings = [
      {
        id: 1,
        title: "Friday Night Live",
        category: "music",
        eventDate: new Date("2026-08-14T18:30:00Z"),
        city: "Waukesha",
        isFree: true,
      },
      {
        id: 2,
        title: "Book Discussion",
        category: "community",
        eventDate: new Date("2026-08-19T18:30:00Z"),
        city: "Waukesha",
        isFree: true,
      },
      {
        id: 3,
        title: "Old Concert",
        category: "music",
        eventDate: new Date("2026-08-01T18:30:00Z"),
        city: "Waukesha",
        isFree: true,
      },
      {
        id: 4,
        title: "Neighborhood meeting",
        category: "other",
        eventDate: new Date("2026-08-20T18:30:00Z"),
        city: "Waukesha",
        isFree: true,
      },
    ];
    expect(
      filterCurrentEntertainment(listings, now).map(listing => listing.id)
    ).toEqual([1, 2]);
  });

  it("keeps upcoming Waukesha Public Library programs visible as a direct venue collection", () => {
    const listings = [
      {
        id: 8,
        title: "Trail Running Film Festival",
        category: "arts",
        eventDate: new Date("2026-08-18T18:00:00Z"),
        venueName: "Waukesha Public Library",
        city: "Waukesha",
        isFree: true,
      },
      {
        id: 9,
        title: "Quiet Book Club",
        category: "community",
        eventDate: new Date("2026-08-25T18:30:00Z"),
        venueName: "Waukesha Public Library",
        city: "Waukesha",
        isFree: true,
      },
      {
        id: 10,
        title: "Old Library Event",
        category: "community",
        eventDate: new Date("2026-08-01T18:30:00Z"),
        venueName: "Waukesha Public Library",
        city: "Waukesha",
        isFree: true,
      },
      {
        id: 11,
        title: "Other Venue",
        category: "arts",
        eventDate: new Date("2026-08-18T18:00:00Z"),
        venueName: "Waukesha Civic Theatre",
        city: "Waukesha",
        isFree: true,
      },
    ];
    expect(
      filterVenueListings(listings, "Waukesha Public Library", now).map(
        listing => listing.id
      )
    ).toEqual([8, 9]);
  });
});

describe("official entertainment calendars", () => {
  it("covers every city Just Putzit supports plus sources that work anywhere", () => {
    const cities = new Set(
      officialEntertainmentCalendars.map(calendar => calendar.city)
    );
    for (const city of [
      "Waukesha",
      "Milwaukee",
      "Chicago",
      "Brookfield",
      "West Allis",
      "Wauwatosa",
      "Madison",
      "any",
    ]) {
      expect(cities.has(city)).toBe(true);
    }
    expect(officialEntertainmentCalendars.length).toBeGreaterThanOrEqual(30);
  });

  it("offers a mix of source kinds rather than only concerts", () => {
    const covered = new Set(
      officialEntertainmentCalendars.flatMap(calendar => calendar.kinds)
    );
    for (const kind of [
      "live_music",
      "comedy",
      "karaoke",
      "theatre",
      "film",
      "festival",
      "family",
    ]) {
      expect(covered.has(kind)).toBe(true);
    }
    expect(
      officialEntertainmentCalendars.every(
        calendar => calendar.kinds.length > 0
      )
    ).toBe(true);
  });

  it("links only to secure official pages with a label and description", () => {
    for (const calendar of officialEntertainmentCalendars) {
      expect(calendar.href.startsWith("https://")).toBe(true);
      expect(calendar.label.length).toBeGreaterThan(0);
      expect(calendar.detail.length).toBeGreaterThan(0);
      expect(calendar.title.length).toBeGreaterThan(0);
    }
  });

  it("returns only the member's own city sources for the compact near-you row", () => {
    const waukesha = calendarsNearCity("Waukesha");
    expect(waukesha.length).toBeGreaterThanOrEqual(3);
    expect(waukesha.every(calendar => calendar.city === "Waukesha")).toBe(true);
    expect(calendarsNearCity("Nowhere")).toEqual([]);
    expect(calendarsNearCity(undefined)).toEqual([]);
  });

  it("narrows the near-you row by the member's chosen type", () => {
    const waukeshaComedy = calendarsNearCity("Waukesha", "comedy");
    expect(waukeshaComedy).toEqual([]);
    const waukeshaFamily = calendarsNearCity("Waukesha", "family");
    expect(waukeshaFamily.length).toBeGreaterThan(0);
    expect(
      waukeshaFamily.every(calendar => calendar.kinds.includes("family"))
    ).toBe(true);
  });

  it("ranks the member's city first, then everywhere-sources, then other cities", () => {
    const ordered = calendarsForCity("Milwaukee");
    const milwaukeeIndex = ordered.findIndex(
      calendar => calendar.city === "Milwaukee"
    );
    const anywhereIndex = ordered.findIndex(
      calendar => calendar.city === "any"
    );
    const otherIndex = ordered.findIndex(
      calendar => calendar.city === "Waukesha"
    );
    expect(milwaukeeIndex).toBe(0);
    expect(anywhereIndex).toBeGreaterThan(milwaukeeIndex);
    expect(otherIndex).toBeGreaterThan(anywhereIndex);
  });

  it("narrows the calendars to the filter the member picked", () => {
    const comedy = calendarsForCity("Milwaukee", "comedy");
    expect(comedy.length).toBeGreaterThan(0);
    expect(comedy.every(calendar => calendar.kinds.includes("comedy"))).toBe(
      true
    );
    expect(comedy.some(calendar => calendar.title === "Milwaukee Improv")).toBe(
      true
    );

    const music = calendarsForCity("Milwaukee", "live_music");
    expect(music.some(calendar => calendar.kinds.includes("festival"))).toBe(
      true
    );

    // A general directory that lists comedy still shows up under comedy.
    expect(comedy.some(calendar => calendar.city === "any")).toBe(true);
    expect(calendarsForCity("Milwaukee", "all").length).toBe(
      officialEntertainmentCalendars.length
    );
  });
});

describe("entertainment kind filters", () => {
  const base = { category: "other", venueName: null };

  it("separates theatre, film, festivals, and family shows", () => {
    expect(
      matchesEntertainmentKind(
        { ...base, title: "A Christmas Carol — a staged musical" },
        "theatre"
      )
    ).toBe(true);
    expect(
      matchesEntertainmentKind(
        { ...base, title: "Late Night Movie Screening" },
        "film"
      )
    ).toBe(true);
    expect(
      matchesEntertainmentKind(
        { ...base, title: "Riverside Rhythms Festival" },
        "festival"
      )
    ).toBe(true);
    expect(
      matchesEntertainmentKind(
        { ...base, title: "Family Matinee: Puppet Show" },
        "family"
      )
    ).toBe(true);
  });

  it("keeps the original live-band, comedy, and karaoke behavior", () => {
    expect(
      matchesEntertainmentKind(
        { ...base, title: "Open Mic Jazz" },
        "live_music"
      )
    ).toBe(true);
    expect(
      matchesEntertainmentKind({ ...base, title: "Stand-up Night" }, "comedy")
    ).toBe(true);
    expect(
      matchesEntertainmentKind(
        { ...base, title: "Karaoke Tuesdays" },
        "karaoke"
      )
    ).toBe(true);
    expect(
      matchesEntertainmentKind({ ...base, title: "Karaoke Tuesdays" }, "comedy")
    ).toBe(false);
  });

  it("falls back to the event category for music", () => {
    expect(
      matchesEntertainmentKind(
        { ...base, title: "Downtown Sounds", category: "music" },
        "live_music"
      )
    ).toBe(true);
  });
});
