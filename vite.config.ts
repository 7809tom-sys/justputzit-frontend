import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

const plugins = [
  react(),
  tailwindcss(),
  VitePWA({
    registerType: "autoUpdate",
    injectRegister: "auto",
    manifest: false, // We use our own manifest.json in public/
    workbox: {
      clientsClaim: true,
      skipWaiting: true,
      cleanupOutdatedCaches: true,
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      navigateFallback: "/index.html",
      navigateFallbackDenylist: [/^\/api\//],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/trpc\//,
          handler: "NetworkFirst",
          options: {
            cacheName: "trpc-cache",
            expiration: { maxEntries: 50, maxAgeSeconds: 300 },
          },
        },
        {
          // Map tiles, styles, and glyphs must always be current: ask the network, never the cache.
          // (Without a rule Workbox would already leave them alone; this makes the intent explicit so a
          // future cache-everything rule cannot serve stale tiles.)
          urlPattern: /^https:\/\/api\.maptiler\.(?:com|eu)\//,
          handler: "NetworkOnly",
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  }),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: [
      "justputzit.com",
      ".justputzit.com",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});


