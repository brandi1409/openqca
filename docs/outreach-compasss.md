# COMPASSS — Entwurf für die Ankündigung

**Nichts hiervon ist versendet.** Das entscheidest du, und du versendest es auch:
Eine Ankündigung an eine Fachgemeinschaft ist eine Äußerung in deinem Namen.

COMPASSS (COMPArative Methods for Systematic cross-caSe analySis) ist der zentrale
Verteilungskanal der QCA-Gemeinschaft: <https://compasss.org>. Drei Anlaufstellen:

1. **Software-Verzeichnis** — <https://compasss.org/software/>. Dort stehen fs/QCA,
   Tosmana, das R-Paket `QCA`, SetMethods, Kirq. Aufnahme läuft über eine Nachricht an
   die Betreiber der Seite.
2. **Mailingliste** — die Ankündigungsliste erreicht die aktiven Anwender direkt.
3. **Working-Paper-Serie** — für einen methodischen Beitrag, nicht für eine
   Werkzeugankündigung.

## Reihenfolge

Sinnvoll ist die Ankündigung **erst nach dem Zenodo-DOI** (siehe `RELEASING.md`).
Ohne zitierfähigen Bezeichner ist die erste Frage aus dieser Gemeinschaft absehbar —
und die Antwort „kommt noch" kostet den einzigen ersten Eindruck, den es gibt.

## Entwurf (englisch, für Verzeichnis und Liste)

> **Subject:** openQCA — an open-source, browser-based tool for QCA (calibration
> documentation, cross-validated against the R package `QCA`)
>
> Dear colleagues,
>
> I would like to introduce **openQCA**, an open-source (MIT) tool for Qualitative
> Comparative Analysis that runs entirely in the browser: <https://openqca.vercel.app>
> Source: <https://github.com/brandi1409/openqca>
>
> **What it does.** Calibration (direct, piecewise-linear, crisp), truth table
> construction, Quine–McCluskey minimization with conservative, parsimonious and
> intermediate (ESA) solutions, consistency, PRI and coverage, necessity analysis
> including disjunctions (SUIN) and relevance of necessity, case diagnostics per
> solution path following Schneider and Rohlfing, calibration sensitivity and a
> robustness grid. Interface and reports in English and German.
>
> **Why another tool.** Not to replace the R package — it covers more (mvQCA, tQCA)
> and openQCA does not try to compete on breadth. The focus is the step that is
> routinely underreported in published applications: **calibration**. For every set,
> openQCA records the substantive definition, the method, the anchors, the evidence
> behind each decision, a case-level review and a sensitivity analysis, and exports
> them as a JSON protocol and as an equivalent R script a reviewer can re-run.
>
> **On correctness.** The dependency-free TypeScript engine is cross-validated against
> the R package `QCA` across 25 scenarios, including Lipset's classic dataset; 23 are
> identical at a tolerance of 1e-6 for both solution formulas and fit measures.
> The two divergences concern the intermediate solution, share one analysed cause,
> and are documented openly in `VALIDATION.md` and as issue #1 rather than smoothed
> over. Calibration is cross-checked separately.
>
> Data never leaves the browser — there is no upload and no account requirement for
> the analysis itself.
>
> I would be glad to have openQCA considered for the software listing, and I welcome
> criticism of the implementation, particularly on the intermediate solution.
>
> With best regards,
> John Brandauer

## Was ich an deiner Stelle erwarten würde

Die ersten Rückfragen aus dieser Gemeinschaft betreffen erfahrungsgemäß:

- **die ESA-Abweichung** — sie offen zu nennen ist richtig und wird als Stärke gelesen,
  solange die Analyse dahinter sichtbar ist;
- **fehlende Verfahren** (mvQCA, tQCA, RF-Kennzahlen) — dafür gibt es die Lückenliste in
  `docs/ROADMAP.md`; sie zu verlinken ist besser, als die Frage abzuwarten;
- **Datenschutz und Persistenz** — die local-first-Antwort trägt, sollte aber die
  optionale Cloud-Speicherung erwähnen, statt sie zu verschweigen.
