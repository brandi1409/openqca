#!/usr/bin/env node
// =============================================================================
// Calibration cross-check: openQCA engine vs R package QCA oracle JSON.
// Exit: 0 pass | 1 fail | 2 oracle missing
// =============================================================================

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { calibrateDirect, calibrateCrisp } from "../packages/engine/src/index.ts";

const NUM_TOL = 1e-6;
// Ragin (2008) logistic uses log-odds ±3 at full-in/out anchors → ≈0.0474 / 0.9526.
// R QCA::calibrate(..., logistic=TRUE) uses ≈0.05 / 0.95 at those anchors.
// Crisp must match exactly. Direct is reported with documented residual when exceeded.
const DIRECT_DOCUMENTED_MAX_ABS_DIFF = 0.01;

const expectedPath = fileURLToPath(
  new URL("r-oracle/calibrate-expected.json", import.meta.url),
);

function numEq(a, b, tol = NUM_TOL) {
  return Math.abs(a - b) <= tol;
}

async function main() {
  if (!existsSync(expectedPath)) {
    console.error("FAIL: calibrate-expected.json fehlt — Rscript scripts/r-oracle/calibrate-oracle.R");
    process.exit(2);
  }

  const expected = JSON.parse(await readFile(expectedPath, "utf8"));
  let failed = 0;
  const notes = [];

  console.log(`R QCA package version (oracle): ${expected.qcaPackageVersion ?? "?"}`);
  console.log("\n--- Crisp (must match within 1e-6) ---");
  const crispX = expected.crisp.x;
  const crispExp = expected.crisp.membership;
  const thr = expected.crisp.threshold;
  for (let i = 0; i < crispX.length; i++) {
    const got = calibrateCrisp(crispX[i], thr);
    const exp = crispExp[i];
    const ok = numEq(got, exp);
    console.log(
      `${ok ? "PASS" : "FAIL"} crisp x=${crispX[i]} engine=${got} R=${exp}`,
    );
    if (!ok) failed += 1;
  }

  console.log("\n--- Direct logistic (Ragin engine vs R QCA) ---");
  const d = expected.directLogistic;
  const { e, c, i } = d.thresholds;
  let maxAbs = 0;
  for (let idx = 0; idx < d.x.length; idx++) {
    const x = d.x[idx];
    const got = calibrateDirect(x, e, c, i);
    const exp = d.membership[idx];
    const abs = Math.abs(got - exp);
    maxAbs = Math.max(maxAbs, abs);
    const tight = numEq(got, exp);
    const withinDoc = abs <= DIRECT_DOCUMENTED_MAX_ABS_DIFF;
    const tag = tight ? "PASS" : withinDoc ? "PASS(doc-residual)" : "FAIL";
    console.log(
      `${tag} direct x=${x} engine=${got.toFixed(6)} R=${Number(exp).toFixed(6)} |Δ|=${abs.toExponential(3)}`,
    );
    if (!withinDoc) failed += 1;
  }
  notes.push(
    `Max |engine−R| on direct logistic grid: ${maxAbs}. ` +
      `Engine implements Ragin log-odds ±3 fixed points (≈0.0474/0.9526); ` +
      `R QCA logistic targets ≈0.05/0.95 at anchors. Residual ≤ ${DIRECT_DOCUMENTED_MAX_ABS_DIFF} is accepted and documented.`,
  );

  // Internal Ragin fixed-point invariants (not R-dependent)
  console.log("\n--- Ragin fixed-point invariants (engine) ---");
  const fp = [
    [e, 1 / (1 + Math.exp(3))],
    [c, 0.5],
    [i, 1 / (1 + Math.exp(-3))],
  ];
  for (const [x, exp] of fp) {
    const got = calibrateDirect(x, e, c, i);
    const ok = numEq(got, exp, 1e-9);
    console.log(`${ok ? "PASS" : "FAIL"} fixed point x=${x} got=${got} exp=${exp}`);
    if (!ok) failed += 1;
  }

  for (const n of notes) console.log(`\nNOTE: ${n}`);

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("\nAll calibration cross-checks passed (with documented direct residual policy).");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
