import { parseReviewedSummary, reviewedSummaryJsonSchema, type AiAssistRequest, type ReviewedSummary } from "@/lib/ai-contract";
import { evaluateReviewedSummary } from "@/lib/ai-evaluation";

export interface AiCompletionResult { summary: ReviewedSummary; model: string; provider: "openai" }

export function aiProviderAvailable(): boolean {
  return process.env.AI_ENABLED === "true" && Boolean(process.env.OPENAI_API_KEY);
}

function promptFor(request: AiAssistRequest): { instructions: string; input: string } {
  const language = request.locale === "en" ? "English" : "German";
  const shared = `Respond in ${language}. You are a QCA research-writing assistant. Use only the reviewed payload supplied below. Never calculate, recommend, alter, or restate QCA values, calibrations, cutoffs, memberships, truth-table rows, models, formulas, cases, files, exports, or defense gates. Never invent citations, sources, empirical facts, or causal claims. If the request cannot be responsibly completed from the payload, use status incomplete or refusal and explain the boundary in limitations. Return the required JSON only.`;
  if (request.task === "brief_clarify") return { instructions: shared, input: `Clarify this research brief for researcher review, retaining all supplied meaning:\n${JSON.stringify(request.payload)}` };
  if (request.task === "calibration_evidence_gaps") return { instructions: shared, input: `Identify missing external/theoretical evidence needed to document this set. Do not propose calibration anchors or numbers:\n${JSON.stringify(request.payload)}` };
  return { instructions: shared, input: `Review whether this rationale is sufficiently specific and identify missing justification. Do not discuss or propose numeric values:\n${JSON.stringify(request.payload)}` };
}

export async function completeAi(request: AiAssistRequest): Promise<AiCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || process.env.AI_ENABLED !== "true") throw new Error("AI_DISABLED");
  const model = process.env.OPENAI_AI_MODEL?.trim() || "gpt-5-mini";
  const prompt = promptFor(request);
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
      text: { format: { type: "json_schema", ...reviewedSummaryJsonSchema } },
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
  const summary = parseReviewedSummary(parsed);
  if (!summary) throw new Error("AI_UNSTRUCTURED");
  if (!evaluateReviewedSummary(summary).pass) throw new Error("AI_POLICY_VIOLATION");
  return { summary, model, provider: "openai" };
}
