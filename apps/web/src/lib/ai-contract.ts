import type { Locale } from "@/i18n/locale";

export const AI_CONTRACT_VERSION = "v2" as const;
export const AI_TASKS = [
  "brief_clarify",
  "calibration_evidence_gaps",
  "decision_rationale_review",
] as const;
export type AiTask = (typeof AI_TASKS)[number];
export type AiReviewStatus = "ok" | "incomplete" | "refusal";
export type DecisionRationaleTarget =
  | "frequencyCutoff"
  | "consistencyCutoff"
  | "directionalExpectations";

export interface AiRequestBase {
  version: typeof AI_CONTRACT_VERSION;
  task: AiTask;
  locale: Locale;
}

export interface BriefClarifyRequest extends AiRequestBase {
  task: "brief_clarify";
  payload: {
    question: string;
    caseUniverse: string;
    timePeriod: string;
    outcomeConcept: string;
    conditionSelectionRationale: string;
  };
}

export interface CalibrationEvidenceGapsRequest extends AiRequestBase {
  task: "calibration_evidence_gaps";
  payload: {
    variable: string;
    setLabel: string;
    definition: string;
    rationale: string;
  };
}

export interface DecisionRationaleReviewRequest extends AiRequestBase {
  task: "decision_rationale_review";
  payload: {
    decision: DecisionRationaleTarget;
    rationale: string;
  };
}

export type AiAssistRequest =
  | BriefClarifyRequest
  | CalibrationEvidenceGapsRequest
  | DecisionRationaleReviewRequest;

interface AiReviewBase {
  task: AiTask;
  status: AiReviewStatus;
  review: string;
  uncertainty: string[];
  evidenceNeeds: string[];
  limitations: string[];
}

export interface BriefClarifyReview extends AiReviewBase {
  task: "brief_clarify";
  suggested: { question: string };
}

export interface CalibrationEvidenceGapsReview extends AiReviewBase {
  task: "calibration_evidence_gaps";
  suggested: { variable: string; definition: string };
}

export interface DecisionRationaleReview extends AiReviewBase {
  task: "decision_rationale_review";
  suggested: { decision: DecisionRationaleTarget; rationale: string };
}

export type AiReviewResponse =
  | BriefClarifyReview
  | CalibrationEvidenceGapsReview
  | DecisionRationaleReview;

const MAX_TEXT = 2_000;
export type AiRequestPrivacyCode =
  | "raw-row"
  | "direct-identifier"
  | "case-identifier";

const EMAIL_ADDRESS = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;
const LABELED_CONTACT = /\b(?:tel(?:ephone)?|phone|mobile|mobil|handy)\s*[:=]?\s*\+?[\d()\s.-]{7,}/iu;
const PHONE_CANDIDATE = /(?<![\p{L}\p{N}])(?:\+\p{N}{9,15}|(?:\+\p{N}{1,3}[\s.-]?)?(?:\(\p{N}{2,5}\)|\p{N}{1,5})(?:[\s./-]\p{N}{2,10}){1,4})(?![\p{L}\p{N}])/gu;
const LABELED_IDENTIFIER = /\b(?:ssn|social security|passport|personalausweis|patient(?:en)?[- ]?id|participant[- ]?id|teilnehmer[- ]?id|matrikelnummer)\s*[:=#-]?\s*[A-Z0-9-]{3,}\b/iu;
const GENERIC_CASE_IDENTIFIER = /\b(?:case|fall|participant|teilnehmer|patient)[ _-]*\p{N}+\b/iu;
const RAW_FILE_REFERENCE = /\.(?:csv|tsv|xlsx?|sav|dta|txt)\b/iu;
const JSON_ROW = /\{\s*["'][^"']+["']\s*:/u;
const NUMERIC_CELL = /^[-+]?(?:\p{N}+(?:[.,]\p{N}+)?|[01])$/u;
const YEAR_SEQUENCE = /^(?:(?:19|20)\p{N}{2})(?:[\s./-](?:19|20)\p{N}{2}){1,4}$/u;

function looksLikeDelimitedRow(value: string): boolean {
  if (value.includes("\t")) return true;
  return value.split(/\r?\n/u).some((line) =>
    [",", ";"].some((delimiter) => {
      const cells = line.split(delimiter).map((cell) => cell.trim());
      return cells.length >= 3 && cells.slice(1).filter((cell) => NUMERIC_CELL.test(cell)).length >= 2;
    }),
  );
}

function looksLikePhoneNumber(value: string): boolean {
  return [...value.normalize("NFKC").matchAll(PHONE_CANDIDATE)].some((match) => {
    const candidate = match[0];
    if (YEAR_SEQUENCE.test(candidate.trim())) return false;
    const digits = candidate.replace(/[^\p{N}]/gu, "");
    if (digits.length < 9 || digits.length > 15) return false;
    const separators = candidate.match(/[\s./-]/gu)?.length ?? 0;
    const groupingSeparators = candidate.match(/[\s-]/gu)?.length ?? 0;
    return candidate.startsWith("+") ||
      candidate.includes("(") ||
      separators >= 2 ||
      (candidate.startsWith("0") && groupingSeparators >= 1);
  });
}

function containsSensitiveValue(textValue: string, sensitiveValues: readonly string[]): boolean {
  const normalized = textValue.normalize("NFKC");
  return sensitiveValues.some((candidate) => {
    const token = candidate.normalize("NFKC").trim();
    if (!token) return false;
    if (token.length < 2) return false;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    return new RegExp(
      `(?:^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`,
      "iu",
    ).test(normalized);
  });
}

/** Client and server privacy boundary for the exact payload shown before send. */
export function aiRequestPrivacyIssues(
  request: AiAssistRequest,
  sensitiveValues: readonly string[] = [],
): AiRequestPrivacyCode[] {
  const issues = new Set<AiRequestPrivacyCode>();
  for (const value of Object.values(request.payload)) {
    if (typeof value !== "string") continue;
    if (looksLikeDelimitedRow(value) || RAW_FILE_REFERENCE.test(value) || JSON_ROW.test(value)) {
      issues.add("raw-row");
    }
    if (
      EMAIL_ADDRESS.test(value) ||
      LABELED_CONTACT.test(value) ||
      looksLikePhoneNumber(value) ||
      LABELED_IDENTIFIER.test(value)
    ) {
      issues.add("direct-identifier");
    }
    if (GENERIC_CASE_IDENTIFIER.test(value) || containsSensitiveValue(value, sensitiveValues)) {
      issues.add("case-identifier");
    }
  }
  return [...issues].sort();
}

function privacySafe<T extends AiAssistRequest>(request: T): T | null {
  return aiRequestPrivacyIssues(request).length === 0 ? request : null;
}


function text(value: unknown, required = true): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return (required && !trimmed) || trimmed.length > MAX_TEXT ? null : trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(record: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(record).every((key) => keys.includes(key));
}
function isAiReviewStatus(value: unknown): value is AiReviewStatus {
  return value === "ok" || value === "incomplete" || value === "refusal";
}


/** Parses only the reviewed, non-numerical payloads that may leave the browser. */
export function parseAiAssistRequest(value: unknown): AiAssistRequest | null {
  if (!isRecord(value)) return null;
  if (value.version !== AI_CONTRACT_VERSION || !AI_TASKS.includes(value.task as AiTask)) {
    return null;
  }
  if (!hasOnlyKeys(value, ["version", "task", "locale", "payload"])) return null;
  if ((value.locale !== "de" && value.locale !== "en") || !isRecord(value.payload)) {
    return null;
  }
  const payload = value.payload;
  if (value.task === "brief_clarify") {
    if (
      !hasOnlyKeys(payload, [
        "question",
        "caseUniverse",
        "timePeriod",
        "outcomeConcept",
        "conditionSelectionRationale",
      ])
    ) {
      return null;
    }
    const question = text(payload.question);
    const caseUniverse = text(payload.caseUniverse);
    const timePeriod = text(payload.timePeriod);
    const outcomeConcept = text(payload.outcomeConcept);
    const conditionSelectionRationale = text(payload.conditionSelectionRationale);
    return question &&
      caseUniverse &&
      timePeriod &&
      outcomeConcept &&
      conditionSelectionRationale
      ? privacySafe({
          version: AI_CONTRACT_VERSION,
          task: "brief_clarify",
          locale: value.locale,
          payload: {
            question,
            caseUniverse,
            timePeriod,
            outcomeConcept,
            conditionSelectionRationale,
          },
        })
      : null;
  }
  if (value.task === "calibration_evidence_gaps") {
    if (!hasOnlyKeys(payload, ["variable", "setLabel", "definition", "rationale"])) {
      return null;
    }
    const variable = text(payload.variable);
    const setLabel = text(payload.setLabel);
    const definition = text(payload.definition);
    const rationale = text(payload.rationale);
    return variable && setLabel && definition && rationale
      ? privacySafe({
          version: AI_CONTRACT_VERSION,
          task: "calibration_evidence_gaps",
          locale: value.locale,
          payload: { variable, setLabel, definition, rationale },
        })
      : null;
  }
  if (!hasOnlyKeys(payload, ["decision", "rationale"])) return null;
  const rationale = text(payload.rationale);
  const decision = payload.decision;
  return (decision === "frequencyCutoff" ||
    decision === "consistencyCutoff" ||
    decision === "directionalExpectations") &&
    rationale
    ? privacySafe({
        version: AI_CONTRACT_VERSION,
        task: "decision_rationale_review",
        locale: value.locale,
        payload: { decision, rationale },
      })
    : null;
}

function stringList(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 8) return null;
  const values = value.map((item) => text(item));
  return values.every((item): item is string => item !== null) ? values : null;
}

/**
 * Parses a provider response against the request that produced it. Echoed
 * task/target fields must match, so a valid response cannot be adopted into a
 * different research field.
 */
export function parseAiReviewResponse(
  value: unknown,
  request: AiAssistRequest,
): AiReviewResponse | null {
  if (!isRecord(value)) return null;
  const status = value.status;
  if (
    !hasOnlyKeys(value, [
      "task",
      "status",
      "review",
      "suggested",
      "uncertainty",
      "evidenceNeeds",
      "limitations",
    ]) ||
    value.task !== request.task ||
    !isAiReviewStatus(status) ||
    !isRecord(value.suggested)
  ) {
    return null;
  }
  const review = text(value.review, false);
  const uncertainty = stringList(value.uncertainty);
  const evidenceNeeds = stringList(value.evidenceNeeds);
  const limitations = stringList(value.limitations);
  if (
    review === null ||
    uncertainty === null ||
    evidenceNeeds === null ||
    limitations === null
  ) {
    return null;
  }
  const base = {
    status,
    review,
    uncertainty,
    evidenceNeeds,
    limitations,
  };
  if (request.task === "brief_clarify") {
    if (!hasOnlyKeys(value.suggested, ["question"])) return null;
    const question = text(value.suggested.question, false);
    return question === null
      ? null
      : { task: "brief_clarify", ...base, suggested: { question } };
  }
  if (request.task === "calibration_evidence_gaps") {
    if (!hasOnlyKeys(value.suggested, ["variable", "definition"])) return null;
    const variable = text(value.suggested.variable);
    const definition = text(value.suggested.definition, false);
    return variable === request.payload.variable && definition !== null
      ? {
          task: "calibration_evidence_gaps",
          ...base,
          suggested: { variable, definition },
        }
      : null;
  }
  if (!hasOnlyKeys(value.suggested, ["decision", "rationale"])) return null;
  const rationale = text(value.suggested.rationale, false);
  return value.suggested.decision === request.payload.decision && rationale !== null
    ? {
        task: "decision_rationale_review",
        ...base,
        suggested: { decision: request.payload.decision, rationale },
      }
    : null;
}

const listSchema = {
  type: "array",
  items: { type: "string", maxLength: MAX_TEXT },
  maxItems: 8,
} as const;

const baseProperties = {
  status: { type: "string", enum: ["ok", "incomplete", "refusal"] },
  review: { type: "string", maxLength: MAX_TEXT },
  uncertainty: listSchema,
  evidenceNeeds: listSchema,
  limitations: listSchema,
} as const;

/** Strict task-specific schema shared by OpenAI and Gemini. */
export function aiReviewResponseJsonSchema(request: AiAssistRequest) {
  const suggested =
    request.task === "brief_clarify"
      ? {
          type: "object",
          additionalProperties: false,
          required: ["question"],
          properties: { question: { type: "string", maxLength: MAX_TEXT } },
        }
      : request.task === "calibration_evidence_gaps"
        ? {
            type: "object",
            additionalProperties: false,
            required: ["variable", "definition"],
            properties: {
              variable: { type: "string", enum: [request.payload.variable] },
              definition: { type: "string", maxLength: MAX_TEXT },
            },
          }
        : {
            type: "object",
            additionalProperties: false,
            required: ["decision", "rationale"],
            properties: {
              decision: { type: "string", enum: [request.payload.decision] },
              rationale: { type: "string", maxLength: MAX_TEXT },
            },
          };
  return {
    name: `openqca_${request.task}_review_v2`,
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "task",
        "status",
        "review",
        "suggested",
        "uncertainty",
        "evidenceNeeds",
        "limitations",
      ],
      properties: {
        task: { type: "string", enum: [request.task] },
        ...baseProperties,
        suggested,
      },
    },
  } as const;
}
