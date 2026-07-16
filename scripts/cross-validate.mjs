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
// Ausführung (aus dem Repository-Wurzelverzeichnis, Node 26 mit Type-Stripping):
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
];

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
  for (const scenario of SCENARIOS) {
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
    if (problems.length === 0) {
      console.log(`✓ ${scenario.name}: PASS`);
    } else {
      failed += 1;
      console.error(`✗ ${scenario.name}: FAIL`);
      problems.forEach((p) => console.error(`    - ${p}`));
    }
  }

  console.log(`\n${SCENARIOS.length - failed}/${SCENARIOS.length} Szenarien PASS`);
  if (failed > 0) {
    console.error(`${failed} Szenario(en) FAIL — Kreuzvalidierung fehlgeschlagen.`);
    process.exit(1);
  }
  console.log("Kreuzvalidierung gegen R (QCA-Paket) bestanden.");
}

main().catch((error) => {
  console.error(`Kreuzvalidierung abgebrochen: ${error.stack ?? error.message}`);
  process.exit(1);
});
