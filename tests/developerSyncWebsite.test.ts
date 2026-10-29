import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Shared question synchronization developer website", () => {
  it("keeps the sync spec behind the admin role and off the public route list", () => {
    const app = readFileSync(resolve(__dirname, "../client/src/App.tsx"), "utf8");
    const page = readFileSync(resolve(__dirname, "../client/src/pages/SharedQuestionSync.tsx"), "utf8");
    const publicRoutes = app.split("\n").find((line) => line.includes("const PUBLIC_ROUTES"));

    expect(app).toContain('path="/admin/developer-sync" component={SharedQuestionSync}');
    expect(app).not.toContain('path="/developer-sync"');
    expect(publicRoutes).not.toContain("developer-sync");
    expect(page).toContain('user?.role !== "admin"');
    expect(page).toContain("This area is for Just Putzit administrators only.");
    expect(page).toContain("Ship fresh game content without shipping answers.");
    expect(page).toContain("Presentation-safe by design");
    expect(page).toContain("Idempotent release updates");
    expect(page).toContain("Scored rooms stay pinned");
    expect(page).toContain("Request snapshot");
  });
});
