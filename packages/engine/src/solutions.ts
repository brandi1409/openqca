/**
 * Standard Analysis: leitet aus der Truth Table die komplexe und die sparsame
 * Lösung ab und berechnet Lösungs-/Pfadparameter sowie notwendige Bedingungen.
 */

import { termCovers, primeImplicants, minimalCovers, termToExpression } from "./minimize.ts";
import type { QcaCase, TruthTableResult } from "./truthTable.ts";

export interface PathParams {
  term: string;
  expression: string;
  rawCoverage: number;
  uniqueCoverage: number;
  consistency: number;
}

export interface Solution {
  type: "complex" | "parsimonious" | "intermediate";
  models: SolutionModel[];
}

/** Richtungserwartung je Bedingung für die intermediäre Lösung. */
export type Expectation = "present" | "absent" | "either";

export interface SolutionModel {
  terms: string[];
  paths: PathParams[];
  solutionConsistency: number;
  solutionCoverage: number;
}

export interface NecessityEntry {
  condition: string;
  consistency: number; // Notwendigkeits-Konsistenz: Σ min(X,Y) / Σ Y
  coverage: number; // Relevanz: Σ min(X,Y) / Σ X
  isCandidate: boolean; // Konsistenz ≥ 0,9
}

/** Zugehörigkeit eines Falls zu einem Term (Minimum über die literalen Bedingungen). */
function termMembership(term: string, conditions: string[], values: Record<string, number>): number {
  let mem = 1;
  [...term].forEach((ch, i) => {
    if (ch === "1") mem = Math.min(mem, values[conditions[i]]);
    else if (ch === "0") mem = Math.min(mem, 1 - values[conditions[i]]);
  });
  return mem;
}

function computeModel(
  cover: string[],
  conditions: string[],
  outcome: string,
  cases: QcaCase[],
): SolutionModel {
  const Y = cases.map((c) => c.values[outcome]);
  const sumY = Y.reduce((a, b) => a + b, 0);

  const membershipOf = (terms: string[]) =>
    cases.map((c) => (terms.length ? Math.max(...terms.map((t) => termMembership(t, conditions, c.values))) : 0));

  const solMem = membershipOf(cover);
  const sumSol = solMem.reduce((a, b) => a + b, 0);
  const sumMinSolY = solMem.reduce((a, s, i) => a + Math.min(s, Y[i]), 0);

  const paths: PathParams[] = cover.map((term) => {
    const tm = cases.map((c) => termMembership(term, conditions, c.values));
    const sumT = tm.reduce((a, b) => a + b, 0);
    const sumMinTY = tm.reduce((a, v, i) => a + Math.min(v, Y[i]), 0);
    const others = cover.filter((o) => o !== term);
    const otherMem = membershipOf(others);
    const sumMinOtherY = otherMem.reduce((a, v, i) => a + Math.min(v, Y[i]), 0);
    return {
      term,
      expression: termToExpression(term, conditions),
      rawCoverage: sumY ? sumMinTY / sumY : NaN,
      uniqueCoverage: sumY ? (sumMinSolY - sumMinOtherY) / sumY : NaN,
      consistency: sumT ? sumMinTY / sumT : NaN,
    };
  });

  return {
    terms: cover,
    paths,
    solutionConsistency: sumSol ? sumMinSolY / sumSol : NaN,
    solutionCoverage: sumY ? sumMinSolY / sumY : NaN,
  };
}

/** Positive Minterme (output === 1) der Truth Table. */
function positiveMinterms(tt: TruthTableResult): string[] {
  return tt.rows.filter((r) => r.output === 1).map((r) => r.bits);
}

/** Remainder (output === "?") der Truth Table. */
function remainderMinterms(tt: TruthTableResult): string[] {
  return tt.rows.filter((r) => r.output === "?").map((r) => r.bits);
}

/**
 * Gemeinsame Minimierungspipeline: aus positiven Mintermen und einer Menge
 * zugelassener Remainder (Don't-Cares) werden Primimplikanten, minimale
 * Überdeckungen und daraus die Lösungsmodelle berechnet.
 */
function buildSolution(
  type: Solution["type"],
  tt: TruthTableResult,
  cases: QcaCase[],
  positives: string[],
  allowedRemainders: string[],
): Solution {
  const covers = positives.length
    ? minimalCovers(primeImplicants(positives, allowedRemainders), positives)
    : [];
  return {
    type,
    models: covers.map((c) => computeModel(c, tt.conditions, tt.outcome, cases)),
  };
}

/** Komplexe (konservative) Lösung — nur beobachtete positive Konfigurationen. */
export function complexSolution(tt: TruthTableResult, cases: QcaCase[]): Solution {
  return buildSolution("complex", tt, cases, positiveMinterms(tt), []);
}

/** Sparsame (parsimonious) Lösung — alle Remainder als Vereinfachungsannahmen zugelassen. */
export function parsimoniousSolution(tt: TruthTableResult, cases: QcaCase[]): Solution {
  return buildSolution("parsimonious", tt, cases, positiveMinterms(tt), remainderMinterms(tt));
}

/**
 * Ermittelt die als „einfache" Counterfactuals zugelassenen Remainder.
 *
 * Ein Remainder ist zugelassen, wenn er sich von mindestens einem positiven
 * Minterm ausschließlich in Positionen unterscheidet, in denen die Bit-Änderung
 * der Richtungserwartung folgt:
 *   - Erwartung "present" → an einer abweichenden Position ist Bit 1 erwartet,
 *   - Erwartung "absent"  → an einer abweichenden Position ist Bit 0 erwartet,
 *   - Erwartung "either"  → keine Einschränkung in dieser Position.
 * Fehlt für eine Bedingung eine Erwartung, gilt "either" (keine Einschränkung).
 */
export function allowedRemainders(
  positives: string[],
  remainders: string[],
  conditions: string[],
  expectations: Record<string, Expectation>,
): string[] {
  const followsExpectation = (bit: string, cond: string): boolean => {
    const e = expectations[cond] ?? "either";
    if (e === "either") return true;
    if (e === "present") return bit === "1";
    return bit === "0"; // "absent"
  };
  return remainders.filter((r) =>
    positives.some((p) => {
      for (let i = 0; i < r.length; i++) {
        if (r[i] === p[i]) continue; // keine Änderung an dieser Position
        if (!followsExpectation(r[i], conditions[i])) return false;
      }
      return true;
    }),
  );
}

/**
 * Intermediäre Lösung (Enhanced Standard Analysis, Ragin & Sonnett 2005):
 * zwischen komplexer und sparsamer Lösung. Es werden nur „einfache"
 * Counterfactuals als Vereinfachungsannahmen zugelassen — Remainder, die mit
 * den Richtungserwartungen konsistent sind (siehe {@link allowedRemainders}).
 * Auf den positiven Mintermen plus diesen zugelassenen Remaindern läuft dieselbe
 * Minimierungspipeline wie bei komplexer/sparsamer Lösung.
 */
export function intermediateSolution(
  tt: TruthTableResult,
  cases: QcaCase[],
  expectations: Record<string, Expectation>,
): Solution {
  const positives = positiveMinterms(tt);
  const allowed = allowedRemainders(positives, remainderMinterms(tt), tt.conditions, expectations);
  return buildSolution("intermediate", tt, cases, positives, allowed);
}

/** Analyse notwendiger Bedingungen (jede Bedingung und ihre Negation). */
export function necessityAnalysis(
  conditions: string[],
  outcome: string,
  cases: QcaCase[],
): NecessityEntry[] {
  const Y = cases.map((c) => c.values[outcome]);
  const sumY = Y.reduce((a, b) => a + b, 0);
  const entries: NecessityEntry[] = [];

  for (const cond of conditions) {
    for (const [label, get] of [
      [cond, (v: Record<string, number>) => v[cond]] as const,
      ["~" + cond, (v: Record<string, number>) => 1 - v[cond]] as const,
    ]) {
      const X = cases.map((c) => get(c.values));
      const sumX = X.reduce((a, b) => a + b, 0);
      const sumMin = X.reduce((a, x, i) => a + Math.min(x, Y[i]), 0);
      const consistency = sumY ? sumMin / sumY : NaN;
      entries.push({
        condition: label,
        consistency,
        coverage: sumX ? sumMin / sumX : NaN,
        isCandidate: consistency >= 0.9,
      });
    }
  }
  return entries;
}
