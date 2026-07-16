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
 * Subsumtion auf Zeilenmengen: Deckt der allgemeinere Term `general` jede Zeile
 * ab, die `specific` abdeckt? Für Term-Strings über {"0","1","-"} gilt das genau
 * dann, wenn an jeder Position `general` entweder "-" ist oder mit `specific`
 * übereinstimmt — d. h. die Literale von `general` sind eine Teilmenge der
 * Literale von `specific` (`general` ist gleich oder allgemeiner).
 */
function subsumes(general: string, specific: string): boolean {
  for (let i = 0; i < general.length; i++) {
    if (general[i] !== "-" && general[i] !== specific[i]) return false;
  }
  return true;
}

/**
 * Bildet den intermediären Term aus einem konservativen Primimplikanten `c` und
 * einem ihn subsumierenden sparsamen PI `p` (Literale von `p` ⊆ Literale von `c`).
 *
 * Ausgangspunkt ist `p`. Für jedes Literal (X=v), das in `c`, aber nicht in `p`
 * enthalten ist (Position, an der `c` fixiert und `p` "-" ist), wird entschieden,
 * ob es wieder aufgenommen wird. Das Entfernen eines solchen Literals entspricht
 * einer Vereinfachungsannahme (Counterfactual über einen Remainder):
 *   - Literal v="1" entfernen ⇒ Annahme „Outcome trotz Abwesenheit von X" —
 *     ein EINFACHES Counterfactual nur bei Erwartung „absent".
 *   - Literal v="0" entfernen ⇒ Annahme „Outcome trotz Anwesenheit von X" —
 *     ein EINFACHES Counterfactual nur bei Erwartung „present".
 * Ein Literal wird also GENAU DANN entfernt (easy), wenn die Richtungserwartung
 * die STRIKTE Gegenpolarität hat; andernfalls (passende Polarität, „either" oder
 * fehlende Erwartung) bleibt es erhalten, weil sein Wegfall ein „difficult
 * counterfactual" wäre.
 *
 * Hinweis zur Semantik von „either"/fehlend: Die Kreuzvalidierung gegen das
 * R-Paket QCA (scripts/r-oracle) belegt, dass eine fehlende bzw. „either"-
 * Erwartung ("-" in `dir.exp`) das Literal ERHÄLT (kein einfaches Counterfactual)
 * — nicht entfernt. Das ist die kanonische Enhanced-Standard-Analysis-Regel
 * (Ragin & Sonnett 2005; Schneider & Wagemann 2012, Kap. 8; Dușa 2019).
 */
function buildIntermediateTerm(
  c: string,
  p: string,
  conditions: string[],
  expectations: Record<string, Expectation>,
): string {
  const out = [...p];
  for (let i = 0; i < c.length; i++) {
    if (p[i] !== "-" || c[i] === "-") continue; // nur Literale aus c∖p
    const v = c[i]; // "0" oder "1"
    const e = expectations[conditions[i]] ?? "either";
    const oppositeExpectation = v === "1" ? "absent" : "present";
    // Entfernen (easy) nur bei strikter Gegenpolarität; sonst Literal behalten.
    if (e !== oppositeExpectation) out[i] = v;
  }
  return out.join("");
}

/** Kanonischer Schlüssel eines Modells (sortierte Terme) zum Deduplizieren. */
function modelKey(terms: string[]): string {
  return [...terms].sort().join(",");
}

/**
 * Intermediäre Lösung — kanonische Enhanced Standard Analysis (ESA).
 *
 * Quellen der Konstruktion:
 *   - Ragin, C. C. & Sonnett, J. (2005): Between Complexity and Parsimony.
 *   - Schneider, C. Q. & Wagemann, C. (2012): Set-Theoretic Methods, Kap. 8.
 *   - Dușa, A. (2019): QCA with R. A Comprehensive Resource.
 *
 * Konstruktion (konservative × sparsame Modelle):
 *   1. Berechne die konservativen (komplexen) Überdeckungen `C` (Primimplikanten
 *      nur der positiven Minterme) und die sparsamen Überdeckungen `P`
 *      (Primimplikanten der positiven Minterme + aller Remainder).
 *   2. Für jedes Modellpaar (C, P) und jeden konservativen PI `c ∈ C`:
 *      wähle jeden sparsamen PI `p ∈ P`, der `c` subsumiert (Literale von `p` ⊆
 *      Literale von `c`, als Zeilenmengen `c ⊆ p`). Jeder solche `p` liefert
 *      einen intermediären Term (siehe {@link buildIntermediateTerm}); mehrere
 *      subsumierende `p` erzeugen alle Varianten (Modell-Ambiguität).
 *   3. Sammle die intermediären Terme je Modellkombination, entferne Duplikate
 *      und Terme, die von einem anderen intermediären Term desselben Modells
 *      subsumiert werden. Dedupliziere identische Modelle über alle Kombinationen.
 *
 * Invariante: Jeder intermediäre Term liegt (als Literalmenge) zwischen einem
 * sparsamen `p` (⊆) und dem konservativen `c` (⊇). Damit deckt jedes Modell alle
 * positiven Minterme ab (jeder `c` wird von seinem intermediären Term abgedeckt),
 * und die intermediäre Lösung liegt zwischen komplexer und sparsamer Lösung.
 *
 * Signatur und Rückgabetyp sind bewusst unverändert; die Kennzahlen werden mit
 * derselben computeModel-Pipeline wie bei komplexer/sparsamer Lösung berechnet.
 */
export function intermediateSolution(
  tt: TruthTableResult,
  cases: QcaCase[],
  expectations: Record<string, Expectation>,
): Solution {
  const positives = positiveMinterms(tt);
  if (!positives.length) return { type: "intermediate", models: [] };

  const conservativeCovers = minimalCovers(primeImplicants(positives, []), positives);
  const parsimoniousCovers = minimalCovers(
    primeImplicants(positives, remainderMinterms(tt)),
    positives,
  );

  const dedupedModels = new Map<string, string[]>();

  for (const C of conservativeCovers) {
    for (const P of parsimoniousCovers) {
      const iTerms: string[] = [];
      for (const c of C) {
        // Alle sparsamen PIs, die c subsumieren (garantiert nicht leer, da jeder
        // konservative Implikant Implikant der positiven+Remainder-Funktion ist).
        const subsumers = P.filter((p) => subsumes(p, c));
        const fallback = subsumers.length ? subsumers : [c];
        for (const p of fallback) {
          iTerms.push(buildIntermediateTerm(c, p, tt.conditions, expectations));
        }
      }
      // Duplikate entfernen.
      const unique = [...new Set(iTerms)];
      // Terme entfernen, die von einem anderen (allgemeineren) iTerm subsumiert werden.
      const minimal = unique.filter(
        (a) => !unique.some((b) => b !== a && subsumes(b, a)),
      );
      const key = modelKey(minimal);
      if (!dedupedModels.has(key)) dedupedModels.set(key, minimal);
    }
  }

  return {
    type: "intermediate",
    models: [...dedupedModels.values()].map((cover) =>
      computeModel(cover, tt.conditions, tt.outcome, cases),
    ),
  };
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
