import { test } from "node:test";
import assert from "node:assert/strict";
import { calibrateDirect, consistencyThresholdSweep, type QcaCase } from "../src/index.ts";

const approx = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `erwartet ~${b}, erhalten ${a}`);

const RAW: [string, number, number, number, number][] = [
  ["Belgien", 1098, 60, 94, 9], ["Niederlande", 1008, 57, 95, 10], ["Grossbritannien", 1038, 74, 99, 10],
  ["Frankreich", 983, 51, 96, 8], ["Schweden", 897, 34, 99, 9], ["Tschechoslowakei", 586, 42, 95, 7],
  ["Finnland", 590, 22, 99, 6], ["Irland", 662, 25, 95, 7], ["Deutschland", 795, 56, 98, 2],
  ["Oesterreich", 720, 33, 98, 2], ["Spanien", 367, 37, 50, 1], ["Italien", 517, 31, 72, 1],
  ["Polen", 350, 25, 77, 2], ["Ungarn", 424, 36, 91, 2], ["Portugal", 320, 15, 38, 1],
  ["Griechenland", 390, 31, 59, 1], ["Estland", 468, 28, 95, 3], ["Rumaenien", 331, 21, 62, 1],
];
const STABIL: Record<string, number> = {
  Belgien: 10, Niederlande: 9, Grossbritannien: 10, Frankreich: 7, Schweden: 9, Tschechoslowakei: 8,
  Finnland: 7, Irland: 8, Deutschland: 4, Oesterreich: 3, Spanien: 4, Italien: 5, Polen: 3, Ungarn: 4,
  Portugal: 5, Griechenland: 4, Estland: 6, Rumaenien: 4,
};
const anchors = {
  wohlstand: [400, 550, 900] as const,
  bildung: [60, 85, 98] as const,
  stabil: [4, 6.5, 10] as const,
  demo: [2, 5, 9] as const,
};
function buildCases(): QcaCase[] {
  return RAW.map(([label, wohlstand, _urban, bildung, demo]) => ({
    label,
    values: {
      fs_wohlstand: +calibrateDirect(wohlstand, ...anchors.wohlstand).toFixed(4),
      fs_bildung: +calibrateDirect(bildung, ...anchors.bildung).toFixed(4),
      fs_stabil: +calibrateDirect(STABIL[label], ...anchors.stabil).toFixed(4),
      fs_demo_ueberleben: +calibrateDirect(demo, ...anchors.demo).toFixed(4),
    },
  }));
}
const CONDS = ["fs_wohlstand", "fs_bildung", "fs_stabil"];
const OUTCOME = "fs_demo_ueberleben";

test("Sweep: korrekte Cutoff-Reihe ohne Fließkomma-Drift", () => {
  const rows = consistencyThresholdSweep(buildCases(), CONDS, OUTCOME, {
    from: 0.7, to: 0.95, step: 0.05, freqCut: 1,
  });
  assert.deepEqual(rows.map((r) => r.cutoff), [0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
});

test("Sweep: stabile sparsame Lösung im Plateau 0,70–0,95 (fs_stabil, ein Pfad)", () => {
  const rows = consistencyThresholdSweep(buildCases(), CONDS, OUTCOME, {
    from: 0.7, to: 0.95, step: 0.05, freqCut: 1,
  });
  for (const r of rows) {
    assert.equal(r.pathCount, 1);
    assert.deepEqual(r.expressions, ["fs_stabil"]);
    approx(r.solutionConsistency, 0.9225910514116866);
    approx(r.solutionCoverage, 0.9103261959850747);
  }
});

test("Sweep: Robustheits-Klippe — bei Cutoff 0,99 verschwindet die Lösung", () => {
  const rows = consistencyThresholdSweep(buildCases(), CONDS, OUTCOME, {
    from: 0.9, to: 0.99, step: 0.03, freqCut: 1,
  });
  assert.deepEqual(rows.map((r) => r.cutoff), [0.9, 0.93, 0.96, 0.99]);
  // 0,90–0,96: einzige positive Ecke (Konsistenz ~0,972) bleibt bestehen
  for (const r of rows.slice(0, 3)) {
    assert.equal(r.pathCount, 1);
    assert.deepEqual(r.expressions, ["fs_stabil"]);
  }
  // 0,99: positive Ecke fällt unter den Cutoff ⇒ keine Lösung
  const last = rows[rows.length - 1];
  assert.equal(last.cutoff, 0.99);
  assert.equal(last.pathCount, 0);
  assert.deepEqual(last.expressions, []);
  assert.ok(Number.isNaN(last.solutionConsistency));
  assert.ok(Number.isNaN(last.solutionCoverage));
});

test("Sweep: einzelner Cutoff (from === to) liefert genau einen Eintrag", () => {
  const rows = consistencyThresholdSweep(buildCases(), CONDS, OUTCOME, {
    from: 0.8, to: 0.8, step: 0.05, freqCut: 1,
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].cutoff, 0.8);
});

test("Sweep: ungültige Optionen werfen (step ≤ 0, to < from)", () => {
  assert.throws(() => consistencyThresholdSweep(buildCases(), CONDS, OUTCOME, { from: 0.7, to: 0.9, step: 0, freqCut: 1 }));
  assert.throws(() => consistencyThresholdSweep(buildCases(), CONDS, OUTCOME, { from: 0.9, to: 0.7, step: 0.05, freqCut: 1 }));
});
