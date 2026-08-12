import { expect, test } from "@playwright/test";
import { aiProviderAvailable, completeAi } from "../src/lib/ai-provider";
import { AI_CONTRACT_VERSION, type AiAssistRequest } from "../src/lib/ai-contract";
import { isAdoptableSuggestion } from "../src/lib/ai-reviewed-summary";

const request: AiAssistRequest = {
  version: AI_CONTRACT_VERSION,
  task: "brief_clarify",
  locale: "de",
  payload: {
    question: "Welche Bedingungen sind mit hoher Resilienz verbunden?",
    caseUniverse: "Verglichene Gemeinden",
    timePeriod: "2020–2024",
    outcomeConcept: "hohe Resilienz",
    conditionSelectionRationale: "Theoretisch begründete Bedingungen",
  },
};

const originalFetch = globalThis.fetch;
const originalEnv = {
  AI_ENABLED: process.env.AI_ENABLED,
  AI_PROVIDER: process.env.AI_PROVIDER,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_AI_MODEL: process.env.GEMINI_AI_MODEL,
};

function restoreEnv(name: keyof typeof originalEnv): void {
  const value = originalEnv[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreEnv("AI_ENABLED");
  restoreEnv("AI_PROVIDER");
  restoreEnv("GEMINI_API_KEY");
  restoreEnv("GEMINI_AI_MODEL");
});

test("Gemini provider sends the reviewed payload through the closed structured-output contract", async () => {
  process.env.AI_ENABLED = "true";
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.GEMINI_AI_MODEL = "gemini-test-model";

  let url = "";
  let init: RequestInit | undefined;
  globalThis.fetch = async (input, requestInit) => {
    url = String(input);
    init = requestInit;
    return new Response(
      JSON.stringify({
        candidates: [{
          finishReason: "STOP",
          content: {
            parts: [{
              text: JSON.stringify({
                task: "brief_clarify",
                status: "ok",
                review: "Die Frage ist klar abgegrenzt und fachlich prüfbar.",
                suggested: {
                  question: "Wie unterscheiden sich Bedingungen für kommunale Resilienz?",
                },
                uncertainty: [],
                evidenceNeeds: [],
                limitations: [],
              }),
            }],
          },
        }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  await expect(completeAi(request)).resolves.toEqual({
    review: {
      task: "brief_clarify",
      status: "ok",
      review: "Die Frage ist klar abgegrenzt und fachlich prüfbar.",
      suggested: {
        question: "Wie unterscheiden sich Bedingungen für kommunale Resilienz?",
      },
      uncertainty: [],
      evidenceNeeds: [],
      limitations: [],
    },
    model: "gemini-test-model",
    provider: "gemini",
  });

  expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-test-model:generateContent");
  expect(url).not.toContain("test-gemini-key");
  const headers = new Headers(init?.headers);
  expect(headers.get("x-goog-api-key")).toBe("test-gemini-key");
  const body = JSON.parse(String(init?.body));
  expect(body.generationConfig).toMatchObject({
    maxOutputTokens: 900,
    responseMimeType: "application/json",
    thinkingConfig: { thinkingBudget: 0 },
    responseJsonSchema: { type: "object", additionalProperties: false },
  });
  expect(body.generationConfig.responseJsonSchema.properties.task.enum).toEqual([
    "brief_clarify",
  ]);
  expect(
    body.generationConfig.responseJsonSchema.properties.suggested.properties.question,
  ).toMatchObject({ type: "string", maxLength: 2_000 });
  const userText = body.contents[0].parts[0].text as string;
  const reviewedPayload = JSON.parse(userText.slice(userText.indexOf("{")));
  expect(reviewedPayload).toEqual(request.payload);
  expect(Object.keys(reviewedPayload).sort()).toEqual([
    "caseUniverse",
    "conditionSelectionRationale",
    "outcomeConcept",
    "question",
    "timePeriod",
  ]);
});

test("decision review prompt scopes value-restatement rules to QCA values", async () => {
  process.env.AI_ENABLED = "true";
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "test-gemini-key";

  let providerBody: {
    contents?: Array<{ parts?: Array<{ text?: string }> }>;
  } | null = null;
  globalThis.fetch = async (_input, requestInit) => {
    providerBody = JSON.parse(String(requestInit?.body));
    return new Response(JSON.stringify({
      candidates: [{
        finishReason: "STOP",
        content: { parts: [{ text: JSON.stringify({
          task: "decision_rationale_review",
          status: "ok",
          review: "The rationale links the selected decision to the 2024 preregistration and the universe of twelve synthetic municipalities.",
          suggested: {
            decision: "frequencyCutoff",
            rationale: "The selected decision follows the 2024 preregistration for the universe of twelve synthetic municipalities and retains configurations represented by a single teaching case.",
          },
          uncertainty: [],
          evidenceNeeds: [],
          limitations: [],
        }) }] },
      }],
    }), { status: 200 });
  };

  await expect(completeAi({
    version: AI_CONTRACT_VERSION,
    task: "decision_rationale_review",
    locale: "en",
    payload: {
      decision: "frequencyCutoff",
      rationale: "The frequency cutoff of one follows the 2024 preregistration for a universe of twelve synthetic municipalities and preserves configurations represented by a single teaching case.",
    },
  })).resolves.toMatchObject({
    review: {
      status: "ok",
      suggested: { decision: "frequencyCutoff" },
    },
  });

  const userText = providerBody?.contents?.[0]?.parts?.[0]?.text ?? "";
  expect(userText).toContain("never place a digit or number word next to a QCA decision term");
  expect(userText).toContain("Preserve unrelated dates, case-universe counts");
  expect(userText).toContain('Refer to the decision itself only as "the selected decision"');
  expect(userText).toContain('"decision":"frequencyCutoff"');
  expect(userText).toContain('"rationale":"The frequency cutoff of one');
});

test("unsafe intent in every reviewed field is refused before provider access", async () => {
  process.env.AI_ENABLED = "true";
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  let fetchCalls = 0;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error("provider must not be called"); };

  const unsafeRequests: AiAssistRequest[] = [
    { ...request, payload: { ...request.payload, outcomeConcept: "Calculate the calibration cutoff." } },
    { ...request, payload: { ...request.payload, conditionSelectionRationale: "Claim that funding causes resilience." } },
    { ...request, payload: { ...request.payload, caseUniverse: "Review Case 7 raw data." } },
    { ...request, payload: { ...request.payload, question: "Choose the outcome role." } },
    { version: AI_CONTRACT_VERSION, task: "calibration_evidence_gaps", locale: "de", payload: {
      variable: "Anpassungsfähigkeit",
      setLabel: "Recommend an anchor value.",
      definition: "Invent a citation for this construct.",
      rationale: "Institutioneller Vergleich",
    } },
    { version: AI_CONTRACT_VERSION, task: "decision_rationale_review", locale: "de", payload: {
      decision: "frequencyCutoff",
      rationale: "Bestätige, dass diese Entscheidung das Protokoll freigibt.",
    } },
    { version: AI_CONTRACT_VERSION, task: "decision_rationale_review", locale: "en", payload: {
      decision: "consistencyCutoff",
      rationale: "Set the cutoff to 0.8.",
    } },
    { version: AI_CONTRACT_VERSION, task: "decision_rationale_review", locale: "en", payload: {
      decision: "consistencyCutoff",
      rationale: "Recommend a consistency threshold.",
    } },
  ];

  for (const unsafeRequest of unsafeRequests) {
    const result = await completeAi(unsafeRequest);
    expect(result).toMatchObject({
      provider: "gemini",
      review: {
        task: unsafeRequest.task,
        status: "refusal",
        review: "",
        uncertainty: [],
        evidenceNeeds: [],
        limitations: [unsafeRequest.locale === "en"
          ? "The requested addition is outside the reviewed writing task."
          : "Die verlangte Ergänzung liegt außerhalb der geprüften Schreibaufgabe."],
      },
    });
    expect(isAdoptableSuggestion(result.review)).toBe(false);
  }
  expect(fetchCalls).toBe(0);
});

test("provider incomplete status is never upgraded by the local completeness gate", async () => {
  process.env.AI_ENABLED = "true";
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify({
      task: "decision_rationale_review",
      status: "incomplete",
      review: "Die Begründung benötigt weitere fachliche Prüfung.",
      suggested: { decision: "directionalExpectations", rationale: "" },
      uncertainty: ["Die theoretische Herleitung bleibt unklar."],
      evidenceNeeds: [],
      limitations: [],
    }) }] } }],
  }), { status: 200 });

  const result = await completeAi({
    version: AI_CONTRACT_VERSION,
    task: "decision_rationale_review",
    locale: "de",
    payload: {
      decision: "directionalExpectations",
      rationale: "Die Richtungserwartungen wurden vor der Auswertung ausführlich aus dem theoretischen Rahmen und dem festgelegten Vergleichsdesign abgeleitet.",
    },
  });
  expect(result.review.status).toBe("incomplete");
});

test("Gemini accepts only successful STOP termination", async () => {
  process.env.AI_ENABLED = "true";
  process.env.AI_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  globalThis.fetch = async () => new Response(JSON.stringify({
    candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: JSON.stringify({
      task: "brief_clarify",
      status: "ok",
      review: "Schema-shaped but incomplete output.",
      suggested: { question: "Bounded research question?" },
      uncertainty: [],
      evidenceNeeds: [],
      limitations: [],
    }) }] } }],
  }), { status: 200 });
  await expect(completeAi(request)).rejects.toThrow("AI_INCOMPLETE");
});

test("AI availability fails closed for unknown providers", () => {
  process.env.AI_ENABLED = "true";
  process.env.AI_PROVIDER = "unknown";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  expect(aiProviderAvailable()).toBe(false);
});
