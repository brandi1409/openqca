import { test, expect } from "@playwright/test";
import { loadDemo, loadExample } from "./helpers";

/**
 * A2.2–A2.4, A2.7 — Funktionale Kern-Flüsse: Demo, Crisp-/Fuzzy-Beispiel und
 * Rollen-Wechsel.
 */

test("A2.2 Demo — komplexe Lösung enthält WOHLSTAND*URBAN*BILDUNG", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await loadDemo(page);

  await expect(page.getByText(/WOHLSTAND\*URBAN\*BILDUNG/).first()).toBeVisible();
  expect(pageErrors, pageErrors.join(" | ")).toEqual([]);
});

test("A2.3 Crisp-Beispiel — FOERDERUNG Min 0 / Max 1, bereits kalibriert", async ({ page }) => {
  await loadExample(page, /Crisp-Sets Beispiel/);

  // Deskriptivstatistik-Zeile FOERDERUNG: Minimum 0, Maximum 1 (als 0,000 / 1,000 gerendert).
  const row = page.locator("#deskriptiv tbody tr").filter({ hasText: "FOERDERUNG" });
  await expect(row).toBeVisible();
  const cells = row.getByRole("cell");
  await expect(cells.nth(2), "Minimum FOERDERUNG").toHaveText(/^0(,0+)?$/);
  await expect(cells.nth(5), "Maximum FOERDERUNG").toHaveText(/^1(,0+)?$/);

  // Crisp-Sets brauchen keine Kalibrierung.
  await expect(page.getByText(/bereits kalibriert/)).toBeVisible();
});

test("A2.4 Fuzzy-Beispiel — WOHLSTAND Min 0,100 / Max 0,900", async ({ page }) => {
  await loadExample(page, /Fuzzy-Sets Beispiel/);

  const row = page.locator("#deskriptiv tbody tr").filter({ hasText: "WOHLSTAND" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("0,100");
  await expect(row).toContainText("0,900");
  const cells = row.getByRole("cell");
  await expect(cells.nth(2), "Minimum WOHLSTAND").toHaveText("0,100");
  await expect(cells.nth(5), "Maximum WOHLSTAND").toHaveText("0,900");
});

test("A2.7 Rollen-Wechsel — genau ein Outcome, Lösungen rechnen neu", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await loadDemo(page);

  // Rollen-Selects im Variablen-Schritt = Selects mit einer <option value="outcome">.
  const roleSelects = page.locator('#variablen select:has(option[value="outcome"])');
  await roleSelects.first().selectOption("outcome");

  // Genau EIN Rollen-Select steht danach auf „outcome" (App setzt altes Outcome zurück).
  await expect
    .poll(async () =>
      roleSelects.evaluateAll(
        (els) => els.filter((e) => (e as HTMLSelectElement).value === "outcome").length,
      ),
    )
    .toBe(1);

  // Lösungen rechnen neu: das erste Feld (wohlstand) ist jetzt das Outcome der Formel.
  await expect(page.locator("#loesungen")).toContainText("→ WOHLSTAND");
  expect(pageErrors, pageErrors.join(" | ")).toEqual([]);
});
