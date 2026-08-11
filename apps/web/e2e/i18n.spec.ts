import { expect, test } from "@playwright/test";
import { dismissConsent } from "./helpers";

test("A2.6 DE/EN workspace labels persist across reload", async ({ page }) => {
  await page.goto("/app#answer");
  await dismissConsent(page);
  await expect(page.getByRole("heading", { name: "Aktuelle Antwort", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Analysebereiche" }).getByRole("button")).toHaveText([
    "Antwort",
    "Forschungsdesign",
    "Entscheidungen",
    "Evidenz",
    "Prüfpaket",
  ]);

  await page.getByRole("banner").getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Current answer", level: 1 })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Analysis destinations" }).getByRole("button")).toHaveText([
    "Answer",
    "Research design",
    "Decisions",
    "Evidence",
    "Defense pack",
  ]);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Current answer", level: 1 })).toBeVisible();
  await page.getByRole("banner").getByRole("button", { name: "DE", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Aktuelle Antwort", level: 1 })).toBeVisible();
});
