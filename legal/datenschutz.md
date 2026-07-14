> ⚠️ Diese Erklärung wurde sorgfältig erstellt, ersetzt aber keine Rechtsberatung; einzelne als [PRÜFEN] markierte Punkte sind zu verifizieren.

# Datenschutzerklärung

Diese Datenschutzerklärung informiert über die Verarbeitung personenbezogener Daten bei der Nutzung der Anwendung „openQCA" (https://openqca.vercel.app, im Folgenden „openQCA", „wir" oder „uns"). openQCA ist eine quelloffene Web-Anwendung (MIT-Lizenz) für die Qualitative Comparative Analysis (QCA).

> **Zentrale Aussage zur Architektur:**
> openQCA ist bewusst **local-first** aufgebaut. Im **kostenlosen Kern** verbleiben alle Analyse- und Forschungsdaten **in Ihrem Browser** — es findet **keine serverseitige Verarbeitung Ihrer Forschungsdaten** statt. Personenbezogene Daten werden serverseitig nur verarbeitet, wenn Sie sich aktiv für den **Cloud-Tarif** entscheiden und ein Konto anlegen.

---

## 1. Verantwortlicher

Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und des österreichischen Datenschutzgesetzes (DSG) ist:

**Wildensteiner e.U.**
Inhaber: John Brandauer
Buchbrunn 21, 9141 Eberndorf, Österreich
E-Mail: office@grillrocker.com
Telefon: +43 (0) 66762351730

Siehe auch das [Impressum](./impressum.md).

## 2. Datenschutzbeauftragter

Ein Datenschutzbeauftragter ist nicht benannt. Als kleines Einzelunternehmen ohne umfangreiche oder systematische Verarbeitung besonderer Datenkategorien gehen wir davon aus, dass keine Benennungspflicht nach Art. 37 DSGVO besteht. (Diese Einschätzung ist bei wesentlichen Änderungen des Verarbeitungsumfangs erneut zu prüfen.)

## 3. Allgemeines zur Datenverarbeitung

Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung einer funktionsfähigen Anwendung sowie unserer Inhalte und Leistungen erforderlich ist. Maßgeblich sind die DSGVO und ergänzend das österreichische Datenschutzgesetz (DSG). Die Verarbeitung erfolgt nur auf Grundlage einer gesetzlichen Erlaubnis oder Ihrer Einwilligung.

**Begriffe:** „Personenbezogene Daten" sind alle Informationen, die sich auf eine identifizierte oder identifizierbare natürliche Person beziehen (Art. 4 Nr. 1 DSGVO).

## 4. Die zwei Nutzungsmodelle im Überblick

### 4.1 Kostenloser Kern — local-first (kein Konto)

- Die Anwendung läuft **vollständig in Ihrem Browser**.
- Ihre **Forschungsdaten** (Datensätze, Kalibrierungen, Wahrheitstafeln, Analyseergebnisse) verbleiben **im Browser-Speicher der jeweiligen Sitzung** und werden **nicht an unsere Server oder an Dritte übertragen**.
- Lokal dauerhaft gespeichert werden nur zwei technisch notwendige Einträge im `localStorage`: Ihre Consent-Entscheidung und der Onboarding-Status (siehe Abschnitt 6).
- Es ist **kein Nutzerkonto** erforderlich.

**Wichtig:** Da Ihre Analysedaten nur in der Browser-Sitzung liegen, sind **Sie selbst** für deren Sicherung (z. B. Export) verantwortlich. Beim Schließen oder Neuladen des Browsers können nicht exportierte Analysen verloren gehen.

Für die reine Auslieferung der Web-Anwendung an Ihren Browser fallen technisch bedingt bestimmte Verarbeitungen beim Hosting-Anbieter an (siehe Abschnitte 5 und 7.1).

### 4.2 Cloud-Tarif — mit Konto

Wenn Sie ein Konto anlegen, verarbeiten wir bzw. unsere Auftragsverarbeiter zusätzlich personenbezogene Daten, um folgende Funktionen bereitzustellen:

- **Konto/Authentifizierung:** Bei der Anmeldung verarbeitet unser Dienstleister Supabase Ihre **E-Mail-Adresse** (Anmeldung per Magic Link, ohne Passwort).
- **Cloud-Speicherung von Projekten:** Gespeicherte Projekte (Projektname und Analysedaten als JSON) liegen in der Supabase-Datenbank. Der Zugriff ist per **Row-Level-Security** technisch so beschränkt, dass nur der jeweilige Account auf seine eigenen Projekte zugreifen kann.
- **KI-Assistenzfunktionen** (Anthropic API): **derzeit nicht aktiv** — siehe Abschnitt 7.3.
- **Zahlungsabwicklung** (Stripe): **derzeit nicht aktiv** — siehe Abschnitt 7.4.

## 5. Zugriff auf die Website / Bereitstellung der Anwendung

Beim Aufruf der Anwendung werden durch den technisch notwendigen Verbindungsaufbau Daten an den Hosting-Anbieter (Vercel, siehe 7.1) übermittelt. Dazu gehören typischerweise:

- IP-Adresse des anfragenden Geräts,
- Datum und Uhrzeit des Zugriffs,
- angeforderte Ressource/URL,
- HTTP-Statuscode,
- übertragene Datenmenge,
- Referrer-URL (sofern übermittelt),
- Browsertyp, Browserversion und Betriebssystem (User-Agent).

**Zweck:** Auslieferung der Anwendung, Gewährleistung von Stabilität und Sicherheit (z. B. Abwehr von Angriffen).
**Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren, funktionsfähigen Bereitstellung).
**Speicherdauer:** entsprechend den Aufbewahrungsvorgaben des Hosting-Anbieters. [PRÜFEN: konkrete Speicherdauer der Server-Logfiles bei Vercel dokumentieren.]

## 6. Lokale Speicherung im Browser und Cookies

openQCA verwendet **ausschließlich technisch notwendige** lokale Speicherung und **keine Analyse-, Statistik- oder Marketing-Cookies und kein Tracking**. Details siehe [Cookie- und Speicher-Richtlinie](./cookie-consent.md).

Konkret werden im `localStorage` Ihres Browsers gespeichert:

| Schlüssel | Zweck |
|---|---|
| `openqca_consent` | Speichert Ihre Entscheidung im Datenschutz-Hinweis (Consent) |
| `openqca_onboarding_dismissed` | Merkt sich, dass Sie die Einführung geschlossen haben |

Diese Einträge verlassen Ihr Gerät nicht.

**Rechtsgrundlage:** Für technisch unbedingt erforderliche Speicher- und Auslesevorgänge auf Ihrem Endgerät ist nach § 165 Abs. 3 TKG 2021 keine Einwilligung erforderlich; die zugehörige Datenverarbeitung stützt sich auf Art. 6 Abs. 1 lit. f DSGVO. Nicht notwendige Speicher- oder Auslesevorgänge (etwa für Analyse oder Marketing) würden nach § 165 Abs. 3 TKG 2021 i. V. m. Art. 6 Abs. 1 lit. a DSGVO Ihre Einwilligung voraussetzen — solche setzen wir **nicht** ein.

## 7. Empfänger und Auftragsverarbeiter

Mit Auftragsverarbeitern wird jeweils ein Vertrag zur Auftragsverarbeitung nach Art. 28 DSGVO geschlossen. Zu Übermittlungen in Drittländer siehe Abschnitt 8.

### 7.1 Vercel — Hosting

- **Anbieter:** Vercel Inc., USA.
- **Funktion:** Hosting und Auslieferung der Web-Anwendung (inkl. der unter Abschnitt 5 genannten Server-Logfiles).
- **Verarbeitete Daten:** technische Zugriffsdaten (siehe Abschnitt 5).
- **Zweck:** Bereitstellung, Stabilität und Sicherheit der Anwendung.
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
- **Rolle:** Auftragsverarbeiter (Art. 28 DSGVO).

> Hinweis: Auch der kostenlose Kern wird über Vercel ausgeliefert; dabei fallen die technischen Zugriffsdaten aus Abschnitt 5 an. **Forschungsdaten** werden jedoch **nicht** an Vercel übertragen.

### 7.2 Supabase — Datenbank und Authentifizierung (nur Cloud-Tarif)

- **Anbieter:** Supabase, Inc., USA (Projekt in EU-Region gehostet). [PRÜFEN: konkrete Supabase-Region dokumentieren.]
- **Funktion:** Postgres-Datenbank und Nutzer-Authentifizierung.
- **Verarbeitete Daten:** E-Mail-Adresse (Anmeldung per Magic Link), gespeicherte Projekte (Projektname und Analysedaten als JSON), technische Metadaten (z. B. Zeitstempel). Projekte sind per Row-Level-Security nur für den jeweiligen Account zugänglich.
- **Zweck:** Bereitstellung von Konto und Cloud-Speicherung.
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — Bereitstellung des Cloud-Dienstes).
- **Rolle:** Auftragsverarbeiter (Art. 28 DSGVO).

### 7.3 Anthropic — KI-Assistenzfunktionen (derzeit nicht aktiv)

KI-Funktionen sind in openQCA **derzeit nicht aktiv**. Bei Aktivierung gilt:

- **Anbieter:** Anthropic, PBC, USA.
- **Funktion:** KI-gestützte Assistenz über die Anthropic-API.
- **Verarbeitete Daten:** die Inhalte, die Sie aktiv an die KI-Funktion übergeben (z. B. Teile Ihres Datensatzes, Kalibrierungsangaben, Prompts) sowie die generierten Antworten.
- **Wichtiger Hinweis:** KI-Funktionen erfordern zwingend die Übertragung der jeweiligen Eingabedaten an Anthropic. Übergeben Sie daher keine personenbezogenen oder sensiblen Daten Dritter an die KI-Funktion, für die Sie keine Rechtsgrundlage haben; anonymisieren oder pseudonymisieren Sie Forschungsdaten nach Möglichkeit vorab.
- **Zweck:** Erbringung der von Ihnen angeforderten KI-Assistenz.
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) bzw. Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), soweit die KI-Funktion optional ausgestaltet ist.
- **Rolle:** Auftragsverarbeiter (Art. 28 DSGVO).

Vor Aktivierung werden diese Angaben aktualisiert und die Nutzer informiert.

### 7.4 Stripe — Zahlungsabwicklung (derzeit nicht aktiv)

Ein Bezahltarif ist **derzeit nicht aktiv**; es werden keine Zahlungsdaten verarbeitet. Bei Aktivierung gilt:

- **Anbieter:** Stripe Payments Europe, Ltd., Irland (ggf. unter Einbindung von Stripe, Inc., USA).
- **Funktion:** Abwicklung von Zahlungen und Abonnements.
- **Verarbeitete Daten:** Zahlungs- und Rechnungsdaten (z. B. Name, E-Mail-Adresse, Zahlungsmittel-, Transaktions- und Abonnementdaten). Vollständige Zahlungsdaten (z. B. Kartennummern) werden direkt von Stripe verarbeitet; wir selbst erhalten und speichern diese nicht.
- **Zweck:** Abwicklung des Bezahlvorgangs, Betrugsprävention, Erfüllung gesetzlicher (steuer- und unternehmensrechtlicher) Pflichten.
- **Rechtsgrundlage:** Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie Art. 6 Abs. 1 lit. c DSGVO (rechtliche Verpflichtung, z. B. Aufbewahrung von Rechnungen).
- **Rolle:** je nach Vorgang Auftragsverarbeiter oder eigenständig Verantwortlicher (insbesondere für die eigentliche Zahlungsabwicklung).

## 8. Übermittlung in Drittländer (insb. USA)

Einige der genannten Dienstleister verarbeiten personenbezogene Daten (auch) in den **USA** oder anderen Ländern außerhalb der EU/des EWR.

- Soweit ein Anbieter unter dem **EU-U.S. Data Privacy Framework (DPF)** zertifiziert ist, erfolgt die Übermittlung auf Grundlage des Angemessenheitsbeschlusses der EU-Kommission (Art. 45 DSGVO).
- Andernfalls stützen wir die Übermittlung auf die **Standardvertragsklauseln** der EU-Kommission (Art. 46 Abs. 2 lit. c DSGVO) und gegebenenfalls ergänzende Schutzmaßnahmen.

Der konkrete Zertifizierungsstatus ist je Anbieter zu verifizieren. [PRÜFEN: DPF-Status bzw. SCC-Grundlage je Dienst (Vercel, Supabase, bei Aktivierung auch Anthropic und Stripe) anhand der DPF-Liste und der AV-Verträge dokumentieren.]

Trotz dieser Garantien kann in Drittländern ein mit der EU vergleichbares Datenschutzniveau nicht in allen Fällen sichergestellt werden; insbesondere können dortige Behörden Zugriffsmöglichkeiten haben.

## 9. Speicherdauer

Wir verarbeiten und speichern personenbezogene Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.

- **Konto- und Cloud-Projektdaten:** für die Dauer der Kontonutzung; nach Löschung des Kontos werden die Daten gelöscht. [PRÜFEN: konkrete Löschfrist nach Kontolöschung festlegen und hier angeben.]
- **Rechnungs-/Zahlungsdaten (erst ab Aktivierung eines Bezahltarifs):** entsprechend den gesetzlichen Aufbewahrungsfristen, in Österreich grundsätzlich **7 Jahre** (§ 132 BAO, § 212 UGB).
- **Server-Logfiles:** siehe Abschnitt 5.
- **Lokale Daten im Browser:** verbleiben bis zur Löschung durch Sie auf Ihrem Gerät; wir haben hierauf keinen Zugriff.

## 10. Ihre Rechte als betroffene Person

Ihnen stehen nach der DSGVO gegenüber dem Verantwortlichen folgende Rechte zu, soweit die gesetzlichen Voraussetzungen vorliegen:

- **Auskunft** (Art. 15 DSGVO),
- **Berichtigung** (Art. 16 DSGVO),
- **Löschung** (Art. 17 DSGVO),
- **Einschränkung der Verarbeitung** (Art. 18 DSGVO),
- **Datenübertragbarkeit** (Art. 20 DSGVO),
- **Widerspruch** gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (Art. 21 DSGVO),
- **Widerruf einer erteilten Einwilligung** mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO).

Zur Ausübung Ihrer Rechte genügt eine formlose Nachricht an: **office@grillrocker.com**.

**Beschwerderecht (Art. 77 DSGVO):** Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, insbesondere in dem Mitgliedstaat Ihres Aufenthaltsorts, Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes. Für den Verantwortlichen zuständige Aufsichtsbehörde ist die **Österreichische Datenschutzbehörde** (www.dsb.gv.at).

## 11. Pflicht zur Bereitstellung von Daten

Im **kostenlosen Kern** ist die Bereitstellung personenbezogener Daten nicht erforderlich. Im **Cloud-Tarif** ist die Angabe einer E-Mail-Adresse für die Kontoerstellung erforderlich; ohne sie kann der Cloud-Dienst nicht bereitgestellt werden.

## 12. Automatisierte Entscheidungsfindung / Profiling

Eine automatisierte Entscheidungsfindung mit rechtlicher Wirkung oder ähnlich erheblicher Beeinträchtigung nach Art. 22 DSGVO findet **nicht** statt. Auch eine etwaige künftige KI-Assistenz dient ausschließlich der Unterstützung der Analyse und trifft keine automatisierten Entscheidungen über Personen.

## 13. Änderungen dieser Datenschutzerklärung

Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen (z. B. Aktivierung von KI-Funktionen oder Bezahltarif) abzubilden. Es gilt die jeweils aktuelle, hier veröffentlichte Fassung.

---

*Stand: Juli 2026.*
