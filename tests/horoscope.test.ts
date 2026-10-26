import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Sally daily horoscope", () => {
  const page = readFileSync(resolve(__dirname, "../client/src/pages/Horoscope.tsx"), "utf8");
  const app = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf8");
  const home = readFileSync(resolve(__dirname, "../client/src/pages/Home.tsx"), "utf8");

  it("offers all zodiac signs and keeps daily readings deterministic", () => {
    expect(page).toContain("const SIGNS");
    expect(page).toContain("aries");
    expect(page).toContain("pisces");
    expect(page).toContain("dayNumber");
    expect(page).toContain("localStorage.getItem(\"just-putzit-horoscope-sign\")");
  });

  it("includes an explicit entertainment boundary and app route", () => {
    expect(page).toContain("for entertainment and reflection only");
    expect(page).toContain("not predictions, medical advice, financial advice");
    expect(page).toContain("AdvisorAvatar");
    expect(app).toContain('path=\"/horoscope\"');
    expect(home).toContain("Read today’s horoscope");
    expect(home).toContain('navigate(\"/horoscope\")');
  });
});
