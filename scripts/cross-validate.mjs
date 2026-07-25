#!/usr/bin/env node
// =============================================================================
// Kreuzvalidierung des openQCA-Rechenkerns gegen das R-Paket QCA
// -----------------------------------------------------------------------------
// Liest das vom R-Orakel erzeugte scripts/r-oracle/expected.json, rechnet
// dieselben Szenarien mit UNSERER Engine (packages/engine/src/index.ts),
// normalisiert beide Seiten (Literale alphabetisch sortiert, Terme sortiert;
// Zahlen mit Toleranz 1e-6) und meldet PASS/FAIL je Szenario.
//
// Exit-Codes:
//   0  alle Szenarien PASS
//   1  mindestens ein Szenario FAIL
//   2  expected.json fehlt (R-Orakel noch nicht erzeugt)
//
// Ausführung (aus dem Repository-Wurzelverzeichnis, Node >= 22.18 mit Type-Stripping):
//   node scripts/cross-validate.mjs
// =============================================================================

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

import {
  buildTruthTable,
  complexSolution,
  parsimoniousSolution,
  intermediateSolution,
} from "../packages/engine/src/index.ts";

const NUM_TOL = 1e-6;
const rootUrl = new URL("../", import.meta.url);
const datasetsDir = fileURLToPath(new URL("datasets/", rootUrl));
const expectedPath = fileURLToPath(new URL("scripts/r-oracle/expected.json", rootUrl));

// --- CSV-Einlesen (identisch zu scripts/reference-check.mjs) -----------------
function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      fields.push(field);
      field = "";
    } else field += ch;
  }
  fields.push(field);
  return fields;
}

async function loadCases(filename) {
  const text = await readFile(`${datasetsDir}${filename}`, "utf8");
  const lines = text.replace(/^﻿/, "").trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const [labelCol, ...valueCols] = headers;
  return lines.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((h, i) => [h, fields[i]]));
    const values = Object.fromEntries(valueCols.map((c) => [c, Number(record[c])]));
    return { label: record[labelCol], values };
  });
}

// --- Normalisierung ----------------------------------------------------------
function canonTerm(term) {
  return term.split("*").map((l) => l.trim()).sort().join("*");
}
function canonModel(expression) {
  return expression.split("+").map((t) => canonTerm(t.trim())).sort().join(" + ");
}
function numEq(a, b) {
  if (a === null || a === undefined || Number.isNaN(a)) return b === null;
  if (b === null || b === undefined) return false;
  return Math.abs(a - b) <= NUM_TOL;
}

// Wandelt ein Engine-Modell in dieselbe Struktur wie im expected.json.
function engineModel(model) {
  return {
    expression: model.paths.map((p) => p.expression).join(" + "),
    inclS: model.solutionConsistency,
    covS: model.solutionCoverage,
    paths: model.paths.map((p) => ({
      term: p.expression,
      incl: p.consistency,
      cov: p.rawCoverage,
      covU: p.uniqueCoverage,
    })),
  };
}

// --- Szenario-Definitionen (Spiegelung des R-Orakels) ------------------------
const DATASETS = {
  fuzzy: {
    filename: "fuzzy-sets-beispiel.csv",
    conditions: ["WOHLSTAND", "BILDUNG", "STAATSKAPAZITAET"],
    outcome: "DEMOKRATIE",
    consCut: 0.85,
    freqCut: 1,
  },
  crisp: {
    filename: "crisp-sets-beispiel.csv",
    conditions: ["FOERDERUNG", "TEAM", "MARKT", "KONKURRENZ"],
    outcome: "ERFOLG",
    consCut: 1,
    freqCut: 1,
  },
  // Lipset — der kanonische QCA-Lehrfall (Ragins eigenes Beispiel). Die Daten
  // stammen aus dem GPL-lizenzierten R-Paket QCA und werden deshalb NICHT mit
  // diesem MIT-Repository ausgeliefert; sie werden lokal erzeugt
  // (Rscript scripts/r-oracle/lipset-export.R). Fehlen sie, werden die
  // Szenarien sauber uebersprungen statt zu scheitern.
  lipset: {
    filename: "local/lipset-fuzzy.csv",
    conditions: ["DEV", "URB", "LIT", "IND", "STB"],
    outcome: "SURV",
    consCut: 0.8,
    freqCut: 1,
    optional: true,
  },
  // Konstruierter Ambiguitätsfall: mehrere sparsame Modelle, ein konservativer
  // Primimplikant von mehreren sparsamen subsumiert. Prüft die kanonische
  // ESA-Modellbildung — der Fall fehlte in den ersten zwölf Szenarien.
  ambig: {
    filename: "modell-ambiguitaet.csv",
    conditions: ["A", "B", "C", "D"],
    outcome: "ERGEBNIS",
    consCut: 1,
    freqCut: 1,
  },
};

// dir.exp-Werte → Expectation-Record (1→present, 0→absent, "-"→either).
function expectations(dataset, dirExp) {
  const map = { 1: "present", "1": "present", 0: "absent", "0": "absent", "-": "either" };
  return Object.fromEntries(dataset.conditions.map((c, i) => [c, map[dirExp[i]]]));
}

const SCENARIOS = [
  { name: "fuzzy_conservative", ds: "fuzzy", kind: "conservative" },
  { name: "fuzzy_parsimonious", ds: "fuzzy", kind: "parsimonious" },
  { name: "fuzzy_intermediate_all_present", ds: "fuzzy", kind: "intermediate", dirExp: [1, 1, 1] },
  { name: "fuzzy_intermediate_all_absent", ds: "fuzzy", kind: "intermediate", dirExp: [0, 0, 0] },
  { name: "fuzzy_intermediate_mixed", ds: "fuzzy", kind: "intermediate", dirExp: [1, 1, 0] },
  { name: "fuzzy_intermediate_dash", ds: "fuzzy", kind: "intermediate", dirExp: ["-", 1, 1] },
  { name: "crisp_conservative", ds: "crisp", kind: "conservative" },
  { name: "crisp_parsimonious", ds: "crisp", kind: "parsimonious" },
  { name: "crisp_intermediate_all_present", ds: "crisp", kind: "intermediate", dirExp: [1, 1, 1, 1] },
  { name: "crisp_intermediate_all_absent", ds: "crisp", kind: "intermediate", dirExp: [0, 0, 0, 0] },
  { name: "crisp_intermediate_mixed", ds: "crisp", kind: "intermediate", dirExp: [1, 1, 0, 0] },
  { name: "crisp_intermediate_dash", ds: "crisp", kind: "intermediate", dirExp: [1, 1, "-", 0] },
  { name: "ambig_conservative", ds: "ambig", kind: "conservative" },
  { name: "ambig_parsimonious", ds: "ambig", kind: "parsimonious" },
  { name: "ambig_intermediate_all_present", ds: "ambig", kind: "intermediate", dirExp: [1, 1, 1, 1] },
  { name: "ambig_intermediate_mixed", ds: "ambig", kind: "intermediate", dirExp: [1, 0, 1, 0] },
  { name: "lipset_conservative", ds: "lipset", kind: "conservative" },
  { name: "lipset_parsimonious", ds: "lipset", kind: "parsimonious" },
  { name: "lipset_intermediate_all_present", ds: "lipset", kind: "intermediate", dirExp: [1, 1, 1, 1, 1] },
];

/**
 * Dokumentierte, noch nicht verstandene Abweichungen von der Referenz.
 * Sie werden NICHT versteckt: Das Skript meldet sie sichtbar als Warnung und
 * schlägt fehl, sobald eine davon VERSCHWINDET (dann ist der Eintrag zu
 * entfernen). Niemals einen Eintrag hinzufügen, um eine Prüfung grün zu
 * bekommen — nur für Abweichungen, die in VALIDATION.md analysiert sind.
 */
const KNOWN_DIVERGENCES = {
  ambig_intermediate_mixed:
    "ESA mit gemischten Richtungserwartungen: R liefert C*D + A*B*C, die Engine " +
    "C*D + A*B*C*~D — ein Literal wird nicht als easy counterfactual entfernt. " +
    "Siehe VALIDATION.md, Abschnitt 'Bekannte Abweichungen'.",
  lipset_intermediate_all_present:
    "Dieselbe ESA-Ursache auf dem kanonischen Lipset-Datensatz: R liefert " +
    "DEV*URB*LIT*STB + DEV*LIT*~IND*STB, die Engine behaelt zusaetzlich IND. " +
    "Konservative und sparsame Loesung stimmen dort exakt ueberein. " +
    "Siehe VALIDATION.md, Abschnitt 'Bekannte Abweichungen'.",
};


/**
 * Bindet die oeffentliche Behauptung an das tatsaechliche Ergebnis.
 *
 * Die Landing nennt die Zahl der uebereinstimmenden Szenarien. Genau solche
 * handgepflegten Zahlen driften — das war bereits einmal der Fall (die Seite
 * warb mit Werten, die die App nicht lieferte). Deshalb prueft dieses Skript
 * bei jedem Lauf, dass die Zahlen in dict.ts/Landing.tsx dem echten Stand
 * entsprechen, und schlaegt sonst fehl. Nie die Zahl hier anpassen, um gruen
 * zu werden — immer die Behauptung korrigieren.
 */
async function checkPublicClaims(passed, total) {
  const files = [
    fileURLToPath(new URL("apps/web/src/i18n/dict.ts", rootUrl)),
    fileURLToPath(new URL("apps/web/src/components/Landing.tsx", rootUrl)),
    // Auch die Doku driftet: README und ROADMAP nannten laenger "12 Szenarien",
    // waehrend VALIDATION.md bereits 15/16 auswies.
    fileURLToPath(new URL("README.md", rootUrl)),
    fileURLToPath(new URL("docs/ROADMAP.md", rootUrl)),
    fileURLToPath(new URL("VALIDATION.md", rootUrl)),
  ];
  const problems = [];
  for (const file of files) {
    let text;
    try {
      text = await readFile(file, "utf8");
    } catch {
      continue; // Datei fehlt (z. B. Engine-only-Checkout) — nicht Aufgabe dieses Skripts.
    }
    // Muster wie "15 von 16", "15/16", "12 von 12" einsammeln.
    const patterns = [/(\d+)\s*von\s*(\d+)\s*Szenarien/g, /"(\d+)\/(\d+)"/g];
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        const claimed = Number(m[1]);
        const claimedTotal = Number(m[2]);
        if (claimed !== passed || claimedTotal !== total) {
          problems.push(
            `${file.split("/").slice(-1)[0]}: behauptet ${claimed}/${claimedTotal}, tatsaechlich ${passed}/${total} — "${m[0]}"`,
          );
        }
      }
    }
  }
  if (problems.length) {
    console.error("\nOeffentliche Behauptung stimmt nicht mit dem Ergebnis ueberein:");
    problems.forEach((p) => console.error(`    - ${p}`));
    console.error("Behauptung korrigieren, nicht diese Pruefung.");
    process.exit(1);
  }
}

async function computeScenario(scenario) {
  const dataset = DATASETS[scenario.ds];
  const cases = await loadCases(dataset.filename);
  const tt = buildTruthTable({
    cases,
    conditions: dataset.conditions,
    outcome: dataset.outcome,
    freqCut: dataset.freqCut,
    consCut: dataset.consCut,
  });
  let sol;
  if (scenario.kind === "conservative") sol = complexSolution(tt, cases);
  else if (scenario.kind === "parsimonious") sol = parsimoniousSolution(tt, cases);
  else sol = intermediateSolution(tt, cases, expectations(dataset, scenario.dirExp));
  return sol.models.map(engineModel);
}

// Vergleicht die Modellmenge (kanonisch) und die Kennzahlen je gematchtem Modell.
function compareModels(ourModels, expectedModels) {
  const problems = [];
  const ourByKey = new Map(ourModels.map((m) => [canonModel(m.expression), m]));
  const expByKey = new Map(expectedModels.map((m) => [canonModel(m.expression), m]));

  for (const key of expByKey.keys()) {
    if (!ourByKey.has(key)) problems.push(`Modell fehlt in Engine: ${key}`);
  }
  for (const key of ourByKey.keys()) {
    if (!expByKey.has(key)) problems.push(`Zusätzliches Engine-Modell: ${key}`);
  }

  for (const [key, exp] of expByKey) {
    const our = ourByKey.get(key);
    if (!our) continue;
    if (!numEq(our.inclS, exp.inclS)) problems.push(`inclS ${key}: R=${exp.inclS} Engine=${our.inclS}`);
    if (!numEq(our.covS, exp.covS)) problems.push(`covS ${key}: R=${exp.covS} Engine=${our.covS}`);

    const ourPaths = new Map(our.paths.map((p) => [canonTerm(p.term), p]));
    const multiPath = exp.paths.length > 1;
    for (const ep of exp.paths) {
      const op = ourPaths.get(canonTerm(ep.term));
      if (!op) {
        problems.push(`Pfad fehlt: ${canonTerm(ep.term)} in ${key}`);
        continue;
      }
      if (!numEq(op.incl, ep.incl)) problems.push(`incl ${ep.term}: R=${ep.incl} Engine=${op.incl}`);
      if (!numEq(op.cov, ep.cov)) problems.push(`cov ${ep.term}: R=${ep.cov} Engine=${op.cov}`);
      // covU nur bei Mehrpfad-Modellen vergleichen (R liefert sonst null/NA).
      if (multiPath && ep.covU !== null && !numEq(op.covU, ep.covU)) {
        problems.push(`covU ${ep.term}: R=${ep.covU} Engine=${op.covU}`);
      }
    }
  }
  return problems;
}

async function main() {
  if (!existsSync(expectedPath)) {
    console.error(
      "R-Orakel noch nicht erzeugt — zuerst Rscript scripts/r-oracle/oracle.R ausführen.",
    );
    process.exit(2);
  }

  const expected = JSON.parse(await readFile(expectedPath, "utf8"));
  const expByName = new Map(expected.scenarios.map((s) => [s.name, s]));

  let failed = 0;
  let knownFailed = 0;
  let skipped = 0;
  for (const scenario of SCENARIOS) {
    // Optionale Datensaetze (z. B. Lipset aus dem GPL-Paket QCA) liegen nicht im
    // Repository. Fehlen sie, wird das Szenario sichtbar uebersprungen — nicht
    // als Fehlschlag gewertet und auch nicht stillschweigend verschwiegen.
    const ds = DATASETS[scenario.ds];
    if (ds.optional && !existsSync(`${datasetsDir}${ds.filename}`)) {
      skipped += 1;
      console.log(`– ${scenario.name}: uebersprungen (Daten lokal nicht vorhanden)`);
      continue;
    }
    const exp = expByName.get(scenario.name);
    if (!exp) {
      console.error(`✗ ${scenario.name}: kein Orakel-Eintrag in expected.json`);
      failed += 1;
      continue;
    }
    let ourModels;
    try {
      ourModels = await computeScenario(scenario);
    } catch (error) {
      console.error(`✗ ${scenario.name}: Engine-Fehler — ${error.message}`);
      failed += 1;
      continue;
    }
    const problems = compareModels(ourModels, exp.models);
    const known = KNOWN_DIVERGENCES[scenario.name];
    if (problems.length === 0) {
      if (known) {
        // Eine dokumentierte Abweichung, die plötzlich verschwindet, ist ebenso
        // meldepflichtig wie eine neue: Entweder wurde sie behoben (dann gehört
        // der Eintrag entfernt) oder das Orakel wurde verändert.
        failed += 1;
        console.error(`✗ ${scenario.name}: ERWARTETE ABWEICHUNG IST WEG`);
        console.error(`    Eintrag in KNOWN_DIVERGENCES entfernen und VALIDATION.md aktualisieren.`);
      } else {
        console.log(`✓ ${scenario.name}: PASS`);
      }
    } else if (known) {
      knownFailed += 1;
      console.warn(`⚠ ${scenario.name}: BEKANNTE ABWEICHUNG — ${known}`);
      problems.forEach((p) => console.warn(`    - ${p}`));
    } else {
      failed += 1;
      console.error(`✗ ${scenario.name}: FAIL`);
      problems.forEach((p) => console.error(`    - ${p}`));
    }
  }

  const considered = SCENARIOS.length - skipped;
  const passed = considered - failed - knownFailed;
  console.log(`\n${passed}/${considered} Szenarien PASS` +
    (knownFailed ? ` · ${knownFailed} bekannte, dokumentierte Abweichung(en)` : "") +
    (skipped ? ` · ${skipped} uebersprungen (optionale Daten fehlen)` : ""));
  if (failed > 0) {
    console.error(`${failed} Szenario(en) FAIL — Kreuzvalidierung fehlgeschlagen.`);
    process.exit(1);
  }
  // Die oeffentliche Behauptung bezieht sich auf den VOLLEN Umfang der
  // Kreuzvalidierung, nicht auf die Teilmenge, die in dieser Umgebung lief.
  // Wurden optionale Szenarien uebersprungen (z. B. Lipset ohne lokale Daten),
  // waere ein Vergleich gegen die Teilmenge irrefuehrend — dann wird die
  // Pruefung bewusst ausgesetzt und das sichtbar gemeldet.
  if (skipped === 0) {
    await checkPublicClaims(passed, considered);
  } else {
    console.log(
      `Hinweis: Behauptungs-Pruefung ausgesetzt, weil ${skipped} optionale Szenario(s) ` +
        `uebersprungen wurden. Vollstaendig pruefen mit: Rscript scripts/r-oracle/lipset-export.R`,
    );
  }
  console.log("Kreuzvalidierung gegen R (QCA-Paket) bestanden.");
  if (knownFailed) {
    console.log("Hinweis: dokumentierte Abweichungen siehe VALIDATION.md, Abschnitt Bekannte Abweichungen.");
  }
}

main().catch((error) => {
  console.error(`Kreuzvalidierung abgebrochen: ${error.stack ?? error.message}`);
  process.exit(1);
});
