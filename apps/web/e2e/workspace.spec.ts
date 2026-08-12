import { expect, test, type Page } from "@playwright/test";
import { dismissConsent, loadDemo, openDestination } from "./helpers";

async function clearProject(page: Page) {
  await page.goto("/app#answer");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await dismissConsent(page);
}

test("workspace starts with five destinations and exactly three explicit entry paths", async ({ page }) => {
  await clearProject(page);

  const nav = page.getByRole("navigation", { name: "Analysebereiche" });
  await expect(nav.getByRole("button")).toHaveText([
    "Antwort",
    "Forschungsdesign",
    "Entscheidungen",
    "Evidenz",
    "Prüfpaket",
  ]);
  await expect(page.locator(".oq-entry-choice")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Synthetisches Beispiel öffnen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Eigene Daten importieren" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Gespeichertes Projekt laden" })).toBeDisabled();
  await expect(page.getByText(/Schritt \d|Weiter zu Schritt|Beispiel-Tour/)).toHaveCount(0);
});

test("entry explains the import contract and empty destinations name the real blocker", async ({ page }) => {
  await clearProject(page);
  await expect(page.getByText(/Erste Spalte: eindeutige Fall-ID/)).toBeVisible();
  await openDestination(page, "research");
  await expect(page.getByText(/Noch keine Daten geladen/)).toBeVisible();
  await openDestination(page, "defense");
  await expect(page.getByText(/Noch keine Daten geladen/)).toBeVisible();
});

test("import preflight preserves the active project until explicit commit", async ({ page }) => {
  await loadDemo(page);
  await page.getByLabel("Datei auswählen").setInputFiles({
    name: "own-data.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Case,A,Y\none,1,1\ntwo,0,0\n"),
  });
  await expect(page.getByRole("heading", { name: "Import vor dem Ersetzen prüfen" })).toBeVisible();
  await expect(page.getByText("own-data.csv")).toBeVisible();
  await expect(page.getByRole("button", { name: "Abbrechen" })).toBeVisible();
  await page.getByRole("button", { name: "Abbrechen" }).click();
  await expect(page.getByTestId("solution-formula-intermediate")).toContainText(/WOHLSTAND/);

  await page.getByLabel("Datei auswählen").setInputFiles({
    name: "own-data.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Case,A,Y\none,1,1\ntwo,0,0\n"),
  });
  await page.getByRole("button", { name: "Import übernehmen" }).click();
  await expect(page.getByText("Import übernommen")).toBeVisible();
  await expect(page.getByRole("button", { name: "Vorläufige Antwort öffnen" })).toBeVisible();
});

test("decision controls expose methodological explanations", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "decisions");
  await expect(page.getByRole("button", { name: "Frequenz-Cutoff (n)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Konsistenz-Cutoff" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Richtungserwartungen (nur einfache Counterfactuals)" })).toBeVisible();
});

test("AI review stays local until required fields are complete", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/ai/assist", async (route) => {
    requests += 1;
    await route.abort();
  });
  await loadDemo(page);
  await openDestination(page, "decisions");
  const rationale = page.getByRole("region", { name: "Begründung prüfen" }).first();
  await rationale.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
  await expect(rationale.getByRole("status")).toHaveText(
    "Füllen Sie alle erforderlichen Felder aus und begrenzen Sie jeden Eintrag auf 2.000 Zeichen, bevor Sie eine KI-Prüfung vorbereiten.",
  );
  await expect(rationale.getByText("Anfragevorschau", { exact: true })).toHaveCount(0);
  await expect(rationale.getByRole("button", { name: "An KI-Coach senden" })).toHaveCount(0);
  expect(requests).toBe(0);
});

test("all three AI jobs expose and send only their normalized reviewed payload", async ({ page }) => {
  const requests: Array<Record<string, unknown>> = [];
  await page.route("**/api/ai/assist", async (route) => {
    requests.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        version: "v1",
        summary: { status: "ok", draft: "Geprüfter Entwurf.", uncertainty: [], evidenceNeeds: [], limitations: [] },
        model: "test-model",
        provider: "mock",
      }),
    });
  });
  await loadDemo(page);

  await openDestination(page, "research");
  const brief = page.getByRole("region", { name: "Forschungsdesign klären" });
  await brief.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
  await expect(brief.getByText("Anfragevorschau", { exact: true })).toBeVisible();
  await expect(brief.locator("dt")).toHaveText([
    "Research question",
    "Case universe",
    "Time period",
    "Outcome concept",
    "Condition rationale",
  ]);
  await expect(brief.locator("dd")).toHaveText([
    "Welche Kombinationen der synthetischen Bedingungen sind mit dem Set „Überleben“ in demo_zwischenkriegszeit (synthetisch) verbunden?",
    "Synthetische Lehrfälle aus demo_zwischenkriegszeit (synthetisch)",
    "Kein realer Zeitraum, synthetisches Lehrbeispiel",
    "dem Set „Überleben“",
    "Die Bedingungen wurden ausschließlich zur Demonstration des QCA-Rechenwegs konstruiert.",
  ]);
  expect(requests).toHaveLength(0);
  await brief.getByRole("button", { name: "An KI-Coach senden" }).click();
  await expect(brief.getByText("Erstellt mit: mock · test-model")).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0]).toEqual({
    version: "v1",
    task: "brief_clarify",
    locale: "de",
    payload: {
      question: "Welche Kombinationen der synthetischen Bedingungen sind mit dem Set „Überleben“ in demo_zwischenkriegszeit (synthetisch) verbunden?",
      caseUniverse: "Synthetische Lehrfälle aus demo_zwischenkriegszeit (synthetisch)",
      timePeriod: "Kein realer Zeitraum, synthetisches Lehrbeispiel",
      outcomeConcept: "dem Set „Überleben“",
      conditionSelectionRationale: "Die Bedingungen wurden ausschließlich zur Demonstration des QCA-Rechenwegs konstruiert.",
    },
  });

  await openDestination(page, "decisions");
  const decisionText = "Die Entscheidung folgt der begrenzten Fallzahl und dem vorab festgelegten Vergleichsdesign.";
  await page.locator("textarea").first().fill(`  ${decisionText}  `);
  const rationale = page.getByRole("region", { name: "Begründung prüfen" }).first();
  await rationale.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
  await expect(rationale.locator("dt")).toHaveText(["Decision", "Rationale"]);
  await expect(rationale.locator("dd")).toHaveText(["frequencyCutoff", decisionText]);
  expect(requests).toHaveLength(1);
  await rationale.getByRole("button", { name: "An KI-Coach senden" }).click();
  await expect(rationale.getByText("Erstellt mit: mock · test-model")).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual({
    version: "v1",
    task: "decision_rationale_review",
    locale: "de",
    payload: { decision: "frequencyCutoff", rationale: decisionText },
  });

  await page.getByTestId("calibration-view-doc").click();
  const evidence = page.getByRole("region", { name: "Evidenzlücken prüfen" }).first();
  await evidence.scrollIntoViewIfNeeded();
  await evidence.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
  await expect(evidence.locator("dt")).toHaveText([
    "Variable",
    "Set label",
    "Set definition",
    "Researcher rationale",
  ]);
  await expect(evidence.locator("dd")).toHaveText([
    "wohlstand",
    "wohlstand",
    "Zugehörigkeit zur Menge «wohlstand» (vorläufiger Platzhalter — durch eine inhaltliche Definition ersetzen).",
    "Keine Begründung angegeben.",
  ]);
  expect((await evidence.locator("dt").allTextContents()).join(" ")).not.toMatch(/Fall|Case|Row|Datei|File/);
  expect(requests).toHaveLength(2);
  await evidence.getByRole("button", { name: "An KI-Coach senden" }).click();
  await expect(evidence.getByText("Erstellt mit: mock · test-model")).toBeVisible();
  expect(requests).toHaveLength(3);
  expect(requests[2]).toEqual({
    version: "v1",
    task: "calibration_evidence_gaps",
    locale: "de",
    payload: {
      variable: "wohlstand",
      setLabel: "wohlstand",
      definition: "Zugehörigkeit zur Menge «wohlstand» (vorläufiger Platzhalter — durch eine inhaltliche Definition ersetzen).",
      rationale: "Keine Begründung angegeben.",
    },
  });
});

test("destination buttons update hash, focus, and browser history", async ({ page }) => {
  await clearProject(page);
  await openDestination(page, "research");
  await expect(page).toHaveURL(/#research$/);
  await openDestination(page, "decisions");
  await expect(page).toHaveURL(/#decisions$/);

  await page.goBack();
  await expect(page).toHaveURL(/#research$/);
  await expect(page.getByRole("heading", { name: "Forschungsdesign", level: 1 })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/#decisions$/);

  await page.evaluate(() => { window.location.hash = "unknown-workspace"; });
  await expect(page.getByRole("heading", { name: "Aktuelle Antwort", level: 1 })).toBeVisible();
});

test("research and decision inputs survive destination changes", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "research");
  await page.getByTestId("brief-question").fill("Bleibt diese Frage beim Wechsel erhalten?");
  await openDestination(page, "decisions");
  await page.getByTestId("truth-table-frequency-cut").fill("2");
  await openDestination(page, "answer");
  await openDestination(page, "research");
  await expect(page.getByTestId("brief-question")).toHaveValue("Bleibt diese Frage beim Wechsel erhalten?");
  await openDestination(page, "decisions");
  await expect(page.getByTestId("truth-table-frequency-cut")).toHaveValue("2");
});

test("V1 project is offered as a resume candidate and loads only after click", async ({ page }) => {
  await page.goto("/app#answer");
  await page.evaluate(() => {
    window.localStorage.setItem("openqca_local_project", JSON.stringify({
      schema: "openqca-local-project",
      version: 1,
      savedAt: "2026-08-10T10:00:00.000Z",
      state: {
        dataset: {
          name: "legacy-project.csv",
          caseCol: "Case",
          columns: ["Case", "A", "Y"],
          rows: [
            { Case: "c1", A: 1, Y: 1 },
            { Case: "c2", A: 0, Y: 0 },
          ],
        },
        varMeta: {
          A: { type: "crisp", role: "condition" },
          Y: { type: "crisp", role: "outcome" },
        },
        freqCut: 1,
        consCut: 0.8,
      },
    }));
  });
  await page.reload();
  await dismissConsent(page);

  await expect(page.getByText(/legacy-project\.csv/)).toBeVisible();
  await expect(page.getByTestId("analysis-overview")).toHaveCount(0);
  await page.getByRole("button", { name: "Gespeichertes Projekt laden" }).click();
  await openDestination(page, "research");
  await expect(page.getByText(/legacy-project\.csv/)).toBeVisible();
  await expect(page.getByTestId("brief-question")).toHaveValue("");
  await expect.poll(() =>
    page.evaluate(() => JSON.parse(localStorage.getItem("openqca_local_project") ?? "{}").version),
  ).toBe(2);
});

test("demo deep link wins over resume and removes the query parameter", async ({ page }) => {
  await page.goto("/app?demo=1#defense");
  await dismissConsent(page);
  await expect(page).toHaveURL(/\/app#answer$/);
  await expect(page.getByTestId("solution-formula-intermediate")).toContainText(/WOHLSTAND/);
  await expect(page.getByText("Synthetisch", { exact: true })).toBeVisible();
});

test("answer decision action opens the affected calibration record", async ({ page }) => {
  await loadDemo(page);
  const strongest = page.getByText("Stärkste offene Entscheidung").locator("..");
  await strongest.getByRole("button", { name: "Entscheidung bearbeiten" }).click();
  await expect(page).toHaveURL(/#decisions$/);
  await expect(page.getByTestId("calibration-view-doc")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("calibration-substepper")).toBeVisible();
});

test("calibration subnavigation stays below workspace navigation", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "decisions");
  await page.getByTestId("calibration-view-doc").click();
  const subnav = page.getByTestId("calibration-substepper");
  await subnav.scrollIntoViewIfNeeded();
  await expect(subnav).toBeVisible();
  const positions = await page.evaluate(() => {
    const workspaceNav = document.querySelector<HTMLElement>(".oq-workspace-nav");
    const calibrationNav = document.querySelector<HTMLElement>(
      '[data-testid="calibration-substepper"]',
    );
    if (!workspaceNav || !calibrationNav) return null;
    const workspaceRect = workspaceNav.getBoundingClientRect();
    const calibrationRect = calibrationNav.getBoundingClientRect();
    return {
      horizontallySeparated:
        workspaceRect.right <= calibrationRect.left ||
        calibrationRect.right <= workspaceRect.left,
      workspaceBottom: workspaceRect.bottom,
      calibrationTop: calibrationRect.top,
    };
  });
  expect(positions).not.toBeNull();
  expect(
    positions!.horizontallySeparated ||
      positions!.calibrationTop >= positions!.workspaceBottom - 1,
  ).toBe(true);
});

test("answer distinguishes no-solution and equivalent-model states", async ({ page }) => {
  await clearProject(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "no-solution.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Fall,A,ERGEBNIS\nc1,0,0\nc2,1,0\n"),
  });
  await page.getByRole("button", { name: "Import übernehmen" }).click();
  await openDestination(page, "answer");
  await expect(page.getByText("Die Truth Table enthält unter den aktuellen Cutoffs keine positive Zeile.")).toBeVisible();

  await page.reload();
  await openDestination(page, "answer");
  const ambiguousRows = Array.from({ length: 16 }, (_, index) => {
    const bits = index.toString(2).padStart(4, "0").split("");
    return [`c${index}`, ...bits, String((61 >> index) & 1)].join(",");
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "ambiguous.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(["Fall,A,B,C,D,Y", ...ambiguousRows].join("\n")),
  });
  await page.getByRole("button", { name: "Import übernehmen" }).click();
  await openDestination(page, "answer");
  await expect(page.getByText(/gleichwertige intermediäre Modelle liegen vor/)).toBeVisible();
});
for (const viewport of [
  { name: "desktop", width: 1280, height: 900 },
  { name: "mobile", width: 390, height: 844 },
]) {

  test(`${viewport.name} destinations preserve document width`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await loadDemo(page);
    for (const destination of ["answer", "research", "decisions", "evidence", "defense"] as const) {
      await openDestination(page, destination);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, destination).toBeLessThanOrEqual(1);
    }
  });
}
