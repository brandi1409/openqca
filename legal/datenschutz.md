> ⚠️ ENTWURF — kein Rechtsdokument. Vor Veröffentlichung von einer qualifizierten Person (Anwalt/Datenschutzbeauftragte) prüfen und mit echten Angaben füllen lassen.

# Datenschutzerklärung

Diese Datenschutzerklärung informiert über die Verarbeitung personenbezogener Daten bei der Nutzung der Anwendung „openQCA" (im Folgenden „openQCA", „wir" oder „uns"). openQCA ist eine quelloffene Web- und Desktop-Anwendung für die Qualitative Comparative Analysis (QCA).

> **Zentrale Aussage zur Architektur (bitte besonders prüfen):**
> openQCA ist bewusst **local-first** aufgebaut. Im **kostenlosen Tarif** bleiben alle Analyse- und Forschungsdaten **auf Ihrem Gerät** (im Browser bzw. in der Desktop-App). Es findet **keine serverseitige Verarbeitung Ihrer Forschungsdaten** statt. Personenbezogene Daten werden serverseitig nur verarbeitet, wenn Sie sich aktiv für den **kostenpflichtigen Cloud-Tarif** entscheiden und ein Konto anlegen.

---

## 1. Verantwortlicher

Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze der Mitgliedstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist:

**[PLATZHALTER: Name / Firma / Trägerorganisation]**
[PLATZHALTER: Anschrift]
[PLATZHALTER: Land]
E-Mail: [PLATZHALTER: datenschutz@example.org]

Siehe auch das [Impressum](./impressum.md).

## 2. Datenschutzbeauftragte(r)

[PLATZHALTER: Name und Kontaktdaten der/des Datenschutzbeauftragten — sofern eine Benennungspflicht nach Art. 37 DSGVO / § 38 BDSG besteht. Andernfalls: „Wir sind gesetzlich nicht verpflichtet, eine/n Datenschutzbeauftragte/n zu benennen." Bitte mit der prüfenden Person klären.]

## 3. Allgemeines zur Datenverarbeitung

Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung einer funktionsfähigen Anwendung sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung erfolgt regelmäßig nur nach Einwilligung der betroffenen Person oder wenn die Verarbeitung durch gesetzliche Vorschriften gestattet ist.

**Begriffe:** „Personenbezogene Daten" sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen (Art. 4 Nr. 1 DSGVO).

## 4. Die zwei Nutzungsmodelle im Überblick

openQCA lässt sich auf zwei grundlegend verschiedene Arten nutzen. Die datenschutzrechtlichen Folgen unterscheiden sich erheblich.

### 4.1 Kostenloser Tarif — local-first (kein Konto)

- Die Anwendung läuft **vollständig in Ihrem Browser** bzw. in der **installierten Desktop-Anwendung**.
- Ihre **Forschungsdaten** (Datensätze, Kalibrierungen, Wahrheitstafeln, Analyseprotokolle usw.) werden **ausschließlich lokal** gespeichert — z. B. im lokalen Speicher des Browsers (`localStorage`/`IndexedDB`) oder als Datei auf Ihrem Gerät.
- Es werden **keine Forschungsdaten an unsere Server oder an Dritte übertragen.**
- Es ist **kein Nutzerkonto** erforderlich.
- KI-Assistenzfunktionen stehen in diesem Tarif **nicht** zur Verfügung (weil diese zwingend eine Übertragung von Daten an einen externen Dienst erfordern würden — siehe Abschnitt 7.3).

**Wichtig:** Da Ihre Daten lokal liegen, sind **Sie selbst** für deren Sicherung und für den Schutz des Geräts verantwortlich. Beim Löschen der Browserdaten oder Deinstallation der App können lokal gespeicherte Analysen verloren gehen.

Für die reine Auslieferung der Web-Anwendung an Ihren Browser fallen technisch bedingt bestimmte Verarbeitungen beim Hosting-Anbieter an (siehe Abschnitt 6 zu Server-Logfiles und Abschnitt 7.4 zu Vercel).

### 4.2 Kostenpflichtiger Cloud-Tarif — mit Konto

Wenn Sie sich für den Cloud-Tarif entscheiden, verarbeiten wir bzw. unsere Auftragsverarbeiter zusätzlich personenbezogene Daten, um folgende Funktionen bereitzustellen:

- **Konto/Authentifizierung** (Registrierung, Login),
- **sichere Speicherung und Synchronisierung** Ihrer Analysedaten in der Cloud,
- **Kollaboration** (gemeinsames Arbeiten an Projekten, sofern genutzt),
- **KI-Assistenzfunktionen** (z. B. Unterstützung bei der Kalibrierung),
- **Zahlungsabwicklung** des Abonnements.

Die dabei eingesetzten Dienstleister und Rechtsgrundlagen sind in den Abschnitten 7 und 8 beschrieben.

## 5. Zugriff auf die Website / Bereitstellung der Anwendung

Beim Aufruf der Anwendung über den Browser werden durch den technisch notwendigen Verbindungsaufbau Daten an den Hosting-Anbieter (Vercel, siehe 7.4) übermittelt. Dazu gehören typischerweise:

- IP-Adresse des anfragenden Geräts,
- Datum und Uhrzeit des Zugriffs,
- angeforderte Ressource/URL,
- HTTP-Statuscode,
- übertragene Datenmenge,
- Referrer-URL (sofern übermittelt),
- Browsertyp, Browserversion und Betriebssystem (User-Agent).

**Zweck:** Auslieferung der Anwendung, Gewährleistung von Stabilität und Sicherheit (z. B. Abwehr von Angriffen).
**Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren, funktionsfähigen Bereitstellung).
**Speicherdauer:** [PLATZHALTER: konkrete Speicherdauer der Server-Logfiles beim Hosting-Anbieter angeben, z. B. „… Tage" — beim Anbieter erfragen und eintragen].

## 6. Lokale Speicherung (kostenloser Tarif) und Cookies

openQCA ist so gestaltet, dass der local-first-Kern in der Regel **nur technisch notwendige** lokale Speicherung benötigt. Details siehe [Cookie- und Speicher-Richtlinie](./cookie-consent.md).

- **Technisch notwendige lokale Speicherung** (z. B. `localStorage`/`IndexedDB` für Ihre Analysen, Spracheinstellung, Einwilligungsstatus): erforderlich für die Funktion; Rechtsgrundlage § 25 Abs. 2 TDDDG (technisch erforderlich) i. V. m. Art. 6 Abs. 1 lit. f DSGVO. Diese Daten verlassen Ihr Gerät nicht.
- **Optionale Cookies/Technologien** (Analyse, Reichweitenmessung, Marketing): nur mit Ihrer **Einwilligung** nach § 25 Abs. 1 TDDDG i. V. m. Art. 6 Abs. 1 lit. a DSGVO. [PLATZHALTER: Falls solche Dienste eingesetzt werden, hier jeweils einzeln benennen (Anbieter, Zweck, Speicherdauer, Empfänger, Drittlandbezug). Falls keine optionalen Cookies eingesetzt werden, diesen Punkt entsprechend anpassen.]

## 7. Empfänger und Auftragsverarbeiter im Cloud-Tarif

Die folgenden Dienstleister werden ausschließlich im **Cloud-Tarif** eingesetzt. Mit Auftragsverarbeitern wurde bzw. wird jeweils ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO geschlossen. Zu Übermittlungen in Drittländer siehe Abschnitt 8.

### 7.1 Supabase — Datenbank, Authentifizierung, Speicher

- **Anbieter:** [PLATZHALTER: Supabase, Inc., Anschrift eintragen]
- **Funktion:** Hosting der Postgres-Datenbank, Nutzer-Authentifizierung, Datei-/Objektspeicher.
- **Verarbeitete Daten:** Konto-/Anmeldedaten (z. B. E-Mail-Adresse, gehashtes Passwort bzw. Auth-Token), Ihre in der Cloud gespeicherten Analyse-/Projektdaten, Metadaten (z. B. Zeitstempel).
- **Zweck:** Bereitstellung von Konto, sicherer Speicherung, Synchronisierung und Kollaboration.
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — Bereitstellung des kostenpflichtigen Dienstes).
- **Rolle:** Auftragsverarbeiter (Art. 28 DSGVO).
- **Speicherort/Drittland:** [PLATZHALTER: konkrete Region/Serverstandort angeben; falls USA oder anderes Drittland, siehe Abschnitt 8].

### 7.2 Stripe — Zahlungsabwicklung

- **Anbieter:** [PLATZHALTER: Stripe Payments Europe, Ltd. (Irland) / Stripe, Inc. (USA) — zutreffende Vertragspartei und Anschrift eintragen].
- **Funktion:** Abwicklung von Zahlungen und Abonnements.
- **Verarbeitete Daten:** Zahlungs- und Rechnungsdaten (z. B. Name, E-Mail, Zahlungsmittel-/Kartendaten, Transaktions- und Abonnementdaten). **Vollständige Zahlungsdaten (z. B. Kartennummern) werden direkt von Stripe verarbeitet; wir selbst erhalten und speichern diese in der Regel nicht.**
- **Zweck:** Abwicklung des Bezahlvorgangs, Betrugsprävention, Erfüllung gesetzlicher (steuer-/handelsrechtlicher) Pflichten.
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung, z. B. Aufbewahrung von Rechnungen).
- **Rolle:** Empfänger / je nach Konstellation Auftragsverarbeiter oder eigenständig Verantwortlicher — [PLATZHALTER: mit prüfender Person klären].
- **Datenschutzhinweise des Anbieters:** [PLATZHALTER: Link zu Stripes Datenschutzerklärung].

### 7.3 Anthropic — KI-Assistenzfunktionen (Claude)

- **Anbieter:** [PLATZHALTER: Anthropic, PBC, Anschrift eintragen].
- **Funktion:** Bereitstellung KI-gestützter Assistenz (Modelle Claude Haiku 4.5 / Sonnet 5) über die Anthropic-API.
- **Verarbeitete Daten:** die **Inhalte, die Sie aktiv an die KI-Funktion übergeben** (z. B. Teile Ihres Datensatzes, Kalibrierungsangaben, Fragestellungen/Prompts) sowie die generierten Antworten.
- **Wichtiger Hinweis:** KI-Funktionen erfordern **zwingend die Übertragung der jeweiligen Eingabedaten an Anthropic**. Übergeben Sie daher **keine** personenbezogenen oder sensiblen Daten Dritter an die KI-Funktion, für die Sie keine Rechtsgrundlage haben. [PLATZHALTER: ggf. Hinweis auf Anonymisierung/Pseudonymisierung von Forschungsdaten ergänzen].
- **Zweck:** Erbringung der von Ihnen angeforderten KI-Assistenz.
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung im Cloud-Tarif) bzw. Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), soweit die Nutzung der KI-Funktion optional und einwilligungsbasiert ausgestaltet ist — [PLATZHALTER: tatsächliche Ausgestaltung festlegen].
- **Rolle:** Auftragsverarbeiter (Art. 28 DSGVO) — [PLATZHALTER: prüfen, ob AV-Vertrag/„Zero-Data-Retention"- bzw. Nicht-Training-Zusagen vorliegen und hier korrekt abgebildet sind].
- **Speicherort/Drittland:** [PLATZHALTER: i. d. R. USA — siehe Abschnitt 8].

### 7.4 Vercel — Hosting

- **Anbieter:** [PLATZHALTER: Vercel Inc., Anschrift eintragen].
- **Funktion:** Hosting und Auslieferung der Web-Anwendung (inkl. der unter Abschnitt 5 genannten Server-Logfiles).
- **Verarbeitete Daten:** technische Zugriffsdaten (siehe Abschnitt 5).
- **Zweck:** Bereitstellung, Stabilität und Sicherheit der Anwendung.
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) bzw. Art. 6 Abs. 1 lit. b DSGVO, soweit für die Vertragserfüllung erforderlich.
- **Rolle:** Auftragsverarbeiter (Art. 28 DSGVO).
- **Speicherort/Drittland:** [PLATZHALTER: Serverregion angeben; bei USA-Bezug siehe Abschnitt 8].

> Hinweis: Auch der **kostenlose Tarif** wird über Vercel ausgeliefert. Dabei fallen die technischen Zugriffsdaten aus Abschnitt 5 an. **Forschungsdaten** werden im kostenlosen Tarif jedoch **nicht** an Vercel oder andere Server übertragen.

## 8. Übermittlung in Drittländer (insb. USA)

Einige der oben genannten Dienstleister können personenbezogene Daten in Ländern außerhalb der EU/des EWR verarbeiten, insbesondere in den **USA**.

- Soweit ein Anbieter unter dem **EU-U.S. Data Privacy Framework (DPF)** zertifiziert ist, erfolgt die Übermittlung auf Grundlage eines Angemessenheitsbeschlusses der EU-Kommission (Art. 45 DSGVO). [PLATZHALTER: je Anbieter prüfen und Zertifizierungsstatus/Listeneintrag angeben].
- Andernfalls stützen wir die Übermittlung auf die **Standardvertragsklauseln** der EU-Kommission (Art. 46 Abs. 2 lit. c DSGVO) und ggf. ergänzende Schutzmaßnahmen. [PLATZHALTER: je Anbieter bestätigen].

Trotz dieser Garantien kann in Drittländern ein mit der EU vergleichbares Datenschutzniveau nicht in allen Fällen sichergestellt werden; insbesondere können Behörden Zugriffsmöglichkeiten haben. [PLATZHALTER: Angemessenheits-/SCC-Status je Dienst (Supabase, Stripe, Anthropic, Vercel) konkret dokumentieren.]

## 9. Speicherdauer

Wir verarbeiten und speichern personenbezogene Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.

- **Konto- und Cloud-Analysedaten:** für die Dauer des Vertragsverhältnisses; nach Kündigung/Löschung des Kontos Löschung bzw. Anonymisierung innerhalb von [PLATZHALTER: Frist].
- **Rechnungs-/Zahlungsdaten:** entsprechend den gesetzlichen Aufbewahrungsfristen (z. B. **10 Jahre** nach § 147 AO, **6 Jahre** nach § 257 HGB — [PLATZHALTER: konkret zuordnen]).
- **Server-Logfiles:** siehe Abschnitt 5 [PLATZHALTER].
- **Lokale Daten (kostenloser Tarif):** verbleiben bis zur Löschung durch Sie auf Ihrem Gerät; wir haben hierauf keinen Zugriff.

## 10. Ihre Rechte als betroffene Person

Ihnen stehen nach der DSGVO gegenüber dem Verantwortlichen folgende Rechte zu, soweit die gesetzlichen Voraussetzungen vorliegen:

- **Auskunft** (Art. 15 DSGVO),
- **Berichtigung** (Art. 16 DSGVO),
- **Löschung** (Art. 17 DSGVO),
- **Einschränkung der Verarbeitung** (Art. 18 DSGVO),
- **Datenübertragbarkeit** (Art. 20 DSGVO),
- **Widerspruch** gegen die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21 DSGVO),
- **Widerruf einer erteilten Einwilligung** mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO).

Zur Ausübung Ihrer Rechte genügt eine formlose Nachricht an: [PLATZHALTER: Kontakt-/Datenschutz-E-Mail].

**Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO):** Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts, Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes. Zuständige Behörde für den Verantwortlichen: [PLATZHALTER: zuständige Landes-/Bundesdatenschutzbehörde eintragen].

## 11. Pflicht zur Bereitstellung von Daten

Im **kostenlosen Tarif** ist die Bereitstellung personenbezogener Daten grundsätzlich nicht erforderlich. Im **Cloud-Tarif** ist die Bereitstellung bestimmter Daten (z. B. E-Mail-Adresse, Zahlungsdaten) für den Vertragsschluss und die Nutzung erforderlich; ohne diese Daten kann der kostenpflichtige Dienst nicht bereitgestellt werden.

## 12. Automatisierte Entscheidungsfindung / Profiling

Eine automatisierte Entscheidungsfindung mit rechtlicher Wirkung oder ähnlich erheblicher Beeinträchtigung nach Art. 22 DSGVO findet **nicht** statt. [PLATZHALTER: prüfen, ob dies auch für KI-Funktionen zutrifft — KI-Assistenz dient der Unterstützung, nicht einer verbindlichen automatisierten Entscheidung über Personen.]

## 13. Änderungen dieser Datenschutzerklärung

Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen umzusetzen. Für Ihren erneuten Besuch gilt die dann aktuelle Fassung.

---

*Stand des Entwurfs: [PLATZHALTER: Datum]. Diese Datenschutzerklärung ist ein Muster und ersetzt keine Rechtsberatung. Sämtliche Dienstleister-Angaben, Rechtsgrundlagen, Drittlandmechanismen und Fristen sind vor Veröffentlichung anhand der tatsächlichen Verträge (AV-Verträge, DPF-/SCC-Status) zu verifizieren.*
