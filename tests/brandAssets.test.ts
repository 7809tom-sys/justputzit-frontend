import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const read = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

/** Every "/brand/..." path referenced by a file must exist under client/public. */
function brandPathsIn(source: string): string[] {
  return [
    ...source.matchAll(
      /\/brand\/([A-Za-z0-9_.-]+\.(?:png|jpg|jpeg|webp|svg))/g
    ),
  ].map(m => m[1]);
}

const sources: Record<string, string> = {
  "client/index.html": read("client/index.html"),
  "client/public/manifest.json": read("client/public/manifest.json"),
  "client/src/hooks/useSEO.ts": read("client/src/hooks/useSEO.ts"),
  "client/src/components/Navbar.tsx": read("client/src/components/Navbar.tsx"),
  "client/src/pages/Home.tsx": read("client/src/pages/Home.tsx"),
  "client/src/pages/EventDetail.tsx": read("client/src/pages/EventDetail.tsx"),
  "client/src/pages/CityLanding.tsx": read("client/src/pages/CityLanding.tsx"),
};

describe("brand assets", () => {
  it("references only brand files that exist in client/public", () => {
    const missing: string[] = [];
    for (const [file, source] of Object.entries(sources)) {
      for (const asset of brandPathsIn(source)) {
        if (!existsSync(resolve(root, "client/public/brand", asset)))
          missing.push(`${file} -> ${asset}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("uses one logo lockup across every UI chrome placement", () => {
    const logos = new Set(
      [
        "client/src/components/Navbar.tsx",
        "client/src/pages/Home.tsx",
        "client/src/pages/EventDetail.tsx",
        "client/src/pages/CityLanding.tsx",
      ]
        .flatMap(file => brandPathsIn(sources[file]))
        .filter(asset => asset.startsWith("justputzit-logo-transparent"))
    );
    expect([...logos]).toHaveLength(1);
  });

  it("points the PWA manifest at 192, 512 and maskable icons of the current mark", () => {
    const manifest = JSON.parse(sources["client/public/manifest.json"]);
    const sizes = manifest.icons.map(
      (icon: { sizes: string; purpose?: string }) =>
        `${icon.sizes}:${icon.purpose ?? "any"}`
    );
    expect(sizes).toEqual(["192x192:any", "512x512:any", "512x512:maskable"]);
    for (const icon of manifest.icons) {
      expect(
        existsSync(resolve(root, "client/public", icon.src.replace(/^\//, "")))
      ).toBe(true);
    }
    expect(manifest.shortcuts).toHaveLength(2);
  });

  it("serves an opaque 1024px social preview for og:image and twitter:image", () => {
    for (const key of ["og:image", "twitter:image"]) {
      const match = sources["client/index.html"].match(
        new RegExp(`${key}"[^>]*content="([^"]+)"|content="([^"]+)"[^>]*${key}`)
      );
      expect(match).not.toBeNull();
      const url =
        (match as RegExpMatchArray)[1] ?? (match as RegExpMatchArray)[2];
      expect(url).toContain("/brand/");
      expect(url).toMatch(/og-image/);
    }
    expect(sources["client/src/hooks/useSEO.ts"]).toContain("og-image");
  });

  it("keeps the unrelated brand artwork untouched", () => {
    expect(
      existsSync(
        resolve(root, "client/public/brand/sally-advisor_4c4cea71.jpg")
      )
    ).toBe(true);
    expect(
      existsSync(
        resolve(
          root,
          "client/public/brand/just-putzit-social-games-reference_afd73bb0.png"
        )
      )
    ).toBe(true);
  });
});
