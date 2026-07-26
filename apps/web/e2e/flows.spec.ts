import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import {
  DEMO_SOLUTION,
  dismissConsent,
  expectExportGateClosed,
  expectExportGateOpen,
  loadDemo,
  loadExample,
  loadRawRohwerte,
  openDocumentationView,
} from "./helpers";

/**
 * A2.2–A2.4, A2.7 — Funktionale Kern-Flüsse: Demo, Crisp-/Fuzzy-Beispiel und
 * Rollen-Wechsel.
 */

test("A2.2 Demo — komplexe Lösung enthält WOHLSTAND*BILDUNG*STABIL", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await loadDemo(page);

  // Alle fünf numerischen Spalten haben eine Rolle: vier Bedingungen, ein
  // Outcome. Die frühere Erwartung WOHLSTAND*URBAN*BILDUNG war das Ergebnis der
  // stillen Drei-Bedingungen-Deckelung und ist mit deren Entfernung ungültig.
  // Spaltenkopf steht klein im DOM und wird per text-transform großgesetzt.
  await expect(page.locator("#truthtable table thead th").nth(3)).toHaveText(/^stabil$/i);
  await expect(page.getByText(DEMO_SOLUTION).first()).toBeVisible();
  // Replikationsartefakte bleiben für synthetische Daten gesperrt — sie würden
  // eine Provenienz behaupten, die es nicht gibt.
  await expect(
    page.getByRole("button", { name: "Rohdaten als CSV herunterladen" }),
  ).toBeDisabled();
  // Der Bericht ist dagegen erzeugbar und weist sich selbst als synthetisch aus
  // (Warnbanner, geprüft in A2.16) — sonst sähe niemand, der das Werkzeug prüft,
  // jemals das Ergebnisdokument.
  await expect(page.getByRole("button", { name: "Bericht erzeugen (Druck/PDF)" })).toBeEnabled();
  expect(pageErrors, pageErrors.join(" | ")).toEqual([]);
});

test("A2.3 Crisp-Beispiel — FOERDERUNG Min 0 / Max 1, bereits kalibriert", async ({ page }) => {
  await loadExample(page, /Crisp-Sets Beispiel/);

  // Die Kennzahlen stehen unter den Sets und sind eingeklappt — sie folgen aus
  // den Ankern und sind Kontrolle, nicht Eingabe.
  await page.locator("#deskriptiv summary").click();
  // Deskriptivstatistik-Zeile FOERDERUNG: Minimum 0, Maximum 1 (als 0,000 / 1,000 gerendert).
  const row = page.locator("#deskriptiv tbody tr").filter({ hasText: "FOERDERUNG" });
  await expect(row).toBeVisible();
  const cells = row.getByRole("cell");
  await expect(cells.nth(2), "Minimum FOERDERUNG").toHaveText(/^0(,0+)?$/);
  await expect(cells.nth(5), "Maximum FOERDERUNG").toHaveText(/^1(,0+)?$/);

  // Crisp-Sets brauchen keine Kalibrierung. Das sagt jetzt schon die
  // Start-Ansicht („Schnell") …
  await expect(page.getByTestId("calibration-quick-card-FOERDERUNG")).toContainText(
    /Bereits kalibriert/,
  );
  // … und die Ansicht „Dokumentation" bestätigt es unverändert im Kontextband.
  await openDocumentationView(page);
  await expect(page.getByTestId("calibration-active-context")).toContainText(/bereits kalibriert/);
});

test("A2.4 Fuzzy-Beispiel — WOHLSTAND Min 0,100 / Max 0,900", async ({ page }) => {
  await loadExample(page, /Fuzzy-Sets Beispiel/);

  await page.locator("#deskriptiv summary").click();
  const row = page.locator("#deskriptiv tbody tr").filter({ hasText: "WOHLSTAND" });
  await expect(row).toBeVisible();
  await expect(row).toContainText("0,100");
  await expect(row).toContainText("0,900");
  const cells = row.getByRole("cell");
  await expect(cells.nth(2), "Minimum WOHLSTAND").toHaveText("0,100");
  await expect(cells.nth(5), "Maximum WOHLSTAND").toHaveText("0,900");
});

test("A2.7 Rollen-Wechsel — genau ein Outcome, Lösungen rechnen neu", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await loadDemo(page);

  // Rollen-Selects im Variablen-Schritt = Selects mit einer <option value="outcome">.
  const roleSelects = page.locator('#variablen select:has(option[value="outcome"])');
  await roleSelects.first().selectOption("outcome");

  // Genau EIN Rollen-Select steht danach auf „outcome" (App setzt altes Outcome zurück).
  await expect
    .poll(async () =>
      roleSelects.evaluateAll(
        (els) => els.filter((e) => (e as HTMLSelectElement).value === "outcome").length,
      ),
    )
    .toBe(1);

  // Lösungen rechnen neu: das erste Feld (wohlstand) ist jetzt das Outcome der Formel.
  await expect(page.locator("#loesungen")).toContainText("→ WOHLSTAND");
  expect(pageErrors, pageErrors.join(" | ")).toEqual([]);
});

test("A2.11 Raw calibration keeps editing open until research checklist is complete", async ({
  page,
}) => {
  await loadExample(page, /Rohwerte Demokratie/);
  await openDocumentationView(page);
  await page.getByRole("button", { name: /Lehrbeispiel übernehmen/ }).click();

  const methodConfirm = page.locator('[data-testid="calibration-method-confirm"]');
  await expect(methodConfirm).toBeVisible();
  await expect(methodConfirm).toBeEnabled();
  const definition = page.locator("#kalibrierung textarea").first();
  await expect(definition).toBeEnabled();
  const originalDefinition = await definition.inputValue();
  await definition.fill(`${originalDefinition} (edited)`);
  await expect(definition).toHaveValue(`${originalDefinition} (edited)`);

  // Die unvollständige Checkliste sperrt nicht mehr das Rechnen, sondern die
  // Publikationsreife: Notwendigkeit, Truth Table und Robustheit sind
  // freigeschaltet, der Dokumentationsstand ist unvollständig, und die vier
  // Replikationsartefakte bleiben gesperrt.
  await expect(page.locator("#notwendigkeit")).toContainText("Notwendige Bedingungen");
  await expect(page.locator("#notwendigkeit")).not.toContainText("gesperrt");
  await expect(page.locator("#truthtable")).not.toContainText("gesperrt");
  await expect(page.locator("#robustheit")).not.toContainText("Erst Truth Table");
  await expect(page.getByTestId("calibration-doc-meter-title")).toContainText(
    /^Publikationsreife: 0 von 4 Sets dokumentiert$/,
  );
  await expect(page.locator('[data-readiness="protocol-incomplete"]')).toBeVisible();
  await expectExportGateClosed(page);
});

test("A2.12 Raw calibration — crisp, fuzzy, outcome, cases, sensitivity and protocol", async ({
  page,
}) => {
  await loadRawRohwerte(page);
  await openDocumentationView(page);
  await page.getByRole("button", { name: /Lehrbeispiel übernehmen/ }).click();
  await expect(page.getByTestId("calibration-progress")).toBeVisible();
  await expect(page.getByTestId("calibration-progress")).not.toContainText("6 von 6");
  // Gate = Publikationsreife/Export, nicht das Rechnen: Solange dokumentiert
  // wird, bleiben die vier Replikationsartefakte gesperrt.
  await expectExportGateClosed(page);

  // The seeded raw workflow exposes a direct-fuzzy condition with meanings,
  // a case-level table, and explicit sensitivity output.
  await expect(page.getByTestId("calibration-mapping-direct")).toBeVisible();
  await expect(page.getByTestId("calibration-evidence-coverage")).toBeVisible();
  await expect(page.getByTestId("calibration-case-table")).toBeVisible();
  await expect(page.getByTestId("calibration-sensitivity-fit")).toBeVisible();
  await expect(page.locator('[data-testid^="calibration-sensitivity-case-changes-"]').first()).toBeVisible();

  const completeCurrentVariable = async (targets: string[]) => {
    const evidenceRows = page.locator('[data-testid^="calibration-evidence-row-"]');
    for (let index = await evidenceRows.count(); index < targets.length; index++) {
      await page.getByTestId("calibration-evidence-add").click();
    }
    for (const [index, target] of targets.entries()) {
      await page.getByTestId(`calibration-evidence-support-${index}`).selectOption(target);
      await page.getByTestId(`calibration-evidence-note-${index}`).fill(
        "Substantive rationale and source recorded for this calibration decision.",
      );
      await page.getByTestId(`calibration-evidence-doi-${index}`).fill(
        "https://doi.org/10.7208/chicago/9780226702797.001.0001",
      );
    }
    await page.getByTestId("calibration-method-confirm").click();
    const sensitivityLabels = page.locator('[data-testid^="calibration-sensitivity-label-"]');
    while (await sensitivityLabels.count() < 2) {
      await page.getByTestId("calibration-sensitivity-add").click();
      await expect(
        page.getByTestId(`calibration-sensitivity-label-${(await sensitivityLabels.count()) - 1}`),
      ).toBeVisible();
    }
    for (const [index, delta] of [-5, 5].entries()) {
      await page.getByTestId(`calibration-sensitivity-label-${index}`).fill(
        `Crossover alternative ${delta > 0 ? "higher" : "lower"}`,
      );
      await page.getByTestId(`calibration-sensitivity-delta-${index}`).fill(String(delta));
      await page.getByTestId(`calibration-sensitivity-rationale-${index}`).fill(
        "Substantive alternative recorded for this calibration decision.",
      );
    }
    const caseReview = page.getByTestId("calibration-case-review");
    if (!(await caseReview.isChecked())) await caseReview.check();
    const sensitivityReview = page.getByTestId("calibration-sensitivity-review");
    if (!(await sensitivityReview.isChecked())) await sensitivityReview.check();
  };

  await completeCurrentVariable(["set", "method", "fullOut", "crossover", "fullIn"]);

  // Switch to a crisp condition and verify the method-specific mapping UI.
  await page.getByTestId("calibration-variable-INDUSTRIEANTEIL").click();
  await expect(page.getByTestId("calibration-method-crisp")).toBeVisible();
  await expect(page.getByTestId("calibration-mapping-crisp")).toBeVisible();
  await expect(page.getByTestId("calibration-crisp-threshold")).toBeVisible();
  await completeCurrentVariable(["set", "method", "threshold"]);

  // A second fuzzy condition uses the independently validated piecewise-linear path.
  await page.getByTestId("calibration-variable-ALPHABETISIERUNG").click();
  await page.getByTestId("calibration-method-linear").click();
  await expect(page.getByTestId("calibration-mapping-linear")).toBeVisible();
  await expect(page.getByTestId("calibration-mapping-direct")).toHaveCount(0);
  await completeCurrentVariable(["set", "method", "fullOut", "crossover", "fullIn"]);

  // Outcome calibration remains a separate set decision and keeps its own
  // direct-fuzzy anchors and sensitivity interpretation.
  await page.getByTestId("calibration-variable-DEMOKRATIE_INDEX").click();
  await expect(page.getByTestId("calibration-set-role")).toHaveText(/Outcome/);
  await expect(page.getByTestId("calibration-mapping-direct")).toBeVisible();
  await expect(page.getByText(/keinen universellen „guten Outcome-Wert/)).toBeVisible();
  await expect(page.getByText(/Outcome-Zugehörigkeit ≠ Analyse-Cutoffs/)).toBeVisible();
  await completeCurrentVariable(["set", "method", "fullOut", "crossover", "fullIn"]);

  // A2.19 — Vollständige Dokumentation schaltet die Replikationsartefakte frei:
  // Das Meter meldet alle vier Sets dokumentiert, und alle vier Export-Buttons
  // (JSON, CSV, Markdown, R) sind bedienbar. Die Zusage steckt hier statt in
  // einem eigenen Test, weil sie exakt diesen Durchlauf braucht.
  await expect(page.getByTestId("calibration-doc-meter-title")).toContainText(
    /^Publikationsreife: 4 von 4 Sets dokumentiert$/,
  );
  await expectExportGateOpen(page);

  // Completing the local checklist unlocks the reproducible protocol exports.
  const protocol = page.locator("#protokoll");
  await expect(protocol).toBeVisible({ timeout: 15_000 });
  await expect(protocol.locator("pre")).toContainText("sessionInfo()");
  await expect(protocol.locator("pre")).toContainText("10.7208/chicago/9780226702797.001.0001");
  await expect(protocol.locator("pre")).toContainText("solution_sensitivity_");
  await expect(protocol.locator("pre")).toContainText("parse_openqca_number");
  await expect(protocol.locator("pre")).toContainText("logistic = FALSE");
  const protocolText = await protocol.locator("pre").innerText();
  expect(protocolText).toMatch(
    /analysis_sensitivity_ALPHABETISIERUNG_[\s\S]*?calibrate\(parse_openqca_number\(analysis_raw\[\["ALPHABETISIERUNG"\]\]\)[\s\S]*?logistic = FALSE/,
  );
  await expect(protocol.locator("pre")).toContainText(
    "calibrate(parse_openqca_number(analysis_raw",
  );
  await expect(protocol.locator("pre")).toContainText("minimize(tt_sensitivity_");
  await expect(protocol.locator("pre")).toContainText("Combined robustness grid");
  await expect(protocol.locator("pre")).toContainText("robustness_pri_cuts");
  const jsonButton = protocol.getByRole("button", { name: /Protokoll als JSON herunterladen/ });
  const jsonDownload = page.waitForEvent("download");
  await jsonButton.click();
  const jsonFile = await jsonDownload;
  const jsonPath = await jsonFile.path();
  if (!jsonPath) throw new Error("JSON export path missing");
  const jsonPayload = JSON.parse(await readFile(jsonPath, "utf8")) as {
    methodologyReferences: unknown[];
    sensitivitySummary: {
      baseFit: { consistency: number; coverage: number };
      variantFit: { consistency: number; coverage: number };
    }[];
    robustness: {
      totalCells: number;
      cells: unknown[];
      caseStability: unknown[];
      baseline: { scenarioId: string; freqCut: number; consCut: number; priCut: number | null };
    } | null;
    sets: { column: string; method?: string }[];
    transformations: {
      rowIndex: number;
      columns: Record<string, { rawValue: number | null; membership: number | null }>;
    }[];
    analysis: { outcome: string; freqCut: number; consCut: number };
  };
  expect(jsonPayload.methodologyReferences).toHaveLength(5);
  expect(jsonPayload.sensitivitySummary).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        baseFit: expect.objectContaining({
          consistency: expect.any(Number),
          coverage: expect.any(Number),
        }),
        variantFit: expect.objectContaining({
          consistency: expect.any(Number),
          coverage: expect.any(Number),
        }),
      }),
    ]),
  );
  expect(jsonPayload.robustness?.baseline).toMatchObject({
    scenarioId: "base",
    freqCut: 1,
    consCut: 0.8,
    priCut: null,
  });
  expect(jsonPayload.sensitivitySummary.length).toBeGreaterThan(0);
  expect(jsonPayload.robustness).not.toBeNull();
  expect(jsonPayload.robustness?.totalCells).toBeGreaterThan(0);
  expect(jsonPayload.robustness?.cells.length).toBe(jsonPayload.robustness?.totalCells);
  expect(jsonPayload.sets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ column: "INDUSTRIEANTEIL", method: "crisp" }),
      expect.objectContaining({ column: "DEMOKRATIE_INDEX", method: "direct" }),
      expect.objectContaining({ column: "ALPHABETISIERUNG", method: "linear" }),
    ]),
  );
  expect(jsonPayload.analysis).toMatchObject({
    outcome: "DEMOKRATIE_INDEX",
    freqCut: 1,
    consCut: 0.8,
  });
  expect(
    jsonPayload.transformations.some((row) =>
      Object.values(row.columns).some(
        (cell) => "rawValue" in cell && "membership" in cell,
      ),
    ),
  ).toBe(true);
  expect(jsonPayload.transformations.map((row) => row.rowIndex)).toEqual(
    Array.from({ length: jsonPayload.transformations.length }, (_, index) => index),
  );
  expect(jsonFile.suggestedFilename()).toBe("openqca-calibration-protocol.json");
  const markdownButton = protocol.getByRole("button", { name: /Methoden-Protokoll/ });
  const markdownDownload = page.waitForEvent("download");
  await markdownButton.click();
  const markdownFile = await markdownDownload;
  const markdownPath = await markdownFile.path();
  if (!markdownPath) throw new Error("Markdown export path missing");
  const markdownText = await readFile(markdownPath, "utf8");
  expect(markdownText).toContain("Methodologische Referenzen");
  expect(markdownText).toContain("Einheit");
  expect(markdownText).toContain("Protokoll bereit");
  expect(markdownText).not.toContain("Unit:");
  expect(markdownText).not.toContain("Protocol ready");
  expect(markdownText).toContain("A Robustness Test Protocol for Applied QCA: Theory and R Software Application");
  expect(markdownFile.suggestedFilename()).toBe("openqca-calibration-protocol.md");

  const germanReportPopup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Bericht erzeugen (Druck/PDF)" }).click();
  const germanReportPage = await germanReportPopup;
  await germanReportPage.waitForLoadState();
  await expect(germanReportPage.locator("html")).toHaveAttribute("lang", "de");
  await expect(germanReportPage.locator("body")).toContainText("openQCA — Analysebericht");
  await expect(germanReportPage.locator("body")).toContainText("0,800");
  // A2.19 — Kehrseite von A2.18: dokumentiert heißt kein „Vorläufig"-Banner
  // (und ebenso wenig ein Demo-Banner) mehr im Bericht.
  await expect(germanReportPage.locator(".demo-banner")).toHaveCount(0);
  await germanReportPage.close();

  await page.getByRole("banner").getByRole("button", { name: "EN", exact: true }).click();
  const reportPopup = page.waitForEvent("popup");
  await page.getByRole("button", { name: /Generate report/i }).click();
  const reportPage = await reportPopup;
  await reportPage.waitForLoadState();
  await expect(reportPage.locator("html")).toHaveAttribute("lang", "en");
  await expect(reportPage.locator("body")).toContainText("openQCA — Analysis report");
  await expect(reportPage.locator("body")).toContainText("0.800");
  await expect(reportPage.locator("body")).not.toContainText("0,800");
  await expect(reportPage.locator("body")).not.toContainText("Analysebericht");
  await reportPage.close();
  await page.getByRole("banner").getByRole("button", { name: "DE", exact: true }).click();

  await page.getByRole("button", { name: "Projekt lokal speichern" }).click();
  await expect(page.getByText("Lokal gespeichert.")).toBeVisible();
  await page.reload();
  const restoredProtocol = page.locator("#protokoll");
  await expect(restoredProtocol.locator("pre")).toContainText("sessionInfo()");
  const restoredJsonDownload = page.waitForEvent("download");
  await restoredProtocol.getByRole("button", { name: /Protokoll als JSON herunterladen/ }).click();
  const restoredJsonFile = await restoredJsonDownload;
  const restoredJsonPath = await restoredJsonFile.path();
  if (!restoredJsonPath) throw new Error("Restored JSON export path missing");
  const restoredJson = JSON.parse(await readFile(restoredJsonPath, "utf8")) as {
    transformations: { rowIndex: number }[];
    robustness: { totalCells: number } | null;
  };
  expect(restoredJson.transformations.length).toBeGreaterThan(0);
  expect(restoredJson.transformations[0]?.rowIndex).toBe(0);
  expect(restoredJson.robustness?.totalCells).toBeGreaterThan(0);

  await page.getByTestId("truth-table-consistency-cut").fill("0.81");
  await expect(protocol.getByRole("button", { name: /Protokoll als JSON herunterladen/ })).toBeDisabled();
});

test("A2.13 Evidence gate and method reset stay explicit", async ({ page }) => {
  await loadRawRohwerte(page);
  await openDocumentationView(page);
  await page.getByRole("button", { name: /Lehrbeispiel übernehmen/ }).click();

  const evidenceRows = page.locator('[data-testid^="calibration-evidence-row-"]');
  const diagnosticIndex = await evidenceRows.count();
  await page.getByTestId("calibration-evidence-add").click();
  await expect(page.getByTestId(`calibration-evidence-row-${diagnosticIndex}`)).toBeVisible();
  await page.getByTestId(`calibration-evidence-type-${diagnosticIndex}`).selectOption("empirical_diagnostic");
  await page
    .getByTestId(`calibration-evidence-support-${diagnosticIndex}`)
    .selectOption("fullOut");
  await page
    .getByTestId(`calibration-evidence-note-${diagnosticIndex}`)
    .fill("Distribution diagnostic recorded for E2E only; not substantive proof.");
  await page
    .getByTestId(`calibration-evidence-doi-${diagnosticIndex}`)
    .fill("https://doi.org/10.7208/chicago/9780226702797.001.0001");

  await expect(page.getByTestId("calibration-evidence-diagnostic-warning")).toBeVisible();
  await expect(page.getByTestId("calibration-evidence-target-fullOut")).toHaveAttribute(
    "data-supported",
    "false",
  );
  await expect(page.locator('[data-readiness="protocol-incomplete"]')).toBeVisible();
  // Ein bloßes Verteilungs-Diagnostikum trägt keine Ankerbegründung — die
  // Publikationsreife bleibt aus und mit ihr das Export-Gate geschlossen.
  await expectExportGateClosed(page);

  await page.getByTestId("calibration-method-crisp").click();
  await expect(page.getByTestId("calibration-method-crisp")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("calibration-method-direct")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByTestId("calibration-mapping-crisp")).toBeVisible();
  await expect(page.getByTestId("calibration-mapping-direct")).toHaveCount(0);
  await expect(page.getByTestId("calibration-sensitivity-review")).not.toBeChecked();

  await page.getByTestId("calibration-method-direct").click();
  await expect(page.getByTestId("calibration-mapping-direct")).toBeVisible();
  await expect(page.getByTestId("calibration-mapping-crisp")).toHaveCount(0);
  await expect(page.getByTestId("calibration-method-direct")).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("calibration-direction").click();
  await page.getByTestId("calibration-method-direct").click();
  await expect(page.getByTestId("calibration-mapping-direct")).toBeVisible();
  await expect(page.getByTestId("calibration-anchor-value-fullOut")).toHaveValue("1000");
  await expect(page.getByTestId("calibration-anchor-value-fullIn")).toHaveValue("300");

  const methodStep = page.getByTestId("calibration-substep-method");
  await methodStep.focus();
  await expect(methodStep).toBeFocused();
  await methodStep.press("Enter");
  await expect(methodStep).toHaveAttribute("aria-current", "step");

  await page.getByRole("banner").getByRole("button", { name: "EN", exact: true }).click();
  await expect(page.getByTestId("calibration-active-context")).toContainText(/This set explains/i);
  await expect(page.getByTestId("calibration-evidence-coverage")).toContainText(/Evidence coverage/i);
  await expect(page.getByTestId("calibration-substepper")).toContainText(/Define set/i);
});

test("A2.14 Local project persistence survives reload", async ({ page }) => {
  await loadExample(page, /Fuzzy-Sets Beispiel/);

  const saveButton = page.getByRole("button", { name: "Projekt lokal speichern" });
  const loadButton = page.getByRole("button", { name: "Lokales Projekt laden" });
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(page.getByText("Lokal gespeichert.")).toBeVisible();
  await page.reload();
  await expect(page.locator("#deskriptiv")).toBeVisible({ timeout: 15_000 });
  await expect(loadButton).toBeVisible();
  await expect(page.getByText("Lokales Projekt geladen.")).toBeVisible();
  await page.evaluate(() => localStorage.removeItem("openqca_local_project"));
});

test("A2.15 Calibration provenance and missing policy survive reload", async ({ page }) => {
  await loadRawRohwerte(page);
  await openDocumentationView(page);
  await page.getByRole("button", { name: /Lehrbeispiel übernehmen/ }).click();
  await page.getByTestId("calibration-missing-policy").selectOption("leave_unresolved");
  await expect(page.getByTestId("calibration-evidence-row-0")).toContainText(/Illustratives Lehrbeispiel/i);

  await page.getByRole("button", { name: "Projekt lokal speichern" }).click();
  await expect(page.getByText("Lokal gespeichert.")).toBeVisible();
  await page.reload();
  // Die Ansichtswahl lebt in der Sitzung, nicht im Projekt — nach dem Reload
  // deshalb bewusst erneut auf „Dokumentation" stellen, statt darauf zu bauen.
  await openDocumentationView(page);

  await expect(page.getByTestId("calibration-variable-BIP_pKopf")).toBeVisible();
  await expect(page.getByLabel("Set-Bezeichnung")).toHaveValue("Relativ wohlhabende Länder");
  await expect(page.getByTestId("calibration-missing-policy")).toHaveValue("leave_unresolved");
  await expect(page.getByTestId("calibration-evidence-row-0")).toContainText(/Illustratives Lehrbeispiel/i);
  await page.evaluate(() => localStorage.removeItem("openqca_local_project"));
});

/**
 * A2.16 — Der Demo-Bericht ist erzeugbar, weist sich aber unmissverständlich als
 * synthetisch aus. Hintergrund: Wer das Werkzeug über die Landing-CTA
 * „Beispiel-Analyse öffnen" prüft, muss das Ergebnisdokument sehen können; die
 * Zahlen dürfen dabei nie als Forschungsergebnis durchgehen. Der Protokoll- und
 * R-Export bleibt für Demodaten gesperrt (Replikationsartefakt).
 */
test("A2.16 Demo-Bericht ist erzeugbar und als nicht zitierfähig markiert", async ({
  page,
  context,
}) => {
  await loadDemo(page);

  // Hinweis in der App selbst.
  await expect(page.getByText(/nicht zitierfähig/i).first()).toBeVisible();

  const generate = page.getByRole("button", { name: /Bericht erzeugen/ });
  await expect(generate).toBeEnabled();

  const popupPromise = context.waitForEvent("page");
  await generate.click();
  const report = await popupPromise;
  await report.waitForLoadState("domcontentloaded");

  // Das Warnbanner steht im Bericht selbst, vor allen Ergebnissen.
  const banner = report.locator(".demo-banner");
  await expect(banner).toContainText(/Synthetische Lehrdaten/i);
  await expect(banner).toContainText(/nicht zitiert/i);
  // Und der Rechenweg ist trotzdem vollständig enthalten.
  await expect(report.locator("body")).toContainText(/WOHLSTAND/);
  await report.close();
});

/**
 * A2.17 — Schnellpfad: Wer eigene Rohwerte lädt, sieht Ergebnisse SOFORT, ohne
 * ein einziges Feld auszufüllen. Der Kalibrier-Schritt startet in der
 * Schnell-Ansicht, Notwendigkeit/Truth Table/Lösungen rechnen mit den beim
 * Import gesetzten vorläufigen Ankern — und trotzdem bleibt das
 * Replikationsartefakt (Protokoll/CSV/Markdown/R) gesperrt, weil nichts davon
 * dokumentiert ist. Das ist die Umkehrung des alten Flusses und muss geprüft
 * bleiben, sonst schleicht sich die Sperre wieder vor die Ergebnisse.
 */
test("A2.17 Schnellpfad — Rohwerte rechnen ohne Dokumentation, Export bleibt gesperrt", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await loadRawRohwerte(page);

  // Startzustand: Schnell-Ansicht, kein einziges Set dokumentiert.
  await expect(page.getByTestId("calibration-view-quick")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("calibration-quick")).toBeVisible();
  await expect(page.getByTestId("calibration-active-context")).toHaveCount(0);
  // FÜNF Sets: rohwerte-demokratie.csv hat vier numerische Bedingungsspalten und
  // ein Outcome. Vorher stand hier „0 von 4" — die vierte Bedingung
  // (INDUSTRIEANTEIL) fiel der stillen Drei-Bedingungen-Deckelung zum Opfer und
  // war weder im Meter noch in der Analyse. A2.11/A2.12 prüfen weiterhin
  // „0 von 4" bzw. „4 von 4", weil der Lehr-Seed URBANISIERUNG dort BEWUSST auf
  // „ignorieren" setzt — eine dokumentierte Entscheidung statt einer Heuristik.
  await expect(page.getByTestId("calibration-doc-meter-title")).toContainText(
    /^Publikationsreife: 0 von 5 Sets dokumentiert$/,
  );
  await expect(page.locator('[data-testid^="calibration-doc-chip-"][data-documented="true"]')).toHaveCount(0);

  // Ergebnisse sind da — ohne eine einzige Eingabe.
  await expect(page.locator("#notwendigkeit")).not.toContainText("gesperrt");
  // `.first()` seit A2.22: Der Notwendigkeits-Schritt enthält jetzt zwei Tabellen
  // (Einzelbedingungen und notwendige Kombinationen/SUIN). Geprüft bleibt
  // unverändert, dass die Notwendigkeitsanalyse ohne Dokumentation rechnet.
  await expect(page.locator("#notwendigkeit table").first()).toBeVisible();
  await expect(page.locator("#truthtable")).not.toContainText("gesperrt");
  await expect(page.locator("#truthtable table").first()).toBeVisible();
  await expect(page.locator("#loesungen")).toContainText(/→ DEMOKRATIE_INDEX/);

  // Der Bericht ist erzeugbar (er kennzeichnet sich als vorläufig, A2.18) …
  await expect(page.getByRole("button", { name: "Bericht erzeugen (Druck/PDF)" })).toBeEnabled();
  // … die vier Replikationsartefakte bleiben gesperrt.
  await expectExportGateClosed(page);

  expect(pageErrors, pageErrors.join(" | ")).toEqual([]);
});

/**
 * A2.18 — Der Bericht aus dem Schnellpfad trägt das „Vorläufig"-Banner: echte
 * Daten, exakte Zahlen, aber die Kalibrierung ist noch nicht begründet. Das
 * Demo-Banner darf hier NICHT erscheinen (es sind keine synthetischen Daten),
 * und der Rechenweg muss vollständig drinstehen — sonst wäre die Vorläufigkeit
 * eine Sperre durch die Hintertür.
 */
test("A2.18 Vorläufig-Banner — Bericht aus dem Schnellpfad kennzeichnet sich selbst", async ({
  page,
  context,
}) => {
  await loadRawRohwerte(page);

  // Hinweis in der App selbst.
  await expect(page.getByText(/als .?vorläufig.? gekennzeichnet/i)).toBeVisible();

  const generate = page.getByRole("button", { name: "Bericht erzeugen (Druck/PDF)" });
  await expect(generate).toBeEnabled();

  const popupPromise = context.waitForEvent("page");
  await generate.click();
  const report = await popupPromise;
  await report.waitForLoadState("domcontentloaded");

  const banner = report.locator(".demo-banner");
  await expect(banner).toContainText("Vorläufig — Kalibrierung noch nicht vollständig dokumentiert");
  await expect(banner).toContainText(/Berechnungen sind exakt/);
  // Keine Verwechslung mit dem Demo-Warnbanner (A2.16).
  await expect(report.locator("body")).not.toContainText(/Synthetische Lehrdaten/i);
  // Der Rechenweg ist vollständig enthalten.
  await expect(report.locator("body")).toContainText("DEMOKRATIE_INDEX");
  await expect(report.locator("body")).toContainText("openQCA — Analysebericht");
  await report.close();
});

/**
 * A2.20 — Die Landing verspricht: „Keine Illustration … mit denselben Formeln
 * wie in der App." Genau diese Zusage war gebrochen: Der Hero rechnete mit vier
 * Bedingungen (`WOHLSTAND*BILDUNG*STABIL`, 0,972 / 0,860), die App zeigte wegen
 * einer stillen Rollen-Heuristik nur drei (`WOHLSTAND*URBAN*BILDUNG`,
 * 0,809 / 0,581). Ein Werkzeug, das auf der Startseite andere Zahlen behauptet
 * als es liefert, verliert genau die Glaubwürdigkeit, für die es geschrieben
 * ist — deshalb ist die Übereinstimmung ab jetzt eine geprüfte Zusage.
 *
 * Geprüft wird die Identität, nicht ein eingefrorener Zahlenwert: Ändert sich
 * der Demo-Datensatz oder die Engine, dürfen sich BEIDE Seiten ändern — aber nie
 * unterschiedlich.
 */
test("A2.20 Landing-Hero und App-Demo zeigen dieselbe Lösungsformel", async ({ page }) => {
  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  /** Alle Kennzahlen im deutschen Format (0,972) in Lesereihenfolge. */
  const numbers = (s: string) => s.match(/\d+,\d+/g) ?? [];

  await page.goto("/");
  await dismissConsent(page);
  const heroFormula = norm(await page.getByTestId("landing-hero-formula").innerText());
  const heroNumbers = numbers(await page.getByTestId("landing-hero-kpis").innerText());
  // Der Streifen behauptet eine echte Ableitung — eine leere Formel wäre ein
  // stiller Fehlschlag und würde den Vergleich unten trivial grün machen.
  expect(heroFormula, "Hero-Formel ist leer — der Beweis-Streifen rechnet nicht").toMatch(
    /\S+\s+→\s+\S+/,
  );
  expect(heroNumbers, "Hero-Kennzahlen fehlen").toHaveLength(2);

  await page.goto("/app?demo=1");
  await dismissConsent(page);
  const appFormula = page.getByTestId("solution-formula-intermediate");
  await expect(appFormula).toBeVisible({ timeout: 15_000 });

  // Formel: identisch, Zeichen für Zeichen (nur Leerraum normalisiert).
  expect(norm(await appFormula.innerText())).toBe(heroFormula);
  // Und die beiden Kennzahlen daneben ebenso — die Abweichung 0,972/0,860 gegen
  // 0,809/0,581 war der eigentliche Schaden.
  expect(numbers(await page.getByTestId("solution-kpis-intermediate").innerText())).toEqual(
    heroNumbers,
  );
});

/**
 * A2.21 — Die didaktische Falle des Schnellpfads ist markiert.
 *
 * Beim Import setzt die App die Anker automatisch auf die 10./50./90. Perzentile.
 * Datengetriebene Schwellen sind in der QCA-Methodik KEINE Begründung. Seit
 * Ergebnisse sofort erscheinen, käme man sonst in zwei Klicks zu einer
 * Lösungsformel aus unbegründeten Ankern. Geprüft wird deshalb: Die Herkunft ist
 * ausgewiesen, verschwindet beim Anfassen eines Ankers, und die Ergebniskarten
 * tragen die „vorläufig"-Marke, solange nicht dokumentiert ist.
 */
test("A2.21 Anker-Herkunft und Vorläufig-Marke am Ergebnis", async ({ page }) => {
  await loadRawRohwerte(page);

  // 1. Herkunft der automatischen Anker ist sichtbar.
  const origin = page.getByTestId("calibration-quick-origin-BIP_pKopf");
  await expect(origin).toBeVisible();
  await expect(origin).toContainText(/Perzentil/i);

  // 2. Die Ergebniskarten weisen sich als vorläufig aus — dort entstehen
  //    Screenshots, nicht am Export.
  await expect(page.getByTestId("provisional-result-mark").first()).toBeVisible();
  expect(await page.getByTestId("provisional-result-mark").count()).toBeGreaterThanOrEqual(2);

  // 3. Sobald ein Anker angefasst wird, ist er eine eigene Entscheidung —
  //    der Herkunftshinweis verschwindet.
  const anchor = page.getByTestId("calibration-quick-anchor-BIP_pKopf-crossover");
  await anchor.fill("640");
  await expect(origin).toHaveCount(0);

  // Die Vorläufig-Marke bleibt: Anker gesetzt ≠ Kalibrierung dokumentiert.
  await expect(page.getByTestId("provisional-result-mark").first()).toBeVisible();
});

/**
 * A2.22 — Die drei Methodenlücken, die eine publikationsfähige Analyse blockierten,
 * sind an der Oberfläche angekommen:
 *
 *  1. **Notwendigkeit von Disjunktionen (SUIN) + RoN** — die Einzelbedingungs-Tabelle
 *     allein übersieht Fälle, in denen erst `X + Z` notwendig ist. Die Werte stammen
 *     aus der R-kreuzvalidierten Engine (`nec_fuzzy_*`-Szenarien, VALIDATION.md).
 *  2. **Fall-Diagnostik je Lösungspfad** (Schneider & Rohlfing) — ohne sie ist eine
 *     Lösung nur halb interpretierbar.
 *  3. **XY-Plot für Lösungsterme** — der in Aufsätzen abgebildete Suffizienz-Plot
 *     zeigt den Pfad, nicht eine Einzelbedingung.
 *
 * Der Fuzzy-Beispieldatensatz ist bereits kalibriert und liefert deshalb feste,
 * prüfbare Werte: `BILDUNG + STAATSKAPAZITAET` ist notwendig (Konsistenz 0,965),
 * die intermediäre Lösung lautet `STAATSKAPAZITAET + BILDUNG`, und `Fall_11`
 * widerspricht dem Pfad `BILDUNG` der Art nach (X > 0,5, Y ≤ 0,5).
 */
test("A2.22 SUIN/RoN, Fall-Diagnostik und Pfad-XY-Plot", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await loadExample(page, /Fuzzy-Sets Beispiel/);

  // 1a. Die Einzelbedingungs-Tabelle weist RoN aus.
  await expect(page.getByRole("columnheader", { name: "RoN" }).first()).toBeVisible();

  // 1b. Notwendige Disjunktion mit ihren drei Kennzahlen.
  const suin = page.locator("#suin");
  await expect(suin).toBeVisible({ timeout: 15_000 });
  // Der Befund steht vor dem Material; die Tabelle liegt darunter im Aufklapper.
  await expect(page.getByTestId("suin-finding")).toContainText("RoN");
  await suin.locator("summary").first().click();
  const suinTable = page.getByTestId("suin-table");
  await expect(suinTable).toBeVisible();
  // Nach RoN absteigend sortiert: die erste Zeile trägt den höchsten Wert.
  const ronValues = await suinTable
    .locator("tbody tr td:last-child")
    .allTextContents();
  const asNumbers = ronValues.map((v) => Number(v.replace(",", ".")));
  expect(
    asNumbers.every((v, i) => i === 0 || asNumbers[i - 1] >= v),
    `RoN-Spalte muss absteigend sortiert sein: ${ronValues.join(", ")}`,
  ).toBe(true);
  const row = suinTable.locator("tr", { hasText: "BILDUNG + STAATSKAPAZITAET" }).first();
  await expect(row).toContainText("Disjunktion");
  await expect(row).toContainText("0,965"); // inclN
  await expect(row).toContainText("0,904"); // covN
  await expect(row).toContainText("0,857"); // RoN

  // 2. Fall-Diagnostik an der intermediären Lösungskarte: Fall_11 widerspricht
  //    dem Pfad BILDUNG der Art nach, Fall_13 nur dem Grad nach.
  const diagnostics = page.getByTestId("case-diagnostics-intermediate");
  await expect(diagnostics).toBeVisible();
  await expect(diagnostics).toContainText("Typisch");
  await expect(diagnostics).toContainText("Fall_11");
  await expect(diagnostics).toContainText("Fall_13");
  // Kein Fall mit Outcome > 0,5 bleibt ungedeckt: die deviant-coverage-Zeile wird
  // nur ausgegeben, wenn es solche Fälle gibt — hier darf sie also fehlen.
  // (Dass die Zeile bei ungedeckten Fällen tatsächlich erscheint, prüft der
  //  Engine-Test „caseDiagnostics: deviant coverage nur für ungedeckte Outcome-Fälle".)
  await expect(diagnostics).not.toContainText("deviant coverage");

  // 3. XY-Plot: Umschalten von Einzelbedingung auf Lösungspfad.
  const source = page.getByTestId("xy-source");
  await expect(source).toBeVisible();
  await expect(page.getByTestId("xy-path-hint")).toHaveCount(0);
  const pathOption = source.locator("optgroup[label='Lösungspfade (intermediär)'] option").first();
  const pathValue = await pathOption.getAttribute("value");
  expect(pathValue, "Der XY-Plot muss Lösungspfade zur Wahl stellen").toBeTruthy();
  await source.selectOption(pathValue!);
  await expect(page.getByTestId("xy-path-hint")).toBeVisible();

  // Die Gesamtlösung ist ebenfalls wählbar — dort trägt die X-Achse sichtbar den
  // ganzen Lösungsterm statt einer Einzelbedingung.
  await source.selectOption("solution");
  await expect(page.locator("#xyplot svg[role='img']").first()).toHaveAttribute(
    "aria-label",
    /STAATSKAPAZITAET \+ BILDUNG \(X\)/,
  );

  expect(pageErrors, `Pageerrors: ${pageErrors.join(" | ")}`).toEqual([]);
});

/**
 * A2.23 — Die neuen Flächen (SUIN-Tabelle, Fall-Diagnostik, XY-Auswahl) dürfen die
 * Seite auf 390px nicht sprengen. A3.2 prüft die Routen im leeren Zustand; hier wird
 * mit geladenem Datensatz gemessen, und zwar mit Reserve statt auf Kante.
 */
test.describe("A2.23 mobile @390", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("A2.23 kein horizontaler Overflow mit geladener Analyse", async ({ page }) => {
    await loadExample(page, /Fuzzy-Sets Beispiel/);
    await expect(page.locator("#suin")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("case-diagnostics-intermediate")).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "Horizontaler Seiten-Overflow bei 390px").toBeLessThanOrEqual(0);

    // Reserve: kein sichtbares Element ragt über die Viewport-Breite − 10px hinaus.
    // Ausgenommen sind bewusst scrollbare Container (overflow-x: auto), in denen
    // breite Tabellen zulässig sind.
    // Reserve, gemessen an den NEUEN Flächen: kein Element der SUIN-Karte, der
    // Fall-Diagnostik oder der XY-Karte reicht näher als 10px an den rechten
    // Viewport-Rand. Breite Tabellen dürfen dabei in ihrem eigenen
    // Scroll-Container liegen (overflow-x: auto) — genau dafür ist er da.
    const offenders = await page.evaluate(() => {
      const limit = document.documentElement.clientWidth - 10;
      const insideScroller = (node: HTMLElement, root: HTMLElement): boolean => {
        for (let el: HTMLElement | null = node; el && el !== root.parentElement; el = el.parentElement) {
          const ox = getComputedStyle(el).overflowX;
          if (ox === "auto" || ox === "scroll") return true;
        }
        return false;
      };
      const roots = [
        document.querySelector<HTMLElement>("#suin"),
        document.querySelector<HTMLElement>("[data-testid='case-diagnostics-intermediate']"),
        document.querySelector<HTMLElement>("#xyplot"),
      ].filter((el): el is HTMLElement => !!el);
      const worst: { tag: string; right: number }[] = [];
      for (const root of roots) {
        for (const el of [root, ...Array.from(root.querySelectorAll<HTMLElement>("*"))]) {
          const style = getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") continue;
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (rect.right <= limit) continue;
          if (insideScroller(el, root)) continue;
          worst.push({ tag: `${el.tagName}.${el.className || "-"}`.slice(0, 80), right: rect.right });
        }
      }
      return worst.slice(0, 5);
    });
    expect(offenders, `Elemente über der 10px-Reserve: ${JSON.stringify(offenders)}`).toEqual([]);
  });
});
