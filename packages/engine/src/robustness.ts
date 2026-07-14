/**
 * Robustheitsanalyse: wie stabil ist die (sparsame) Lösung gegenüber der Wahl
 * des Konsistenz-Cutoffs? Ein Sweep berechnet für eine Reihe von Cutoffs jeweils
 * die sparsame Lösung und gibt Kennzahlen (Pfadanzahl, Konsistenz, Coverage,
 * Ausdrücke) zurück. Das erlaubt es, „springende" Ergebnisse zu erkennen, bei
 * denen kleine Änderungen des Cutoffs die Lösung stark verändern.
 */

import { buildTruthTable, type QcaCase } from "./truthTable.ts";
import { parsimoniousSolution } from "./solutions.ts";

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
