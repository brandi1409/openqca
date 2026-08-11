import { expect, test } from "@playwright/test";
import { parseAiAssistRequest, parseReviewedSummary, type ReviewedSummary } from "../src/lib/ai-contract";
import { evaluateReviewedSummary, type AiPolicyCode } from "../src/lib/ai-evaluation";
import { isAdoptableDraft } from "../src/lib/ai-reviewed-summary";
import { aiRequestTelemetry } from "../src/lib/ai-telemetry";
import { AI_GOLD_CORPUS_V1 } from "./fixtures/ai-gold-v1";

const distributions = {
  brief_clarify: { ok: 6, incomplete: 6, refusal: 4 },
  calibration_evidence_gaps: { ok: 4, incomplete: 8, refusal: 4 },
  decision_rationale_review: { ok: 6, incomplete: 6, refusal: 4 },
} as const;

test("AI gold corpus has the fixed bilingual task and status distribution", () => {
  expect(AI_GOLD_CORPUS_V1).toHaveLength(48);
  expect(new Set(AI_GOLD_CORPUS_V1.map((item) => item.id)).size).toBe(48);
  for (const task of Object.keys(distributions) as Array<keyof typeof distributions>) {
    const cases = AI_GOLD_CORPUS_V1.filter((item) => item.task === task);
    expect(cases).toHaveLength(16);
    expect(cases.filter((item) => item.locale === "de")).toHaveLength(8);
    expect(cases.filter((item) => item.locale === "en")).toHaveLength(8);
    for (const status of ["ok", "incomplete", "refusal"] as const) {
      expect(cases.filter((item) => item.expectedStatus === status)).toHaveLength(distributions[task][status]);
    }
  }
});

test("every gold request and canonical response passes the closed contracts", () => {
  for (const item of AI_GOLD_CORPUS_V1) {
    const request = parseAiAssistRequest(item.request);
    const summary = parseReviewedSummary(item.canonicalSummary);
    expect(request, item.id).not.toBeNull();
    expect(request?.task, item.id).toBe(item.task);
    expect(request?.locale, item.id).toBe(item.locale);
    expect(summary?.status, item.id).toBe(item.expectedStatus);
    expect(evaluateReviewedSummary(summary), item.id).toEqual({ pass: true, codes: [] });
    expect(summary ? isAdoptableDraft(summary) : false, item.id).toBe(item.expectedStatus === "ok");
  }
});

const violations: Array<{ code: AiPolicyCode; de: string; en: string }> = [
  { code: "numeric-qca", de: "Empfohlener Anker ist 7.", en: "Recommended anchor is 7." },
  { code: "citation-or-source", de: "Laut Studie ist dies belegt.", en: "According to a study this is established." },
  { code: "causal-claim", de: "Dies verursacht das Ergebnis.", en: "This causes the outcome." },
  { code: "raw-or-case-data", de: "Fall-7 enthält Rohwerte.", en: "Case-7 contains raw values." },
  { code: "defense-assertion", de: "Das Projekt ist verteidigungsbereit.", en: "The project is defense-ready." },
  { code: "forbidden-qca-output", de: "Die Wahrheitstabelle bestätigt dies.", en: "The truth table confirms this." },
];

function mutated(field: "draft" | "uncertainty" | "evidenceNeeds" | "limitations", text: string): ReviewedSummary {
  const value: ReviewedSummary = { status: "ok", draft: "Fachlich zu prüfen.", uncertainty: [], evidenceNeeds: [], limitations: [] };
  if (field === "draft") value.draft = text;
  else value[field] = [text];
  return value;
}

test("every bilingual policy family is blocked in every response field", () => {
  for (const violation of violations) {
    for (const text of [violation.de, violation.en]) {
      for (const field of ["draft", "uncertainty", "evidenceNeeds", "limitations"] as const) {
        const evaluation = evaluateReviewedSummary(mutated(field, text));
        expect(evaluation.pass, `${violation.code}:${field}`).toBe(false);
        expect(evaluation.codes, `${violation.code}:${field}`).toContain(violation.code);
      }
    }
  }
});

test("summary status coherence fails closed", () => {
  expect(evaluateReviewedSummary({ status: "ok", draft: "", uncertainty: [], evidenceNeeds: [], limitations: [] }).codes).toContain("status-shape");
  expect(evaluateReviewedSummary({ status: "incomplete", draft: "Needs work", uncertainty: [], evidenceNeeds: [], limitations: [] }).codes).toContain("status-shape");
  expect(evaluateReviewedSummary({ status: "refusal", draft: "Adopt me", uncertainty: [], evidenceNeeds: [], limitations: ["Outside scope"] }).codes).toContain("status-shape");
  expect(evaluateReviewedSummary({ status: "refusal", draft: "", uncertainty: [], evidenceNeeds: [], limitations: [] }).codes).toContain("status-shape");
});

test("forbidden request-shape mutations are rejected", () => {
  const base = AI_GOLD_CORPUS_V1[0].request;
  const mutations: unknown[] = [
    { ...base, rows: [] },
    { ...base, case: "hidden" },
    { ...base, locale: "fr" },
    { ...base, task: "freeform" },
    { ...base, payload: { ...base.payload, raw: "hidden" } },
    { ...base, payload: { ...base.payload, cutoff: 1 } },
    { ...base, payload: { ...base.payload, question: "x".repeat(2001) } },
  ];
  for (const mutation of mutations) expect(parseAiAssistRequest(mutation)).toBeNull();
});

test("AI operational telemetry is categorical and content-free", () => {
  const telemetry = aiRequestTelemetry("calibration_evidence_gaps", "returned", 3_200);
  expect(telemetry).toEqual({
    event: "openqca.ai.request.v1",
    task: "calibration_evidence_gaps",
    outcome: "returned",
    duration: "2_to_5s",
  });
  expect(Object.keys(telemetry).sort()).toEqual(["duration", "event", "outcome", "task"]);
});

test("policy gate blocks paraphrases and permits bounded explanations", () => {
  const unsafe: Array<[AiPolicyCode, string]> = [
    ["numeric-qca", "The optimal value is seven."],
    ["numeric-qca", "Der optimale Wert ist sieben."],
    ["numeric-qca", "I cannot recommend an anchor, but the optimal value is seven."],
    ["numeric-qca", "Ich kann keinen Anker empfehlen, aber der optimale Wert ist sieben."],
    ["causal-claim", "This configuration determines the outcome."],
    ["causal-claim", "Diese Konfiguration bestimmt das Ergebnis."],
    ["causal-claim", "This configuration determines the outcome even though I cannot verify it."],
    ["causal-claim", "I cannot verify the source, this configuration determines the outcome."],
    ["defense-assertion", "The project is ready for defense."],
    ["defense-assertion", "Das Projekt ist für die Verteidigung bereit."],
    ["defense-assertion", "Ich kann nicht bestätigen, aber das Projekt ist für die Verteidigung bereit."],
    ["defense-assertion", "The project is ready for defense although I cannot verify it."],
    ["defense-assertion", "I cannot verify the source, the project is ready for defense."],
    ["defense-assertion", "I cannot verify the source, openQCA is defense-ready."],
    ["defense-assertion", "Ich kann nicht prüfen, openQCA ist verteidigungsbereit."],
    ["defense-assertion", "Keine Einschränkung ist bekannt, das Projekt ist verteidigungsbereit."],
    ["forbidden-qca-output", "A*B is sufficient for the outcome."],
    ["forbidden-qca-output", "A*B ist hinreichend für das Ergebnis."],
    ["forbidden-qca-output", "WOHLSTAND*BIP"],
    ["forbidden-qca-output", "wealth*democracy"],
    ["forbidden-qca-output", "~WEALTH*DEMOCRACY"],
    ["forbidden-qca-output", "The expression is (WOHLSTAND*BIP)."],
    ["forbidden-qca-output", "WOHLSTAND + BIP"],
  ];
  for (const [code, text] of unsafe) {
    expect(evaluateReviewedSummary(mutated("draft", text)).codes, text).toContain(code);
  }

  const safe = [
    "The study period is 2020–2024.",
    "Add a peer-reviewed source that supports the construct definition.",
    "I cannot recommend calibration anchors.",
    "I cannot provide a DOI, formula, or truth table.",
    "I cannot discuss Case 7.",
    "I cannot provide a DOI and formula.",
    "A formula cannot be provided.",
    "Case 7 cannot be discussed.",
    "No formula can be provided.",
    "Der Untersuchungszeitraum ist 2020–2024.",
    "Ergänzen Sie eine begutachtete Quelle für die Set-Definition.",
    "Ich kann keine Kalibrierungsanker empfehlen.",
    "Ich kann keine DOI, Formel oder Wahrheitstabelle liefern.",
    "Ich darf Fall 7 nicht besprechen.",
    "Fall 7 darf nicht besprochen werden.",
    "Kein QCA-Modell kann angegeben werden.",
  ];
  for (const text of safe) expect(evaluateReviewedSummary(mutated("limitations", text)), text).toEqual({ pass: true, codes: [] });
});
