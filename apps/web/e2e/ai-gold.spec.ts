import { expect, test } from "@playwright/test";
import {
  AI_CONTRACT_VERSION,
  parseAiAssistRequest,
  parseAiReviewResponse,
  type AiReviewResponse,
  type BriefClarifyRequest,
  type BriefClarifyReview,
  type DecisionRationaleReview,
  type DecisionRationaleReviewRequest,
} from "../src/lib/ai-contract";
import { evaluateAiReviewResponse, type AiPolicyCode } from "../src/lib/ai-evaluation";
import { isAdoptableSuggestion } from "../src/lib/ai-reviewed-summary";
import { aiRequestTelemetry } from "../src/lib/ai-telemetry";
import { AI_GOLD_CORPUS_V2 } from "./fixtures/ai-gold-v2";

const distributions = {
  brief_clarify: { ok: 6, incomplete: 6, refusal: 4 },
  calibration_evidence_gaps: { ok: 4, incomplete: 8, refusal: 4 },
  decision_rationale_review: { ok: 6, incomplete: 6, refusal: 4 },
} as const;

test("AI gold corpus has the fixed bilingual task and status distribution", () => {
  expect(AI_GOLD_CORPUS_V2).toHaveLength(48);
  expect(new Set(AI_GOLD_CORPUS_V2.map((item) => item.id)).size).toBe(48);
  for (const task of Object.keys(distributions) as Array<keyof typeof distributions>) {
    const cases = AI_GOLD_CORPUS_V2.filter((item) => item.task === task);
    expect(cases).toHaveLength(16);
    expect(cases.filter((item) => item.locale === "de")).toHaveLength(8);
    expect(cases.filter((item) => item.locale === "en")).toHaveLength(8);
    for (const status of ["ok", "incomplete", "refusal"] as const) {
      expect(cases.filter((item) => item.expectedStatus === status)).toHaveLength(
        distributions[task][status],
      );
    }
  }
});

test("every gold request and task-specific response passes the closed contracts", () => {
  for (const item of AI_GOLD_CORPUS_V2) {
    const request = parseAiAssistRequest(item.request);
    expect(request, item.id).not.toBeNull();
    if (!request) continue;
    const review = parseAiReviewResponse(item.canonicalReview, request);
    expect(request.task, item.id).toBe(item.task);
    expect(request.locale, item.id).toBe(item.locale);
    expect(review?.status, item.id).toBe(item.expectedStatus);
    expect(evaluateAiReviewResponse(item.canonicalReview, request), item.id).toEqual({
      pass: true,
      codes: [],
    });
    expect(review ? isAdoptableSuggestion(review) : false, item.id).toBe(
      item.expectedStatus === "ok",
    );
  }
});

const policyRequest: BriefClarifyRequest = {
  version: AI_CONTRACT_VERSION,
  task: "brief_clarify",
  locale: "en",
  payload: {
    question: "How do selected municipalities differ?",
    caseUniverse: "Selected municipalities",
    timePeriod: "Most recently completed planning period",
    outcomeConcept: "Institutional resilience",
    conditionSelectionRationale: "Theory-led organizational conditions",
  },
};

const violations: Array<{ code: AiPolicyCode; de: string; en: string }> = [
  { code: "numeric-qca", de: "Empfohlener Anker ist 7.", en: "Recommended anchor is 7." },
  { code: "role-selection", de: "Wähle Outcome als Rolle.", en: "Choose outcome as the role." },
  { code: "citation-or-source", de: "Laut Studie ist dies belegt.", en: "According to a study this is established." },
  { code: "causal-claim", de: "Dies verursacht das Ergebnis.", en: "This causes the outcome." },
  { code: "raw-or-case-data", de: "Fall-7 enthält Rohwerte.", en: "Case-7 contains raw values." },
  { code: "defense-assertion", de: "Das Projekt ist verteidigungsbereit.", en: "The project is defense-ready." },
  { code: "forbidden-qca-output", de: "Die Wahrheitstabelle bestätigt dies.", en: "The truth table confirms this." },
];

type ResponseField =
  | "review"
  | "suggestion"
  | "uncertainty"
  | "evidenceNeeds"
  | "limitations";

function mutated(field: ResponseField, text: string): BriefClarifyReview {
  return {
    task: "brief_clarify",
    status: "ok",
    review: field === "review" ? text : "The question is bounded and ready for review.",
    suggested: {
      question: field === "suggestion" ? text : "How do selected municipalities differ?",
    },
    uncertainty: field === "uncertainty" ? [text] : [],
    evidenceNeeds: field === "evidenceNeeds" ? [text] : [],
    limitations: field === "limitations" ? [text] : [],
  };
}

test("every bilingual policy family is blocked in every response field", () => {
  for (const violation of violations) {
    for (const text of [violation.de, violation.en]) {
      for (const field of [
        "review",
        "suggestion",
        "uncertainty",
        "evidenceNeeds",
        "limitations",
      ] as const) {
        const evaluation = evaluateAiReviewResponse(mutated(field, text), policyRequest);
        expect(evaluation.pass, `${violation.code}:${field}`).toBe(false);
        expect(evaluation.codes, `${violation.code}:${field}`).toContain(violation.code);
      }
    }
  }
});

test("response status coherence fails closed", () => {
  const okWithoutSuggestion: AiReviewResponse = {
    ...mutated("review", "Bounded review."),
    suggested: { question: "" },
  };
  const incompleteWithSuggestion: AiReviewResponse = {
    ...mutated("review", "Needs work."),
    status: "incomplete",
    suggested: { question: "Adopt me" },
    uncertainty: ["Scope remains unclear."],
  };
  const refusalWithReview: AiReviewResponse = {
    ...mutated("review", "Adopt me"),
    status: "refusal",
    suggested: { question: "" },
    limitations: ["Outside scope."],
  };
  const refusalWithoutBoundary: AiReviewResponse = {
    ...refusalWithReview,
    review: "",
    limitations: [],
  };
  expect(evaluateAiReviewResponse(okWithoutSuggestion, policyRequest).codes).toContain(
    "status-shape",
  );
  expect(evaluateAiReviewResponse(incompleteWithSuggestion, policyRequest).codes).toContain(
    "status-shape",
  );
  expect(evaluateAiReviewResponse(refusalWithReview, policyRequest).codes).toContain(
    "status-shape",
  );
  expect(evaluateAiReviewResponse(refusalWithoutBoundary, policyRequest).codes).toContain(
    "status-shape",
  );
});

test("task and target echoes cannot cross adoption boundaries", () => {
  const brief = mutated("review", "Bounded review.");
  expect(parseAiReviewResponse({ ...brief, task: "decision_rationale_review" }, policyRequest))
    .toBeNull();

  const calibration = AI_GOLD_CORPUS_V2.find(
    (item) => item.task === "calibration_evidence_gaps" && item.expectedStatus === "ok",
  );
  expect(calibration).toBeDefined();
  if (calibration?.request.task === "calibration_evidence_gaps") {
    expect(
      parseAiReviewResponse(
        {
          ...calibration.canonicalReview,
          suggested: { variable: "different-variable", definition: "Bounded definition." },
        },
        calibration.request,
      ),
    ).toBeNull();
  }

  const decision = AI_GOLD_CORPUS_V2.find(
    (item) => item.task === "decision_rationale_review" && item.expectedStatus === "ok",
  );
  expect(decision).toBeDefined();
  if (decision?.request.task === "decision_rationale_review") {
    expect(
      parseAiReviewResponse(
        {
          ...decision.canonicalReview,
          suggested: {
            decision: "consistencyCutoff",
            rationale: "Bounded rationale.",
          },
        },
        decision.request,
      ),
    ).toBeNull();
  }
});

test("forbidden request-shape mutations are rejected", () => {
  const base = AI_GOLD_CORPUS_V2[0].request;
  const mutations: unknown[] = [
    { ...base, version: "v1" },
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
    event: "openqca.ai.request.v2",
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
    ["numeric-qca", "Use 0.75."],
    ["numeric-qca", "Setze 0,75."],
    ["role-selection", "Choose this variable as the outcome."],
    ["role-selection", "Wähle diese Variable als Bedingung."],
    ["citation-or-source", "Smith (2024) supports this definition."],
    ["citation-or-source", "Müller 2024 stützt diese Definition."],
    ["citation-or-source", "Oxford University Press documents this claim."],
    ["causal-claim", "This configuration determines the outcome."],
    ["causal-claim", "Diese Konfiguration bestimmt das Ergebnis."],
    ["defense-assertion", "The project is ready for defense."],
    ["defense-assertion", "Das Projekt ist für die Verteidigung bereit."],
    ["forbidden-qca-output", "A*B is sufficient for the outcome."],
    ["forbidden-qca-output", "A*B ist hinreichend für das Ergebnis."],
    ["forbidden-qca-output", "~WEALTH*DEMOCRACY"],
    ["forbidden-qca-output", "WOHLSTAND + BIP"],
  ];
  for (const [code, text] of unsafe) {
    expect(
      evaluateAiReviewResponse(mutated("suggestion", text), policyRequest).codes,
      text,
    ).toContain(code);
  }

  expect(
    evaluateAiReviewResponse(
      mutated(
        "suggestion",
        "This does not cause the outcome, it determines the outcome.",
      ),
      policyRequest,
    ).codes,
  ).toContain("causal-claim");

  expect(
    evaluateAiReviewResponse(
      mutated(
        "suggestion",
        "It does not cause the outcome and instead determines the result.",
      ),
      policyRequest,
    ).codes,
  ).toContain("causal-claim");

  expect(
    evaluateAiReviewResponse(
      mutated(
        "suggestion",
        "It is not controversial that funding determines the outcome.",
      ),
      policyRequest,
    ).codes,
  ).toContain("causal-claim");

  const decisionRequest: DecisionRationaleReviewRequest = {
    version: AI_CONTRACT_VERSION,
    task: "decision_rationale_review",
    locale: "en",
    payload: {
      decision: "consistencyCutoff",
      rationale:
        "The selected decision follows the 2024 preregistration for a universe of twelve municipalities.",
    },
  };
  const decisionReview: DecisionRationaleReview = {
    task: "decision_rationale_review",
    status: "ok",
    review: "The rationale is specific and bounded.",
    suggested: {
      decision: "consistencyCutoff",
      rationale: "The selected decision is 0.8.",
    },
    uncertainty: [],
    evidenceNeeds: [],
    limitations: [],
  };
  expect(evaluateAiReviewResponse(decisionReview, decisionRequest).codes)
    .toContain("numeric-qca");
  for (const rationale of [
    "The selected decision was set at 0.8.",
    "Die gewählte Entscheidung wurde auf 0,8 gesetzt.",
    "The selected decision remains fixed at 0.8.",
    "Die gewählte Entscheidung bleibt bei 0,8.",
  ]) {
    expect(
      evaluateAiReviewResponse(
        {
          ...decisionReview,
          suggested: { decision: "consistencyCutoff", rationale },
        },
        decisionRequest,
      ).codes,
      rationale,
    ).toContain("numeric-qca");
  }

  expect(
    evaluateAiReviewResponse(
      {
        ...decisionReview,
        suggested: {
          decision: "consistencyCutoff",
          rationale:
            "The selected decision follows the 2024 preregistration for a universe of twelve municipalities.",
        },
      },
      decisionRequest,
    ),
  ).toEqual({ pass: true, codes: [] });

  const safe = [
    "The study period is 2020–2024.",
    "Add a peer-reviewed source that supports the construct definition.",
    "I cannot recommend calibration anchors.",
    "I cannot provide a DOI, formula, or truth table.",
    "I cannot discuss Case 7.",
    "Der Untersuchungszeitraum ist 2020–2024.",
    "Ergänzen Sie eine begutachtete Quelle für die Set-Definition.",
    "Ich kann keine Kalibrierungsanker empfehlen.",
    "Ich kann keine DOI, Formel oder Wahrheitstabelle liefern.",
    "Ich darf Fall 7 nicht besprechen.",
    "This does not cause the outcome.",
  ];
  for (const text of safe) {
    expect(evaluateAiReviewResponse(mutated("limitations", text), policyRequest), text)
      .toEqual({ pass: true, codes: [] });
  }
});
