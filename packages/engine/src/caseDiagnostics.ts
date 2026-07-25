/**
 * Fall-Diagnostik nach der Lösung (Schneider & Rohlfing 2013, 2016).
 *
 * Eine Lösungsformel ist erst dann interpretierbar, wenn klar ist, **welche
 * Fälle** hinter jedem Pfad stehen und welche der Formel widersprechen. Die
 * Typologie ergibt sich aus der Lage eines Falls im XY-Plot des jeweiligen
 * Pfads (x = Zugehörigkeit zum Lösungsterm, y = Zugehörigkeit zum Outcome):
 *
 * | Lage                                   | Typ                            | Wozu |
 * |----------------------------------------|--------------------------------|------|
 * | x > 0,5, y > 0,5, x ≤ y                | **typisch**                    | Prozessanalyse: Mechanismus zeigen |
 * | x > 0,5, y > 0,5, x > y                | **deviant consistency in degree** | konsistent der Art nach, nicht dem Grad nach |
 * | x > 0,5, y ≤ 0,5                       | **deviant consistency in kind**   | echter Widerspruch zur Hinreichendheit |
 * | x ≤ 0,5                                | **individually irrelevant (IIR)** | der Pfad sagt über den Fall nichts aus |
 *
 * Auf **Lösungsebene** kommt hinzu:
 *
 * - **deviant coverage**: y > 0,5, aber von **keinem** Pfad gedeckt (Zugehörigkeit
 *   zur Gesamtlösung ≤ 0,5). Diese Fälle zeigen, wo die Lösung unvollständig ist.
 *
 * Quellen:
 *   - Schneider, C. Q. & Rohlfing, I. (2013): Combining QCA and Process Tracing
 *     in Set-Theoretic Multi-Method Research. *Sociological Methods & Research*
 *     42(4), 559–597.
 *   - Schneider, C. Q. & Rohlfing, I. (2016): Case Studies Nested in Fuzzy-Set
 *     QCA on Sufficiency. *Sociological Methods & Research* 45(3), 526–568.
 *
 * Die 0,5-Grenze wird streng gelesen: „Mitglied" heißt > 0,5. Fälle mit exakt
 * 0,5 gelten als Nicht-Mitglied und werden zusätzlich in `atCrossover`
 * ausgewiesen, weil sie methodisch strittig sind (Ragin 2008, Kap. 5).
 */

import { termMembership, type SolutionModel } from "./solutions.ts";
import type { QcaCase } from "./truthTable.ts";

export type CaseDiagnosticType =
  | "typical"
  | "deviantConsistencyKind"
  | "deviantConsistencyDegree"
  | "irrelevant";

export interface DiagnosedCase {
  label: string;
  /** Zugehörigkeit zum Lösungsterm (x). */
  termMembership: number;
  /** Zugehörigkeit zum Outcome (y). */
  outcomeMembership: number;
  type: CaseDiagnosticType;
}

export interface PathCaseDiagnostics {
  term: string;
  expression: string;
  typical: DiagnosedCase[];
  deviantConsistencyKind: DiagnosedCase[];
  deviantConsistencyDegree: DiagnosedCase[];
  irrelevant: DiagnosedCase[];
}

export interface DeviantCoverageCase {
  label: string;
  /** Zugehörigkeit zur Gesamtlösung (Maximum über alle Pfade). */
  solutionMembership: number;
  outcomeMembership: number;
}

export interface SolutionCaseDiagnostics {
  paths: PathCaseDiagnostics[];
  /** y > 0,5, aber von keinem Pfad gedeckt. */
  deviantCoverage: DeviantCoverageCase[];
  /** Fälle mit Zugehörigkeit exakt 0,5 in Outcome oder Lösung — methodisch strittig. */
  atCrossover: string[];
}

const IN = (value: number): boolean => value > 0.5;

function classify(x: number, y: number): CaseDiagnosticType {
  if (!IN(x)) return "irrelevant";
  if (!IN(y)) return "deviantConsistencyKind";
  return x > y ? "deviantConsistencyDegree" : "typical";
}

/**
 * Klassifiziert alle Fälle je Pfad eines Lösungsmodells und ermittelt die
 * ungedeckten Outcome-Fälle (deviant coverage).
 */
export function caseDiagnostics(
  model: SolutionModel,
  conditions: string[],
  outcome: string,
  cases: QcaCase[],
): SolutionCaseDiagnostics {
  const atCrossover: string[] = [];
  const paths: PathCaseDiagnostics[] = model.paths.map((path) => ({
    term: path.term,
    expression: path.expression,
    typical: [],
    deviantConsistencyKind: [],
    deviantConsistencyDegree: [],
    irrelevant: [],
  }));
  const deviantCoverage: DeviantCoverageCase[] = [];

  for (const item of cases) {
    const y = item.values[outcome];
    let solutionMembership = 0;

    model.paths.forEach((path, index) => {
      const x = termMembership(path.term, conditions, item.values);
      if (x > solutionMembership) solutionMembership = x;
      const type = classify(x, y);
      paths[index][type].push({
        label: item.label,
        termMembership: x,
        outcomeMembership: y,
        type,
      });
    });

    if (IN(y) && !IN(solutionMembership)) {
      deviantCoverage.push({
        label: item.label,
        solutionMembership,
        outcomeMembership: y,
      });
    }
    if (y === 0.5 || solutionMembership === 0.5) atCrossover.push(item.label);
  }

  return { paths, deviantCoverage, atCrossover };
}
