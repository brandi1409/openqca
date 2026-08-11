import { expect, test, type Page } from "@playwright/test";
import { dismissConsent, loadDemo, openDestination, type DestinationName } from "./helpers";

const SCHEMES = ["light", "dark"] as const;
const VIEWPORTS = [
  { label: "desktop", width: 1280, height: 900 },
  { label: "mobile", width: 390, height: 844 },
] as const;
const TOOL_ROUTES = ["/preise", "/download", "/konto"] as const;
const DESTINATIONS: DestinationName[] = ["answer", "research", "decisions", "evidence", "defense"];

async function buttonOffenders(page: Page) {
  return page.evaluate(() => {
    const exceptions = [
      "button[aria-label]",
      '[role="slider"]',
      '[role="group"] button',
      ".oq-example-card",
      '[role="dialog"][aria-labelledby="cookie-consent-title"] button',
    ];
    return Array.from(document.querySelectorAll("button"))
      .filter((button) => {
        if (button.classList.contains("oq-link-button")) {
          return button.getBoundingClientRect().height < 43.5;
        }
        return (
          !button.classList.contains("oq-btn") &&
          !exceptions.some((selector) => button.matches(selector))
        );
      })
      .map((button) => button.outerHTML.replace(/\s+/g, " ").slice(0, 140));
  });
}

async function typographyOffenders(page: Page) {
  return page.evaluate(() => {
    const sizes = [10.5, 11, 11.5, 12, 13, 13.5, 15, 15.5, 16, 16.5, 18, 20, 21, 24, 28];
    const weights = [400, 600, 650, 680, 700, 720];
    const near = (value: number) => sizes.some((size) => Math.abs(size - value) <= 0.1);
    const offenders: { tag: string; fontSize?: number; fontWeight?: number; text: string }[] = [];
    for (const element of Array.from(document.querySelectorAll("h1,h2,h3,button,p,th,td,span")).slice(0, 500)) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || element.closest("svg")) continue;
      const style = getComputedStyle(element);
      const fontSize = Number.parseFloat(style.fontSize);
      const fontWeight = Number.parseInt(style.fontWeight, 10);
      const text = (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30);
      if (!near(fontSize)) offenders.push({ tag: element.tagName, fontSize, text });
      else if (!weights.includes(fontWeight)) offenders.push({ tag: element.tagName, fontWeight, text });
    }
    return offenders;
  });
}

for (const colorScheme of SCHEMES) {
  for (const viewport of VIEWPORTS) {
    test.describe(`A4 ${colorScheme} @ ${viewport.label} (${viewport.width}×${viewport.height})`, () => {
      test.use({ colorScheme, viewport: { width: viewport.width, height: viewport.height } });

      test("A4.1 every workspace button uses the control vocabulary", async ({ page }) => {
        const offenders: { surface: string; html: string }[] = [];
        await loadDemo(page);
        for (const destination of DESTINATIONS) {
          await openDestination(page, destination);
          for (const html of await buttonOffenders(page)) offenders.push({ surface: destination, html });
        }
        for (const route of TOOL_ROUTES) {
          await page.goto(route);
          await dismissConsent(page);
          for (const html of await buttonOffenders(page)) offenders.push({ surface: route, html });
        }
        expect(offenders).toEqual([]);
      });

      test("A4.2 workspace typography stays on the fixed product scale", async ({ page }) => {
        const offenders: { surface: string; issue: unknown }[] = [];
        await loadDemo(page);
        for (const destination of DESTINATIONS) {
          await openDestination(page, destination);
          for (const issue of await typographyOffenders(page)) offenders.push({ surface: destination, issue });
        }
        for (const route of TOOL_ROUTES) {
          await page.goto(route);
          await dismissConsent(page);
          for (const issue of await typographyOffenders(page)) offenders.push({ surface: route, issue });
        }
        expect(offenders).toEqual([]);
      });
    });
  }
}
