import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildTruthTable,
  caseDiagnostics,
  complexSolution,
  type QcaCase,
  type SolutionModel,
} from "../src/index.ts";

/**
 * Konstruierter Datensatz mit je einem Fall pro Diagnose-Typ:
 *   typisch                     — x > 0,5, y > 0,5, x ≤ y
 *   deviant consistency in degree — x > 0,5, y > 0,5, x > y
 *   deviant consistency in kind   — x > 0,5, y ≤ 0,5
 *   individually irrelevant       — x ≤ 0,5
 *   deviant coverage              — y > 0,5, von keinem Pfad gedeckt
 */
const CASES: QcaCase[] = [
  { label: "typisch", values: { A: 0.9, B: 0.8, Y: 0.95 } },
  { label: "degree", values: { A: 0.9, B: 0.9, Y: 0.7 } },
  { label: "kind", values: { A: 0.8, B: 0.7, Y: 0.3 } },
  { label: "irrelevant", values: { A: 0.2, B: 0.1, Y: 0.1 } },
  { label: "ungedeckt", values: { A: 0.1, B: 0.2, Y: 0.9 } },
];

/** Ein-Pfad-Modell A*B, ohne den Minimierungsweg zu bemühen. */
const model = {
  terms: ["11"],
  paths: [{ term: "11", expression: "A*B", rawCoverage: NaN, uniqueCoverage: NaN, consistency: NaN }],
  solutionConsistency: NaN,
  solutionCoverage: NaN,
} satisfies SolutionModel;

const labels = (entries: { label: string }[]) => entries.map((e) => e.label).sort();

test("caseDiagnostics klassifiziert jeden Fall genau einmal je Pfad", () => {
  const diag = caseDiagnostics(model, ["A", "B"], "Y", CASES);
  assert.equal(diag.paths.length, 1);
  const p = diag.paths[0];
  assert.deepEqual(labels(p.typical), ["typisch"]);
  assert.deepEqual(labels(p.deviantConsistencyDegree), ["degree"]);
  assert.deepEqual(labels(p.deviantConsistencyKind), ["kind"]);
  assert.deepEqual(labels(p.irrelevant), ["irrelevant", "ungedeckt"]);
  const total =
    p.typical.length +
    p.deviantConsistencyDegree.length +
    p.deviantConsistencyKind.length +
    p.irrelevant.length;
  assert.equal(total, CASES.length, "Typologie ist erschöpfend und disjunkt");
});

test("caseDiagnostics: deviant coverage nur für ungedeckte Outcome-Fälle", () => {
  const diag = caseDiagnostics(model, ["A", "B"], "Y", CASES);
  assert.deepEqual(labels(diag.deviantCoverage), ["ungedeckt"]);
  assert.equal(diag.deviantCoverage[0].outcomeMembership, 0.9);
  assert.equal(diag.deviantCoverage[0].solutionMembership, 0.1);
});

test("caseDiagnostics: Termzugehörigkeit ist das Minimum über die Literale", () => {
  const diag = caseDiagnostics(model, ["A", "B"], "Y", CASES);
  const typical = diag.paths[0].typical[0];
  assert.equal(typical.termMembership, 0.8); // min(0,9; 0,8)
  assert.equal(typical.outcomeMembership, 0.95);
});

test("caseDiagnostics: ein von einem zweiten Pfad gedeckter Fall ist keine deviant coverage", () => {
  const twoPaths = {
    terms: ["11", "00"],
    paths: [
      { term: "11", expression: "A*B", rawCoverage: NaN, uniqueCoverage: NaN, consistency: NaN },
      { term: "00", expression: "~A*~B", rawCoverage: NaN, uniqueCoverage: NaN, consistency: NaN },
    ],
    solutionConsistency: NaN,
    solutionCoverage: NaN,
  } satisfies SolutionModel;
  const diag = caseDiagnostics(twoPaths, ["A", "B"], "Y", CASES);
  // "ungedeckt" (A=0,1 B=0,2) ist Mitglied von ~A*~B (0,8) -> nicht mehr ungedeckt.
  assert.deepEqual(labels(diag.deviantCoverage), []);
  assert.deepEqual(labels(diag.paths[1].typical), ["ungedeckt"]);
});

test("caseDiagnostics: 0,5 gilt als Nicht-Mitglied und wird als Grenzfall gemeldet", () => {
  const borderline: QcaCase[] = [
    { label: "grenze", values: { A: 0.5, B: 0.9, Y: 0.5 } },
  ];
  const diag = caseDiagnostics(model, ["A", "B"], "Y", borderline);
  assert.deepEqual(labels(diag.paths[0].irrelevant), ["grenze"]);
  assert.deepEqual(diag.deviantCoverage, []);
  assert.deepEqual(diag.atCrossover, ["grenze"]);
});

test("caseDiagnostics arbeitet auf einer echten Lösung", () => {
  const tt = buildTruthTable({
    cases: CASES,
    conditions: ["A", "B"],
    outcome: "Y",
    freqCut: 1,
    consCut: 0.7,
  });
  const solution = complexSolution(tt, CASES);
  assert.ok(solution.models.length > 0);
  const diag = caseDiagnostics(solution.models[0], tt.conditions, tt.outcome, CASES);
  assert.equal(diag.paths.length, solution.models[0].paths.length);
  for (const path of diag.paths) {
    const counted =
      path.typical.length +
      path.deviantConsistencyDegree.length +
      path.deviantConsistencyKind.length +
      path.irrelevant.length;
    assert.equal(counted, CASES.length);
  }
});
