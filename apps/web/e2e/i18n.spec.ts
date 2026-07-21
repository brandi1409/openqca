import { test, expect } from "@playwright/test";

/**
 * A2.6 — Sprachumschalter: DE→EN stellt die Kern-Überschriften um, die Wahl
 * übersteht einen Reload, und DE lässt sich zurückschalten.
 *
 * Geprüfte Überschriften (immer gerendert, auch ohne Datensatz):
 *   Kalibrierung: „Kalibrieren" (DE) / „Calibrate" (EN)
 *   Truth Table:  „Truth Table & Lösungen" (DE) / „Truth table & solutions" (EN)
 */
test("A2.6 DE/EN — Umschalten, Persistenz über Reload, Rückschalten", async ({ page }) => {
  await page.goto("/app");

  const ttHeadingDe = page.getByRole("heading", { name: /Truth Table & Lösungen/ });
  const ttHeadingEn = page.getByRole("heading", { name: /Truth table & solutions/ });
  const calibHeadingDe = page.getByRole("heading", { name: "Kalibrieren", exact: true });
  const calibHeadingEn = page.getByRole("heading", { name: "Calibrate", exact: true });

  // Ausgangszustand ist Deutsch.
  await expect(ttHeadingDe).toBeVisible();
  await expect(calibHeadingDe).toBeVisible();

  // Auf Englisch umschalten. Der Umschalter existiert doppelt (Header + Footer);
  // beide steuern denselben globalen Locale → der erste (Header) genügt.
  await page.getByRole("button", { name: "EN", exact: true }).first().click();
  await expect(ttHeadingEn).toBeVisible();
  await expect(calibHeadingEn).toBeVisible();
  await expect(calibHeadingDe).toHaveCount(0);

  // Wahl übersteht Reload (localStorage openqca_locale).
  await page.reload();
  await expect(ttHeadingEn).toBeVisible();
  await expect(calibHeadingEn).toBeVisible();

  // Zurück auf Deutsch.
  await page.getByRole("button", { name: "DE", exact: true }).first().click();
  await expect(ttHeadingDe).toBeVisible();
  await expect(calibHeadingDe).toBeVisible();
});
