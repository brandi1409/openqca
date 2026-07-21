import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright-Konfiguration für die openQCA-E2E-Suite (Welle W0 der
 * QUALITY-SPEC, Abnahmekriterien A2–A4).
 *
 * WICHTIG: Die Suite läuft gegen den PRODUKTIONS-Build, NICHT gegen `next dev`.
 * Vor dem ersten Lauf muss daher der Build erzeugt worden sein:
 *
 *     npm run build --workspace web
 *
 * Der `webServer` unten startet anschließend `next start` auf Port 3100 und
 * bedient die statisch vorgerenderten Routen. Lokal wird ein bereits laufender
 * Server wiederverwendet (`reuseExistingServer`), in CI immer frisch gestartet.
 */
export default defineConfig({
  testDir: "./e2e",
  // 0 Wiederholungen lokal (deterministische Diagnose), 1 in CI (Flake-Puffer).
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    locale: "de-DE",
    // Downloads (SVG/PNG-Export, A2.8) müssen akzeptiert werden.
    acceptDownloads: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
