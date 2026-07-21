import { test, expect } from "@playwright/test";
import { loadDemo } from "./helpers";

/**
 * A2.8–A2.10 — Interaktionen: Grafik-Export (SVG/PNG), ⓘ-Popover im Viewport,
 * Anker-Anpassung per Tastatur.
 */

test("A2.8 Grafik-Export SVG — echter Download endet auf .svg", async ({ page }) => {
  await loadDemo(page);

  const svgBtn = page.getByRole("button", { name: /Grafik exportieren als SVG/ }).first();
  await svgBtn.scrollIntoViewIfNeeded();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    svgBtn.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.svg$/);
});

test("A2.8 Grafik-Export PNG — echter Download endet auf .png", async ({ page }) => {
  await loadDemo(page);

  const pngBtn = page.getByRole("button", { name: /Grafik exportieren als PNG/ }).first();
  await pngBtn.scrollIntoViewIfNeeded();

  // PNG läuft über Image→Canvas→toBlob (asynchron) — großzügig warten.
  const downloadPromise = page.waitForEvent("download", { timeout: 20_000 });
  await pngBtn.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});

test("A2.9 ⓘ-Popover — vollständig im Viewport, Escape schließt", async ({ page }) => {
  await loadDemo(page);

  // ⓘ in der kürzesten Tabelle: den Spaltenkopf-InfoHints der Lösungs-Pfad-Tabelle.
  const infoBtn = page.locator("#loesungen table th button[aria-label]").first();
  // Button zentrieren, damit unter ihm genug Platz für das Popover bleibt.
  await infoBtn.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await infoBtn.click();

  // InfoHint-Popover eindeutig über den „Mehr in der Methodik"-Link identifizieren.
  const dialog = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("link", { name: /Mehr in der Methodik/ }) });
  await expect(dialog).toBeVisible();

  const box = await dialog.boundingBox();
  const vp = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(vp.height + 1);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("A2.10 Anker per Tastatur — ArrowRight erhöht das Zahlenfeld synchron", async ({ page }) => {
  await loadDemo(page);

  // Erstes Anker-Zahlenfeld (= „voll draußen" der ersten Roh-Variable).
  const firstNumber = page.locator('input[type="number"]').first();
  await expect(firstNumber).toBeVisible();
  const before = Number(await firstNumber.inputValue());

  // Erster Kurven-Griff (role=slider) = derselbe Anker.
  const slider = page.getByRole("slider").first();
  await slider.focus();
  await page.keyboard.press("ArrowRight");

  await expect
    .poll(async () => Number(await firstNumber.inputValue()))
    .toBe(before + 1);
});
