import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calibrateDirect,
  calibrateCrisp,
  calibrateFourValue,
  calibrate,
  calibrateValue,
  calibrateSeries,
  inclusionConsistency,
  rawCoverage,
  priConsistency,
} from "../src/index.ts";

const approx = (a: number, b: number, eps = 1e-4) =>
  assert.ok(Math.abs(a - b) < eps, `erwartet ~${b}, erhalten ${a}`);

test("direkte Methode: Kreuzungspunkt bildet exakt auf 0,5 ab", () => {
  assert.equal(calibrateDirect(85, 60, 85, 98), 0.5);
});

test("direkte Methode: Ragins Fixpunkte an den Ankern (0,9526 / 0,0474)", () => {
  // Voll-drinnen-Anker → 1/(1+e^-3); Voll-draußen-Anker → 1/(1+e^3)
  approx(calibrateDirect(98, 60, 85, 98), 1 / (1 + Math.exp(-3)));
  approx(calibrateDirect(60, 60, 85, 98), 1 / (1 + Math.exp(3)));
});

test("direkte Methode: streng monoton steigend", () => {
  let prev = -1;
  for (let x = 30; x <= 100; x += 2) {
    const m = calibrateDirect(x, 60, 85, 98);
    assert.ok(m > prev, `nicht monoton bei x=${x}`);
    prev = m;
  }
});

test("direkte Methode: Anker müssen aufsteigend sein", () => {
  assert.throws(() => calibrateDirect(50, 85, 60, 98));
});

test("crisp: Schwelle trennt 0/1", () => {
  assert.equal(calibrateCrisp(85, 85), 1);
  assert.equal(calibrateCrisp(84.9, 85), 0);
});
test("calibrateValue: invertiertes Crisp bleibt an der Schwelle inklusiv", () => {
  assert.equal(
    calibrateValue(40, {
      method: "crisp",
      thresholds: [40],
      highIsMembership: false,
      crispInclusive: true,
    }),
    1,
  );
  assert.equal(
    calibrateValue(40.0001, {
      method: "crisp",
      thresholds: [40],
      highIsMembership: false,
      crispInclusive: true,
    }),
    0,
  );
});

test("Vier-Werte-Fuzzy: vier Stufen", () => {
  assert.equal(calibrateFourValue(10, 20, 50, 80), 0);
  assert.equal(calibrateFourValue(30, 20, 50, 80), 0.33);
  assert.equal(calibrateFourValue(60, 20, 50, 80), 0.67);
  assert.equal(calibrateFourValue(90, 20, 50, 80), 1);
});

test("Dispatch calibrate() deckt sich mit den Einzelfunktionen", () => {
  assert.equal(
    calibrate(85, "direct", [60, 85, 98]),
    calibrateDirect(85, 60, 85, 98),
  );
});

test("calibrateValue: Inversion liefert 1 − direct", () => {
  const base = calibrateDirect(900, 300, 600, 1000);
  const inv = calibrateValue(900, {
    method: "direct",
    thresholds: [300, 600, 1000],
    highIsMembership: false,
  });
  approx(inv, 1 - base);
});

test("calibrateValue: fehlende Werte → NaN oder zugewiesen", () => {
  assert.ok(
    Number.isNaN(
      calibrateValue(Number.NaN, { method: "crisp", thresholds: [40], onMissing: "NaN" }),
    ),
  );
  assert.equal(
    calibrateValue(Number.NaN, { method: "crisp", thresholds: [40], onMissing: 0 }),
    0,
  );
});

test("calibrateSeries: wendet calibrateValue elementweise an", () => {
  const out = calibrateSeries([30, 50, 90], {
    method: "crisp",
    thresholds: [50],
  });
  assert.deepEqual(out, [0, 1, 1]);
});

test("Konsistenz & Coverage: deterministisches Kleinbeispiel", () => {
  const X = [1, 1, 0, 0];
  const Y = [1, 0, 1, 0];
  // Σ min(X,Y) = 1; Σ X = 2; Σ Y = 2
  approx(inclusionConsistency(X, Y), 0.5);
  approx(rawCoverage(X, Y), 0.5);
});

test("PRI: perfekt konsistenter Fall ergibt 1", () => {
  const X = [0.2, 0.4, 0.6, 0.8];
  const Y = [0.2, 0.4, 0.6, 0.8];
  approx(priConsistency(X, Y), 1);
});
