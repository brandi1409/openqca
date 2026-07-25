/**
 * Notwendigkeitsanalyse jenseits der Einzelbedingung.
 *
 * Publizierte QCA-Studien prüfen nicht nur, ob eine einzelne Bedingung notwendig
 * ist, sondern auch **Disjunktionen** (X + Z). Ist die Disjunktion notwendig,
 * ohne dass ein einzelner Disjunkt es ist, spricht man von **SUIN**-Bedingungen
 * (*Sufficient but Unnecessary part of a factor that is Insufficient but
 * Necessary*, Mahoney/Kimball/Koivu 2009; Schneider & Wagemann 2012, Kap. 3).
 * Symmetrisch dazu verkleinern **Konjunktionen** notwendiger Bedingungen die
 * Obermenge des Outcomes und sind damit informativer als jede einzelne.
 *
 * Referenz für Semantik und Ausgabe ist `superSubset(..., relation="necessity")`
 * aus dem R-Paket `QCA` (Dușa). Dessen Verhalten wurde empirisch nachgebildet
 * (siehe `scripts/r-oracle/oracle.R`, Szenarien `nec_*`):
 *
 *  - Geprüft werden alle Ausdrücke aus höchstens `depth` Bedingungen, je Bedingung
 *    höchstens ein Literal (X oder ~X) — sowohl als Konjunktion (Minimum) als auch
 *    als Disjunktion (Maximum).
 *  - Zulassungskriterium ist `inclN ≥ inclCut` **und** `covN ≥ covCut`
 *    (anschließend `RoN ≥ ronCut`).
 *  - **Konjunktionen** werden vollständig ausgewiesen: Jede zulässige Konjunktion
 *    ist eine kleinere Obermenge des Outcomes und damit ein eigener Befund.
 *  - **Disjunktionen** werden nur ausgewiesen, wenn sie *minimal* sind: Sobald eine
 *    echte Teil-Disjunktion (bis hin zum einzelnen Literal) bereits zulässig ist,
 *    entfällt die größere. Einzelne Literale erscheinen ausschließlich in der
 *    Konjunktionsliste — genau wie in R.
 *
 * Alle drei Kennzahlen folgen Schneider & Wagemann (2012, Kap. 5 und S. 236):
 *   inclN = Σ min(X,Y) / Σ Y
 *   covN  = Σ min(X,Y) / Σ X
 *   RoN   = Σ (1−X)   / Σ (1−min(X,Y))
 */

import type { QcaCase } from "./truthTable.ts";

/** Toleranz, mit der R die Cutoffs aufweicht (`.Machine$double.eps^0.5`). */
const CUT_EPS = Math.sqrt(Number.EPSILON);

export type NecessityExpressionKind = "conjunction" | "disjunction";

export interface NecessityExpressionEntry {
  kind: NecessityExpressionKind;
  /** Literale in Bedingungsreihenfolge, Abwesenheit mit vorangestelltem `~`. */
  literals: string[];
  /** Lesbare Form: `A*B` (Konjunktion) bzw. `A + B` (Disjunktion). */
  expression: string;
  /** inclN — Konsistenz der Notwendigkeit: Σ min(X,Y) / Σ Y. */
  consistency: number;
  /** covN — Coverage/Relevanz der Notwendigkeit: Σ min(X,Y) / Σ X. */
  coverage: number;
  /** RoN — Relevance of Necessity: Σ (1−X) / Σ (1−min(X,Y)). */
  relevance: number;
}

export interface NecessarySupersetOptions {
  /** Mindest-Konsistenz (R: `incl.cut`). Standard 0,9. */
  inclCut?: number;
  /** Mindest-Coverage (R: `cov.cut`). Standard 0. */
  covCut?: number;
  /** Mindest-RoN (R: `ron.cut`). Standard 0. */
  ronCut?: number;
  /**
   * Maximale Zahl beteiligter Bedingungen (R: `depth`). Standard: `min(k, 3)` —
   * R nimmt hier `k`, was bei vielen Bedingungen kombinatorisch teuer wird und
   * fast nur noch schwer interpretierbare Ausdrücke liefert. Der Standard ist
   * bewusst konservativ; für die Kreuzvalidierung wird `depth` explizit gesetzt.
   */
  depth?: number;
}

/** RoN (Relevance of Necessity, Schneider & Wagemann 2012): Σ (1−X) / Σ (1−min(X,Y)). */
export function relevanceOfNecessity(X: number[], Y: number[]): number {
  if (X.length !== Y.length) {
    throw new Error(`X und Y müssen gleich lang sein (${X.length} ≠ ${Y.length}).`);
  }
  let num = 0;
  let den = 0;
  for (let i = 0; i < X.length; i++) {
    num += 1 - X[i];
    den += 1 - Math.min(X[i], Y[i]);
  }
  return den === 0 ? NaN : num / den;
}

interface Scored {
  consistency: number;
  coverage: number;
  relevance: number;
}

function score(X: number[], Y: number[], sumY: number): Scored {
  let sumX = 0;
  let sumMin = 0;
  let ronNum = 0;
  let ronDen = 0;
  for (let i = 0; i < X.length; i++) {
    const m = Math.min(X[i], Y[i]);
    sumX += X[i];
    sumMin += m;
    ronNum += 1 - X[i];
    ronDen += 1 - m;
  }
  return {
    consistency: sumY === 0 ? NaN : sumMin / sumY,
    coverage: sumX === 0 ? NaN : sumMin / sumX,
    relevance: ronDen === 0 ? NaN : ronNum / ronDen,
  };
}

/**
 * Sucht notwendige Obermengen des Outcomes: Konjunktionen und (SUIN-)Disjunktionen
 * bis zur Ordnung `depth`. Gegenstück zu `superSubset(relation = "necessity")`.
 */
export function necessarySupersets(
  conditions: string[],
  outcome: string,
  cases: QcaCase[],
  options: NecessarySupersetOptions = {},
): NecessityExpressionEntry[] {
  if (!conditions.length) return [];
  if (conditions.includes(outcome)) {
    throw new Error(`Das Outcome "${outcome}" darf keine Bedingung sein.`);
  }
  const k = conditions.length;
  const depth = Math.max(1, Math.min(options.depth ?? Math.min(k, 3), k));
  const inclCut = (options.inclCut ?? 0.9) - CUT_EPS;
  const rawCovCut = options.covCut ?? 0;
  const covCut = rawCovCut > 0 ? rawCovCut - CUT_EPS : rawCovCut;
  const ronCut = options.ronCut ?? 0;

  const Y = cases.map((c) => c.values[outcome]);
  const sumY = Y.reduce((a, b) => a + b, 0);
  const n = cases.length;

  // Literal-Vektoren: je Bedingung Anwesenheit und Abwesenheit.
  const literals = conditions.flatMap((condition, index) => [
    {
      index,
      name: condition,
      values: cases.map((c) => c.values[condition]),
    },
    {
      index,
      name: `~${condition}`,
      values: cases.map((c) => 1 - c.values[condition]),
    },
  ]);

  const conjunctions: NecessityExpressionEntry[] = [];
  /** Alle zulässigen Literalmengen (auch einzelne) — Grundlage der Minimalitätsregel. */
  const admissibleSets: Array<{ key: Set<string>; size: number }> = [];
  const disjunctionCandidates: Array<{
    literals: string[];
    keySet: Set<string>;
    scored: Scored;
  }> = [];

  const picked: Array<(typeof literals)[number]> = [];
  const conjBuf: number[][] = [];
  const disjBuf: number[][] = [];

  const walk = (start: number): void => {
    for (let li = start; li < literals.length; li++) {
      const lit = literals[li];
      // Je Bedingung höchstens ein Literal (kein `A + ~A`, kein `A*~A`).
      if (picked.some((p) => p.index === lit.index)) continue;

      const level = picked.length;
      const conjPrev = level ? conjBuf[level - 1] : null;
      const disjPrev = level ? disjBuf[level - 1] : null;
      const conj = new Array<number>(n);
      const disj = new Array<number>(n);
      for (let i = 0; i < n; i++) {
        const v = lit.values[i];
        conj[i] = conjPrev ? Math.min(conjPrev[i], v) : v;
        disj[i] = disjPrev ? Math.max(disjPrev[i], v) : v;
      }
      conjBuf[level] = conj;
      disjBuf[level] = disj;
      picked.push(lit);

      const names = picked.map((p) => p.name);
      const conjScore = score(conj, Y, sumY);
      if (conjScore.consistency >= inclCut && conjScore.coverage >= covCut) {
        conjunctions.push({
          kind: "conjunction",
          literals: [...names],
          expression: names.join("*"),
          ...conjScore,
        });
      }
      // Für Ordnung 1 sind Konjunktion und Disjunktion identisch; R weist solche
      // Ausdrücke ausschließlich in der Konjunktionsliste aus, nutzt sie aber als
      // Sperre für größere Disjunktionen.
      const disjScore = picked.length === 1 ? conjScore : score(disj, Y, sumY);
      if (disjScore.consistency >= inclCut && disjScore.coverage >= covCut) {
        const keySet = new Set(names);
        admissibleSets.push({ key: keySet, size: keySet.size });
        if (picked.length > 1) {
          disjunctionCandidates.push({ literals: [...names], keySet, scored: disjScore });
        }
      }

      if (picked.length < depth) walk(li + 1);
      picked.pop();
    }
  };
  walk(0);

  // Minimalität: eine Disjunktion entfällt, sobald eine echte Teil-Disjunktion
  // (weniger Disjunkte) bereits zulässig ist.
  const disjunctions = disjunctionCandidates
    .filter((candidate) =>
      !admissibleSets.some(
        (other) =>
          other.size < candidate.keySet.size &&
          [...other.key].every((name) => candidate.keySet.has(name)),
      ),
    )
    .map<NecessityExpressionEntry>((candidate) => ({
      kind: "disjunction",
      literals: candidate.literals,
      expression: candidate.literals.join(" + "),
      ...candidate.scored,
    }));

  return [...conjunctions, ...disjunctions].filter(
    (entry) => !(entry.relevance < ronCut),
  );
}
