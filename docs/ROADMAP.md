# Roadmap: openQCA

Dieses Dokument beschreibt die priorisierten nächsten Schritte für openQCA. Es trennt lokal lösbare Produktarbeit von Validierungs-, Fach- und Eigentümeraufgaben. Prioritäten können sich ändern, Statusangaben müssen jedoch durch die dokumentierten Prüfungen gedeckt sein.

## Aktueller Stand

- Der kostenlose Analyse-Kern läuft local-first im Browser.
- Die Engine ist intern regressionsgetestet. `node scripts/reference-check.mjs` prüft dokumentierte Ragin-Beispiele und interne Snapshots.
- Die QCA-Lösungslogik ist in 12 Szenarien gegen das R-Paket `QCA` kreuzvalidiert: `node scripts/cross-validate.mjs`.
- Crisp-Kalibrierung und direkte Ragin-Kalibrierung sind gegen `QCA` geprüft. Die direkte Methode nutzt Ragins ±3-Logit-Fixpunkte; `QCA` verwendet abweichende dokumentierte Zielwerte um 0,05/0,95. Die Restabweichung ist kein Beleg für substantielle Kalibrierungsgültigkeit.
- `calibrateLinear` und `calibrateFourValue` sind im Rechenkern vorhanden, aber in diesem Projektstand nicht extern gegen eine unabhängige Referenz validiert.
- Die Web-App besitzt bereits Rohdatenimport, Rollenwahl, Set-Spezifikationen, Evidenzfelder, Fallprüfung, Anker-Sensitivität und Protokoll-Export. Die geführte Begründungskette wird mit dem ersten Meilenstein ausgebaut.

## P0: Raw-data-to-defensible-calibration

**In Umsetzung:** Ein zusammenhängender Ablauf führt für jede Bedingung und das Outcome von Rohwerten zu dokumentierten Set-Mitgliedschaften:

- Set-Konzept, Population, Einheit, Zeitraum, Richtung und substantielle Mitgliedschaftsdefinition.
- Bewusste Wahl zwischen direkter Fuzzy-, Crisp- und bereits kalibrierter Provenienz.
- Qualitative Fuzzy-Anker für vollständige Nichtmitgliedschaft, Crossover und vollständige Mitgliedschaft, beziehungsweise eine begründete Crisp-Grenze.
- Evidenz pro Entscheidung und Anker. Empirische Verteilungsdiagnostik bleibt ausdrücklich ein Hinweis, keine Begründung.
- Fallweise Rohwerte, Mitgliedschaften, 0,5-Seite, Grenzfälle, fehlende Werte und Ausnahmen.
- Sensitivität plausibler Ankeralternativen mit Änderungen an Mitgliedschaften, Truth-Table-Zeilen, Lösungen, Fit und Fallklassifikationen.
- Reproduzierbarer JSON-, Markdown- und R-Export einschließlich Methodenreferenzen und Einschränkungen.

Abnahmekriterium ist der Rohdatensatz `datasets/rohwerte-demokratie.csv` mit mindestens einer Crisp-Bedingung, zwei Fuzzy-Bedingungen und einem Fuzzy-Outcome. Ein grüner Test belegt die Implementierung des Ablaufs, nicht die substantielle Gültigkeit der Beispielanker.

## P0: Validierung und Anspruchshygiene

- R-`QCA`-Kreuzvalidierung für Engine-Lösungen und unterstützte Crisp/direkte Kalibrierungsfälle erhalten und reproduzierbar ausführen.
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

- Linear-, Vier-Werte- und Multi-Value-Methoden erst nach klarer UI-Semantik, eigener Evidenzführung und unabhängiger Validierung in den geführten Ablauf aufnehmen.
- Englische Methodikseite und englischer Bericht.
- Performance-Analyse für große Datensätze und gegebenenfalls Web Worker.
- Zeitreihen- und Panel-Ansätze zunächst als Machbarkeitsprüfung, nicht als stiller Standardfall.

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
