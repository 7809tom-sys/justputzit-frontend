import { describe, expect, it } from "vitest";
import {
  ACTIVITY_IDEA_BUDGETS,
  ACTIVITY_IDEA_CATEGORIES,
  ACTIVITY_IDEA_GROUPS,
  ACTIVITY_IDEAS,
  filterActivityIdeas,
  getActivityIdeaById,
  groupActivityIdeasByCategory,
  pickSeasonalIdeas,
  seasonForMonth,
  sortIdeasForSeason,
} from "../shared/activityIdeas";

describe("activity idea catalog", () => {
  it("keeps a broad, deduplicated set of concrete plans across every category", () => {
    expect(ACTIVITY_IDEAS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(ACTIVITY_IDEAS.map(idea => idea.id)).size).toBe(
      ACTIVITY_IDEAS.length
    );
    for (const category of ACTIVITY_IDEA_CATEGORIES) {
      expect(ACTIVITY_IDEAS.some(idea => idea.category === category.id)).toBe(
        true
      );
    }
  });

  it("gives every idea the fields a card needs to render", () => {
    for (const idea of ACTIVITY_IDEAS) {
      expect(idea.title.length).toBeGreaterThan(0);
      expect(idea.summary.length).toBeGreaterThan(0);
      expect(idea.emoji.length).toBeGreaterThan(0);
      expect(idea.searchKeywords.length).toBeGreaterThan(0);
      expect(idea.bestFor.length).toBeGreaterThan(0);
      expect(idea.times.length).toBeGreaterThan(0);
      expect(idea.seasons.length).toBeGreaterThan(0);
      expect(
        ACTIVITY_IDEA_BUDGETS.some(budget => budget.id === idea.budget)
      ).toBe(true);
    }
  });

  it("only links out to https official sources", () => {
    const links = ACTIVITY_IDEAS.flatMap(idea => idea.officialLinks ?? []);
    expect(links.length).toBeGreaterThan(10);
    for (const link of links) {
      expect(link.href.startsWith("https://")).toBe(true);
      expect(link.label.length).toBeGreaterThan(0);
    }
  });

  it("filters by who is going, budget, time of day, and free text", () => {
    const family = filterActivityIdeas(ACTIVITY_IDEAS, { group: "family" });
    expect(family.length).toBeGreaterThan(0);
    expect(family.every(idea => idea.bestFor.includes("family"))).toBe(true);

    const free = filterActivityIdeas(ACTIVITY_IDEAS, { budget: "free" });
    expect(free.length).toBeGreaterThan(0);
    expect(free.every(idea => idea.budget === "free")).toBe(true);

    const evenings = filterActivityIdeas(ACTIVITY_IDEAS, {
      timeOfDay: "evening",
    });
    expect(evenings.every(idea => idea.times.includes("evening"))).toBe(true);

    const bowling = filterActivityIdeas(ACTIVITY_IDEAS, { query: "bowling" });
    expect(bowling.some(idea => idea.id === "bowling")).toBe(true);
  });

  it("treats an in-or-out idea as a match for an outdoor request", () => {
    const outdoor = filterActivityIdeas(ACTIVITY_IDEAS, { setting: "outdoor" });
    expect(outdoor.some(idea => idea.setting === "either")).toBe(true);
    expect(
      outdoor.every(
        idea => idea.setting === "outdoor" || idea.setting === "either"
      )
    ).toBe(true);
  });

  it("narrows the catalog to the ideas that work in the given month", () => {
    const january = filterActivityIdeas(ACTIVITY_IDEAS, { month: 0 });
    expect(january.length).toBeGreaterThan(0);
    expect(january.every(idea => idea.seasons.includes("winter"))).toBe(true);
    expect(january.some(idea => idea.id === "ice-skating")).toBe(true);
    expect(january.some(idea => idea.id === "pumpkin-patch")).toBe(false);
  });

  it("keeps every idea on the page and floats in-season plans to the top", () => {
    const winter = sortIdeasForSeason(
      ACTIVITY_IDEAS,
      new Date("2026-01-15T12:00:00Z")
    );
    expect(winter).toHaveLength(ACTIVITY_IDEAS.length);
    expect(new Set(winter.map(idea => idea.id)).size).toBe(
      ACTIVITY_IDEAS.length
    );
    expect(winter[0].seasons).toContain("winter");

    const summer = sortIdeasForSeason(
      ACTIVITY_IDEAS,
      new Date("2026-07-15T12:00:00Z")
    );
    const firstSummerSeasonal = summer.findIndex(
      idea => idea.category === "seasonal"
    );
    expect(summer[firstSummerSeasonal].seasons).toContain("summer");
  });

  it("groups a filtered slice by category without empty sections", () => {
    const groups = groupActivityIdeasByCategory(
      filterActivityIdeas(ACTIVITY_IDEAS, { category: "games" })
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].category.id).toBe("games");
    expect(groups[0].ideas.every(idea => idea.category === "games")).toBe(true);
  });

  it("returns nothing when filters cannot be satisfied together", () => {
    expect(
      filterActivityIdeas(ACTIVITY_IDEAS, {
        category: "outdoors",
        group: "solo",
        budget: "splurge",
      })
    ).toEqual([]);
  });

  it("always offers seasonal picks, even in a thin month", () => {
    const winter = pickSeasonalIdeas(new Date("2026-01-15T12:00:00Z"), 4);
    expect(winter).toHaveLength(4);
    expect(new Set(winter.map(idea => idea.id)).size).toBe(4);
  });

  it("maps months onto the right season and looks ideas up by id", () => {
    expect(seasonForMonth(0)).toBe("winter");
    expect(seasonForMonth(3)).toBe("spring");
    expect(seasonForMonth(6)).toBe("summer");
    expect(seasonForMonth(9)).toBe("fall");
    expect(getActivityIdeaById("trivia-night")?.title).toBe(
      "Trivia night at a pub"
    );
    expect(getActivityIdeaById("does-not-exist")).toBeUndefined();
  });

  it("covers every audience the group filter exposes", () => {
    for (const group of ACTIVITY_IDEA_GROUPS) {
      expect(ACTIVITY_IDEAS.some(idea => idea.bestFor.includes(group.id))).toBe(
        true
      );
    }
  });
});
