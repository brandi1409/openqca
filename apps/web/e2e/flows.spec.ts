import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import {
  DEMO_SOLUTION,
  completeResearchAndAnalysisDecisions,
  expectExportGateClosed,
  expectExportGateOpen,
  loadDemo,
  loadExample,
  loadRawRohwerte,
  openDestination,
  openDocumentationView,
} from "./helpers";

async function seedCalibrationWorkbench(page: Page) {
  await openDocumentationView(page);
  await page.getByRole("button", { name: /Lehrbeispiel übernehmen/ }).click();
  await expect(page.getByTestId("calibration-progress")).toBeVisible();
}

async function completeCurrentCalibration(page: Page, targets: string[]) {
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
  await page.getByTestId("calibration-status").selectOption("sourced");
}

test("demo computes immediately, exposes evidence, and never unlocks defense exports", async ({ page }) => {
  await loadDemo(page);
  await expect(page.getByTestId("solution-formula-intermediate")).toContainText(DEMO_SOLUTION);
  await expect(page.getByText("Synthetisch", { exact: true })).toBeVisible();

  await openDestination(page, "evidence");
  await page.getByText("Truth Table, Remainder und Cutoffs", { exact: true }).click();
  const truthTableEvidence = page.locator("details").filter({ hasText: "Truth Table, Remainder und Cutoffs" });
  await expect(truthTableEvidence.getByRole("heading", { name: "Truth Table" })).toBeVisible();
  await expect(truthTableEvidence.locator("thead th").nth(3)).toHaveText(/^stabil$/i);
  await page.getByText("Alle Lösungen und gleichwertigen Modelle", { exact: true }).click();
  await expect(page.getByTestId("evidence-solution-formula-intermediate")).toContainText(DEMO_SOLUTION);
  await expectExportGateClosed(page);
  await expect(page.getByRole("button", { name: /Bericht erzeugen/ })).toBeEnabled();
});

test("embedded crisp and fuzzy examples remain inspectable in Research design", async ({ page }) => {
  await loadExample(page, /Crisp-Sets Beispiel/);
  await page.getByText("Deskriptivstatistik der aktiven Sets", { exact: true }).click();
  const crispStats = page.locator("details").filter({ hasText: "Deskriptivstatistik der aktiven Sets" });
  await expect(crispStats).toContainText("FOERDERUNG");
  await expect(crispStats).toContainText(/0,000/);

  await expectExportGateClosed(page);
  await expect(page.getByText("Synthetisch", { exact: true })).toBeVisible();
  await loadExample(page, /Fuzzy-Sets Beispiel/);
  await page.getByText("Deskriptivstatistik der aktiven Sets", { exact: true }).click();
  const fuzzyStats = page.locator("details").filter({ hasText: "Deskriptivstatistik der aktiven Sets" });
  await expect(fuzzyStats).toContainText("WOHLSTAND");
  await expect(fuzzyStats).toContainText(/0,100/);
  await expect(fuzzyStats).toContainText(/0,900/);
  await expectExportGateClosed(page);
  await expect(page.getByText("Synthetisch", { exact: true })).toBeVisible();
});

test("role changes preserve exactly one outcome and recompute the answer", async ({ page }) => {
  await loadDemo(page);
  await openDestination(page, "research");
  const roleControls = page.locator("table tbody tr").filter({ has: page.locator("select") }).locator("select");
  await roleControls.nth(1).selectOption("outcome");
  const selectedRoles = await roleControls.evaluateAll((controls) =>
    controls.map((control) => (control as HTMLSelectElement).value),
  );
  expect(selectedRoles.filter((role) => role === "outcome")).toHaveLength(1);
  await openDestination(page, "answer");
  await expect(page.locator(".oq-status-axes")).toBeVisible();
  await expect(page.getByTestId("solution-formula-intermediate")).toBeVisible();
});

test("raw data computes provisionally, report contains no NaN, and R preview stays hidden", async ({
  page,
  context,
}) => {
  await loadRawRohwerte(page);
  await openDestination(page, "answer");
  await expect(page.locator(".oq-status-axes")).toBeVisible();
  await expect(page.getByText("Vorläufig", { exact: true })).toBeVisible();

  await expectExportGateClosed(page);
  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "Bericht erzeugen (Druck/PDF)" }).click();
  const report = await popupPromise;
  await report.waitForLoadState();
  await expect(report.locator("body")).toContainText("Vorläufig");
  await expect(report.locator("body")).not.toContainText("NaN");
  await report.close();
});

test("complete research, calibration, and analysis decisions unlock one shared defense gate", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await loadRawRohwerte(page);
  await seedCalibrationWorkbench(page);
  await completeCurrentCalibration(page, ["set", "method", "fullOut", "crossover", "fullIn"]);

  await page.getByTestId("calibration-variable-INDUSTRIEANTEIL").click();
  await expect(page.getByTestId("calibration-mapping-crisp")).toBeVisible();
  await completeCurrentCalibration(page, ["set", "method", "threshold"]);

  await page.getByTestId("calibration-variable-ALPHABETISIERUNG").click();
  await page.getByTestId("calibration-method-linear").click();
  await completeCurrentCalibration(page, ["set", "method", "fullOut", "crossover", "fullIn"]);

  await page.getByTestId("calibration-variable-DEMOKRATIE_INDEX").click();
  await expect(page.getByTestId("calibration-set-role")).toHaveText(/Outcome/);
  await completeCurrentCalibration(page, ["set", "method", "fullOut", "crossover", "fullIn"]);
  await expect(page.getByTestId("calibration-doc-meter-title")).toContainText(/4 von 4/);
  await completeResearchAndAnalysisDecisions(page);
  await expectExportGateOpen(page);
  const protocol = page.getByTestId("defense-artifacts");
  await expect(protocol.locator("pre")).toContainText("sessionInfo()");
  await expect(protocol.locator("pre")).toContainText("dir_exp <- c(");

  const jsonDownload = page.waitForEvent("download");
  await protocol.getByRole("button", { name: /Protokoll als JSON herunterladen/ }).click();
  const jsonFile = await jsonDownload;
  const jsonPath = await jsonFile.path();
  if (!jsonPath) throw new Error("JSON export path missing");
  const payload = JSON.parse(await readFile(jsonPath, "utf8")) as {
    schemaVersion: number;
    researchBrief: { confirmed: boolean };
    analysis: {
      decisions: Record<string, { rationale: string; confirmed: boolean }>;
      expectations: Record<string, string>;
    };
    analysisResult: {
      status: string;
      caseSummary: { typical: string[]; excludedCases: string[] };
    };
    reproducibility: {
      engine: { package: string; version: string; exact: boolean };
      rawDataFilename: string;
      rScriptFilename: string;
    };
    robustness: { totalCells: number } | null;
    aiWritingProvenance: unknown[];
  };
  expect(payload.schemaVersion).toBe(2);
  expect(payload.researchBrief.confirmed).toBe(true);
  expect(Object.values(payload.analysis.decisions).every((decision) => decision.confirmed)).toBe(true);
  expect(Object.keys(payload.analysis.expectations).length).toBeGreaterThan(0);
  expect(payload.robustness?.totalCells).toBeGreaterThan(0);
  expect(payload.analysisResult.status).toMatch(/^(solution|no_solution)$/);
  expect(Array.isArray(payload.analysisResult.caseSummary.typical)).toBe(true);
  expect(Array.isArray(payload.analysisResult.caseSummary.excludedCases)).toBe(true);
  expect(payload.reproducibility.engine.package).toBe("@openqca/engine");
  expect(payload.reproducibility.engine.exact).toBe(true);
  expect(payload.reproducibility.rawDataFilename).toBe("openqca-raw-data.csv");
  expect(payload.reproducibility.rScriptFilename).toBe("openqca-reproduce.R");
  expect(payload.aiWritingProvenance).toEqual([]);

  await openDestination(page, "decisions");
  await expect(page.locator('[data-testid^="decision-ledger-calibration-"]')).toHaveCount(4);
  await expect(page.getByTestId("decision-ledger-frequencyCutoff")).toContainText(
    "Aktueller Wert: 1",
  );
  await expect(page.getByTestId("decision-ledger-frequencyCutoff")).toContainText("Begründung:");

  await expect.poll(() =>
    page.evaluate(() => {
      const envelope = JSON.parse(localStorage.getItem("openqca_local_project") ?? "null");
      return envelope?.state?.researchBrief?.confirmed === true;
    }),
  ).toBe(true);
  const validEnvelope = await page.evaluate(() =>
    localStorage.getItem("openqca_local_project"),
  );
  if (!validEnvelope) throw new Error("Ready project was not autosaved");
  await page.evaluate(() => {
    const envelope = JSON.parse(localStorage.getItem("openqca_local_project") ?? "null");
    envelope.state.varMeta.BIP_pKopf.role = "outcome";
    localStorage.setItem("openqca_local_project", JSON.stringify(envelope));
  });
  await page.reload();
  await openDestination(page, "answer");
  await page.getByRole("button", { name: "Gespeichertes Projekt laden" }).click();
  await openDestination(page, "defense");
  await expect(
    page.getByTestId("defense-artifacts").getByRole("button", {
      name: /Protokoll als JSON herunterladen/,
    }),
  ).toBeDisabled();

  await page.evaluate((saved) => {
    localStorage.setItem("openqca_local_project", saved);
  }, validEnvelope);
  await page.reload();
  await openDestination(page, "answer");
  await page.getByRole("button", { name: "Gespeichertes Projekt laden" }).click();

  await openDestination(page, "decisions");
  await page.getByTestId("truth-table-consistency-cut").fill("0.81");
  await openDestination(page, "defense");
  await expect(protocol.getByRole("button", { name: /Protokoll als JSON herunterladen/ })).toBeDisabled();
  await expect(page.getByTestId("defense-r-preview")).toHaveCount(0);
});

test("autosave offers an explicit resume candidate and preserves calibration provenance", async ({ page }) => {
  await loadRawRohwerte(page);
  await seedCalibrationWorkbench(page);
  await page.getByTestId("calibration-missing-policy").selectOption("leave_unresolved");
  await openDestination(page, "research");
  await page.getByRole("button", { name: "Projekt lokal speichern" }).click();
  await expect(page.getByText("Lokal gespeichert.")).toBeVisible();

  await page.reload();
  await openDestination(page, "answer");
  await expect(page.getByTestId("research-brief-editor")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Gespeichertes Projekt laden" })).toBeEnabled();
  await page.getByRole("button", { name: "Gespeichertes Projekt laden" }).click();
  await openDocumentationView(page);
  await expect(page.getByLabel("Set-Bezeichnung")).toHaveValue("Relativ wohlhabende Länder");
  await expect(page.getByTestId("calibration-missing-policy")).toHaveValue("leave_unresolved");
  await expect(page.getByTestId("calibration-evidence-row-0")).toContainText(/Illustratives Lehrbeispiel/i);
});

test("progressive evidence keeps SUIN, case diagnostics, path XY, and robustness", async ({ page }) => {
  await loadExample(page, /Fuzzy-Sets Beispiel/);
  await openDestination(page, "evidence");
  await expect(page.getByRole("columnheader", { name: "RoN" }).first()).toBeVisible();
  await expect(page.locator("#suin")).toBeVisible();

  await page.getByText("Alle Lösungen und gleichwertigen Modelle", { exact: true }).click();
  await expect(page.getByTestId("case-diagnostics-intermediate")).toBeVisible();
  await expect(page.getByTestId("xy-source")).toBeVisible();
  await page.getByTestId("xy-source").selectOption({ index: 1 });
  await expect(page.getByTestId("xy-source")).not.toHaveValue("");
  await expect(page.getByText("Robustheit und negiertes Outcome", { exact: true })).toBeVisible();
});
