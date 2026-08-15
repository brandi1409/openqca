import { test, expect } from "@playwright/test";
import { loadDemo, openDestination } from "./helpers";

/**
 * A2.8–A2.10 — Interaktionen: Grafik-Export (SVG/PNG), ⓘ-Popover im Viewport,
 * Anker-Anpassung per Tastatur.
 */

test("A2.8 Grafik-Export SVG — echter Download endet auf .svg", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "evidence");

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
  await openDestination(page, "evidence");

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
  await openDestination(page, "evidence");

  const infoBtn = page.locator("main button[aria-expanded][aria-label]").first();
  const title = await infoBtn.getAttribute("aria-label");
  expect(title).toBeTruthy();
  await infoBtn.evaluate((element) => {
    element.scrollIntoView({ block: "center" });
    (element as HTMLButtonElement).click();
  });

  // Der konkrete aria-label verbindet Trigger und Dialog; ein globales
  // button[aria-label] würde inzwischen auch andere Workspace-Aktionen treffen.
  const dialog = page.getByRole("dialog", { name: title! });
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
  await openDestination(page, "decisions");

  // Kurve und Griffe gibt es seit dem Flow-Umbau an ZWEI Orten (Schnell-Karte
  // und Werkbank). Geprüft wird der Startzustand: die Schnell-Ansicht. Ohne
  // diese Eingrenzung würde `input[type="number"]` irgendwann auch die
  // Schwellen-Felder der Truth Table treffen.
  const quick = page.getByTestId("calibration-quick");
  // Erstes Anker-Zahlenfeld (= „voll draußen" der ersten Roh-Variable).
  const firstNumber = quick.locator('[data-testid^="calibration-quick-anchor-"]').first();
  await expect(firstNumber).toBeVisible();
  const before = Number(await firstNumber.inputValue());

  // Erster Kurven-Griff (role=slider) = derselbe Anker.
  const slider = quick.getByRole("slider").first();
  await slider.focus();
  await page.keyboard.press("ArrowRight");

  await expect
    .poll(async () => Number(await firstNumber.inputValue()))
    .toBe(before + 1);
});
