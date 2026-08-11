import { existsSync } from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

/**
 * Gemeinsame Test-Helfer für die openQCA-E2E-Suite.
 * Kein Spec-File (keine `test()`-Blöcke) — nur wiederverwendbare Bausteine.
 */

/** Alle Routen der App laut QUALITY-SPEC A2.1. */
export const ROUTES = [
  "/",
  "/app",
  "/methodik",
  "/preise",
  "/download",
  "/konto",
  "/rechtliches/impressum",
  "/rechtliches/datenschutz",
  "/rechtliches/agb",
] as const;

/**
 * Consent-Banner (role=dialog, CookieConsent.tsx) datenschutzfreundlich
 * wegklicken: Button „Nur notwendige". Ist das Banner nicht sichtbar (z. B.
 * Wahl bereits getroffen), passiert nichts.
 */
export async function dismissConsent(page: Page): Promise<void> {
  const btn = page.getByRole("button", { name: "Nur notwendige" });
  try {
    // Kurzer Timeout: ist die Wahl bereits (im selben Context) getroffen,
    // erscheint das Banner nicht mehr — dann nicht unnötig blockieren.
    await btn.waitFor({ state: "visible", timeout: 1500 });
    await btn.click();
    await btn.waitFor({ state: "hidden", timeout: 2000 });
  } catch {
    // Banner nicht (mehr) sichtbar — nichts zu tun.
  }
}

/**
 * Die komplexe/intermediäre Lösung des Demo-Datensatzes im Startzustand
 * (alle numerischen Nicht-Outcome-Spalten sind Bedingungen, freqCut 1,
 * consCut 0,8, Erwartungen „present"). Steht hier einmal, weil mehrere Tests
 * darauf warten.
 *
 * Vorher lautete der Wert `WOHLSTAND*URBAN*BILDUNG` — das war das Ergebnis der
 * stillen Rollen-Heuristik, die nur die ersten DREI Bedingungen zuließ und
 * `stabil` lautlos verwarf. Seit die Heuristik entfernt ist, rechnet die App mit
 * vier Bedingungen; der Wert stammt aus einem echten Lauf gegen den
 * Produktions-Build (siehe A2.20, das ihn zusätzlich gegen die Landing prüft).
 */
export const DEMO_SOLUTION = /WOHLSTAND\*BILDUNG\*STABIL/;

/**
 * Demo-Datensatz auf /app laden und auf die vollständig berechnete Analyse
 * warten (komplexe Lösung enthält WOHLSTAND*BILDUNG*STABIL, vgl. A2.2). Danach
 * sind Kalibrierkurve, Truth Table, Lösungen und XY-Plot im DOM.
 */
export async function loadDemo(page: Page): Promise<void> {
  await page.goto("/app#answer");
  await page.reload();
  await dismissConsent(page);
  await page.getByRole("button", { name: "Synthetisches Beispiel öffnen" }).click();
  await expect(page.getByTestId("solution-formula-intermediate")).toContainText(DEMO_SOLUTION, {
    timeout: 15_000,
  });
}

/**
 * Eines der eingebetteten Beispiele über seine Karte laden. `cardName` matcht
 * den Kartentitel (z. B. /Fuzzy-Sets Beispiel/). Wartet, bis der Datensatz die
 * Deskriptivstatistik gerendert hat.
 */
export async function loadExample(page: Page, cardName: RegExp): Promise<void> {
  await loadDemo(page);
  await openDestination(page, "research");
  await page.getByText("Synthetische Lehrdatensätze", { exact: true }).click();
  await page.getByRole("button", { name: cardName }).click();
  await expect(page.getByTestId("research-brief-editor")).toBeVisible({ timeout: 15_000 });
}

/** Load the repository's real raw-data fixture through the browser file input. */
export async function loadRawRohwerte(page: Page): Promise<void> {
  await page.goto("/app#answer");
  await page.reload();
  await dismissConsent(page);
  const candidateRoots = [
    process.env.INIT_CWD,
    process.cwd(),
    path.resolve(process.cwd(), "../.."),
  ].filter((root): root is string => !!root);
  const fixturePath = candidateRoots
    .map((root) => path.resolve(root, "datasets/rohwerte-demokratie.csv"))
    .find((candidate) => existsSync(candidate));
  if (!fixturePath) throw new Error("Raw fixture datasets/rohwerte-demokratie.csv not found");
  await page.locator('input[type="file"]').setInputFiles(fixturePath);
  await page.getByRole("button", { name: "Import übernehmen" }).click();
  await expect(page.getByTestId("research-brief-editor")).toBeVisible({ timeout: 15_000 });
}

/**
 * Der Kalibrier-Schritt startet in der Schnell-Ansicht (Anker + Kurve). Alle
 * Tiefenprüfungen der Werkbank (Set-Definition, Evidenz-Gate, Methodenwechsel,
 * Persistenz) leben unverändert in der zweiten Ansicht „Dokumentation" — erst
 * umschalten, dann prüfen. Die Wahl merkt sich die Sitzung
 * (`sessionStorage: openqca_calibration_view`), nach einem Reload steht sie
 * daher meist schon richtig; der Helfer ist deshalb idempotent.
 */
export async function openDocumentationView(page: Page): Promise<void> {
  await openDestination(page, "decisions");
  const docTab = page.getByTestId("calibration-view-doc");
  await docTab.waitFor({ state: "visible", timeout: 15_000 });
  if ((await docTab.getAttribute("aria-pressed")) !== "true") await docTab.click();
  await expect(docTab).toHaveAttribute("aria-pressed", "true");
  // Die Werkbank ist erst montiert, wenn ihr Kontextband gerendert ist.
  await expect(page.getByTestId("calibration-active-context")).toBeVisible();
}

/**
 * Die vier Replikationsartefakte des Protokoll-Abschnitts. Sie sind das
 * Publikations-Gate: freigeschaltet erst, wenn JEDES Set vollständig
 * dokumentiert ist (`calibrationResearchReady`). Das Rechnen selbst ist nie
 * gesperrt — deshalb prüfen die Gate-Zusagen genau diese Buttons.
 */
export const PROTOCOL_EXPORT_LABELS = [
  /Protokoll als JSON herunterladen/,
  /Rohdaten als CSV herunterladen/,
  /Methoden-Protokoll \(Markdown\)/,
  /R-Skript kopieren/,
] as const;

/** Alle vier Export-Buttons sind gesperrt und die Begründung steht daneben. */
export async function expectExportGateClosed(page: Page): Promise<void> {
  await openDestination(page, "defense");
  const protocol = page.getByTestId("defense-artifacts");
  await expect(protocol).toBeVisible({ timeout: 15_000 });
  for (const label of PROTOCOL_EXPORT_LABELS) {
    await expect(protocol.getByRole("button", { name: label }), String(label)).toBeDisabled();
  }
  await expect(page.getByTestId("defense-r-preview")).toHaveCount(0);
}

/** All four replication artifacts are enabled once the shared defense gate passes. */
export async function expectExportGateOpen(page: Page): Promise<void> {
  await openDestination(page, "defense");
  const protocol = page.getByTestId("defense-artifacts");
  const checklist = await page.locator(".oq-defense-checklist").first().innerText();
  await expect(protocol).toBeVisible({ timeout: 15_000 });
  for (const label of PROTOCOL_EXPORT_LABELS) {
    await expect(
      protocol.getByRole("button", { name: label }),
      `${String(label)}\n${checklist}`,
    ).toBeEnabled();
  }
  await expect(page.getByTestId("defense-r-preview")).toBeVisible();
}

export type DestinationName = "answer" | "research" | "decisions" | "evidence" | "defense";

const DESTINATION_LABELS: Record<DestinationName, string> = {
  answer: "Antwort",
  research: "Forschungsdesign",
  decisions: "Entscheidungen",
  evidence: "Evidenz",
  defense: "Prüfpaket",
};

/** Open one controlled workspace destination and wait for its focused heading. */
export async function openDestination(page: Page, name: DestinationName): Promise<void> {
  await page.getByRole("navigation", { name: "Analysebereiche" })
    .getByRole("button", { name: DESTINATION_LABELS[name], exact: true })
    .click();
  const heading = page.getByRole("heading", { name: DESTINATION_LABELS[name], level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
}

/** Complete the research brief and the three value-bound analysis decisions. */
export async function completeResearchAndAnalysisDecisions(page: Page): Promise<void> {
  await openDestination(page, "research");
  await page.getByTestId("brief-question").fill("Welche Konfigurationen erklären das Outcome?");
  await page.getByTestId("brief-caseUniverse").fill("Alle importierten Vergleichsfälle");
  await page.getByTestId("brief-timePeriod").fill("2020 bis 2025");
  await page.getByTestId("brief-outcomeConcept").fill("Mitgliedschaft im untersuchten Outcome");
  await page.getByTestId("brief-conditionSelectionRationale").fill("Theoriegeleitete Auswahl der Bedingungen");
  await page.getByRole("button", { name: "Forschungsdesign bestätigen" }).click();

  await openDestination(page, "decisions");
  for (const testId of [
    "decision-frequency-cutoff",
    "decision-consistency-cutoff",
    "decision-directional-expectations",
  ]) {
    const block = page.getByTestId(testId);
    await block.locator("textarea").fill(`Begründung für ${testId}`);
    await block.getByRole("button", { name: "Aktuellen Wert bestätigen" }).click();
  }
}

/**
 * A3.1-Kernprüfung: In JEDEM `<svg>` dürfen sich keine Text-Labels überlappen.
 * Gesammelt werden `<text>`-Elemente mit sichtbarem Inhalt (Länge > 2) und
 * nicht rein numerisch (Achsen-Ticks/Ankerwerte ausgenommen). Verglichen wird
 * paarweise innerhalb desselben SVG über die Bounding-Rects.
 */
export async function expectNoSvgLabelOverlaps(page: Page): Promise<void> {
  const collisions = await page.evaluate(() => {
    // „rein numerisch" = nur Ziffern, Separatoren, Vorzeichen, Prozent.
    const numericOnly = (s: string) => /^[\s\d.,\-−%]+$/.test(s);
    const overlaps = (a: DOMRect, b: DOMRect) =>
      a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

    const found: { svg: number; a: string; b: string }[] = [];
    const svgs = Array.from(document.querySelectorAll("svg"));
    svgs.forEach((svg, si) => {
      const texts = Array.from(svg.querySelectorAll("text")).filter((el) => {
        const c = (el.textContent ?? "").trim();
        return c.length > 2 && !numericOnly(c);
      });
      const rects = texts.map((el) => el.getBoundingClientRect());
      for (let i = 0; i < texts.length; i++) {
        for (let j = i + 1; j < texts.length; j++) {
          const a = rects[i];
          const b = rects[j];
          if (a.width === 0 || a.height === 0 || b.width === 0 || b.height === 0) continue;
          if (overlaps(a, b)) {
            found.push({
              svg: si,
              a: (texts[i].textContent ?? "").trim(),
              b: (texts[j].textContent ?? "").trim(),
            });
          }
        }
      }
    });
    return found;
  });

  expect(
    collisions,
    `Überlappende SVG-Labels gefunden: ${JSON.stringify(collisions)}`,
  ).toEqual([]);
}
