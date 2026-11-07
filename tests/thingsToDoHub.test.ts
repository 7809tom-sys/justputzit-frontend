import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Things to Do hub", () => {
  const page = read("client/src/pages/ThingsToDo.tsx");

  it("is a registered, publicly indexable destination", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('import ThingsToDo from "@/pages/ThingsToDo";');
    expect(app).toContain(
      '<Route path="/things-to-do" component={ThingsToDo} />'
    );

    const publicRoutes =
      app.split("\n").find(line => line.includes("const PUBLIC_ROUTES")) ?? "";
    expect(publicRoutes).toContain('"/things-to-do"');
  });

  it("sets its own SEO title and description for local search", () => {
    expect(page).toContain("useSEO({");
    expect(page).toContain("Things to Do in ${city}");
    expect(page).toContain("https://justputzit.com/things-to-do");
  });

  it("lets a member filter by who is going, budget, time of day, and free text", () => {
    expect(page).toContain('aria-label="Search things to do"');
    expect(page).toContain("Who’s going");
    expect(page).toContain("Any budget");
    expect(page).toContain("Time of day");
    expect(page).toContain("filterActivityIdeas(ACTIVITY_IDEAS");
    expect(page).toContain("groupActivityIdeasByCategory");
  });

  it("attaches real venues to an idea instead of inventing them", () => {
    expect(page).toContain("searchNearbyKeywords(center, idea.searchKeywords");
    expect(page).toContain("directionsUrl(place.lat, place.lng)");
    expect(page).toContain("Find a place");
    expect(page).toContain("No matching venues turned up");
  });

  it("asks for a location before promising nearby results", () => {
    expect(page).toContain(
      "Set your location first so we can search nearby venues."
    );
    expect(page).toContain("Venue search needs your location.");
    expect(page).toContain("<LocationOverrideControl compact />");
  });

  it("keeps the official source and the dated event feed one click away", () => {
    expect(page).toContain('href="/entertainment"');
    expect(page).toContain('href="/activity-board"');
    expect(page).toContain("Dated events near {city}");
    expect(page).toContain("source of truth before you go.");
  });

  it("still gives a next step when live venue search cannot run", () => {
    expect(page).toContain("mapsSearchUrl(idea, city)");
    expect(page).toContain("https://www.google.com/maps/search/?api=1&query=");
    expect(page).toContain("Live venue search is unavailable right now");
  });
});

describe("Things to Do discovery entry points", () => {
  it("offers the hub from the desktop More menu and the mobile More sheet", () => {
    const nav = read("client/src/lib/headerNavigation.ts");
    const mobile = read("client/src/components/MobileBottomNav.tsx");
    expect(nav).toContain(
      '{ href: "/things-to-do", icon: Compass, label: "Things to Do" }'
    );
    expect(mobile).toContain(
      '{ href: "/things-to-do", icon: Compass, label: "Things to Do"'
    );
  });

  it("cross-links the hub from Entertainment and the Activity Board", () => {
    expect(read("client/src/pages/Entertainment.tsx")).toContain(
      '<Link href="/things-to-do">'
    );
    expect(read("client/src/pages/ActivityBoard.tsx")).toContain(
      '<Link href="/things-to-do">'
    );
  });

  it("gives members a real Home module rather than hiding the hub in a menu", () => {
    const home = read("client/src/pages/Home.tsx");
    expect(home).toContain('{ id: "thingstodo", label: "Things to Do"');
    expect(home).toContain(
      'case "thingstodo":  return <ThingsToDoModule navigate={navigate} />;'
    );
    expect(home).toContain('navigate("/things-to-do")');
  });
});

describe("Entertainment page expanded sources", () => {
  const page = read("client/src/pages/Entertainment.tsx");

  it("shows the member's own city sources first without repeating them below", () => {
    expect(page).toContain("calendarsNearCity(city)");
    expect(page).toContain("calendarsForCity(city, kind)");
    expect(page).toContain("filteredLocalCalendars");
    expect(page).toContain("otherCityCalendars");
    expect(page).toContain("Official sources near you");
  });

  it("keeps the wider filters and a fallback when a filter has no feed items", () => {
    expect(page).toContain('label: "Theatre"');
    expect(page).toContain('label: "Festivals"');
    expect(page).toContain('label: "Family shows"');
    expect(page).toContain('aria-label="Entertainment type filters"');
    expect(page).toContain("is being refreshed for {city}");
  });
});
