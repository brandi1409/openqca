# openQCA v0.2.0

Zweite öffentliche Version. Schwerpunkt: Methodenlücken schließen, die eine
ernsthafte Nutzung blockierten — und die Oberfläche so aufräumen, dass ein
Ergebnis nicht nur richtig, sondern auch richtig lesbar ist.

## Methodik

- **Notwendigkeit von Disjunktionen (SUIN) und RoN**, gegen `superSubset` aus dem
  R-Paket `QCA` kreuzvalidiert.
- **Fall-Diagnostik je Lösungspfad** nach Schneider & Rohlfing: typische Fälle,
  *deviant consistency in kind* und *in degree*, IIR und *deviant coverage*.
  Interner Snapshot — kein externes Orakel verfügbar.
- **XY-Plot für Lösungsterme**, umschaltbar zwischen Einzelbedingung, Pfad und
  Gesamtlösung.
- **Lipset** als kanonischer Referenzfall in der Kreuzvalidierung. Die Daten
  liegen im GPL-lizenzierten R-Paket und werden nicht mitgeliefert, sondern
  lokal erzeugt.

## Validierung

Die Kreuzvalidierung gegen das R-Paket `QCA` umfasst **25 Szenarien, davon 23
identisch**. Die zwei Abweichungen betreffen die intermediäre Lösung, haben
dieselbe analysierte Ursache und sind offen dokumentiert
([Issue #1](https://github.com/brandi1409/openqca/issues/1),
[`VALIDATION.md`](VALIDATION.md)). Ein Wächter im Prüfskript schlägt fehl, sobald
eine dokumentierte Abweichung unbemerkt verschwindet; ein zweiter prüft, dass die
öffentlichen Zahlenangaben dem tatsächlichen Validierungsergebnis entsprechen.

**Zurückgenommen:** Die Berufung auf das Robustness-Protokoll von Oana &
Schneider — dessen Kennzahlen RF_incl, RF_cov und RF_case sind *nicht*
implementiert.

## Oberfläche

- Ergebnisse rechnen sofort; die vollständige Dokumentation schaltet die
  Replikationsartefakte frei, statt das Rechnen zu sperren.
- Schritt 3 als Akkordeon: von gut vier Bildschirmhöhen auf eine.
- Befund vor Material — Notwendigkeit, SUIN und Lösungen sagen, was gefunden
  wurde, statt nur Tabellen zu zeigen.
- Kein grünes Häkchen, solange die Kalibrierung nicht begründet ist.
- Ankergriffe auch auf Touch bedienbar (Trefferfläche ≥ 44px, maschinell
  geprüft).

## Zitierbarkeit

Zitierhinweis in App und Bericht mit Autor, Titel, Version und BibTeX. Ein DOI
wird erst ausgegeben, wenn es ihn gibt — siehe [`RELEASING.md`](RELEASING.md).

## Für Entwickler

`@openqca/engine` ist als eigenständiges npm-Paket installierbar;
`npm run check:engine-package` installiert das Tarball in ein leeres Projekt und
ruft die Funktionen auf.

Vollständige Liste: [`CHANGELOG.md`](CHANGELOG.md).
