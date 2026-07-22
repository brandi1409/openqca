#!/usr/bin/env node

import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import os from "node:os";

import { buildTruthTable } from "../packages/engine/src/index.ts";

const REPEATS = 3;
const SCENARIOS = [
  { id: "truth-table-8x1000", conditions: 8, cases: 1_000 },
  { id: "truth-table-10x1000", conditions: 10, cases: 1_000 },
  { id: "truth-table-12x1000", conditions: 12, cases: 1_000 },
  { id: "truth-table-12x5000", conditions: 12, cases: 5_000 },
];

function createCases(caseCount, conditionCount) {
  let state = 0x9e3779b9 ^ (caseCount << 3) ^ conditionCount;
  const next = () => {
    state = Math.imul(state ^ (state >>> 16), 0x45d9f3b);
    state = Math.imul(state ^ (state >>> 16), 0x45d9f3b);
    state ^= state >>> 16;
    return (state >>> 0) / 0x100000000;
  };
  const conditions = Array.from({ length: conditionCount }, (_, index) => `C${index + 1}`);
  return Array.from({ length: caseCount }, (_, rowIndex) => {
    const values = Object.fromEntries(conditions.map((condition) => [condition, 0.02 + next() * 0.96]));
    const outcome = 0.02 + next() * 0.96;
    return { label: `case-${rowIndex + 1}`, values: { ...values, Y: outcome } };
  });
}

function measure(fn) {
  const start = performance.now();
  const result = fn();
  return { result, milliseconds: performance.now() - start };
}

function benchmarkScenario(scenario) {
  const conditions = Array.from({ length: scenario.conditions }, (_, index) => `C${index + 1}`);
  const cases = createCases(scenario.cases, scenario.conditions);
  const params = { cases, conditions, outcome: "Y", freqCut: 1, consCut: 0.8 };

  // Warm up the same code path before recording samples.
  buildTruthTable(params);
  const samples = [];
  let result;
  for (let repeat = 0; repeat < REPEATS; repeat += 1) {
    const measured = measure(() => buildTruthTable(params));
    result = measured.result;
    samples.push(measured.milliseconds);
  }
  samples.sort((a, b) => a - b);
  assert.equal(result.rows.length, 2 ** scenario.conditions);
  assert.equal(result.totalCaseCount, scenario.cases);
  assert.ok(result.assignedCaseCount <= scenario.cases);

  return {
    ...scenario,
    rowCount: result.rows.length,
    assignedCaseCount: result.assignedCaseCount,
    medianMilliseconds: samples[Math.floor(samples.length / 2)],
    minMilliseconds: samples[0],
    maxMilliseconds: samples.at(-1),
  };
}

const startedAt = new Date().toISOString();
const results = SCENARIOS.map(benchmarkScenario);
console.log(
  JSON.stringify(
    {
      benchmark: "openQCA engine buildTruthTable",
      startedAt,
      node: process.version,
      platform: `${process.platform}-${process.arch}`,
      cpu: os.cpus()[0]?.model ?? "unknown",
      repeats: REPEATS,
      scenarios: results,
      note: "Timings are machine-specific; rerun this script on the target device before changing limits or introducing workers.",
    },
    null,
    2,
  ),
);
