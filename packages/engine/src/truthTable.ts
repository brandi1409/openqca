/**
 * Truth Table: Zuordnung der Fälle zu den 2^k logisch möglichen Konfigurationen,
 * mit Konsistenz (Inclusion), PRI und Output-Entscheidung anhand der Cutoffs.
 */

export interface QcaCase {
  label: string;
  values: Record<string, number>;
}

export interface TruthTableRow {
  index: number;
  bits: string; // z. B. "1011" — 1 = Bedingung vorhanden, 0 = negiert
  n: number; // Anzahl Fälle mit Zugehörigkeit > 0,5 in dieser Konfiguration
  cases: string[];
  consistency: number; // Inclusion: Σ min(m,Y) / Σ m
  pri: number; // Proportional Reduction in Inconsistency
  output: 0 | 1 | "?"; // "?" = Remainder (unbeobachtet oder unter Frequenz-Cutoff)
  atCrossover: string[]; // Fälle mit exakt 0,5 in mind. einer Bedingung (0,5-Problem)
}

export interface TruthTableResult {
  conditions: string[];
  outcome: string;
  freqCut: number;
  consCut: number;
  rows: TruthTableRow[];
  assignedCaseCount: number; // Fälle, die einer beobachteten Konfiguration zugeordnet wurden
  totalCaseCount: number;
}

export function buildTruthTable(params: {
  cases: QcaCase[];
  conditions: string[];
  outcome: string;
  freqCut: number;
  consCut: number;
}): TruthTableResult {
  const { cases, conditions, outcome, freqCut, consCut } = params;
  if (conditions.length < 1 || conditions.length > 12) {
    throw new Error(`Anzahl Bedingungen muss zwischen 1 und 12 liegen (erhalten: ${conditions.length}).`);
  }
  const k = conditions.length;
  const rowCount = 1 << k;
  const Y = cases.map((c) => c.values[outcome]);
  const rows: TruthTableRow[] = [];
  const assigned = new Set<string>();

  for (let m = 0; m < rowCount; m++) {
    const bits = m.toString(2).padStart(k, "0");
    let sumM = 0;
    let sumMinMY = 0;
    let sumMinMYnY = 0;
    const members: string[] = [];
    const crossover: string[] = [];

    cases.forEach((c, i) => {
      let mem = 1;
      let corner = true;
      for (let j = 0; j < k; j++) {
        const x = c.values[conditions[j]];
        if (x === 0.5) crossover.push(c.label);
        const literal = bits[j] === "1" ? x : 1 - x;
        mem = Math.min(mem, literal);
        const inCorner = bits[j] === "1" ? x > 0.5 : x <= 0.5;
        if (!inCorner) corner = false;
      }
      sumM += mem;
      sumMinMY += Math.min(mem, Y[i]);
      sumMinMYnY += Math.min(mem, Y[i], 1 - Y[i]);
      if (corner && mem > 0.5) {
        members.push(c.label);
        assigned.add(c.label);
      }
    });

    const consistency = sumM > 0 ? sumMinMY / sumM : NaN;
    const priDen = sumM - sumMinMYnY;
    const pri = priDen > 0 ? (sumMinMY - sumMinMYnY) / priDen : NaN;
    const n = members.length;
    const output: 0 | 1 | "?" = n >= freqCut ? (consistency >= consCut ? 1 : 0) : "?";

    rows.push({
      index: m,
      bits,
      n,
      cases: members,
      consistency,
      pri,
      output,
      atCrossover: [...new Set(crossover)],
    });
  }

  return {
    conditions,
    outcome,
    freqCut,
    consCut,
    rows,
    assignedCaseCount: assigned.size,
    totalCaseCount: cases.length,
  };
}
