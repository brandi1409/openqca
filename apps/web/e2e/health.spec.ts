import { expect, test } from "@playwright/test";

test("health endpoint exposes only a no-store liveness status", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  await expect(response.json()).resolves.toEqual({ status: "ok" });
  expect(response.headers()["cache-control"]).toBe("no-store");
});
