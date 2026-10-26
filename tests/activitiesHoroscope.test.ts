import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Activities horoscope placement", () => {
  const page = readFileSync(resolve(__dirname, "../client/src/pages/Activities.tsx"), "utf8");

  it("presents Sally's horoscope as a personal activity with a direct handoff", () => {
    expect(page).toContain("Sally’s Daily Horoscope");
    expect(page).toContain("Personal activity");
    expect(page).toContain('navigate(\"/horoscope\")');
    expect(page).toContain("Open horoscope");
  });

  it("keeps the personal horoscope above and separate from nearby-place discovery", () => {
    expect(page).toContain("Personal activity: intentionally separate from official nearby-place results.");
    expect(page.indexOf("Personal activity: intentionally separate")).toBeLessThan(page.indexOf("Search bar"));
    expect(page).toContain("official nearby-place results");
  });
});
