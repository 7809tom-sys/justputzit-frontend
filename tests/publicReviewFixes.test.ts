import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");

describe("public review fixes", () => {
  it("publishes a draft terms page on a public route and links it beside privacy", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const terms = readFileSync(resolve(root, "client/src/pages/Terms.tsx"), "utf8");
    const navbar = readFileSync(resolve(root, "client/src/components/Navbar.tsx"), "utf8");
    const home = readFileSync(resolve(root, "client/src/pages/Home.tsx"), "utf8");
    const safety = readFileSync(resolve(root, "client/src/pages/Safety.tsx"), "utf8");
    const signup = readFileSync(resolve(root, "client/src/pages/SignUp.tsx"), "utf8");
    const publicRoutes = app.split("\n").find((line) => line.includes("const PUBLIC_ROUTES")) ?? "";

    expect(app).toContain('path="/terms" component={Terms}');
    expect(publicRoutes).toContain('"/terms"');
    expect(terms).toContain("DRAFT — pending owner/legal review");
    expect(terms).toContain("18 years of age or older");
    expect(terms).toContain("meet in a public place");
    expect(terms).toContain("User conduct");
    expect(terms).toContain("Organization pages and invites");
    expect(terms).toContain("Account removal");
    expect(terms).toContain("Limitation of liability");
    expect(terms).toContain("State of Wisconsin");
    expect(terms).toContain("support@justputzit.com");
    expect(terms).toContain("tel:+12622213103");
    expect(terms).toContain("(262) 221-3103");
    expect(navbar).toContain('href="/terms"');
    expect(home).toContain('href="/terms"');
    expect(safety).toContain('href="/terms"');
    expect(signup).toContain('aria-label="I agree to the Terms and Privacy Policy"');
    expect(signup).toContain('href="/terms"');
    expect(signup).toContain('href="/privacy"');
    expect(signup).toContain("agreedToTerms");
  });

  it("uses the owner phone and keeps the Crunch partner claim off the gym pitch", () => {
    const pitch = readFileSync(resolve(root, "client/src/pages/GymPitch.tsx"), "utf8");
    expect(pitch).toContain("gyms@justputzit.com");
    expect(pitch).toContain("Local gym partners");
    expect(pitch).toContain('href="tel:+12622213103"');
    expect(pitch).toContain("Call Us");
    expect(pitch).not.toContain("tel:+12625550100");
    expect(pitch).not.toContain("Crunch");
  });

  it("builds without the retired Manus artifacts", () => {
    const pkg = readFileSync(resolve(root, "package.json"), "utf8");
    expect(pkg).toContain('"build:web": "vite build"');
    expect(pkg).not.toContain("assert-no-manus-dist");
    expect(pkg).not.toContain("@builder.io/vite-plugin-jsx-loc");

    expect(existsSync(resolve(root, "client/src/components/ManusDialog.tsx"))).toBe(false);
    expect(existsSync(resolve(root, "scripts/assert-no-manus-dist.mjs"))).toBe(false);

    const vite = readFileSync(resolve(root, "vite.config.ts"), "utf8");
    expect(vite).not.toContain("jsxLocPlugin");
    expect(vite).not.toContain("manus.computer");
  });
});
