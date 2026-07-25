# Changelog

Alle nennenswerten Änderungen an openQCA. Format angelehnt an
[Keep a Changelog](https://keepachangelog.com/de/1.1.0/); Versionierung nach
[Semantic Versioning](https://semver.org/lang/de/).

Eine Regel gilt für jeden Eintrag: **Was nicht extern validiert ist, wird hier nicht als
validiert beschrieben.** Der genaue Stand steht in [`VALIDATION.md`](VALIDATION.md).

## [Unveröffentlicht]

### Hinzugefügt
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
- `scripts/README.md` — Übersicht über die vier Prüfskripte und die R-Orakel.

### Geändert
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
- Kopfzeile der App lief auf schmalen Viewports über (nur auf Linux-Schriftmetrik sichtbar).
- MIT-Lizenz ohne eingetragenen Rechteinhaber; Platzhalter-Kontakte in `SECURITY.md` und
  `CODE_OF_CONDUCT.md`.

### Bekannt und offen
- **Intermediäre Lösung (ESA):** zwei dokumentierte Abweichungen vom R-Paket, beide aus
  derselben Ursache — der Auswahl der einfachen Counterfactuals. Die Konstruktion ist
  geklärt (Minimierung über positive Minterme ∪ einfache Counterfactuals), die
  Klassifikationsregel nicht. Konservative und sparsame Lösung sind nicht betroffen.
  Analyse in [`VALIDATION.md`](VALIDATION.md).

## [0.1.0] — 2026-07-16

Erste öffentliche Version: local-first Web-App mit geführtem QCA-Ablauf, abhängigkeitsfreier
TypeScript-Rechenkern, Kreuzvalidierung gegen das R-Paket `QCA`, Protokoll- und R-Export,
zweisprachige Oberfläche (DE/EN).
