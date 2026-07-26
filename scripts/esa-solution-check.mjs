/**
 * Vergleicht die intermediäre Lösung der Engine mit dem R-Paket `QCA` über den
 * gesamten ESA-Korpus.
 *
 * Warum nicht gegen `$EC` prüfen? Weil `$EC` eine **Ausgabe** ist: R führt dort
 * die einfachen Counterfactuals auf, die die fertige Lösung tatsächlich nutzt,
 * nicht die Klassifikation aller Vereinfachungsannahmen. Das war der Denkfehler
 * der ersten Anläufe. Der belastbare Massstab ist die Lösung selbst.
 *
 * Der Korpus (`scripts/r-oracle/esa-corpus.R`) enthält je Konstellation aus
 * positiven Ecken, negativen Ecken und Richtungserwartungen alle intermediären
 * Modelle, die R liefert. Hier wird geprüft, ob die Engine dieselbe Modellmenge
 * berechnet.
 *
 * Aufruf: node scripts/esa-solution-check.mjs
 *         ESA_CORPUS=/pfad/zur/corpus.json node scripts/esa-solution-check.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTruthTable } from "../packages/engine/src/truthTable.ts";
import { intermediateSolution } from "../packages/engine/src/solutions.ts";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const corpusPath =
  process.env.ESA_CORPUS ?? resolve(repoRoot, "scripts/r-oracle/esa-corpus.json");
const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));

/** Aus Ecken einen Datensatz bauen: eine Zeile je beobachteter Ecke. */
function casesFrom(record, conditions) {
  const rows = [];
  for (const [group, outcome] of [
    [record.positives, 1],
    [record.negatives, 0],
  ]) {
    for (const corner of group) {
      rows.push({
        label: `${outcome === 1 ? "pos" : "neg"}_${corner}`,
        values: {
          ...Object.fromEntries(conditions.map((c, i) => [c, Number(corner[i])])),
          OUT: outcome,
        },
      });
    }
  }
  return rows;
}

/** Term-Muster ("10-1") in R-Notation ("A*~B*D"). */
function patternToTerm(pattern, conditions) {
  const parts = [];
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "-") continue;
    parts.push(`${pattern[i] === "0" ? "~" : ""}${conditions[i]}`);
  }
  return parts.length ? parts.join("*") : "1";
}

const modelKey = (terms) => [...terms].sort().join(" + ");
const setKey = (models) => [...new Set(models.map(modelKey))].sort().join(" | ");

// Records nach Konstellation gruppieren — R liefert je (konservatives ×
// sparsames) Modellpaar einen Eintrag, die Engine eine Modellmenge.
const groups = new Map();
for (const record of corpus.records) {
  const key = JSON.stringify([record.positives, record.negatives, record.expectations]);
  if (!groups.has(key)) groups.set(key, { record, models: [] });
  // `intermediate` ist eine Liste von Modellen (je Modell ein Term-Array) — R
  // liefert je (konservativ × sparsam) Paar unter Umständen mehrere.
  for (const model of record.intermediate) groups.get(key).models.push(model);
}

let pass = 0;
const failures = [];

for (const { record, models } of groups.values()) {
  const conditions = Array.from({ length: record.k }, (_, i) =>
    String.fromCharCode("A".charCodeAt(0) + i),
  );
  const cases = casesFrom(record, conditions);
  const tt = buildTruthTable({
    cases,
    conditions,
    outcome: "OUT",
    freqCut: 1,
    consCut: 1,
  });
  const expectations = Object.fromEntries(
    conditions.map((c, i) => [c, record.expectations[i] === 1 ? "present" : "absent"]),
  );
  const solution = intermediateSolution(tt, cases, expectations);
  const engine = solution.models.map((m) => m.paths.map((p) => p.expression));

  if (setKey(engine) === setKey(models)) pass++;
  else if (failures.length < 8) {
    failures.push({
      positives: record.positives,
      negatives: record.negatives,
      expectations: record.expectations,
      r: setKey(models),
      engine: setKey(engine),
    });
  }
}

const total = groups.size;
console.log(
  `ESA-Korpus: ${total} Konstellationen (QCA ${corpus.qcaPackageVersion}, R ${corpus.rVersion})`,
);
console.log(`Intermediäre Lösung identisch: ${pass}/${total}`);
if (pass < total) {
  console.log(`\nAbweichungen (erste ${failures.length}):`);
  for (const f of failures) console.log("  " + JSON.stringify(f));
  process.exitCode = 1;
}
