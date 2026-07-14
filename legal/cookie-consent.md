> ⚠️ Diese Richtlinie wurde sorgfältig erstellt, ersetzt aber keine Rechtsberatung; einzelne als [PRÜFEN] markierte Punkte sind zu verifizieren.

# Cookie- und Speicher-Richtlinie & Consent-Text

Diese Richtlinie erläutert, welche lokalen Speicher- und Cookie-Technologien openQCA verwendet und wie der Einwilligungs-Hinweis (Consent) gestaltet ist. Sie ergänzt die [Datenschutzerklärung](./datenschutz.md).

**Grundgedanke:** openQCA ist **local-first**. Die Anwendung nutzt ausschließlich **technisch notwendige** lokale Speicherung. Es werden **keine Analyse-, Statistik- oder Marketing-Cookies** gesetzt und **kein Tracking** eingesetzt.

---

## 1. Rechtlicher Rahmen

- **Technisch notwendige** Speicher- und Auslesevorgänge auf dem Endgerät: zulässig ohne Einwilligung nach **§ 165 Abs. 3 TKG 2021** (Telekommunikationsgesetz 2021), da sie unbedingt erforderlich sind, um den vom Nutzer ausdrücklich gewünschten Dienst bereitzustellen. Die zugehörige Datenverarbeitung stützt sich auf Art. 6 Abs. 1 lit. f DSGVO.
- **Nicht notwendige** Speicher- oder Auslesevorgänge (Analyse, Reichweitenmessung, Marketing) wären nur mit **Einwilligung** nach § 165 Abs. 3 TKG 2021 i. V. m. Art. 6 Abs. 1 lit. a DSGVO zulässig. **openQCA setzt derzeit keine solchen Technologien ein.**

## 2. Eingesetzte lokale Speicherung

### 2.1 Technisch notwendig (keine Einwilligung erforderlich)

Diese Einträge liegen **ausschließlich lokal** in Ihrem Browser und werden nicht an Server übertragen.

| Name / Schlüssel | Zweck | Typ | Speicherdauer |
|---|---|---|---|
| `openqca_consent` | Speichert Ihre Entscheidung im Datenschutz-Hinweis, damit er nicht bei jedem Besuch erneut erscheint | localStorage | bis zur Löschung durch Sie |
| `openqca_onboarding_dismissed` | Merkt sich, dass Sie die Einführung (Onboarding) geschlossen haben | localStorage | bis zur Löschung durch Sie |

**Analysedaten** (Datensätze, Kalibrierungen, Ergebnisse) werden im kostenlosen Kern nur im Browser-Speicher der jeweiligen **Sitzung** gehalten und nicht dauerhaft lokal abgelegt; sie verlassen Ihr Gerät nicht.

Im **Cloud-Tarif** setzt der Authentifizierungsdienst (Supabase) zusätzlich technisch notwendige Sitzungs-/Auth-Daten im Browser, damit Sie angemeldet bleiben. Auch diese sind für den gewünschten Dienst unbedingt erforderlich (§ 165 Abs. 3 TKG 2021).

### 2.2 Analyse / Statistik

**Nicht eingesetzt.** openQCA verwendet keine Reichweitenmessung, keine Analyse-Cookies und keine vergleichbaren Kennungen.

### 2.3 Marketing

**Nicht eingesetzt.** openQCA verwendet keine Marketing- oder Retargeting-Technologien.

## 3. Consent-Hinweis — Textbausteine

Da ausschließlich technisch notwendige Speicherung eingesetzt wird, ist keine Einwilligung erforderlich; der Hinweis dient der Transparenz.

### 3.1 Kurzform (erste Ebene)

> **Datenschutzhinweis**
> openQCA funktioniert local-first: Ihre Analysedaten bleiben in Ihrem Browser. Wir nutzen nur zwei technisch notwendige lokale Speichereinträge (Ihre Einstellung zu diesem Hinweis und den Onboarding-Status) — keine Analyse- oder Marketing-Cookies, kein Tracking.
>
> **[Verstanden]**  **[Mehr erfahren]**

### 3.2 Detailebene (Mehr erfahren)

> **Technisch notwendig** — immer aktiv
> Erforderlich, damit openQCA funktioniert: `openqca_consent` (Ihre Entscheidung zu diesem Hinweis) und `openqca_onboarding_dismissed` (Onboarding-Status). Diese Daten verlassen Ihr Gerät nicht. *(nicht abwählbar)*
>
> Weitere Kategorien (Statistik, Marketing) werden nicht verwendet.

> Gestaltungshinweis: Sollten künftig einwilligungspflichtige Technologien eingeführt werden, ist der Hinweis zu einem echten Consent-Banner auszubauen: gleichwertige Schaltflächen „Nur notwendige" und „Alle akzeptieren", optionale Kategorien standardmäßig deaktiviert, keine Nutzungshürde für den notwendigen Kernbetrieb.

## 4. Verwaltung und Löschung

- **Browserseitig löschen:** Sie können die lokale Speicherung jederzeit über Ihre Browsereinstellungen löschen (Website-Daten für openqca.vercel.app). Der Datenschutz-Hinweis erscheint danach erneut.
- **Analysedaten sichern:** Nicht exportierte Analysen der laufenden Sitzung gehen beim Schließen oder Neuladen des Browsers verloren — exportieren Sie Ihre Arbeit oder nutzen Sie den Cloud-Tarif.

Weitere Informationen finden Sie in unserer [Datenschutzerklärung](./datenschutz.md).

---

*Stand: Juli 2026. Diese Richtlinie ist bei jeder Änderung der tatsächlich eingesetzten Speichertechnologien anzupassen.*
