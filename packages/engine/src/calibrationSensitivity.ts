/**
 * Calibration-anchor sensitivity: re-calibrate with alternative thresholds and
 * report membership flips, truth-table corner changes, and parsimonious solution
 * changes. Complements consistencyThresholdSweep (cutoff robustness).
 */

import {
  calibrateValue,
  type CalibrationMethod,
} from "./calibrate.ts";
import { buildTruthTable, type QcaCase, type TruthTableResult } from "./truthTable.ts";
import { parsimoniousSolution } from "./solutions.ts";

export interface AnchorVariant {
  id: string;
  label: string;
  rationale?: string;
  isDiagnostic?: boolean;
  /** per-column thresholds in the same shape as base */
  thresholdsByCondition: Record<string, number[]>;
  methodsByCondition: Record<string, CalibrationMethod>;
  highIsMembershipByCondition?: Record<string, boolean>;
  /** Keep inverted crisp membership inclusive at the raw threshold. */
  crispInclusiveByCondition?: Record<string, boolean>;
  missingByCondition?: Record<string, "NaN" | 0 | 1>;
}

export interface MembershipFlip {
  caseLabel: string;
  condition: string;
  baseMembership: number;
  variantMembership: number;
  crossedHalf: boolean;
}

export interface CalibrationSensitivityResult {
  variantId: string;
  label: string;
  flips: MembershipFlip[];
  truthTableRowChanges: { caseLabel: string; baseBits: string; variantBits: string }[];
  variantThresholdsByCondition: Record<string, number[]>;
  caseClassificationChanges: {
    caseLabel: string;
    base: {
      conditionBits: string;
      outcomeSide: "in" | "out" | "half";
      rowOutput: 0 | 1 | "?" | null;
    };
    variant: {
      conditionBits: string;
      outcomeSide: "in" | "out" | "half";
      rowOutput: 0 | 1 | "?" | null;
    };
  }[];
  baseSolutionExpression: string;
  variantSolutionExpression: string;
  baseFit: { consistency: number; coverage: number };
  variantFit: { consistency: number; coverage: number };
  solutionChanged: boolean;
}

export interface CalibrationSensitivityArgs {
  caseLabels: string[];
  /** Raw or already-membership values, aligned with caseLabels */
  valuesByColumn: Record<string, number[]>;
  /** Columns that must be calibrated (others passed through as memberships) */
  calibrateColumns: string[];
  base: AnchorVariant;
  variants: AnchorVariant[];
  conditions: string[];
  outcome: string;
  freqCut: number;
  consCut: number;
}

function canonTerm(term: string): string {
  return term
    .split("*")
    .map((l) => l.trim())
    .filter(Boolean)
    .sort()
    .join("*");
}

/** Sort literals within terms and terms within a model expression. */
export function canonicalExpression(expression: string): string {
  if (!expression.trim()) return "";
  return expression
    .split("+")
    .map((t) => canonTerm(t.trim()))
    .filter(Boolean)
    .sort()
    .join(" + ");
}

function sideOfHalf(m: number): "in" | "out" | "half" {
  if (Math.abs(m - 0.5) < 1e-12) return "half";
  return m > 0.5 ? "in" : "out";
}

function crossedHalf(a: number, b: number): boolean {
  return sideOfHalf(a) !== sideOfHalf(b);
}

/** Truth-table corner bitstring: 1 iff membership > 0.5 (matches truthTable.ts). */
export function cornerBits(values: Record<string, number>, conditions: string[]): string {
  return conditions.map((c) => (values[c] > 0.5 ? "1" : "0")).join("");
}

function buildCasesFromVariant(
  args: CalibrationSensitivityArgs,
  variant: AnchorVariant,
): QcaCase[] {
  const { caseLabels, valuesByColumn, calibrateColumns } = args;
  const columns = new Set([
    ...args.conditions,
    args.outcome,
    ...calibrateColumns,
    ...Object.keys(valuesByColumn),
  ]);
  const cases: QcaCase[] = [];

  for (let i = 0; i < caseLabels.length; i++) {
    const values: Record<string, number> = {};
    let missing = false;

    for (const col of columns) {
      const series = valuesByColumn[col];
      if (!series) continue;
      const raw = series[i];
      if (calibrateColumns.includes(col)) {
        const method = variant.methodsByCondition[col];
        const thresholds = variant.thresholdsByCondition[col];
        if (!method || !thresholds) {
          throw new Error(`Variante ${variant.id}: fehlende Methode/Schwellen für ${col}`);
        }
        const high = variant.highIsMembershipByCondition?.[col] ?? true;
        const m = calibrateValue(raw, {
          method,
          thresholds,
          highIsMembership: high,
          crispInclusive: variant.crispInclusiveByCondition?.[col],
          onMissing: variant.missingByCondition?.[col] ?? "NaN",
        });
        if (!Number.isFinite(m)) {
          missing = true;
          break;
        }
        values[col] = +m.toFixed(4);
      } else {
        const onMissing = variant.missingByCondition?.[col] ?? "NaN";
        const observed = Number.isFinite(raw);
        const value = observed ? raw : onMissing === "NaN" ? NaN : onMissing;
        if (!Number.isFinite(value)) {
          missing = true;
          break;
        }
        const high = variant.highIsMembershipByCondition?.[col] ?? true;
        values[col] = observed && high === false ? 1 - value : value;
      }
    }
    if (missing) continue;
    if (
      args.conditions.some((c) => values[c] === undefined) ||
      values[args.outcome] === undefined
    ) {
      continue;
    }
    cases.push({ label: caseLabels[i], values });
  }
  return cases;
}

function solutionSummary(
  cases: QcaCase[],
  conditions: string[],
  outcome: string,
  freqCut: number,
  consCut: number,
  existingTruthTable?: TruthTableResult | null,
) {
  if (cases.length === 0 || conditions.length < 1) {
    return {
      expression: "",
      fit: { consistency: NaN, coverage: NaN },
    };
  }
  const tt =
    existingTruthTable ??
    buildTruthTable({ cases, conditions, outcome, freqCut, consCut });
  const sol = parsimoniousSolution(tt, cases);
  const model = sol.models[0];
  if (!model) {
    return { expression: "", fit: { consistency: NaN, coverage: NaN } };
  }
  const expression = canonicalExpression(model.paths.map((p) => p.expression).join(" + "));
  return {
    expression,
    fit: {
      consistency: model.solutionConsistency,
      coverage: model.solutionCoverage,
    },
  };
}

/**
 * Compare base calibration against each alternative variant.
 * Empty `variants` returns [].
 */
export function runCalibrationSensitivity(
  args: CalibrationSensitivityArgs,
): CalibrationSensitivityResult[] {
  if (!args.variants.length) return [];

  const baseCases = buildCasesFromVariant(args, args.base);
  const baseTruthTable =
    baseCases.length && args.conditions.length
      ? buildTruthTable({
          cases: baseCases,
          conditions: args.conditions,
          outcome: args.outcome,
          freqCut: args.freqCut,
          consCut: args.consCut,
        })
      : null;
  const baseSol = solutionSummary(
    baseCases,
    args.conditions,
    args.outcome,
    args.freqCut,
    args.consCut,
    baseTruthTable,
  );
  const baseByLabel = new Map(baseCases.map((c) => [c.label, c]));
  const compareCols = [...args.conditions, args.outcome];
  const outputAt = (
    table: TruthTableResult | null,
    bits: string,
  ): 0 | 1 | "?" | null => table?.rows.find((row) => row.bits === bits)?.output ?? null;

  return args.variants.map((variant) => {
    const variantCases = buildCasesFromVariant(args, variant);
    const variantTruthTable =
      variantCases.length && args.conditions.length
        ? buildTruthTable({
            cases: variantCases,
            conditions: args.conditions,
            outcome: args.outcome,
            freqCut: args.freqCut,
            consCut: args.consCut,
          })
        : null;
    const variantByLabel = new Map(variantCases.map((c) => [c.label, c]));
    const labels = [...baseByLabel.keys()].filter((label) => variantByLabel.has(label));
    const flips: MembershipFlip[] = [];
    const truthTableRowChanges: CalibrationSensitivityResult["truthTableRowChanges"] = [];
    const caseClassificationChanges: CalibrationSensitivityResult["caseClassificationChanges"] = [];

    for (const label of labels) {
      const baseCase = baseByLabel.get(label)!;
      const variantCase = variantByLabel.get(label)!;
      for (const col of compareCols) {
        const baseMembership = baseCase.values[col];
        const variantMembership = variantCase.values[col];
        if (baseMembership === undefined || variantMembership === undefined) continue;
        if (Math.abs(baseMembership - variantMembership) > 1e-9) {
          flips.push({
            caseLabel: label,
            condition: col,
            baseMembership,
            variantMembership,
            crossedHalf: crossedHalf(baseMembership, variantMembership),
          });
        }
      }

      const baseBits = cornerBits(baseCase.values, args.conditions);
      const variantBits = cornerBits(variantCase.values, args.conditions);
      if (baseBits !== variantBits) {
        truthTableRowChanges.push({ caseLabel: label, baseBits, variantBits });
      }

      const baseOutcomeSide = sideOfHalf(baseCase.values[args.outcome]);
      const variantOutcomeSide = sideOfHalf(variantCase.values[args.outcome]);
      const baseOutput = outputAt(baseTruthTable, baseBits);
      const variantOutput = outputAt(variantTruthTable, variantBits);
      if (
        baseBits !== variantBits ||
        baseOutcomeSide !== variantOutcomeSide ||
        baseOutput !== variantOutput
      ) {
        caseClassificationChanges.push({
          caseLabel: label,
          base: {
            conditionBits: baseBits,
            outcomeSide: baseOutcomeSide,
            rowOutput: baseOutput,
          },
          variant: {
            conditionBits: variantBits,
            outcomeSide: variantOutcomeSide,
            rowOutput: variantOutput,
          },
        });
      }
    }

    const variantSol = solutionSummary(
      variantCases,
      args.conditions,
      args.outcome,
      args.freqCut,
      args.consCut,
      variantTruthTable,
    );

    return {
      variantId: variant.id,
      label: variant.label,
      flips,
      truthTableRowChanges,
      variantThresholdsByCondition: Object.fromEntries(
        Object.entries(variant.thresholdsByCondition).map(([column, thresholds]) => [
          column,
          [...thresholds],
        ]),
      ),
      caseClassificationChanges,
      baseSolutionExpression: baseSol.expression,
      variantSolutionExpression: variantSol.expression,
      baseFit: baseSol.fit,
      variantFit: variantSol.fit,
      solutionChanged: baseSol.expression !== variantSol.expression,
    };
  });
}
