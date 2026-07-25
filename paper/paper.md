---
title: "openQCA: A modern, reproducible, browser-based tool for Qualitative Comparative Analysis"
tags:
  - Qualitative Comparative Analysis
  - QCA
  - fsQCA
  - fuzzy sets
  - set-theoretic methods
  - social science methods
  - reproducible research
  - TypeScript
authors:
  - name: "John Brandauer"
    affiliation: 1
    corresponding: true
affiliations:
  - name: "Independent researcher, Eberndorf, Austria"
    index: 1
date: "24 July 2026"
bibliography: paper.bib
---

# Summary

`openQCA` is an open-source, reproducible tool for **Qualitative Comparative
Analysis (QCA)**, a set-theoretic method that identifies combinations of
conditions that are sufficient or necessary for an outcome across small- and
medium-N samples [@ragin2008; @schneider2012]. It is a modern reimplementation
of the analytical workflow made popular by Ragin's *fs/QCA* software.

The software is organised as a monorepo. A dependency-free TypeScript
computation core (`packages/engine`) implements the full analytical pipeline —
calibration of raw data into set-membership scores, truth table construction,
Boolean minimization via the Quine–McCluskey algorithm [@mccluskey1956],
consistency and coverage measures, and necessity analysis. A guided web
application (`apps/web`, Next.js/React) exposes this pipeline through a
step-by-step interface that runs **local-first in the browser**: in the free
tier, research data never leaves the user's device. Every analysis can be
exported as a machine-readable reproducibility protocol, including a generated
R script, so that results can be re-run and independently checked.

# Statement of need

QCA is widely used across political science, sociology, management, and public
health, but the established tooling presents a reproducibility and usability
gap. On one side, the classic graphical program *fs/QCA* is dated, closed, and
platform-bound, and its point-and-click workflow is difficult to reproduce or
audit. On the other side, the powerful R package `QCA` [@dusa2019] and related
packages such as `SetMethods` [@oana2018] offer rigor and flexibility but
require comfort with the R command line, which is a barrier for many applied
researchers and for teaching.

`openQCA` targets the space between these options: a **modern, reproducible,
guided graphical interface** that lowers the barrier to entry without hiding the
methodological decisions that QCA requires. It makes calibration choices,
frequency and consistency thresholds, and the handling of logical remainders
explicit and adjustable, and it records them in an exportable protocol so that
an analysis is transparent and repeatable by others. Because the free tier is
local-first, it is suitable for sensitive research data and for classroom use
without server infrastructure. The dependency-free core is separately testable
and reusable, enabling cross-validation against reference implementations.

# Functionality

`openQCA` implements the standard fuzzy- and crisp-set QCA workflow:

- **Calibration.** Transformation of raw values into set-membership scores in
  the interval [0, 1], including direct calibration via anchors (full
  non-membership, crossover, full membership), linear calibration, crisp
  thresholds, and a four-value scheme [@ragin2008; @thiem2013].
- **Truth table.** Construction of the truth table over the configurations of
  conditions, with unambiguous assignment of every case to a row.
- **Boolean minimization.** Logical reduction of the outcome-consistent rows
  using the Quine–McCluskey algorithm [@mccluskey1956], producing both the
  **complex** solution and the **parsimonious** solution (which incorporates
  logical remainders), as well as the **intermediate** solution derived under
  Enhanced Standard Analysis with directional expectations
  [@ragin2005; @schneider2012].
- **Consistency and coverage.** Set-theoretic measures of the strength and
  empirical relevance of sufficiency relations, including consistency, raw and
  unique coverage, and PRI (proportional reduction in inconsistency)
  [@schneider2012].
- **Necessity analysis.** Assessment of individual conditions and their
  negations as necessary for the outcome, with the corresponding consistency
  and coverage of necessity.
- **Guided calibration with provenance.** A workbench that records, per set,
  the substantive definition, the chosen method, the qualitative anchors, the
  evidence behind each decision (with citation fields), a case-level review, and
  a sensitivity analysis over plausible alternative anchors. Results compute as
  soon as the calibration is computable; the documentation is what makes them
  publication-ready and unlocks the replication artefacts.
- **Robustness and negated outcome.** A combined grid over frequency,
  consistency, and PRI thresholds reporting stable and unstable solution terms,
  and a separate analysis of the negated outcome (~Y) [@schneider2012].
- **Reproducibility protocol.** Export of the full analysis — data,
  calibration settings, thresholds, and results — as a JSON protocol together
  with a generated R script, so that the analysis can be re-run and verified.

The computation core is cross-validated against the canonical R package `QCA`
[@dusa2019], which serves as the reference oracle. An R script generates
expected solutions, and a comparison script checks the engine against them:
solution formulas plus solution- and path-level fit parameters (`inclS`,
`covS`, `incl`, `cov`, `covU`) at a tolerance of `1e-6`. The comparison covers
conservative, parsimonious, and intermediate (Enhanced Standard Analysis)
solutions under several directional-expectation settings, a constructed
model-ambiguity case, and Lipset's classic interwar-democracy dataset
[@lipset1959] in the form distributed with the R package. Conservative and
parsimonious solutions match the reference exactly on all scenarios, including
the Lipset case; two intermediate-solution scenarios diverge from a single,
documented cause in the selection of easy counterfactuals.

The project deliberately separates what is *externally validated* from what is
an *internal regression snapshot*: PRI is not externally validated, calibration
has its own separate evidence chain with a documented residual below 0.01 for
the direct method, and necessity measures remain internal snapshots. All of
this — including the open divergence and its analysed cause — is stated in the
repository's validation document rather than implied by a summary claim. A
build-time check binds the numbers used in the project's public
self-description to the actual result of the validation run, so that a claim
cannot silently drift away from what the software does.

# Comparison to related software

- ***fs/QCA*** (Ragin and colleagues): the historically dominant graphical
  tool. `openQCA` covers the same core workflow but is open-source,
  cross-platform (browser-based), and designed around an explicit, exportable
  reproducibility protocol.
- **R package `QCA`** [@dusa2019] and **`SetMethods`** [@oana2018]: mature,
  comprehensive, and actively maintained, but command-line oriented.
  `openQCA` complements them with a guided GUI and can export an R script,
  positioning the two as interoperable rather than competing.
- **Tosmana** [@cronqvist2019]: a graphical tool with a focus on crisp-set and
  multi-value QCA (mvQCA). `openQCA` focuses on the crisp/fuzzy-set workflow
  with an emphasis on reproducibility and a browser-based, local-first design.

# References
