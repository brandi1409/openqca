import type { Locale } from "@/i18n/locale";

export const AI_CONTRACT_VERSION = "v1" as const;
export const AI_TASKS = ["brief_clarify", "calibration_evidence_gaps", "decision_rationale_review"] as const;
export type AiTask = (typeof AI_TASKS)[number];

export interface ReviewedSummary { status: "ok" | "incomplete" | "refusal"; draft: string; uncertainty: string[]; evidenceNeeds: string[]; limitations: string[] }
export interface AiRequestBase { version: typeof AI_CONTRACT_VERSION; task: AiTask; locale: Locale }
export interface BriefClarifyRequest extends AiRequestBase { task: "brief_clarify"; payload: { question: string; caseUniverse: string; timePeriod: string; outcomeConcept: string; conditionSelectionRationale: string } }
export interface CalibrationEvidenceGapsRequest extends AiRequestBase { task: "calibration_evidence_gaps"; payload: { variable: string; setLabel: string; definition: string; rationale: string } }
export interface DecisionRationaleReviewRequest extends AiRequestBase { task: "decision_rationale_review"; payload: { decision: "frequencyCutoff" | "consistencyCutoff" | "directionalExpectations"; rationale: string } }
export type AiAssistRequest = BriefClarifyRequest | CalibrationEvidenceGapsRequest | DecisionRationaleReviewRequest;

const MAX_TEXT = 2_000;
function text(value: unknown, required = true): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return (required && !trimmed) || trimmed.length > MAX_TEXT ? null : trimmed;
}

/** Parses only the reviewed, non-numerical payloads that may leave the browser. */
export function parseAiAssistRequest(value: unknown): AiAssistRequest | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.version !== AI_CONTRACT_VERSION || !AI_TASKS.includes(record.task as AiTask)) return null;
  if (Object.keys(record).some((key) => !["version", "task", "locale", "payload"].includes(key))) return null;
  if ((record.locale !== "de" && record.locale !== "en") || typeof record.payload !== "object" || record.payload === null || Array.isArray(record.payload)) return null;
  const p = record.payload as Record<string, unknown>;
  if (record.task === "brief_clarify") {
    if (Object.keys(p).some((key) => !["question", "caseUniverse", "timePeriod", "outcomeConcept", "conditionSelectionRationale"].includes(key))) return null;
    const question = text(p.question); const caseUniverse = text(p.caseUniverse); const timePeriod = text(p.timePeriod); const outcomeConcept = text(p.outcomeConcept); const conditionSelectionRationale = text(p.conditionSelectionRationale);
    return question && caseUniverse && timePeriod && outcomeConcept && conditionSelectionRationale ? { version: AI_CONTRACT_VERSION, task: "brief_clarify", locale: record.locale, payload: { question, caseUniverse, timePeriod, outcomeConcept, conditionSelectionRationale } } : null;
  }
  if (record.task === "calibration_evidence_gaps") {
    if (Object.keys(p).some((key) => !["variable", "setLabel", "definition", "rationale"].includes(key))) return null;
    const variable = text(p.variable); const setLabel = text(p.setLabel); const definition = text(p.definition); const rationale = text(p.rationale);
    return variable && setLabel && definition && rationale ? { version: AI_CONTRACT_VERSION, task: "calibration_evidence_gaps", locale: record.locale, payload: { variable, setLabel, definition, rationale } } : null;
  }
  if (Object.keys(p).some((key) => !["decision", "rationale"].includes(key))) return null;
  const rationale = text(p.rationale);
  return (p.decision === "frequencyCutoff" || p.decision === "consistencyCutoff" || p.decision === "directionalExpectations") && rationale ? { version: AI_CONTRACT_VERSION, task: "decision_rationale_review", locale: record.locale, payload: { decision: p.decision, rationale } } : null;
}

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 8) return null;
  const values = value.map((item) => text(item));
  return values.every((item): item is string => item !== null) ? values : null;
}
export function parseReviewedSummary(value: unknown): ReviewedSummary | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (record.status !== "ok" && record.status !== "incomplete" && record.status !== "refusal") return null;
  const draft = text(record.draft, false); const uncertainty = stringList(record.uncertainty); const evidenceNeeds = stringList(record.evidenceNeeds); const limitations = stringList(record.limitations);
  return draft !== null && uncertainty !== null && evidenceNeeds !== null && limitations !== null ? { status: record.status, draft, uncertainty, evidenceNeeds, limitations } : null;
}

export const reviewedSummaryJsonSchema = {
  name: "openqca_reviewed_summary_v1", strict: true,
  schema: { type: "object", additionalProperties: false, required: ["status", "draft", "uncertainty", "evidenceNeeds", "limitations"], properties: {
    status: { type: "string", enum: ["ok", "incomplete", "refusal"] }, draft: { type: "string", maxLength: 2000 },
    uncertainty: { type: "array", items: { type: "string", maxLength: 2000 }, maxItems: 8 }, evidenceNeeds: { type: "array", items: { type: "string", maxLength: 2000 }, maxItems: 8 }, limitations: { type: "array", items: { type: "string", maxLength: 2000 }, maxItems: 8 },
  } },
} as const;
