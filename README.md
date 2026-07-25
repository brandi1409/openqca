# openQCA

[![CI](https://github.com/brandi1409/openqca/actions/workflows/ci.yml/badge.svg)](https://github.com/brandi1409/openqca/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Quelloffenes, reproduzierbares Werkzeug für **Qualitative Comparative Analysis (QCA)** — ein moderner Neubau von Ragins fs/QCA. Der Analysekern läuft local-first im Browser: Forschungsdaten verlassen das Gerät nicht.

**Live:** https://openqca.vercel.app · **Methodik & Formeln:** https://openqca.vercel.app/methodik

> *English:* openQCA is an open-source, local-first tool for Qualitative Comparative Analysis
> (calibration, truth tables, Quine–McCluskey minimization, necessity analysis, robustness).
> The solution engine is cross-validated against the R package `QCA` — see
> [`VALIDATION.md`](VALIDATION.md) for exactly which claims are externally validated and which
> are internal regression snapshots. Interface and reports are available in German and English;
> methodology documentation is in [`docs/qca-primer.en.md`](docs/qca-primer.en.md).

## Warum es das gibt

QCA scheitert in der Praxis selten an der Minimierung, sondern an der **Kalibrierung**: Wer nicht
begründen kann, warum ein Fall ab welchem Rohwert zu einer Menge gehört, hat kein verteidigungsfähiges
Ergebnis. openQCA führt deshalb den gesamten Weg von Rohdaten zu dokumentierten Set-Mitgliedschaften —
mit Evidenzfeldern je Entscheidung, fallweiser Prüfung, Anker-Sensitivität und einem Protokoll, das
die Analyse reproduzierbar macht.

## Schnellstart

```bash
npm install                     # Abhängigkeiten (Monorepo, npm workspaces)
npm run verify                  # vollständige Prüfkette (siehe unten)
npm run dev --workspace web     # Web-App auf http://localhost:3000
```

`npm run verify` führt nacheinander aus: Engine-Tests, Referenz-Suite, beide R-Kreuzvalidierungen,
Lint und den Produktions-Build — dieselben Gates, die auch in CI laufen.

## Ordnerstruktur

```
openqca/
├── packages/engine/   Rechenkern (TypeScript, ohne Abhängigkeiten)
├── apps/web/          Web-App (Next.js 16 + React 19) + Playwright-E2E-Suite
├── scripts/           Referenz-Suite, R-Orakel und Kreuzvalidierung, Benchmark
├── datasets/          Beispiel-Datensätze (synthetisch) + README
├── docs/              QCA-Primer (DE/EN), Qualitäts-Spezifikation, Roadmap, Übergabe
├── paper/             JOSS-Entwurf
└── legal/             Rechtstexte (Österreich) — ENTWÜRFE, juristisch zu prüfen
```

## Stand

- **Engine** (57 Tests): Kalibrierung (direkt, linear, crisp, Vier-Werte), Konsistenz/Coverage/PRI,
  Truth Table, Quine-McCluskey-Minimierung, komplexe + **intermediäre** (Enhanced Standard Analysis
  mit Richtungserwartungen) + sparsame Lösung, Notwendigkeitsanalyse inklusive **Disjunktionen (SUIN)**
  und **RoN**, **Fall-Diagnostik je Lösungspfad** (Schneider & Rohlfing), kombinierte Robustheitsraster.
- **Validierung:** Lösungslogik und Notwendigkeitsanalyse sind in **23 von 25 Szenarien gegen das
  R-Paket `QCA`** kreuzvalidiert (Formeln und Fit-Kennzahlen, Toleranz `1e-6`; Notwendigkeit inkl.
  Disjunktionen/SUIN und RoN gegen `superSubset`); die zwei Abweichungen — beide aus
  derselben ESA-Ursache, eine davon auf dem kanonischen Lipset-Datensatz — sind analysiert
  und offen dokumentiert.
  Crisp- und lineare Fuzzy-Kalibrierung stimmen
  ebenfalls mit `QCA` überein; die direkte Methode folgt Ragins ±3-Logit-Fixpunkten und weicht
  dokumentiert um < 0,01 von den R-Zielwerten ab. **Welche Zahl extern validiert und welche eine
  interne Regression ist, steht präzise in [`VALIDATION.md`](VALIDATION.md).**
- **Web-App:** geführter 6-Schritte-Ablauf — Import (CSV/XLSX), Variablen & Rollen, Kalibrier-Workbench
  (Set-Definition, Methodenwahl, Anker, Evidenz, Fallprüfung, Anker-Sensitivität), Notwendigkeit,
  Truth Table mit allen drei Lösungstypen, Robustheit und Analyse des negierten Outcomes (~Y).
  Exporte: Protokoll (JSON), Markdown, äquivalentes **R-Skript**, druckfähiger Bericht. DE/EN.
- **Qualitätssicherung:** 55 Playwright-E2E-Tests prüfen Flüsse, visuelle Integrität (Hell/Dunkel ×
  Desktop/Mobil) und Design-Konsistenz. Verbindliche Abnahmekriterien: [`docs/QUALITY-SPEC.md`](docs/QUALITY-SPEC.md).
- **Cloud (optional, abschaltbar):** Konto (Supabase Magic Link), Projekt-Speicherung, KI-Assistenten
  (Anthropic) und Zahlungen (Stripe) — vollständig im Code, aktiviert allein über Env-Variablen.
  Ohne Schlüssel läuft die App rein lokal.

**Bewusst offen** (mit Begründung in [`docs/ROADMAP.md`](docs/ROADMAP.md)): externe Validierung der
Vier-Werte-Kalibrierung (kein passendes Orakel im R-Paket), Zeitreihen-/Panel-QCA (Datenmodell fehlt),
Desktop-Build via Tauri (braucht Rust + Signierzertifikate), juristische Prüfung der `[PRÜFEN]`-Punkte
unter `legal/`, eigene Domain, Zenodo-DOI und JOSS-Einreichung.

## Was openQCA (noch) nicht kann

openQCA ist kein Ersatz für das R-Paket `QCA` (Dușa), sondern ein geführter, reproduzierbarer Weg
durch den Standardfall. Nicht abgedeckt sind unter anderem **mvQCA**, **temporale/Panel-QCA**, die
Robustness-Fit-Kennzahlen von Oana & Schneider (RF_incl/RF_cov/RF_case) und der volle Umfang der
Enhanced Standard Analysis — inklusive zweier dokumentierter ESA-Abweichungen gegenüber R. Die
vollständige Gegenüberstellung mit Status und R-Entsprechung steht in
[`docs/ROADMAP.md`](docs/ROADMAP.md), Abschnitt „Nicht abgedeckt gegenüber dem R-Paket `QCA`";
die Abweichungen sind in [`VALIDATION.md`](VALIDATION.md) analysiert.

## Änderungen

Nennenswerte Änderungen stehen im [`CHANGELOG.md`](CHANGELOG.md); offene Punkte werden als
[GitHub-Issues](https://github.com/brandi1409/openqca/issues) geführt.

## Mitmachen

Beiträge sind willkommen — siehe [`CONTRIBUTING.md`](CONTRIBUTING.md) und den
[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Für methodische Fragen gibt es eine eigene
Issue-Vorlage. Eine Regel gilt strikt: **Erwartete Formeln, Toleranzen oder R-Orakel werden nie
geändert, nur damit eine Prüfung grün wird** (siehe `docs/ROADMAP.md`, „Anspruchshygiene").

## Zitieren

Bitte [`CITATION.cff`](CITATION.cff) verwenden. Ein Manuskript-Entwurf für das
*Journal of Open Source Software* liegt unter [`paper/paper.md`](paper/paper.md).

## Lizenz

MIT (siehe [`LICENSE`](LICENSE)). Die Rechtstexte unter `legal/` sind unverbindliche Entwürfe nach
österreichischem Recht und vor produktiver Nutzung juristisch zu prüfen.
