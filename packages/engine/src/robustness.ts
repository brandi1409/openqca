/**
 * Robustheitsanalyse: wie stabil ist die (sparsame) Lösung gegenüber der Wahl
 * des Konsistenz-Cutoffs? Ein Sweep berechnet für eine Reihe von Cutoffs jeweils
 * die sparsame Lösung und gibt Kennzahlen (Pfadanzahl, Konsistenz, Coverage,
 * Ausdrücke) zurück. Das erlaubt es, „springende" Ergebnisse zu erkennen, bei
 * denen kleine Änderungen des Cutoffs die Lösung stark verändern.
 */

import { buildTruthTable, type QcaCase } from "./truthTable.ts";
import {
  complexSolution,
  intermediateSolution,
  parsimoniousSolution,
  type Expectation,
  type Solution,
} from "./solutions.ts";

export interface ConsistencySweepEntry {
  cutoff: number;
  pathCount: number;
  solutionConsistency: number;
  solutionCoverage: number;
  expressions: string[];
}

export interface ConsistencySweepOptions {
  from: number;
  to: number;
  step: number;
  freqCut: number;
}

/** Rundet auf eine feste Präzision, um Fließkomma-Drift bei der Cutoff-Reihe zu vermeiden. */
function roundTo(value: number, decimals = 6): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * Konsistenz-Cutoff-Sweep: baut für jeden Cutoff in [from, to] (Schrittweite
 * step, jeweils einschließlich to bis auf Rundungstoleranz) die Truth Table und
 * die sparsame Lösung. Bei mehreren gleichwertigen Modellen wird das erste
 * gemeldet; ohne positive Konfiguration ergeben sich 0 Pfade, leere Ausdrücke
 * und NaN-Kennzahlen.
 */
export function consistencyThresholdSweep(
  cases: QcaCase[],
  conditions: string[],
  outcome: string,
  opts: ConsistencySweepOptions,
): ConsistencySweepEntry[] {
  const { from, to, step, freqCut } = opts;
  if (step <= 0) throw new Error(`step muss > 0 sein (erhalten: ${step}).`);
  if (to < from) throw new Error(`to (${to}) muss ≥ from (${from}) sein.`);

  const entries: ConsistencySweepEntry[] = [];
  const stepCount = Math.floor(roundTo((to - from) / step) + 1e-9);

  for (let i = 0; i <= stepCount; i++) {
    const cutoff = roundTo(from + i * step);
    if (cutoff > to + 1e-9) break;
    const tt = buildTruthTable({ cases, conditions, outcome, freqCut, consCut: cutoff });
    const sol = parsimoniousSolution(tt, cases);
    const model = sol.models[0];
    entries.push({
      cutoff,
      pathCount: model ? model.paths.length : 0,
      solutionConsistency: model ? model.solutionConsistency : NaN,
      solutionCoverage: model ? model.solutionCoverage : NaN,
      expressions: model ? model.paths.map((p) => p.expression) : [],
    });
  }

  return entries;
}

export type RobustnessSolutionType = "complex" | "intermediate" | "parsimonious";

export interface RobustnessScenario {
  id: string;
  label: string;
  /** Calibrated cases for one substantive calibration/anchor scenario. */
  cases: QcaCase[];
}

export interface RobustnessSolutionSummary {
  type: RobustnessSolutionType;
  expression: string;
  expressions: string[];
  pathCount: number;
  consistency: number;
  coverage: number;
}

export interface RobustnessCaseClassification {
  caseLabel: string;
  conditionBits: string;
  outcomeSide: "in" | "out" | "half";
  rowOutput: 0 | 1 | "?" | null;
}

export interface RobustnessCaseClassificationChange {
  caseLabel: string;
  base: RobustnessCaseClassification;
  variant: RobustnessCaseClassification;
}

export interface CombinedRobustnessCell {
  scenarioId: string;
  scenarioLabel: string;
  freqCut: number;
  consCut: number;
  priCut: number | null;
  positiveRows: number;
  assignedCaseCount: number;
  totalCaseCount: number;
  solutions: Record<RobustnessSolutionType, RobustnessSolutionSummary>;
  caseClassifications: RobustnessCaseClassification[];
  caseClassificationChanges: RobustnessCaseClassificationChange[];
}

export interface RobustnessExpressionStability {
  type: RobustnessSolutionType;
  expression: string;
  cells: number;
  share: number;
  status: "stable" | "variable";
}

export interface RobustnessCaseStability {
  caseLabel: string;
  observedCells: number;
  changedCells: number;
  changeShare: number;
  status: "stable" | "possible-change" | "unstable";
}

export interface CombinedRobustnessResult {
  totalCells: number;
  baseline: {
    scenarioId: string;
    freqCut: number;
    consCut: number;
    priCut: number | null;
  };
  cells: CombinedRobustnessCell[];
  solutionStability: RobustnessExpressionStability[];
  caseStability: RobustnessCaseStability[];
}

export interface RobustnessBaseline {
  scenarioId: string;
  freqCut: number;
  consCut: number;
  priCut: number | null;
}


export interface CombinedRobustnessOptions {
  scenarios: RobustnessScenario[];
  conditions: string[];
  outcome: string;
  freqCuts: number[];
  consCuts: number[];
  priCuts?: Array<number | null>;
  expectations?: Record<string, Expectation>;
  maxCells?: number;
  /** Optional cell used as the comparison baseline; defaults to the first cell. */
  baseline?: RobustnessBaseline;
}

const ROBUSTNESS_SOLUTION_TYPES: RobustnessSolutionType[] = [
  "complex",
  "intermediate",
  "parsimonious",
];

function finiteCutoffs(
  values: number[],
  label: string,
  bounds?: { min: number; max: number },
): number[] {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${label} muss mindestens einen endlichen Wert enthalten.`);
  }
  const normalized = values.map((value) => roundTo(value));
  if (
    bounds &&
    normalized.some((value) => value < bounds.min - 1e-9 || value > bounds.max + 1e-9)
  ) {
    throw new Error(`${label} muss zwischen ${bounds.min} und ${bounds.max} liegen.`);
  }
  return [...new Set(normalized)].sort((a, b) => a - b);
}

function conditionBits(
  values: Record<string, number>,
  conditions: string[],
): string {
  return conditions.map((condition) => (values[condition] > 0.5 ? "1" : "0")).join("");
}

function outcomeSide(value: number): "in" | "out" | "half" {
  if (Math.abs(value - 0.5) < 1e-12) return "half";
  return value > 0.5 ? "in" : "out";
}

function classifyCases(
  cases: QcaCase[],
  conditions: string[],
  outcome: string,
  tt: ReturnType<typeof buildTruthTable>,
): RobustnessCaseClassification[] {
  return cases.map((item) => {
    const bits = conditionBits(item.values, conditions);
    return {
      caseLabel: item.label,
      conditionBits: bits,
      outcomeSide: outcomeSide(item.values[outcome]),
      rowOutput: tt.rows.find((row) => row.bits === bits)?.output ?? null,
    };
  });
}

function summarizeSolution(solution: Solution): RobustnessSolutionSummary {
  const model = solution.models[0];
  const expressions = model?.paths.map((path) => path.expression) ?? [];
  return {
    type: solution.type,
    expression: expressions.join(" + "),
    expressions,
    pathCount: model?.paths.length ?? 0,
    consistency: model?.solutionConsistency ?? NaN,
    coverage: model?.solutionCoverage ?? NaN,
  };
}

function sameClassification(
  left: RobustnessCaseClassification,
  right: RobustnessCaseClassification,
): boolean {
  return (
    left.conditionBits === right.conditionBits &&
    left.outcomeSide === right.outcomeSide &&
    left.rowOutput === right.rowOutput
  );
}

function expressionStability(
  cells: CombinedRobustnessCell[],
): RobustnessExpressionStability[] {
  const total = cells.length;
  return ROBUSTNESS_SOLUTION_TYPES.flatMap((type) => {
    const counts = new Map<string, number>();
    cells.forEach((cell) => {
      const expression = cell.solutions[type].expression;
      counts.set(expression, (counts.get(expression) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([expression, count]) => ({
        type,
        expression,
        cells: count,
        share: total ? count / total : 0,
        status: count === total ? ("stable" as const) : ("variable" as const),
      }));
  });
}

function caseStability(
  cells: CombinedRobustnessCell[],
  baseline: RobustnessCaseClassification[],
): RobustnessCaseStability[] {
  const labels = [...new Set(baseline.map((item) => item.caseLabel))];
  return labels.map<RobustnessCaseStability>((caseLabel) => {
    const base = baseline.find((item) => item.caseLabel === caseLabel)!;
    let observedCells = 0;
    let changedCells = 0;
    cells.forEach((cell) => {
      const current = cell.caseClassifications.find((item) => item.caseLabel === caseLabel);
      if (!current) return;
      observedCells++;
      if (!sameClassification(base, current)) changedCells++;
    });
    const changeShare = observedCells ? changedCells / observedCells : 0;
    return {
      caseLabel,
      observedCells,
      changedCells,
      changeShare,
      status:
        changedCells === 0
          ? "stable"
          : observedCells > 0 && changedCells === observedCells
            ? "unstable"
            : "possible-change",
    };
  }).sort((a, b) => b.changeShare - a.changeShare || a.caseLabel.localeCompare(b.caseLabel));
}

/**
 * Run a bounded cross-product of calibration scenarios and analytical cutoffs.
 *
 * The underlying truth-table and minimization formulas remain unchanged. This
 * orchestration layer makes the research choices explicit and reports both
 * solution-term and case-oriented stability relative to the selected baseline
 * cell (or the first cell when no baseline is supplied).
 */
export function runCombinedRobustnessGrid(
  options: CombinedRobustnessOptions,
): CombinedRobustnessResult {
  if (!options.scenarios.length) {
    throw new Error("Mindestens ein Robustheits-Szenario ist erforderlich.");
  }
  if (!options.conditions.length || options.conditions.length > 12) {
    throw new Error("Die Robustheitsanalyse benötigt 1 bis 12 Bedingungen.");
  }
  if (new Set(options.scenarios.map((scenario) => scenario.id)).size !== options.scenarios.length) {
    throw new Error("Robustheits-Szenarien benötigen eindeutige IDs.");
  }

  const freqCuts = finiteCutoffs(options.freqCuts, "Frequency-Cutoff", { min: 1, max: Infinity });
  const consCuts = finiteCutoffs(options.consCuts, "Consistency-Cutoff", { min: 0, max: 1 });
  const rawPriCuts = options.priCuts?.length ? options.priCuts : [null];
  const numericPriCuts = rawPriCuts.filter((cut): cut is number => cut !== null);
  const priCuts: Array<number | null> = [
    ...(rawPriCuts.includes(null) ? [null] : []),
    ...(numericPriCuts.length
      ? finiteCutoffs(numericPriCuts, "PRI-Cutoff", { min: 0, max: 1 })
      : []),
  ];
  const maxCells = options.maxCells ?? 5000;
  const cellCount = options.scenarios.length * freqCuts.length * consCuts.length * priCuts.length;
  if (cellCount > maxCells) {
    throw new Error(`Robustheitsraster überschreitet das Zelllimit von ${maxCells}.`);
  }

  const cells: CombinedRobustnessCell[] = [];
  for (const scenario of options.scenarios) {
    for (const freqCut of freqCuts) {
      for (const consCut of consCuts) {
        for (const priCut of priCuts) {
          const tt = buildTruthTable({
            cases: scenario.cases,
            conditions: options.conditions,
            outcome: options.outcome,
            freqCut,
            consCut,
            priCut: priCut ?? undefined,
          });
          const solutions = {
            complex: summarizeSolution(complexSolution(tt, scenario.cases)),
            intermediate: summarizeSolution(
              intermediateSolution(tt, scenario.cases, options.expectations ?? {}),
            ),
            parsimonious: summarizeSolution(parsimoniousSolution(tt, scenario.cases)),
          };
          cells.push({
            scenarioId: scenario.id,
            scenarioLabel: scenario.label,
            freqCut,
            consCut,
            priCut,
            positiveRows: tt.rows.filter((row) => row.output === 1).length,
            assignedCaseCount: tt.assignedCaseCount,
            totalCaseCount: tt.totalCaseCount,
            solutions,
            caseClassifications: classifyCases(
              scenario.cases,
              options.conditions,
              options.outcome,
              tt,
            ),
            caseClassificationChanges: [],
          });
        }
      }
    }
  }

  const baselineCell = options.baseline
    ? cells.find(
        (cell) =>
          cell.scenarioId === options.baseline!.scenarioId &&
          cell.freqCut === roundTo(options.baseline!.freqCut) &&
          cell.consCut === roundTo(options.baseline!.consCut) &&
          cell.priCut === options.baseline!.priCut,
      )
    : cells[0];
  if (!baselineCell) {
    throw new Error("Die angegebene Robustheits-Basiszelle ist nicht im Raster enthalten.");
  }
  const baselineByCase = new Map(
    baselineCell.caseClassifications.map((classification) => [
      classification.caseLabel,
      classification,
    ]),
  );
  cells.forEach((cell) => {
    cell.caseClassificationChanges = cell.caseClassifications.flatMap((variant) => {
      const base = baselineByCase.get(variant.caseLabel);
      return base && !sameClassification(base, variant)
        ? [{ caseLabel: variant.caseLabel, base, variant }]
        : [];
    });
  });

  return {
    totalCells: cells.length,
    baseline: {
      scenarioId: baselineCell.scenarioId,
      freqCut: baselineCell.freqCut,
      consCut: baselineCell.consCut,
      priCut: baselineCell.priCut,
    },
    cells,
    solutionStability: expressionStability(cells),
    caseStability: caseStability(cells, baselineCell.caseClassifications),
  };
}
