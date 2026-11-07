import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isAnalyticsEnabled,
  loadAnalytics,
  track,
} from "../client/src/lib/analytics";

const read = (relative: string) =>
  readFileSync(resolve(__dirname, "..", relative), "utf8");

describe("analytics", () => {
  it("loads analytics only when both variables are set", () => {
    const analytics = read("client/src/lib/analytics.ts");
    expect(analytics).toContain("VITE_ANALYTICS_ENDPOINT");
    expect(analytics).toContain("VITE_ANALYTICS_WEBSITE_ID");
    expect(analytics).toContain("if (!endpoint || !websiteId) return;");
  });

  it("is a no-op before the script is configured, so tracking never throws on a bare build", () => {
    expect(isAnalyticsEnabled()).toBe(false);
    expect(() =>
      track("signup_submitted", { city: "milwaukee" })
    ).not.toThrow();
    expect(() => loadAnalytics()).not.toThrow();
  });
});
