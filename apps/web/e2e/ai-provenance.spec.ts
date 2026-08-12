import { expect, test } from "@playwright/test";
import type { Solution, TruthTableResult } from "@openqca/engine";
import {
  buildAiWritingProvenanceEntry,
  verifyAiWritingProvenance,
} from "../src/lib/ai-reviewed-summary";
import {
  EMPTY_ANALYSIS_DECISIONS,
  EMPTY_RESEARCH_BRIEF,
  listAiWritingProvenance,
  normalizeSavedState,
  type AiWritingProvenance,
  type VarMeta,
} from "../src/lib/workspace-model";
import type { RawDataset } from "../src/lib/demo";
import {
  CALIBRATION_PROTOCOL_SCHEMA_VERSION,
  buildCalibrationNarrative,
  buildCalibrationProtocolJson,
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
  const rows = listAiWritingProvenance(provenance);
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
  expect(protocolJson).not.toContain("Original private research text");
  expect(protocolJson).not.toContain("Adopted private research text");

  const markdown = buildCalibrationNarrative({ ...commonProtocol, locale: "en" });
  expect(markdown).toContain("## Adopted AI writing provenance");
  expect(markdown).toContain("mock / test-model");
  expect(markdown).toContain(listAiWritingProvenance(aiWritingProvenance)[0].adoptedTextHash);

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
  const complex: Solution = { type: "complex", models: [] };
  const intermediate: Solution = { type: "intermediate", models: [] };
  const parsimonious: Solution = { type: "parsimonious", models: [] };
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
  expect(report).toContain(listAiWritingProvenance(aiWritingProvenance)[0].previousTextHash);
});
