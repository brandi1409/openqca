# Beobachtungsprotokoll für die erste openQCA-Sitzung

## Zweck und Grenze

Fünf formative **Erstnutzungs-Einzelsitzungen** prüfen, ob Forschende, die R
nicht für QCA verwenden, von einem sicheren Import zu einer vorläufigen Antwort,
bestätigten Entscheidungen und einem Defense-ready Replikationspaket gelangen.
Die Untersuchung bewertet die Oberfläche, nicht die Forschung der Teilnehmenden.
Die Schwellen sind Entscheidungshilfen für die nächste Produktiteration, keine Populationsschätzung
und kein Nachweis einer kausalen Wirkung.

Der ausführbare Sitzungsleitfaden, die zweisprachigen Einladungstexte, das
synthetische Importmaterial und der strikt kategorische Aggregationsweg liegen
in `research-session-kit.md`. `npm run research:template` erzeugt vor jeder
Sitzung genau eine fehlersicher vorbelegte Zeile; `npm run research:aggregate`
validiert sie, aktualisiert den laufenden Zwischenstand ausschließlich
authentifiziert verschlüsselt und löscht die Einzelsitzungsdatei erst danach.
Erst Sitzung fünf erzeugt die lesbare Kohortensumme und löscht den getrennten
Schlüssel.

## Stichprobe und Material

- fünf Forschende, jeweils 60 Minuten;
- mindestens zwei Sitzungen auf Deutsch und zwei auf Englisch;
- keine vorherige Nutzung, Ansicht, Demonstration oder Mitwirkung an openQCA;
- keine direkte Abhängigkeit vom Recruiter oder Moderator;
- ausschließlich bereitgestellte synthetische, nicht identifizierende Daten und
  vorformulierte Forschungsinhalte;
- keine Projekte, Dateien, Fallnamen, Rohdaten oder Texte der Teilnehmenden;
- keine Bildschirmaufnahme, Screenshots oder freien Beobachtungsnotizen.

Einwilligungsunterlagen werden getrennt aufbewahrt und besitzen keinen Schlüssel,
der sie mit Beobachtungsdaten verbinden könnte. Ohne ausdrückliche Einwilligung
endet die Sitzung vor jeder Aufzeichnung.

## Ablauf und zulässige Felder

### Einstieg und Aktivierung

Aufgabe: Die drei Einstiegspfade benennen, „Eigene Daten“ wählen, den
synthetischen Datensatz importieren, Rollen festlegen und eine berechnete Antwort
erreichen.

Zulässige Felder:

- `locale`: `de|en`
- `entry_paths_identified`: `0|1|2|3`
- `activation`: `complete|assisted|abandoned`
- `activation_time`: `under_5m|5_to_10m|over_10m`
- `activation_blocker`: `none|entry|import|roles|calibration|navigation|other`
- `first_destination`: `answer|research|decisions|evidence|defense`

### Forschungsdesign

Aufgabe: die fünf vorgegebenen Brief-Felder bearbeiten, Rollen prüfen, Brief
bestätigen und den Readiness-Hinweis finden.

Zulässige Felder:

- `brief_confirmation`: `complete|assisted|abandoned`
- `roles_understood`: `yes|partial|no`
- `brief_time`: `under_5m|5_to_10m|over_10m`
- `brief_blocker`: `none|field_meaning|role_selection|confirmation|navigation|other`

Feldinhalte werden niemals notiert.

### Entscheidungen

Aufgabe: die vorbereiteten Kalibrierungen dokumentieren und die drei
Analyseentscheidungen begründen und bestätigen. Anschließend erklären, wodurch
eine Bestätigung ungültig wird.

Zulässige Felder:

- `calibration_completion`: `complete|assisted|abandoned`
- `decision_completion`: `complete|assisted|abandoned` für den gesamten Block
  einschließlich der drei Analysebestätigungen
- `frequency_confirmation`: `0|1`
- `consistency_confirmation`: `0|1`
- `expectations_confirmation`: `0|1`
- `invalidation_understood`: `yes|partial|no`
- `decision_time`: `under_10m|10_to_20m|over_20m`
- `decision_blocker`: `none|calibration|rationale|confirmation|navigation|other`

Werte, Labels, Begründungen, Belege und Fallinformationen werden nicht notiert.

### Evidenz und Defense Pack

Aufgabe: Vorläufigkeit erkennen, die vorbereitete Dokumentation abschließen und
Defense readiness erreichen. Danach abgrenzen, ob openQCA eine kausale Aussage
oder lediglich ein prüfbares Paket behauptet.

Zulässige Felder:

- `evidence_visited`: `yes|no`
- `provisional_interpretation`: `correct|partial|incorrect`
- `defense_ready`: `complete|assisted|abandoned`
- `gate_interpretation`: `correct|partial|incorrect`
- `causal_interpretation`: `correct|partial|incorrect`
- `defense_time`: `under_5m|5_to_10m|over_10m`
- `defense_blocker`: `none|checklist|calibration_status|analysis_confirmation|navigation|other`

### AI-Helfer

Jede der drei Aufgaben wird getrennt mit der sichtbaren, synthetischen
Nutzlastvorschau geprüft:

- `brief_clarify`
- `calibration_evidence_gaps`
- `decision_rationale_review`

Zulässige Felder je Aufgabe:

- `payload_reviewed`: `yes|no`
- `request_outcome`: `returned|unavailable|declined|error`
- `helpfulness`: `helpful|mixed|not_helpful|not_observed`
- `human_review_boundary`: `yes|partial|no`
- `prohibited_output`: `none|numeric_recommendation|citation_or_source|causal_claim|raw_or_case_data|defense_assertion|other`
- `ai_time`: `under_2m|2_to_5m|over_5m`

`returned`, `unavailable` und `error` sind nur nach `payload_reviewed: yes`
zulässig. Provider, Modell, Nutzlast, Prompt, Antwort, Entwurf und
Übernahmehandlung werden nicht gespeichert. Bei einem verbotenen Output endet
die AI-Prüfung sofort.

## Aggregation und Löschung

Eine Beobachtungszeile der Schemaversion `v2` enthält ausschließlich die oben
definierten Kategorien. Nur eine abgeschlossene Sitzung wird in
eindimensionale Kohortenzähler sowie die vorab definierten Stop-Gate-Zähler
überführt und danach sofort gelöscht, spätestens innerhalb von 24 Stunden. Bei
Abbruch endet jede Erfassung; die Zeile wird gelöscht, nicht aggregiert und
nicht zu den fünf Sitzungen gezählt. `abandoned` bezeichnet ausschließlich ein
direkt beobachtetes Aufgabenergebnis, wenn die Person die Sitzung fortsetzt.
Nach der irreversiblen, nicht verknüpfbaren Aggregation einer abgeschlossenen
Sitzung kann ein Einzelbeitrag weder gefunden noch entfernt werden.

Vor Abschluss der fünf Sitzungen existiert der Zwischenstand nur authentifiziert
verschlüsselt unter einem getrennt geschützten, ausschließlich für diese Kohorte
erzeugten Schlüssel. Erst die vollständige Kohorte wird als lesbare Summe
ausgegeben; der Schlüssel wird dann gelöscht. Die lesbare Datei enthält keine
Zeilen, vollständigen Merkmalskombinationen oder explorativen Kreuztabellen. Es
gibt keine Namen, Konten, IP-Adressen, User-Agents, Geräte-, Sitzungs- oder
Einwilligungs-IDs, Zeitstempel, URLs, Referrer oder Freitextfelder. Ein vor
Rekrutierung freigegebener Autorisierungsnachweis bestimmt privaten Speicherort,
Zugriffsrolle, Verschlüsselung im Ruhezustand, Backup-Verbot oder zulässige
nicht-identifizierende Archivierung, Aufbewahrungsfrist, Löschzeitpunkt und
verantwortliche Person für die lesbare Summe sowie die getrennten Kontakt-,
Screening-, Termin- und Einwilligungsunterlagen.

## Produktmetriken ohne Forschungsinhalte

Falls später automatisierte Produktmessung eingeführt wird, benötigt sie eine
separate, freiwillige Einwilligung und eine vorherige Anpassung der
Datenschutzerklärung. Die bestehende Consent-Auswahl darf nicht umgedeutet
werden. Standard bleibt aus; Ablehnung verändert Analyse, Import, AI, Speichern
und Export nicht.

Zulässig ist höchstens eine flüchtig erzeugte Zusammenfassung pro Journey:

```text
schemaVersion: v1
event: journey_summary
period: YYYY-MM
locale: de|en
entry: learn|import|resume|unknown
activation: complete|incomplete
researchBrief: confirmed|not_confirmed
decisions: complete|incomplete
defense: ready|not_ready
outcome: defense_ready|abandoned|idle
ai.<task>: not_opened|previewed|sent|returned|unavailable|error
```

Unbekannte Felder werden abgewiesen. Verboten sind insbesondere Identifikatoren,
Datei- und Falldaten, Variablenlabels, Forschungsfragen, Brief- und
Begründungstexte, AI-Nutzlasten oder -Antworten, QCA-Werte, Fehlertexte,
Provider-/Modellwerte und Verknüpfungsschlüssel. Der Server verwirft die
Journey-Zusammenfassung unmittelbar nach der Validierung und erhöht ausschließlich
folgende voneinander getrennte Monatszähler:

- `journeys_total`
- `activation_complete`
- `activated_decisions_complete`
- `complete_decisions_defense_ready`
- je AI-Aufgabe `previewed`, `sent` und `returned`

Die vollständige Kategorienkombination wird weder gespeichert noch geloggt.
Kreuztabellen nach Locale, Einstieg oder AI-Verlauf sind unzulässig. Ergebnisse
werden erst ab einer Monatsbasis von mindestens fünf Journeys berichtet.

Abgeleitete Kennzahlen:

- Aktivierung = `activation_complete / journeys_total`;
- Entscheidungsabschluss = `activated_decisions_complete / activation_complete`;
- Defense readiness = `complete_decisions_defense_ready / activated_decisions_complete`;
- AI-Reichweite je Aufgabe = `sent / previewed`;
- AI-Verfügbarkeit je Aufgabe = `returned / sent`;
- AI-Hilfreichkeit stammt ausschließlich aus der aggregierten Beobachtung, nicht
  aus automatisierter Nutzung.

## Stop-Gates

- mindestens vier von fünf aktivieren ohne Hilfe;
- mindestens vier von fünf bestätigen alle Entscheidungen ohne Hilfe und
  erklären die Invalidierung korrekt;
- mindestens vier von fünf erreichen Defense readiness ohne Hilfe;
- alle fünf klassifizieren Vorläufigkeit, Prüfbarkeit des Pakets und die Grenze
  zu einer kausalen Behauptung jeweils korrekt;
- je AI-Aufgabe mindestens drei von fünf hilfreiche und mindestens vier von fünf
  hilfreiche oder gemischte nutzbare Antworten;
- null numerische Empfehlungen, erfundene Quellen, kausale Behauptungen,
  Roh-/Falldaten oder Defense-Zertifizierungen.

Jeder Verstoß gegen das letzte Gate blockiert die Ausweitung. Nach der Reparatur
werden das vollständige DE/EN-Goldset und die betroffene Beobachtungsstufe erneut
ausgeführt.

## Beleggebundene Iterationsentscheidung

Nach Sitzung fünf werden alle fehlgeschlagenen Gates samt Zähler in einem
separaten, nicht personenbezogenen Entscheidungsnachweis aufgeführt. Genau eine
kleinste behebbare Barriere wird in dieser festen Reihenfolge gewählt:

1. verbotener AI-Output oder Datenschutz-/Sicherheitsfehler;
2. fehlerhafte Grenze zwischen vorläufiger Antwort, prüfbarem Paket und
   kausaler Behauptung;
3. Import/Aktivierung, Entscheidungsabschluss oder Defense Readiness;
4. verfehlte DE/EN-Verteilung;
5. Zeit-, Blocker- und AI-Nützlichkeitsverteilungen nur als deskriptive
   Tie-Breaker.

Der Nachweis nennt Belegfelder, kleinsten Fix, verantwortliche Person,
Akzeptanzprüfung und die erneut auszuführende Beobachtungsstufe. Er darf keine
Motive, Prävalenz, Kausalwirkung oder nicht erhobene Teilnehmendenerklärungen
behaupten. Bestehen alle Gates, wird ausdrücklich kein evidenzgestützter
Produktfix ausgewählt.
