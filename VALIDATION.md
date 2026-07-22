# Validierung des QCA-Rechenkerns

Die eigenständige Referenz-Suite wird aus dem Repository-Wurzelverzeichnis mit
Node.js 26 ausgeführt:

```sh
node scripts/reference-check.mjs
```

Das Skript importiert die TypeScript-Quellen des Rechenkerns direkt und benötigt
keinen Build-Schritt. Es liest die drei CSV-Dateien unter `datasets/`; die bereits
kalibrierten Crisp- und Fuzzy-Daten werden unmittelbar als QCA-Fälle verwendet.

## Was geprüft wird

- dokumentierte Fixpunkte und ein dokumentiertes Beispiel der direkten
  Kalibrierung (`calibrateDirect`), jeweils mit einer Toleranz von ±0,01;
- vollständiger Aufbau der Truth Tables und eindeutige Zuordnung aller Fälle;
- Berechnung der komplexen und sparsamen Lösung für beide kalibrierten
  Beispieldatensätze;
- dokumentierte komplexe und sparsame Lösungsformeln;
- dokumentierte Kennzahlen der sparsamen Lösungen mit ±0,01:
  - Crisp, `freqCut = 1`, `consCut = 1,00`:
    `FOERDERUNG*TEAM + MARKT*~KONKURRENZ`, Coverage 1,00 und Konsistenz 1,00;
  - Fuzzy, `freqCut = 1`, `consCut = 0,85`:
    `STAATSKAPAZITAET + WOHLSTAND*BILDUNG`, Coverage ungefähr 0,95 und
    Konsistenz ungefähr 0,99;
- Berechnung der Notwendigkeitsanalyse für jede Bedingung und ihre Negation.

Die aktuellen Kennzahlen der komplexen Lösungen sowie die Werte der
Notwendigkeitsanalysen sind im Skript als **interne Regressions-Snapshots**
festgehalten. Sie stammen aus der gegenwärtigen Engine-Ausgabe und werden nicht
als extern validierte Referenzwerte ausgegeben.

## Cross-Validierung gegen R (QCA-Paket)

Der intermediäre Rechenkern (Enhanced Standard Analysis nach Ragin & Sonnett
2005; Schneider & Wagemann 2012, Kap. 8; Dușa 2019) wird **direkt gegen das
kanonische R-Paket `QCA`** (Adrian Dușa) kreuzvalidiert. Das R-Paket dient als
unabhängiges Orakel; seine Ausgaben sind die verbindliche Referenz.

### Was verglichen wird

Für die beiden bereits kalibrierten Datensätze `datasets/fuzzy-sets-beispiel.csv`
(`incl.cut = 0,85`, `n.cut = 1`) und `datasets/crisp-sets-beispiel.csv`
(`incl.cut = 1`, `n.cut = 1`) werden je Szenario verglichen:

- die **konservative** (`include = ""`), **sparsame** (`include = "?"`) und
  **intermediäre** Lösung (`include = "?"` mit `dir.exp`) — letztere in mehreren
  Richtungserwartungs-Varianten: alle `present`, alle `absent`, gemischt und mit
  „either" (`"-"` in `dir.exp`);
- pro Modell die **Lösungsformeln** (auf gemeinsame Notation `~X*Y` normalisiert,
  Literale alphabetisch und Terme sortiert);
- die Kennzahlen **inclS** und **covS** je Modell sowie **incl**, **cov** und
  **covU** je Pfad, verglichen mit Toleranz `1e-6`.

Insgesamt 12 Szenarien (2 Datensätze × {konservativ, sparsam, 4 intermediäre
Varianten}).

### Ausführen

```sh
# einmalig: R-Paket installieren (nicht vom Skript erzwungen)
Rscript -e 'install.packages(c("QCA"), repos="https://cloud.r-project.org")'

# 1) R-Orakel erzeugen → scripts/r-oracle/expected.json
Rscript scripts/r-oracle/oracle.R

# 2) Engine gegen das Orakel prüfen (Exit 0 = alle PASS, 1 = FAIL, 2 = Orakel fehlt)
node scripts/cross-validate.mjs
```

Das JSON-Orakel `scripts/r-oracle/expected.json` ist eingecheckt, sodass
`node scripts/cross-validate.mjs` auch ohne installiertes R läuft. Fehlt das
Orakel, meldet das Skript dies und beendet mit Exit-Code 2.

### Status

**Alle 12 Szenarien PASS** (Engine == R-Paket QCA, Formeln und Kennzahlen).

### Kanonik-Hinweis: Semantik von „either"/fehlender Erwartung

Die Cross-Validierung hat die kanonische ESA-Regel bestätigt und präzisiert: Ein
konservatives Literal wird **nur dann** als „easy counterfactual" entfernt, wenn
die Richtungserwartung seine **strikte Gegenpolarität** hat. Eine „either"- bzw.
fehlende Erwartung (`"-"` in `dir.exp`) **erhält** das Literal (difficult
counterfactual). Insbesondere gilt kanonisch: *alle „either" ⇒ intermediär ==
konservativ*. Eine frühere Näherung im Rechenkern behandelte „either" umgekehrt
(als „entfernen") und wurde durch die kanonische, R-validierte Konstruktion
ersetzt (`packages/engine/src/solutions.ts`, `intermediateSolution`).

## Kalibrierungs-Kreuzvalidierung

Drei getrennte Evidenzebenen:

1. **Ragin-Fixpunkte (Implementierungsverifikation):** `calibrateDirect` bildet den
   Kreuzungspunkt exakt auf 0,5 und die Anker auf \(1/(1+e^{\pm 3})\) ≈ 0,0474 / 0,9526
   ab. Geprüft in `packages/engine/test/engine.test.ts` und
   `node scripts/reference-check.mjs` (inkl. dokumentiertem BIP-Beispiel 300/600/1000).
2. **R-Paket QCA (externe Gegenüberstellung):**
   ```sh
   Rscript scripts/r-oracle/calibrate-oracle.R   # schreibt calibrate-expected.json
   node scripts/calibrate-cross-validate.mjs
   ```
   Crisp-Kalibrierung muss exakt übereinstimmen (Toleranz `1e-6`). Die logistische
   Direktmethode im R-Paket zielt an den Ankern auf ≈ 0,05 / 0,95; openQCA folgt
   Ragin mit ≈ 0,0474 / 0,9526. Die Differenz auf dem Prüfgitter bleibt unter 0,01
   und wird als **dokumentiertes Residual** akzeptiert — die Engine wird nicht an
   R angepasst, und das Orakel wird nicht „zurechtgebogen“.
3. **Noch nicht extern validiert:** `calibrateLinear`, `calibrateFourValue`.

Substantive Gültigkeit von Ankern und Robustheit gegenüber Ankerwahl sind
Forschungsurteile bzw. Sensitivitätsanalysen — keine reine Implementierungsfrage.


## Aussagegrenze

Die Kalibrierungs- und Notwendigkeits-Kennzahlen sowie die Kennzahlen der
komplexen Lösungen in `scripts/reference-check.mjs` sind weiterhin **interne
Regressions-Snapshots** (nicht extern validiert). Die **intermediäre Lösung**
sowie konservative/sparsame Lösungsformeln und deren Fit-Parameter sind dagegen
über `scripts/cross-validate.mjs` gegen das R-Paket QCA extern kreuzvalidiert.
Eine Erweiterung auf weitere Datensätze und auf fsQCA 4.1 als zweites Orakel
bleibt möglich.
