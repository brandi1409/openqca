import { expect, test } from "@playwright/test";
import { aiAssistAvailable } from "../src/lib/ai-provider";
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

test("AI capability fails closed when required cloud auth is not configured", () => {
  const previous = {
    AI_ENABLED: process.env.AI_ENABLED,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_REQUIRE_CLOUD_TIER: process.env.AI_REQUIRE_CLOUD_TIER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  process.env.AI_ENABLED = "true";
  process.env.AI_PROVIDER = "openai";
  process.env.AI_REQUIRE_CLOUD_TIER = "true";
  process.env.OPENAI_API_KEY = "test-openai-key";
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    expect(aiAssistAvailable()).toBe(false);
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
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
