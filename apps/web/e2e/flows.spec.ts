import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { loadDemo, loadExample, loadRawRohwerte } from "./helpers";

/**
 * A2.2–A2.4, A2.7 — Funktionale Kern-Flüsse: Demo, Crisp-/Fuzzy-Beispiel und
 * Rollen-Wechsel.
 */

test("A2.2 Demo — komplexe Lösung enthält WOHLSTAND*URBAN*BILDUNG", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await loadDemo(page);

  await expect(page.getByText(/WOHLSTAND\*URBAN\*BILDUNG/).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Rohdaten als CSV herunterladen" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Bericht erzeugen (Druck/PDF)" })).toBeDisabled();
  expect(pageErrors, pageErrors.join(" | ")).toEqual([]);
});

test("A2.3 Crisp-Beispiel — FOERDERUNG Min 0 / Max 1, bereits kalibriert", async ({ page }) => {
  await loadExample(page, /Crisp-Sets Beispiel/);

  // Deskriptivstatistik-Zeile FOERDERUNG: Minimum 0, Maximum 1 (als 0,000 / 1,000 gerendert).
  const row = page.locator("#deskriptiv tbody tr").filter({ hasText: "FOERDERUNG" });
  await expect(row).toBeVisible();
  const cells = row.getByRole("cell");
  await expect(cells.nth(2), "Minimum FOERDERUNG").toHaveText(/^0(,0+)?$/);
  await expect(cells.nth(5), "Maximum FOERDERUNG").toHaveText(/^1(,0+)?$/);

  // Crisp-Sets brauchen keine Kalibrierung.
  await expect(page.getByTestId("calibration-active-context")).toContainText(/bereits kalibriert/);
});

test("A2.4 Fuzzy-Beispiel — WOHLSTAND Min 0,100 / Max 0,900", async ({ page }) => {
  await loadExample(page, /Fuzzy-Sets Beispiel/);

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
  await page.getByRole("button", { name: /Lehr-Seed anwenden/ }).click();

  const methodConfirm = page.locator('[data-testid="calibration-method-confirm"]');
  await expect(methodConfirm).toBeVisible();
  await expect(methodConfirm).toBeEnabled();
  const definition = page.locator("#kalibrierung textarea").first();
  await expect(definition).toBeEnabled();
  const originalDefinition = await definition.inputValue();
  await definition.fill(`${originalDefinition} (edited)`);
  await expect(definition).toHaveValue(`${originalDefinition} (edited)`);
  await expect(page.locator("#notwendigkeit")).toContainText("gesperrt");
  await expect(page.locator("#truthtable")).toContainText("gesperrt");
  await expect(page.locator("#robustheit")).toContainText("Erst Truth Table");
  await expect(page.locator("#robustheit button")).toHaveCount(0);
});

test("A2.12 Raw calibration — crisp, fuzzy, outcome, cases, sensitivity and protocol", async ({
  page,
}) => {
  await loadRawRohwerte(page);
  await page.getByRole("button", { name: /Lehr-Seed anwenden/ }).click();
  await expect(page.getByTestId("calibration-progress")).toBeVisible();
  await expect(page.getByTestId("calibration-progress")).not.toContainText("6 von 6");
  await expect(page.locator("#notwendigkeit")).toContainText("gesperrt");

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
  await page.getByRole("button", { name: /INDUSTRIEANTEIL/ }).click();
  await expect(page.getByTestId("calibration-method-crisp")).toBeVisible();
  await expect(page.getByTestId("calibration-mapping-crisp")).toBeVisible();
  await expect(page.getByTestId("calibration-crisp-threshold")).toBeVisible();
  await completeCurrentVariable(["set", "method", "threshold"]);

  // A second fuzzy condition uses the independently validated piecewise-linear path.
  await page.getByRole("button", { name: /ALPHABETISIERUNG/ }).click();
  await page.getByTestId("calibration-method-linear").click();
  await expect(page.getByTestId("calibration-mapping-linear")).toBeVisible();
  await expect(page.getByTestId("calibration-mapping-direct")).toHaveCount(0);
  await completeCurrentVariable(["set", "method", "fullOut", "crossover", "fullIn"]);

  // Outcome calibration remains a separate set decision and keeps its own
  // direct-fuzzy anchors and sensitivity interpretation.
  await page.getByRole("button", { name: /DEMOKRATIE_INDEX/ }).click();
  await expect(page.getByTestId("calibration-set-role")).toHaveText(/Outcome/);
  await expect(page.getByTestId("calibration-mapping-direct")).toBeVisible();
  await expect(page.getByText(/keinen universellen „guten Outcome-Wert/)).toBeVisible();
  await expect(page.getByText(/Outcome-Zugehörigkeit ≠ Analyse-Cutoffs/)).toBeVisible();
  await completeCurrentVariable(["set", "method", "fullOut", "crossover", "fullIn"]);

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
  expect(markdownText).toContain("A Robustness Test for Qualitative Comparative Analysis (QCA)");
  expect(markdownFile.suggestedFilename()).toBe("openqca-calibration-protocol.md");

  const germanReportPopup = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Bericht erzeugen (Druck/PDF)" }).click();
  const germanReportPage = await germanReportPopup;
  await germanReportPage.waitForLoadState();
  await expect(germanReportPage.locator("html")).toHaveAttribute("lang", "de");
  await expect(germanReportPage.locator("body")).toContainText("openQCA — Analysebericht");
  await germanReportPage.close();

  await page.getByRole("banner").getByRole("button", { name: "EN", exact: true }).click();
  const reportPopup = page.waitForEvent("popup");
  await page.getByRole("button", { name: /Generate report/i }).click();
  const reportPage = await reportPopup;
  await reportPage.waitForLoadState();
  await expect(reportPage.locator("html")).toHaveAttribute("lang", "en");
  await expect(reportPage.locator("body")).toContainText("openQCA — Analysis report");
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
  await page.getByRole("button", { name: /Lehr-Seed anwenden/ }).click();

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
  await page.getByRole("button", { name: /Lehr-Seed anwenden/ }).click();
  await page.getByTestId("calibration-missing-policy").selectOption("leave_unresolved");
  await expect(page.getByTestId("calibration-evidence-row-0")).toContainText(/Illustrative teaching seed/i);

  await page.getByRole("button", { name: "Projekt lokal speichern" }).click();
  await expect(page.getByText("Lokal gespeichert.")).toBeVisible();
  await page.reload();

  await expect(page.getByTestId("calibration-variable-BIP_pKopf")).toBeVisible();
  await expect(page.getByLabel("Set-Bezeichnung")).toHaveValue("Relatively wealthy countries");
  await expect(page.getByTestId("calibration-missing-policy")).toHaveValue("leave_unresolved");
  await expect(page.getByTestId("calibration-evidence-row-0")).toContainText(/Illustrative teaching seed/i);
  await page.evaluate(() => localStorage.removeItem("openqca_local_project"));
});
