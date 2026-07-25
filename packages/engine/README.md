# @openqca/engine

Dependency-free TypeScript engine for **Qualitative Comparative Analysis (QCA)** —
calibration, truth tables, Quine–McCluskey minimization, consistency/coverage/PRI,
necessity analysis and robustness grids.

It is the computation core of [openQCA](https://openqca.vercel.app) and is published
separately so it can be used from any Node or browser project. No runtime dependencies.

```sh
npm install @openqca/engine
```

## Why you might want it

The engine is **cross-validated against the canonical R package `QCA`** (Adrian Dușa),
which serves as the reference oracle: solution formulas plus solution- and path-level fit
parameters at a tolerance of `1e-6`, across conservative, parsimonious and intermediate
(Enhanced Standard Analysis) solutions, a constructed model-ambiguity case, and Lipset's
classic interwar-democracy dataset.

What is externally validated and what is an internal regression snapshot is stated
precisely — including one open, analysed divergence in the selection of easy
counterfactuals for intermediate solutions. See
[`VALIDATION.md`](https://github.com/brandi1409/openqca/blob/main/VALIDATION.md) before
relying on any specific measure.

## Example

```js
import { calibrateDirect, buildTruthTable, complexSolution } from "@openqca/engine";

// Raw values → set membership via Ragin's direct method
// (anchors: full non-membership, crossover, full membership).
const membership = calibrateDirect(550, 400, 550, 900); // → 0.5 exactly at the crossover

const cases = [
  { label: "Belgium", values: { WEALTH: 0.99, EDUCATION: 0.98, SURVIVAL: 0.95 } },
  { label: "Austria", values: { WEALTH: 0.81, EDUCATION: 0.99, SURVIVAL: 0.05 } },
  // …
];

const tt = buildTruthTable({
  cases,
  conditions: ["WEALTH", "EDUCATION"],
  outcome: "SURVIVAL",
  freqCut: 1,
  consCut: 0.8,
});

const solution = complexSolution(tt, cases);
console.log(solution.models[0].paths.map((p) => p.expression).join(" + "));
```

## What it covers

| Area | Functions |
|---|---|
| Calibration | `calibrateDirect`, `calibrateLinear`, `calibrateCrisp`, `calibrateFourValue` |
| Truth table | `buildTruthTable` (frequency/consistency/PRI cutoffs, 0.5-membership handling) |
| Minimization | `primeImplicants`, `minimalCovers` (Quine–McCluskey with essential PIs) |
| Solutions | `complexSolution`, `parsimoniousSolution`, `intermediateSolution` |
| Measures | consistency, raw/unique coverage, PRI |
| Necessity | `necessityAnalysis` |
| Robustness | threshold grids over frequency, consistency and PRI |

Full API notes:
[`docs/engine-notes.md`](https://github.com/brandi1409/openqca/blob/main/docs/engine-notes.md).

## Scope and limits

The engine deliberately does **not** cover multi-value QCA (mvQCA) or temporal/panel QCA;
`calibrateFourValue` exists but is not externally validated. For those, use the R package
`QCA`. openQCA can export an equivalent R script, so the two are meant to be
interoperable rather than competing.

## License

MIT © John Brandauer. Part of the
[openQCA](https://github.com/brandi1409/openqca) project.
