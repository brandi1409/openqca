import type { Locale } from "./locale";

/**
 * Deutsche Referenz-Strings = exakt die heutigen Texte der App (nicht
 * umformuliert). Der Schlüsselsatz von `de` ist maßgeblich; `en` muss ihn
 * über `Record<DictKey, string>` vollständig bedienen (TypeScript mahnt
 * fehlende oder überzählige Schlüssel an).
 *
 * Platzhalter im Format `{x}` werden von `t(locale, key, vars)` ersetzt —
 * so bleiben Strings mit Einschüben einfache Konstanten statt Funktionen.
 */
const de = {
  // -- Gemeinsam --------------------------------------------------------------
  "common.backToApp": "← zurück zur App",

  // -- Sprachumschalter -------------------------------------------------------
  "toggle.ariaLabel": "Sprache umschalten",

  // -- Kopfzeile --------------------------------------------------------------
  "header.tagline": "Qualitative Comparative Analysis — lokal & reproduzierbar",
  "header.methodik": "Methodik",
  "header.tarife": "Tarife",
  "header.download": "Download",

  // -- Landing (Startseite) ---------------------------------------------------
  "landing.nav.funktionen": "Funktionen",
  "landing.nav.methodik": "Methodik",
  "landing.nav.tarife": "Tarife",
  "landing.nav.download": "Download",
  "landing.nav.startApp": "App starten",
  "landing.nav.ariaPrimary": "Hauptnavigation",

  "landing.hero.badge": "Open Source (MIT) · Local-first · Reproduzierbar",
  "landing.hero.title": "Das offene, geführte Werkzeug für Qualitative Comparative Analysis.",
  "landing.hero.subline":
    "Geführte Kalibrierung mit einem Coach, der typische Fehler abfängt, und ein reproduzierbares Protokoll für jede Analyse. Ihre Forschungsdaten bleiben im Browser.",
  "landing.hero.ctaPrimary": "Kostenlos analysieren",
  "landing.hero.ctaSecondary": "Beispiel ansehen",
  "landing.hero.facts": "Validierte Engine · 26 Tests · R-Skript-Export · PDF-Bericht",

  "landing.features.title": "Funktionen",
  "landing.features.calib.title": "Geführte Kalibrierung",
  "landing.features.calib.desc":
    "Live-Coach prüft Schiefe, das 0,5-Problem und Grenzfälle direkt an Ihren Fällen.",
  "landing.features.truth.title": "Truth Table & drei Lösungstypen",
  "landing.features.truth.desc":
    "Komplexe, intermediäre (mit Richtungserwartungen) und sparsame Lösung — sauber getrennt.",
  "landing.features.robust.title": "Robustheit & negiertes Outcome",
  "landing.features.robust.desc":
    "Konsistenz-Cutoff-Sweep und eine separate Analyse für das Ausbleiben des Outcomes (~Y).",
  "landing.features.repro.title": "Reproduzierbarkeit",
  "landing.features.repro.desc":
    "Jede Analyse als Protokoll (JSON) und als äquivalentes R-Skript für das QCA-Paket.",
  "landing.features.report.title": "Bericht als PDF",
  "landing.features.report.desc":
    "Ein druckfähiger Analysebericht mit allen Kennzahlen — direkt aus dem Browser.",
  "landing.features.local.title": "Local-first & Open Source",
  "landing.features.local.desc":
    "Daten bleiben im Browser, kein Upload im Gratis-Kern. Quelloffen unter MIT-Lizenz.",

  "landing.steps.title": "In drei Schritten",
  "landing.steps.step1.title": "Daten laden",
  "landing.steps.step1.desc": "CSV/XLSX importieren oder einen Beispiel-Datensatz wählen.",
  "landing.steps.step2.title": "Kalibrieren",
  "landing.steps.step2.desc": "Rohwerte in Fuzzy-Sets übersetzen — der Coach hilft.",
  "landing.steps.step3.title": "Lösungen & Bericht",
  "landing.steps.step3.desc": "Truth Table minimieren, interpretieren und exportieren.",

  "landing.privacy.title": "Ihre Forschungsdaten bleiben Ihre",
  "landing.privacy.body":
    "Der Gratis-Kern rechnet vollständig lokal in Ihrem Browser — kein Upload, keine Übertragung. Nur wer möchte, nutzt den optionalen Cloud-Tarif mit eigenem Konto für Speicherung und Sync.",
  "landing.privacy.li1": "Kein Tracking",
  "landing.privacy.li2": "DSGVO-orientiert",
  "landing.privacy.li3.pre": "Rechtliches: ",
  "landing.privacy.li3.impressum": "Impressum",
  "landing.privacy.li3.datenschutz": "Datenschutz",

  "landing.pricing.title": "Tarife",
  "landing.pricing.free.name": "Gratis",
  "landing.pricing.free.desc": "Alles fürs Publizieren: Analysekern, Protokoll, R-Export, PDF-Bericht.",
  "landing.pricing.cloud.name": "Cloud",
  "landing.pricing.cloud.desc": "Konto, Sync und KI-Assistenten (bald) — für alle, die mehr brauchen.",
  "landing.pricing.allDetails": "Alle Details",

  "landing.download.title": "openQCA lokal nutzen",
  "landing.download.body":
    "Als installierbare Web-App — nach dem ersten Besuch offline nutzbar. Eigenständige Desktop-Apps sind in Vorbereitung.",
  "landing.download.cta": "Zum Download",

  "landing.cta.title": "Starten Sie Ihre erste reproduzierbare QCA-Analyse.",
  "landing.cta.button": "App starten",

  // -- Download-Seite -----------------------------------------------------------
  "download.back": "← zurück",
  "download.title": "openQCA lokal nutzen",
  "download.intro":
    "Der Gratis-Kern rechnet vollständig in Ihrem Browser (local-first). Installiert als App ist openQCA nach dem ersten Besuch auch ohne Internetverbindung nutzbar — Ihre Daten bleiben auf Ihrem Gerät.",

  "download.install.title": "Als App installieren (empfohlen)",
  "download.install.button": "openQCA installieren",
  "download.install.offlineNote":
    "Nach dem ersten Besuch offline nutzbar — Ihre Daten bleiben auf dem Gerät.",
  "download.install.guidesIntro": "Kein Installations-Button zu sehen? So geht's manuell:",
  "download.install.chrome.title": "Chrome / Edge (Desktop)",
  "download.install.chrome.desc":
    "Installieren-Symbol in der Adressleiste anklicken — oder Menü → „openQCA installieren“.",
  "download.install.safari.title": "Safari (macOS)",
  "download.install.safari.desc": "Ablage → „Zum Dock hinzufügen…“.",
  "download.install.ios.title": "iOS (Safari)",
  "download.install.ios.desc": "Teilen-Symbol → „Zum Home-Bildschirm“.",
  "download.install.android.title": "Android (Chrome)",
  "download.install.android.desc": "Menü (⋮) → „App installieren“.",

  "download.desktop.title": "Desktop-Apps (macOS/Windows)",
  "download.desktop.status": "In Vorbereitung",
  "download.desktop.body":
    "Signierte, eigenständige Installer (auf Basis von Tauri) sind in Vorbereitung. Bis dahin deckt die installierte Web-App den lokalen, offline-fähigen Einsatz vollständig ab.",

  "download.source.title": "Quellcode",
  "download.source.body":
    "openQCA ist Open Source (MIT-Lizenz). Die Veröffentlichung des Repositories ist in Vorbereitung.",

  // -- Startzustand / Hero ----------------------------------------------------
  "hero.title": "Das offene, geführte Werkzeug für Qualitative Comparative Analysis.",
  "hero.desc":
    "openQCA führt durch Kalibrierung, Truth Table und Minimierung — mit einem Coach, der typische Fehler abfängt, und einem Protokoll, das jede Analyse reproduzierbar macht. Kostenlos, Open Source (MIT), und Ihre Daten bleiben im Browser.",

  "load.title": "Daten laden",
  "load.desc":
    "Lade den Demo-Datensatz, wähle unten ein Beispiel oder importiere eine eigene CSV-Datei. Alles rechnet lokal in diesem Browser; nichts wird übertragen.",
  "load.demoBtn": "Demo-Datensatz laden",
  "load.importBtn": "CSV/XLSX importieren…",
  "load.hint":
    "CSV: Kopfzeile + Fälle, Komma oder Semikolon, oder Excel (.xlsx). Alle Beispieldaten sind synthetisch.",
  "examples.title": "Beispiel-Datensätze",

  // -- Import-Fehler (alert) --------------------------------------------------
  "alert.csvError": "CSV konnte nicht gelesen werden: {msg}",
  "alert.xlsxError": "Excel-Datei konnte nicht gelesen werden: {msg}",
  "alert.unknown": "unbekannt",

  // -- Datenbereich (mit geladenem Datensatz) ---------------------------------
  "data.reloadBtn": "Anderen Datensatz laden (CSV/XLSX)",
  "data.title": "Daten · {n} Fälle",
  "descriptives.title": "Deskriptive Statistik (kalibrierte Sets)",

  // -- Kalibrierung -----------------------------------------------------------
  "calib.title": "Kalibrierung, die mitdenkt",
  "calib.desc":
    "Rohwerte werden zu Fuzzy-Set-Zugehörigkeit. Der Coach prüft jede Entscheidung live gegen deine Fälle.",
  "calib.anchorOut": "Voll draußen → 0,05",
  "calib.anchorCross": "Kreuzung → 0,50",
  "calib.anchorIn": "Voll drinnen → 0,95",
  "calib.badOrder": "Anker müssen aufsteigend sein: voll draußen < Kreuzung < voll drinnen.",
  "calib.atHalf.count": "{n} Fall/Fälle liegen genau bei 0,5",
  "calib.atHalf.rest":
    "({labels}) — solche Fälle fallen aus der Truth Table. Verschieb den Kreuzungspunkt leicht.",
  "calib.atHalf.okBold": "Kein Fall liegt exakt auf 0,5.",
  "calib.atHalf.okRest": "Alle Fälle bleiben in der Analyse.",
  "calib.skew.bold": "Stark schiefes Set.",
  "calib.skew.rest": "{hi} von {total} „drinnen“ — das Set unterscheidet kaum.",
  "calib.skew.okBold": "Ausgewogene Verteilung.",
  "calib.skew.okRest": "{hi} drinnen / {lo} draußen.",
  "calib.nearCross.bold": "{n} Grenzfall/-fälle nahe 0,5:",
  "calib.nearCross.rest": "{list} — hier lohnt eine Robustheitsprüfung.",
  "calib.ai.badge": "✨ KI-Assistent",
  "calib.ai.plan": "Cloud-Tarif",
  "calib.ai.anchors": "Anker aus Beschreibung vorschlagen",
  "calib.ai.skew": "Verteilung erklären",
  "calib.ai.methods": "Methoden-Absatz entwerfen",
  "calib.curve.axis": "{variable} (Rohwert) → Zugehörigkeit",

  // -- Truth Table ------------------------------------------------------------
  "tt.title": "Truth Table",
  "tt.conditions": "Bedingungen",
  "tt.outcome": "Outcome",
  "tt.freqCut": "Frequenz-Cutoff",
  "tt.consCut": "Konsistenz-Cutoff",
  "tt.unassignedWarn":
    "Achtung: {n} Fall/Fälle nicht zugeordnet (Zugehörigkeit 0,5). Kalibrierung anpassen.",
  "tt.col.n": "n",
  "tt.col.consistency": "Konsistenz",
  "tt.col.pri": "PRI",
  "tt.col.out": "OUT",
  "tt.col.cases": "Fälle",
  "tt.hint":
    "{observed} beobachtete Konfigurationen, {remainders} Remainder. OUT = 1, wenn n ≥ {freqCut} und Konsistenz ≥ {consCut}.",

  // -- Lösungen ---------------------------------------------------------------
  "sol.complex.title": "Komplexe (konservative) Lösung",
  "sol.intermediate.title": "Intermediäre Lösung",
  "sol.parsimonious.title": "Sparsame (parsimonious) Lösung",
  "sol.none": "Keine Konfiguration erfüllt die Cutoffs — keine Lösung.",
  "sol.kpi.consistency": "Lösungs-Konsistenz",
  "sol.kpi.coverage": "Lösungs-Coverage",
  "sol.col.path": "Pfad",
  "sol.col.rawCov": "Raw Cov.",
  "sol.col.uniqueCov": "Unique Cov.",
  "sol.col.consistency": "Konsistenz",
  "sol.exp.label": "Richtungserwartungen (nur einfache Counterfactuals)",
  "sol.exp.present": "anwesend",
  "sol.exp.absent": "abwesend",
  "sol.exp.either": "offen",
  "sol.exp.hint":
    "Zwischen komplexer und sparsamer Lösung: nur theoriekonforme (einfache) Vereinfachungsannahmen.",
  "sol.pars.hint": "Remainder werden als Vereinfachungsannahmen zugelassen.",
  "nec.title": "Notwendige Bedingungen",
  "nec.col.condition": "Bedingung",
  "nec.col.consistency": "Konsistenz",
  "nec.col.coverage": "Coverage",
  "nec.candidate": "≥ 0,9 — Kandidat",
  "nec.hint":
    "Konvention: Konsistenz ≥ 0,9 als Hinweis auf Notwendigkeit — mit Coverage und Fallkenntnis interpretieren.",

  // -- Robustheit -------------------------------------------------------------
  "robustness.title": "Robustheit — Konsistenz-Cutoff-Sweep",
  "rob.error": "Robustheitsanalyse nicht verfügbar: {msg}",
  "rob.noResults": "Keine Sweep-Ergebnisse verfügbar.",
  "rob.sweepFailed": "Sweep konnte nicht berechnet werden.",
  "rob.col.cutoff": "Cutoff",
  "rob.col.paths": "Pfade",
  "rob.col.solConsistency": "Lösungs-Konsistenz",
  "rob.col.solCoverage": "Lösungs-Coverage",
  "rob.col.parsimonious": "Sparsame Lösung",
  "rob.stable": "Die Lösung ist über den geprüften Cutoff-Bereich stabil.",
  "rob.change":
    "Die Lösung wechselt bei Cutoff {cutoff} von {from} zu {to} — die Cutoff-Wahl ist hier folgenreich und sollte begründet werden.",

  // -- Negiertes Outcome ------------------------------------------------------
  "neg.heading": "Negiertes Outcome ({label})",
  "neg.intro":
    "QCA ist asymmetrisch: Eine Lösung für Y erklärt nicht automatisch das Fehlen von Y. Deshalb wird hier dieselbe Analyse separat für {label} durchgeführt, indem die Outcome-Zugehörigkeit jedes Falls durch 1 − y ersetzt wird.",
  "neg.complex": "Komplexe Lösung",
  "neg.parsimonious": "Sparsame Lösung",
  "neg.none": "Keine Konfiguration erfüllt die Cutoffs für {label}.",
  "neg.solConsistency": "Lösungs-Konsistenz",
  "neg.solCoverage": "Lösungs-Coverage",
  "neg.error": "Fehler bei der Berechnung von {label}: {msg}",
  "neg.calcErrorUnknown": "Unbekannter Fehler bei der Berechnung von ~Y.",

  // -- XY-Plot ----------------------------------------------------------------
  "xy.title": "XY-Plot (Suffizienz)",
  "xy.hint":
    "Punkte oberhalb der Diagonale stützen „X ist hinreichend für Y“. Konsistenz & Coverage stehen über dem Plot.",
  "xyplot.kpi.consistency": "Konsistenz (Hinreichendheit)",
  "xyplot.kpi.coverage": "Coverage",
  "xyplot.aria":
    "Fuzzy-Set-XY-Plot: {x} (X) gegen {y} (Y), {n} Fälle, Achsen 0 bis 1",

  // -- Protokoll --------------------------------------------------------------
  "proto.title": "Analyseprotokoll",
  "proto.desc":
    "Reproduzierbar: exportierbar als JSON und als äquivalentes R-Skript für das QCA-Paket.",
  "proto.downloadBtn": "Protokoll als JSON herunterladen",

  // -- Bericht ----------------------------------------------------------------
  "report.title": "Bericht",
  "report.desc": "Öffnet einen druckfähigen Bericht (PDF über den Druckdialog).",
  "report.missingData":
    "Für den Bericht fehlen noch Daten (Truth Table & Lösungen berechnen).",
  "report.generateBtn": "Bericht erzeugen (Druck/PDF)",

  // -- Deskriptive Statistik (Tabelle) ---------------------------------------
  "desc.col.variable": "Variable",
  "desc.col.n": "N",
  "desc.col.min": "Minimum",
  "desc.col.median": "Median",
  "desc.col.mean": "Mittelwert",
  "desc.col.max": "Maximum",

  // -- Onboarding -------------------------------------------------------------
  "onboarding.aria": "Kurzeinführung: In drei Schritten zur QCA-Lösung",
  "onboarding.closeAria": "Kurzeinführung schließen",
  "onboarding.eyebrow": "Erste Schritte",
  "onboarding.heading": "In drei Schritten zur QCA-Lösung",
  "onboarding.step1.title": "Daten laden",
  "onboarding.step1.detail": "Beispiel wählen oder eigene CSV importieren.",
  "onboarding.step2.title": "Kalibrieren",
  "onboarding.step2.detail": "Rohwerte in Fuzzy-Sets übersetzen – der Coach hilft.",
  "onboarding.step3.title": "Truth Table & Lösungen",
  "onboarding.step3.detail": "Konfigurationen minimieren und interpretieren.",

  // -- Beispiel-Datensätze ----------------------------------------------------
  "ex.rohwerte.title": "Rohwerte Demokratie",
  "ex.rohwerte.badge": "Rohwerte",
  "ex.rohwerte.desc":
    "16 erfundene Länder mit Rohwerten (Prozente und Indizes) – zum Selber-Kalibrieren.",
  "ex.fuzzy.title": "Fuzzy-Sets Beispiel",
  "ex.fuzzy.badge": "Fuzzy [0,1]",
  "ex.fuzzy.desc":
    "14 Fälle, bereits als Fuzzy-Zugehörigkeit in [0,1] – direkt zu Truth Table und Minimierung.",
  "ex.crisp.title": "Crisp-Sets Beispiel",
  "ex.crisp.badge": "Crisp 0/1",
  "ex.crisp.desc":
    "14 fiktive Start-ups, alle Werte strikt binär (0/1) – Grundlage für csQCA.",
  "ex.meta": "{cases} Fälle · {conditions} Bedingungen",
  "ex.synthetic": "synthetisch",
  "ex.error": "Beispiel-Datensatz konnte nicht geladen werden.",

  // -- KI-Assistent -----------------------------------------------------------
  "ai.contextPlaceholder": "Inhaltliche Beschreibung (optional) …",
  "ai.unavailable": "KI nicht verfügbar.",
  "ai.networkError": "Netzwerkfehler beim KI-Aufruf.",

  // -- Cloud / Konto-Widget ---------------------------------------------------
  "cloud.notConfigured": "Cloud-Tarif · nicht konfiguriert",
  "cloud.signOut": "Abmelden",
  "cloud.signIn": "Anmelden",
  "cloud.linkSent": "Link an {email} gesendet.",
  "cloud.emailPlaceholder": "E-Mail",
  "cloud.magicLink": "Magic Link",
  "cloud.saveLoadHint": "Anmelden, um Projekte in der Cloud zu speichern (Cloud-Tarif).",
  "cloud.saveBtn": "In Cloud speichern",
  "cloud.projectNamePrompt": "Projektname:",
  "cloud.projectNameDefault": "Meine QCA-Analyse",
  "cloud.saveError": "Fehler beim Speichern.",
  "cloud.saveOk": "Gespeichert.",
  "cloud.loadPlaceholder": "Projekt laden…",

  // -- Footer -----------------------------------------------------------------
  "footer.navAria": "Rechtliches und Dokumentation",
  "footer.methodik": "Methodik",
  "footer.impressum": "Impressum",
  "footer.datenschutz": "Datenschutz",
  "footer.agb": "AGB",
  "footer.note": "© {year} openQCA · Open Source (MIT)",

  // -- Consent-Banner ---------------------------------------------------------
  "consent.title": "Datenschutzeinstellungen",
  "consent.descPre":
    "openQCA funktioniert local-first: Für den Betrieb nutzen wir nur technisch notwendige lokale Speicherung – Ihre Analysedaten bleiben auf Ihrem Gerät. Details in unserer ",
  "consent.descLink": "Datenschutzerklärung",
  "consent.necessary": "Nur notwendige",
  "consent.acceptAll": "Alle akzeptieren",

  // -- Tarife (preise) --------------------------------------------------------
  "pricing.title": "Tarife",
  "pricing.intro":
    "Der komplette Analysekern ist und bleibt kostenlos — im Browser und als Download. Bezahlt wird nur, was echte Kosten verursacht: sichere Cloud-Speicherung und die KI-Assistenten.",
  "pricing.free.tag": "Gratis · für immer",
  "pricing.free.name": "openQCA Local",
  "pricing.free.price": "0 €",
  "pricing.free.li1": "Voller Analysekern & geführte Kalibrierung",
  "pricing.free.li2": "Truth Table, Minimierung, XY-Plots",
  "pricing.free.li3": "Reproduzierbarkeits-Protokoll & R-Export",
  "pricing.free.li4": "Daten bleiben zu 100 % auf dem Gerät",
  "pricing.free.li5": "Website & Desktop-App",
  "pricing.cloud.tag": "Cloud-Tarif",
  "pricing.cloud.name": "openQCA Cloud",
  "pricing.cloud.price": "Abo",
  "pricing.cloud.li1": "Sichere Projekt-Datenbank & Sync",
  "pricing.cloud.li2": "KI-Assistent: Anker, Interpretation",
  "pricing.cloud.li3": "KI entwirft den Methoden-Absatz",
  "pricing.cloud.li4": "Geteilte Projekte & Kollaboration",
  "pricing.cta.monthly": "Monatlich abonnieren",
  "pricing.cta.institution": "Institutions-Lizenz",
  "pricing.cta.soon": "Bald verfügbar",
  "pricing.soonNote":
    "Der Cloud-Bezahltarif startet in Kürze. Bis dahin ist der komplette Analysekern kostenlos nutzbar — inklusive Konto und Cloud-Speicherung.",
  "pricing.checkoutUnavailable": "Checkout nicht verfügbar.",
  "pricing.networkError": "Netzwerkfehler.",

  // -- Konto ------------------------------------------------------------------
  "account.title": "Konto",
  "account.checkoutSuccess":
    "Danke — dein Cloud-Abo ist aktiv (nach Verarbeitung durch Stripe kann es einen Moment dauern).",
  "account.notConfigured":
    "Die Cloud-Funktionen (Konto, Sync, KI) sind in dieser Instanz noch nicht konfiguriert. Der kostenlose Analysekern funktioniert vollständig ohne Konto.",
  "account.signedInPre": "Angemeldet als ",
  "account.viewPricing": "Tarife ansehen →",
  "account.signInPrompt":
    "Melde dich an, um Projekte in der Cloud zu speichern und KI-Funktionen zu nutzen.",
} as const;

export type DictKey = keyof typeof de;

const en: Record<DictKey, string> = {
  // -- Common -----------------------------------------------------------------
  "common.backToApp": "← back to the app",

  // -- Language toggle --------------------------------------------------------
  "toggle.ariaLabel": "Switch language",

  // -- Header -----------------------------------------------------------------
  "header.tagline": "Qualitative Comparative Analysis — local & reproducible",
  "header.methodik": "Methodology",
  "header.tarife": "Pricing",
  "header.download": "Download",

  // -- Landing (home page) ----------------------------------------------------
  "landing.nav.funktionen": "Features",
  "landing.nav.methodik": "Methodology",
  "landing.nav.tarife": "Pricing",
  "landing.nav.download": "Download",
  "landing.nav.startApp": "Launch app",
  "landing.nav.ariaPrimary": "Primary navigation",

  "landing.hero.badge": "Open source (MIT) · Local-first · Reproducible",
  "landing.hero.title": "The open, guided tool for Qualitative Comparative Analysis.",
  "landing.hero.subline":
    "Guided calibration with a coach that catches common mistakes, and a reproducible protocol for every analysis. Your research data stays in the browser.",
  "landing.hero.ctaPrimary": "Analyze for free",
  "landing.hero.ctaSecondary": "See an example",
  "landing.hero.facts": "Validated engine · 26 tests · R-script export · PDF report",

  "landing.features.title": "Features",
  "landing.features.calib.title": "Guided calibration",
  "landing.features.calib.desc":
    "A live coach checks skew, the 0.5 problem and borderline cases directly against your cases.",
  "landing.features.truth.title": "Truth table & three solution types",
  "landing.features.truth.desc":
    "Complex, intermediate (with directional expectations) and parsimonious solution — cleanly separated.",
  "landing.features.robust.title": "Robustness & negated outcome",
  "landing.features.robust.desc":
    "Consistency cutoff sweep and a separate analysis for the absence of the outcome (~Y).",
  "landing.features.repro.title": "Reproducibility",
  "landing.features.repro.desc":
    "Every analysis as a protocol (JSON) and as an equivalent R script for the QCA package.",
  "landing.features.report.title": "PDF report",
  "landing.features.report.desc":
    "A print-ready analysis report with all metrics — straight from the browser.",
  "landing.features.local.title": "Local-first & open source",
  "landing.features.local.desc":
    "Data stays in the browser, no upload in the free core. Open source under the MIT license.",

  "landing.steps.title": "In three steps",
  "landing.steps.step1.title": "Load data",
  "landing.steps.step1.desc": "Import CSV/XLSX or pick an example dataset.",
  "landing.steps.step2.title": "Calibrate",
  "landing.steps.step2.desc": "Translate raw values into fuzzy sets — the coach helps.",
  "landing.steps.step3.title": "Solutions & report",
  "landing.steps.step3.desc": "Minimize the truth table, interpret and export.",

  "landing.privacy.title": "Your research data stays yours",
  "landing.privacy.body":
    "The free core computes entirely locally in your browser — no upload, no transmission. Only if you want to, you can use the optional cloud plan with your own account for storage and sync.",
  "landing.privacy.li1": "No tracking",
  "landing.privacy.li2": "GDPR-oriented",
  "landing.privacy.li3.pre": "Legal: ",
  "landing.privacy.li3.impressum": "Imprint",
  "landing.privacy.li3.datenschutz": "Privacy policy",

  "landing.pricing.title": "Pricing",
  "landing.pricing.free.name": "Free",
  "landing.pricing.free.desc": "Everything for publishing: analysis core, protocol, R export, PDF report.",
  "landing.pricing.cloud.name": "Cloud",
  "landing.pricing.cloud.desc": "Account, sync and AI assistants (soon) — for those who need more.",
  "landing.pricing.allDetails": "All details",

  "landing.download.title": "Use openQCA locally",
  "landing.download.body":
    "As an installable web app — usable offline after the first visit. Standalone desktop apps are in preparation.",
  "landing.download.cta": "Go to download",

  "landing.cta.title": "Start your first reproducible QCA analysis.",
  "landing.cta.button": "Launch app",

  // -- Download page ------------------------------------------------------------
  "download.back": "← back",
  "download.title": "Use openQCA locally",
  "download.intro":
    "The free core runs entirely in your browser (local-first). Installed as an app, openQCA also works offline after your first visit — your data stays on your device.",

  "download.install.title": "Install as an app (recommended)",
  "download.install.button": "Install openQCA",
  "download.install.offlineNote":
    "Works offline after your first visit — your data stays on your device.",
  "download.install.guidesIntro": "No install button showing? Here's how to do it manually:",
  "download.install.chrome.title": "Chrome / Edge (desktop)",
  "download.install.chrome.desc":
    "Click the install icon in the address bar — or menu → \"Install openQCA\".",
  "download.install.safari.title": "Safari (macOS)",
  "download.install.safari.desc": "File → \"Add to Dock…\".",
  "download.install.ios.title": "iOS (Safari)",
  "download.install.ios.desc": "Share icon → \"Add to Home Screen\".",
  "download.install.android.title": "Android (Chrome)",
  "download.install.android.desc": "Menu (⋮) → \"Install app\".",

  "download.desktop.title": "Desktop apps (macOS/Windows)",
  "download.desktop.status": "In preparation",
  "download.desktop.body":
    "Signed, standalone installers (built on Tauri) are in preparation. Until then, the installed web app fully covers local, offline-capable use.",

  "download.source.title": "Source code",
  "download.source.body":
    "openQCA is open source (MIT license). Publishing the repository is in preparation.",

  // -- Landing / hero ---------------------------------------------------------
  "hero.title": "The open, guided tool for Qualitative Comparative Analysis.",
  "hero.desc":
    "openQCA walks you through calibration, the truth table and minimization — with a coach that catches common mistakes and a protocol that makes every analysis reproducible. Free, open source (MIT), and your data stays in the browser.",

  "load.title": "Load data",
  "load.desc":
    "Load the demo dataset, pick an example below, or import your own CSV file. Everything is computed locally in this browser; nothing is transmitted.",
  "load.demoBtn": "Load demo dataset",
  "load.importBtn": "Import CSV/XLSX…",
  "load.hint":
    "CSV: header row + cases, comma or semicolon, or Excel (.xlsx). All example data is synthetic.",
  "examples.title": "Example datasets",

  // -- Import errors (alert) --------------------------------------------------
  "alert.csvError": "Could not read the CSV file: {msg}",
  "alert.xlsxError": "Could not read the Excel file: {msg}",
  "alert.unknown": "unknown",

  // -- Data section (dataset loaded) ------------------------------------------
  "data.reloadBtn": "Load a different dataset (CSV/XLSX)",
  "data.title": "Data · {n} cases",
  "descriptives.title": "Descriptive statistics (calibrated sets)",

  // -- Calibration ------------------------------------------------------------
  "calib.title": "Calibration that thinks along",
  "calib.desc":
    "Raw values become fuzzy-set membership. The coach checks every decision live against your cases.",
  "calib.anchorOut": "Fully out → 0.05",
  "calib.anchorCross": "Crossover → 0.50",
  "calib.anchorIn": "Fully in → 0.95",
  "calib.badOrder": "Anchors must be ascending: fully out < crossover < fully in.",
  "calib.atHalf.count": "{n} case(s) lie exactly at 0.5",
  "calib.atHalf.rest":
    "({labels}) — such cases drop out of the truth table. Shift the crossover point slightly.",
  "calib.atHalf.okBold": "No case lies exactly at 0.5.",
  "calib.atHalf.okRest": "All cases remain in the analysis.",
  "calib.skew.bold": "Strongly skewed set.",
  "calib.skew.rest": "{hi} of {total} “in” — the set barely discriminates.",
  "calib.skew.okBold": "Balanced distribution.",
  "calib.skew.okRest": "{hi} in / {lo} out.",
  "calib.nearCross.bold": "{n} borderline case(s) near 0.5:",
  "calib.nearCross.rest": "{list} — a robustness check is worthwhile here.",
  "calib.ai.badge": "✨ AI assistant",
  "calib.ai.plan": "Cloud plan",
  "calib.ai.anchors": "Suggest anchors from description",
  "calib.ai.skew": "Explain the distribution",
  "calib.ai.methods": "Draft a methods paragraph",
  "calib.curve.axis": "{variable} (raw value) → membership",

  // -- Truth table ------------------------------------------------------------
  "tt.title": "Truth table",
  "tt.conditions": "Conditions",
  "tt.outcome": "Outcome",
  "tt.freqCut": "Frequency cutoff",
  "tt.consCut": "Consistency cutoff",
  "tt.unassignedWarn":
    "Note: {n} case(s) not assigned (membership 0.5). Adjust the calibration.",
  "tt.col.n": "n",
  "tt.col.consistency": "Consistency",
  "tt.col.pri": "PRI",
  "tt.col.out": "OUT",
  "tt.col.cases": "Cases",
  "tt.hint":
    "{observed} observed configurations, {remainders} remainders. OUT = 1 when n ≥ {freqCut} and consistency ≥ {consCut}.",

  // -- Solutions --------------------------------------------------------------
  "sol.complex.title": "Complex (conservative) solution",
  "sol.intermediate.title": "Intermediate solution",
  "sol.parsimonious.title": "Parsimonious solution",
  "sol.none": "No configuration meets the cutoffs — no solution.",
  "sol.kpi.consistency": "Solution consistency",
  "sol.kpi.coverage": "Solution coverage",
  "sol.col.path": "Path",
  "sol.col.rawCov": "Raw cov.",
  "sol.col.uniqueCov": "Unique cov.",
  "sol.col.consistency": "Consistency",
  "sol.exp.label": "Directional expectations (simplifying assumptions only)",
  "sol.exp.present": "present",
  "sol.exp.absent": "absent",
  "sol.exp.either": "either",
  "sol.exp.hint":
    "Between the complex and parsimonious solution: only theory-consistent (easy) counterfactuals.",
  "sol.pars.hint": "Remainders are admitted as simplifying assumptions.",
  "nec.title": "Necessary conditions",
  "nec.col.condition": "Condition",
  "nec.col.consistency": "Consistency",
  "nec.col.coverage": "Coverage",
  "nec.candidate": "≥ 0.9 — candidate",
  "nec.hint":
    "Convention: consistency ≥ 0.9 as an indication of necessity — interpret together with coverage and case knowledge.",

  // -- Robustness -------------------------------------------------------------
  "robustness.title": "Robustness — consistency cutoff sweep",
  "rob.error": "Robustness analysis unavailable: {msg}",
  "rob.noResults": "No sweep results available.",
  "rob.sweepFailed": "Sweep could not be computed.",
  "rob.col.cutoff": "Cutoff",
  "rob.col.paths": "Paths",
  "rob.col.solConsistency": "Solution consistency",
  "rob.col.solCoverage": "Solution coverage",
  "rob.col.parsimonious": "Parsimonious solution",
  "rob.stable": "The solution is stable across the tested cutoff range.",
  "rob.change":
    "The solution changes at cutoff {cutoff} from {from} to {to} — the cutoff choice is consequential here and should be justified.",

  // -- Negated outcome --------------------------------------------------------
  "neg.heading": "Negated outcome ({label})",
  "neg.intro":
    "QCA is asymmetric: a solution for Y does not automatically explain the absence of Y. The same analysis is therefore run separately for {label} by replacing each case's outcome membership with 1 − y.",
  "neg.complex": "Complex solution",
  "neg.parsimonious": "Parsimonious solution",
  "neg.none": "No configuration meets the cutoffs for {label}.",
  "neg.solConsistency": "Solution consistency",
  "neg.solCoverage": "Solution coverage",
  "neg.error": "Error computing {label}: {msg}",
  "neg.calcErrorUnknown": "Unknown error while computing ~Y.",

  // -- XY plot ----------------------------------------------------------------
  "xy.title": "XY plot (sufficiency)",
  "xy.hint":
    "Points above the diagonal support “X is sufficient for Y”. Consistency & coverage are shown above the plot.",
  "xyplot.kpi.consistency": "Consistency (sufficiency)",
  "xyplot.kpi.coverage": "Coverage",
  "xyplot.aria":
    "Fuzzy-set XY plot: {x} (X) against {y} (Y), {n} cases, axes 0 to 1",

  // -- Protocol ---------------------------------------------------------------
  "proto.title": "Analysis protocol",
  "proto.desc":
    "Reproducible: exportable as JSON and as an equivalent R script for the QCA package.",
  "proto.downloadBtn": "Download protocol as JSON",

  // -- Report -----------------------------------------------------------------
  "report.title": "Report",
  "report.desc": "Opens a print-ready report (PDF via the print dialog).",
  "report.missingData":
    "Data is still missing for the report (compute the truth table & solutions).",
  "report.generateBtn": "Generate report (print/PDF)",

  // -- Descriptive statistics (table) -----------------------------------------
  "desc.col.variable": "Variable",
  "desc.col.n": "N",
  "desc.col.min": "Minimum",
  "desc.col.median": "Median",
  "desc.col.mean": "Mean",
  "desc.col.max": "Maximum",

  // -- Onboarding -------------------------------------------------------------
  "onboarding.aria": "Quick start: reach a QCA solution in three steps",
  "onboarding.closeAria": "Close quick start",
  "onboarding.eyebrow": "Getting started",
  "onboarding.heading": "Reach a QCA solution in three steps",
  "onboarding.step1.title": "Load data",
  "onboarding.step1.detail": "Pick an example or import your own CSV.",
  "onboarding.step2.title": "Calibrate",
  "onboarding.step2.detail": "Translate raw values into fuzzy sets – the coach helps.",
  "onboarding.step3.title": "Truth table & solutions",
  "onboarding.step3.detail": "Minimize and interpret the configurations.",

  // -- Example datasets -------------------------------------------------------
  "ex.rohwerte.title": "Raw values democracy",
  "ex.rohwerte.badge": "Raw values",
  "ex.rohwerte.desc":
    "16 fictional countries with raw values (percentages and indices) – to calibrate yourself.",
  "ex.fuzzy.title": "Fuzzy-sets example",
  "ex.fuzzy.badge": "Fuzzy [0,1]",
  "ex.fuzzy.desc":
    "14 cases, already as fuzzy membership in [0,1] – straight to truth table and minimization.",
  "ex.crisp.title": "Crisp-sets example",
  "ex.crisp.badge": "Crisp 0/1",
  "ex.crisp.desc":
    "14 fictional start-ups, all values strictly binary (0/1) – the basis for csQCA.",
  "ex.meta": "{cases} cases · {conditions} conditions",
  "ex.synthetic": "synthetic",
  "ex.error": "Example dataset could not be loaded.",

  // -- AI assistant -----------------------------------------------------------
  "ai.contextPlaceholder": "Substantive description (optional) …",
  "ai.unavailable": "AI unavailable.",
  "ai.networkError": "Network error during the AI call.",

  // -- Cloud / account widget -------------------------------------------------
  "cloud.notConfigured": "Cloud plan · not configured",
  "cloud.signOut": "Sign out",
  "cloud.signIn": "Sign in",
  "cloud.linkSent": "Link sent to {email}.",
  "cloud.emailPlaceholder": "Email",
  "cloud.magicLink": "Magic link",
  "cloud.saveLoadHint": "Sign in to save projects in the cloud (Cloud plan).",
  "cloud.saveBtn": "Save to cloud",
  "cloud.projectNamePrompt": "Project name:",
  "cloud.projectNameDefault": "My QCA analysis",
  "cloud.saveError": "Error saving.",
  "cloud.saveOk": "Saved.",
  "cloud.loadPlaceholder": "Load project…",

  // -- Footer -----------------------------------------------------------------
  "footer.navAria": "Legal and documentation",
  "footer.methodik": "Methodology (German)",
  "footer.impressum": "Imprint (German)",
  "footer.datenschutz": "Privacy policy (German)",
  "footer.agb": "Terms (German)",
  "footer.note": "© {year} openQCA · Open Source (MIT)",

  // -- Consent banner ---------------------------------------------------------
  "consent.title": "Privacy settings",
  "consent.descPre":
    "openQCA works local-first: for operation we use only technically necessary local storage – your analysis data stays on your device. Details in our ",
  "consent.descLink": "privacy policy",
  "consent.necessary": "Necessary only",
  "consent.acceptAll": "Accept all",

  // -- Pricing ----------------------------------------------------------------
  "pricing.title": "Pricing",
  "pricing.intro":
    "The complete analysis core is and stays free — in the browser and as a download. You only pay for what causes real costs: secure cloud storage and the AI assistants.",
  "pricing.free.tag": "Free · forever",
  "pricing.free.name": "openQCA Local",
  "pricing.free.price": "€0",
  "pricing.free.li1": "Full analysis core & guided calibration",
  "pricing.free.li2": "Truth table, minimization, XY plots",
  "pricing.free.li3": "Reproducibility protocol & R export",
  "pricing.free.li4": "Data stays 100% on the device",
  "pricing.free.li5": "Website & desktop app",
  "pricing.cloud.tag": "Cloud plan",
  "pricing.cloud.name": "openQCA Cloud",
  "pricing.cloud.price": "Subscription",
  "pricing.cloud.li1": "Secure project database & sync",
  "pricing.cloud.li2": "AI assistant: anchors, interpretation",
  "pricing.cloud.li3": "AI drafts the methods paragraph",
  "pricing.cloud.li4": "Shared projects & collaboration",
  "pricing.cta.monthly": "Subscribe monthly",
  "pricing.cta.institution": "Institutional license",
  "pricing.cta.soon": "Coming soon",
  "pricing.soonNote":
    "The paid cloud plan launches shortly. Until then the complete analysis core is free to use — including account and cloud storage.",
  "pricing.checkoutUnavailable": "Checkout unavailable.",
  "pricing.networkError": "Network error.",

  // -- Account ----------------------------------------------------------------
  "account.title": "Account",
  "account.checkoutSuccess":
    "Thank you — your cloud subscription is active (it may take a moment after Stripe finishes processing).",
  "account.notConfigured":
    "The cloud features (account, sync, AI) are not yet configured in this instance. The free analysis core works fully without an account.",
  "account.signedInPre": "Signed in as ",
  "account.viewPricing": "View pricing →",
  "account.signInPrompt":
    "Sign in to save projects in the cloud and use the AI features.",
};

export const dict: Record<Locale, Record<DictKey, string>> = { de, en };

/**
 * Übersetzt `key` in die gewünschte Sprache und ersetzt `{x}`-Platzhalter.
 * Fällt bei fehlender Übersetzung auf Deutsch und zuletzt auf den Schlüssel
 * selbst zurück.
 */
export function t(
  locale: Locale,
  key: DictKey,
  vars?: Record<string, string | number>,
): string {
  let out: string = dict[locale][key] ?? dict.de[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{${name}}`).join(String(value));
    }
  }
  return out;
}
