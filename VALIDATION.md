# Validierung des QCA-Rechenkerns

Die eigenständige Referenz-Suite wird aus dem Repository-Wurzelverzeichnis mit
Node.js ≥ 22.18 ausgeführt (ab dieser Version wird TypeScript
ohne Zusatz-Flag direkt ausgeführt; die Skripte importieren die Engine-Quellen):

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

### Was ausdrücklich NICHT Teil dieser 12 Szenarien ist

Damit keine Außendarstellung mehr behauptet, was hier nicht geprüft wird:

- **PRI** wird nirgends extern validiert. Die Kennzahl wird in Truth Table und
  Bericht ausgewiesen und ist durch interne Tests abgedeckt, aber nicht gegen
  ein externes Orakel gestellt.
- **Kalibrierung** ist nicht Teil dieser 12 Szenarien. Beide Datensätze gehen
  bereits kalibriert in den Vergleich. Die Kalibrierung hat ihre eigene, weiter
  unten beschriebene Evidenzkette (`scripts/calibrate-cross-validate.mjs`) —
  mit einer dokumentierten Restabweichung ≤ 0,01 bei der direkten Methode.
- **Notwendigkeitsanalyse** und die Kennzahlen der komplexen Lösungen in
  `scripts/reference-check.mjs` bleiben interne Regressions-Snapshots.

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

**15 von 16 Szenarien PASS** (Engine == R-Paket QCA, Formeln und Kennzahlen);
ein Szenario weicht dokumentiert ab, siehe „Bekannte Abweichungen" unten.

### Erweiterung um Modell-Ambiguität (2026-07-25)

Ein externes Code-Audit wies darauf hin, dass die ursprünglichen zwölf Szenarien
ausschließlich Fälle mit **einem** Lösungsmodell abdeckten. Die intermediäre Lösung ist
aber gerade dort heikel, wo ein konservativer Primimplikant von **mehreren** sparsamen
Primimplikanten subsumiert wird (Modell-Ambiguität). Dafür wurde
`datasets/modell-ambiguitaet.csv` konstruiert (9 Fälle, vier crisp Bedingungen,
Y = A·B + C·D mit Lücken): Die sparsame Lösung hat dort zwei Modelle
(`A*B + C*D` und `B*C + C*D`), R meldet zwei `i.sol`-Einträge (C1P1, C1P2).

Ergebnis der vier neuen Szenarien:

- `ambig_conservative`, `ambig_parsimonious`, `ambig_intermediate_all_present`: **PASS**.
  Insbesondere trifft die Engine die kanonische Modellbildung: Beide `i.sol`-Einträge
  liefern in R dieselbe intermediäre Lösung `C*D + A*B*C`; nach kanonischer
  Deduplizierung bleibt genau ein Modell — exakt die Ausgabe der Engine. Die
  ursprünglich vermutete „Verschmelzung mehrerer Subsumer zu einem falschen Modell"
  ist damit **widerlegt**.
- `ambig_intermediate_mixed`: **dokumentierte Abweichung**, siehe unten.

### Bekannte Abweichungen

**`ambig_intermediate_mixed` — ESA mit gemischten Richtungserwartungen.**
Mit `dir.exp = (A=1, B=0, C=1, D=0)` liefert R `C*D + A*B*C`, die Engine dagegen
`C*D + A*B*C*~D`. Der konservative Primimplikant ist `A*B*C*~D`; die Engine behält das
Literal `~D`, weil ihre Regel ein Literal nur bei **strikter Gegenpolarität** der
Erwartung entfernt (hier stimmen Literal `~D` und Erwartung „absent" überein). R stuft
den zugehörigen Remainder (`A*B*C*D`, Zeile 16) hingegen als *easy counterfactual* ein
und entfernt `~D`.

**Zweiter Fall, gefunden am 2026-07-25: der kanonische Lipset-Datensatz.**
Geprüft wurde `LF` aus dem R-Paket (Ragins Lehrbeispiel, 18 Fälle, `incl.cut = 0,8`,
`n.cut = 1`, alle Erwartungen „present"). Konservative und sparsame Lösung stimmen
**exakt** mit R überein; die intermediäre nicht:

| | Lösung |
|---|---|
| R (`i.sol[[1]]`) | `DEV*URB*LIT*STB + DEV*LIT*~IND*STB` |
| Engine | `DEV*URB*LIT*IND*STB + DEV*LIT*~IND*STB` |

Damit ist die Abweichung **kein Randfall mit exotischen Erwartungen**, sondern trifft
den Standardfall auf dem bekanntesten Datensatz des Fachs.

**Stand der Ursachenanalyse (2026-07-25).** Die Konstruktion ist geklärt, die
Klassifikationsregel nicht. Der Kenntnisstand ist präzise genug, dass ein nächster
Anlauf nicht bei null beginnen muss.

**1. Geklärt — die Konstruktion.** R bildet die intermediäre Lösung **nicht** durch
Justieren der Literale konservativer Primimplikanten gegen subsumierende sparsame (so
arbeitet die Engine heute), sondern durch **erneute Minimierung über (positive Minterme
∪ einfache Counterfactuals)**. Nachgewiesen: Speist man die vorhandene
Minimierungspipeline der Engine mit R's eigener EC-Liste
(`minimize(...)$i.sol[[k]]$EC`) als zugelassenen Remaindern, liefert sie auf Lipset
**exakt** R's intermediäre Lösung. Die Umstellung der Konstruktion allein genügt also —
es fehlt nur die Regel, die EC bestimmt.

**2. Offen — die Klassifikationsregel.** Zwei Kandidaten wurden implementiert und gegen
die volle Prüfkette gestellt. Jeder trifft einen realen Mechanismus, keiner alle Fälle:

| Kandidat | Kreuzvalidierung | Engine-Tests |
|---|---|---|
| **A — gerichtet:** einfach nur, wenn eine Bedingung von *abwesend* auf *anwesend* wechselt und „present" erwartet wird | **16/16**, inkl. Lipset und `ambig_intermediate_mixed` | 2 Fehlschläge |
| **B — symmetrisch:** einfach, wenn eine Bedingung in ihren erwarteten Zustand wechselt (beide Richtungen) | 14/16 | 43/43 |
| **bestehend (Literal-Justierung)** | 15/16 | 43/43 |

Die beiden Engine-Tests, die Kandidat A bricht, wurden gegen R **nachgeprüft und sind
korrekt**: Für den Test-Datensatz (einzige positive Ecke `W*B*S`) liefert R mit
`dir.exp = (0,1,1)` die Lösung `B*S` und mit `(0,0,0)` die Lösung `S`. Das *Entfernen*
eines Literals, dessen Abwesenheit erwartet wird, ist dort also sehr wohl einfach —
Kandidat A schließt das aus.

**3. Der entscheidende Widerspruch.** Dieselbe Konstellation wird von R unterschiedlich
eingestuft, abhängig von den **übrigen** positiven Konfigurationen:

- Test-Datensatz, Erwartungen alle „absent", einzige positive Ecke `111`: Der Remainder
  `011` (Wechsel von `111`, Bedingung in den erwarteten Zustand) ist **einfach**.
- `fuzzy_intermediate_all_absent`, Erwartungen alle „absent", positive Ecken
  `001, 110, 111`: Derselbe Remainder `011`, erreichbar aus derselben Ecke `111` durch
  denselben Wechsel, ist **schwierig** (R führt ihn unter `$DC`).

Der Unterschied liegt allein in den zusätzlichen positiven Ecken. R's Einstufung hängt
also **nicht** nur an der paarweisen Erreichbarkeit aus *irgendeiner* positiven Ecke,
sondern an der Gesamtkonstellation. Genau hier muss der nächste Anlauf ansetzen —
sinnvollerweise mit einem Skript, das R's `$EC`/`$DC` über viele generierte Datensätze
einsammelt und Regelkandidaten dagegen prüft, statt sie einzeln zu erraten.

Der Umbau wurde **bewusst zurückgenommen**: Kandidat A hätte R-geprüfte Engine-Tests
gebrochen, Kandidat B die Gesamtübereinstimmung verschlechtert. Solange die Regel nicht
vollständig verstanden ist, bleibt die bestehende Implementierung stehen — mit dieser
offenen Dokumentation.

Bis zur Klärung gilt: Der Fall ist als Szenario **eingecheckt und sichtbar**.
`scripts/cross-validate.mjs` führt ihn in `KNOWN_DIVERGENCES`, meldet ihn bei jedem Lauf
als Warnung und **schlägt fehl, sobald die Abweichung verschwindet** (dann ist der
Eintrag zu entfernen und dieser Abschnitt zu aktualisieren). Die Abweichung wurde nicht
durch Anpassen von Erwartungswerten, Toleranzen oder des Orakels „grün gemacht".

Praktische Reichweite — **am 2026-07-25 nach oben korrigiert.** Ursprünglich war hier
vermerkt, betroffen seien nur gemischte Richtungserwartungen bei Modell-Ambiguität. Der
Lipset-Fall widerlegt das: Er hat durchgängig gleiche Erwartungen, keine
Modell-Ambiguität — und weicht dennoch ab.

Betroffen ist die **intermediäre Lösung allgemein**, sobald ein konservativer
Primimplikant Literale enthält, deren Wegfall von R als einfaches Counterfactual
eingestuft wird, von der Engine aber nicht. Die Engine liefert dann eine **zu
spezifische** (nicht zu allgemeine) Lösung — sie behält Literale, die R entfernt. Das
ist die methodisch weniger gefährliche Richtung: Es werden keine Vereinfachungsannahmen
getroffen, die R nicht auch trifft. Ein Ergebnis ist damit nicht ungültig, aber es kann
konservativer ausfallen als die kanonische intermediäre Lösung — und weicht in dieser
Form von einer Replikation mit dem R-Paket ab.

**Konservative und sparsame Lösung sind nachweislich nicht betroffen**: Sie stimmen auf
allen 16 Szenarien und auf Lipset exakt mit R überein.

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

Vier getrennte Evidenzebenen:

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
   und wird als **dokumentiertes Residual** akzeptiert — die Engine wird nicht an R
   angepasst, und das Orakel wird nicht „zurechtgebogen“.
3. **Lineare Fuzzy-Kalibrierung (externe Gegenüberstellung):** `calibrateLinear`
   stimmt auf dem unabhängigen R-QCA-Prüfgitter mit `QCA::calibrate(logistic = FALSE)`
   innerhalb `1e-6` überein. Das belegt Implementierungsübereinstimmung, nicht die
   substantielle Gültigkeit der gewählten Anker.
4. **Noch nicht extern validiert:** `calibrateFourValue`.

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
