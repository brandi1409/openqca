> ⚠️ ENTWURF — kein Rechtsdokument. Vor Veröffentlichung von einer qualifizierten Person (Anwalt/Datenschutzbeauftragte) prüfen und mit echten Angaben füllen lassen.

# Cookie- und Speicher-Richtlinie & Consent-Text

Diese Richtlinie erläutert, welche lokalen Speicher- und Cookie-Technologien openQCA verwendet und wie das Einwilligungs-Banner (Consent) gestaltet ist. Sie ergänzt die [Datenschutzerklärung](./datenschutz.md).

**Grundgedanke:** openQCA ist **local-first**. Der kostenlose Kern funktioniert allein mit **technisch notwendiger** lokaler Speicherung. Optionale Analyse- oder Marketing-Cookies sind für die Kernfunktion **nicht** erforderlich und werden — falls überhaupt eingesetzt — nur **nach ausdrücklicher Einwilligung** aktiviert.

---

## 1. Rechtlicher Rahmen

- **Technisch notwendige** Speicherung/Zugriffe: zulässig ohne Einwilligung nach § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich, um den vom Nutzer ausdrücklich gewünschten Dienst zur Verfügung zu stellen).
- **Nicht notwendige** (optionale) Speicherung/Zugriffe (Analyse, Reichweitenmessung, Marketing): nur mit **Einwilligung** nach § 25 Abs. 1 TDDDG i. V. m. Art. 6 Abs. 1 lit. a DSGVO. Die Einwilligung ist freiwillig, granular, informiert und jederzeit widerrufbar.

## 2. Kategorien

### 2.1 Technisch notwendig (keine Einwilligung erforderlich)

Diese Einträge liegen **ausschließlich lokal** auf Ihrem Gerät und werden nicht an Server übertragen.

| Name / Schlüssel | Zweck | Typ | Speicherdauer |
|---|---|---|---|
| [PLATZHALTER: z. B. `openqca_consent`] | Speichert Ihre Cookie-/Speicher-Entscheidung | localStorage | [PLATZHALTER: z. B. 12 Monate] |
| [PLATZHALTER: z. B. `openqca_locale`] | Spracheinstellung der Oberfläche | localStorage | [PLATZHALTER] |
| [PLATZHALTER: z. B. `openqca_projects` / IndexedDB-Store] | Lokale Speicherung Ihrer Analysen/Projekte (local-first) | IndexedDB | bis zur Löschung durch Sie |
| [PLATZHALTER: Session-/Auth-Token — nur Cloud-Tarif] | Angemeldet-Bleiben im Cloud-Tarif | Cookie/localStorage | [PLATZHALTER] |

> Die konkrete Liste ist an die tatsächliche Implementierung anzupassen. Jeder Eintrag, der nur im Cloud-Tarif gesetzt wird, ist entsprechend zu kennzeichnen.

### 2.2 Optional — Analyse / Statistik (nur mit Einwilligung)

[PLATZHALTER: Falls eine Reichweitenmessung/Analyse eingesetzt wird (z. B. Vercel Analytics, Plausible, Matomo o. Ä.), hier je Dienst angeben: Anbieter, Zweck, gesetzte Cookies/Kennungen, Speicherdauer, Empfänger, Drittlandbezug. **Falls nichts dergleichen eingesetzt wird: diese Kategorie streichen und im Banner keine Analyse-Option anzeigen.**]

### 2.3 Optional — Marketing (nur mit Einwilligung)

[PLATZHALTER: In der Regel für ein wissenschaftliches Open-Access-Tool nicht vorgesehen. Falls doch Marketing-/Retargeting-Technologien eingesetzt werden, hier je Dienst dokumentieren. Andernfalls diese Kategorie streichen.]

## 3. Consent-Banner — Textbausteine

### 3.1 Kurzform (Banner, erste Ebene)

> **Datenschutzeinstellungen**
> openQCA funktioniert local-first: Für den Betrieb nutzen wir nur technisch notwendige lokale Speicherung — Ihre Analysedaten bleiben auf Ihrem Gerät.
> [Nur falls optionale Dienste vorhanden:] Optional möchten wir mit Ihrer Einwilligung anonyme Nutzungsstatistiken erheben, um openQCA zu verbessern. Sie können frei entscheiden und Ihre Wahl jederzeit ändern.
>
> **[Nur notwendige]**  **[Auswahl anpassen]**  **[Alle akzeptieren]**

> Gestaltungshinweis: Die Schaltflächen „Nur notwendige" und „Alle akzeptieren" müssen **gleichwertig** (gleiche Sichtbarkeit/Gewichtung) sein. Optionale Kategorien sind standardmäßig **deaktiviert** (kein Vorankreuzen). Es darf keine Nutzungshürde („Cookie-Wall") für den notwendigen Kernbetrieb geben.

### 3.2 Detailebene (Auswahl anpassen)

> **Technisch notwendig** — immer aktiv
> Erforderlich, damit openQCA funktioniert (z. B. Speichern Ihrer Einstellungen und lokalen Analysen). Diese Daten verlassen Ihr Gerät nicht. *(nicht abwählbar)*
>
> **Statistik / Analyse** — [ ] optional *(nur anzeigen, falls tatsächlich eingesetzt)*
> Hilft uns zu verstehen, wie openQCA genutzt wird, um es zu verbessern. [PLATZHALTER: Anbieter/Zweck].
>
> **Marketing** — [ ] optional *(nur anzeigen, falls tatsächlich eingesetzt)*
> [PLATZHALTER: Zweck].
>
> **[Auswahl speichern]**

### 3.3 Hinweis zum Widerruf

> Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft ändern oder widerrufen — über den Link „Datenschutzeinstellungen" im Footer bzw. in den Einstellungen der App. Weitere Informationen finden Sie in unserer [Datenschutzerklärung](./datenschutz.md).

## 4. Verwaltung und Widerruf

- **Einstellungen ändern/widerrufen:** über den Link „Datenschutzeinstellungen" (Footer / App-Einstellungen). [PLATZHALTER: genauen Ort/Link einsetzen.]
- **Browserseitig löschen:** Sie können lokale Speicherung und Cookies jederzeit über Ihre Browsereinstellungen löschen. Beachten Sie, dass dadurch auch **lokal gespeicherte Analysen** (kostenloser Tarif) verloren gehen können.

---

*Stand des Entwurfs: [PLATZHALTER: Datum]. Diese Richtlinie ist ein Muster und ersetzt keine Rechtsberatung. Die Tabellen und Banner-Kategorien sind zwingend an die tatsächlich eingesetzten Technologien anzupassen; nicht genutzte Kategorien sind zu entfernen.*
