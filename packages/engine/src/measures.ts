/**
 * Set-theoretische Konsistenz- und Coverage-Maße (Ragin 2006, 2008).
 * X = Zugehörigkeit zur Bedingung (bzw. Konfiguration), Y = Zugehörigkeit zum Outcome.
 */

function requireSameLength(X: number[], Y: number[]): void {
  if (X.length !== Y.length) {
    throw new Error(`X und Y müssen gleich lang sein (${X.length} ≠ ${Y.length}).`);
  }
}

/** Konsistenz der Hinreichendheit: Σ min(X,Y) / Σ X. */
export function inclusionConsistency(X: number[], Y: number[]): number {
  requireSameLength(X, Y);
  let num = 0;
  let den = 0;
  for (let i = 0; i < X.length; i++) {
    num += Math.min(X[i], Y[i]);
    den += X[i];
  }
  return den === 0 ? NaN : num / den;
}

/** Coverage der Hinreichendheit: Σ min(X,Y) / Σ Y. */
export function rawCoverage(X: number[], Y: number[]): number {
  requireSameLength(X, Y);
  let num = 0;
  let den = 0;
  for (let i = 0; i < X.length; i++) {
    num += Math.min(X[i], Y[i]);
    den += Y[i];
  }
  return den === 0 ? NaN : num / den;
}

/**
 * PRI (Proportional Reduction in Inconsistency):
 * (Σ min(X,Y) − Σ min(X,Y,1−Y)) / (Σ X − Σ min(X,Y,1−Y)).
 */
export function priConsistency(X: number[], Y: number[]): number {
  requireSameLength(X, Y);
  let sumX = 0;
  let sumMinXY = 0;
  let sumMinXYnotY = 0;
  for (let i = 0; i < X.length; i++) {
    sumX += X[i];
    sumMinXY += Math.min(X[i], Y[i]);
    sumMinXYnotY += Math.min(X[i], Y[i], 1 - Y[i]);
  }
  const denom = sumX - sumMinXYnotY;
  return denom <= 0 ? NaN : (sumMinXY - sumMinXYnotY) / denom;
}

/** Konsistenz der Notwendigkeit: Σ min(X,Y) / Σ Y. (Deckungsgleich mit rawCoverage, hier benannt zur Klarheit.) */
export function necessityConsistency(X: number[], Y: number[]): number {
  return rawCoverage(X, Y);
}

/** Coverage der Notwendigkeit (Relevanz): Σ min(X,Y) / Σ X. */
export function necessityCoverage(X: number[], Y: number[]): number {
  return inclusionConsistency(X, Y);
}
