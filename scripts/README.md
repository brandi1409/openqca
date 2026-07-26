# scripts/ — Prüf- und Validierungsskripte

Fünf Skripte, jedes mit einem eigenen Zweck. Alle laufen aus dem
**Repository-Wurzelverzeichnis** mit **Node ≥ 22.18** (ab dieser Version führt Node
TypeScript ohne Zusatz-Flag aus; die Skripte importieren die Engine-Quellen direkt,
ohne Build-Schritt).

Die ersten vier plus Lint und Produktions-Build laufen mit `npm run verify` —
dieselbe Kette wie in CI. Die Paketprüfung läuft separat, weil sie ein Tarball baut
und installiert.

| Skript | Zweck | Braucht R? |
|---|---|---|
| `reference-check.mjs` | Interne Regressionsprüfung: dokumentierte Ragin-Fixpunkte, Truth-Table-Aufbau, Lösungsformeln und Kennzahlen der Beispieldatensätze | nein |
| `cross-validate.mjs` | **Externe** Kreuzvalidierung der Lösungslogik gegen das R-Paket `QCA` | nein (liest eingechecktes Orakel) |
| `calibrate-cross-validate.mjs` | **Externe** Kreuzvalidierung der Kalibrierung gegen `QCA::calibrate()` | nein (liest eingechecktes Orakel) |
| `performance-benchmark.mjs` | Laufzeitmessung des Truth-Table-Pfads über wachsende Bedingungs-/Fallzahlen | nein |
| `check-engine-package.mjs` | Packt `@openqca/engine`, installiert das Tarball in ein leeres Projekt und ruft die Funktionen auf — ein durchlaufendes `npm pack` beweist nicht, dass ein Paket benutzbar ist | nein |

## Die R-Orakel

Unter `r-oracle/` liegen die Skripte, die die **Referenzwerte erzeugen**. Sie brauchen R
und das Paket `QCA`; ihre Ausgabe (`expected.json`, `calibrate-expected.json`) ist
eingecheckt, damit die Prüfung überall ohne R läuft.

```sh
# einmalig
Rscript -e 'install.packages("QCA", repos="https://cloud.r-project.org")'

Rscript scripts/r-oracle/oracle.R             # Lösungs-Szenarien
Rscript scripts/r-oracle/calibrate-oracle.R   # Kalibrierungs-Prüfgitter
Rscript scripts/r-oracle/lipset-export.R      # optionale Lipset-Referenzdaten (s. u.)
```

**Lipset.** Die kanonischen Lipset-Daten liegen im R-Paket `QCA`, das unter GPL (≥ 3)
steht — openQCA steht unter MIT. Sie werden deshalb **nicht** mitgeliefert, sondern lokal
nach `datasets/local/` erzeugt (gitignored). Fehlen sie, überspringt
`cross-validate.mjs` die drei Lipset-Szenarien sichtbar und wertet das nicht als
Fehlschlag.

## Zwei eingebaute Wächter

`cross-validate.mjs` enthält zwei Mechanismen, die verhindern sollen, dass Prüfungen
stillschweigend ihren Sinn verlieren:

1. **`KNOWN_DIVERGENCES`** — dokumentierte, noch nicht verstandene Abweichungen von der
   Referenz. Sie werden bei jedem Lauf sichtbar gemeldet, und das Skript **schlägt fehl,
   sobald eine davon verschwindet** (dann ist der Eintrag zu entfernen und `VALIDATION.md`
   zu aktualisieren). Ein Eintrag darf nie hinzugefügt werden, um etwas grün zu bekommen —
   nur für Abweichungen, die in `VALIDATION.md` analysiert sind.
2. **Behauptungs-Prüfung** — die Zahlen, mit denen das Projekt öffentlich wirbt
   (`dict.ts`, `Landing.tsx`, `README.md`, `docs/ROADMAP.md`, `VALIDATION.md`), müssen dem
   tatsächlichen Validierungsergebnis entsprechen. Weichen sie ab, schlägt das Skript fehl.
   Werden optionale Szenarien übersprungen, setzt sich die Prüfung sichtbar aus, statt
   gegen eine Teilmenge zu vergleichen.

Beides folgt derselben Projektregel: **Erwartete Formeln, Toleranzen oder Orakel werden
nie geändert, damit eine Prüfung grün wird.**
