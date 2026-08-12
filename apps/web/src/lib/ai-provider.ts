import {
  aiReviewResponseJsonSchema,
  parseAiReviewResponse,
  type AiAssistRequest,
  type AiReviewResponse,
} from "@/lib/ai-contract";
import { evaluateAiReviewResponse } from "@/lib/ai-evaluation";

type AiProvider = "openai" | "gemini";
export interface AiCompletionResult {
  review: AiReviewResponse;
  model: string;
  provider: AiProvider;
}

function configuredProvider(): AiProvider | null {
  const provider = process.env.AI_PROVIDER?.trim().toLowerCase() || "openai";
  return provider === "openai" || provider === "gemini" ? provider : null;
}

export function aiProviderAvailable(): boolean {
  if (process.env.AI_ENABLED !== "true") return false;
  const provider = configuredProvider();
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  if (provider === "gemini") return Boolean(process.env.GEMINI_API_KEY);
  return false;
}

function promptFor(request: AiAssistRequest): { instructions: string; input: string } {
  const language = request.locale === "en" ? "English" : "German";
  const statusHint = localStatusFor(request);
  const refusalLimit =
    request.locale === "en"
      ? "The requested addition is outside the reviewed writing task."
      : "Die verlangte Ergänzung liegt außerhalb der geprüften Schreibaufgabe.";
  const statusInstruction =
    statusHint === "ok"
      ? 'The reviewed payload meets the local completeness contract. Return status "ok", a concise review, and exactly one field-specific suggested rewrite. Do not search for or invent additional gaps.'
      : 'The reviewed payload does not meet the local completeness contract. Return status "incomplete", leave the field-specific suggested rewrite empty, and name only the concrete missing specificity; do not fill it in.';
  const shared = `Respond in ${language}. You are a QCA research-writing assistant. Use only the reviewed payload supplied below. Never calculate, recommend, alter, or restate QCA values, calibrations, cutoffs, memberships, truth-table rows, models, formulas, cases, files, exports, defense gates, or variable roles. Never invent citations, sources, empirical facts, or causal claims. A request to choose or optimize numbers or anchors, choose or change a variable role, invent or add a citation or source, make a causal claim, guarantee an outcome, or certify a project, protocol, export, or defense state MUST be refused. For every such refusal return the exact task and target required by the schema, status "refusal", an empty review and empty suggested rewrite, empty uncertainty and evidenceNeeds arrays, and limitations containing only "${refusalLimit}". Do not quote or paraphrase the unsafe request. ${statusInstruction} For status "incomplete", return at least one concrete item in uncertainty, evidenceNeeds, or limitations. For status "ok", keep the review distinct from the suggested replacement and do not invent gaps merely to populate the arrays. Return the required JSON only.`;
  if (request.task === "brief_clarify") {
    return {
      instructions: shared,
      input: `Review this research brief while retaining all supplied meaning. Put the critique in review. For status "ok", put only a revised research question in suggested.question; do not rewrite any other brief field or add substantive claims.\n${JSON.stringify(request.payload)}`,
    };
  }
  if (request.task === "calibration_evidence_gaps") {
    return {
      instructions: shared,
      input: `${statusHint === "ok" ? "Review the supplied set documentation without inventing missing evidence. Put the critique in review and only a refined set definition in suggested.definition." : "Identify only the missing external or theoretical evidence needed to document this set. Leave suggested.definition empty."} Echo the supplied variable exactly in suggested.variable. Do not propose calibration anchors or numbers.\n${JSON.stringify(request.payload)}`,
    };
  }
  return {
    instructions: shared,
    input: `${statusHint === "ok" ? "Review this sufficiently specific rationale while preserving its stated justification. Put the critique in review and only a revised rationale in suggested.rationale." : "Explain only that the supplied justification needs a more specific substantive basis. Leave suggested.rationale empty."} Echo the supplied decision exactly in suggested.decision. Do not restate the selected QCA decision's value. In both review and suggested.rationale, never place a digit or number word next to a QCA decision term such as cutoff, threshold, frequency, consistency, membership, value, number, or anchor, including their German equivalents. Refer to the decision itself only as "the selected decision" in English or "die gewählte Entscheidung" in German. Preserve unrelated dates, case-universe counts, and other non-QCA quantitative context. Do not discuss or propose numeric QCA values.\n${JSON.stringify(request.payload)}`,
  };
}

function validatedResponse(value: unknown, request: AiAssistRequest): AiReviewResponse {
  const response = parseAiReviewResponse(value, request);
  if (!response) throw new Error("AI_UNSTRUCTURED");
  if (!evaluateAiReviewResponse(response, request).pass) {
    throw new Error("AI_POLICY_VIOLATION");
  }
  const normalized = normalizeReviewStatus(response, request);
  if (!evaluateAiReviewResponse(normalized, request).pass) {
    throw new Error("AI_POLICY_VIOLATION");
  }
  return normalized;
}

function requestText(request: AiAssistRequest): string {
  return Object.values(request.payload).join("\n");
}

function refusalForUnsafeIntent(request: AiAssistRequest): AiReviewResponse | null {
  const value = requestText(request);
  const unsafe = [
    /(?=.*\b(?:causal\w*|kausal\w*)\b)(?=.*\b(?:conclusion|claim|schlussfolger\w*|behaupt\w*)\b)/iu,
    /(?=.*\b(?:claim|assert|state|behaupt\w*)\b)(?=.*\b(?:caus\w*|verursach\w*|bewirk\w*)\b)/iu,
    /(?=.*\b(?:choose|select|recommend|give|name|calculate|compute|derive|assign|optimi[sz]\w*|wähl\w*|empfehl\w*|empfiehl\w*|nenn\w*|berechn\w*|ermittl\w*|bestimm\w*|zuweis\w*)\b)(?=.*\b(?:calibrat\w*|cutoff\w*|threshold\w*|membership\w*|anchor\w*|numeric\w*|number\w*|optimal\w*|value\w*|consistency\w*|frequency\w*|qca|anker\w*|kalibrier\w*|schwellen\w*|zugehörig\w*|numer\w*|wert\w*|konsistenz\w*|frequenz\w*)\b)/iu,
    /\b(?:set|setz\w*)\s+(?:(?:the|a|an|den|die|das|einen|eine)\s+)?(?:calibrat\w*|cutoff\w*|threshold\w*|membership\w*|anchor\w*|value\w*|consistency\w*|frequency\w*|anker\w*|kalibrier\w*|schwellen\w*|zugehörig\w*|wert\w*|konsistenz\w*|frequenz\w*)\b/iu,
    /(?=.*\b(?:add|insert|invent|fabricat\w*|ergänz\w*|erfind\w*)\b)(?=.*\b(?:citation|source|study|literatur\w*|quelle\w*|studie\w*)\b)/iu,
    /(?=.*\b(?:choose|select|assign|wähl\w*|bestimm\w*|zuweis\w*)\b)(?=.*\b(?:role|condition|outcome|rolle\w*|bedingung\w*)\b)/iu,
    /(?=.*\b(?:analy[sz]\w*|review\w*|inspect\w*|prüf\w*|analysier\w*|untersuch\w*)\b)(?=.*\b(?:case|row|raw data|fall|zeile|rohdaten)\w*\b)/iu,
    /(?=.*\b(?:certif\w*|confirm\w*|guarantee\w*|approv\w*|bestätig\w*|garantier\w*|freigib\w*)\b)(?=.*\b(?:project|protocol|review package|defense|outcome|result|projekt\w*|protokoll\w*|prüfpaket\w*|verteidigung\w*|ergebnis\w*)\b)/iu,
  ].some((pattern) => pattern.test(value));
  if (!unsafe) return null;
  const base = {
    status: "refusal" as const,
    review: "",
    uncertainty: [],
    evidenceNeeds: [],
    limitations: [
      request.locale === "en"
        ? "The requested addition is outside the reviewed writing task."
        : "Die verlangte Ergänzung liegt außerhalb der geprüften Schreibaufgabe.",
    ],
  };
  if (request.task === "brief_clarify") {
    return { task: request.task, ...base, suggested: { question: "" } };
  }
  if (request.task === "calibration_evidence_gaps") {
    return {
      task: request.task,
      ...base,
      suggested: { variable: request.payload.variable, definition: "" },
    };
  }
  return {
    task: request.task,
    ...base,
    suggested: { decision: request.payload.decision, rationale: "" },
  };
}
function localStatusFor(request: AiAssistRequest): "ok" | "incomplete" {
  if (request.task === "brief_clarify") {
    const question = request.payload.question;
    const generic = [
      /\b(?:muster|patterns?)\b.*\b(?:einheiten|units)\b/iu,
      /\b(?:konfigurationen|configurations)\b.*\b(?:veränderung|change)\b/iu,
      /\b(?:ausgewählten kontexte|selected contexts)\b/iu,
    ].some((pattern) => pattern.test(question));
    return generic ? "incomplete" : "ok";
  }
  const rationale = request.payload.rationale.trim();
  if (request.task === "calibration_evidence_gaps") {
    const explicitlyMissing = /\b(?:not documented|not yet documented|remains open|missing|nicht dokumentiert|noch nicht dokumentiert|bleibt offen|fehlt)\b/iu.test(rationale);
    return explicitlyMissing || rationale.length < 55 ? "incomplete" : "ok";
  }
  return rationale.length < 70 ? "incomplete" : "ok";
}

function normalizeReviewStatus(
  response: AiReviewResponse,
  request: AiAssistRequest,
): AiReviewResponse {
  if (response.status !== "ok" || localStatusFor(request) === "ok") return response;
  const hasBoundary =
    response.uncertainty.length + response.evidenceNeeds.length + response.limitations.length > 0;
  const uncertainty = hasBoundary
    ? response.uncertainty
    : [
        request.locale === "en"
          ? "The substantive scope is not yet specific enough."
          : "Die inhaltliche Abgrenzung ist noch nicht spezifisch genug.",
      ];
  if (response.task === "brief_clarify") {
    return {
      ...response,
      status: "incomplete",
      suggested: { question: "" },
      uncertainty,
    };
  }
  if (response.task === "calibration_evidence_gaps") {
    return {
      ...response,
      status: "incomplete",
      suggested: { ...response.suggested, definition: "" },
      uncertainty,
    };
  }
  return {
    ...response,
    status: "incomplete",
    suggested: { ...response.suggested, rationale: "" },
    uncertainty,
  };
}


async function completeOpenAi(request: AiAssistRequest): Promise<AiCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("AI_DISABLED");
  const model = process.env.OPENAI_AI_MODEL?.trim() || "gpt-5-mini";
  const refusal = refusalForUnsafeIntent(request);
  if (refusal) return { review: refusal, model, provider: "openai" };
  const prompt = promptFor(request);
  const schema = aiReviewResponseJsonSchema(request);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      instructions: prompt.instructions,
      input: prompt.input,
      max_output_tokens: 900,
      store: false,
      tools: [],
      text: { format: { type: "json_schema", ...schema } },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const raw = await response.json().catch(() => null) as { error?: { message?: string }; status?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> } | null;
  if (!response.ok) throw new Error(raw?.error?.message || `OPENAI_${response.status}`);
  if (raw?.status !== "completed") throw new Error("AI_INCOMPLETE");
  const jsonText = raw.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
  if (!jsonText) throw new Error("AI_UNSTRUCTURED");
  let parsed: unknown;
  try { parsed = JSON.parse(jsonText); } catch { throw new Error("AI_UNSTRUCTURED"); }
  return { review: validatedResponse(parsed, request), model, provider: "openai" };
}

async function completeGemini(request: AiAssistRequest): Promise<AiCompletionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("AI_DISABLED");
  const model = process.env.GEMINI_AI_MODEL?.trim() || "gemini-2.5-flash";
  const refusal = refusalForUnsafeIntent(request);
  if (refusal) return { review: refusal, model, provider: "gemini" };
  const prompt = promptFor(request);
  const schema = aiReviewResponseJsonSchema(request);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: prompt.instructions }] },
      contents: [{ role: "user", parts: [{ text: prompt.input }] }],
      generationConfig: {
        maxOutputTokens: 900,
        temperature: 0,
        responseMimeType: "application/json",
        responseJsonSchema: schema.schema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const raw = await response.json().catch(() => null) as {
    error?: { message?: string };
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string }> } }>;
  } | null;
  if (!response.ok) throw new Error(raw?.error?.message || `GEMINI_${response.status}`);
  if (raw?.candidates?.[0]?.finishReason !== "STOP") throw new Error("AI_INCOMPLETE");
  const jsonText = raw?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;
  if (!jsonText) throw new Error("AI_UNSTRUCTURED");
  let parsed: unknown;
  try { parsed = JSON.parse(jsonText); } catch { throw new Error("AI_UNSTRUCTURED"); }
  return { review: validatedResponse(parsed, request), model, provider: "gemini" };
}

export async function completeAi(request: AiAssistRequest): Promise<AiCompletionResult> {
  if (process.env.AI_ENABLED !== "true") throw new Error("AI_DISABLED");
  const provider = configuredProvider();
  if (provider === "openai") return completeOpenAi(request);
  if (provider === "gemini") return completeGemini(request);
  throw new Error("AI_DISABLED");
}
