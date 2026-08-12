import { expect, test } from "@playwright/test";
import type {
  NecessityEntry,
  NecessityExpressionEntry,
  Solution,
  TruthTableResult,
} from "@openqca/engine";
import {
  buildAiWritingProvenanceEntry,
  verifyAiWritingProvenance,
  sha256Text,
} from "../src/lib/ai-reviewed-summary";
import {
  EMPTY_ANALYSIS_DECISIONS,
  EMPTY_RESEARCH_BRIEF,
  calibrationDefenseReadiness,
  listAiWritingProvenance,
  normalizeSavedState,
  researchBriefReadiness,
  type AiWritingProvenance,
  type VarMeta,
} from "../src/lib/workspace-model";
import type { RawDataset } from "../src/lib/demo";
import { migrateSpecsFromAnchors } from "../src/lib/calibration-model";
import {
  CALIBRATION_PROTOCOL_SCHEMA_VERSION,
  buildCalibrationNarrative,
  buildCalibrationProtocolJson,
  buildRScript,
} from "../src/lib/protocol-export";
import { generateReportHtml } from "../src/lib/report";

const dataset: RawDataset = {
  name: "provenance-fixture",
  caseCol: "case",
  columns: ["case", "A", "Y"],
  rows: [
    { case: "one", A: 1, Y: 1 },
    { case: "two", A: 0, Y: 0 },
  ],
  anchors: { A: [0, 0.5, 1], Y: [0, 0.5, 1] },
};

const varMeta: Record<string, VarMeta> = {
  A: { type: "fuzzy", role: "condition" },
  Y: { type: "fuzzy", role: "outcome" },
};

const brief = {
  ...EMPTY_RESEARCH_BRIEF,
  question: "How do selected cases differ?",
};

const decisions = {
  frequencyCutoff: { ...EMPTY_ANALYSIS_DECISIONS.frequencyCutoff },
  consistencyCutoff: { ...EMPTY_ANALYSIS_DECISIONS.consistencyCutoff },
  directionalExpectations: { ...EMPTY_ANALYSIS_DECISIONS.directionalExpectations },
};

async function provenanceFixture(): Promise<AiWritingProvenance> {
  const question = await buildAiWritingProvenanceEntry(
    {
      provider: "mock",
      model: "test-model",
      generatedAt: "2026-08-11T10:00:00.000Z",
    },
    "Original private research text",
    "Adopted private research text",
  );
  return {
    brief_clarify: { question },
    calibration_evidence_gaps: {},
    decision_rationale_review: {},
  };
}

test("AI writing provenance stores bounded metadata and hashes, never source text", async () => {
  const provenance = await provenanceFixture();
  const rows = listAiWritingProvenance(provenance, varMeta);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    task: "brief_clarify",
    target: "researchBrief.question",
    provider: "mock",
    model: "test-model",
    generatedAt: "2026-08-11T10:00:00.000Z",
  });
  expect(rows[0].previousTextHash).toMatch(/^[a-f0-9]{64}$/);
  expect(rows[0].adoptedTextHash).toMatch(/^[a-f0-9]{64}$/);
  expect(rows[0].previousTextHash).not.toBe(rows[0].adoptedTextHash);
  expect(JSON.stringify(rows)).not.toContain("Original private research text");
  expect(JSON.stringify(rows)).not.toContain("Adopted private research text");
  expect(provenance.brief_clarify.question?.hashSalt).toMatch(/^[a-f0-9]{32}$/);
  expect(rows[0]).not.toHaveProperty("hashSalt");
  expect(rows[0].adoptedTextHash).not.toBe(
    await sha256Text("Adopted private research text"),
  );
});

test("exported calibration provenance uses a generic target and omits its private salt", async () => {
  const entry = await buildAiWritingProvenanceEntry(
    {
      provider: "mock",
      model: "test-model",
      generatedAt: "2026-08-11T10:00:00.000Z",
    },
    "Previous definition",
    "Adopted definition",
  );
  const rows = listAiWritingProvenance(
    {
      brief_clarify: {},
      calibration_evidence_gaps: { "participant-email@example.test": entry },
      decision_rationale_review: {},
    },
    varMeta,
  );
  expect(rows).toEqual([
    {
      task: "calibration_evidence_gaps",
      target: "calibrationDefinition.1",
      provider: "mock",
      model: "test-model",
      generatedAt: "2026-08-11T10:00:00.000Z",
      previousTextHash: entry.previousTextHash,
      adoptedTextHash: entry.adoptedTextHash,
    },
  ]);
  expect(JSON.stringify(rows)).not.toContain("participant-email@example.test");
  expect(JSON.stringify(rows)).not.toContain(entry.hashSalt);
});

test("parked calibration provenance returns when an ignored set is reactivated", async () => {
  const entry = await buildAiWritingProvenanceEntry(
    {
      provider: "mock",
      model: "test-model",
      generatedAt: "2026-08-11T10:00:00.000Z",
    },
    "Previous definition",
    "Adopted definition",
  );
  const provenance: AiWritingProvenance = {
    brief_clarify: {},
    calibration_evidence_gaps: { A: entry },
    decision_rationale_review: {},
  };
  const ignoredVarMeta: Record<string, VarMeta> = {
    ...varMeta,
    A: { ...varMeta.A, role: "ignore" },
  };
  expect(listAiWritingProvenance(provenance, ignoredVarMeta)).toEqual([]);

  const calibSpecs = migrateSpecsFromAnchors(["A", "Y"], dataset.anchors);
  calibSpecs.A = {
    ...calibSpecs.A,
    set: { ...calibSpecs.A.set, definition: "Adopted definition" },
  };
  const reloadedIgnored = normalizeSavedState({
    dataset,
    anchors: dataset.anchors,
    varMeta: ignoredVarMeta,
    calibSpecs,
    demoMode: false,
    freqCut: 1,
    consCut: 0.8,
    expectations: {},
    researchBrief: brief,
    analysisDecisions: decisions,
    aiWritingProvenance: provenance,
  });
  expect(reloadedIgnored).not.toBeNull();
  const verifiedParked = await verifyAiWritingProvenance(reloadedIgnored!);
  expect(verifiedParked.calibration_evidence_gaps.A).toEqual(entry);
  expect(listAiWritingProvenance(verifiedParked, ignoredVarMeta)).toEqual([]);

  const reloadedActive = normalizeSavedState({
    ...reloadedIgnored!,
    varMeta,
  });
  expect(reloadedActive).not.toBeNull();
  const verifiedActive = await verifyAiWritingProvenance(reloadedActive!);
  expect(listAiWritingProvenance(verifiedActive, varMeta)).toEqual([
    {
      task: "calibration_evidence_gaps",
      target: "calibrationDefinition.1",
      provider: "mock",
      model: "test-model",
      generatedAt: "2026-08-11T10:00:00.000Z",
      previousTextHash: entry.previousTextHash,
      adoptedTextHash: entry.adoptedTextHash,
    },
  ]);
});
test("saved-state normalization preserves valid provenance and drops malformed entries", async () => {
  const provenance = await provenanceFixture();
  const baseState = {
    dataset,
    anchors: dataset.anchors,
    varMeta,
    calibSpecs: {},
    demoMode: false,
    freqCut: 1,
    consCut: 0.8,
    expectations: { A: "present" as const },
    researchBrief: brief,
    analysisDecisions: decisions,
  };
  const normalized = normalizeSavedState({ ...baseState, aiWritingProvenance: provenance });
  expect(normalized?.aiWritingProvenance).toEqual(provenance);

  const malformed = normalizeSavedState({
    ...baseState,
    aiWritingProvenance: {
      ...provenance,
      brief_clarify: {
        question: {
          ...provenance.brief_clarify.question,
          adoptedTextHash: "not-a-hash",
        },
      },
    },
  });
  expect(malformed?.aiWritingProvenance.brief_clarify).toEqual({});
});

test("saved-state normalization makes malformed calibration records safe and unresolved", () => {
  const normalized = normalizeSavedState({
    dataset,
    anchors: {},
    varMeta,
    calibSpecs: {
      A: {
        set: null,
        evidence: [{ citation: null }],
        missing: { kind: "assign", membership: 0.5 },
      },
    },
    demoMode: false,
    freqCut: 1,
    consCut: 0.8,
    expectations: { A: "present" },
    researchBrief: brief,
    analysisDecisions: decisions,
  });
  expect(normalized).not.toBeNull();
  expect(normalized?.calibSpecs.A.set).toMatchObject({
    setLabel: "",
    definition: "",
    highIsMembership: true,
  });
  expect(normalized?.calibSpecs.A.evidence).toEqual([]);
  expect(normalized?.calibSpecs.A.missing).toEqual({ kind: "exclude_case" });
  expect(() =>
    calibrationDefenseReadiness(
      ["A", "Y"],
      normalized!.varMeta,
      normalized!.calibSpecs,
    ),
  ).not.toThrow();
  expect(
    calibrationDefenseReadiness(
      ["A", "Y"],
      normalized!.varMeta,
      normalized!.calibSpecs,
    ).ready,
  ).toBe(false);
});

test("research brief requires exactly one selected outcome", () => {
  const completeBrief = {
    question: "Which configurations explain Y?",
    caseUniverse: "Compared cases",
    timePeriod: "2020–2024",
    outcomeConcept: "Membership in Y",
    conditionSelectionRationale: "A follows the comparison design.",
    confirmed: true,
  };
  expect(researchBriefReadiness(completeBrief, ["A"], ["Y"]).ready).toBe(true);
  expect(researchBriefReadiness(completeBrief, ["A"], ["Y", "Z"])).toMatchObject({
    ready: false,
    missing: ["outcome"],
  });
});

test("loaded provenance survives only while its adopted hash matches the target field", async () => {
  const mismatched = await provenanceFixture();
  const baseState = normalizeSavedState({
    dataset,
    anchors: dataset.anchors,
    varMeta,
    calibSpecs: {},
    demoMode: false,
    freqCut: 1,
    consCut: 0.8,
    expectations: { A: "present" as const },
    researchBrief: brief,
    analysisDecisions: decisions,
    aiWritingProvenance: mismatched,
  });
  expect(baseState).not.toBeNull();
  expect((await verifyAiWritingProvenance(baseState!)).brief_clarify).toEqual({});

  const matchingQuestion = await buildAiWritingProvenanceEntry(
    {
      provider: "mock",
      model: "test-model",
      generatedAt: "2026-08-11T10:00:00.000Z",
    },
    "Original question",
    brief.question,
  );
  const matchingState = {
    ...baseState!,
    aiWritingProvenance: {
      ...mismatched,
      brief_clarify: { question: matchingQuestion },
    },
  };
  expect((await verifyAiWritingProvenance(matchingState)).brief_clarify.question).toEqual(
    matchingQuestion,
  );
});

test("JSON, Markdown, and report exports disclose adopted AI writing provenance", async () => {
  const aiWritingProvenance = await provenanceFixture();
  const complex: Solution = { type: "complex", models: [] };
  const intermediate: Solution = { type: "intermediate", models: [] };
  const parsimonious: Solution = { type: "parsimonious", models: [] };
  const protocolNecessity: NecessityEntry[] = [{
    condition: "A",
    consistency: 1,
    coverage: 1,
    relevance: 1,
    isCandidate: true,
  }];
  const protocolNecessitySupersets: NecessityExpressionEntry[] = [{
    kind: "conjunction",
    literals: ["A"],
    expression: "A",
    consistency: 1,
    coverage: 1,
    relevance: 1,
  }];
  const commonProtocol = {
    ds: dataset,
    calibSpecs: {},
    varMeta,
    conditions: ["A"],
    outcome: "Y",
    freqCut: 1,
    consCut: 0.8,
    researchBrief: brief,
    analysisDecisions: decisions,
    expectations: { A: "present" as const },
    aiWritingProvenance,
    solutions: { complex, intermediate, parsimonious },
    necessity: protocolNecessity,
    necessitySupersets: protocolNecessitySupersets,
  };
  const protocol = buildCalibrationProtocolJson(commonProtocol);
  const protocolJson = JSON.stringify(protocol);
  expect(protocol).toMatchObject({
    protocolSchemaVersion: CALIBRATION_PROTOCOL_SCHEMA_VERSION,
    aiWritingProvenance: [
      {
        task: "brief_clarify",
        target: "researchBrief.question",
        provider: "mock",
        model: "test-model",
      },
    ],
  });
  expect(CALIBRATION_PROTOCOL_SCHEMA_VERSION).toBe(3);
  expect(protocol).toMatchObject({
    analysis: {
      results: {
        solutions: {
          complex: { status: "no_solution", models: [] },
          intermediate: { status: "no_solution", models: [] },
          parsimonious: { status: "no_solution", models: [] },
        },
        necessity: [{ condition: "A", isCandidate: true }],
        necessitySupersets: [{ expression: "A", kind: "conjunction" }],
      },
    },
  });
  expect(protocolJson).not.toContain("Original private research text");
  expect(protocolJson).not.toContain("Adopted private research text");

  const markdown = buildCalibrationNarrative({ ...commonProtocol, locale: "en" });
  expect(markdown).toContain("## Adopted AI writing provenance");
  expect(markdown).toContain("mock / test-model");
  expect(markdown).toContain(
    listAiWritingProvenance(aiWritingProvenance, varMeta)[0].adoptedTextHash,
  );
  expect(markdown).toContain("## Analysis results");
  expect(markdown).toContain("No sufficient solution under the current cutoffs.");
  expect(markdown).toContain("### Necessity checks");
  expect(markdown).toContain("| A | 1.000 | 1.000 | 1.000 | yes |");

  const rScript = buildRScript(commonProtocol);
  expect(rScript).toContain("Adopted AI writing provenance:");
  expect(rScript).toContain("mock / test-model");
  expect(rScript).toContain(
    listAiWritingProvenance(aiWritingProvenance, varMeta)[0].adoptedTextHash,
  );
  expect(rScript).not.toContain("Original private research text");
  expect(rScript).not.toContain("Adopted private research text");
  expect(rScript).toContain("minimize_if_positive <- function(tt, label, ...)");
  expect(rScript).toContain(
    'pof(necessity_memberships[[necessity_label]], outcome = analysis_qca[["qca_outcome"]], relation = "necessity")',
  );
  expect(rScript).toContain(
    'superSubset(analysis_qca, outcome = "qca_outcome", conditions = c("qca_condition_1"), relation = "necessity", incl.cut = 0.9, cov.cut = 0.5, depth = 1',
  );
  expect(rScript).toContain('df[["A"]] <- parse_openqca_number(df[["A"]])');
  expect(rScript).toContain('df[["Y"]] <- parse_openqca_number(df[["Y"]])');
  const alreadyCalibratedSpec = (column: string) => ({
    column,
    set: {
      setLabel: column,
      definition: "Recorded membership",
      unit: "membership",
      scopePopulation: "fixture",
      timePeriod: "2020",
      highIsMembership: false,
      notes: "",
    },
    alreadyCalibratedProvenance: "Imported membership scores",
    missing: { kind: "exclude_case" as const },
    evidence: [],
    status: "provisional" as const,
    methodConfirmed: true,
    caseReviewConfirmed: true,
    exceptionalCases: [],
    sensitivity: { alternatives: [], notes: "", reviewed: true },
  });
  const invertedNumericStringScript = buildRScript({
    ...commonProtocol,
    ds: {
      name: "numeric-strings.csv",
      caseCol: "Case",
      columns: ["Case", "A", "Y"],
      anchors: {},
      rows: [
        { Case: "one", A: "0,7", Y: "0,8" },
        { Case: "two", A: "0,2", Y: "0,1" },
      ],
    },
    calibSpecs: {
      A: alreadyCalibratedSpec("A"),
      Y: alreadyCalibratedSpec("Y"),
    },
    varMeta: {
      A: { type: "fuzzy", role: "condition" },
      Y: { type: "fuzzy", role: "outcome" },
    },
  });
  expect(invertedNumericStringScript.indexOf('df[["A"]] <- parse_openqca_number'))
    .toBeLessThan(invertedNumericStringScript.indexOf('df[["A"]] <- 1 - df[["A"]]'));
  const spacedScript = buildRScript({
    ...commonProtocol,
    ds: {
      name: "spaced-columns",
      caseCol: "Case label",
      columns: ["Case label", "Economic Development", "Outcome Result"],
      anchors: {},
      rows: [
        { "Case label": "one", "Economic Development": 1, "Outcome Result": 1 },
        { "Case label": "two", "Economic Development": 0, "Outcome Result": 0 },
      ],
    },
    varMeta: {
      "Economic Development": { type: "fuzzy", role: "condition" },
      "Outcome Result": { type: "fuzzy", role: "outcome" },
    },
    conditions: ["Economic Development"],
    outcome: "Outcome Result",
    expectations: { "Economic Development": "present" },
  });
  expect(spacedScript).toContain(
    'df[["Economic Development"]] <- parse_openqca_number(df[["Economic Development"]])',
  );
  expect(spacedScript).toContain(
    'df[["Outcome Result"]] <- parse_openqca_number(df[["Outcome Result"]])',
  );
  expect(spacedScript).toContain("# QCA-safe alias: qca_condition_1 = Economic Development");
  expect(spacedScript).toContain("# QCA-safe alias: qca_outcome = Outcome Result");
  expect(spacedScript).toContain(
    'necessity_memberships[["~Economic Development"]] <- 1 - analysis_qca[["qca_condition_1"]]',
  );
  expect(spacedScript).toContain(
    'outcome = analysis_qca[["qca_outcome"]], relation = "necessity"',
  );
  expect(spacedScript).not.toContain("pof(necessity_expression");

  const invalidRScript = buildRScript({
    ...commonProtocol,
    varMeta: {
      A: { type: "raw", role: "condition" },
      Y: { type: "raw", role: "outcome" },
    },
    robustness: {
      totalCells: 0,
      baseline: { scenarioId: "base", freqCut: 1, consCut: 0.8, priCut: null },
      cells: [],
      solutionStability: [],
      caseStability: [],
    },
  });
  expect(invalidRScript).toContain(
    "Robustness rerun omitted because the base analysis frame is unavailable.",
  );
  expect(invalidRScript).not.toContain("tt_robust <-");

  const truthTable: TruthTableResult = {
    conditions: ["A"],
    outcome: "Y",
    freqCut: 1,
    consCut: 0.8,
    rows: [{
      index: 1,
      bits: "1",
      n: 1,
      cases: ["one"],
      consistency: 1,
      pri: 1,
      output: 1,
      atCrossover: [],
    }],
    assignedCaseCount: 1,
    totalCaseCount: 2,
  };

  const report = generateReportHtml({
    datasetName: dataset.name,
    caseCount: 2,
    anchors: dataset.anchors,
    calibSpecs: {},
    varMeta,
    conditions: ["A"],
    outcome: "Y",
    freqCut: 1,
    consCut: 0.8,
    tt: truthTable,
    complex,
    intermediate,
    parsimonious,
    necessity: [],
    expectations: { A: "present" },
    researchBrief: brief,
    analysisDecisions: decisions,
    aiWritingProvenance,
    rScript: "",
    locale: "en",
  });
  expect(report).toContain("Adopted AI writing provenance");
  expect(report).toContain("mock / test-model");
  expect(report).toContain(
    listAiWritingProvenance(aiWritingProvenance, varMeta)[0].previousTextHash,
  );
});
