import { test } from "node:test";
import assert from "node:assert/strict";
import {
  necessarySupersets,
  necessityAnalysis,
  relevanceOfNecessity,
  type QcaCase,
} from "../src/index.ts";

const approx = (a: number, b: number, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `erwartet ~${b}, erhalten ${a}`);

/**
 * SUIN-Konstruktion: Weder A noch B ist einzeln notwendig, die Disjunktion
 * A + B aber schon. Genau der Fall, den die frühere Einzelbedingungs-Prüfung
 * nicht sehen konnte.
 */
const SUIN: QcaCase[] = [
  { label: "f1", values: { A: 0.9, B: 0.1, C: 0.2, Y: 0.8 } },
  { label: "f2", values: { A: 0.8, B: 0.2, C: 0.3, Y: 0.7 } },
  { label: "f3", values: { A: 0.1, B: 0.9, C: 0.2, Y: 0.8 } },
  { label: "f4", values: { A: 0.2, B: 0.8, C: 0.1, Y: 0.7 } },
  { label: "f5", values: { A: 0.1, B: 0.1, C: 0.9, Y: 0.1 } },
  { label: "f6", values: { A: 0.2, B: 0.2, C: 0.8, Y: 0.2 } },
];

const find = (
  entries: ReturnType<typeof necessarySupersets>,
  expression: string,
) => entries.find((e) => e.expression === expression);

test("necessarySupersets findet die SUIN-Disjunktion, nicht die Einzelbedingungen", () => {
  const entries = necessarySupersets(["A", "B", "C"], "Y", SUIN, {
    inclCut: 0.9,
    covCut: 0.5,
    depth: 2,
  });
  const disjunction = find(entries, "A + B");
  assert.ok(disjunction, "A + B muss als notwendige Disjunktion erscheinen");
  assert.equal(disjunction.kind, "disjunction");
  approx(disjunction.consistency, 1);
  // Keine der beiden Einzelbedingungen erreicht die Konsistenzschwelle.
  assert.equal(find(entries, "A"), undefined);
  assert.equal(find(entries, "B"), undefined);
});

test("necessarySupersets: Kennzahlen entsprechen den Definitionen", () => {
  const entries = necessarySupersets(["A", "B", "C"], "Y", SUIN, {
    inclCut: 0.9,
    covCut: 0,
    depth: 2,
  });
  const disjunction = find(entries, "A + B")!;
  const X = SUIN.map((c) => Math.max(c.values.A, c.values.B));
  const Y = SUIN.map((c) => c.values.Y);
  const sumMin = X.reduce((a, x, i) => a + Math.min(x, Y[i]), 0);
  approx(disjunction.consistency, sumMin / Y.reduce((a, b) => a + b, 0));
  approx(disjunction.coverage, sumMin / X.reduce((a, b) => a + b, 0));
  approx(disjunction.relevance, relevanceOfNecessity(X, Y));
});

test("necessarySupersets: Minimalität — keine Disjunktion über einer zulässigen Teilmenge", () => {
  // C ist hier einzeln notwendig; jede Disjunktion mit C wäre redundant.
  const cases: QcaCase[] = [
    { label: "a", values: { C: 1, D: 0, Y: 1 } },
    { label: "b", values: { C: 1, D: 1, Y: 1 } },
    { label: "c", values: { C: 1, D: 0, Y: 0 } },
    { label: "d", values: { C: 0, D: 1, Y: 0 } },
  ];
  const entries = necessarySupersets(["C", "D"], "Y", cases, {
    inclCut: 0.9,
    covCut: 0,
    depth: 2,
  });
  assert.ok(find(entries, "C"), "C ist einzeln notwendig");
  assert.equal(
    entries.some((e) => e.kind === "disjunction" && e.literals.includes("C")),
    false,
    "Disjunktionen mit einem bereits zulässigen Disjunkt sind nicht minimal",
  );
});

test("necessarySupersets: kein Ausdruck kombiniert eine Bedingung mit ihrer Negation", () => {
  const entries = necessarySupersets(["A", "B", "C"], "Y", SUIN, {
    inclCut: 0,
    covCut: 0,
    depth: 3,
  });
  for (const entry of entries) {
    const bare = entry.literals.map((l) => l.replace(/^~/, ""));
    assert.equal(new Set(bare).size, bare.length, `doppelte Bedingung in ${entry.expression}`);
  }
});

test("necessarySupersets: ronCut filtert triviale Notwendigkeit", () => {
  // X ist bei fast allen Fällen nahezu vollständig vorhanden -> notwendig, aber trivial.
  const trivial: QcaCase[] = [
    { label: "a", values: { X: 0.99, Y: 0.9 } },
    { label: "b", values: { X: 0.98, Y: 0.8 } },
    { label: "c", values: { X: 0.99, Y: 0.2 } },
    { label: "d", values: { X: 0.97, Y: 0.1 } },
  ];
  const withoutCut = necessarySupersets(["X"], "Y", trivial, { inclCut: 0.9, covCut: 0 });
  assert.ok(find(withoutCut, "X"), "ohne RoN-Schwelle erscheint die triviale Bedingung");
  const entry = find(withoutCut, "X")!;
  assert.ok(entry.relevance < 0.2, `RoN sollte klein sein, ist ${entry.relevance}`);
  const withCut = necessarySupersets(["X"], "Y", trivial, {
    inclCut: 0.9,
    covCut: 0,
    ronCut: 0.5,
  });
  assert.equal(find(withCut, "X"), undefined, "RoN-Schwelle entfernt die triviale Bedingung");
});

test("necessityAnalysis weist RoN je Einzelbedingung aus", () => {
  const entries = necessityAnalysis(["A", "B", "C"], "Y", SUIN);
  const a = entries.find((e) => e.condition === "A")!;
  const X = SUIN.map((c) => c.values.A);
  const Y = SUIN.map((c) => c.values.Y);
  approx(a.relevance, relevanceOfNecessity(X, Y));
  const notA = entries.find((e) => e.condition === "~A")!;
  approx(
    notA.relevance,
    relevanceOfNecessity(
      SUIN.map((c) => 1 - c.values.A),
      Y,
    ),
  );
});

test("relevanceOfNecessity: Formel Σ(1−X) / Σ(1−min(X,Y))", () => {
  const X = [0.2, 0.8, 1];
  const Y = [0.9, 0.4, 1];
  const expected = (0.8 + 0.2 + 0) / (1 - 0.2 + (1 - 0.4) + 0);
  approx(relevanceOfNecessity(X, Y), expected);
  assert.throws(() => relevanceOfNecessity([0.1], [0.1, 0.2]));
});

test("necessarySupersets: Outcome darf keine Bedingung sein", () => {
  assert.throws(() => necessarySupersets(["A", "Y"], "Y", SUIN));
});
