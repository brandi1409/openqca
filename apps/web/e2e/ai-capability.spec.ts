import { expect, test } from "@playwright/test";
import { dismissConsent, loadDemo, openDestination } from "./helpers";

test("AI-disabled deployments hide actionable coach controls", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "research");
  const brief = page.getByRole("region", { name: "Forschungsdesign klären" });
  await expect(brief.getByText("Die KI-Prüfung ist in dieser Bereitstellung nicht verfügbar.")).toBeVisible();
  await expect(brief.getByRole("button", { name: "KI-Prüfung vorbereiten" })).toHaveCount(0);
});

test("AI status exposes only capability metadata", async ({ request }) => {
  const response = await request.get("/api/ai/status");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  await expect(response.json()).resolves.toEqual({ version: "v2", available: false });
});

test("AI status failures also fail closed in the workspace", async ({ page }) => {
  await page.route("**/api/ai/status", async (route) => route.abort());
  await page.goto("/app?demo=1#research");
  await dismissConsent(page);
  await openDestination(page, "research");
  const brief = page.getByRole("region", { name: "Forschungsdesign klären" });
  await expect(brief.getByText("Die KI-Prüfung ist in dieser Bereitstellung nicht verfügbar.")).toBeVisible();
  await expect(brief.getByRole("button", { name: "KI-Prüfung vorbereiten" })).toHaveCount(0);
});
