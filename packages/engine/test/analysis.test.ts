import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calibrateDirect,
  buildTruthTable,
  complexSolution,
  parsimoniousSolution,
  necessityAnalysis,
  type QcaCase,
} from "../src/index.ts";

const approx = (a: number, b: number, eps = 1e-3) =>
  assert.ok(Math.abs(a - b) < eps, `erwartet ~${b}, erhalten ${a}`);

// Synthetischer Demo-Datensatz (Zwischenkriegszeit), identisch zum Prototyp-Orakel.
const RAW: [string, number, number, number, number][] = [
  ["Belgien", 1098, 60, 94, 9], ["Niederlande", 1008, 57, 95, 10], ["Grossbritannien", 1038, 74, 99, 10],
  ["Frankreich", 983, 51, 96, 8], ["Schweden", 897, 34, 99, 9], ["Tschechoslowakei", 586, 42, 95, 7],
  ["Finnland", 590, 22, 99, 6], ["Irland", 662, 25, 95, 7], ["Deutschland", 795, 56, 98, 2],
  ["Oesterreich", 720, 33, 98, 2], ["Spanien", 367, 37, 50, 1], ["Italien", 517, 31, 72, 1],
  ["Polen", 350, 25, 77, 2], ["Ungarn", 424, 36, 91, 2], ["Portugal", 320, 15, 38, 1],
  ["Griechenland", 390, 31, 59, 1], ["Estland", 468, 28, 95, 3], ["Rumaenien", 331, 21, 62, 1],
];

// Stabilitäts-Rohwerte separat (vierte QCA-Bedingung), damit kein Fall auf exakt 0,5 fällt.
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

test("Truth Table: alle 18 Fälle werden zugeordnet (kein 0,5-Verlust)", () => {
  const tt = buildTruthTable({ cases: buildCases(), conditions: CONDS, outcome: OUTCOME, freqCut: 1, consCut: 0.8 });
  assert.equal(tt.totalCaseCount, 18);
  assert.equal(tt.assignedCaseCount, 18);
});

test("Truth Table: positive Konfigurationen sind konsistent (≥ 0,8)", () => {
  const tt = buildTruthTable({ cases: buildCases(), conditions: CONDS, outcome: OUTCOME, freqCut: 1, consCut: 0.8 });
  const positives = tt.rows.filter((r) => r.output === 1);
  assert.ok(positives.length >= 1, "mindestens eine positive Konfiguration erwartet");
  for (const row of positives) assert.ok(row.consistency >= 0.8);
});

test("Komplexe Lösung reproduziert das Prototyp-Orakel", () => {
  const cases = buildCases();
  const tt = buildTruthTable({ cases, conditions: CONDS, outcome: OUTCOME, freqCut: 1, consCut: 0.8 });
  const sol = complexSolution(tt, cases);
  assert.equal(sol.models.length, 1);
  const m = sol.models[0];
  assert.deepEqual(
    m.paths.map((p) => p.expression),
    ["fs_wohlstand*fs_bildung*fs_stabil"],
  );
  approx(m.solutionConsistency, 0.974, 0.005);
  // Coverage 0,860 für die fehlerfreien Anker [4; 6,5; 10] (alle 18 Fälle zugeordnet).
  approx(m.solutionCoverage, 0.86, 0.005);
});

test("Sparsame Lösung reduziert auf fs_stabil", () => {
  const cases = buildCases();
  const tt = buildTruthTable({ cases, conditions: CONDS, outcome: OUTCOME, freqCut: 1, consCut: 0.8 });
  const sol = parsimoniousSolution(tt, cases);
  assert.equal(sol.models.length, 1);
  assert.deepEqual(sol.models[0].paths.map((p) => p.expression), ["fs_stabil"]);
});

test("Notwendigkeit: fs_bildung ist Kandidat (Konsistenz ≥ 0,9)", () => {
  const cases = buildCases();
  const nec = necessityAnalysis(CONDS, OUTCOME, cases);
  const bildung = nec.find((n) => n.condition === "fs_bildung");
  assert.ok(bildung && bildung.isCandidate, "fs_bildung sollte Notwendigkeits-Kandidat sein");
});
