# Roadmap: openQCA

Dieses Dokument beschreibt die priorisierten nächsten Schritte für openQCA. Es trennt lokal lösbare Produktarbeit von Validierungs-, Fach- und Eigentümeraufgaben. Prioritäten können sich ändern, Statusangaben müssen jedoch durch die dokumentierten Prüfungen gedeckt sein.

## Aktueller Stand

- Der kostenlose Analyse-Kern läuft local-first im Browser.
- Die Engine ist intern regressionsgetestet. `node scripts/reference-check.mjs` prüft dokumentierte Ragin-Beispiele und interne Snapshots.
- Die QCA-Lösungslogik ist in 12 Szenarien gegen das R-Paket `QCA` kreuzvalidiert: `node scripts/cross-validate.mjs`.
- Crisp-, direkte Ragin- und lineare Fuzzy-Kalibrierung sind gegen `QCA` geprüft. Die direkte Methode nutzt Ragins ±3-Logit-Fixpunkte; `QCA` verwendet abweichende dokumentierte Zielwerte um 0,05/0,95. Die Restabweichung ist kein Beleg für substantielle Kalibrierungsgültigkeit.
- `calibrateLinear` stimmt auf einem unabhängigen `QCA::calibrate(logistic = FALSE)`-Prüfgitter überein; `calibrateFourValue` bleibt im Rechenkern vorhanden, aber noch nicht extern validiert.
- Die Web-App besitzt Rohdatenimport, Rollenwahl, Set-Spezifikationen, Evidenzfelder, Fallprüfung, Anker-Sensitivität und Protokoll-Export. Der erste Rohdaten-zu-Kalibrierungs-Vertikalschnitt ist für Crisp-, direkte und lineare Fuzzy-Sets implementiert; die lokale Implementierung ist durch Engine-, R-Oracle- und E2E-Prüfungen belegt. Die inhaltliche Gültigkeit konkreter Nutzeranker bleibt eine Forschungsentscheidung.

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

Nach dem ersten Meilenstein: methodisch begründete gemeinsame Varianten von Kalibrierungsankern sowie Frequency-, Consistency- und PRI-Entscheidungen. Berichtet werden sollen Sensitivitätsbereiche, stabile und instabile Lösungsterme, Fit-Änderungen sowie robuste, mögliche und fallbezogen wechselnde Klassifikationen. Grundlage ist das Robustness-Test-Protokoll von Oana und Schneider:
https://doi.org/10.1177/00491241211036158

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
