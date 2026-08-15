import { expect, test, type Page } from "@playwright/test";
import * as XLSX from "xlsx";
import { dismissConsent, loadDemo, loadRawRohwerte, openDestination } from "./helpers";
import { inspectImport } from "../src/lib/import-preflight";

async function clearProject(page: Page) {
  await page.goto("/app#answer");
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await dismissConsent(page);
}

async function enableAiCoach(page: Page) {
  await page.route("**/api/ai/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ version: "v2", available: true }),
    });
  });
}

test("import preflight matches analysis numeric eligibility", () => {
  const mixed = inspectImport({
    name: "mixed.csv",
    caseCol: "Case",
    columns: ["Case", "A", "Y"],
    anchors: {},
    rows: [
      { Case: "c1", A: 1, Y: 1 },
      { Case: "c2", A: "oops", Y: 0 },
    ],
  }, "mixed.csv");
  expect(mixed.numericColumns).toEqual(["Y"]);
  expect(mixed.detectedTypes.A).toBe("text");
  expect(mixed.blockingIssues).toContain("At least two numeric analysis columns are required.");

  const numericText = inspectImport({
    name: "numeric-text.xlsx",
    caseCol: "Case",
    anchors: {},
    columns: ["Case", "A", "Y"],
    rows: [
      { Case: "c1", A: "1", Y: "1" },
      { Case: "c2", A: "0", Y: "0" },
    ],
  }, "numeric-text.xlsx");
  expect(numericText.numericColumns).toEqual(["A", "Y"]);
  expect(numericText.detectedTypes).toMatchObject({ A: "crisp", Y: "crisp" });
  expect(numericText.blockingIssues).toEqual([]);
});

test("import preflight rejects blank and duplicate case identifiers", () => {
  const blankCases = inspectImport({
    name: "blank-cases.csv",
    caseCol: "Case",
    columns: ["Case", "A", "Y"],
    anchors: {},
    rows: [
      { Case: "one", A: 1, Y: 1 },
      { Case: " ", A: 0, Y: 0 },
    ],
  }, "blank-cases.csv");
  expect(blankCases.blockingIssues).toContain("Case identifiers must not be blank.");

  const duplicateCases = inspectImport({
    name: "duplicate-cases.csv",
    caseCol: "Case",
    columns: ["Case", "A", "Y"],
    anchors: {},
    rows: [
      { Case: "one", A: 1, Y: 1 },
      { Case: " one ", A: 0, Y: 0 },
    ],
  }, "duplicate-cases.csv");
  expect(duplicateCases.blockingIssues).toContain("Case identifiers must be unique.");
});

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

test("import preflight blocks a dataset without both a condition and outcome", async ({ page }) => {
  await loadDemo(page);
  await page.getByLabel("Datei auswählen").setInputFiles({
    name: "outcome-only.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Case,Y\none,1\ntwo,0\n"),
  });
  await expect(page.getByText(
    "Mindestens zwei numerische Analysespalten sind erforderlich: eine Bedingung und ein Outcome.",
  )).toBeVisible();
  await expect(page.getByRole("button", { name: "Import übernehmen" })).toBeDisabled();
  await page.getByRole("button", { name: "Abbrechen" }).click();
  await expect(page.getByTestId("solution-formula-intermediate")).toContainText(/WOHLSTAND/);
});

test("import commit stays disabled for blank or duplicate case identifiers", async ({ page }) => {
  await clearProject(page);
  await page.getByLabel("Datei auswählen").setInputFiles({
    name: "blank-case.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Case,A,Y\none,1,1\n,0,0\n"),
  });
  await expect(page.getByText("Fall-IDs dürfen nicht leer sein.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import übernehmen" })).toBeDisabled();
  await page.getByRole("button", { name: "Abbrechen" }).click();

  await page.getByLabel("Datei auswählen").setInputFiles({
    name: "duplicate-case.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Case,A,Y\none,1,1\none,0,0\n"),
  });
  await expect(page.getByText("Fall-IDs müssen eindeutig sein.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Import übernehmen" })).toBeDisabled();
});

test("XLSX import reaches a provisional answer after explicit commit", async ({ page }) => {
  await clearProject(page);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Case", "A", "Y"],
      ["one", 1, 1],
      ["two", 0, 0],
      ["three", 1, 1],
    ]),
    "Cases",
  );
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  await page.getByLabel("Datei auswählen").setInputFiles({
    name: "own-data.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  });
  await expect(page.getByText("own-data.xlsx")).toBeVisible();
  await page.getByRole("button", { name: "Import übernehmen" }).click();
  await expect(page.getByText("Import übernommen")).toBeVisible();
  await openDestination(page, "answer");
  await expect(page.getByText("Vorläufig", { exact: true })).toBeVisible();
  await expect(page.getByTestId("solution-formula-intermediate")).toBeVisible();
});

test("decision controls expose methodological explanations", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "decisions");
  await expect(page.getByRole("button", { name: "Frequenz-Cutoff (n)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Konsistenz-Cutoff" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Richtungserwartungen (nur einfache Counterfactuals)" })).toBeVisible();
});

test("AI review stays local until required fields are complete", async ({ page }) => {
  await enableAiCoach(page);
  let requests = 0;
  await page.route("**/api/ai/assist", async (route) => {
    requests += 1;
    await route.abort();
  });
  await loadDemo(page);
  await openDestination(page, "decisions");
  await expect(page.getByRole("region", { name: "Begründung prüfen" })).toHaveCount(0);
  await page.getByRole("button", { name: "KI-Coach für diese Entscheidung" }).first().click();
  const rationale = page.getByRole("region", { name: "Begründung prüfen" });
  await rationale.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
  await expect(rationale.getByRole("status")).toHaveText(
    "Füllen Sie alle erforderlichen Felder aus und begrenzen Sie jeden Eintrag auf 2.000 Zeichen, bevor Sie eine KI-Prüfung vorbereiten.",
  );
  await expect(rationale.getByText("Anfragevorschau", { exact: true })).toHaveCount(0);
  await expect(rationale.getByRole("button", { name: "An KI-Coach senden" })).toHaveCount(0);
  expect(requests).toBe(0);
});

test("all three AI jobs expose only reviewed payloads and adopt into their exact fields", async ({ page }) => {
  await enableAiCoach(page);
  const requests: Array<Record<string, unknown>> = [];
  await page.route("**/api/ai/assist", async (route) => {
    const sent = route.request().postDataJSON() as Record<string, unknown>;
    const payload = sent.payload as Record<string, string>;
    requests.push(sent);
    const task = String(sent.task);
    const suggested =
      task === "brief_clarify"
        ? { question: "Welche Konfigurationen begleiten synthetisches Überleben?" }
        : task === "calibration_evidence_gaps"
          ? {
              variable: payload.variable,
              definition: "Das Set beschreibt hohe synthetische Anpassungsfähigkeit.",
            }
          : {
              decision: payload.decision,
              rationale: "Die Entscheidung folgt dem vorab festgelegten Vergleichsdesign.",
            };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        version: "v2",
        review: {
          task,
          status: "ok",
          review: "Der Text ist klar abgegrenzt und fachlich prüfbar.",
          suggested,
          uncertainty: [],
          evidenceNeeds: [],
          limitations: [],
        },
        model: "test-model",
        provider: "mock",
        generatedAt: "2026-08-11T10:00:00.000Z",
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
  expect(requests).toHaveLength(0);
  await brief.getByRole("button", { name: "An KI-Coach senden" }).click();
  await expect(brief.getByText("Erstellt mit: mock · test-model")).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0]).toEqual({
    version: "v2",
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
  await brief.getByRole("button", { name: "Vorgeschlagene Frage verwenden" }).click();
  await expect(page.getByLabel("Forschungsfrage")).toHaveValue(
    "Welche Konfigurationen begleiten synthetisches Überleben?",
  );
  await expect(brief.getByRole("status")).toContainText(
    "Der Vorschlag wurde übernommen.",
  );
  await expect(page.getByLabel("Forschungsfrage")).toBeFocused();

  await openDestination(page, "decisions");
  const decisionText =
    "Die Entscheidung folgt der begrenzten Fallzahl und dem vorab festgelegten Vergleichsdesign.";
  await page.locator("textarea").first().fill(`  ${decisionText}  `);
  await expect(page.getByRole("region", { name: "Begründung prüfen" })).toHaveCount(0);
  await page.getByRole("button", { name: "KI-Coach für diese Entscheidung" }).first().click();
  const rationale = page.getByRole("region", { name: "Begründung prüfen" });
  await rationale.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
  await expect(rationale.locator("dt")).toHaveText(["Decision", "Rationale"]);
  await expect(rationale.locator("dd")).toHaveText(["frequencyCutoff", decisionText]);
  expect(requests).toHaveLength(1);
  await rationale.getByRole("button", { name: "An KI-Coach senden" }).click();
  await expect(rationale.getByText("Erstellt mit: mock · test-model")).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual({
    version: "v2",
    task: "decision_rationale_review",
    locale: "de",
    payload: { decision: "frequencyCutoff", rationale: decisionText },
  });
  await rationale.getByRole("button", { name: "Vorgeschlagene Begründung verwenden" }).click();
  await expect(page.locator("textarea").first()).toHaveValue(
    "Die Entscheidung folgt dem vorab festgelegten Vergleichsdesign.",
  );
  await expect(page.locator("#decision-rationale-frequencyCutoff")).toBeFocused();

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
  expect((await evidence.locator("dt").allTextContents()).join(" ")).not.toMatch(
    /Fall|Case|Row|Datei|File/,
  );
  expect(requests).toHaveLength(2);
  await evidence.getByRole("button", { name: "An KI-Coach senden" }).click();
  await expect(evidence.getByText("Erstellt mit: mock · test-model")).toBeVisible();
  expect(requests).toHaveLength(3);
  expect(requests[2]).toEqual({
    version: "v2",
    task: "calibration_evidence_gaps",
    locale: "de",
    payload: {
      variable: "wohlstand",
      setLabel: "wohlstand",
      definition: "Zugehörigkeit zur Menge «wohlstand» (vorläufiger Platzhalter — durch eine inhaltliche Definition ersetzen).",
      rationale: "Keine Begründung angegeben.",
    },
  });
  await page.getByTestId("calibration-substep-toggle-definition").click();
  await expect(page.locator("#calibration-set-definition-wohlstand")).toHaveCount(0);
  await evidence.getByRole("button", { name: "Vorgeschlagene Definition verwenden" }).click();
  await expect(evidence.getByRole("status")).toContainText(
    "Der Vorschlag wurde übernommen.",
  );
  await expect(page.locator("#calibration-set-definition-wohlstand")).toBeFocused();
});

test("quick calibration AI adoption opens the changed definition", async ({ page }) => {
  await enableAiCoach(page);
  await page.route("**/api/ai/assist", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        version: "v2",
        review: {
          task: "calibration_evidence_gaps",
          status: "ok",
          review: "Die Definition ist fachlich nachvollziehbar.",
          suggested: {
            variable: "wohlstand",
            definition: "Das Set beschreibt hohe synthetische Anpassungsfähigkeit.",
          },
          uncertainty: [],
          evidenceNeeds: [],
          limitations: [],
        },
        model: "test-model",
        provider: "mock",
        generatedAt: "2026-08-11T10:00:00.000Z",
      }),
    });
  });
  await loadDemo(page);
  await openDestination(page, "decisions");

  const evidence = page.getByRole("region", { name: "Evidenzlücken prüfen" });
  await evidence.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
  await evidence.getByRole("button", { name: "An KI-Coach senden" }).click();
  await evidence.getByRole("button", { name: "Vorgeschlagene Definition verwenden" }).click();

  await expect(page.getByTestId("calibration-view-doc")).toHaveAttribute("aria-pressed", "true");
  const definition = page.locator("#calibration-set-definition-wohlstand");
  await expect(definition).toHaveValue("Das Set beschreibt hohe synthetische Anpassungsfähigkeit.");
  await expect(definition).toBeFocused();
});

test("journey evidence stage follows full calibration readiness", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "decisions");
  await page.getByTestId("calibration-view-doc").click();

  const variables = page.locator('[data-testid^="calibration-variable-"]');
  for (let index = 0; index < await variables.count(); index += 1) {
    await variables.nth(index).click();
    const caseReview = page.getByTestId("calibration-case-review");
    if (!(await caseReview.isChecked())) await caseReview.check();
  }

  const reviewStage = page
    .getByTestId("decision-journey")
    .locator("li")
    .filter({ hasText: "Fallprüfung & Evidenz" });
  await expect(reviewStage).toHaveAttribute("data-state", "current");
  await expect(reviewStage).toContainText("0 von 5 Sets belegt und fallgeprüft");
  await expect(
    page.getByText(
      "Alle Stationen sind abgeschlossen — Evidenz und Prüfpaket rechnen mit diesen Entscheidungen.",
    ),
  ).toHaveCount(0);
});

test("calibration sidecar does not claim completion without active sets", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "research");
  for (const column of ["wohlstand", "urban", "bildung", "stabil", "demo_ueberleben"]) {
    await page.getByLabel(`${column}: Rolle`).selectOption("ignore");
  }
  await openDestination(page, "decisions");

  await expect(
    page.getByText("Wählen Sie mindestens ein aktives Bedingungs- oder Outcome-Set."),
  ).toBeVisible();
  await expect(page.getByText("Alle Sets sind bestätigt und belegt.")).toHaveCount(0);
});

test("AI preview blocks current case identifiers before any network request", async ({ page }) => {
  await enableAiCoach(page);
  let requests = 0;
  await page.route("**/api/ai/assist", async (route) => {
    requests += 1;
    await route.abort();
  });
  await loadDemo(page);
  await openDestination(page, "research");
  await page.getByLabel("Forschungsfrage").fill(
    "Welche Bedingungen unterscheiden Belgien von den übrigen Lehrfällen?",
  );
  const brief = page.getByRole("region", { name: "Forschungsdesign klären" });
  await brief.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
  await expect(brief.getByRole("status")).toContainText(
    "Entfernen Sie Datensatzzeilen, Kontaktdaten und Fallkennungen",
  );
  await expect(brief.getByRole("button", { name: "An KI-Coach senden" })).toHaveCount(0);
  await expect(brief.getByText("Anfragevorschau")).toHaveCount(0);
  expect(requests).toBe(0);
});

test("stale AI responses cannot overwrite a field edited while the request is in flight", async ({ page }) => {
  await enableAiCoach(page);
  let releaseResponse: (() => void) | undefined;
  let markRequestSeen: (() => void) | undefined;
  const requestSeen = new Promise<void>((resolve) => {
    markRequestSeen = resolve;
  });
  const responseReleased = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route("**/api/ai/assist", async (route) => {
    markRequestSeen?.();
    await responseReleased;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        version: "v2",
        review: {
          task: "brief_clarify",
          status: "ok",
          review: "Die Frage ist klar abgegrenzt.",
          suggested: { question: "Veralteter Vorschlag" },
          uncertainty: [],
          evidenceNeeds: [],
          limitations: [],
        },
        model: "test-model",
        provider: "mock",
        generatedAt: "2026-08-11T10:00:00.000Z",
      }),
    });
  });
  await loadDemo(page);
  await openDestination(page, "research");
  const brief = page.getByRole("region", { name: "Forschungsdesign klären" });
  await brief.getByRole("button", { name: "KI-Prüfung vorbereiten" }).click();
  await brief.getByRole("button", { name: "An KI-Coach senden" }).click();
  await requestSeen;

  const question = page.getByLabel("Forschungsfrage");
  await question.fill("Aktuell bearbeitete Forschungsfrage");
  releaseResponse?.();

  await expect(brief.getByRole("status")).toContainText(
    "Die geprüfte Ausgangslage wurde geändert.",
  );
  await expect(question).toBeFocused();
  await expect(question).toHaveValue("Aktuell bearbeitete Forschungsfrage");
  await expect(
    brief.getByRole("button", { name: "Vorgeschlagene Frage verwenden" }),
  ).toHaveCount(0);
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

test("V2 restore preserves saved analysis decisions after provenance verification", async ({ page }) => {
  await page.goto("/app#answer");
  await page.evaluate(() => {
    window.localStorage.setItem("openqca_local_project", JSON.stringify({
      schema: "openqca-local-project",
      version: 2,
      savedAt: "2026-08-11T10:00:00.000Z",
      state: {
        dataset: {
          name: "saved-decisions.csv",
          caseCol: "Case",
          columns: ["Case", "A", "Y"],
          rows: [
            { Case: "c1", A: 1, Y: 1 },
            { Case: "c2", A: 0, Y: 0 },
          ],
        },
        anchors: {},
        varMeta: {
          A: { type: "crisp", role: "condition" },
          Y: { type: "crisp", role: "outcome" },
        },
        calibSpecs: {},
        demoMode: false,
        freqCut: 1,
        consCut: 0.8,
        expectations: { A: "present" },
        researchBrief: {
          question: "Which configurations explain Y?",
          caseUniverse: "Two saved cases",
          timePeriod: "2020",
          outcomeConcept: "Membership in Y",
          conditionSelectionRationale: "A follows the comparison design.",
          confirmed: true,
        },
        analysisDecisions: {
          frequencyCutoff: { rationale: "Saved frequency rationale", confirmed: true },
          consistencyCutoff: { rationale: "Saved consistency rationale", confirmed: true },
          directionalExpectations: {
            rationale: "Saved directional rationale",
            confirmed: true,
          },
        },
        aiWritingProvenance: {
          brief_clarify: {},
          calibration_evidence_gaps: {},
          decision_rationale_review: {},
        },
      },
    }));
  });
  await page.reload();
  await dismissConsent(page);
  await page.getByRole("button", { name: "Gespeichertes Projekt laden" }).click();
  await expect(page.getByText("Which configurations explain Y?")).toBeVisible();
  await openDestination(page, "decisions");
  await expect(page.locator("#decision-rationale-frequencyCutoff")).toHaveValue(
    "Saved frequency rationale",
  );
  await expect(page.locator("#decision-rationale-consistencyCutoff")).toHaveValue(
    "Saved consistency rationale",
  );
  await expect(page.locator("#decision-rationale-directionalExpectations")).toHaveValue(
    "Saved directional rationale",
  );
});

test("restored projects with multiple outcomes cannot compute an arbitrary first outcome", async ({ page }) => {
  await page.goto("/app#answer");
  await page.evaluate(() => {
    window.localStorage.setItem("openqca_local_project", JSON.stringify({
      schema: "openqca-local-project",
      version: 2,
      savedAt: "2026-08-11T10:00:00.000Z",
      state: {
        dataset: {
          name: "invalid-roles.csv",
          caseCol: "Case",
          columns: ["Case", "A", "Y", "Z"],
          rows: [
            { Case: "c1", A: 1, Y: 1, Z: 0 },
            { Case: "c2", A: 0, Y: 0, Z: 1 },
          ],
        },
        anchors: {},
        varMeta: {
          A: { type: "raw", role: "condition" },
          Y: { type: "crisp", role: "outcome" },
          Z: { type: "crisp", role: "outcome" },
        },
        calibSpecs: {
          A: {
            column: "A",
            set: { highIsMembership: true },
            method: "direct",
            direct: { fullOut: 0, crossover: 0.5, fullIn: 1 },
            missing: { kind: "exclude_case" },
            sensitivity: {
              alternatives: [{
                id: "a-shift",
                label: "A crossover shift",
                delta: 0.1,
                rationale: "Recorded alternative",
              }],
            },
          },
        },
        demoMode: false,
        freqCut: 1,
        consCut: 0.8,
        expectations: { A: "present" },
        researchBrief: {
          question: "Which configurations explain the outcome?",
          caseUniverse: "Two saved cases",
          timePeriod: "2020",
          outcomeConcept: "Outcome membership",
          conditionSelectionRationale: "A follows the comparison design.",
          confirmed: true,
        },
        analysisDecisions: {
          frequencyCutoff: { rationale: "Saved rationale", confirmed: true },
          consistencyCutoff: { rationale: "Saved rationale", confirmed: true },
          directionalExpectations: { rationale: "Saved rationale", confirmed: true },
        },
        aiWritingProvenance: {
          brief_clarify: {},
          calibration_evidence_gaps: {},
          decision_rationale_review: {},
        },
      },
    }));
  });
  await page.reload();
  await dismissConsent(page);
  await page.getByRole("button", { name: "Gespeichertes Projekt laden" }).click();
  await expect(page.getByText(
    "Mindestens eine aktive Bedingung und genau ein aktives Outcome sind erforderlich.",
  )).toBeVisible();
  await expect(page.locator('[data-testid^="solution-formula-"]')).toHaveCount(0);
  await openDestination(page, "decisions");
  await page.getByTestId("calibration-view-doc").click();
  await expect(page.getByTestId("calibration-sensitivity-fit")).toHaveCount(0);
  await openDestination(page, "evidence");
  await expect(page.getByTestId("necessity-finding")).toHaveCount(0);
  await expect(page.locator("#xyplot")).toHaveCount(0);
  await openDestination(page, "research");
  await expect(page.getByText(
    "Vor der Bestätigung müssen mindestens eine Bedingung und genau ein Outcome gewählt sein.",
  )).toBeVisible();
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

test("provisional evidence action preserves workspace focus semantics", async ({ page }) => {
  await loadRawRohwerte(page);
  await openDestination(page, "evidence");
  await page.getByRole("button", { name: "Zu Entscheidungen" }).click();
  await expect(page).toHaveURL(/#decisions$/);
  await expect.poll(() =>
    page.evaluate(() => document.activeElement?.id ?? ""),
  ).toBe("workspace-decisions-heading");
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

test("answer identifies incomplete active calibrations", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "research");
  await page.getByLabel("urban: Rolle").selectOption("ignore");
  await page.getByLabel("bildung: Rolle").selectOption("ignore");
  await page.getByLabel("stabil: Rolle").selectOption("ignore");
  await openDestination(page, "decisions");
  await page.getByTestId("calibration-view-doc").click();
  await page.locator("#calibration-set-definition-wohlstand").fill("");
  await openDestination(page, "answer");
  await expect(page.getByText(
    "Aktive Kalibrierungen sind unvollständig: wohlstand. Ergänzen Sie die fehlenden Angaben unter Entscheidungen.",
  )).toBeVisible();
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

test("answer names the engine limit when more than twelve conditions are active", async ({ page }) => {
  await clearProject(page);
  const conditions = Array.from({ length: 13 }, (_, index) => `C${index + 1}`);
  const row = (label: string, value: number) =>
    [label, ...conditions.map(() => String(value)), String(value)].join(",");
  await page.locator('input[type="file"]').setInputFiles({
    name: "thirteen-conditions.csv",
    mimeType: "text/csv",
    buffer: Buffer.from([
      ["Fall", ...conditions, "Y"].join(","),
      row("c1", 0),
      row("c2", 1),
    ].join("\n")),
  });
  await page.getByRole("button", { name: "Import übernehmen" }).click();
  await openDestination(page, "answer");
  await expect(page.getByText(
    "Mit 13 Bedingungen ist die Suffizienzanalyse auf höchstens 12 Bedingungen begrenzt.",
  )).toBeVisible();
});

test("answer surfaces exact crossover cases from engine diagnostics", async ({ page }) => {
  await clearProject(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "crossover.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Fall,A,Y\nc1,0,0\nc2,0.5,1\nc3,1,1\n"),
  });
  await page.getByRole("button", { name: "Import übernehmen" }).click();
  await openDestination(page, "answer");
  const summary = page.getByTestId("answer-case-summary");
  await expect(summary).toContainText("Grenzfälle bei 0,5");
  await expect(summary).toContainText("c2");
});

test("research and answer expose cases excluded by missing-value policy", async ({ page }) => {
  await clearProject(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "missing-cases.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Fall,A,Y\nc1,1,1\nc2,,0\nc3,0,\n"),
  });
  await page.getByRole("button", { name: "Import übernehmen" }).click();
  await expect(page.getByText(
    "missing-cases.csv: 3 Rohfälle, 1 analysierte Fälle, 2 ausgeschlossen oder ungeklärt",
  )).toBeVisible();
  await openDestination(page, "answer");
  await expect(page.getByText(/2 Fall\/Fälle .* ausgeschlossen/)).toBeVisible();
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
