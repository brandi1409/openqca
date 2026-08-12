import {
  caseDiagnostics,
  type Expectation,
  type QcaCase,
  type SolutionModel,
} from "@openqca/engine";
import {
  calibrationReadiness,
  effectiveStatus,
  migrateSpecsFromAnchors,
  type CalibSpecs,
  type CalibrationDecisionStatus,
  type VarType,
} from "@/lib/calibration-model";
import { numericColumns, numericValues } from "@/lib/dataset-columns";
import type { RawDataset } from "@/lib/demo";
import type { DecisionRationaleTarget } from "@/lib/ai-contract";

export type WorkspaceDestination = "answer" | "research" | "decisions" | "evidence" | "defense";
export type VarRole = "condition" | "outcome" | "ignore";
export type VarMeta = { type: VarType; role: VarRole };
export type Anchors = Record<string, [number, number, number]>;

export interface ResearchBrief {
  question: string;
  caseUniverse: string;
  timePeriod: string;
  outcomeConcept: string;
  conditionSelectionRationale: string;
  confirmed: boolean;
}

export interface ConfirmedRationale {
  rationale: string;
  confirmed: boolean;
}

export interface AnalysisDecisionState {
  frequencyCutoff: ConfirmedRationale;
  consistencyCutoff: ConfirmedRationale;
  directionalExpectations: ConfirmedRationale;
}
export interface AiWritingProvenanceEntry {
  provider: string;
  model: string;
  generatedAt: string;
  previousTextHash: string;
  adoptedTextHash: string;
  /** Per-adoption random salt; retained in project state and never exported. */
  hashSalt?: string;
}

export interface AiWritingProvenance {
  brief_clarify: { question?: AiWritingProvenanceEntry };
  calibration_evidence_gaps: Record<string, AiWritingProvenanceEntry>;
  decision_rationale_review: Partial<
    Record<DecisionRationaleTarget, AiWritingProvenanceEntry>
  >;
}

export interface AiWritingProvenanceRow
  extends Omit<AiWritingProvenanceEntry, "hashSalt"> {
  task:
    | "brief_clarify"
    | "calibration_evidence_gaps"
    | "decision_rationale_review";
  target: string;
}

export function emptyAiWritingProvenance(): AiWritingProvenance {
  return {
    brief_clarify: {},
    calibration_evidence_gaps: {},
    decision_rationale_review: {},
  };
}


export interface SavedState {
  dataset: RawDataset;
  anchors: Anchors;
  varMeta: Record<string, VarMeta>;
  calibSpecs: CalibSpecs;
  demoMode: boolean;
  freqCut: number;
  consCut: number;
  expectations: Record<string, Expectation>;
  researchBrief: ResearchBrief;
  analysisDecisions: AnalysisDecisionState;
  aiWritingProvenance: AiWritingProvenance;
  /** Legacy fields are accepted on input and intentionally ignored. */
  conditions?: string[];
  outcome?: string;
}

export const EMPTY_RESEARCH_BRIEF: ResearchBrief = {
  question: "",
  caseUniverse: "",
  timePeriod: "",
  outcomeConcept: "",
  conditionSelectionRationale: "",
  confirmed: false,
};

const EMPTY_RATIONALE: ConfirmedRationale = { rationale: "", confirmed: false };

export const EMPTY_ANALYSIS_DECISIONS: AnalysisDecisionState = {
  frequencyCutoff: { ...EMPTY_RATIONALE },
  consistencyCutoff: { ...EMPTY_RATIONALE },
  directionalExpectations: { ...EMPTY_RATIONALE },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDataset(value: unknown): value is RawDataset {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const dataset = value as Partial<RawDataset>;
  return (
    typeof dataset.name === "string" &&
    typeof dataset.caseCol === "string" &&
    Array.isArray(dataset.columns) &&
    dataset.columns.every((column) => typeof column === "string") &&
    Array.isArray(dataset.rows)
  );
}

function detectVarType(values: number[]): VarType {
  if (values.length === 0) return "raw";
  if (values.every((value) => value === 0 || value === 1)) return "crisp";
  return values.every((value) => value >= 0 && value <= 1) ? "fuzzy" : "raw";
}

export function deriveSuggestedVarMeta(dataset: RawDataset): Record<string, VarMeta> {
  const columns = numericColumns(dataset);
  const outcome = columns.at(-1) ?? "";
  return Object.fromEntries(
    columns.map((column) => [
      column,
      {
        type: detectVarType(numericValues(dataset, column)),
        role: column === outcome ? "outcome" : "condition",
      } satisfies VarMeta,
    ]),
  );
}

function normalizeVarMeta(dataset: RawDataset, raw: unknown): Record<string, VarMeta> {
  const suggested = deriveSuggestedVarMeta(dataset);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return suggested;
  const source = raw as Record<string, unknown>;
  return Object.fromEntries(
    numericColumns(dataset).map((column) => {
      const rawValue = source[column];
      if (typeof rawValue !== "object" || rawValue === null || Array.isArray(rawValue)) {
        return [column, suggested[column]];
      }
      const value = rawValue as Partial<VarMeta>;
      const type = value.type === "raw" || value.type === "fuzzy" || value.type === "crisp"
        ? value.type
        : suggested[column].type;
      const role = value.role === "condition" || value.role === "outcome" || value.role === "ignore"
        ? value.role
        : suggested[column].role;
      return [column, { type, role } satisfies VarMeta];
    }),
  );
}

function normalizeResearchBrief(raw: unknown): ResearchBrief {
  const value =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Partial<ResearchBrief>)
      : {};
  return {
    question: typeof value.question === "string" ? value.question : "",
    caseUniverse: typeof value.caseUniverse === "string" ? value.caseUniverse : "",
    timePeriod: typeof value.timePeriod === "string" ? value.timePeriod : "",
    outcomeConcept: typeof value.outcomeConcept === "string" ? value.outcomeConcept : "",
    conditionSelectionRationale:
      typeof value.conditionSelectionRationale === "string" ? value.conditionSelectionRationale : "",
    confirmed: value.confirmed === true,
  };
}

function normalizeConfirmedRationale(raw: unknown): ConfirmedRationale {
  const value =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Partial<ConfirmedRationale>)
      : {};
  return {
    rationale: typeof value.rationale === "string" ? value.rationale : "",
    confirmed: value.confirmed === true,
  };
}

function normalizeAnalysisDecisions(raw: unknown): AnalysisDecisionState {
  const value =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Partial<AnalysisDecisionState>)
      : {};
  return {
    frequencyCutoff: normalizeConfirmedRationale(value.frequencyCutoff),
    consistencyCutoff: normalizeConfirmedRationale(value.consistencyCutoff),
    directionalExpectations: normalizeConfirmedRationale(value.directionalExpectations),
  };
}
function normalizeAiWritingEntry(raw: unknown): AiWritingProvenanceEntry | null {
  if (
    !isRecord(raw) ||
    Object.keys(raw).some(
      (key) =>
        ![
          "provider",
          "model",
          "generatedAt",
          "previousTextHash",
          "adoptedTextHash",
          "hashSalt",
        ].includes(key),
    ) ||
    typeof raw.provider !== "string" ||
    !raw.provider.trim() ||
    raw.provider.length > 200 ||
    typeof raw.model !== "string" ||
    !raw.model.trim() ||
    raw.model.length > 200 ||
    typeof raw.generatedAt !== "string" ||
    Number.isNaN(Date.parse(raw.generatedAt)) ||
    typeof raw.previousTextHash !== "string" ||
    !/^[a-f0-9]{64}$/u.test(raw.previousTextHash) ||
    typeof raw.adoptedTextHash !== "string" ||
    !/^[a-f0-9]{64}$/u.test(raw.adoptedTextHash) ||
    (raw.hashSalt !== undefined &&
      (typeof raw.hashSalt !== "string" || !/^[a-f0-9]{32}$/u.test(raw.hashSalt)))
  ) {
    return null;
  }
  return {
    provider: raw.provider.trim(),
    model: raw.model.trim(),
    generatedAt: new Date(raw.generatedAt).toISOString(),
    previousTextHash: raw.previousTextHash,
    adoptedTextHash: raw.adoptedTextHash,
    ...(typeof raw.hashSalt === "string" ? { hashSalt: raw.hashSalt } : {}),
  };
}

function normalizeAiWritingProvenance(
  raw: unknown,
  columns: string[],
): AiWritingProvenance {
  const normalized = emptyAiWritingProvenance();
  if (!isRecord(raw)) return normalized;

  if (isRecord(raw.brief_clarify)) {
    const question = normalizeAiWritingEntry(raw.brief_clarify.question);
    if (question) normalized.brief_clarify.question = question;
  }

  if (isRecord(raw.decision_rationale_review)) {
    for (const decision of [
      "frequencyCutoff",
      "consistencyCutoff",
      "directionalExpectations",
    ] as const) {
      const entry = normalizeAiWritingEntry(raw.decision_rationale_review[decision]);
      if (entry) normalized.decision_rationale_review[decision] = entry;
    }
  }

  if (isRecord(raw.calibration_evidence_gaps)) {
    for (const column of columns) {
      const entry = normalizeAiWritingEntry(raw.calibration_evidence_gaps[column]);
      if (entry) normalized.calibration_evidence_gaps[column] = entry;
    }
  }
  return normalized;
}
function publicAiWritingEntry(
  entry: AiWritingProvenanceEntry,
): Omit<AiWritingProvenanceEntry, "hashSalt"> {
  return {
    provider: entry.provider,
    model: entry.model,
    generatedAt: entry.generatedAt,
    previousTextHash: entry.previousTextHash,
    adoptedTextHash: entry.adoptedTextHash,
  };
}


export function listAiWritingProvenance(
  provenance: AiWritingProvenance,
  varMeta: Readonly<Record<string, { role: string }>>,
): AiWritingProvenanceRow[] {
  const rows: AiWritingProvenanceRow[] = [];
  const question = provenance.brief_clarify.question;
  if (question) {
    rows.push({
      task: "brief_clarify",
      target: "researchBrief.question",
      ...publicAiWritingEntry(question),
    });
  }
  for (const decision of [
    "frequencyCutoff",
    "consistencyCutoff",
    "directionalExpectations",
  ] as const) {
    const entry = provenance.decision_rationale_review[decision];
    if (entry) {
      rows.push({
        task: "decision_rationale_review",
        target: `analysisDecisions.${decision}.rationale`,
        ...publicAiWritingEntry(entry),
      });
    }
  }
  const calibrationColumns = Object.keys(provenance.calibration_evidence_gaps)
    .filter((column) => varMeta[column]?.role !== "ignore")
    .sort();
  calibrationColumns.forEach((column, index) => {
    rows.push({
      task: "calibration_evidence_gaps",
      target: `calibrationDefinition.${index + 1}`,
      ...publicAiWritingEntry(provenance.calibration_evidence_gaps[column]),
    });
  });
  return rows;
}

function normalizeAnchors(raw: unknown, dataset: RawDataset): Anchors {
  const fallback =
    typeof dataset.anchors === "object" &&
    dataset.anchors !== null &&
    !Array.isArray(dataset.anchors)
      ? dataset.anchors
      : {};
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? raw
      : fallback;
  return Object.fromEntries(
    Object.entries(source).flatMap(([column, value]) =>
      Array.isArray(value) && value.length === 3 && value.every(Number.isFinite)
        ? [[column, [Number(value[0]), Number(value[1]), Number(value[2])] as [number, number, number]]]
        : [],
    ),
  );
}

export function normalizeExpectations(
  conditions: string[],
  raw: unknown,
): Record<string, Expectation> {
  const source =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    conditions.map((condition) => {
      const value = source[condition];
      return [
        condition,
        value === "absent" || value === "either" || value === "present" ? value : "present",
      ];
    }),
  );
}

/**
 * Normalizes V1/V2 local and cloud states. Unknown or structurally invalid
 * payloads return null instead of partially loading a project.
 */
export function normalizeSavedState(raw: unknown): SavedState | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const input = raw as Partial<SavedState>;
  if (!isDataset(input.dataset)) return null;
  const dataset = input.dataset;
  const anchors = normalizeAnchors(input.anchors, dataset);
  const varMeta = normalizeVarMeta(dataset, input.varMeta);
  const columns = numericColumns(dataset);
  const conditions = columns.filter((column) => varMeta[column]?.role === "condition");
  const calibSpecs = migrateSpecsFromAnchors(
    columns,
    anchors,
    typeof input.calibSpecs === "object" && input.calibSpecs !== null
      ? input.calibSpecs
      : undefined,
  );
  return {
    dataset,
    anchors,
    varMeta,
    calibSpecs,
    demoMode: input.demoMode === true,
    freqCut: typeof input.freqCut === "number" && Number.isFinite(input.freqCut) ? input.freqCut : 1,
    consCut: typeof input.consCut === "number" && Number.isFinite(input.consCut) ? input.consCut : 0.8,
    expectations: normalizeExpectations(conditions, input.expectations),
    researchBrief: normalizeResearchBrief(input.researchBrief),
    analysisDecisions: normalizeAnalysisDecisions(input.analysisDecisions),
    aiWritingProvenance: normalizeAiWritingProvenance(
      input.aiWritingProvenance,
      columns,
    ),
  };
}

export interface ReadinessResult {
  ready: boolean;
  missing: string[];
}

export function researchBriefReadiness(
  brief: ResearchBrief,
  conditions: string[],
  outcome: string,
): ReadinessResult {
  const missing: string[] = ([
    "question",
    "caseUniverse",
    "timePeriod",
    "outcomeConcept",
    "conditionSelectionRationale",
  ] as const).filter((field) => !brief[field].trim());
  if (conditions.length < 1) missing.push("conditions");
  if (!outcome) missing.push("outcome");
  if (!brief.confirmed) missing.push("confirmation");
  return { ready: missing.length === 0, missing };
}

export function analysisDecisionReadiness(decisions: AnalysisDecisionState): ReadinessResult {
  const missing: string[] = [];
  for (const key of [
    "frequencyCutoff",
    "consistencyCutoff",
    "directionalExpectations",
  ] as const) {
    const decision = decisions[key];
    if (!decision.rationale.trim()) missing.push(`${key}.rationale`);
    if (!decision.confirmed) missing.push(`${key}.confirmation`);
  }
  return { ready: missing.length === 0, missing };
}

export interface CalibrationDefenseResult extends ReadinessResult {
  columns: Array<{
    column: string;
    protocolReady: boolean;
    effectiveStatus: CalibrationDecisionStatus;
    missingFields: string[];
    missingEvidence: string[];
  }>;
}

export function calibrationDefenseReadiness(
  activeColumns: string[],
  varMeta: Record<string, VarMeta>,
  calibSpecs: CalibSpecs,
): CalibrationDefenseResult {
  const columns = activeColumns.map((column) => {
    const readiness = calibrationReadiness(calibSpecs[column], varMeta[column]?.type ?? "raw");
    const status = calibSpecs[column]
      ? effectiveStatus(calibSpecs[column], varMeta[column]?.type ?? "raw")
      : "unresolved";
    return {
      column,
      protocolReady: readiness.protocolReady,
      effectiveStatus: status,
      missingFields: readiness.missingFields,
      missingEvidence: readiness.missingEvidence,
    };
  });
  const missing = columns
    .filter(
      (item) =>
        !item.protocolReady ||
        (item.effectiveStatus !== "sourced" && item.effectiveStatus !== "externally_checked"),
    )
    .map((item) => item.column);
  return { ready: activeColumns.length > 0 && missing.length === 0, missing, columns };
}

export type DecisionIssueKind =
  | "researchBrief"
  | "calibration"
  | "frequencyCutoff"
  | "consistencyCutoff"
  | "directionalExpectations";

export interface DecisionIssue {
  id: string;
  kind: DecisionIssueKind;
  column?: string;
  status: "unresolved" | "provisional" | "unconfirmed";
  protocolReady: boolean;
  missingFields: string[];
  missingEvidence: string[];
}

export function deriveDecisionIssues(args: {
  researchBrief: ResearchBrief;
  analysisDecisions: AnalysisDecisionState;
  conditions: string[];
  outcome: string;
  activeColumns: string[];
  varMeta: Record<string, VarMeta>;
  calibSpecs: CalibSpecs;
}): DecisionIssue[] {
  const issues: Array<DecisionIssue & { rank: number; order: number; missingCount: number }> = [];
  const brief = researchBriefReadiness(args.researchBrief, args.conditions, args.outcome);
  if (!brief.ready) {
    issues.push({
      id: "research-brief",
      kind: "researchBrief",
      status: "unconfirmed",
      protocolReady: false,
      missingFields: brief.missing,
      missingEvidence: [],
      rank: 1,
      order: -1,
      missingCount: brief.missing.length,
    });
  }

  args.activeColumns.forEach((column, order) => {
    const spec = args.calibSpecs[column];
    const type = args.varMeta[column]?.type ?? "raw";
    const readiness = calibrationReadiness(spec, type);
    const status = spec ? effectiveStatus(spec, type) : "unresolved";
    if (status !== "unresolved" && status !== "provisional") return;
    issues.push({
      id: `calibration-${column}`,
      kind: "calibration",
      column,
      status,
      protocolReady: readiness.protocolReady,
      missingFields: readiness.missingFields,
      missingEvidence: readiness.missingEvidence,
      rank: status === "unresolved" ? 2 : 3,
      order,
      missingCount: readiness.missingFields.length + readiness.missingEvidence.length,
    });
  });

  ([
    ["frequencyCutoff", "frequencyCutoff"],
    ["consistencyCutoff", "consistencyCutoff"],
    ["directionalExpectations", "directionalExpectations"],
  ] as const).forEach(([key, kind], index) => {
    const decision = args.analysisDecisions[key];
    if (decision.confirmed && decision.rationale.trim()) return;
    issues.push({
      id: key,
      kind,
      status: "unconfirmed",
      protocolReady: false,
      missingFields: [
        ...(!decision.rationale.trim() ? ["rationale"] : []),
        ...(!decision.confirmed ? ["confirmation"] : []),
      ],
      missingEvidence: [],
      rank: 4 + index,
      order: index,
      missingCount: !decision.rationale.trim() && !decision.confirmed ? 2 : 1,
    });
  });

  return issues
    .sort((a, b) =>
      a.rank - b.rank ||
      Number(a.protocolReady) - Number(b.protocolReady) ||
      b.missingCount - a.missingCount ||
      a.order - b.order,
    )
    .map((issue): DecisionIssue => {
      const decisionIssue = {
        id: issue.id,
        kind: issue.kind,
        status: issue.status,
        protocolReady: issue.protocolReady,
        missingFields: issue.missingFields,
        missingEvidence: issue.missingEvidence,
      };
      return issue.column ? { ...decisionIssue, column: issue.column } : decisionIssue;
    });
}

export interface AggregateCaseDiagnostics {
  typical: string[];
  deviantConsistencyKind: string[];
  deviantConsistencyDegree: string[];
  deviantCoverage: string[];
  atCrossover: string[];
}

function unique(labels: string[]): string[] {
  return [...new Set(labels)];
}

/** Dedupe only the compact solution-level summary; path detail remains in the engine result. */
export function aggregateCaseDiagnostics(
  model: SolutionModel,
  conditions: string[],
  outcome: string,
  cases: QcaCase[],
): AggregateCaseDiagnostics {
  const diagnostics = caseDiagnostics(model, conditions, outcome, cases);
  return {
    typical: unique(diagnostics.paths.flatMap((path) => path.typical.map((item) => item.label))),
    deviantConsistencyKind: unique(
      diagnostics.paths.flatMap((path) => path.deviantConsistencyKind.map((item) => item.label)),
    ),
    deviantConsistencyDegree: unique(
      diagnostics.paths.flatMap((path) => path.deviantConsistencyDegree.map((item) => item.label)),
    ),
    deviantCoverage: unique(diagnostics.deviantCoverage.map((item) => item.label)),
    atCrossover: unique(diagnostics.atCrossover),
  };
}
