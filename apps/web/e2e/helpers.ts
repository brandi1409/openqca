import { existsSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

/**
 * Gemeinsame Test-Helfer für die openQCA-E2E-Suite.
 * Kein Spec-File (keine `test()`-Blöcke) — nur wiederverwendbare Bausteine.
 */

/** Alle Routen der App laut QUALITY-SPEC A2.1. */
export const ROUTES = [
  "/",
  "/app",
  "/methodik",
  "/preise",
  "/download",
  "/konto",
  "/rechtliches/impressum",
  "/rechtliches/datenschutz",
  "/rechtliches/agb",
] as const;

/**
 * Consent-Banner (role=dialog, CookieConsent.tsx) datenschutzfreundlich
 * wegklicken: Button „Nur notwendige". Ist das Banner nicht sichtbar (z. B.
 * Wahl bereits getroffen), passiert nichts.
 */
export async function dismissConsent(page: Page): Promise<void> {
  const btn = page.getByRole("button", { name: "Nur notwendige" });
  try {
    // Kurzer Timeout: ist die Wahl bereits (im selben Context) getroffen,
    // erscheint das Banner nicht mehr — dann nicht unnötig blockieren.
    await btn.waitFor({ state: "visible", timeout: 1500 });
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 2000 });
  } catch {
    // Banner nicht (mehr) sichtbar — nichts zu tun.
  }
}

/**
 * Demo-Datensatz auf /app laden und auf die vollständig berechnete Analyse
 * warten (komplexe Lösung enthält WOHLSTAND*URBAN*BILDUNG, vgl. A2.2). Danach
 * sind Kalibrierkurve, Truth Table, Lösungen und XY-Plot im DOM.
 */
export async function loadDemo(page: Page): Promise<void> {
  await page.goto("/app");
  await dismissConsent(page);
  await page.getByRole("button", { name: "Demo-Datensatz laden" }).click();
  await expect(page.getByText(/WOHLSTAND\*URBAN\*BILDUNG/).first()).toBeVisible({
    timeout: 15_000,
  });
}

/**
 * Eines der eingebetteten Beispiele über seine Karte laden. `cardName` matcht
 * den Kartentitel (z. B. /Fuzzy-Sets Beispiel/). Wartet, bis der Datensatz die
 * Deskriptivstatistik gerendert hat.
 */
export async function loadExample(page: Page, cardName: RegExp): Promise<void> {
  await page.goto("/app");
  await dismissConsent(page);
  await page.getByRole("button", { name: cardName }).click();
  // Deskriptivstatistik-Karte erscheint, sobald nutzbare Set-Spalten vorliegen.
  await expect(page.locator("#deskriptiv")).toBeVisible({ timeout: 15_000 });
}

/** Load the repository's real raw-data fixture through the browser file input. */
export async function loadRawRohwerte(page: Page): Promise<void> {
  await page.goto("/app");
  await dismissConsent(page);
  const candidateRoots = [
    process.env.INIT_CWD,
    process.cwd(),
    path.resolve(process.cwd(), "../.."),
  ].filter((root): root is string => !!root);
  const fixturePath = candidateRoots
    .map((root) => path.resolve(root, "datasets/rohwerte-demokratie.csv"))
    .find((candidate) => existsSync(candidate));
  if (!fixturePath) throw new Error("Raw fixture datasets/rohwerte-demokratie.csv not found");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await expect(page.locator("#deskriptiv")).toBeVisible({ timeout: 15_000 });
}

/**
 * A3.1-Kernprüfung: In JEDEM `<svg>` dürfen sich keine Text-Labels überlappen.
 * Gesammelt werden `<text>`-Elemente mit sichtbarem Inhalt (Länge > 2) und
 * nicht rein numerisch (Achsen-Ticks/Ankerwerte ausgenommen). Verglichen wird
 * paarweise innerhalb desselben SVG über die Bounding-Rects.
 */
export async function expectNoSvgLabelOverlaps(page: Page): Promise<void> {
  const collisions = await page.evaluate(() => {
    // „rein numerisch" = nur Ziffern, Separatoren, Vorzeichen, Prozent.
    const numericOnly = (s: string) => /^[\s\d.,\-−%]+$/.test(s);
    const overlaps = (a: DOMRect, b: DOMRect) =>
      a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

    const found: { svg: number; a: string; b: string }[] = [];
    const svgs = Array.from(document.querySelectorAll("svg"));
    svgs.forEach((svg, si) => {
      const texts = Array.from(svg.querySelectorAll("text")).filter((el) => {
        const c = (el.textContent ?? "").trim();
        return c.length > 2 && !numericOnly(c);
      });
      const rects = texts.map((el) => el.getBoundingClientRect());
      for (let i = 0; i < texts.length; i++) {
        for (let j = i + 1; j < texts.length; j++) {
          const a = rects[i];
          const b = rects[j];
          if (a.width === 0 || a.height === 0 || b.width === 0 || b.height === 0) continue;
          if (overlaps(a, b)) {
            found.push({
              svg: si,
              a: (texts[i].textContent ?? "").trim(),
              b: (texts[j].textContent ?? "").trim(),
            });
          }
        }
      }
    });
    return found;
  });

  expect(
    collisions,
    `Überlappende SVG-Labels gefunden: ${JSON.stringify(collisions)}`,
  ).toEqual([]);
}
