import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relative: string) => readFileSync(resolve(__dirname, "..", relative), "utf8");

describe("frontend deploy configuration", () => {
  it("has no static %VITE_...% placeholders in index.html (they are requested literally when the variable is unset)", () => {
    expect(read("client/index.html")).not.toMatch(/%VITE_[A-Z_]+%/);
  });

  it("loads analytics only when both variables are set", () => {
    const analytics = read("client/src/lib/analytics.ts");
    expect(analytics).toContain("VITE_ANALYTICS_ENDPOINT");
    expect(analytics).toContain("VITE_ANALYTICS_WEBSITE_ID");
    expect(analytics).toContain("if (!endpoint || !websiteId) return;");
    expect(read("client/src/main.tsx")).toContain("loadAnalytics();");
  });

  it("warns when the production build has no VITE_API_URL and rejects HTML where JSON is expected", () => {
    const main = read("client/src/main.tsx");
    expect(main).toContain("import.meta.env.PROD && !isApiUrlConfigured");
    expect(main).toContain('includes("text/html")');
    expect(read("client/src/lib/supabase.ts")).toContain("export const isApiUrlConfigured");
  });

  it("does not query notifications for signed-out visitors (a 401 there sends them to the login page)", () => {
    const nav = read("client/src/components/MobileBottomNav.tsx");
    expect(nav).toMatch(/notifications\.getAll\.useQuery\(undefined, \{\s*enabled: !!user,/);
    expect(read("client/src/components/Navbar.tsx")).toContain("enabled: !shouldHide");
  });

  it("never redirects to the login page from an auth page (that reloads the page in a loop)", () => {
    const main = read("client/src/main.tsx");
    expect(main).toContain('const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"]');
    expect(main).toContain("AUTH_PAGES.some(page => window.location.pathname.startsWith(page))");
  });
});
