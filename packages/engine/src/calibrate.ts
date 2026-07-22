/**
 * Kalibrierung: Übersetzung von Rohwerten in Fuzzy-Set-Zugehörigkeit [0, 1].
 *
 * Die Verfahren folgen Ragin (2008), "Redesigning Social Inquiry". Die direkte
 * Methode ist analytisch definiert — der Kreuzungspunkt bildet exakt auf 0,5 ab,
 * der Voll-drinnen-Anker auf 1/(1+e^-3) ≈ 0,9526, der Voll-draußen-Anker auf
 * 1/(1+e^3) ≈ 0,0474. Diese Fixpunkte sind unsere ersten Validierungsanker.
 */

export type CalibrationMethod = "direct" | "linear" | "crisp" | "fourValue";

/** Direkte Methode (logistisch, Ragin 2008). Anker: voll draußen < Kreuzung < voll drinnen. */
export function calibrateDirect(
  x: number,
  fullOut: number,
  crossover: number,
  fullIn: number,
): number {
  assertAscending(fullOut, crossover, fullIn);
  const d = x - crossover;
  const logOdds =
    d >= 0 ? d * (3 / (fullIn - crossover)) : d * (3 / (crossover - fullOut));
  return 1 / (1 + Math.exp(-logOdds));
}

/** Direkte Methode mit linearer (statt logistischer) Zugehörigkeitsfunktion; Kreuzung bleibt 0,5. */
export function calibrateLinear(
  x: number,
  fullOut: number,
  crossover: number,
  fullIn: number,
): number {
  assertAscending(fullOut, crossover, fullIn);
  if (x <= fullOut) return 0;
  if (x >= fullIn) return 1;
  return x < crossover
    ? 0.5 * ((x - fullOut) / (crossover - fullOut))
    : 0.5 + 0.5 * ((x - crossover) / (fullIn - crossover));
}

/** Crisp-Set: eine Schwelle, Ergebnis 0 oder 1. */
export function calibrateCrisp(x: number, threshold: number): number {
  return x >= threshold ? 1 : 0;
}

/** Vier-Werte-Fuzzy: drei aufsteigende Schwellen ergeben 0 / 0,33 / 0,67 / 1. */
export function calibrateFourValue(
  x: number,
  t1: number,
  t2: number,
  t3: number,
): number {
  assertAscending(t1, t2, t3);
  if (x <= t1) return 0;
  if (x < t2) return 0.33;
  if (x < t3) return 0.67;
  return 1;
}

/** Einheitlicher Dispatch über alle Methoden. */
export function calibrate(
  x: number,
  method: CalibrationMethod,
  thresholds: number[],
): number {
  switch (method) {
    case "direct":
      return calibrateDirect(x, thresholds[0], thresholds[1], thresholds[2]);
    case "linear":
      return calibrateLinear(x, thresholds[0], thresholds[1], thresholds[2]);
    case "crisp":
      return calibrateCrisp(x, thresholds[0]);
    case "fourValue":
      return calibrateFourValue(x, thresholds[0], thresholds[1], thresholds[2]);
    default:
      throw new Error(`Unbekannte Kalibrierungsmethode: ${method}`);
  }
}

export type CalibrateSeriesOptions = {
  method: CalibrationMethod;
  thresholds: number[];
  /** default true; if false, return 1 - m after successful calibration */
  highIsMembership?: boolean;
  /** For inverted crisp sets, preserve the inclusive raw ≤ threshold rule. */
  crispInclusive?: boolean;
  /** value considered missing; default: !Number.isFinite(x) */
  isMissing?: (value: number) => boolean;
  onMissing?: "NaN" | 0 | 1;
};

export function calibrateValue(x: number, opts: CalibrateSeriesOptions): number {
  const isMissing = opts.isMissing ?? ((value: number) => !Number.isFinite(value));
  if (isMissing(x)) {
    const m = opts.onMissing ?? "NaN";
    return m === "NaN" ? NaN : m;
  }
  if (
    opts.method === "crisp" &&
    opts.crispInclusive === true &&
    opts.highIsMembership === false
  ) {
    return x <= opts.thresholds[0] ? 1 : 0;
  }
  const membership = calibrate(x, opts.method, opts.thresholds);
  return opts.highIsMembership === false ? 1 - membership : membership;
}

/** Vectorized {@link calibrateValue}. */
export function calibrateSeries(xs: number[], opts: CalibrateSeriesOptions): number[] {
  return xs.map((x) => calibrateValue(x, opts));
}

function assertAscending(a: number, b: number, c: number): void {
  if (!(a < b && b < c)) {
    throw new Error(
      `Anker müssen aufsteigend sein (voll draußen < Kreuzung < voll drinnen), erhalten: ${a}, ${b}, ${c}`,
    );
  }
}
