import { test, expect } from "@playwright/test";
import { ROUTES, loadDemo, loadExample, expectNoSvgLabelOverlaps } from "./helpers";

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
        await expectNoSvgLabelOverlaps(page);

        await loadExample(page, /Fuzzy-Sets Beispiel/);
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
    });
  }
}
