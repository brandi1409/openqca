import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runCalibrationSensitivity,
  cornerBits,
  canonicalExpression,
  calibrateDirect,
  type AnchorVariant,
} from "../src/index.ts";

test("cornerBits: >0.5 → 1, sonst 0 (inkl. exakt 0.5)", () => {
  assert.equal(cornerBits({ A: 0.6, B: 0.5, C: 0.4 }, ["A", "B", "C"]), "100");
});

test("canonicalExpression sortiert Literale und Terme", () => {
  assert.equal(canonicalExpression("B*A + ~C*D"), "A*B + D*~C");
});

test("runCalibrationSensitivity: Kreuzungsverschiebung kippt Fall und Bits", () => {
  // One condition A from raw, outcome already fuzzy
  const caseLabels = ["c1", "c2", "c3"];
  const valuesByColumn = {
    A: [10, 50, 90],
    Y: [0.2, 0.8, 0.9],
  };

  const base: AnchorVariant = {
    id: "base",
    label: "base",
    thresholdsByCondition: { A: [0, 40, 100] },
    methodsByCondition: { A: "direct" },
  };

  // Push crossover above 50 → c2 should move from in toward out
  const alt: AnchorVariant = {
    id: "cross_up",
    label: "crossover +20",
    thresholdsByCondition: { A: [0, 60, 100] },
    methodsByCondition: { A: "direct" },
  };

  const mBase = calibrateDirect(50, 0, 40, 100);
  const mAlt = calibrateDirect(50, 0, 60, 100);
  assert.ok(mBase > 0.5, `base membership of 50 should be >0.5, got ${mBase}`);
  assert.ok(mAlt < 0.5, `alt membership of 50 should be <0.5, got ${mAlt}`);

  const results = runCalibrationSensitivity({
    caseLabels,
    valuesByColumn,
    calibrateColumns: ["A"],
    base,
    variants: [alt],
    conditions: ["A"],
    outcome: "Y",
    freqCut: 1,
    consCut: 0.8,
  });

  assert.equal(results.length, 1);
  const r = results[0];
  const c2Flip = r.flips.find((f) => f.caseLabel === "c2" && f.condition === "A");
  assert.ok(c2Flip, "expected membership change for c2/A");
  assert.equal(c2Flip.crossedHalf, true);
  assert.ok(
    r.truthTableRowChanges.some((t) => t.caseLabel === "c2"),
    "expected truth-table bit change for c2",
  );
});
test("runCalibrationSensitivity: zugewiesene Memberships bleiben bei invertiertem Set unverändert", () => {
  const base: AnchorVariant = {
    id: "base",
    label: "base",
    thresholdsByCondition: { A: [0, 50, 100] },
    methodsByCondition: { A: "direct" },
    highIsMembershipByCondition: { A: true, B: false },
    missingByCondition: { A: "NaN", B: 0 },
  };
  const alt: AnchorVariant = {
    id: "alt",
    label: "alternative",
    thresholdsByCondition: { A: [0, 60, 100] },
    methodsByCondition: { A: "direct" },
    highIsMembershipByCondition: { A: true, B: false },
    missingByCondition: { A: "NaN", B: 1 },
  };

  const [result] = runCalibrationSensitivity({
    caseLabels: ["missing-b"],
    valuesByColumn: { A: [20], B: [NaN], Y: [0.8] },
    calibrateColumns: ["A"],
    base,
    variants: [alt],
    conditions: ["A", "B"],
    outcome: "Y",
    freqCut: 1,
    consCut: 0.8,
  });
  const flip = result.flips.find((item) => item.condition === "B");
  assert.ok(flip);
  assert.equal(flip.baseMembership, 0);
  assert.equal(flip.variantMembership, 1);
});

test("runCalibrationSensitivity: leere Varianten → []", () => {
  const out = runCalibrationSensitivity({
    caseLabels: ["a"],
    valuesByColumn: { A: [1], Y: [1] },
    calibrateColumns: [],
    base: {
      id: "b",
      label: "b",
      thresholdsByCondition: {},
      methodsByCondition: {},
    },
    variants: [],
    conditions: ["A"],
    outcome: "Y",
    freqCut: 1,
    consCut: 1,
  });
  assert.deepEqual(out, []);
});
