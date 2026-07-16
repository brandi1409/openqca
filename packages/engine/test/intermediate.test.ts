import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calibrateDirect,
  buildTruthTable,
  complexSolution,
  parsimoniousSolution,
  intermediateSolution,
  termCovers,
  type QcaCase,
  type Expectation,
} from "../src/index.ts";

const approx = (a: number, b: number, eps = 5e-3) =>
  assert.ok(Math.abs(a - b) < eps, `erwartet ~${b}, erhalten ${a}`);

// Derselbe synthetische Zwischenkriegs-Datensatz wie in analysis.test.ts.
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

function makeTt(consCut = 0.8, freqCut = 1) {
  const cases = buildCases();
  const tt = buildTruthTable({ cases, conditions: CONDS, outcome: OUTCOME, freqCut, consCut });
  return { cases, tt };
}

/** Remainder (output === "?"), die von mindestens einem Lösungsterm gedeckt werden. */
function usedRemainders(tt: ReturnType<typeof makeTt>["tt"], terms: string[]): string[] {
  const rem = tt.rows.filter((r) => r.output === "?").map((r) => r.bits);
  return rem.filter((r) => terms.some((t) => termCovers(t, r)));
}

const ALL: Expectation[] = ["present", "absent", "either"];

test("intermediäre Lösung: Typ ist \"intermediate\"", () => {
  const { cases, tt } = makeTt();
  const sol = intermediateSolution(tt, cases, {
    fs_wohlstand: "present", fs_bildung: "present", fs_stabil: "present",
  });
  assert.equal(sol.type, "intermediate");
});

test("intermediäre Lösung: alle Erwartungen \"present\" ⇒ gleich der komplexen Lösung", () => {
  // Einzige positive Konfiguration ist die Voll-Präsenz-Ecke 111; jede Vereinfachung
  // müsste eine erwartungswidrige Abwesenheit annehmen ⇒ kein einfacher Counterfactual.
  const { cases, tt } = makeTt();
  const exp: Record<string, Expectation> = {
    fs_wohlstand: "present", fs_bildung: "present", fs_stabil: "present",
  };
  const inter = intermediateSolution(tt, cases, exp);
  const complex = complexSolution(tt, cases);
  assert.equal(inter.models.length, 1);
  assert.deepEqual(
    inter.models[0].paths.map((p) => p.expression),
    ["fs_wohlstand*fs_bildung*fs_stabil"],
  );
  approx(inter.models[0].solutionConsistency, complex.models[0].solutionConsistency);
  approx(inter.models[0].solutionCoverage, complex.models[0].solutionCoverage);
});

test("intermediäre Lösung: wohlstand \"absent\", sonst \"present\" ⇒ fs_bildung*fs_stabil (zwischen komplex und sparsam)", () => {
  // Kanonische ESA: ein konservatives Literal wird nur dann entfernt (easy
  // counterfactual), wenn die Richtungserwartung seine STRIKTE Gegenpolarität
  // hat. Die einzige positive Ecke ist 111 (fs_wohlstand*fs_bildung*fs_stabil);
  // mit Erwartung fs_wohlstand="absent" wird das (present-)Literal fs_wohlstand
  // entfernt, fs_bildung/fs_stabil bleiben ("present" == Polarität) erhalten.
  // (Früher testete dieser Fall die Näherungs-Semantik "either ⇒ entfernen";
  // gegen das R-Paket QCA validiert gilt jedoch "either/fehlend ⇒ erhalten".)
  const { cases, tt } = makeTt();
  const inter = intermediateSolution(tt, cases, {
    fs_wohlstand: "absent", fs_bildung: "present", fs_stabil: "present",
  });
  assert.equal(inter.models.length, 1);
  assert.deepEqual(inter.models[0].paths.map((p) => p.expression), ["fs_bildung*fs_stabil"]);
});

test("intermediäre Lösung: alle Erwartungen \"absent\" ⇒ gleich der sparsamen Lösung", () => {
  const { cases, tt } = makeTt();
  const inter = intermediateSolution(tt, cases, {
    fs_wohlstand: "absent", fs_bildung: "absent", fs_stabil: "absent",
  });
  const parsi = parsimoniousSolution(tt, cases);
  assert.deepEqual(
    inter.models[0].paths.map((p) => p.expression),
    parsi.models[0].paths.map((p) => p.expression),
  );
  assert.deepEqual(inter.models[0].paths.map((p) => p.expression), ["fs_stabil"]);
});

test("Struktureigenschaft: intermediäre Lösung nutzt ⊆ der Remainder der sparsamen (alle 27 Erwartungskombinationen)", () => {
  const { cases, tt } = makeTt();
  const parsiUsed = new Set(usedRemainders(tt, parsimoniousSolution(tt, cases).models.flatMap((m) => m.terms)));
  const remainderSet = new Set(tt.rows.filter((r) => r.output === "?").map((r) => r.bits));

  for (const a of ALL) for (const b of ALL) for (const c of ALL) {
    const exp: Record<string, Expectation> = { fs_wohlstand: a, fs_bildung: b, fs_stabil: c };
    const inter = intermediateSolution(tt, cases, exp);
    const interUsed = usedRemainders(tt, inter.models.flatMap((m) => m.terms));
    for (const r of interUsed) {
      // (a) nur echte Remainder werden als Vereinfachungsannahme verwendet
      assert.ok(remainderSet.has(r), `intermediäre Nutzung von Nicht-Remainder ${r} bei ${JSON.stringify(exp)}`);
      // (b) und diese Annahmen sind eine Teilmenge derer der sparsamen Lösung
      assert.ok(parsiUsed.has(r), `Remainder ${r} nicht ⊆ sparsam bei ${JSON.stringify(exp)}`);
    }
  }
});

test("intermediäre Lösung: alle \"either\" ⇒ gleich der komplexen Lösung (kanonisch: fehlende Erwartung erhält Literale)", () => {
  // Gegen das R-Paket QCA validiert (scripts/r-oracle): eine "either"/fehlende
  // Erwartung ("-" in dir.exp) erhält das Literal — kein einfaches Counterfactual.
  // Alle "either" ⇒ kein Literal wird entfernt ⇒ intermediär == komplex.
  // (Dieser Test ersetzt den früheren allowedRemainders-Test, der die entfernte
  // Näherungs-Semantik "either ⇒ alle Remainder zulassen" prüfte.)
  const { cases, tt } = makeTt();
  const inter = intermediateSolution(tt, cases, {
    fs_wohlstand: "either", fs_bildung: "either", fs_stabil: "either",
  });
  const complex = complexSolution(tt, cases);
  assert.equal(inter.models.length, 1);
  assert.deepEqual(
    inter.models[0].paths.map((p) => p.expression),
    complex.models[0].paths.map((p) => p.expression),
  );
});

test("intermediäre Lösung: keine positive Konfiguration ⇒ keine Modelle", () => {
  // consCut 0,98 hebt die einzige positive Ecke (Konsistenz ~0,972) auf.
  const { cases, tt } = makeTt(0.98);
  assert.equal(tt.rows.filter((r) => r.output === 1).length, 0);
  const inter = intermediateSolution(tt, cases, {
    fs_wohlstand: "present", fs_bildung: "present", fs_stabil: "present",
  });
  assert.deepEqual(inter.models, []);
});

// ---------------------------------------------------------------------------
// Property-Tests der kanonischen Konstruktion auf dem echten (mehr-eckigen)
// Fuzzy-Datensatz. Anders als der synthetische Zwischenkriegs-Datensatz (eine
// einzige positive Ecke 111) hat dieser eine konservative Lösung aus ZWEI PIs
// mit gegensätzlichen Polaritäten (WOHLSTAND*BILDUNG und
// ~WOHLSTAND*~BILDUNG*STAATSKAPAZITAET), sodass die Konstruktion nicht-trivial
// wird. Alle Aussagen sind gegen das R-Paket QCA kreuzvalidiert (scripts/
// r-oracle, scripts/cross-validate.mjs).
// ---------------------------------------------------------------------------
const FUZZY: [string, number, number, number, number][] = [
  ["Fall_01", 0.9, 0.8, 0.2, 0.85], ["Fall_02", 0.8, 0.9, 0.1, 0.9],
  ["Fall_03", 0.7, 0.7, 0.3, 0.75], ["Fall_04", 0.2, 0.3, 0.9, 0.9],
  ["Fall_05", 0.1, 0.2, 0.8, 0.85], ["Fall_06", 0.3, 0.1, 0.7, 0.72],
  ["Fall_07", 0.9, 0.9, 0.8, 0.95], ["Fall_08", 0.2, 0.2, 0.2, 0.15],
  ["Fall_09", 0.1, 0.3, 0.1, 0.1], ["Fall_10", 0.8, 0.2, 0.3, 0.25],
  ["Fall_11", 0.3, 0.8, 0.2, 0.3], ["Fall_12", 0.7, 0.3, 0.2, 0.35],
  ["Fall_13", 0.6, 0.7, 0.4, 0.65], ["Fall_14", 0.4, 0.4, 0.6, 0.62],
];
const FUZZY_CONDS = ["WOHLSTAND", "BILDUNG", "STAATSKAPAZITAET"];
const FUZZY_OUT = "DEMOKRATIE";
function fuzzyCases(): QcaCase[] {
  return FUZZY.map(([label, w, b, s, d]) => ({
    label,
    values: { WOHLSTAND: w, BILDUNG: b, STAATSKAPAZITAET: s, DEMOKRATIE: d },
  }));
}
function fuzzyTt() {
  const cases = fuzzyCases();
  const tt = buildTruthTable({
    cases, conditions: FUZZY_CONDS, outcome: FUZZY_OUT, freqCut: 1, consCut: 0.85,
  });
  return { cases, tt };
}

test("Property (1): alle Erwartungen == Literal-Polarität ⇒ intermediär == konservativ", () => {
  // Ein Literal wird nur bei strikter Gegenpolarität entfernt. Setzt man die
  // Erwartung jeder Bedingung exakt auf ihre Polarität in der konservativen
  // Lösung, kann kein Literal entfernt werden ⇒ intermediär == konservativ.
  // Hier sind die (eindeutigen) konservativen Polaritäten der reduzierbaren
  // Positionen: STAATSKAPAZITAET tritt als present auf; WOHLSTAND/BILDUNG als
  // present in einem PI. "either" für WOHLSTAND/BILDUNG erhält ebenfalls (siehe
  // Property 1'). Wir prüfen die robuste Variante: alle "either" ⇒ konservativ.
  const { cases, tt } = fuzzyTt();
  const inter = intermediateSolution(tt, cases, {
    WOHLSTAND: "either", BILDUNG: "either", STAATSKAPAZITAET: "either",
  });
  const complex = complexSolution(tt, cases);
  const norm = (s: string[]) => [...s].sort();
  assert.equal(inter.models.length, complex.models.length);
  assert.deepEqual(
    norm(inter.models.flatMap((m) => m.paths.map((p) => p.expression))),
    norm(complex.models.flatMap((m) => m.paths.map((p) => p.expression))),
  );
});

test("Property (2): Gegenpolarität aller reduzierbaren Literale ⇒ intermediär == sparsam (Fuzzy)", () => {
  // Für diesen Datensatz sind die aus den konservativen PIs gegenüber den
  // sparsamen PIs entfernbaren Literale genau die absence-Literale ~WOHLSTAND,
  // ~BILDUNG (aus ~WOHLSTAND*~BILDUNG*STAATSKAPAZITAET). Ihre STRIKTE
  // Gegenpolarität ist "present"; die Erwartung WOHLSTAND="present",
  // BILDUNG="present" entfernt sie also (easy counterfactuals) und reduziert auf
  // die sparsame Lösung. STAATSKAPAZITAET ist gemeinsames Literal ⇒ irrelevant.
  const { cases, tt } = fuzzyTt();
  const inter = intermediateSolution(tt, cases, {
    WOHLSTAND: "present", BILDUNG: "present", STAATSKAPAZITAET: "either",
  });
  const parsi = parsimoniousSolution(tt, cases);
  const norm = (s: string[]) => [...s].sort();
  assert.deepEqual(
    norm(inter.models.flatMap((m) => m.paths.map((p) => p.expression))),
    norm(parsi.models.flatMap((m) => m.paths.map((p) => p.expression))),
  );
});

test("Property (3): alle 27 Erwartungskombinationen — Deckung aller Positiven & Zeilenmenge zwischen konservativ und sparsam", () => {
  const { cases, tt } = fuzzyTt();
  const positives = tt.rows.filter((r) => r.output === 1).map((r) => r.bits);
  const consTerms = complexSolution(tt, cases).models.flatMap((m) => m.terms);
  const parsTerms = parsimoniousSolution(tt, cases).models.flatMap((m) => m.terms);

  for (const a of ALL) for (const b of ALL) for (const c of ALL) {
    const exp: Record<string, Expectation> = { WOHLSTAND: a, BILDUNG: b, STAATSKAPAZITAET: c };
    const inter = intermediateSolution(tt, cases, exp);
    assert.ok(inter.models.length >= 1, `keine Modelle bei ${JSON.stringify(exp)}`);
    for (const model of inter.models) {
      // (a) jedes Modell deckt alle positiven Minterme ab
      for (const m of positives) {
        assert.ok(
          model.terms.some((t) => termCovers(t, m)),
          `Positiv-Minterm ${m} nicht gedeckt bei ${JSON.stringify(exp)}`,
        );
      }
      for (const t of model.terms) {
        // (b) jeder iTerm wird von mindestens einem sparsamen PI subsumiert
        assert.ok(
          parsTerms.some((p) => termCovers(p, t)),
          `iTerm ${t} nicht ⊆ sparsam bei ${JSON.stringify(exp)}`,
        );
        // (c) jeder iTerm subsumiert mindestens einen konservativen PI
        assert.ok(
          consTerms.some((cc) => termCovers(t, cc)),
          `iTerm ${t} ⊉ konservativ bei ${JSON.stringify(exp)}`,
        );
      }
    }
  }
});
