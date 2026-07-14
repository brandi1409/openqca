#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  buildTruthTable,
  calibrateDirect,
  complexSolution,
  necessityAnalysis,
  parsimoniousSolution,
} from "../packages/engine/src/index.ts";

const TOLERANCE = 0.01;
const datasetsDirectory = fileURLToPath(new URL("../datasets/", import.meta.url));
const failures = [];

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("Nicht abgeschlossenes Anführungszeichen in CSV-Zeile");
  fields.push(field);
  return fields;
}

async function loadCsv(filename) {
  const text = await readFile(`${datasetsDirectory}${filename}`, "utf8");
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  assert.ok(headers.length >= 2, `${filename}: mindestens zwei Spalten erwartet`);

  const records = lines.slice(1).map((line, rowIndex) => {
    const fields = parseCsvLine(line);
    assert.equal(
      fields.length,
      headers.length,
      `${filename}, Zeile ${rowIndex + 2}: ${headers.length} Felder erwartet, ${fields.length} erhalten`,
    );
    return Object.fromEntries(headers.map((header, index) => [header, fields[index]]));
  });

  return { headers, records };
}

function toQcaCases(dataset, filename) {
  const [labelColumn, ...valueColumns] = dataset.headers;
  return dataset.records.map((record, rowIndex) => {
    const values = Object.fromEntries(
      valueColumns.map((column) => {
        const value = Number(record[column]);
        assert.ok(
          Number.isFinite(value),
          `${filename}, Zeile ${rowIndex + 2}, ${column}: endliche Zahl erwartet`,
        );
        assert.ok(
          value >= 0 && value <= 1,
          `${filename}, Zeile ${rowIndex + 2}, ${column}: QCA-Wert außerhalb [0,1]`,
        );
        return [column, value];
      }),
    );
    return { label: record[labelColumn], values };
  });
}

function expressionOf(model) {
  return model.paths.map((path) => path.expression).join(" + ");
}

function canonicalExpression(expression) {
  return expression
    .split("+")
    .map((path) => path.trim().split("*").map((literal) => literal.trim()).sort().join("*"))
    .sort()
    .join(" + ");
}

function assertClose(actual, expected, label) {
  assert.ok(Number.isFinite(actual), `${label}: endliche Zahl erwartet, erhalten ${actual}`);
  assert.ok(
    Math.abs(actual - expected) <= TOLERANCE,
    `${label}: erwartet ${expected} ± ${TOLERANCE}, erhalten ${actual}`,
  );
}

function check(label, assertion) {
  try {
    assertion();
    console.log(`✓ ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
    console.error(`✗ ${label}: ${error.message}`);
  }
}

const configurations = [
  {
    name: "Crisp",
    filename: "crisp-sets-beispiel.csv",
    conditions: ["FOERDERUNG", "TEAM", "MARKT", "KONKURRENZ"],
    outcome: "ERFOLG",
    freqCut: 1,
    consCut: 1,
    documented: {
      complex: "MARKT*~KONKURRENZ + FOERDERUNG*TEAM*~MARKT",
      parsimonious: "FOERDERUNG*TEAM + MARKT*~KONKURRENZ",
      parsimoniousCoverage: 1,
      parsimoniousConsistency: 1,
    },
    internalSnapshot: {
      complexCoverage: 1,
      complexConsistency: 1,
      necessity: {
        FOERDERUNG: [0.6666666667, 0.5714285714, false],
        "~FOERDERUNG": [0.3333333333, 0.2857142857, false],
        TEAM: [0.6666666667, 0.6666666667, false],
        "~TEAM": [0.3333333333, 0.25, false],
        MARKT: [0.6666666667, 0.6666666667, false],
        "~MARKT": [0.3333333333, 0.25, false],
        KONKURRENZ: [0.1666666667, 0.1666666667, false],
        "~KONKURRENZ": [0.8333333333, 0.625, false],
      },
    },
  },
  {
    name: "Fuzzy",
    filename: "fuzzy-sets-beispiel.csv",
    conditions: ["WOHLSTAND", "BILDUNG", "STAATSKAPAZITAET"],
    outcome: "DEMOKRATIE",
    freqCut: 1,
    consCut: 0.85,
    documented: {
      complex: "~WOHLSTAND*~BILDUNG*STAATSKAPAZITAET + WOHLSTAND*BILDUNG",
      parsimonious: "STAATSKAPAZITAET + WOHLSTAND*BILDUNG",
      parsimoniousCoverage: 0.95,
      parsimoniousConsistency: 0.99,
    },
    internalSnapshot: {
      complexCoverage: 0.9172661871,
      complexConsistency: 0.9935064935,
      necessity: {
        WOHLSTAND: [0.7194244604, 0.8571428571, false],
        "~WOHLSTAND": [0.6115107914, 0.7285714286, false],
        BILDUNG: [0.7194244604, 0.8823529412, false],
        "~BILDUNG": [0.5839328537, 0.6763888889, false],
        STAATSKAPAZITAET: [0.6834532374, 0.9827586207, false],
        "~STAATSKAPAZITAET": [0.6414868106, 0.6524390244, false],
      },
    },
  },
];

async function main() {
  // Alle drei gelieferten CSVs werden eingelesen. Nur die beiden bereits
  // kalibrierten Datensätze gehen direkt in Truth Table und Minimierung ein.
  const rawDataset = await loadCsv("rohwerte-demokratie.csv");
  const rawCaseAt900 = rawDataset.records.find((record) => record.BIP_pKopf === "900");
  assert.ok(rawCaseAt900, "rohwerte-demokratie.csv: dokumentierter BIP-Wert 900 fehlt");

  const calibrationRows = [
    ["fullOut 300", calibrateDirect(300, 300, 600, 1000), 0.0474],
    ["crossover 600", calibrateDirect(600, 300, 600, 1000), 0.5],
    ["fullIn 1000", calibrateDirect(1000, 300, 600, 1000), 0.9526],
    ["BIP 900", calibrateDirect(Number(rawCaseAt900.BIP_pKopf), 300, 600, 1000), 0.905],
  ];

  console.log("\nKalibrierungs-Referenzen (direkte Methode)");
  console.table(
    calibrationRows.map(([punkt, actual, expected]) => ({
      Punkt: punkt,
      Ergebnis: actual.toFixed(4),
      Referenz: expected.toFixed(4),
    })),
  );
  for (const [point, actual, expected] of calibrationRows) {
    check(`Kalibrierung ${point}`, () => assertClose(actual, expected, `Kalibrierung ${point}`));
  }

  const solutionRows = [];
  const necessityRows = [];

  for (const configuration of configurations) {
    const dataset = await loadCsv(configuration.filename);
    const cases = toQcaCases(dataset, configuration.filename);
    const truthTable = buildTruthTable({
      cases,
      conditions: configuration.conditions,
      outcome: configuration.outcome,
      freqCut: configuration.freqCut,
      consCut: configuration.consCut,
    });
    const complex = complexSolution(truthTable, cases);
    const parsimonious = parsimoniousSolution(truthTable, cases);
    const necessity = necessityAnalysis(configuration.conditions, configuration.outcome, cases);

    check(`${configuration.name}: vollständige Truth-Table-Zuordnung`, () => {
      assert.equal(truthTable.rows.length, 2 ** configuration.conditions.length);
      assert.equal(truthTable.assignedCaseCount, truthTable.totalCaseCount);
      assert.equal(truthTable.totalCaseCount, cases.length);
    });
    check(`${configuration.name}: je genau ein komplexes und sparsames Modell`, () => {
      assert.equal(complex.models.length, 1);
      assert.equal(parsimonious.models.length, 1);
    });

    const complexModel = complex.models[0];
    const parsimoniousModel = parsimonious.models[0];
    if (!complexModel || !parsimoniousModel) continue;

    check(`${configuration.name}: dokumentierte komplexe Lösungsformel`, () => {
      assert.equal(
        canonicalExpression(expressionOf(complexModel)),
        canonicalExpression(configuration.documented.complex),
      );
    });
    check(`${configuration.name}: dokumentierte sparsame Lösungsformel`, () => {
      assert.equal(
        canonicalExpression(expressionOf(parsimoniousModel)),
        canonicalExpression(configuration.documented.parsimonious),
      );
    });
    check(`${configuration.name}: dokumentierte sparsame Solution-Coverage`, () => {
      assertClose(
        parsimoniousModel.solutionCoverage,
        configuration.documented.parsimoniousCoverage,
        `${configuration.name} sparsame Coverage`,
      );
    });
    check(`${configuration.name}: dokumentierte sparsame Solution-Konsistenz`, () => {
      assertClose(
        parsimoniousModel.solutionConsistency,
        configuration.documented.parsimoniousConsistency,
        `${configuration.name} sparsame Konsistenz`,
      );
    });
    check(`${configuration.name}: interner Snapshot der komplexen Kennzahlen`, () => {
      assertClose(
        complexModel.solutionCoverage,
        configuration.internalSnapshot.complexCoverage,
        `${configuration.name} komplexe Coverage`,
      );
      assertClose(
        complexModel.solutionConsistency,
        configuration.internalSnapshot.complexConsistency,
        `${configuration.name} komplexe Konsistenz`,
      );
    });

    solutionRows.push(
      {
        Datensatz: configuration.name,
        Lösung: "komplex",
        Formel: expressionOf(complexModel),
        Coverage: complexModel.solutionCoverage.toFixed(4),
        Konsistenz: complexModel.solutionConsistency.toFixed(4),
        Cuts: `${configuration.freqCut} / ${configuration.consCut.toFixed(2)}`,
      },
      {
        Datensatz: configuration.name,
        Lösung: "sparsam",
        Formel: expressionOf(parsimoniousModel),
        Coverage: parsimoniousModel.solutionCoverage.toFixed(4),
        Konsistenz: parsimoniousModel.solutionConsistency.toFixed(4),
        Cuts: `${configuration.freqCut} / ${configuration.consCut.toFixed(2)}`,
      },
    );

    check(`${configuration.name}: interne Notwendigkeits-Snapshots`, () => {
      assert.equal(
        necessity.length,
        Object.keys(configuration.internalSnapshot.necessity).length,
      );
      for (const entry of necessity) {
        const expected = configuration.internalSnapshot.necessity[entry.condition];
        assert.ok(expected, `kein Snapshot für ${entry.condition}`);
        assertClose(entry.consistency, expected[0], `${entry.condition} Notwendigkeits-Konsistenz`);
        assertClose(entry.coverage, expected[1], `${entry.condition} Notwendigkeits-Coverage`);
        assert.equal(entry.isCandidate, expected[2], `${entry.condition} Kandidatenstatus`);
      }
    });

    necessityRows.push(
      ...necessity.map((entry) => ({
        Datensatz: configuration.name,
        Bedingung: entry.condition,
        Konsistenz: entry.consistency.toFixed(4),
        Coverage: entry.coverage.toFixed(4),
        Kandidat: entry.isCandidate ? "ja" : "nein",
      })),
    );
  }

  console.log("\nLösungsergebnisse");
  console.table(solutionRows);
  console.log("Hinweis: Komplexe Kennzahlen und Notwendigkeitswerte sind interne Regressions-Snapshots.");

  console.log("\nNotwendigkeitsanalyse");
  console.table(necessityRows);

  if (failures.length > 0) {
    console.error(`\n${failures.length} Referenzprüfung(en) fehlgeschlagen:`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
    return;
  }

  console.log("\nAlle Referenzprüfungen bestanden");
}

main().catch((error) => {
  console.error(`Referenzprüfung abgebrochen: ${error.stack ?? error.message}`);
  process.exitCode = 1;
});
