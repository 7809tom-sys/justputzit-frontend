import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("friendly older-lady advisor persona", () => {
  const root = resolve(__dirname, "../client/src");
  const advisor = readFileSync(resolve(root, "components/AdvisorAvatar.tsx"), "utf8");
  const surfaces = ["pages/Profile.tsx", "pages/Interview.tsx", "pages/Onboarding.tsx", "pages/Matches.tsx"]
    .map((file) => readFileSync(resolve(root, file), "utf8"));

  it("uses a human older-lady advisor avatar with accessible labeling", () => {
    expect(advisor).toContain("/brand/sally-advisor_4c4cea71.jpg");
    expect(advisor).toContain("friendly older-lady community advisor");
    expect(advisor).toContain("data-testid=\"advisor-avatar\"");
  });

  it("uses the shared advisor avatar across core Sally surfaces", () => {
    for (const surface of surfaces) expect(surface).toContain("AdvisorAvatar");
    expect(surfaces.join("\n")).not.toContain("🤖");
    expect(surfaces.join("\n")).not.toContain("Sally AI Helper");
    expect(surfaces.join("\n")).toContain("Sally’s friendly read on you");
  });
});
