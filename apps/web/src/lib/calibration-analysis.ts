import {
  calibrateValue,
  runCalibrationSensitivity,
  type AnchorVariant,
  type CalibrationSensitivityResult,
  type CalibrationMethod,
  type QcaCase,
} from "@openqca/engine";
import type { RawDataset } from "@/lib/demo";
import { cellToNumber, numericColumns } from "@/lib/dataset-columns";
import {
  directThresholds,
  missingToOnMissing,
  type CalibSpecs,
  type CalibrationSpec,
  type VarType,
} from "@/lib/calibration-model";

export type CalibrationVarMeta = {
  type: VarType;
  role: "condition" | "outcome" | "ignore";
};

export type MembershipSide = "in" | "out" | "half" | "missing";

export interface CalibrationCaseCell {
  caseLabel: string;
  rowIndex: number;
  column: string;
  rawValue: number | null;
  membership: number | null;
  side: MembershipSide;
  flags: string[];
}

export interface CalibrationEvaluation {
  cases: QcaCase[];
  cells: CalibrationCaseCell[];
  excludedCaseLabels: string[];
  unresolvedCaseLabels: string[];
}

type RowIdentifiedCase<T extends { caseLabel: string }> = Omit<T, "caseLabel"> & {
  caseLabel: string;
  rowIndex: number;
};

export type CalibrationSensitivityResultWithRows = Omit<
  CalibrationSensitivityResult,
  "flips" | "truthTableRowChanges" | "caseClassificationChanges"
> & {
  flips: RowIdentifiedCase<CalibrationSensitivityResult["flips"][number]>[];
  truthTableRowChanges: RowIdentifiedCase<
    CalibrationSensitivityResult["truthTableRowChanges"][number]
  >[];
  caseClassificationChanges: RowIdentifiedCase<
    CalibrationSensitivityResult["caseClassificationChanges"][number]
  >[];
};

function activeColumns(ds: RawDataset, varMeta: Record<string, CalibrationVarMeta>): string[] {
  return numericColumns(ds).filter((column) => varMeta[column]?.role !== "ignore");
}

function membershipSide(membership: number | null): MembershipSide {
  if (membership === null || !Number.isFinite(membership)) return "missing";
  if (Math.abs(membership - 0.5) < 1e-9) return "half";
  return membership > 0.5 ? "in" : "out";
}

function roundMembership(value: number, type: VarType): number {
  return type === "crisp" ? value : +value.toFixed(4);
}

function rawBoundary(raw: number, spec: CalibrationSpec): boolean {
  const thresholds =
    spec.method === "direct" && spec.direct
      ? (directThresholds(spec.direct, spec.set.highIsMembership) ?? [])
      : spec.method === "crisp" && spec.crisp
        ? [spec.crisp.threshold]
        : [];
  return thresholds.some((threshold) => raw === threshold);
}

function evaluateCell(
  raw: number | null,
  type: VarType,
  spec: CalibrationSpec | undefined,
): { membership: number | null; flags: string[] } {
  const flags: string[] = [];
  if (raw === null) {
    flags.push("missing");
    const assigned = spec?.missing.kind === "assign" ? spec.missing.membership : null;
    if (assigned === null) {
      if (spec?.missing.kind === "leave_unresolved") flags.push("unresolved");
      if (spec?.missing.kind === "exclude_case") flags.push("excluded");
      return { membership: null, flags };
    }
    flags.push("missing-assigned");
    return { membership: assigned, flags };
  }

  if (!spec) return { membership: null, flags: ["unresolved", "missing-spec"] };
  let membership: number;
  try {
    if (type === "raw" && spec.method === "direct" && spec.direct) {
      membership = calibrateValue(raw, {
        method: "direct",
        thresholds: directThresholds(spec.direct, spec.set.highIsMembership) ?? [],
        highIsMembership: spec.set.highIsMembership,
        onMissing: missingToOnMissing(spec.missing),
      });
    } else if (type === "raw" && spec.method === "crisp" && spec.crisp) {
      membership = calibrateValue(raw, {
        method: "crisp",
        thresholds: [spec.crisp.threshold],
        highIsMembership: spec.set.highIsMembership,
        crispInclusive: spec.set.highIsMembership === false,
        onMissing: missingToOnMissing(spec.missing),
      });
    } else if (type !== "raw" && spec.alreadyCalibratedProvenance) {
      membership = spec.set.highIsMembership ? raw : 1 - raw;
    } else {
      return { membership: null, flags: ["unresolved", "missing-method"] };
    }
  } catch {
    return { membership: null, flags: ["unresolved", "invalid-parameters"] };
  }

  if (!Number.isFinite(membership)) return { membership: null, flags: ["missing", "unresolved"] };
  if (rawBoundary(raw, spec)) flags.push("raw-anchor-boundary");
  if (membership >= 0 && membership <= 1) {
    if (Math.abs(membership - 0.5) < 1e-9) flags.push("exact-crossover");
    if (Math.abs(membership - 0.5) <= 0.05) flags.push("near-crossover");
  } else {
    flags.push("out-of-range");
  }
  return { membership: roundMembership(membership, type), flags };
}

export function evaluateCalibration(
  ds: RawDataset,
  varMeta: Record<string, CalibrationVarMeta>,
  calibSpecs: CalibSpecs,
): CalibrationEvaluation {
  const columns = activeColumns(ds, varMeta);
  const duplicateLabels = new Set<string>();
  const labels = ds.rows.map((row) => String(row[ds.caseCol] ?? ""));
  const seenLabels = new Set<string>();
  labels.forEach((label) => {
    if (seenLabels.has(label)) duplicateLabels.add(label);
    seenLabels.add(label);
  });

  const cells: CalibrationCaseCell[] = [];
  const excluded = new Set<string>();
  const unresolved = new Set<string>();
  const cases: QcaCase[] = [];

  ds.rows.forEach((row, rowIndex) => {
    const caseLabel = labels[rowIndex];
    const values: Record<string, number> = {};
    let omitFromAnalysis = false;

    columns.forEach((column) => {
      const spec = calibSpecs[column];
      const rawValue = cellToNumber(row[column]);
      const result = evaluateCell(rawValue, varMeta[column].type, spec);
      const flags = [...result.flags];
      if (duplicateLabels.has(caseLabel)) flags.push("duplicate-case-label");
      const side = membershipSide(result.membership);
      cells.push({
        caseLabel,
        rowIndex,
        column,
        rawValue,
        membership: result.membership,
        side,
        flags,
      });

      if (flags.includes("excluded")) excluded.add(caseLabel);
      if (flags.includes("unresolved")) unresolved.add(caseLabel);
      if (result.membership === null || !Number.isFinite(result.membership)) omitFromAnalysis = true;
      else values[column] = result.membership;
    });

    if (!omitFromAnalysis) cases.push({ label: caseLabel, values });
  });

  return {
    cases,
    cells,
    excludedCaseLabels: [...excluded],
    unresolvedCaseLabels: [...unresolved],
  };
}

function baseVariant(
  columns: string[],
  varMeta: Record<string, CalibrationVarMeta>,
  calibSpecs: CalibSpecs,
): AnchorVariant {
  const thresholdsByCondition: Record<string, number[]> = {};
  const methodsByCondition: Record<string, CalibrationMethod> = {};
  const highIsMembershipByCondition: Record<string, boolean> = {};
  const crispInclusiveByCondition: Record<string, boolean> = {};
  const missingByCondition: Record<string, "NaN" | 0 | 1> = {};

  columns.forEach((column) => {
    const spec = calibSpecs[column];
    highIsMembershipByCondition[column] = spec?.set.highIsMembership ?? true;
    missingByCondition[column] = spec ? missingToOnMissing(spec.missing) : "NaN";
    if (spec.method === "direct" && spec.direct) {
      const thresholds = directThresholds(spec.direct, spec.set.highIsMembership);
      if (!thresholds) return;
      methodsByCondition[column] = spec.method;
      thresholdsByCondition[column] = thresholds;
    } else if (spec.method === "crisp" && spec.crisp && Number.isFinite(spec.crisp.threshold)) {
      methodsByCondition[column] = spec.method;
      thresholdsByCondition[column] = [spec.crisp.threshold];
      crispInclusiveByCondition[column] = spec.set.highIsMembership === false;
    }
  });

  return {
    id: "base",
    label: "Base calibration",
    thresholdsByCondition,
    methodsByCondition,
    highIsMembershipByCondition,
    crispInclusiveByCondition,
    missingByCondition,
  };
}

function diagnosticDeltas(type: VarType, spec: CalibrationSpec, values: number[]): number[] {
  if (type === "raw" && spec.method === "direct" && spec.direct) {
    const span = Math.abs(spec.direct.fullIn - spec.direct.fullOut);
    return [-span * 0.05, span * 0.05].map((delta) => +delta.toFixed(4));
  }
  const finite = values.filter(Number.isFinite);
  const span = finite.length ? Math.max(...finite) - Math.min(...finite) : 1;
  const delta = Math.max(span * 0.05, 0.01);
  return [-delta, delta].map((value) => +value.toFixed(4));
}

function alternativeVariants(
  column: string,
  type: VarType,
  spec: CalibrationSpec | undefined,
  base: AnchorVariant,
  values: number[],
): AnchorVariant[] {
  if (!spec || type !== "raw" || !spec.method || !base.thresholdsByCondition[column]) return [];
  const explicit = spec.sensitivity?.alternatives ?? [];
  const fallback = explicit.length
    ? explicit
    : diagnosticDeltas(type, spec, values).map((delta, index) => ({
        id: `diagnostic-${index + 1}`,
        label: `Diagnostic ${delta >= 0 ? "+" : ""}${delta}`,
        delta,
        rationale: "Empirical diagnostic only; substantive rationale required.",
      }));
  const diagnostic = explicit.length === 0;

  return fallback.map((alternative, index) => {
    const thresholdsByCondition = Object.fromEntries(
      Object.entries(base.thresholdsByCondition).map(([name, thresholds]) => [name, [...thresholds]]),
    );
    const current = thresholdsByCondition[column];
    const rawDelta = Number.isFinite(alternative.delta) ? alternative.delta : 0;
    if (spec.method === "direct" && spec.direct) {
      const low = current[0];
      const high = current[2];
      const gap = Math.max(Math.abs(high - low) * 1e-6, 1e-9);
      current[1] = Math.min(
        high - gap,
        Math.max(low + gap, current[1] + rawDelta),
      );
    } else {
      current[0] += rawDelta;
    }

    return {
      ...base,
      id: `${column}-${alternative.id || `alternative-${index + 1}`}`,
      label: `${column}: ${alternative.label || `Alternative ${index + 1}`}`,
      rationale: alternative.rationale,
      isDiagnostic: diagnostic,
      thresholdsByCondition,
    };
  });
}

export interface SensitivityBundle {
  resultsByColumn: Record<string, CalibrationSensitivityResultWithRows[]>;
  variantsByColumn: Record<string, AnchorVariant[]>;
}

export function buildSensitivityBundle(args: {
  ds: RawDataset;
  varMeta: Record<string, CalibrationVarMeta>;
  calibSpecs: CalibSpecs;
  conditions: string[];
  outcome: string;
  freqCut: number;
  consCut: number;
}): SensitivityBundle {
  const columns = activeColumns(args.ds, args.varMeta);
  const base = baseVariant(columns, args.varMeta, args.calibSpecs);
  const valuesByColumn: Record<string, number[]> = Object.fromEntries(
    columns.map((column) => [
      column,
      args.ds.rows.map((row) => {
        const value = cellToNumber(row[column]);
        return value === null ? NaN : value;
      }),
    ]),
  );
  const caseIdentities = args.ds.rows.map((row, rowIndex) => {
    const label = String(row[args.ds.caseCol] ?? "");
    return {
      engineLabel: JSON.stringify([label, rowIndex]),
      label,
      rowIndex,
    };
  });
  const identityByEngineLabel = new Map(
    caseIdentities.map((identity) => [identity.engineLabel, identity] as const),
  );
  const restoreCaseIdentity = <T extends { caseLabel: string }>(
    entry: T,
  ): RowIdentifiedCase<T> => {
    const identity = identityByEngineLabel.get(entry.caseLabel);
    if (!identity) {
      throw new Error(`Unknown calibration sensitivity case identity: ${entry.caseLabel}`);
    }
    return {
      ...entry,
      caseLabel: identity.label,
      rowIndex: identity.rowIndex,
    };
  };
  const calibrateColumns = columns.filter(
    (column) => args.varMeta[column].type === "raw" && !!base.methodsByCondition[column],
  );
  const resultsByColumn: Record<string, CalibrationSensitivityResultWithRows[]> = {};
  const variantsByColumn: Record<string, AnchorVariant[]> = {};

  columns.forEach((column) => {
    const variants = alternativeVariants(
      column,
      args.varMeta[column].type,
      args.calibSpecs[column],
      base,
      valuesByColumn[column],
    );
    if (!variants.length) return;
    variantsByColumn[column] = variants;
    const rawResults = runCalibrationSensitivity({
      caseLabels: caseIdentities.map((identity) => identity.engineLabel),
      valuesByColumn,
      calibrateColumns,
      base,
      variants,
      conditions: args.conditions,
      outcome: args.outcome,
      freqCut: args.freqCut,
      consCut: args.consCut,
    });
    resultsByColumn[column] = rawResults.map((result) => ({
      ...result,
      flips: result.flips.map(restoreCaseIdentity),
      truthTableRowChanges: result.truthTableRowChanges.map(restoreCaseIdentity),
      caseClassificationChanges: result.caseClassificationChanges.map(restoreCaseIdentity),
    }));
  });

  return { resultsByColumn, variantsByColumn };
}
