# QCA-Primer – eine geführte Einführung

Diese Einführung richtet sich an **Neulinge**. Sie erklärt die Grundideen der
Qualitative Comparative Analysis (QCA) Schritt für Schritt und in der
Reihenfolge, in der openQCA dich durch eine Analyse führt. Ziel ist Verständnis,
nicht Vollständigkeit – für die Formeln des Rechenkerns siehe
[`engine-notes.md`](./engine-notes.md).

---

## 1. Was ist QCA?

QCA untersucht, **welche Kombinationen von Bedingungen** zu einem interessierenden
**Outcome** führen. Sie steht zwischen qualitativer Fallstudie und quantitativer
Statistik und eignet sich besonders für **mittelgroße Fallzahlen** (ca. 10–50
Fälle).

Drei Grundgedanken unterscheiden QCA von der klassischen Regression:

1. **Konjunktion (Kombinationen zählen).** Nicht die isolierte Wirkung einer
   Variablen interessiert, sondern das Zusammenspiel: Bedingung A wirkt vielleicht
   nur *zusammen mit* B.
2. **Äquifinalität (mehrere Wege).** Verschiedene Kombinationen können zum
   *gleichen* Outcome führen. Es gibt oft mehr als einen "Pfad".
3. **Asymmetrie.** Die Erklärung für das Eintreten des Outcomes ist nicht einfach
   die Umkehrung der Erklärung für sein Ausbleiben. Man analysiert beide Seiten
   getrennt.

Die Sprache der QCA ist die **Mengenlehre**: Ein Fall ist mehr oder weniger
**Mitglied** einer Menge ("wohlhabende Länder", "stabile Demokratien"). Aussagen
haben die Form **notwendig** und **hinreichend**.

### Crisp Sets und Fuzzy Sets

- **Crisp Set (csQCA):** Mitgliedschaft ist 0 **oder** 1 (drin/draußen).
- **Fuzzy Set (fsQCA):** Mitgliedschaft ist ein Wert in **[0, 1]** – abgestufte
  Zugehörigkeit. 0 = voll draußen, 1 = voll drinnen, **0,5 = Indifferenzpunkt**
  (maximale Unentschiedenheit, weder eher drinnen noch eher draußen).

openQCA unterstützt beide. Beispieldatensätze findest du in `../datasets/`.

---

## 2. Kalibrierung: von Rohwerten zur Mengenzugehörigkeit

Rohdaten (Prozente, Indizes, Skalen) müssen erst in **Mengenzugehörigkeit**
übersetzt werden. Das nennt man **Kalibrierung**. Sie ist der wichtigste – und
theorielastigste – Schritt der QCA. Eine Set-Zugehörigkeit ist **keine**
Prozentzahl, sondern beantwortet die Frage: *Wie sehr gehört dieser Fall in die
Menge?*

### Theorie vor Daten

Kalibrierung ist **kein rein statistischer Vorgang**. Die Anker sollten aus
**inhaltlichem/theoretischem Wissen** über die Menge kommen, nicht aus der
Verteilung der Stichprobe (also nicht einfach der Mittelwert oder Median).
Die Frage lautet: *Ab welchem Rohwert ist ein Fall inhaltlich "voll drinnen"?* –
nicht: *Wo liegt das obere Quartil?*

### Direkte Methode und die drei Anker

Die **direkte Methode** (nach Ragin 2008) verlangt drei **Anker**:

| Anker | Bedeutung | Ziel-Zugehörigkeit |
|---|---|---|
| **Voll draußen** (`fullOut`) | ab hier klar *nicht* in der Menge | ≈ 0,05 |
| **Kreuzungspunkt** (`crossover`) | Punkt maximaler Unentschiedenheit | **exakt 0,5** |
| **Voll drinnen** (`fullIn`) | ab hier klar *in* der Menge | ≈ 0,95 |

Die Anker müssen **aufsteigend** sein (`fullOut < crossover < fullIn`). Zwischen
ihnen interpoliert eine logistische Funktion. Im openQCA-Rechenkern bildet der
Kreuzungspunkt **exakt auf 0,5** ab, der Voll-drinnen-Anker auf ≈ 0,9526 und der
Voll-draußen-Anker auf ≈ 0,0474 (das sind die eingebauten Fixpunkte).

**Kleines Beispiel.** Wohlstand als BIP pro Kopf, Anker voll draußen = 300,
Kreuzung = 600, voll drinnen = 1000:

- BIP 600 → Zugehörigkeit **0,50** (genau am Kreuzungspunkt)
- BIP 1000 → ≈ **0,95** (voll drinnen)
- BIP 900 → ≈ **0,91**
- BIP 300 → ≈ **0,05** (voll draußen)
- BIP 260 → ≈ **0,03**

Neben der logistischen gibt es eine **lineare** Variante (gleiche Anker,
gerade statt s-förmig), eine **Crisp-Kalibrierung** (eine Schwelle → 0/1) und
eine **Vier-Werte-Kalibrierung** (drei Schwellen → 0 / 0,33 / 0,67 / 1).

Die lineare Variante verbindet die Anker stückweise: bis zum Anker `e` ergibt
sie 0, zwischen `e` und `c` steigt sie bis 0,5, zwischen `c` und `i` bis 1,
danach bleibt sie bei 1. Sie entspricht im R-Paket `QCA`
`calibrate(..., logistic = FALSE)`. Auch hier stammen die Anker aus einer
substantiven Set-Definition, nicht automatisch aus Medianen oder Quantilen.

### Das 0,5-Problem

Der Wert **0,5 ist heikel**: Ein Fall mit exakt 0,5 ist weder "eher drinnen" noch
"eher draußen" und lässt sich **keiner Ecke** der Truth Table eindeutig zuordnen.
Deshalb gilt die Faustregel: **Kein Fall sollte nach der Kalibrierung genau auf
0,5 liegen.** openQCA markiert solche Fälle ausdrücklich (Feld `atCrossover` in
der Truth Table), damit du die Anker anpassen kannst. Der Datensatz
`fuzzy-sets-beispiel.csv` ist bewusst so gebaut, dass dieses Problem nicht
auftritt.

### Schiefe (skew)

Wenn fast alle Fälle in einer Menge sehr hohe (oder sehr niedrige)
Zugehörigkeiten haben, ist die Menge **schief** besetzt. Das ist inhaltlich oft
korrekt, kann aber Konsistenzmaße "aufblähen" (eine Menge, in der fast alle voll
drinnen sind, ist leicht Teilmenge von fast allem). Schiefe ist deshalb immer
mitzudenken – prüfe die Verteilung der kalibrierten Werte, bevor du interpretierst.

---

## 3. Notwendige und hinreichende Bedingungen

Das mengentheoretische Herz der QCA. X sei die Zugehörigkeit zu einer Bedingung
(oder Kombination), Y die Zugehörigkeit zum Outcome.

- **Hinreichend (sufficient):** *Wenn X, dann Y.* X ist eine **Teilmenge** von Y:
  überall gilt **X ≤ Y**. Der Pfad reicht *aus*, um das Outcome zu erzeugen – ist
  aber nicht der einzige.
- **Notwendig (necessary):** *Ohne X kein Y.* Y ist eine **Teilmenge** von X:
  überall gilt **Y ≤ X**. Ohne die Bedingung tritt das Outcome nicht ein.

Ein Merksatz: Bei **Hinreichendheit** liegen die Punkte im XY-Diagramm **oberhalb**
der Diagonale (Y ≥ X), bei **Notwendigkeit** **unterhalb** (X ≥ Y).

QCA analysiert **beide getrennt**: zuerst meist die Suche nach *notwendigen*
Bedingungen (einzeln), dann die Analyse *hinreichender* Kombinationen über die
Truth Table.

---

## 4. Truth Table (Wahrheitstafel)

Bei **k** Bedingungen gibt es **2^k** logisch mögliche Kombinationen – die **Ecken**
(Konfigurationen) des Eigenschaftsraums. Die Truth Table listet alle 2^k Zeilen und
ordnet jeden Fall der Ecke zu, der er am nächsten liegt (jede Bedingung > 0,5 →
"anwesend", ≤ 0,5 → "abwesend").

Jede Zeile bekommt:

- **n** – Anzahl der Fälle mit Zugehörigkeit > 0,5 zu dieser Ecke,
- **Konsistenz** – wie "rein" hinreichend die Ecke ist (siehe unten),
- **PRI** – strengeres Konsistenzmaß (siehe unten),
- **Output** – die Entscheidung 0/1/`?` (siehe unten).

### Zwei Cutoffs entscheiden über den Output

1. **Frequenz-Cutoff (`freqCut`):** Wie viele Fälle muss eine Ecke mindestens
   enthalten, um überhaupt bewertet zu werden? Ecken mit zu wenig (oder null)
   Fällen bleiben **Remainder** und bekommen Output **`?`**. Bei kleinen
   Datensätzen ist der Cutoff meist 1.
2. **Konsistenz-Cutoff (`consCut`):** Ab welcher Konsistenz gilt eine (ausreichend
   besetzte) Ecke als hinreichend für das Outcome (Output **1**), darunter als
   nicht hinreichend (Output **0**)? Übliche Werte liegen bei **0,8 und höher**.

**Remainder** (`?`) sind logisch mögliche, aber **empirisch nicht (ausreichend)
beobachtete** Konfigurationen. Wie man mit ihnen umgeht, unterscheidet die drei
Lösungstypen (Abschnitt 6).

---

## 5. Konsistenz, Coverage und PRI

Diese Kennzahlen bewerten, wie gut eine Menge X das Outcome Y erklärt.

### Konsistenz der Hinreichendheit (inclusion)

> Konsistenz = Σ min(X, Y) / Σ X

Misst, wie nah X daran ist, **Teilmenge** von Y zu sein (X ≤ Y). **1,0** =
perfekt hinreichend. Werte unter ~0,75 gelten meist als zu niedrig, um von
Hinreichendheit zu sprechen.

### Coverage (Abdeckung)

> Raw Coverage = Σ min(X, Y) / Σ Y

Misst, **wie viel** vom Outcome ein Pfad empirisch erklärt (Anteil der
Outcome-Mitgliedschaft, den X abdeckt). Hohe Konsistenz + niedrige Coverage =
"korrekt, aber selten".

- **Raw Coverage:** Anteil, den ein Pfad insgesamt abdeckt (Pfade dürfen sich
  überlappen).
- **Unique Coverage:** Anteil, den **nur dieser** Pfad abdeckt (kein anderer).
  Zeigt den eigenständigen Erklärungsbeitrag.

Konsistenz und Coverage sind ein **Zielkonflikt**, analog zu Präzision und
Trefferquote.

### PRI (Proportional Reduction in Inconsistency)

> PRI = (Σ min(X,Y) − Σ min(X,Y,1−Y)) / (Σ X − Σ min(X,Y,1−Y))

Ein **strengeres** Konsistenzmaß, das dagegen absichert, dass eine Konfiguration
zugleich für das Outcome *und* sein Gegenteil hinreichend erscheint (ein Problem
bei stark schiefen Daten). **Große Lücke zwischen Konsistenz und PRI** ist ein
Warnsignal: dann trägt die Ecke viel "widersprüchliche" Mitgliedschaft. Faustregel:
PRI sollte nicht deutlich unter dem Konsistenz-Cutoff liegen.

### Notwendigkeit

Für notwendige Bedingungen sind die Rollen von Zähler/Nenner vertauscht:

> Notwendigkeits-Konsistenz = Σ min(X, Y) / Σ Y   (misst Y ⊆ X)
> Relevanz/Coverage        = Σ min(X, Y) / Σ X

Eine Bedingung gilt üblicherweise als **Kandidat für Notwendigkeit** ab einer
Konsistenz von **≥ 0,9** (openQCA markiert diese). Die Coverage schützt vor
**trivialer** Notwendigkeit: Eine fast allgegenwärtige Bedingung ist zwar formal
"notwendig", aber inhaltlich nichtssagend.

---

## 6. Boolesche Minimierung und die drei Lösungen

Aus allen Ecken mit Output **1** wird eine möglichst **einfache** logische Formel
gebildet. Das Verfahren heißt **Quine-McCluskey**: Zwei Konfigurationen, die sich
in **genau einer** Bedingung unterscheiden, werden zusammengefasst und diese
Bedingung fällt weg.

> Beispiel: `WOHLSTAND*BILDUNG*STAAT` und `WOHLSTAND*BILDUNG*~STAAT`
> unterscheiden sich nur in `STAAT` → zusammengefasst zu `WOHLSTAND*BILDUNG`.

Übrig bleiben **Primimplikanten**; eine minimale Auswahl davon deckt alle
positiven Ecken ab (**essenzielle Primimplikanten** zuerst). Notation im
Rechenkern: `*` = UND, `+` = ODER, `~` = NICHT.

Der Umgang mit **Remaindern** (`?`) unterscheidet drei Lösungen:

| Lösung | Remainder-Nutzung | Charakter |
|---|---|---|
| **Komplex** (konservativ) | **keine** Remainder | nur beobachtete Ecken; am nächsten an den Daten, oft lang |
| **Sparsam** (parsimonious) | **alle** hilfreichen Remainder | erlaubt jede vereinfachende Annahme; kürzeste Formel |
| **Intermediär** | **nur theoretisch plausible** Remainder | Mittelweg; empfohlen für die Interpretation |

- Die **komplexe** Lösung macht keine Annahmen über Unbeobachtetes – dafür bleibt
  sie sperrig.
- Die **sparsame** Lösung nutzt *beliebige* Remainder als "Don't Cares" und wird
  dadurch am kürzesten – nimmt aber auch empirisch nie gesehene Konfigurationen an.
- Die **intermediäre** Lösung liegt dazwischen: Sie lässt nur Remainder zu, die mit
  theoretisch begründeten **Richtungserwartungen** ("directional expectations")
  vereinbar sind. In der Praxis wird meist sie interpretiert.

> **Stand im openQCA-Rechenkern:** Der Kern berechnet aktuell die **komplexe**
> (`complexSolution`), die **sparsame** (`parsimoniousSolution`) und die
> **intermediäre** (`intermediateSolution`) Lösung. Die intermediäre Lösung nutzt
> nur Remainder, die zu den festgelegten Richtungserwartungen passen (Enhanced
> Standard Analysis). Siehe [`engine-notes.md`](./engine-notes.md).

### Durchgerechnetes Beispiel (aus den Datensätzen)

Mit `../datasets/fuzzy-sets-beispiel.csv` (freqCut = 1, consCut = 0,85) liefert
der Rechenkern:

- **Sparsam:** `STAATSKAPAZITAET + WOHLSTAND*BILDUNG`
  (Solution-Coverage ≈ 0,95, Solution-Konsistenz ≈ 0,99)
- **Komplex:** `~WOHLSTAND*~BILDUNG*STAATSKAPAZITAET + WOHLSTAND*BILDUNG`

Lesart: Eine stabile Demokratie entsteht, **wenn** der Staat leistungsfähig ist,
**oder wenn** Wohlstand und Bildung gemeinsam hoch sind. Die sparsame Lösung
vereinfacht den ersten Pfad zu `STAATSKAPAZITAET`, weil sie unbeobachtete Ecken
als vereinfachende Annahmen zulässt; die komplexe behält den vollständigen,
nur aus Daten belegten Pfad.

---

## 7. Ein typischer Ablauf in openQCA

1. **Daten laden** (CSV: Fall-Spalte, Bedingungen, Outcome).
2. **Kalibrieren** – Anker aus Theorie wählen; auf 0,5-Fälle und Schiefe achten.
3. **Notwendige Bedingungen** prüfen (Konsistenz ≥ 0,9, Coverage beachten).
4. **Truth Table** bauen; Frequenz- und Konsistenz-Cutoff setzen; Remainder und
   `atCrossover`-Fälle prüfen.
5. **Minimieren** – komplexe, sparsame und intermediäre Lösung berechnen.
6. **Interpretieren** – Solution-/Pfad-Konsistenz und -Coverage lesen, typische
   Fälle je Pfad benennen, an die Theorie zurückbinden.

---

## 8. Häufige Fallstricke

- **Anker aus der Datenverteilung statt aus Theorie** ableiten.
- **Fälle bei 0,5** übersehen (Truth-Table-Zuordnung wird mehrdeutig).
- **Nur die sparsame Lösung** interpretieren, ohne die Annahmen über Remainder
  offenzulegen.
- **Notwendigkeit trivial**: eine allgegenwärtige Bedingung für "notwendig"
  halten (Coverage prüfen!).
- **Konsistenz-Cutoff zu niedrig**: grenzwertige Ecken erzeugen scheinbare Pfade.
  (Der Fuzzy-Datensatz zeigt das: bei 0,80 rutscht ein Schein-Pfad `BILDUNG`
  hinein, bei 0,85 nicht.)
- **Asymmetrie ignorieren**: die Erklärung des Outcomes ≠ Umkehrung der Erklärung
  des Nicht-Outcomes. Beide Seiten getrennt analysieren.

---

*Für die konkrete Programmier-Schnittstelle (Funktionen, Typen, Beispiele) siehe
[`engine-notes.md`](./engine-notes.md). Alle Beispieldaten liegen unter
`../datasets/` und sind rein illustrativ.*
