# Beispieldatensätze für openQCA

Drei kleine, lehrtaugliche Datensätze zum Einstieg in die Qualitative Comparative
Analysis (QCA). Sie sind so aufgebaut, dass man mit ihnen den kompletten
openQCA-Arbeitsablauf durchspielen kann: Rohwerte kalibrieren, eine Truth Table
bauen, Konsistenz und Coverage lesen, boolesch minimieren und die Lösung
interpretieren.

> **Wichtiger Hinweis zur Herkunft.**
> **Alle drei Datensätze sind vollständig synthetisch und rein illustrativ.**
> Fallnamen, Zahlenwerte und Zusammenhänge wurden für Lehrzwecke erfunden. Sie
> stammen **nicht** aus realen Erhebungen und sind **keiner** realen Studie,
> Publikation oder Autorin/Autor zuzuordnen. Wo unten auf eine "klassische
> Fragestellung" (Zusammenhang von wirtschaftlicher Entwicklung und Stabilität
> von Demokratien) angespielt wird, ist damit nur das allgemeine *Thema* gemeint,
> das den Zahlen ein anschauliches Gewand gibt – nicht ein konkreter realer
> Datensatz.

Jede Datei hat eine Kopfzeile. Die **erste Spalte ist immer die Fall-Kennung**,
danach folgen die Bedingungen und als **letzte Spalte das Outcome**.

---

## 1. `rohwerte-demokratie.csv` – Rohwerte zum Selber-Kalibrieren

**Zweck:** Übung der **Kalibrierung**. Die Werte sind *Rohdaten* (Prozente und
Indizes), noch **nicht** in Fuzzy-Set-Zugehörigkeiten übersetzt. Man wählt selbst
Anker (voll draußen / Kreuzungspunkt / voll drinnen) und kalibriert z. B. mit der
direkten Methode.

**Fälle (16):** erfundene Länder – Nordheim, Westalia, Kuestenland, Seeland,
Alpenstaat, Inselstaat, Flusstal, Ebenland, Mittelreich, Ostmark, Bergland,
Huegelland, Waldenburg, Sudland, Steppenland, Marschland.

**Bedingungen (Rohwerte):**

| Spalte | Bedeutung | Skala |
|---|---|---|
| `BIP_pKopf` | Wohlstand (BIP pro Kopf) | ~250–1200 (fiktive Einheiten) |
| `URBANISIERUNG` | Anteil Stadtbevölkerung | 0–100 % |
| `ALPHABETISIERUNG` | Alphabetisierungsrate | 0–100 % |
| `INDUSTRIEANTEIL` | Anteil Industriebeschäftigung | 0–100 % |

**Outcome:**

| Spalte | Bedeutung | Skala |
|---|---|---|
| `DEMOKRATIE_INDEX` | Stabilität der Demokratie | 0–100 (Index) |

**Geeignet für:** direkte Kalibrierung (`calibrateDirect`), Vergleich linear vs.
logistisch, Diskussion der Ankerwahl (Theorie vs. Datenverteilung), Schiefe.
Beispiel-Anker für `BIP_pKopf`: voll draußen = 300, Kreuzung = 600, voll drinnen
= 1000. Der Fall **Mittelreich** (hoher Wohlstand, aber niedriger
Demokratie-Index) und **Ostmark** (eher niedrige Entwicklung, mittlere Stabilität)
eignen sich als lehrreiche Abweichungen.

---

## 2. `fuzzy-sets-beispiel.csv` – bereits kalibrierte Fuzzy-Sets

**Zweck:** Direkt in **Truth Table und Minimierung** einsteigen, ohne vorher zu
kalibrieren. Alle Werte liegen bereits als Fuzzy-Set-Zugehörigkeit in **[0, 1]**
vor. Kein Wert liegt exakt auf 0,5 – das **0,5-Problem** tritt hier bewusst nicht
auf, damit die Zuordnung zu den Konfigurationen eindeutig ist.

**Fälle (14):** `Fall_01` … `Fall_14`.

**Bedingungen (Fuzzy, [0,1]):**

| Spalte | Bedeutung |
|---|---|
| `WOHLSTAND` | Zugehörigkeit zur Menge "wohlhabend" |
| `BILDUNG` | Zugehörigkeit zur Menge "hohes Bildungsniveau" |
| `STAATSKAPAZITAET` | Zugehörigkeit zur Menge "leistungsfähiger Staat" |

**Outcome:**

| Spalte | Bedeutung |
|---|---|
| `DEMOKRATIE` | Zugehörigkeit zur Menge "stabile Demokratie" |

**Geeignet für:** Sufficiency-Analyse, Konsistenz/Coverage/PRI, komplexe vs.
sparsame Lösung. Mit Frequenz-Cutoff = 1 und **Konsistenz-Cutoff = 0,85** ergibt
sich eine klare, intuitive Lösung (mit dem openQCA-Rechenkern reproduziert):

- **Sparsame Lösung:** `STAATSKAPAZITAET + WOHLSTAND*BILDUNG`
  (Solution-Coverage ≈ 0,95, Solution-Konsistenz ≈ 0,99)
- **Komplexe Lösung:** `~WOHLSTAND*~BILDUNG*STAATSKAPAZITAET + WOHLSTAND*BILDUNG`

Also: eine stabile Demokratie entsteht, wenn **entweder** der Staat leistungsfähig
ist **oder** Wohlstand und Bildung gemeinsam hoch sind.

> **Lehrreicher Nebeneffekt:** Senkt man den Konsistenz-Cutoff auf 0,80, rutscht
> ein grenzwertiger Pfad (`BILDUNG` allein, Zeilen-Konsistenz ≈ 0,82) in die
> Lösung. Ein gutes Beispiel dafür, dass die Cutoff-Wahl das Ergebnis verändert.

---

## 3. `crisp-sets-beispiel.csv` – rein binäre Daten (0/1)

**Zweck:** **Crisp-Set-QCA** (csQCA). Alle Bedingungen und das Outcome sind
strikt binär (0 = abwesend, 1 = anwesend). Ideal, um die boolesche Minimierung
"von Hand" nachzuvollziehen und mit dem Rechenkern zu vergleichen.

**Fälle (14):** `Start_01` … `Start_14` (fiktive Start-ups).

**Bedingungen (binär):**

| Spalte | Bedeutung |
|---|---|
| `FOERDERUNG` | öffentliche Förderung vorhanden |
| `TEAM` | starkes Gründungsteam |
| `MARKT` | klare Marktnachfrage |
| `KONKURRENZ` | starke Konkurrenz |

**Outcome:**

| Spalte | Bedeutung |
|---|---|
| `ERFOLG` | Start-up erfolgreich |

**Geeignet für:** csQCA-Grundlagen, Primimplikanten, essenzielle
Primimplikanten, komplexe vs. sparsame Lösung. Der Datensatz ist
widerspruchsfrei (keine zwei Fälle mit gleicher Konfiguration und
unterschiedlichem Outcome). Mit Frequenz-Cutoff = 1 und Konsistenz-Cutoff = 1,0
ergibt sich (mit dem openQCA-Rechenkern reproduziert):

- **Sparsame Lösung:** `FOERDERUNG*TEAM + MARKT*~KONKURRENZ`
  (Coverage = 1,0, Konsistenz = 1,0)
- **Komplexe Lösung:** `MARKT*~KONKURRENZ + FOERDERUNG*TEAM*~MARKT`

Also: Erfolg entsteht, wenn **entweder** Förderung und starkes Team
zusammenkommen **oder** Marktnachfrage bei schwacher Konkurrenz besteht.

---

## Spaltenkonvention (für den Import)

- Spalte 1: Fall-Kennung (Text, eindeutig)
- Spalten 2…n-1: Bedingungen
- Spalte n: Outcome
- Dezimaltrennzeichen: Punkt (`.`)
- Feldtrennzeichen: Komma (`,`)
- Kodierung: UTF-8

Diese Beispieldaten dürfen frei für Lehre, Tests und Demos verwendet, verändert
und weitergegeben werden.
