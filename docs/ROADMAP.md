# Roadmap: openQCA

Dieses Dokument beschreibt die priorisierten nächsten Schritte für openQCA. Es trennt lokal lösbare Produktarbeit von Validierungs-, Fach- und Eigentümeraufgaben. Prioritäten können sich ändern, Statusangaben müssen jedoch durch die dokumentierten Prüfungen gedeckt sein.

## Aktueller Stand

- Der kostenlose Analyse-Kern läuft local-first im Browser.
- Die Engine ist intern regressionsgetestet. `node scripts/reference-check.mjs` prüft dokumentierte Ragin-Beispiele und interne Snapshots.
- Lösungslogik und Notwendigkeitsanalyse sind in 25 Szenarien gegen das R-Paket `QCA` kreuzvalidiert: `node scripts/cross-validate.mjs` (23 von 25 Szenarien PASS, zwei dokumentierte Abweichungen derselben ESA-Ursache — siehe `VALIDATION.md`). Davon prüfen sechs Szenarien die Notwendigkeit von Konjunktionen und Disjunktionen (SUIN) samt RoN gegen `superSubset`.
- Crisp-, direkte Ragin- und lineare Fuzzy-Kalibrierung sind gegen `QCA` geprüft. Die direkte Methode nutzt Ragins ±3-Logit-Fixpunkte; `QCA` verwendet abweichende dokumentierte Zielwerte um 0,05/0,95. Die Restabweichung ist kein Beleg für substantielle Kalibrierungsgültigkeit.
- `calibrateLinear` stimmt auf einem unabhängigen `QCA::calibrate(logistic = FALSE)`-Prüfgitter überein; `calibrateFourValue` bleibt im Rechenkern vorhanden, aber noch nicht extern validiert.
- Die Web-App ist ein fünfteiliger Forschungsarbeitsraum: Antwort, Forschungsdesign, Entscheidungen,
  Evidenz und Prüfpaket. CSV/XLSX-Import, explizites Resume, Research Brief, priorisierter Decision
  Ledger, fallbasierte Antwort, progressive Engine-Evidenz und ein gemeinsames Defense-Gate sind
  implementiert und E2E-geprüft. Der Rohdaten-zu-Kalibrierungs-Vertikalschnitt unterstützt Crisp-,
  direkte und lineare Fuzzy-Sets; die inhaltliche Gültigkeit konkreter Nutzeranker bleibt eine
  Forschungsentscheidung.

## P0: Raw-data-to-defensible-calibration

**Lokal umgesetzt:** Ein zusammenhängender Ablauf führt für jede Bedingung und das Outcome von Rohwerten zu dokumentierten Set-Mitgliedschaften:

- Set-Konzept, Population, Einheit, Zeitraum, Richtung und substantielle Mitgliedschaftsdefinition.
- Bewusste Wahl zwischen direkter Fuzzy-, Crisp- und bereits kalibrierter Provenienz.
- Qualitative Fuzzy-Anker für vollständige Nichtmitgliedschaft, Crossover und vollständige Mitgliedschaft, beziehungsweise eine begründete Crisp-Grenze.
- Evidenz pro Entscheidung und Anker. Empirische Verteilungsdiagnostik bleibt ausdrücklich ein Hinweis, keine Begründung.
- Fallweise Rohwerte, Mitgliedschaften, 0,5-Seite, Grenzfälle, fehlende Werte und Ausnahmen.
- Sensitivität plausibler Ankeralternativen mit Änderungen an Mitgliedschaften, Truth-Table-Zeilen, Lösungen, Fit und Fallklassifikationen.
- Reproduzierbarer JSON-, Markdown- und R-Export einschließlich Methodenreferenzen und Einschränkungen.

Abnahmekriterium ist der Rohdatensatz `datasets/rohwerte-demokratie.csv` mit mindestens einer Crisp-Bedingung, einer direkten oder linearen Fuzzy-Bedingung und einem direkten Fuzzy-Outcome. Ein grüner Test belegt die Implementierung des Ablaufs, nicht die substantielle Gültigkeit der Beispielanker.

## P0: Validierung und Anspruchshygiene

- R-`QCA`-Kreuzvalidierung für Engine-Lösungen und unterstützte Crisp-, direkte und lineare Kalibrierungsfälle erhalten und reproduzierbar ausführen.
- Interne Regression-Snapshots nicht als externe Validierung bezeichnen.
- Keine erwarteten Formeln, Toleranzen, Fixtures oder R-Orakel ändern, nur damit eine Prüfung grün wird.
- Die Gültigkeit eines Sets bleibt eine begründete Forschungsentscheidung der Nutzerin oder des Nutzers.

## P1: Kombinierte Robustheit

Umgesetzt ist ein **Raster-Sweep** (`packages/engine/src/robustness.ts`,
`runCombinedRobustnessGrid`): Über das Kreuzprodukt aus dokumentierten
Kalibrierungsszenarien und Frequency-, Consistency- und PRI-Cutoffs wird je Zelle die
komplexe, intermediäre und sparsame Lösung neu gerechnet. Berichtet werden der Anteil
der Zellen mit identischem Lösungsausdruck (stabil/variabel) und die Fälle, deren
Truth-Table-Zuordnung oder Outcome-Seite gegenüber der Basiszelle wechselt.

**Ehrlichkeitshinweis (korrigiert am 2026-07-25).** An dieser Stelle stand zuvor,
Grundlage sei das Robustness-Test-Protokoll von Oana & Schneider
(https://doi.org/10.1177/00491241211036158). Das ist **zurückgenommen**: Die dort
definierten Kennzahlen — **RF_incl**, **RF_cov** und **RF_case**, die
Anfangs- und Testlösung über deren Schnitt und Vereinigung ins Verhältnis setzen —
sind **nicht** implementiert. Das Raster beantwortet eine verwandte, aber andere
Frage: *Wie oft bleibt derselbe Lösungsausdruck stehen, wenn ich Anker und Cutoffs
variiere?* Es liefert Häufigkeitsanteile, keine Robustness-Fit-Maße, und ersetzt das
Protokoll nicht.

Offen bleibt damit: RF_incl/RF_cov/RF_case ergänzen. Voraussetzung dafür ist ein
externes Orakel — das R-Paket `SetMethods` (`robustness()`) — das in dieser Umgebung
**nicht installiert** ist. Ohne Kreuzvalidierung würden diese Kennzahlen gegen die
Projektregel verstoßen, nichts als validiert auszuweisen, was es nicht ist. Siehe auch
„Nicht abgedeckt gegenüber dem R-Paket QCA" weiter unten.

## P1: Lokale Projektdaten und Nachvollziehbarkeit

- Versioniertes lokales Projekt- und Exportformat.
- Vollständige Missing-Data-Provenienz und wiederholbare Rekonstruktion.
- Offline- und Datenschutzprüfungen für den kostenlosen Kern.
- Keine Uploads, Telemetrie oder Cloud-Abhängigkeiten im lokalen Analysepfad ohne ausdrückliche Freigabe.

## P2: Methodenerweiterung und Reichweite

- Vier-Werte- und Multi-Value-Methoden erst nach klarer UI-Semantik, eigener Evidenzführung und unabhängiger Validierung in den geführten Ablauf aufnehmen.
- Zeitreihen- und Panel-Ansätze zunächst als Machbarkeitsprüfung, nicht als stiller Standardfall.
- Die englische Methodikseite und die englische Berichtslokalisierung sind umgesetzt. Der fokussierte Rohdaten-/Bericht-Flow wird in `npm run test:e2e --workspace web -- --grep "A2.12"` geprüft.

### Performance-Evidenz (2026-07-22)

Reproduzierbarer Lauf: `npm run benchmark:performance` (Node `v22.23.1`,
Darwin arm64, Apple M4 Max, drei Messwiederholungen je Szenario).

| Szenario | Truth-Table-Zeilen | Fälle | Median |
|---|---:|---:|---:|
| 8 Bedingungen × 1.000 Fälle | 256 | 1.000 | 30 ms |
| 10 Bedingungen × 1.000 Fälle | 1.024 | 1.000 | 147 ms |
| 12 Bedingungen × 1.000 Fälle | 4.096 | 1.000 | 722 ms |
| 12 Bedingungen × 5.000 Fälle | 4.096 | 5.000 | 3.608 ms |

Die Messung deckt den vollständigen `buildTruthTable`-Pfad ab und prüft
Zeilenanzahl, Fallzahl und Fallzuordnung. Sie ist Node-/Hardware-Evidenz, kein
Browser-UX-Nachweis. Die Laufzeit wächst ungefähr mit
`2^Bedingungen × Fälle × Bedingungen`; bei 12 Bedingungen und 5.000 Fällen
liegt ein einzelner Lauf bereits im Sekundenbereich. Deshalb werden die
aktuellen Grenzen (maximal 12 Bedingungen, Robustheitsraster standardmäßig
5.000 Zellen) nicht stillschweigend angehoben. Vor höheren Grenzen, virtuellen
Falltabellen oder einer interaktiven Großdatenanalyse braucht es einen
Browser-Hauptthread-/Worker-Benchmark.

Import, Kalibrierung, Falltabellen und Minimierung laufen derzeit im
Browser-Hauptthread; Falltabellen werden vollständig gerendert. Der
`RawDataset`-Vertrag kennt nur Fälle und Spalten, keine Zeit- oder
Panel-Identität. Ein Worker/virtuelle Tabellen und ein Panel-Datenmodell
brauchen daher eigene Benchmarks und reproduzierbare Semantik; sie werden
nicht stillschweigend in den lokalen Analysepfad eingeschoben.

## Nicht abgedeckt gegenüber dem R-Paket `QCA`

Diese Liste ist Teil der Positionierung: openQCA ist kein Ersatz für das R-Paket `QCA`
(Dușa), sondern ein geführter, reproduzierbarer Weg durch den Standardfall. Wer eines
der folgenden Verfahren braucht, rechnet in R weiter. Stand: 2026-07-25.

| Lücke | Status in openQCA | R-Entsprechung |
|---|---|---|
| **mvQCA** (multi-value QCA) | nicht vorhanden. Truth Table und Minimierung sind auf binäre Zeilenbits festgelegt (`buildTruthTable`, `primeImplicants`); Vier-Werte-Kalibrierung existiert, ist aber nicht extern validiert und nicht in den Ablauf eingebunden | `truthTable(..., ...)` / `minimize()` mit mehrwertigen Bedingungen, `QCA::calibrate(type = "crisp")` mit mehreren Schwellen |
| **Temporale/Panel-QCA (TQCA)** | nicht vorhanden. Der `RawDataset`-Vertrag kennt nur Fälle und Spalten, keine Zeit- oder Panel-Identität — siehe „Dokumentierte externe und semantische Blocker" | keine kanonische Funktion im Paket; erfordert eigenes Datenmodell (lagged conditions, Aggregation) |
| **SUIN/Disjunktionen der Notwendigkeit** | **umgesetzt und R-kreuzvalidiert** (`necessarySupersets`, sechs `nec_*`-Szenarien). Deckungsgleich mit `superSubset` für Konjunktionen und minimale Disjunktionen inkl. RoN. Nicht abgedeckt: `relation = "sufficiency"`, `pri.cut`, mehrwertige Ausdrücke, `add`-Argument | `superSubset()` |
| **RoN** | **umgesetzt und R-kreuzvalidiert** — je Einzelbedingung und je Kombination | `superSubset()`-Spalte `RoN`, `pof(..., relation = "necessity")` |
| **XY-Plots für Lösungsterme** | **umgesetzt**: Der XY-Plot lässt Einzelbedingung, Lösungspfad und Gesamtlösung als X-Achse wählen (Term-Zugehörigkeit = Minimum über die Literale). Nicht abgedeckt: Notwendigkeits-Plots (X/Y vertauscht) und Plot-Export als Datensatz | `XYplot()` |
| **Enhanced Standard Analysis, voller Umfang** | teilweise. Die intermediäre Lösung ist implementiert und in 17 der 19 Lösungsmodell-Szenarien deckungsgleich; **zwei dokumentierte Abweichungen** derselben Ursache bestehen (die Engine behält Literale, die R als *easy counterfactual* entfernt) — Analyse und Reichweite in [`VALIDATION.md`](../VALIDATION.md), Abschnitt „Bekannte Abweichungen". Nicht abgedeckt: explizite Behandlung von *untenable assumptions* aus notwendigen Bedingungen, getrennte Ausweisung von `$EC`/`$DC`, `minimize(..., sol.type)`-Varianten | `minimize(..., include = "?", dir.exp = ...)`, `$i.sol[[k]]$EC` / `$DC` |
| **Robustness-Fit nach Oana & Schneider** (RF_incl, RF_cov, RF_case) | nicht vorhanden. openQCA rechnet ein Szenarien-/Cutoff-Raster und meldet Häufigkeitsanteile — siehe „P1: Kombinierte Robustheit" | `SetMethods::robustness()` (Paket in dieser Umgebung nicht installiert) |
| **PRI extern validiert** | Kennzahl vorhanden und intern getestet, aber gegen **kein** externes Orakel gestellt | `pof()`-Spalte `PRI` |
| **Vier-Werte-Kalibrierung extern validiert** | vorhanden, kein passendes Orakel — siehe Blocker unten | `QCA::calibrate()` liefert ordinale Codes, keine Mitgliedschaften |
| **Weitere Paketfunktionen** | nicht vorhanden: `Xplot`, `venn`/Set-Diagramme, `modelFit`, Bootstrap-Konfidenzintervalle (`QCAfit`), `causalChain`/`cna`-Brücke | dito im R-Ökosystem |

## Dokumentierte externe und semantische Blocker

- **Vier-Werte-Kalibrierung:** `calibrateFourValue` ist im Engine vorhanden,
  aber noch nicht extern validiert. Das installierte R-Paket `QCA::calibrate()`
  akzeptiert `type = "crisp"` oder `type = "fuzzy"`; mit drei Crisp-Schwellen
  erzeugt es die ordinalen Codes `0, 1, 2, 3`, nicht die Engine-Mitgliedschaften
  `0, 0.33, 0.67, 1`. Das ist kein unabhängiger numerischer Oracle für die
  aktuelle Funktion. Vor einer Aufnahme in den geführten Workflow braucht es
  eine dokumentierte Multi-Value-/Vier-Werte-Semantik, ein passendes externes
  Beispiel oder eine unabhängige Referenzimplementierung und eigene Tests.
- **Zeitreihen/Panel:** Der aktuelle `RawDataset`-Vertrag kennt nur Fälle und
  Spalten. Zeit-/Panel-Identität, Aggregation, lagged conditions, Einheiten und
  die zulässige Truth-Table-Zuordnung sind nicht definiert. Ein Panel darf
  deshalb nicht stillschweigend als gewöhnlicher Querschnitt importiert werden.
  Eine Erweiterung braucht zuerst ein Datenmodell, eine methodische Entscheidung
  über zeitliche QCA und reproduzierbare Testdaten.

## Eigentümer- oder Fachfreigabe erforderlich

Diese Punkte sind keine lokal lösbaren Fertig-Blocker für den kostenlosen Analyse-Kern:

- öffentliche Repository-Veröffentlichung, Domain, Zenodo-DOI und Release-Tags;
- Tauri-Signierung mit Apple- oder Windows-Zertifikaten;
- Supabase-, Stripe-, KI- und sonstige Produktionsschlüssel;
- Deployment und Änderung von Produktionsdaten;
- juristische Prüfung der Entwürfe unter `legal/`.

## Pflege

- Issue-Triage und Abhängigkeitsupdates regelmäßig dokumentieren.
- Jede neue öffentliche Behauptung zur Rechengenauigkeit mit einer unabhängigen Referenz oder als interne Regression kennzeichnen.
- Jede neue Kalibrierungsmethode mit Methodikquelle, fehlenden Validierungsgrenzen und einem reproduzierbaren Prüfpfad versehen.
