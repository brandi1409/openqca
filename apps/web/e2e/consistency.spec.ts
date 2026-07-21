import { test, expect } from "@playwright/test";
import { dismissConsent } from "./helpers";

/**
 * A4 — Konsistenz des Design-Systems, geprüft in 4 Matrizen: Light/Dark ×
 * Desktop(1280)/Mobile(390).
 *
 * HINWEIS: A4.1 und A4.2 sind mit `test.fixme` markiert, solange der
 * Konsistenz-Restpass (Welle W1: cloud.tsx, /konto, /preise, DownloadPage,
 * Glossary, GuidedTour, NegatedOutcomePanel, SectionNav) noch aussteht. Die
 * Prüf-Logik ist bereits vollständig — nach W1-Abschluss genügt das Entfernen
 * der `test.fixme`-Zeile, um die Kriterien scharf zu schalten.
 */

const SCHEMES = ["light", "dark"] as const;
const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "mobile", width: 390, height: 844 },
] as const;

/** /app mit Demo befüllen, damit ALLE Buttons/Flächen (Kalibrierung, Lösungen, Export) im DOM sind. */
async function primeApp(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Demo-Datensatz laden" }).click();
  await expect(page.getByText(/WOHLSTAND\*URBAN\*BILDUNG/).first()).toBeVisible({ timeout: 15_000 });
}

const A4_ROUTES = ["/app", "/preise", "/download", "/konto"] as const;

for (const colorScheme of SCHEMES) {
  for (const vp of VIEWPORTS) {
    test.describe(`A4 ${colorScheme} @ ${vp.label} (${vp.width}×${vp.height})`, () => {
      test.use({ colorScheme, viewport: { width: vp.width, height: vp.height } });

      test("A4.1 jeder <button> nutzt .oq-btn oder ist dokumentierte Ausnahme", async ({ page }) => {

        const offenders: { route: string; html: string }[] = [];
        for (const route of A4_ROUTES) {
          await page.goto(route);
          await dismissConsent(page);
          if (route === "/app") await primeApp(page);

          const bad = await page.evaluate(() => {
            // Dokumentierte Ausnahmen (Selektor-Liste, QUALITY-SPEC A4.1):
            const EXCEPTIONS = [
              "button[aria-label]", // ⓘ-InfoHints (tragen aria-label)
              '[role="slider"]', // Kurven-Anker-Griffe
              '[role="group"] button', // Segment-Gruppen: LanguageToggle, XY-Label-Toggle
              '[role="dialog"][aria-labelledby="cookie-consent-title"] button', // Consent-Dialog
            ];
            const isException = (el: Element) => EXCEPTIONS.some((sel) => el.matches(sel));
            const out: string[] = [];
            document.querySelectorAll("button").forEach((b) => {
              if (b.classList.contains("oq-btn")) return;
              if (isException(b)) return;
              out.push(b.outerHTML.replace(/\s+/g, " ").slice(0, 140));
            });
            return out;
          });
          bad.forEach((html) => offenders.push({ route, html }));
        }

        expect(
          offenders,
          `Buttons ohne .oq-btn (und keine Ausnahme):\n${JSON.stringify(offenders, null, 2)}`,
        ).toEqual([]);
      });

      test("A4.2 Schriftgrößen aus der Skala, Gewichte ∈ {400,600,700}", async ({ page }) => {

        const SIZES = [11, 12, 13.5, 15, 16.5, 20, 28];
        const WEIGHTS = [400, 600, 700];
        const violations: unknown[] = [];

        for (const route of A4_ROUTES) {
          await page.goto(route);
          await dismissConsent(page);
          if (route === "/app") await primeApp(page);

          const bad = await page.evaluate(
            ({ SIZES, WEIGHTS }) => {
              const near = (v: number, arr: number[]) => arr.some((a) => Math.abs(a - v) <= 0.1);
              const els = Array.from(
                document.querySelectorAll("h1,h2,h3,button,p,th,td,span"),
              ).slice(0, 400);
              const out: { tag: string; fontSize?: number; fontWeight?: number; text: string }[] = [];
              for (const el of els) {
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) continue; // unsichtbar
                if (el.closest("svg")) continue; // SVG-interne Größen ausgenommen
                const cs = getComputedStyle(el);
                const fs = parseFloat(cs.fontSize);
                const fw = parseInt(cs.fontWeight, 10);
                const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30);
                if (!near(fs, SIZES)) out.push({ tag: el.tagName, fontSize: fs, text });
                else if (!WEIGHTS.includes(fw)) out.push({ tag: el.tagName, fontWeight: fw, text });
              }
              return out;
            },
            { SIZES, WEIGHTS },
          );
          bad.forEach((v) => violations.push({ route, ...(v as object) }));
        }

        expect(
          violations,
          `Skala-Verstöße (Größe ∉ {11,12,13.5,15,16.5,20,28} oder Gewicht ∉ {400,600,700}):\n${JSON.stringify(
            violations,
            null,
            2,
          )}`,
        ).toEqual([]);
      });
    });
  }
}
