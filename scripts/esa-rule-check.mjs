/**
 * Prüft Regelkandidaten für die ESA-Klassifikation gegen R's eigene Einstufung.
 *
 * Grundlage ist `scripts/r-oracle/esa-corpus.json` (erzeugt von
 * `scripts/r-oracle/esa-corpus.R`): Für viele Konstellationen aus positiven
 * Ecken, negativen Ecken und Richtungserwartungen steht dort, welche Remainder
 * das R-Paket `QCA` als *easy* (`EC`) und welche als *difficult* (`DC`) führt.
 *
 * Eine Regel gilt hier als richtig, wenn sie EC über den **ganzen** Korpus
 * reproduziert — nicht, wenn sie die Formel eines einzelnen Szenarios trifft.
 * Genau dieser Unterschied hat die beiden früheren Anläufe scheitern lassen.
 *
 * Aufruf: node scripts/esa-rule-check.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const corpus = JSON.parse(
  readFileSync(process.env.ESA_CORPUS ?? resolve(repoRoot, "scripts/r-oracle/esa-corpus.json"), "utf8"),
);

/** "~A*B" → Muster über den Bedingungen, "-" für nicht festgelegt. */
function termToPattern(term, k) {
  const pattern = Array.from({ length: k }, () => "-");
  if (!term || term === "1") return pattern.join("");
  for (const literal of term.split("*")) {
    const negated = literal.startsWith("~");
    const name = negated ? literal.slice(1) : literal;
    const index = name.charCodeAt(0) - "A".charCodeAt(0);
    if (index < 0 || index >= k) throw new Error(`Unerwartetes Literal ${literal}`);
    pattern[index] = negated ? "0" : "1";
  }
  return pattern.join("");
}

const covers = (pattern, corner) =>
  [...pattern].every((ch, i) => ch === "-" || ch === corner[i]);

const allCorners = (k) =>
  Array.from({ length: 2 ** k }, (_, i) => i.toString(2).padStart(k, "0"));

/**
 * Kandidatenmenge: Remainder, die von der sparsamen Lösung überdeckt werden.
 * Ob das R's Definition der Simplifying Assumptions trifft, wird unten geprüft —
 * EC ∪ DC muss diese Menge sein, sonst stimmt schon die Kandidatenmenge nicht.
 */
function simplifyingAssumptions(record) {
  const { k, positives, negatives } = record;
  const observed = new Set([...positives, ...negatives]);
  // pSol ist das sparsame Modell, zu dem GENAU DIESES intermediäre Modell
  // gehört. Die zusammengefasste Lösung aller Modelle wäre hier falsch: Bei
  // Mehrdeutigkeit gehören die Remainder unterschiedlichen Modellen.
  const patterns = record.pSol.map((term) => termToPattern(term, k));
  return allCorners(k).filter(
    (corner) => !observed.has(corner) && patterns.some((p) => covers(p, corner)),
  );
}

/** Erwartung je Bedingung: 1 = present, 0 = absent. */
const matchesExpectations = (corner, expectations) =>
  [...corner].every((ch, i) => Number(ch) === expectations[i]);

const RULES = {
  /**
   * R1 — theoriekonform: Ein Remainder ist einfach, wenn er in JEDER Bedingung
   * den erwarteten Wert trägt. Das ist die Lesart „der kontrafaktische Fall ist
   * mit der Theorie vereinbar".
   */
  R1_alleErwartungenErfuellt: (sa, record) =>
    sa.filter((corner) => matchesExpectations(corner, record.expectations)),

  /**
   * R2 — Erreichbarkeit: einfach, wenn der Remainder aus einer positiven Ecke
   * entsteht, indem Bedingungen in ihren erwarteten Zustand wechseln. Das ist
   * Kandidat B aus der früheren Analyse, hier über den ganzen Korpus geprüft.
   */
  R2_wechselInErwartetenZustand: (sa, record) =>
    sa.filter((corner) =>
      record.positives.some((positive) =>
        [...corner].every(
          (ch, i) => ch === positive[i] || Number(ch) === record.expectations[i],
        ),
      ),
    ),

  /**
   * R4 — freie Positionen des sparsamen Terms: Ein Remainder ist einfach, wenn er
   * genau dort, wo der sparsame Primimplikant nichts festlegt (also dort, wo
   * minimiert wurde), den erwarteten Wert trägt. Auf den festgelegten Positionen
   * stimmt er ohnehin mit dem Term überein — das ist keine Annahme, sondern der
   * Term selbst.
   */
  R4_freiePositionenErwartungsgemaess: (sa, record) => {
    const patterns = record.pSol.map((term) => termToPattern(term, record.k));
    return sa.filter((corner) =>
      patterns.some(
        (pattern) =>
          covers(pattern, corner) &&
          [...pattern].every(
            (ch, i) => ch !== "-" || Number(corner[i]) === record.expectations[i],
          ),
      ),
    );
  },

  /**
   * R5 — wie R4, zusätzlich muss der Remainder von einer positiven Ecke aus
   * erreichbar sein, die derselbe sparsame Term abdeckt. Prüft, ob die
   * Erreichbarkeit über die freien Positionen hinaus eine Rolle spielt.
   */
  R5_freiePositionenUndErreichbar: (sa, record) => {
    const patterns = record.pSol.map((term) => termToPattern(term, record.k));
    return sa.filter((corner) =>
      patterns.some(
        (pattern) =>
          covers(pattern, corner) &&
          [...pattern].every(
            (ch, i) => ch !== "-" || Number(corner[i]) === record.expectations[i],
          ) &&
          record.positives.some((positive) => covers(pattern, positive)),
      ),
    );
  },

  /**
   * R3 — gerichtet: wie R2, aber nur Wechsel von abwesend nach anwesend zählen
   * als einfach (Kandidat A aus der früheren Analyse).
   */
  R3_nurHinzufuegen: (sa, record) =>
    sa.filter((corner) =>
      record.positives.some((positive) =>
        [...corner].every(
          (ch, i) =>
            ch === positive[i] ||
            (ch === "1" && positive[i] === "0" && record.expectations[i] === 1),
        ),
      ),
    ),
};

const sortedEqual = (a, b) =>
  a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

let saMismatch = 0;
const saExamples = [];
const results = Object.fromEntries(
  Object.keys(RULES).map((name) => [name, { hit: 0, miss: 0, examples: [] }]),
);

for (const record of corpus.records) {
  const sa = simplifyingAssumptions(record);
  const rEC = record.EC ?? [];
  const rDC = record.DC ?? [];

  if (!sortedEqual(sa, [...rEC, ...rDC])) {
    saMismatch++;
    if (saExamples.length < 3) saExamples.push({ record, sa });
  }

  for (const [name, rule] of Object.entries(RULES)) {
    const predicted = rule(sa, record);
    if (sortedEqual(predicted, rEC)) results[name].hit++;
    else {
      results[name].miss++;
      if (results[name].examples.length < 3) {
        results[name].examples.push({
          positives: record.positives,
          negatives: record.negatives,
          expectations: record.expectations,
          pSol: record.pSol,
          cSol: record.cSol,
          sa,
          erwartetEC: rEC,
          vorhergesagt: predicted,
        });
      }
    }
  }
}

console.log(
  `Korpus: ${corpus.records.length} Datensätze (QCA ${corpus.qcaPackageVersion}, R ${corpus.rVersion})`,
);
console.log(
  `Kandidatenmenge (Remainder unter der sparsamen Lösung) == EC ∪ DC: ` +
    `${corpus.records.length - saMismatch}/${corpus.records.length}`,
);
if (saMismatch > 0) {
  console.log("  Beispiel für eine Abweichung der Kandidatenmenge:");
  console.log("  " + JSON.stringify(saExamples[0], null, 1).replace(/\n/g, "\n  "));
}

console.log("");
for (const [name, r] of Object.entries(results)) {
  const total = r.hit + r.miss;
  console.log(`${r.miss === 0 ? "PASS" : "FAIL"}  ${name}: ${r.hit}/${total}`);
  if (r.miss > 0) {
    console.log("      Gegenbeispiel: " + JSON.stringify(r.examples[0]));
  }
}

const winner = Object.entries(results).find(([, r]) => r.miss === 0);
if (!winner) {
  console.log(
    "\nKeine Regel reproduziert EC vollständig. Die Klassifikationsregel bleibt offen.",
  );
  process.exitCode = 1;
} else {
  console.log(`\n${winner[0]} reproduziert R's EC auf dem ganzen Korpus.`);
}
