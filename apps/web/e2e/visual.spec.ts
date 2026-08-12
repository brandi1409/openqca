import { test, expect } from "@playwright/test";
import { ROUTES, loadDemo, loadExample, expectNoSvgLabelOverlaps, openDestination } from "./helpers";

/**
 * A3 — Visuelle Integrität, geprüft in 4 Matrizen: Light/Dark × Desktop(1280)/
 * Mobile(390). Die Prüfungen sind generisch und fangen auch künftige Fälle.
 */

const SCHEMES = ["light", "dark"] as const;
const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "mobile", width: 390, height: 844 },
] as const;

for (const colorScheme of SCHEMES) {
  for (const vp of VIEWPORTS) {
    test.describe(`A3 ${colorScheme} @ ${vp.label} (${vp.width}×${vp.height})`, () => {
      test.use({ colorScheme, viewport: { width: vp.width, height: vp.height } });

      test("A3.1 keine überlappenden SVG-Text-Labels (Demo & Fuzzy)", async ({ page }) => {
        await loadDemo(page);
        await openDestination(page, "decisions");
        await expectNoSvgLabelOverlaps(page);
        await openDestination(page, "evidence");
        await expectNoSvgLabelOverlaps(page);

        await loadExample(page, /Fuzzy-Sets Beispiel/);
        await openDestination(page, "decisions");
        await expectNoSvgLabelOverlaps(page);
        await openDestination(page, "evidence");
        await expectNoSvgLabelOverlaps(page);
      });

      test("A3.2 kein horizontaler Seiten-Overflow auf jeder Route", async ({ page }) => {
        for (const route of ROUTES) {
          // Consent-Banner ist full-width fixed und kann keinen horizontalen
          // Overflow verursachen → hier nicht wegklicken (spart Zeit im Loop).
          await page.goto(route);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow, `Horizontaler Overflow auf ${route}`).toBeLessThanOrEqual(1);
        }
      });

      test("A3.6 AI-Freigabe bleibt innerhalb der Seitenbreite", async ({ page }) => {
        await page.route("**/api/ai/status", async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ version: "v2", available: true }),
          });
        });
        await loadDemo(page);
        await openDestination(page, "research");
        const brief = page.getByRole("region", { name: "Forschungsdesign klären" });
        await brief.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
        await expect(brief.getByText("Anfragevorschau", { exact: true })).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, "AI-Freigabe verursacht horizontalen Overflow").toBeLessThanOrEqual(1);
      });

      test("A3.3 Consent-Banner — beide Buttons vollständig im Viewport", async ({ page }) => {
        await page.goto("/app");
        // localStorage-Reset erzwingt das Banner beim Reload.
        await page.evaluate(() => localStorage.removeItem("openqca_consent"));
        await page.reload();

        const size = page.viewportSize()!;
        for (const name of ["Nur notwendige", "Alle akzeptieren"]) {
          const btn = page.getByRole("button", { name });
          await expect(btn).toBeVisible();
          const box = await btn.boundingBox();
          expect(box, `Bounding-Box „${name}"`).not.toBeNull();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.y).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(size.width + 1);
          expect(box!.y + box!.height).toBeLessThanOrEqual(size.height + 1);
        }
      });

      test("A3.4 kein sichtbarer Platzhalter-Text (fs_, PLATZHALTER, undefined, NaN)", async ({
        page,
      }) => {
        const forbidden = ["fs_", "PLATZHALTER", "undefined", "NaN"];
        const routes = ["/", "/app", "/methodik", "/preise", "/download"];
        for (const route of routes) {
          if (route === "/app") {
            await loadDemo(page);
          } else {
            // Banner-Text enthält keine verbotenen Strings → nicht wegklicken nötig.
            await page.goto(route);
          }
          const text = await page.evaluate(() => document.body.innerText);
          for (const bad of forbidden) {
            expect(text, `„${bad}" gefunden auf ${route}`).not.toContain(bad);
          }
        }
      });

      /**
       * A3.5 — Die Ankergriffe unter der Kalibrierkurve sind auf schmalen Viewports
       * bedienbar. Die Trefferfläche steckt im viewBox-Koordinatensystem und
       * schrumpfte deshalb mit der Grafik: bei fester Breite waren es auf 390px
       * noch 12 CSS-Pixel. Jetzt reicht jeder Griff bis zur Mitte zum Nachbarn.
       * Zusätzlich wird geprüft, dass Ziehen den Ankerwert wirklich verändert —
       * A2.10 deckt nur die Tastatur ab.
       */
      test("A3.5 Ankergriffe: Trefferfläche ≥ 44px und Ziehen ändert den Anker", async ({
        page,
      }) => {
        await loadDemo(page);
        await openDestination(page, "decisions");
        const quick = page.getByTestId("calibration-quick");
        const sliders = quick.getByRole("slider");
        const count = await sliders.count();
        expect(count, "Die Schnell-Ansicht muss Ankergriffe zeigen").toBeGreaterThan(0);
        for (let i = 0; i < Math.min(count, 3); i++) {
          const box = await sliders.nth(i).boundingBox();
          expect(box, `Griff ${i} ohne Bounding-Box`).not.toBeNull();
          expect(
            box!.width,
            `Trefferfläche des Griffs ${i} ist ${Math.round(box!.width)}px breit`,
          ).toBeGreaterThanOrEqual(44);
        }

        const field = quick.locator('[data-testid^="calibration-quick-anchor-"]').first();
        const before = Number(await field.inputValue());
        // Ohne Scrollen liegt die Bounding-Box außerhalb des Viewports und die
        // Mausbewegung landet neben der Grafik.
        await sliders.first().scrollIntoViewIfNeeded();
        const box = (await sliders.first().boundingBox())!;
        const cy = box.y + box.height / 2;
        await page.mouse.move(box.x + box.width / 2, cy);
        await page.mouse.down();
        for (let i = 1; i <= 8; i++) await page.mouse.move(box.x + box.width / 2 + i * 4, cy);
        await page.mouse.up();
        await expect.poll(async () => Number(await field.inputValue())).toBeGreaterThan(before);
      });
    });
  }
}
