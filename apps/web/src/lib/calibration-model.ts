/**
 * First-class calibration research record: set definition, method, anchors,
 * evidence, and readiness gates. Separate from VarType (data provenance).
 */

export type EvidenceType =
  | "literature"
  | "theory"
  | "standard"
  | "domain_expertise"
  | "case_knowledge"
  | "empirical_diagnostic";

export type CalibrationDecisionStatus =
  | "unresolved"
  | "provisional"
  | "sourced"
  | "externally_checked";

export type RawCalibrationMethod = "direct" | "linear" | "crisp";

export type VarType = "raw" | "fuzzy" | "crisp";

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  supports: "set" | "fullOut" | "crossover" | "fullIn" | "threshold" | "method";
  citation: {
    authors?: string;
    year?: string;
    title?: string;
    doiOrUrl?: string;
    pages?: string;
  };
  note: string;
  isSubstantive: boolean;
}

export interface SetDefinition {
  setLabel: string;
  definition: string;
  unit: string;
  scopePopulation: string;
  timePeriod: string;
  /** true = higher raw → more in set; false = invert after calibration */
  highIsMembership: boolean;
  notes: string;
}

export interface DirectAnchors {
  fullOut: number;
  crossover: number;
  fullIn: number;
  meaningFullOut: string;
  meaningCrossover: string;
  meaningFullIn: string;
}

export interface CrispThreshold {
  threshold: number;
  meaningInclusion: string;
}

export type MissingPolicy =
  | { kind: "exclude_case" }
  | { kind: "assign"; membership: 0 | 1 }
  | { kind: "leave_unresolved" };

export interface ExternalReviewAttestation {
  reviewer: string;
  date: string;
  note: string;
}

export interface SensitivityAlternative {
  id: string;
  label: string;
  delta: number;
  rationale: string;
}

export interface ExceptionalCase {
  caseLabel: string;
  note: string;
  /** Stable source-row identity; legacy notes may omit it. */
  rowIndex?: number;
}

export interface CalibrationSpec {
  column: string;
  set: SetDefinition;
  method?: RawCalibrationMethod;
  direct?: DirectAnchors;
  linear?: DirectAnchors;
  crisp?: CrispThreshold;
  alreadyCalibratedProvenance?: string;
  missing: MissingPolicy;
  evidence: EvidenceItem[];
  status: CalibrationDecisionStatus;
  /** True when import-time placeholders still need substantive replacement. */
  provisionalDefaults?: boolean;
  /**
   * Die Anker stammen unverändert aus der Perzentil-Heuristik des Imports
   * (`lib/csv.ts`/`lib/xlsx.ts`), nicht aus einer inhaltlichen Entscheidung.
   *
   * Das ist ausdrücklich KEINE Begründung: Datengetriebene Schwellen sind in der
   * QCA-Methodik kein zulässiger Kalibrierungsgrund. Seit Ergebnisse sofort
   * erscheinen, kann man in zwei Klicks zu einer Lösungsformel kommen, deren
   * Anker niemand begründet hat — deshalb muss die Herkunft sichtbar bleiben,
   * bis der Nutzer einen Anker selbst anfasst.
   */
  anchorsFromData?: boolean;
  methodConfirmed: boolean;
  caseReviewConfirmed: boolean;
  externalReview?: ExternalReviewAttestation;
  exceptionalCases: ExceptionalCase[];
  sensitivity: {
    alternatives: SensitivityAlternative[];
    notes: string;
    reviewed: boolean;
  };
}

export type CalibSpecs = Record<string, CalibrationSpec>;

function emptySet(): SetDefinition {
  return {
    setLabel: "",
    definition: "",
    unit: "",
    scopePopulation: "",
    timePeriod: "",
    highIsMembership: true,
    notes: "",
  };
}

export function emptySpec(column: string): CalibrationSpec {
  return {
    column,
    set: emptySet(),
    missing: { kind: "exclude_case" },
    evidence: [],
    status: "unresolved",
    methodConfirmed: false,
    caseReviewConfirmed: false,
    exceptionalCases: [],
    sensitivity: {
      alternatives: [],
      notes: "",
      reviewed: false,
    },
  };
}

export function defaultSpecFromAnchors(
  column: string,
  anchors: [number, number, number],
): CalibrationSpec {
  return {
    ...emptySpec(column),
    method: "direct",
    direct: {
      fullOut: anchors[0],
      crossover: anchors[1],
      fullIn: anchors[2],
      meaningFullOut: "",
      meaningCrossover: "",
      meaningFullIn: "",
    },
  };
}

function nonEmpty(s: string | undefined): boolean {
  return !!s && s.trim().length > 0;
}

export function anchorsAscending(
  a: { fullOut: number; crossover: number; fullIn: number } | undefined,
  highIsMembership = true,
): boolean {
  return (
    !!a &&
    (highIsMembership
      ? a.fullOut < a.crossover && a.crossover < a.fullIn
      : a.fullOut > a.crossover && a.crossover > a.fullIn)
  );
}

/** Return engine-ready ascending thresholds for semantic direct anchors. */
export function directThresholds(
  a: { fullOut: number; crossover: number; fullIn: number } | undefined,
  highIsMembership = true,
): [number, number, number] | undefined {
  if (!anchorsAscending(a, highIsMembership) || !a) return undefined;
  return highIsMembership
    ? [a.fullOut, a.crossover, a.fullIn]
    : [a.fullIn, a.crossover, a.fullOut];
}
export type EvidenceTarget =
  | "set"
  | "method"
  | "fullOut"
  | "crossover"
  | "fullIn"
  | "threshold";

function finiteDirectAnchors(a: DirectAnchors | undefined, highIsMembership: boolean): boolean {
  return (
    !!a &&
    Number.isFinite(a.fullOut) &&
    Number.isFinite(a.crossover) &&
    Number.isFinite(a.fullIn) &&
    anchorsAscending(a, highIsMembership)
  );
}

function citationComplete(item: EvidenceItem): boolean {
  const citation = item.citation;
  return (
    !!citation.doiOrUrl?.trim() ||
    (!!citation.authors?.trim() && !!citation.year?.trim() && !!citation.title?.trim())
  );
}

function evidenceSupports(spec: CalibrationSpec, target: EvidenceTarget): boolean {
  return spec.evidence.some(
    (item) =>
      item.isSubstantive &&
      item.supports === target &&
      nonEmpty(item.note) &&
      citationComplete(item),
  );
}

export function requiredEvidenceTargets(spec: CalibrationSpec, varType: VarType): EvidenceTarget[] {
  if (varType !== "raw") return ["set", "method"];
  if (spec.method === "direct" || spec.method === "linear") {
    return ["set", "method", "fullOut", "crossover", "fullIn"];
  }
  if (spec.method === "crisp") return ["set", "method", "threshold"];
  return ["set", "method"];
}

function computationalFields(spec: CalibrationSpec | undefined, varType: VarType): string[] {
  if (!spec) return ["spec"];
  const missing: string[] = [];
  if (!nonEmpty(spec.set.setLabel)) missing.push("setLabel");
  if (!nonEmpty(spec.set.definition)) missing.push("definition");
  if (spec.missing.kind === "leave_unresolved") missing.push("missingPolicy");

  if (varType === "raw") {
    if (spec.method === "direct" || spec.method === "linear") {
      const anchors = spec.method === "direct" ? spec.direct : spec.linear;
      if (!finiteDirectAnchors(anchors, spec.set.highIsMembership)) missing.push("directAnchors");
    } else if (spec.method === "crisp") {
      if (!spec.crisp || !Number.isFinite(spec.crisp.threshold)) missing.push("crispThreshold");
    } else {
      missing.push("method");
    }
  } else if (!nonEmpty(spec.alreadyCalibratedProvenance)) {
    missing.push("alreadyCalibratedProvenance");
  }
  return missing;
}

function sensitivityVariantSignature(
  spec: CalibrationSpec,
  alternative: SensitivityAlternative,
): string | null {
  if (!Number.isFinite(alternative.delta)) return null;
  if (spec.method === "direct" || spec.method === "linear") {
    const anchors = spec.method === "direct" ? spec.direct : spec.linear;
    const base = directThresholds(anchors, spec.set.highIsMembership);
    if (!base) return null;
    const gap = Math.max(Math.abs(base[2] - base[0]) * 1e-6, 1e-9);
    const crossover = Math.min(
      base[2] - gap,
      Math.max(base[0] + gap, base[1] + alternative.delta),
    );
    return `${base[0]}|${crossover}|${base[2]}`;
  }
  if (spec.method === "crisp" && spec.crisp && Number.isFinite(spec.crisp.threshold)) {
    return String(spec.crisp.threshold + alternative.delta);
  }
  return null;
}
function sensitivityProtocolReady(spec: CalibrationSpec, varType: VarType): boolean {
  if (varType !== "raw") return true;
  const alternatives = spec.sensitivity?.alternatives ?? [];
  const baseSignature = sensitivityVariantSignature(spec, {
    id: "base",
    label: "Base calibration",
    delta: 0,
    rationale: "",
  });
  const signatures = alternatives
    .map((alternative) => sensitivityVariantSignature(spec, alternative))
    .filter((signature): signature is string => signature !== null);
  const changedSignatures = signatures.filter((signature) => signature !== baseSignature);
  return (
    alternatives.length >= 2 &&
    signatures.length === alternatives.length &&
    changedSignatures.length === alternatives.length &&
    new Set(changedSignatures).size >= 2 &&
    alternatives.every(
      (alternative) =>
        nonEmpty(alternative.label) &&
        nonEmpty(alternative.rationale) &&
        Number.isFinite(alternative.delta),
    ) &&
    spec.sensitivity.reviewed === true
  );
}

export interface CalibrationReadiness {
  computable: boolean;
  protocolReady: boolean;
  missingFields: string[];
  missingEvidence: EvidenceTarget[];
}

export function calibrationReadiness(
  spec: CalibrationSpec | undefined,
  varType: VarType,
): CalibrationReadiness {
  if (!spec) {
    return {
      computable: false,
      protocolReady: false,
      missingFields: ["spec"],
      missingEvidence: ["set", "method"],
    };
  }

  const missingFields = computationalFields(spec, varType);
  const missingEvidence = requiredEvidenceTargets(spec, varType).filter(
    (target) => !evidenceSupports(spec, target),
  );
  const computable = missingFields.length === 0;

  if (!nonEmpty(spec.set.unit)) missingFields.push("unit");
  if (!nonEmpty(spec.set.scopePopulation)) missingFields.push("scopePopulation");
  if (!nonEmpty(spec.set.timePeriod)) missingFields.push("timePeriod");
  if (varType === "raw" && (spec.method === "direct" || spec.method === "linear")) {
    const anchors = spec.method === "direct" ? spec.direct : spec.linear;
    if (!nonEmpty(anchors?.meaningFullOut)) missingFields.push("meaningFullOut");
    if (!nonEmpty(anchors?.meaningCrossover)) missingFields.push("meaningCrossover");
    if (!nonEmpty(anchors?.meaningFullIn)) missingFields.push("meaningFullIn");
  }
  if (varType === "raw" && spec.method === "crisp" && !nonEmpty(spec.crisp?.meaningInclusion)) {
    missingFields.push("meaningInclusion");
  }
  if (!spec.methodConfirmed) missingFields.push("methodConfirmed");
  if (!spec.caseReviewConfirmed) missingFields.push("caseReviewConfirmed");
  if (spec.provisionalDefaults) missingFields.push("provisionalDefaults");

  if (!sensitivityProtocolReady(spec, varType)) missingFields.push("sensitivityReview");
  return {
    computable,
    protocolReady:
      computable &&
      !spec.provisionalDefaults &&
      missingEvidence.length === 0 &&
      spec.methodConfirmed &&
      spec.caseReviewConfirmed &&
      sensitivityProtocolReady(spec, varType) &&
      nonEmpty(spec.set.unit) &&
      nonEmpty(spec.set.scopePopulation) &&
      nonEmpty(spec.set.timePeriod) &&
      (!("meaningFullOut" in (spec.direct ?? {})) || !missingFields.includes("meaningFullOut")) &&
      !missingFields.includes("meaningCrossover") &&
      !missingFields.includes("meaningFullIn") &&
      !missingFields.includes("meaningInclusion"),
    missingFields: [...new Set(missingFields)],
    missingEvidence,
  };
}

export function specIsComputable(spec: CalibrationSpec | undefined, varType: VarType): boolean {
  return calibrationReadiness(spec, varType).computable;
}

export function specIsProtocolReady(spec: CalibrationSpec | undefined, varType: VarType): boolean {
  return calibrationReadiness(spec, varType).protocolReady;
}
// Hinweis: Die frühere Zwischenstufe `specIsAnalysisReady` (Evidenz komplett,
// aber Sensitivität offen) wurde mit der Flow-Umkehr entfernt: Rechnen hängt
// jetzt an `specIsComputable`, Publikationsreife/Export an `specIsProtocolReady`.
// Eine dritte Stufe mit dem irreführenden Namen „analysis-ready" hätte nur
// wieder suggeriert, die Analyse sei an Dokumentation gebunden.

export function hasSubstantiveEvidence(spec: CalibrationSpec): boolean {
  return spec.evidence.some((e) => e.isSubstantive && nonEmpty(e.note) && citationComplete(e));
}

/** Derive display/status chip from evidence, completeness, and explicit status. */
export function effectiveStatus(
  spec: CalibrationSpec,
  varType: VarType = "raw",
): CalibrationDecisionStatus {
  const readiness = calibrationReadiness(spec, varType);
  if (
    spec.status === "externally_checked" &&
    readiness.protocolReady &&
    nonEmpty(spec.externalReview?.reviewer) &&
    nonEmpty(spec.externalReview?.date) &&
    nonEmpty(spec.externalReview?.note)
  ) {
    return "externally_checked";
  }
  if (spec.status === "provisional") return "provisional";
  if (readiness.protocolReady) return "sourced";
  return "unresolved";
}

export function missingToOnMissing(
  missing: MissingPolicy,
): "NaN" | 0 | 1 {
  if (missing.kind === "assign") return missing.membership;
  return "NaN";
}

export type DecisionBadgeKind = "bad" | "warn" | "ok" | "ok-accent";

export function decisionBadge(status: CalibrationDecisionStatus): {
  kind: DecisionBadgeKind;
  labelKey: string;
} {
  switch (status) {
    case "unresolved":
      return { kind: "bad", labelKey: "calib.status.unresolved" };
    case "provisional":
      return { kind: "warn", labelKey: "calib.status.provisional" };
    case "sourced":
      return { kind: "ok", labelKey: "calib.status.sourced" };
    case "externally_checked":
      return { kind: "ok-accent", labelKey: "calib.status.external" };
  }
}

/** Mirror raw fuzzy numeric anchors into legacy ascending-threshold state. */
export function anchorsFromSpecs(specs: CalibSpecs): Record<string, [number, number, number]> {
  const out: Record<string, [number, number, number]> = {};
  for (const [col, spec] of Object.entries(specs)) {
    const anchors =
      spec.method === "direct" ? spec.direct : spec.method === "linear" ? spec.linear : undefined;
    const thresholds = directThresholds(anchors, spec.set.highIsMembership);
    if (thresholds) out[col] = thresholds;
  }
  return out;
}

type LegacyCalibrationSpec = Omit<Partial<CalibrationSpec>, "sensitivity"> & {
  sensitivity?: {
    alternatives?: SensitivityAlternative[];
    crossoverOrThresholdDeltas?: number[];
    notes?: string;
    reviewed?: boolean;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function finiteValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizedMethod(value: unknown): RawCalibrationMethod | undefined {
  switch (value) {
    case "direct":
    case "linear":
    case "crisp":
      return value;
    default:
      return undefined;
  }
}

function normalizedStatus(value: unknown): CalibrationDecisionStatus | undefined {
  switch (value) {
    case "unresolved":
    case "provisional":
    case "sourced":
    case "externally_checked":
      return value;
    default:
      return undefined;
  }
}

function normalizedSet(value: unknown): SetDefinition {
  const base = emptySet();
  if (!isRecord(value)) return base;
  return {
    setLabel: stringValue(value.setLabel),
    definition: stringValue(value.definition),
    unit: stringValue(value.unit),
    scopePopulation: stringValue(value.scopePopulation),
    timePeriod: stringValue(value.timePeriod),
    highIsMembership:
      typeof value.highIsMembership === "boolean"
        ? value.highIsMembership
        : base.highIsMembership,
    notes: stringValue(value.notes),
  };
}

function normalizedDirectAnchors(value: unknown): DirectAnchors | undefined {
  if (!isRecord(value)) return undefined;
  const fullOut = finiteValue(value.fullOut);
  const crossover = finiteValue(value.crossover);
  const fullIn = finiteValue(value.fullIn);
  if (fullOut === undefined || crossover === undefined || fullIn === undefined) {
    return undefined;
  }
  return {
    fullOut,
    crossover,
    fullIn,
    meaningFullOut: stringValue(value.meaningFullOut),
    meaningCrossover: stringValue(value.meaningCrossover),
    meaningFullIn: stringValue(value.meaningFullIn),
  };
}

function normalizedCrispThreshold(value: unknown): CrispThreshold | undefined {
  if (!isRecord(value)) return undefined;
  const threshold = finiteValue(value.threshold);
  if (threshold === undefined) return undefined;
  return {
    threshold,
    meaningInclusion: stringValue(value.meaningInclusion),
  };
}

function normalizedMissingPolicy(value: unknown): MissingPolicy {
  if (!isRecord(value)) return { kind: "exclude_case" };
  if (value.kind === "leave_unresolved") return { kind: "leave_unresolved" };
  if (
    value.kind === "assign" &&
    (value.membership === 0 || value.membership === 1)
  ) {
    return { kind: "assign", membership: value.membership };
  }
  return { kind: "exclude_case" };
}

function normalizedEvidenceType(value: unknown): EvidenceType | undefined {
  switch (value) {
    case "literature":
    case "theory":
    case "standard":
    case "domain_expertise":
    case "case_knowledge":
    case "empirical_diagnostic":
      return value;
    default:
      return undefined;
  }
}

function normalizedEvidenceTarget(
  value: unknown,
): EvidenceItem["supports"] | undefined {
  switch (value) {
    case "set":
    case "fullOut":
    case "crossover":
    case "fullIn":
    case "threshold":
    case "method":
      return value;
    default:
      return undefined;
  }
}

function normalizedEvidence(value: unknown): EvidenceItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate): EvidenceItem[] => {
    if (!isRecord(candidate) || !isRecord(candidate.citation)) return [];
    const type = normalizedEvidenceType(candidate.type);
    const supports = normalizedEvidenceTarget(candidate.supports);
    if (
      typeof candidate.id !== "string" ||
      !type ||
      !supports ||
      typeof candidate.note !== "string" ||
      typeof candidate.isSubstantive !== "boolean"
    ) {
      return [];
    }
    const citation = candidate.citation;
    return [{
      id: candidate.id,
      type,
      supports,
      citation: {
        authors: typeof citation.authors === "string" ? citation.authors : undefined,
        year: typeof citation.year === "string" ? citation.year : undefined,
        title: typeof citation.title === "string" ? citation.title : undefined,
        doiOrUrl: typeof citation.doiOrUrl === "string" ? citation.doiOrUrl : undefined,
        pages: typeof citation.pages === "string" ? citation.pages : undefined,
      },
      note: candidate.note,
      isSubstantive: candidate.isSubstantive,
    }];
  });
}

function normalizedExternalReview(
  value: unknown,
): ExternalReviewAttestation | undefined {
  if (
    !isRecord(value) ||
    typeof value.reviewer !== "string" ||
    typeof value.date !== "string" ||
    typeof value.note !== "string"
  ) {
    return undefined;
  }
  return {
    reviewer: value.reviewer,
    date: value.date,
    note: value.note,
  };
}

function normalizedExceptionalCases(value: unknown): ExceptionalCase[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate): ExceptionalCase[] => {
    if (
      !isRecord(candidate) ||
      typeof candidate.caseLabel !== "string" ||
      typeof candidate.note !== "string"
    ) {
      return [];
    }
    const rowIndex =
      typeof candidate.rowIndex === "number" &&
      Number.isInteger(candidate.rowIndex) &&
      candidate.rowIndex >= 0
        ? candidate.rowIndex
        : undefined;
    return [{
      caseLabel: candidate.caseLabel,
      note: candidate.note,
      ...(rowIndex === undefined ? {} : { rowIndex }),
    }];
  });
}

function normalizedSensitivity(
  value: unknown,
): LegacyCalibrationSpec["sensitivity"] {
  if (!isRecord(value)) return undefined;
  const alternatives = Array.isArray(value.alternatives)
    ? value.alternatives.flatMap((candidate): SensitivityAlternative[] => {
        if (
          !isRecord(candidate) ||
          typeof candidate.id !== "string" ||
          typeof candidate.label !== "string" ||
          typeof candidate.rationale !== "string"
        ) {
          return [];
        }
        const delta = finiteValue(candidate.delta);
        return delta === undefined
          ? []
          : [{
              id: candidate.id,
              label: candidate.label,
              delta,
              rationale: candidate.rationale,
            }];
      })
    : undefined;
  const crossoverOrThresholdDeltas = Array.isArray(value.crossoverOrThresholdDeltas)
    ? value.crossoverOrThresholdDeltas.flatMap((candidate) => {
        const delta = finiteValue(candidate);
        return delta === undefined ? [] : [delta];
      })
    : undefined;
  return {
    ...(alternatives === undefined ? {} : { alternatives }),
    ...(crossoverOrThresholdDeltas === undefined
      ? {}
      : { crossoverOrThresholdDeltas }),
    notes: stringValue(value.notes),
    reviewed: value.reviewed === true,
  };
}

function normalizedLegacySpec(value: unknown): LegacyCalibrationSpec | undefined {
  if (!isRecord(value)) return undefined;
  return {
    set: normalizedSet(value.set),
    method: normalizedMethod(value.method),
    direct: normalizedDirectAnchors(value.direct),
    linear: normalizedDirectAnchors(value.linear),
    crisp: normalizedCrispThreshold(value.crisp),
    alreadyCalibratedProvenance:
      typeof value.alreadyCalibratedProvenance === "string"
        ? value.alreadyCalibratedProvenance
        : undefined,
    missing: normalizedMissingPolicy(value.missing),
    evidence: normalizedEvidence(value.evidence),
    status: normalizedStatus(value.status),
    provisionalDefaults: value.provisionalDefaults === true,
    anchorsFromData: value.anchorsFromData === true,
    methodConfirmed: value.methodConfirmed === true,
    caseReviewConfirmed: value.caseReviewConfirmed === true,
    externalReview: normalizedExternalReview(value.externalReview),
    exceptionalCases: normalizedExceptionalCases(value.exceptionalCases),
    sensitivity: normalizedSensitivity(value.sensitivity),
  };
}

function normalizeSpec(column: string, input: LegacyCalibrationSpec | undefined): CalibrationSpec {
  const base = emptySpec(column);
  const rawSensitivity = input?.sensitivity;
  const alternatives =
    rawSensitivity?.alternatives ??
    rawSensitivity?.crossoverOrThresholdDeltas?.map((delta, index) => ({
      id: `legacy-${index + 1}`,
      label: `Legacy alternative ${delta >= 0 ? "+" : ""}${delta}`,
      delta,
      rationale: "",
    })) ??
    base.sensitivity.alternatives;

  return {
    ...base,
    ...input,
    column,
    methodConfirmed: input?.methodConfirmed === true,
    caseReviewConfirmed: input?.caseReviewConfirmed === true,
    sensitivity: {
      alternatives,
      notes: rawSensitivity?.notes ?? base.sensitivity.notes,
      reviewed: rawSensitivity?.reviewed === true,
    },
  };
}

export function migrateSpecsFromAnchors(
  columns: string[],
  anchors: Record<string, [number, number, number]>,
  existing?: unknown,
): CalibSpecs {
  const out: CalibSpecs = {};
  const existingRecord = isRecord(existing) ? existing : undefined;
  for (const col of columns) {
    const current = normalizedLegacySpec(existingRecord?.[col]);
    out[col] = normalizeSpec(
      col,
      current ??
        (anchors[col]
          ? defaultSpecFromAnchors(col, anchors[col])
          : emptySpec(col)),
    );
  }
  return out;
}

export function newEvidenceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
