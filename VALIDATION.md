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

19 Szenarien prüfen **Lösungsmodelle**: die beiden kalibrierten Beispieldatensaetze (je
konservativ, sparsam und vier intermediaere Varianten), der konstruierte Ambiguitaetsfall
(vier Szenarien) und der kanonische Lipset-Datensatz (drei Szenarien, nur lokal — siehe
unten). Dazu kommen **sechs Notwendigkeits-Szenarien** gegen `superSubset` (siehe
„Notwendigkeit: Disjunktionen (SUIN) und RoN"). Zusammen **25 Szenarien**.

Die Notwendigkeits-Szenarien laufen über einen **eigenen Vergleichspfad**
(`compareNecessity` in `scripts/cross-validate.mjs`), weil `superSubset` keine
Lösungsmodelle mit Pfadkennzahlen liefert, sondern eine Ausdrucksliste mit
inclN/RoN/covN. Die bestehende Modell-Vergleichslogik bleibt unverändert.

### Was ausdrücklich NICHT Teil dieser Szenarien ist

Damit keine Außendarstellung mehr behauptet, was hier nicht geprüft wird:

- **PRI** wird nirgends extern validiert. Die Kennzahl wird in Truth Table und
  Bericht ausgewiesen und ist durch interne Tests abgedeckt, aber nicht gegen
  ein externes Orakel gestellt.
- **Kalibrierung** ist nicht Teil dieser Szenarien. Beide Datensätze gehen
  bereits kalibriert in den Vergleich. Die Kalibrierung hat ihre eigene, weiter
  unten beschriebene Evidenzkette (`scripts/calibrate-cross-validate.mjs`) —
  mit einer dokumentierten Restabweichung ≤ 0,01 bei der direkten Methode.
- Die **Snapshot-Werte** der Notwendigkeitsanalyse und der komplexen Lösungen in
  `scripts/reference-check.mjs` bleiben interne Regressions-Snapshots. Das
  *Verfahren* der Notwendigkeitsanalyse ist seit 2026-07-25 kreuzvalidiert —
  siehe „Notwendigkeit: Disjunktionen (SUIN) und RoN".
- **Fall-Diagnostik** und **Robustheitsraster** sind interne Snapshots, kein
  externes Orakel — siehe die eigenen Abschnitte unten.

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

**23 von 25 Szenarien PASS** (Engine == R-Paket QCA, Formeln und Kennzahlen);
zwei Szenarien weichen dokumentiert ab — beide aus derselben ESA-Ursache, siehe
„Bekannte Abweichungen" unten. Alle sechs Notwendigkeits-Szenarien stimmen exakt
(Toleranz `1e-6`) mit `superSubset` überein.

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
  denselben Wechsel, ist **schwierig**.

Der Unterschied liegt allein in den zusätzlichen positiven Ecken.

### Dritter Anlauf (2026-07-26): Korpus statt Raten

Die früheren Anläufe haben Regeln geraten und an einzelnen Szenarien gemessen. Dieser
Anlauf hat stattdessen R systematisch befragt. Zwei Werkzeuge sind dabei entstanden und
bleiben im Repository:

- **`scripts/r-oracle/esa-corpus.R`** erzeugt einen Korpus: Für jede Aufteilung der acht
  Ecken eines Drei-Bedingungen-Würfels in positive, negative und Remainder und für jede
  Kombination von Richtungserwartungen ruft es `minimize()` und hält konservative,
  sparsame und intermediäre Lösung sowie R's Listen `$EC`, `$DC` und `$SA` fest.
- **`scripts/esa-solution-check.mjs`** stellt die intermediäre Lösung der Engine über den
  ganzen Korpus gegen R.

**Vier belastbare Befunde:**

1. **`$EC` ist eine Ausgabe, keine Klassifikation.** R führt dort die einfachen
   Counterfactuals auf, die die **fertige Lösung tatsächlich nutzt** — nicht die
   Einstufung aller Vereinfachungsannahmen. Nachweis: Im Ambiguitätsfall listet
   `$SA` für das sparsame Modell `B*C + C*D` die Annahmen `0110` und `1111`, `$EC`
   dagegen nur `1111` — genau den Remainder, den die Lösung `C*D + A*B*C` überdeckt.
   Eine Regel gegen `$EC` zu fitten, misst also das falsche Ziel. Das war der Denkfehler
   der ersten beiden Anläufe.
2. **Die Konstruktion ist bestätigt.** Ersetzt man die paarweise Literal-Justierung durch
   erneute Minimierung über (positive Minterme ∪ zugelassene Remainder), liefert die
   Engine auf **Ragins Lipset-Datensatz exakt R's intermediäre Lösung** — die Abweichung
   verschwindet ohne jede Anpassung von Erwartungswerten oder Toleranzen.
3. **Die Reichweite der Abweichung ist jetzt gemessen — sie ist größer als gedacht.**
   Über alle **13.216** Konstellationen des Korpus (drei Bedingungen, bis zu drei positive
   Ecken, alle Erwartungskombinationen) stimmt die intermediäre Lösung der Engine in
   **11.408 Fällen (86,3 %)** mit R überein. Die Abweichung betrifft also rund ein Siebtel
   aller Konstellationen, nicht zwei Szenarien. Der Regelkandidat („ein Remainder ist
   einfach, wenn er aus einer beobachteten positiven Konfiguration hervorgeht, indem
   Bedingungen in ihren theoriekonformen Zustand wechseln") kommt auf **12.088 (91,5 %)**
   — besser, aber ebenfalls nicht vollständig.

   **Wichtig zur Aussagekraft:** Auf dem Teilkorpus mit **einer** positiven Ecke erreichen
   **beide** Regeln 1.792 von 1.792. Dieser Teil kann sie also gar nicht unterscheiden;
   erst mehrere positive Ecken trennen sie. Eine frühere Fassung dieses Abschnitts führte
   die 1.792 als Beleg für den Kandidaten an — das war sie nicht.
4. **Der Umbau wurde erneut zurückgenommen — aus einem inhaltlichen Grund.** Wo der
   Kandidat scheitert, liefert er eine **zu sparsame** Lösung: Er trifft eine
   Vereinfachungsannahme, die R nicht trifft. Das ist die methodisch gefährliche
   Richtung — die bestehende Implementierung irrt in die andere (zu spezifisch, keine
   Annahme, die R nicht auch trifft). In der Kreuzvalidierung tauscht der Kandidat
   entsprechend: Lipset wird exakt, `fuzzy_intermediate_all_absent` bricht. Fünf
   Prozentpunkte mehr Übereinstimmung sind das nicht wert, wenn der Preis eine Lösung ist,
   die mehr behauptet als die Daten hergeben.

**Eine Falle im Korpus selbst**, die beim Auswerten aufgefallen ist: R gibt in
`$i.sol[[k]]$solution` eine **Liste von Modellen** zurück. Ein `unlist()` beim Export
verschmilzt sie zu einer flachen Termliste — sichtbar an Lösungen mit doppelten Termen wie
`B*C + ~A*B + ~A*~C + ~A*~C`. Der Export schreibt deshalb je Modell ein eigenes Array
(`esa-corpus.R`). Dieselbe Falle steckt in `$solution` der sparsamen Lösung.

**Was der nächste Anlauf zuerst tun sollte:** Kandidaten mit
`scripts/esa-solution-check.mjs` gegen die **Lösung** prüfen, nicht gegen `$EC`, und dabei
auf dem Korpus mit mehreren positiven Ecken messen (`Rscript scripts/r-oracle/esa-corpus.R 3`,
rund 50 Minuten). Die
Signatur des offenen Falls ist scharf: Ein Remainder, der aus einer positiven Ecke durch
einen einzigen theoriekonformen Wechsel hervorgeht, ist bei einer positiven Ecke einfach
und bei mehreren manchmal schwierig. Was ihn dann blockiert, ist die offene Frage.

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

## Notwendigkeit: Disjunktionen (SUIN) und RoN

**Neu am 2026-07-25 und R-kreuzvalidiert.** Bis dahin prüfte die Engine ausschließlich
einzelne Bedingungen und ihre Negation. `necessarySupersets`
(`packages/engine/src/necessity.ts`) prüft zusätzlich **Konjunktionen** und
**Disjunktionen** bis zu einer wählbaren Ordnung und weist neben inclN und covN auch
**RoN** (Relevance of Necessity, Schneider & Wagemann 2012, S. 236) aus:

```
inclN = Σ min(X,Y) / Σ Y
covN  = Σ min(X,Y) / Σ X
RoN   = Σ (1−X)    / Σ (1−min(X,Y))
```

RoN ist ergänzt worden, weil Coverage allein triviale Notwendigkeit nicht zuverlässig
erkennt. Die Kennzahl steht auch je Einzelbedingung in `necessityAnalysis`.

### Referenz und Semantik

Referenz ist `superSubset(data, outcome, conditions, relation = "necessity",
incl.cut, cov.cut, depth, use.tilde = TRUE)`. Dessen Auswahlregeln wurden empirisch
nachgebildet und sind in `necessity.ts` dokumentiert:

- Zulässig ist ein Ausdruck bei `inclN ≥ incl.cut` **und** `covN ≥ cov.cut`
  (danach `RoN ≥ ron.cut`); die Cutoffs werden wie in R um `sqrt(eps)` aufgeweicht.
- **Konjunktionen** werden vollständig ausgewiesen (jede ist eine kleinere Obermenge
  des Outcomes und damit ein eigener Befund).
- **Disjunktionen** nur, wenn sie *minimal* sind: Sobald eine echte Teil-Disjunktion —
  bis hin zum einzelnen Literal — bereits zulässig ist, entfällt die größere.
  Einzelne Literale erscheinen ausschließlich in der Konjunktionsliste, genau wie in R.
- Kein Ausdruck kombiniert eine Bedingung mit ihrer eigenen Negation.

### Szenarien und Status

Sechs Szenarien, verglichen werden die **Ausdrucksmenge** sowie **inclN, RoN und covN**
je Ausdruck mit Toleranz `1e-6`:

| Szenario | Datensatz | incl.cut | cov.cut | depth | Status |
|---|---|---|---|---|---|
| `nec_fuzzy_incl90_cov60` | fuzzy-sets-beispiel | 0,90 | 0,60 | 3 | **PASS** |
| `nec_fuzzy_incl80_cov50` | fuzzy-sets-beispiel | 0,80 | 0,50 | 3 | **PASS** |
| `nec_crisp_incl90_cov50` | crisp-sets-beispiel | 0,90 | 0,50 | 4 | **PASS** |
| `nec_ambig_incl90_cov50` | modell-ambiguitaet | 0,90 | 0,50 | 4 | **PASS** |
| `nec_lipset_incl90_cov50` | Lipset (lokal) | 0,90 | 0,50 | 5 | **PASS** |
| `nec_lipset_incl75_depth3` | Lipset (lokal) | 0,75 | 0,00 | 3 | **PASS** |

Die Szenarien decken bewusst unterschiedliche Konstellationen ab: reine Disjunktionen
ohne notwendige Einzelbedingung (fuzzy, crisp), eine notwendige Einzelbedingung, die
größere Disjunktionen sperrt (`ambig`: `C`), sowie gemischte Konjunktions- und
Disjunktionsbefunde auf dem kanonischen Lipset-Datensatz. Der Crisp-Fall trifft
zusätzlich die Cutoff-Kante exakt (`~MARKT + ~KONKURRENZ` mit covN = 0,5000).

### Was hier NICHT validiert ist

- `superSubset(relation = "sufficiency")`, `pri.cut` und das `add`-Argument sind nicht
  nachgebildet und werden nicht behauptet.
- Der Standardwert `depth` weicht bewusst von R ab (openQCA: `min(k, 3)`, R: `k`). Für
  die Kreuzvalidierung wird `depth` immer explizit gesetzt.

## Robustheit: was das Raster leistet — und was nicht

`runCombinedRobustnessGrid` rechnet ein Kreuzprodukt aus Kalibrierungsszenarien und
Frequency-/Consistency-/PRI-Cutoffs und meldet, welcher Anteil der Zellen denselben
Lösungsausdruck liefert und welche Fälle ihre Klassifikation wechseln.

Das ist **nicht** das Robustness-Test-Protokoll von Oana & Schneider
(doi 10.1177/00491241211036158). Dessen Kennzahlen **RF_incl**, **RF_cov** und
**RF_case** sind nicht implementiert. Die frühere Berufung darauf in `docs/ROADMAP.md`
wurde am 2026-07-25 zurückgenommen; der Verweis steht dort jetzt als Hintergrund mit
ausdrücklicher Abgrenzung. Eine Ergänzung setzt ein externes Orakel voraus
(`SetMethods::robustness()`), das in dieser Umgebung nicht installiert ist — ohne
Kreuzvalidierung würden die Kennzahlen gegen die Regel verstoßen, nichts als validiert
auszuweisen, was es nicht ist. Der Sweep selbst ist **interner Regressions-Snapshot**,
kein extern validiertes Verfahren.

## Fall-Diagnostik: interner Snapshot, kein externes Orakel

`caseDiagnostics` (`packages/engine/src/caseDiagnostics.ts`) klassifiziert Fälle je
Lösungspfad nach Schneider & Rohlfing (2013, 2016): typisch, *deviant consistency in
kind*, *deviant consistency in degree*, individuell irrelevant (IIR) sowie auf
Lösungsebene *deviant coverage*.

Die Typologie ist **rein definitorisch** (Schwellenvergleiche im XY-Raum) und wird
durch Unit-Tests in `packages/engine/test/caseDiagnostics.test.ts` abgesichert —
darunter die Erschöpfungs- und Disjunktheitseigenschaft der vier Typen. Sie ist
**nicht** gegen ein externes Orakel gestellt: Das R-Paket `QCA` kennt keine
entsprechende Funktion (`SetMethods` böte sie, ist aber nicht installiert). Damit bleibt
sie ein **interner Regressions-Snapshot** im Sinne der Aussagegrenze weiter unten.

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

**Extern kreuzvalidiert** (gegen das R-Paket QCA, `scripts/cross-validate.mjs`):
konservative, sparsame und intermediäre Lösungsformeln samt Fit-Parametern sowie —
seit 2026-07-25 — die **Notwendigkeit von Konjunktionen und Disjunktionen (SUIN)
inklusive inclN, covN und RoN** gegen `superSubset`.

**Interne Regressions-Snapshots** (nicht extern validiert): die Kalibrierungs-Snapshots
und die Kennzahlen der komplexen Lösungen in `scripts/reference-check.mjs`, **PRI**,
die **Fall-Diagnostik** (`caseDiagnostics`) und das **Robustheitsraster**
(`runCombinedRobustnessGrid`). Die frühere pauschale Formulierung „Notwendigkeits-
Kennzahlen sind interne Snapshots" gilt damit nur noch für die Snapshot-Werte in
`reference-check.mjs`, nicht mehr für das Verfahren selbst.
Eine Erweiterung auf weitere Datensätze und auf fsQCA 4.1 als zweites Orakel
bleibt möglich.

## Lipset — der kanonische Referenzfall (lokal, nicht mitgeliefert)

Der stärkste verfügbare Korrektheitsbeleg ist der Datensatz, den das Fach am besten
kennt: Lipsets 18 europäische Staaten der Zwischenkriegszeit, in der von Ragin für QCA
aufbereiteten Form. Er liegt im R-Paket `QCA` als `LR` (Rohwerte) und `LF` (kalibriert).

**Warum er nicht im Repository liegt.** Das R-Paket steht unter GPL (≥ 3), openQCA unter
MIT. Eine Weitergabe der Paketdaten in diesem Repository wäre ein Lizenzkonflikt. Die
Daten werden deshalb lokal aus der installierten R-Bibliothek erzeugt:

```sh
Rscript scripts/r-oracle/lipset-export.R   # schreibt datasets/local/ (gitignored)
Rscript scripts/r-oracle/oracle.R          # nimmt die Lipset-Szenarien mit auf
node scripts/cross-validate.mjs
```

Fehlen die Daten, werden die drei Lipset-Szenarien **sichtbar übersprungen** und nicht
als Fehlschlag gewertet — die übrigen Szenarien laufen unverändert.

**Befund.** `lipset_conservative` und `lipset_parsimonious` stimmen **exakt** mit R
überein. `lipset_intermediate_all_present` weicht ab — dieselbe ESA-Ursache wie
`ambig_intermediate_mixed` (siehe „Bekannte Abweichungen"). Damit ist belegt: Truth
Table, Primimplikanten, Minimierung und die Fit-Kennzahlen treffen den kanonischen Fall;
die offene Frage betrifft ausschließlich die Auswahl der einfachen Counterfactuals.

Quelle der Daten: Lipset, S. M. (1959): Some Social Requisites of Democracy. *American
Political Science Review* 53(1), 69–105 — in der von Ragin aufbereiteten, im R-Paket
`QCA` (Dușa) ausgelieferten Form.
