import { test, expect } from "@playwright/test";
import { dismissConsent } from "./helpers";

/**
 * A2.5 — Beispiel-Tour: startet, führt per „Weiter" durch alle 7 Stationen und
 * endet nach Station 7 sauber (Dialog verschwindet).
 */
test("A2.5 Beispiel-Tour — 7 Stationen per Weiter, sauberes Ende", async ({ page }) => {
  await page.goto("/app");
  await dismissConsent(page);

  await page.getByRole("button", { name: /Beispiel-Tour starten/ }).click();

  // Tour-Dialog eindeutig identifizieren (enthält den „Weiter"-Button) —
  // grenzt gegen Consent-Dialog/InfoHint-Popover (ebenfalls role=dialog) ab.
  const tour = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("button", { name: "Weiter" }) });

  for (let i = 1; i <= 7; i++) {
    await expect(tour).toContainText(`${i}/7`);
    await tour.getByRole("button", { name: "Weiter" }).click();
  }

  // Nach Station 7 ist die Tour beendet — Dialog nicht mehr im DOM.
  await expect(tour).toHaveCount(0);
});
