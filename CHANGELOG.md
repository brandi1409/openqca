# Changelog

Alle nennenswerten Änderungen an openQCA. Format angelehnt an
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/); Versionierung nach
[Semantic Versioning](https://semver.org/lang/de/).

Eine Regel gilt für jeden Eintrag: **Was nicht extern validiert ist, wird hier nicht als
validiert beschrieben.** Der genaue Stand steht in [`VALIDATION.md`](VALIDATION.md).

## [Unveröffentlicht]

### Hinzugefügt
- **ESA-Korpus als Untersuchungswerkzeug** (`scripts/r-oracle/esa-corpus.R`,
  `scripts/esa-solution-check.mjs`, `scripts/esa-rule-check.mjs`): Statt Regeln zu raten
  und an Einzelszenarien zu messen, wird R systematisch befragt — jede Aufteilung der
  Ecken eines Drei-Bedingungen-Würfels in positive, negative und Remainder, jede
  Kombination von Richtungserwartungen.

- **Forschungsfragen-zentrierter Arbeitsraum.** Die bisherige Sechs-Schritte-Navigation ist durch
  fünf kontrollierte Ziele ersetzt: Antwort, Forschungsdesign, Entscheidungen, Evidenz und
  Prüfpaket. Ein bestätigbarer Research Brief, ein priorisierter Decision Ledger und eine
  fallbasierte Hauptaussage binden Ergebnisse sichtbar an Frage und Fälle.
- **Gemeinsames Defense-Gate.** Berichtsvorschau und berechenbare Ergebnisse bleiben früh
  verfügbar; JSON, Rohdaten, Markdown und R-Skript werden erst zusammen freigeschaltet, wenn
  Forschungsdesign, aktive Set-Kalibrierungen und wertgebundene Analyseentscheidungen bestätigt
  sind. Demo-Daten bleiben grundsätzlich gesperrt.
- **Geschlossener KI-Review-Vertrag V2.** Forschungsfrage, Set-Definition und jeweils eine
  ausgewählte Analysebegründung besitzen eigene strikt typisierte Antwortformen. Nur eine
  ausdrücklich übernommene `ok`-Empfehlung ersetzt genau dieses Feld; parallele Änderungen
  machen den Vorschlag ungültig und jede Übernahme hebt die menschliche Bestätigung auf.
- **Prüfbare KI-Schreibprovenienz.** Lokale und Cloud-Projekte sowie Bericht, JSON- und
  Markdown-Protokoll dokumentieren Provider, Modell, Erzeugungszeitpunkt und SHA-256-Hashes
  des vorherigen und übernommenen Texts, ohne diese Texte in der Provenienz zu duplizieren.

### Geändert

- **Explizites Fortsetzen statt Autoload.** Autosave bleibt bestehen, aber kompatible lokale
  V1-/V2-Projekte werden beim Einstieg nur als Resume-Kandidat mit Speicherzeitpunkt angeboten.
  `?demo=1` bleibt ein direkter Lehrmodus.

### Korrigiert
- **Reichweite der ESA-Abweichung erstmals gemessen.** Über 13.216 Konstellationen
  (drei Bedingungen, bis zu drei positive Ecken, alle Erwartungskombinationen) stimmt die
  intermediäre Lösung in **86,3 %** der Fälle mit dem R-Paket überein. Bisher war die
  Abweichung nur als „zwei Szenarien" beschrieben; betroffen ist rund ein Siebtel aller
  Konstellationen. Konservative und sparsame Lösung sind unverändert nicht betroffen.
- **Zwei eigene Auswertungsfehler behoben.** Der Korpus-Export verschmolz mehrere
  intermediäre Modelle über `unlist()` zu einer flachen Termliste; und die Zahl
  „1.792 von 1.792" war als Beleg für einen Regelkandidaten angeführt, obwohl die
  bestehende Implementierung dort denselben Wert erreicht — der Teilkorpus mit einer
  positiven Ecke kann die Regeln gar nicht unterscheiden.
- **Ein Denkfehler in der ESA-Analyse ist ausgeräumt.** R's `$EC` ist eine *Ausgabe* —
  die einfachen Counterfactuals, die die fertige Lösung nutzt —, nicht die Einstufung
  aller Vereinfachungsannahmen. Regelkandidaten dagegen zu prüfen misst das falsche
  Ziel; das war der Fehler der beiden früheren Anläufe. Belastbarer Maßstab ist die
  Lösung selbst. Einzelheiten in [`VALIDATION.md`](VALIDATION.md).


## [0.2.0] — 2026-07-26

### Hinzugefügt
- **Notwendigkeit von Disjunktionen (SUIN) und RoN.** `necessarySupersets` prüft
  Konjunktionen und minimale Disjunktionen bis zu einer wählbaren Ordnung und weist inclN,
  covN und **RoN** (Relevance of Necessity) aus; RoN steht zusätzlich je Einzelbedingung.
  Sechs neue Szenarien (`nec_*`) sind gegen `superSubset` aus dem R-Paket `QCA`
  kreuzvalidiert — die Kreuzvalidierung umfasst damit **25 statt 19 Szenarien** (23 PASS,
  zwei unverändert dokumentierte ESA-Abweichungen). Notwendigkeit läuft über einen eigenen
  Vergleichspfad; die Modell-Vergleichslogik blieb unangetastet.
- **Fall-Diagnostik je Lösungspfad** (`caseDiagnostics`, Schneider & Rohlfing 2013/2016):
  typische Fälle, *deviant consistency in kind* und *in degree*, individuell irrelevante
  Fälle (IIR) sowie auf Lösungsebene *deviant coverage*. In der App kompakt an jeder
  Lösungskarte, zweisprachig. **Interner Snapshot** — kein externes Orakel verfügbar.
- **XY-Plot für Lösungsterme.** Die X-Achse lässt sich zwischen Einzelbedingung,
  Lösungspfad und Gesamtlösung umschalten; die Term-Zugehörigkeit kommt aus der Engine
  (`termMembership`), nicht aus einer zweiten Implementierung.
- **Lückenliste „Nicht abgedeckt gegenüber dem R-Paket `QCA`"** in `docs/ROADMAP.md`
  (mvQCA, temporale QCA, SA/ESA-Vollumfang, RF-Kennzahlen, PRI, Vier-Werte u. a.), mit
  Kurzfassung im README.
- **Lipset als kanonischer Referenzfall.** Die Kreuzvalidierung umfasst jetzt 19 statt 12
  Szenarien: ein konstruierter Modell-Ambiguitätsfall (4) und Ragins Lipset-Lehrbeispiel
  (3). Konservative und sparsame Lösung stimmen dort **exakt** mit dem R-Paket `QCA`
  überein. Die Lipset-Daten liegen im GPL-lizenzierten R-Paket und werden deshalb nicht
  mitgeliefert, sondern lokal erzeugt (`scripts/r-oracle/lipset-export.R`); fehlen sie,
  werden die Szenarien sichtbar übersprungen.
- **Herkunft automatischer Anker.** Beim Import gesetzte Perzentil-Anker sind als solche
  gekennzeichnet, bis der Nutzer einen Anker anfasst. Datengetriebene Schwellen sind in
  der QCA-Methodik keine Begründung.
- **„Vorläufig"-Marke an den Ergebniskarten**, solange die Kalibrierung nicht dokumentiert
  ist — dort, wo Screenshots entstehen, nicht nur am Export.
- **Zwei Wächter in der Kreuzvalidierung**: dokumentierte Abweichungen (`KNOWN_DIVERGENCES`)
  schlagen fehl, sobald sie unbemerkt verschwinden; öffentliche Zahlenangaben werden gegen
  das tatsächliche Validierungsergebnis geprüft.
- `@openqca/engine` ist als eigenständiges npm-Paket installierbar (gebautes `dist`,
  Typdeklarationen, eigenes README).
- **Zitierhinweis in App und Bericht.** Eine Karte am Ende von Schritt 6 und ein eigener
  Abschnitt im Bericht nennen Autor, Titel, Version und — sobald vorhanden — den DOI, dazu
  ein BibTeX-Eintrag zum Kopieren. Solange kein DOI existiert, sagt die App das ausdrücklich
  und verweist auf die Repository-Adresse; ein Platzhalter-DOI würde zitierfähig aussehen
  und ins Leere laufen.
- **`RELEASING.md` und `.zenodo.json`** — dokumentierter Release-Ablauf samt der Reihenfolge,
  auf die es ankommt: Zenodo muss vor dem Release verbunden sein, sonst wird kein DOI
  vergeben.
- **`scripts/check-engine-package.mjs`** — packt die Engine, installiert das Tarball in ein
  leeres Projekt und ruft die Funktionen auf. Ein durchlaufendes `npm pack` beweist nicht,
  dass ein Paket benutzbar ist.
- `scripts/README.md` — Übersicht über die vier Prüfskripte und die R-Orakel.

### Korrigiert
- **Robustheits-Behauptung zurückgenommen.** `docs/ROADMAP.md` berief sich auf das
  Robustness-Test-Protokoll von Oana & Schneider (doi 10.1177/00491241211036158), obwohl
  dessen Kennzahlen **RF_incl, RF_cov und RF_case nicht implementiert** sind.
  `runCombinedRobustnessGrid` rechnet ein Szenarien-/Cutoff-Raster und meldet
  Häufigkeitsanteile stabiler Ausdrücke — das steht jetzt so in Roadmap, `VALIDATION.md`,
  im Quelltext und in der Literaturangabe des Protokoll-Exports. Eine Ergänzung setzt
  `SetMethods::robustness()` als externes Orakel voraus, das hier nicht installiert ist.

### Geändert
- **Befund vor Material.** Notwendigkeit, SUIN und Lösungen nannten ihr Ergebnis
  nirgends — man musste es sich aus Tabellen selbst erschließen. Jetzt steht über jeder
  Tabelle, was gefunden wurde: Kandidaten der Notwendigkeitsanalyse namentlich, die
  SUIN-Kombinationen nach RoN sortiert und hinter einem Aufklapper (eine RoN-Schwelle wird
  bewusst nicht behauptet — die Literatur nennt keine), und über den drei Lösungen die
  Konvention, dass die intermediäre berichtet wird. Sind komplexe und intermediäre Lösung
  identisch, sagt die App das ausdrücklich, statt zwei gleiche Formeln kommentarlos
  nebeneinanderzustellen. Modell-Mehrdeutigkeit steht nicht mehr als 12-px-Grauzeile neben
  28-px-Kennzahlen, sondern als eigener Hinweis.
- **Häkchen nur, wenn es stimmt.** Die Schritte 3–5 trugen ein grünes „erledigt", während
  darunter „0 von 5 Sets dokumentiert" stand. Solange die Kalibrierung nicht begründet ist,
  bleibt die Ziffer stehen und der Schritt trägt „rechnet — vorläufig"; die
  Vorläufig-Marke nennt jetzt Grund und Weg statt nur eines Warnzeichens.
- **Schritt 3 als Akkordeon.** Fünf ausgeklappte Set-Karten waren gut vier Bildschirmhöhen
  lang; bei sechs bis acht Bedingungen war der Schritt nicht mehr bedienbar. Ein Set ist
  offen, die übrigen stehen als Zeile mit Rolle, Status, Herkunft und den gesetzten Ankern.
  Die deskriptive Statistik steht jetzt unter den Sets und eingeklappt — sie beschreibt die
  kalibrierten Werte und stand damit vor ihrer eigenen Ursache.
- **Ankergriffe auf Touch bedienbar.** Die Trefferfläche steckte im viewBox und schrumpfte
  auf 390px auf 12 CSS-Pixel. Jeder Griff reicht jetzt bis zur Mitte zum Nachbarn (≥ 44px,
  maschinell geprüft), Ziehen ist relativ zum Griff statt springend, und vertikales
  Scrollen über der Grafik bleibt möglich. Die Export-Buttons lagen auf schmalen Breiten
  auf der Plotfläche und stehen jetzt darunter; die drei Anker brechen nicht mehr 2+1 um.
- **Flow umgekehrt: Ergebnisse sofort.** Notwendigkeit, Truth Table und Lösungen rechnen,
  sobald die Kalibrierung berechenbar ist — nicht erst, wenn sie vollständig dokumentiert
  ist. Die vollständige Dokumentation schaltet weiterhin die Replikationsartefakte frei
  (Protokoll-JSON, Rohdaten-CSV, Methoden-Markdown, R-Skript) und macht den Bericht
  publikationsreif. Schritt 3 startet in einer Schnell-Ansicht; die Kalibrier-Werkbank
  bleibt als zweite Ansicht erhalten.
- **Bericht immer erzeugbar**, mit Banner „Vorläufig" bzw. „Synthetische Lehrdaten — nicht
  zitierfähig" statt einer Sperre.
- Rollen-Heuristik ohne stille Deckelung: Jede numerische Nicht-Outcome-Spalte wird
  Bedingung; bei zu vielen Bedingungen für die Fallzahl warnt die App sichtbar
  (limited diversity), statt Spalten stillschweigend zu verwerfen.
- Genauigkeits-Behauptungen auf das Belegbare zurückgeschnitten (PRI ist **nicht** extern
  validiert; die Kalibrierung hat eine eigene Evidenzkette mit dokumentierter
  Restabweichung ≤ 0,01 bei der direkten Methode).

### Behoben
- Landing und App zeigten für denselben Datensatz unterschiedliche Lösungen
  (Konsistenz 0,972 gegen 0,809). Ursache war die stille Rollen-Deckelung; ein E2E-Test
  vergleicht beide Formeln jetzt bei jedem Lauf.
- `TOOL_VERSION = "0.0.0"` in jedem exportierten Protokoll und R-Skript.
- Ankerbeschriftungen nannten 0,05/0,95, während die Engine Ragins ±3-Logit-Fixpunkte
  ≈0,047/≈0,953 rechnet — in Bericht und Oberfläche korrigiert.
- Lehrbeispiel und Import-Platzhalter waren fest auf Englisch verdrahtet und erschienen so
  in der deutschen Oberfläche.
- Fall-Diagnostik: Legende, Erklärtext und Grenzfall-Hinweis erschienen bis zu sechsmal
  untereinander, weil sie je Lösungsmodell gerendert wurden und die sparsame Lösung
  mehrdeutig sein kann. Sie stehen jetzt einmal je Schritt; gleichwertige Modelle sind
  einklappbar, das erste ist offen.
- Kopfzeile der App lief auf schmalen Viewports über (nur auf Linux-Schriftmetrik sichtbar).
- MIT-Lizenz ohne eingetragenen Rechteinhaber; Platzhalter-Kontakte in `SECURITY.md` und
  `CODE_OF_CONDUCT.md`.

### Bekannt und offen
- **Intermediäre Lösung (ESA):** zwei dokumentierte Abweichungen vom R-Paket, beide aus
  derselben Ursache — der Auswahl der einfachen Counterfactuals. Die Konstruktion ist
  geklärt (Minimierung über positive Minterme ∪ einfache Counterfactuals), die
  Klassifikationsregel nicht. Konservative und sparsame Lösung sind nicht betroffen.
  Analyse in [`VALIDATION.md`](VALIDATION.md).
- **Robustness-Fit nach Oana & Schneider (RF_incl, RF_cov, RF_case):** nicht implementiert.
  Voraussetzung ist ein externes Orakel (`SetMethods::robustness()`), das lokal nicht
  installiert ist; ohne Kreuzvalidierung würden die Kennzahlen gegen die Regel oben
  verstoßen.
- **Fall-Diagnostik und Robustheitsraster** sind interne Snapshots, nicht extern validiert.

## [0.1.0] — 2026-07-16

Erste öffentliche Version: local-first Web-App mit geführtem QCA-Ablauf, abhängigkeitsfreier
TypeScript-Rechenkern, Kreuzvalidierung gegen das R-Paket `QCA`, Protokoll- und R-Export,
zweisprachige Oberfläche (DE/EN).
