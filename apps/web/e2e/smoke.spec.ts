import { test, expect } from "@playwright/test";
import { ROUTES, dismissConsent } from "./helpers";

/**
 * A2.1 — Smoke: Jede Route liefert 200, zeigt kein Fehler-Overlay und erzeugt
 * NULL Konsolen-Fehler und NULL Pageerrors.
 */
for (const route of ROUTES) {
  test(`A2.1 Smoke ${route} — 200, keine Konsolen-Fehler/Pageerrors`, async ({ page }) => {
    // ECHTER APP-BUG (nicht Selektor): Auf „/" rendert src/components/Landing.tsx
    // (Z. 227) das Hero-SVG mit `height="auto"` als SVG-ATTRIBUT:
    //   <svg viewBox="0 0 440 340" width="100%" height="auto" style={{ display: "block" }}>
    // Das SVG-`height`-Attribut akzeptiert nur eine <length>; „auto" ist ungültig
    // → Chromium loggt „<svg> attribute height: Expected length, \"auto\".".
    // Fix (App-Team, NICHT hier): height in CSS verlegen, wie XyPlot.tsx:365 /
    // RobustnessPanel.tsx:369 es tun → style={{ display: "block", height: "auto" }}.
    // Solange offen, ist die Konsole auf „/" nicht leer — als erwarteter Fehlschlag markiert.

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response, `keine Response für ${route}`).not.toBeNull();
    expect(response!.status(), `Status für ${route}`).toBeLessThan(400);

    // Kein Next.js-Fehler-Overlay (Portal mit nextjs-portal / __next-error).
    await expect(page.locator("nextjs-portal")).toHaveCount(0);

    // Consent-Banner ggf. wegklicken (kann sonst nachträglich Events auslösen).
    await dismissConsent(page);

    expect(pageErrors, `Pageerrors auf ${route}: ${pageErrors.join(" | ")}`).toEqual([]);
    expect(
      consoleErrors,
      `Konsolen-Fehler auf ${route}: ${consoleErrors.join(" | ")}`,
    ).toEqual([]);
  });
}
