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
  "landing.nav.proof": "Live-Beleg",
  "landing.nav.validation": "Validierung",
  "landing.nav.methodik": "Methodik",
  "landing.nav.pricing": "Kosten",
  "landing.nav.ariaPrimary": "Hauptnavigation",

  "landing.hero.eyebrow": "QCA für Small-N-Forschung ohne R",
  "landing.hero.title": "Von Ihren CSV/XLSX-Daten zu einer verteidigbaren QCA.",
  "landing.hero.sub":
    "openQCA führt Sie von crisp oder fuzzy-set Daten zu Lösungsformel, Fallbelegen und einem prüfbaren Defense pack. Sie dokumentieren Forschungsdesign, Kalibrierungen, Cutoffs und Richtungserwartungen dort, wo sie wirksam werden.",
  "landing.hero.local":
    "Der vollständige Analysekern läuft kostenlos und lokal in Ihrem Browser. Im Gratis-Kern werden Ihre Forschungsdaten nicht hochgeladen.",
  "landing.hero.ctaOwn": "Analyse eigener Daten starten",
  "landing.hero.ctaDemo": "Synthetisches Beispiel öffnen",

  "landing.fit.aria": "Prüfliste zur Eignung von openQCA",
  "landing.fit.title": "Passt zu Ihrem Projekt, wenn",
  "landing.fit.i1": "Sie eine vergleichende Small-N-Frage untersuchen",
  "landing.fit.i2": "Ihre Bedingungen crisp oder fuzzy-set kalibriert sind oder werden sollen",
  "landing.fit.i3": "eine Zeile in CSV oder XLSX genau einen Fall beschreibt",
  "landing.fit.i4": "Sie Standard-QCA mit Notwendigkeit, Truth Table und komplexer, intermediärer oder sparsamer Lösung benötigen",

  "landing.proof.eyebrow": "Echte Engine, keine Ergebnis-Attrappe",
  "landing.proof.title": "Ein Input, ein berechnetes Ergebnis, eine prüfbare Belegkette.",
  "landing.proof.intro":
    "Der Ausschnitt wird beim Laden mit derselben Engine und denselben Demo-Einstellungen wie in der App berechnet. Die Annotation zeigt, was aus den Fällen wird und was Sie für die Verteidigung mitnehmen.",
  "landing.proof.aria": "Live berechneter Weg von Rohdaten über die QCA-Lösung zum Defense pack",
  "landing.proof.input.title": "Eigene Falltabelle",
  "landing.proof.input.body": "Importieren Sie Fälle, weisen Sie Bedingungen und Outcome zu und kalibrieren Sie Rohwerte nachvollziehbar.",
  "landing.proof.input.cases": "18 Fälle im Beleg",
  "landing.proof.raw": "Rohwerte",
  "landing.proof.calibrated": "Set-Zugehörigkeit",
  "landing.proof.crossover": "0,5",
  "landing.proof.result.title": "Live berechnete Lösung",
  "landing.proof.result.body": "Truth Table, intermediäre Formel und Gütemaße stammen aus dem synthetischen Demo-Datensatz.",
  "landing.proof.consistency": "Konsistenz",
  "landing.proof.coverage": "Abdeckung",
  "landing.proof.cutoff": "incl. ≥ 0,80",
  "landing.proof.output": "OUT",
  "landing.proof.output.yes": "positive Truth-Table-Zeile",
  "landing.proof.output.no": "keine positive Truth-Table-Zeile",
  "landing.proof.defense.title": "Defense pack",
  "landing.proof.defense.body": "Exportfähige Replikationsartefakte werden erst nach bestätigten und begründeten Entscheidungen freigegeben.",
  "landing.proof.defense.i1": "Entscheidungsprotokoll mit Begründungen",
  "landing.proof.defense.i2": "fallverknüpfte Evidenz und Diagnostik",
  "landing.proof.defense.i3": "HTML-Bericht, Protokoll-JSON und Methoden-Text",
  "landing.proof.defense.i4": "R-Skript als Brücke zur Spezialisten-Referenz",
  "landing.proof.caption":
    "Synthetischer Lehrdatensatz, nicht zitierfähig. Formel und Kennzahlen bleiben über die vorhandenen Test-IDs direkt mit der App vergleichbar.",

  "landing.workflow.eyebrow": "Der Unterschied liegt in den Entscheidungen",
  "landing.workflow.title": "Nicht nur rechnen. Zeigen, warum dieses Ergebnis vertretbar ist.",
  "landing.workflow.intro":
    "fsQCA und R rechnen QCA. openQCA setzt einen anderen Schwerpunkt: wirksame Entscheidungen, ihre Begründung und ihre Folgen bleiben als zusammenhängende Provenienz sichtbar.",
  "landing.workflow.brief.title": "Research Brief bestätigen",
  "landing.workflow.brief.desc": "Forschungsfrage, Falluniversum, Zeitraum, Outcome-Konzept und Bedingungsauswahl bilden den Projektvertrag.",
  "landing.workflow.decisions.title": "Annahmen begründen",
  "landing.workflow.decisions.desc": "Kalibrierungsanker, Cutoffs und Richtungserwartungen erhalten sichtbaren Status, Begründung und Bestätigung.",
  "landing.workflow.evidence.title": "Zu Fällen zurückverfolgen",
  "landing.workflow.evidence.desc": "Formel, Gütemaße, typische und abweichende Fälle sowie Robustheitsbefunde bleiben miteinander verknüpft.",
  "landing.workflow.pack.title": "Prüfpaket freigeben",
  "landing.workflow.pack.desc": "Erst wenn die aktuellen Entscheidungen defense-ready sind, werden die Replikationsartefakte exportierbar.",

  "landing.validation.eyebrow": "Validierung, die Sie selbst prüfen können",
  "landing.validation.title": "23 von 25 Szenarien stimmen mit dem R-Paket QCA überein.",
  "landing.validation.intro":
    "Die feste Kreuzvalidierung vergleicht Formeln und Fit-Kennzahlen für Lösungen sowie Notwendigkeit mit eingecheckten R-Referenzen. Die breitere ESA-Prüfung misst zusätzlich die Reichweite der bekannten Abweichung der intermediären Lösung.",
  "landing.validation.matrix.title": "Feste Cross-Validation-Matrix",
  "landing.validation.matrix.body": "23 Szenarien PASS, einschließlich aller sechs Notwendigkeits-Szenarien gegen superSubset.",
  "landing.validation.deviations.title": "Breiter ESA-Korpus: 86,3 % Übereinstimmung",
  "landing.validation.deviations.body": "11.408 von 13.216 geprüften Drei-Bedingungen-Konstellationen stimmen mit R überein. Die Engine bleibt in den übrigen Fällen spezifischer; komplexe und sparsame Lösungen sind davon nicht betroffen.",
  "landing.validation.calibration.title": "Direkte Kalibrierung separat geprüft",
  "landing.validation.calibration.body": "Der Kreuzungspunkt ist exakt 0,500; gegenüber der gerundeten R-Referenz bleibt eine dokumentierte Restabweichung von höchstens 0,01.",
  "landing.validation.scope":
    "23/25 beschreibt die feste Referenzsuite, keine allgemeine R-Äquivalenz. Die breitere ESA-Messung betrifft die intermediäre Lösung und umfasst auch ambig_intermediate_mixed und lipset_intermediate_all_present. Für Spezialfälle bleibt R die Referenz.",
  "landing.validation.linksAria": "Nachweise zur Validierung",
  "landing.validation.linkRecord": "Validierungsprotokoll mit Abweichungen",
  "landing.validation.linkScript": "Ausführbares Cross-Validation-Skript",
  "landing.validation.linkMethods": "Formeln und Methoden",

  "landing.compare.eyebrow": "Werkzeugwahl statt Werkzeugkampf",
  "landing.compare.title": "openQCA, fsQCA oder R?",
  "landing.compare.intro": "Die Werkzeuge lösen unterschiedliche Teile desselben Forschungswegs. Der Vergleich benennt den Schwerpunkt, nicht einen universellen Sieger.",
  "landing.compare.tableAria": "Vergleich von openQCA, fsQCA 4 und dem R-Paket QCA",
  "landing.compare.dimension": "Arbeitsbedarf",
  "landing.compare.colR": "R-Paket QCA",
  "landing.compare.start": "Ohne Code starten",
  "landing.compare.start.openqca": "CSV/XLSX direkt im Browser",
  "landing.compare.start.fsqca": "Desktop-Oberfläche",
  "landing.compare.start.r": "R-Umgebung und Skript",
  "landing.compare.provenance": "Begründungen und Bestätigungen",
  "landing.compare.provenance.openqca": "integriertes Decision Ledger",
  "landing.compare.provenance.fsqca": "separat dokumentieren",
  "landing.compare.provenance.r": "im Skript oder Notebook dokumentieren",
  "landing.compare.evidence": "Fallbezug und Prüfpaket",
  "landing.compare.evidence.openqca": "integriert und exportierbar",
  "landing.compare.evidence.fsqca": "Ausgaben separat zusammenführen",
  "landing.compare.evidence.r": "frei programmierbar",
  "landing.compare.bridge": "Weiterarbeit in R",
  "landing.compare.bridge.openqca": "R-Skript mit einem Klick",
  "landing.compare.bridge.fsqca": "separater Übergang",
  "landing.compare.bridge.r": "bereits in der Referenzumgebung",
  "landing.compare.scope": "Methodischer Schwerpunkt",
  "landing.compare.scope.openqca": "geführte Standard-QCA",
  "landing.compare.scope.fsqca": "etablierter Desktop-Workflow",
  "landing.compare.scope.r": "Spezialfälle und erweiterbare Analyse",
  "landing.compare.note":
    "Das R-Paket QCA bleibt die Spezialisten-Referenz, insbesondere jenseits des dokumentierten openQCA-Umfangs und für die bekannten ESA-Abweichungen. openQCA ersetzt R nicht, sondern schafft einen nachvollziehbaren Einstieg und eine direkte Brücke dorthin.",

  "landing.pricing.eyebrow": "Klare Produktgrenze",
  "landing.pricing.title": "Die vollständige lokale Analyse bleibt kostenlos.",
  "landing.pricing.intro": "Cloud ist optionale Bequemlichkeit, kein Methoden-Upgrade. Für eine vollständige QCA, den Bericht und das Defense pack benötigen Sie kein Konto.",
  "landing.pricing.free.label": "Gratis, vollständig lokal",
  "landing.pricing.free.name": "openQCA Local",
  "landing.pricing.free.desc": "Analysekern, geführte Entscheidungen, Evidenz, Bericht, Replikationsprotokoll und R-Export im Browser sowie als installierbare PWA.",
  "landing.pricing.cloud.label": "Optional, wenn konfiguriert",
  "landing.pricing.cloud.name": "openQCA Cloud",
  "landing.pricing.cloud.desc": "Konto, manuelles Speichern und Laden von Cloud-Projekten sowie optionale, geprüfte KI-Entwürfe für Research Briefs, Kalibrierungsevidenz und Analysebegründungen.",
  "landing.pricing.note": "Cloud fügt keine QCA-Varianten, Kollaboration oder automatische Synchronisierung hinzu. Verfügbarkeit hängt von der jeweiligen Instanz ab.",
  "landing.pricing.details": "Kosten und Verfügbarkeit im Detail",

  "landing.cta.title": "Beginnen Sie mit Ihrer eigenen Small-N-Tabelle.",
  "landing.cta.sub": "CSV oder XLSX lokal importieren, Forschungsdesign bestätigen und sofort ein klar als vorläufig markiertes Ergebnis berechnen.",

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
    "openQCA ist Open Source (MIT-Lizenz). Der vollständige Quellcode — Rechenkern, Web-App und Validierungs-Suite — ist öffentlich auf GitHub.",
  "download.source.link": "Zum Repository auf GitHub →",



  // -- Import-Fehler (alert) --------------------------------------------------
  "alert.csvError": "CSV konnte nicht gelesen werden: {msg}",
  "alert.xlsxError": "Excel-Datei konnte nicht gelesen werden: {msg}",
  "alert.unknown": "unbekannt",

  // -- Datenbereich (mit geladenem Datensatz) ---------------------------------
  "data.reloadBtn": "Anderen Datensatz laden (CSV/XLSX)",
  "data.saveLocal": "Projekt lokal speichern",
  "data.loadLocal": "Lokales Projekt laden",
  "data.localSaved": "Lokal gespeichert.",
  "data.localRestored": "Lokales Projekt geladen.",
  "data.localMissing": "Kein lokales Projekt gefunden.",
  "data.localSaveFailed": "Lokales Speichern nicht möglich (Speicherlimit oder Privatmodus).",
  "data.title": "Daten · {n} Fälle",
  "descriptives.title": "Deskriptive Statistik (kalibrierte Sets)",



  // -- Grundbegriffe (Glossary) -------------------------------------------------
  "gloss.toggle": "Methodische Begriffe",
  "gloss.set.term": "Set / Menge",
  "gloss.set.def":
    "Eine Menge ist eine Eigenschaft, zu der ein Fall mehr oder weniger stark gehört — z. B. „demokratisch“.",
  "gloss.membership.term": "Zugehörigkeit (0–1)",
  "gloss.membership.def":
    "Die Zahl zwischen 0 und 1, die angibt, wie stark ein Fall zu einem Set gehört.",
  "gloss.crispFuzzy.term": "Crisp vs. Fuzzy",
  "gloss.crispFuzzy.def":
    "Crisp kennt nur 0 oder 1 (ganz draußen/drinnen); Fuzzy erlaubt Abstufungen dazwischen.",
  "gloss.calibration.term": "Kalibrierung",
  "gloss.calibration.def":
    "Das Übersetzen von Rohwerten in Zugehörigkeiten von 0 bis 1, anhand inhaltlich begründeter Anker.",
  "gloss.consistency.term": "Konsistenz",
  "gloss.consistency.def":
    "Wie verlässlich eine Bedingung (oder Kombination) mit dem Outcome einhergeht.",
  "gloss.coverage.term": "Coverage",
  "gloss.coverage.def":
    "Wie viel vom Outcome eine Lösung tatsächlich erklärt — ihre Erklärungsreichweite.",
  "gloss.moreLink": "Ausführlich: Methodik →",

  // -- Kalibrierung -----------------------------------------------------------
  "calib.title": "Kalibrierung, die mitdenkt",
  "calib.desc":
    "Rohwerte werden zu Fuzzy-Set-Zugehörigkeit. Der Coach prüft jede Entscheidung live gegen deine Fälle.",
  "calib.anchorOut": "Voll draußen → ≈0,047",
  "calib.anchorCross": "Kreuzung → 0,500",
  "calib.anchorIn": "Voll drinnen → ≈0,953",
"calib.badOrder": "Anker müssen in Richtung der Zugehörigkeit geordnet sein: voll draußen < Kreuzung < voll drinnen (bei invertierter Skala mit absteigenden Rohwerten).",
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
  "calib.reset": "Anker zurücksetzen",
  "calib.handle.aria": "{name}: {value} — mit den Pfeiltasten anpassen (Umschalt für größere Schritte)",
  "calib.handle.out": "Anker voll draußen",
  "calib.handle.cross": "Anker Kreuzung",
  "calib.handle.in": "Anker voll drinnen",
  "calib.rug.desc": "Die Griffe unter der Kurve lassen sich ziehen; die kurzen Striche zeigen die Verteilung der Rohwerte.",
  "calib.allCalibrated": "Ihre Daten sind bereits kalibriert — nichts zu tun.",
  "calib.descGuided":
    "Von der Set-Definition über Methode und begründete Anker zur Fallprüfung und Sensitivität. Empirische Verteilungen sind Hilfen — keine inhaltliche Begründung allein.",
  "calib.seed.apply": "Ausgefülltes Lehrbeispiel übernehmen (editierbar, vorläufig)",
  // Vorläufige Platzhalter beim Import. Das Wort „vorläufig" bzw. die Wendung
  // „Provenienz vor Publikation bestätigen" ist der Marker, an dem
  // hasImportPlaceholder() sie wiedererkennt — beim Übersetzen erhalten.
  "calib.ph.definition":
    "Zugehörigkeit zur Menge «{col}» (vorläufiger Platzhalter — durch eine inhaltliche Definition ersetzen).",
  "calib.ph.fullOut": "Klar außerhalb der Menge (vorläufig)",
  "calib.ph.crossover": "Maximale Unentschiedenheit (vorläufig)",
  "calib.ph.fullIn": "Klar innerhalb der Menge (vorläufig)",
  "calib.ph.provenance":
    "Bereits kalibrierte {type}-Werte aus «{dataset}» (Provenienz vor Publikation bestätigen).",
  "calib.ph.precalibratedDefinition":
    "Vorkalibrierte Zugehörigkeit für «{col}» (vorläufig — ursprüngliche Kalibrierung dokumentieren).",
  "calib.seed.hint":
    "Synthetische Begründungen für rohwerte-demokratie.csv — keine Literaturbehauptung. Vor Publikation ersetzen.",
  "calib.missing.excluded": "{n} Fall/Fälle wegen fehlender Werte aus der Analyse ausgeschlossen.",
  "calib.tab.outcome": "Outcome",
  "calib.ready.yes": "analysebereit",
  "calib.ready.no": "noch unvollständig",
  "calib.status.unresolved": "offen",
  "calib.status.provisional": "vorläufig",
  "calib.status.sourced": "belegt",
  "calib.status.external": "extern geprüft",
  "calib.status.markProvisional": "Als vorläufig markieren (ohne Quelle)",
  "calib.set.title": "1. Set definieren",
  "calib.set.label": "Set-Bezeichnung",
  "calib.set.unit": "Einheit",
  "calib.set.scope": "Population / Scope",
  "calib.set.time": "Zeitraum",
  "calib.set.definition": "Inhaltliche Definition der Zugehörigkeit",
  "calib.set.highIsIn": "Höherer Rohwert = mehr Zugehörigkeit",
  "calib.outcome.hintTitle": "Outcome ist ein eigenes Set",
  "calib.outcome.hintBody":
    "Die Kalibrierung des Outcomes ist eine Forschungsentscheidung und nicht dasselbe wie Frequenz-, Konsistenz- oder PRI-Cutoffs der Truth Table bzw. Lösungskennzahlen. Quellen: Ragin (2008); Schneider & Wagemann (2012); Oana & Schneider (2022), DOI 10.1177/00491241211036158.",
  "calib.outcome.blurb":
    "Es gibt keinen universellen „guten Outcome-Wert“. Outcome-Zugehörigkeit ≠ Analyse-Cutoffs.",
  "calib.method.title": "2. Kalibrierungsmethode",
  "calib.method.direct": "Direkt (fuzzy, logistisch)",
  "calib.method.crisp": "Crisp (eine Einschlussschwelle)",
  "calib.method.linear": "Linear (fuzzy, stückweise)",
  "calib.method.provenance": "Herkunft der bereits kalibrierten Werte",
  "calib.method.provenancePh": "z. B. aus Paper X, Anhang Tabelle 2; Skala 0–1 …",
  "calib.method.directHelp":
    "Drei qualitative Anker (voll draußen / Kreuzung / voll drinnen) werden auf Rohwerte gemappt und logistisch übersetzt (Ragin 2008).",
  "calib.method.directHelpInverted":
    "Drei qualitative Anker werden auf absteigende Rohwerte gemappt, wenn ein niedriger Rohwert mehr Zugehörigkeit bedeutet; die resultierende Kurve wird entsprechend invertiert.",
  "calib.method.linearHelp":
    "Dieselben drei qualitativen Anker werden mit einer stückweise linearen Zugehörigkeitsfunktion verbunden; das entspricht QCA::calibrate(logistic = FALSE).",
  "calib.method.linearHelpInverted":
    "Dieselben drei qualitativen Anker werden bei niedrigerem Rohwert als höherer Zugehörigkeit mit einer stückweise linearen Funktion verbunden und anschließend invertiert.",
  "calib.method.crispHelp":
    "Eine inhaltlich begründete Einschlussschwelle: Rohwert ≥ Schwelle → 1, sonst 0 (höherer Rohwert = mehr Zugehörigkeit).",
  "calib.method.crispHelpInverted":
    "Eine inhaltlich begründete Einschlussschwelle: Rohwert ≤ Schwelle → 1, sonst 0 (niedrigerer Rohwert = mehr Zugehörigkeit).",
  "calib.method.alreadyHelp":
    "Werte liegen schon als Zugehörigkeit vor — dokumentieren Sie Herkunft und Semantik.",
  "calib.anchors.title": "3. Qualitative Anker und Rohwerte",
  "calib.anchors.qualFirst": "Zuerst die qualitative Bedeutung, dann die Rohzahl.",
  "calib.anchors.meaning": "Bedeutung",
  "calib.anchors.raw": "Rohwert",
  "calib.crisp.title": "3. Crisp-Schwelle",
  "calib.crisp.meaning": "Bedeutung der Einschlussschwelle",
  "calib.crisp.threshold": "Schwelle (Rohwert)",
  "calib.evidence.title": "4. Evidenz",
  "calib.evidence.help":
    "Literatur, Theorie, Standards, Expertise oder Fallwissen. Verteilungsdiagnosen als „empirische Hilfe“ kennzeichnen — nicht als alleinige Begründung.",
  "calib.evidence.type": "Art",
  "calib.evidence.supports": "Bezieht sich auf",
  "calib.evidence.note": "Notiz / kurzer Beleg",
  "calib.evidence.authors": "Autor:innen",
  "calib.evidence.year": "Jahr",
  "calib.evidence.titleField": "Titel",
  "calib.evidence.doi": "DOI/URL",
  "calib.evidence.pages": "Seiten",
  "calib.evidence.add": "Evidenz hinzufügen",
  "calib.evidence.remove": "Entfernen",
  "calib.evidence.diagnosticNote": "Empirische Hilfe — keine inhaltliche Begründung allein.",
  "calib.evidence.type.literature": "Literatur",
  "calib.evidence.type.theory": "Theorie",
  "calib.evidence.type.standard": "Standard/Norm",
  "calib.evidence.type.domain_expertise": "Domänenwissen",
  "calib.evidence.type.case_knowledge": "Fallwissen",
  "calib.evidence.type.empirical_diagnostic": "Empirische Diagnose (Hilfe)",
  "calib.cases.title": "5. Fälle prüfen",
  "calib.cases.case": "Fall",
  "calib.cases.raw": "Roh",
  "calib.cases.m": "Zugeh.",
  "calib.cases.side": "Seite",
  "calib.cases.flags": "Flags",
  "calib.cases.note": "Ausnahme",
  "calib.sens.title": "6. Anker-Sensitivität",
  "calib.sens.help": "Plausible Alternativen am Kreuzungspunkt/Schwelle von {col}; andere Sets bleiben fix.",
  "calib.sens.variant": "Variante",
  "calib.sens.flips": "Δ m",
  "calib.sens.half": "Seite 0,5",
  "calib.sens.tt": "TT-Bits",
  "calib.sens.solChanged": "Lösung?",
  "calib.sens.baseSol": "Basis",
  "calib.sens.varSol": "Variante",
  "calib.sens.yes": "ja",
  "calib.sens.no": "nein",
  "calib.sens.stable": "Keine qualitativen Zugehörigkeits- oder Lösungswechsel unter den getesteten Alternativen.",
  "calib.sens.unstable": "Mindestens eine Alternative ändert Zugehörigkeitsseite und/oder sparsame Lösung — im Protokoll dokumentieren.",
  "calib.sens.flipList": "Beispiele für Seitenwechsel:",
  "calib.migrate.banner":
    "Dieses Projekt stammt aus einer älteren Version: bitte Set-Definitionen und Ankerbegründungen ergänzen (neu in dieser Version).",
  "calib.protocol.ready": "Protokollbereit: Definition, Methode, Evidenz, Fallprüfung und Sensitivität sind dokumentiert.",
  "calib.protocol.incomplete": "Protokoll noch nicht vollständig ({n} offene Angabe(n)).",
  "calib.demoNotice": "Synthetischer Demo-Datensatz: Berechnung und Bericht sind sichtbar (der Bericht trägt einen Warnhinweis) — Protokoll- und R-Export bleiben gesperrt.",

  // -- Kalibrierung: Ansicht, Dokumentations-Meter, Schnell-Ansicht ------------
  "calib.view.aria": "Ansicht der Kalibrierung",
  "calib.view.quick": "Schnell",
  "calib.view.doc": "Dokumentation",
  "calib.meter.title": "Publikationsreife: {done} von {total} Sets dokumentiert",
  "calib.meter.aria": "Dokumentationsstand je Set",
  "calib.meter.hint":
    "Ergebnisse rechnen sofort — die Dokumentation macht sie publikationsreif und schaltet Protokoll- und R-Export frei.",
  "calib.meter.docBtn": "Dokumentieren →",
  "calib.meter.chipDone": "dokumentiert",
  "calib.meter.chipOpen": "offen",
  "calib.meter.chipAria": "{col} dokumentieren",
  "calib.quick.title": "Anker setzen, Ergebnisse sehen",
  "calib.quick.desc":
    "Je Set: Methode wählen und die drei Anker setzen — per Zahlenfeld oder durch Ziehen der Griffe unter der Kurve. Notwendigkeit, Truth Table und Lösungen rechnen sofort mit.",
  "calib.quick.anchorsFromData":
    "Sets mit der Marke „10./50./90. Perzentil“ tragen noch Anker, die beim Import automatisch aus der Verteilung Ihrer Daten vorgeschlagen wurden — das ist keine inhaltliche Entscheidung. Datengetriebene Schwellen sind in der QCA-Methodik keine Begründung: Setzen Sie die Anker dort, wo es fachlich Sinn ergibt. Die Marke verschwindet, sobald Sie einen Anker des Sets anfassen.",
  "calib.quick.anchorsFromData.chip": "10./50./90. Perzentil",
  "calib.quick.method": "Methode",
  "calib.quick.method.direct": "Direkt",
  "calib.quick.method.linear": "Linear",
  "calib.quick.method.crisp": "Crisp",
  "calib.quick.methodAria": "Kalibrierungsmethode für {col}",
  "calib.quick.noMethod": "Noch keine Methode gewählt — bitte Direkt, Linear oder Crisp wählen.",
  "calib.quick.passthrough": "Bereits kalibriert ({type}): wird unverändert übernommen.",
  "calib.quick.dist": "{inCount} Fälle drinnen · {outCount} draußen",
  "calib.quick.nearHalf": "{n} nahe 0,5",
  "calib.quick.missing": "{n} ohne Wert",
  "calib.set.notes": "Zusätzliche Set-Notizen / Ausnahmefälle",
  "calib.method.confirm": "Methode und Semantik bestätigen",
  "calib.method.confirmed": "Methode bestätigt",
  "calib.anchor.invalid": "Mindestens ein Anker ist keine endliche Zahl.",
  "calib.anchor.duplicate": "Anker dürfen nicht identisch sein; prüfe die qualitative Ordnung.",
  "calib.missing.title": "Fehlende Werte",
  "calib.missing.policy": "Behandlung fehlender Rohwerte",
  "calib.missing.exclude": "Fall aus der Analyse ausschließen",
  "calib.missing.assign": "Membership explizit zuweisen",
  "calib.missing.unresolved": "Ungeklärt lassen (nicht analysieren)",
  "calib.missing.membership": "Zugewiesene Zugehörigkeit",
  "calib.missing.help": "Die Wahl wird im Protokoll festgehalten; fehlende Werte werden nicht stillschweigend als 0 behandelt.",
  "calib.evidence.coverage": "Evidenzabdeckung:",
  "calib.evidence.coverageComplete": "alle erforderlichen Entscheidungspunkte haben substanzielle Belege.",
  "calib.evidence.coverageMissing": "Belege fehlen für: {targets}.",
  "calib.evidence.target.set": "Set-Definition",
  "calib.evidence.target.method": "Methode",
  "calib.evidence.target.fullOut": "voll draußen",
  "calib.evidence.target.crossover": "Kreuzungspunkt",
  "calib.evidence.target.fullIn": "voll drinnen",
  "calib.evidence.target.threshold": "Crisp-Schwelle",
  "calib.status.label": "Entscheidungsstatus",
  "calib.status.reviewer": "Prüfer:in",
  "calib.status.date": "Prüfdatum",
  "calib.status.note": "Prüfnotiz",
  "calib.cases.review": "Ich habe die Fallzugehörigkeiten, Grenzfälle, fehlenden Werte und Ausnahmen geprüft.",
  "calib.sens.altLabel": "Alternative Bezeichnung",
  "calib.sens.delta": "Änderung am Kreuzungspunkt / an der Schwelle",
  "calib.sens.rationale": "Substantive Begründung der Alternative",
  "calib.sens.add": "Alternative hinzufügen",
  "calib.sens.notes": "Notizen zur Sensitivitätsentscheidung",
  "calib.sens.review": "Ich habe die Sensitivitätsergebnisse geprüft und die Alternativen begründet.",
  "calib.sens.noResults": "Noch keine Vergleichsergebnisse. Ergänze mindestens zwei kalibrierbare Alternativen.",
  "calib.guide.variables": "Kalibrierte Variablen",
  "calib.guide.outcomeGroup": "Outcome-Set",
  "calib.guide.conditionGroup": "Bedingungs-Sets",
  "calib.guide.aria": "Kalibrierungsabschnitte",
  "calib.guide.role.condition": "Bedingung",
  "calib.guide.role.outcome": "Outcome",
  "calib.guide.context.condition": "Dieses Set erklärt zusammen mit anderen Bedingungen das Outcome.",
  "calib.guide.context.outcome": "Dieses Set ist das zu erklärende Outcome. Seine Mitgliedschaft ist kein Truth-Table-, Frequency-, Konsistenz- oder PRI-Cutoff.",
  "calib.guide.mode.already": "bereits kalibriert, Provenienz",
  "calib.guide.mode.direct": "direkte Fuzzy-Kalibrierung",
  "calib.guide.mode.linear": "lineare Fuzzy-Kalibrierung",
  "calib.guide.mode.crisp": "Crisp-Kalibrierung",
  "calib.guide.mode.unselected": "Methode noch nicht gewählt",
  "calib.guide.direction.high": "höhere Rohwerte erhöhen Zugehörigkeit",
  "calib.guide.direction.low": "niedrigere Rohwerte erhöhen Zugehörigkeit",
  "calib.guide.progress": "{done} von {total}",
  "calib.guide.progressLabel": "anwendbaren Abschnitten vollständig",
  "calib.guide.next": "Nächsten offenen Abschnitt öffnen",
  "calib.guide.complete": "Alle anwendbaren Abschnitte sind geprüft.",
  "calib.guide.collapseDone": "Erledigte einklappen",
  "calib.guide.expandAll": "Alle ausklappen",
  "calib.guide.summary.evidence": "{n} Belege",
  "calib.guide.summary.cases": "{n} Fälle",
  "calib.guide.summary.sensitivity": "{n} Alternativen",
  "calib.guide.summary.threshold": "Schwelle {value}",
  "calib.guide.status.complete": "vollständig",
  "calib.guide.status.attention": "Aufmerksamkeit",
  "calib.guide.status.incomplete": "offen",
  "calib.guide.status.na": "nicht anwendbar",
  "calib.guide.definition": "Set definieren",
  "calib.guide.method": "Methode / Provenienz",
  "calib.guide.mapping": "Anker / Schwelle",
  "calib.guide.evidence": "Evidenz",
  "calib.guide.cases": "Fälle prüfen",
  "calib.guide.sensitivity": "Sensitivität",
  "calib.evidence.targetSupported": "belegt",
  "calib.evidence.targetMissing": "offen",
  "calib.evidence.diagnosticWarning": "Empirische Verteilungen, Perzentile, Lücken und Cluster helfen bei der Prüfung. Sie begründen Set-Mitgliedschaft oder Anker nicht allein.",
  "calib.flag.missing": "fehlender Rohwert",
  "calib.flag.excluded": "Fall ausgeschlossen",
  "calib.flag.unresolved": "ungeklärt",
  "calib.flag.missingAssigned": "fehlender Wert zugewiesen",
  "calib.flag.rawBoundary": "Rohwert an einem Anker",
  "calib.flag.exactCrossover": "exakt 0,5",
  "calib.flag.nearCrossover": "nahe 0,5",
  "calib.flag.duplicateCase": "doppeltes Falllabel",
  "calib.flag.outOfRange": "außerhalb [0,1]",
  "calib.flag.missingSpec": "Set-Spezifikation fehlt",
  "calib.flag.missingMethod": "Methode fehlt",
  "calib.flag.invalidParameters": "ungültige Parameter",
  "calib.flag.other": "weitere Diagnose",
  "calib.side.in": "drinnen",
  "calib.side.out": "draußen",
  "calib.side.half": "Kreuzung, 0,5",
  "calib.side.missing": "nicht bestimmbar",
  "calib.cases.summary": "Diagnostik: {missing} fehlend oder ungeklärt, {boundary} an Ankern, {exact} exakt bei 0,5, {near} nahe 0,5, {duplicate} doppelte Falllabels, {outOfRange} außerhalb [0,1].",
  "calib.sens.cutoffs": "Vergleich mit Frequency {freq} und Konsistenz {cons}. Diese Analyse-Cutoffs bleiben von der Outcome-Kalibrierung getrennt.",
  "calib.sens.outcomeHelp": "Beim Outcome können alternative Anker Outcome-Mitgliedschaften und Fallklassifikationen verändern. Das macht sie nicht zu Truth-Table- oder Fit-Cutoffs.",
  "calib.sens.waitForMapping": "Ergebnisse erscheinen, sobald Methode, Richtung und Anker oder Schwelle gültig sind.",
  "calib.sens.waitForAnalysis": "Ergebnisse erscheinen, sobald mindestens eine Bedingung und ein Outcome festgelegt sind.",
  "calib.sens.membershipChanges": "Mitgliedschaftsänderungen",
  "calib.sens.truthChanges": "Truth-Table-Zeilen",
  "calib.sens.caseChanges": "Fallklassifikationswechsel",
  "calib.sens.fit": "Fit Basis → Variante",
  "calib.sens.baseFit": "Basis: Konsistenz {cons}, Coverage {cov}",
  "calib.sens.variantFit": "Variante: Konsistenz {cons}, Coverage {cov}",
  "calib.sens.details": "Fallklassifikationen anzeigen",
  "calib.sens.thresholds": "Rohwertschwellen",
  "calib.sens.caseChange": "{caseLabel}: Bedingungen {baseBits} → {variantBits}; Outcome {baseOutcome} → {variantOutcome}; Zeile {baseRow} → {variantRow}",
  "calib.sens.truncated": "{n} weitere Änderungen werden nicht angezeigt.",
  "calib.sens.noCaseChanges": "Keine Fallklassifikationswechsel.",
  "vars.role.help": "Ein Outcome ist das zu erklärende Set. Bedingungen werden unabhängig kalibriert und gemeinsam zur Erklärung kombiniert. Ignorierte Spalten gehen nicht in die Analyse ein.",
  "vars.limitedDiversity":
    "{k} Bedingungen ergeben {configurations} mögliche Konfigurationen bei {n} Fällen — viele Zeilen der Truth Table bleiben zwangsläufig unbeobachtet (limited diversity). Weniger Bedingungen oder eine theoretische Vorauswahl erwägen; die Analyse rechnet weiter, die Remainder-Behandlung wird aber wichtiger.",
  "vars.type.help.raw": "Rohwerte werden im nächsten Schritt kalibriert. Die numerische Verteilung ersetzt keine Set-Begründung.",
  "vars.type.help.fuzzy": "Bereits kalibrierte Fuzzy-Mitgliedschaften. Herkunft, Semantik und Richtung dokumentieren.",
  "vars.type.help.crisp": "Bereits kalibrierte Crisp-Mitgliedschaften. Herkunft, Inklusionsregel und Richtung dokumentieren.",
  "proto.downloadMd": "Methoden-Protokoll (Markdown)",
  "proto.copyR": "R-Skript kopieren",
  "proto.downloadR": "R-Skript herunterladen",
  "proto.noEvidence": "Keine Evidenz dokumentiert.",
  "proto.status": "Status",
  "proto.recorded": "erfasst",
  "proto.ready": "Protokoll bereit",
  "proto.setNotReady": "Protokoll nicht bereit",
  "proto.missingFields": "fehlende Felder",
  "proto.missingEvidence": "fehlende Evidenz",
  "proto.definition": "Definition",
  "proto.unit": "Einheit",
  "proto.scope": "Population / Scope",
  "proto.timePeriod": "Zeitraum",
  "proto.direction": "Richtung",
  "proto.direction.high": "höhere Rohwerte → mehr Zugehörigkeit",
  "proto.direction.low": "invertiert (höhere Rohwerte → weniger Zugehörigkeit)",
  "proto.missingPolicy": "Fehlendenwerte-Regel",
  "proto.setNotes": "Set-Notizen",
  "proto.methodConfirmed": "Methode bestätigt",
  "proto.caseReviewConfirmed": "Fallprüfung bestätigt",
  "proto.sensitivityReviewConfirmed": "Sensitivitätsprüfung bestätigt",
  "proto.method.direct": "direkte Fuzzy-Kalibrierung (logistisch)",
  "proto.method.linear": "lineare Fuzzy-Kalibrierung",
  "proto.method.crisp": "Crisp-Kalibrierung",
  "proto.method.already": "bereits kalibriert",
  "proto.provenance": "Provenienz",
  "proto.anchor.fullOut": "Bedeutung voll draußen",
  "proto.anchor.crossover": "Bedeutung Kreuzungspunkt",
  "proto.anchor.fullIn": "Bedeutung voll drinnen",
  "proto.anchor.inclusion": "Bedeutung Einschlussschwelle",
  "proto.exceptionalCases": "Ausnahmefälle",
  "proto.yes": "ja",
  "proto.no": "nein",
  "proto.missingText": "fehlt",
  "proto.evidenceAid": " *(empirische Hilfe — allein kein substantieller Beleg)*",
  "proto.none": "keine",
  "proto.sensitivity.truthRows": "Truth-Table-Zeilenänderungen (erste 8):",
  "proto.sensitivity.caseRows": "Fallklassifikationen (erste 8):",
  "proto.row": "Zeile",


  // -- Truth Table ------------------------------------------------------------
  "tt.title": "Truth Table",
  "tt.conditions": "Bedingungen",
  "tt.outcome": "Outcome",
  "tt.rolesHint": "Bedingungen und Outcome werden unter „Variablen & Rollen“ festgelegt.",
  "tt.rolesLink": "→ Variablen & Rollen",
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
  "tt.limitWarn": "Die Engine begrenzt Truth Tables auf 12 Bedingungen (2^k Zeilen). Reduzieren Sie die Bedingungen, bevor Sie fortfahren.",

  // -- Lösungen ---------------------------------------------------------------
  "sol.complex.title": "Komplexe (konservative) Lösung",
  "sol.intermediate.title": "Intermediäre Lösung",
  "sol.parsimonious.title": "Sparsame (parsimonious) Lösung",
  "sol.model.n": "Modell {i} von {total} (gleichwertig — die Lösung ist mehrdeutig)",
  "sol.report.convention":
    "Berichtet wird üblicherweise die intermediäre Lösung; komplexe und sparsame Lösung dienen der Einordnung (Ragin 2008). Die intermediäre Lösung folgt den Richtungserwartungen, die Sie auf ihrer Karte setzen.",
  "sol.sameAsComplex":
    "Identisch mit der komplexen Lösung — bei diesen Richtungserwartungen greift keine Vereinfachungsannahme. Das ist ein Ergebnis, kein Fehler.",
  "sol.ambiguous.n":
    "{n} gleichwertige Modelle — die Lösung ist mehrdeutig. Berichten Sie alle {n} oder begründen Sie, warum Sie eines auswählen.",
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
  "nec.orderHint":
    "Die Notwendigkeitsanalyse gehört methodisch vor die Suffizienzanalyse (Truth Table und Lösungen).",
  "nec.col.condition": "Bedingung",
  "nec.col.consistency": "Konsistenz",
  "nec.col.coverage": "Coverage",
  "nec.col.relevance": "RoN",
  "nec.candidate": "≥ 0,9 — Kandidat",
  "nec.finding.none":
    "Kein Befund: keine Bedingung erreicht Konsistenz ≥ 0,9. Für diesen Datensatz gibt es keinen Kandidaten für Notwendigkeit.",
  "nec.finding.one":
    "1 Kandidat: {list}. Notwendigkeit ist damit nicht belegt — sie muss inhaltlich begründbar sein.",
  "nec.finding.many":
    "{n} Kandidaten: {list}. Notwendigkeit ist damit nicht belegt — jeder Kandidat muss inhaltlich begründbar sein.",
  "nec.hint":
    "Konvention: Konsistenz ≥ 0,9 als Hinweis auf Notwendigkeit — mit Coverage, RoN und Fallkenntnis interpretieren.",
  "nec.suin.title": "Notwendige Kombinationen (SUIN)",
  "nec.suin.desc":
    "Geprüft werden auch Disjunktionen (X + Z) und Konjunktionen (X·Z) bis zur Ordnung 3 — Referenz ist superSubset aus dem R-Paket QCA. Ist die Disjunktion notwendig, ohne dass ein einzelner Teil es ist, spricht man von SUIN-Bedingungen.",
  "nec.suin.col.expression": "Ausdruck",
  "nec.suin.col.kind": "Form",
  "nec.suin.kind.disjunction": "Disjunktion (SUIN)",
  "nec.suin.kind.conjunction": "Konjunktion",
  "nec.suin.none":
    "Keine Kombination erreicht bei Konsistenz ≥ 0,9 zugleich eine Coverage ≥ 0,5.",
  "nec.suin.finding":
    "{n} Kombinationen erfüllen das Konsistenzkriterium — das macht sie noch nicht berichtenswert. Entscheidend ist RoN: {top} liegt mit {topRon} an der Spitze, der niedrigste Wert beträgt {minRon}. Eine Kombination mit niedrigem RoN ist bei fast allen Fällen erfüllt und erklärt deshalb wenig.",
  "nec.suin.findingOne":
    "Eine Kombination erfüllt das Konsistenzkriterium: {top} (RoN {topRon}). Das macht sie noch nicht berichtenswert — Notwendigkeit muss inhaltlich begründbar sein.",
  "nec.suin.toggle": "{n} geprüfte Kombinationen anzeigen (nach RoN sortiert)",
  "nec.suin.hint":
    "Ein hoher RoN-Wert spricht gegen Trivialität. Notwendigkeit allein ist kein Befund — die Kombination muss substantiell begründbar sein.",

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
  "rob.combined.explainer":
    "Dieses Raster trennt Kalibrierungsalternativen von analytischen Cutoffs. Nur ausdrücklich dokumentierte substantielle Alternativen werden als Szenarien einbezogen; diagnostische Verschiebungen sind kein Beleg.",
  "rob.combined.scenarios": "{count} Kalibrierungsszenario(s) werden gemeinsam mit Frequency-, Consistency- und PRI-Cutoffs geprüft.",
  "rob.combined.stabilityTitle": "Stabilität der Lösungsterme",
  "rob.combined.stabilityHint": "Anteil der geprüften Zellen mit demselben Ausdruck. Stabilität ersetzt keine substantielle Begründung.",
  "rob.combined.solutionType": "Lösungsmodell",
  "rob.combined.expression": "Ausdruck",
  "rob.combined.cells": "Zellen",
  "rob.combined.share": "Anteil",
  "rob.combined.caseTitle": "Fallklassifikationen",
  "rob.combined.caseHint": "Diese Fälle wechseln gegenüber der Basiszelle ihre Truth-Table-Klassifikation oder ihre Outcome-Seite.",
  "rob.combined.caseChanged": "Zellen mit Änderung",
  "rob.combined.fullGrid": "Vollständiges Robustheitsraster ({count} Zellen)",
  "rob.combined.scenario": "Szenario",
  "rob.combined.caseChanges": "Falländerungen",
  "rob.chart.aria":
    "Liniendiagramm des Cutoff-Sweeps: Lösungs-Konsistenz und Lösungs-Coverage über dem Konsistenz-Cutoff (0,70 bis 0,95).",
  "rob.chart.consistency": "Konsistenz",
  "rob.chart.coverage": "Coverage",
  "rob.chart.currentCutoff": "Cutoff {cutoff}",

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

  // -- Grafik-Export ----------------------------------------------------------
  "chart.exportSvg": "SVG",
  "chart.exportPng": "PNG",
  "chart.exportAria": "Grafik exportieren als {fmt}",

  // -- XY-Plot ----------------------------------------------------------------
  "xy.title": "XY-Plot (Suffizienz)",
  "xy.hint":
    "Punkte oberhalb der Diagonale stützen „X ist hinreichend für Y“. Konsistenz & Coverage stehen über dem Plot.",
  "xyplot.kpi.consistency": "Konsistenz (Hinreichendheit)",
  "xyplot.kpi.coverage": "Coverage",
  "xyplot.aria":
    "Fuzzy-Set-XY-Plot: {x} (X) gegen {y} (Y), {n} Fälle, Achsen 0 bis 1",
  "xy.labelsToggle": "Fall-Labels",
  "xy.labels.off": "Aus",
  "xy.labels.notable": "Auffällige",
  "xy.labels.all": "Alle",
  "xy.diagonalLabel": "Diagonale X = Y",
  "xy.consistentZone": "konsistent: X ≤ Y",
  "xy.legend.consistent": "konsistent (X ≤ Y)",
  "xy.legend.inconsistent": "widerspricht (X > Y)",
  "xy.source.label": "X-Achse",
  "xy.source.conditions": "Einzelbedingungen",
  "xy.source.paths": "Lösungspfade (intermediär)",
  "xy.source.solution": "Gesamtlösung (intermediär)",
  "xy.pathHint":
    "Für einen Lösungspfad ist X die Zugehörigkeit zum Term (Minimum über seine Literale) — das ist der in Aufsätzen abgebildete Suffizienz-Plot.",

  // -- Fall-Diagnostik (Schneider & Rohlfing) ----------------------------------
  "diag.title": "Fall-Diagnostik je Pfad",
  "diag.desc":
    "Welche Fälle stehen hinter jedem Pfad, welche widersprechen ihm? Grundlage für fallorientierte Vertiefung (Schneider & Rohlfing 2013, 2016).",
  "diag.typical": "Typisch",
  "diag.deviantKind": "Abweichend (Art)",
  "diag.deviantDegree": "Abweichend (Grad)",
  "diag.irrelevant": "Irrelevant (IIR)",
  "diag.irrelevantCount": "{n} Fälle",
  "diag.deviantCoverage": "Vom Modell nicht gedeckt (deviant coverage)",
  "diag.none": "keine",
  "diag.crossover": "Grenzfälle mit Zugehörigkeit genau 0,5: {cases}",
  "diag.hint":
    "Typisch = X > 0,5, Y > 0,5, X ≤ Y · Abweichend (Art) = X > 0,5, Y ≤ 0,5 (widerspricht der Hinreichendheit) · Abweichend (Grad) = X > Y, beide > 0,5 · Irrelevant = X ≤ 0,5, der Pfad sagt über den Fall nichts aus. „Vom Modell nicht gedeckt (deviant coverage)“ erscheint nur, wenn es solche Fälle gibt — fehlt die Zeile, ist jeder Outcome-Fall von mindestens einem Pfad gedeckt.",

  // -- Protokoll --------------------------------------------------------------
  "cite.title": "openQCA zitieren",
  "cite.desc":
    "Wer openQCA in einer Arbeit verwendet, sollte die genaue Version angeben — Ergebnisse hängen von der Fassung ab, mit der sie gerechnet wurden.",
  "cite.noDoi":
    "Noch ohne DOI: Der zitierfähige Bezeichner entsteht mit dem nächsten über Zenodo archivierten Release. Bis dahin ist die Repository-Adresse die verlässliche Angabe.",
  "cite.copy": "Zitation kopieren",
  "cite.copyBibtex": "BibTeX kopieren",
  "cite.copied": "kopiert",
  "proto.title": "Analyseprotokoll",
  "proto.desc":
    "Reproduzierbar: Kalibrierungsprotokoll (JSON + Markdown) und R-Skript (package QCA; logistic = TRUE für direkte, logistic = FALSE für lineare Fuzzy-Kalibrierung).",
  "proto.downloadBtn": "Protokoll als JSON herunterladen",
  "proto.downloadData": "Rohdaten als CSV herunterladen",
  // Erklärt die Export-Sperre dort, wo sie gilt — die Analyse selbst ist nie
  // gesperrt (siehe calib.meter.hint).
  "proto.notReady":
    "Der Export ist das Replikationsartefakt und wird freigeschaltet, sobald jedes Set vollständig dokumentiert ist: Definition, Methode, Evidenz, Fallprüfung und Sensitivität. Bericht und Ergebnisse stehen unabhängig davon bereit.",

  // -- Bericht ----------------------------------------------------------------
  "report.title": "Bericht",
  "report.desc": "Öffnet einen druckfähigen Bericht (PDF über den Druckdialog).",
  "result.provisional.chip": "vorläufig",
  "result.provisional.reason": "Die Anker sind noch nicht inhaltlich begründet.",
  "result.provisional.link": "Zu Entscheidungen",
  "result.provisional.title":
    "Die Berechnung ist exakt, aber die Kalibrierung ist noch nicht inhaltlich dokumentiert. Für zitierfähige Ergebnisse die Anker begründen (Ansicht „Dokumentation“).",
  "report.demoNotice":
    "Demo-Datensatz: Der Bericht lässt sich erzeugen und zeigt den vollständigen Rechenweg — er trägt dann den Hinweis „Synthetische Lehrdaten — nicht zitierfähig“. Protokoll- und R-Export bleiben gesperrt, bis Sie mit eigenen Daten arbeiten und die Kalibrierung begründet haben.",
  "report.provisionalNotice":
    "Der Bericht ist erzeugbar und wird als „vorläufig“ gekennzeichnet, solange die Kalibrierung nicht vollständig dokumentiert ist.",
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
    "16 erfundene Länder mit Rohwerten (Prozente und Indizes) – Rohwerte, die vor der Analyse kalibriert werden müssen.",
  "ex.fuzzy.title": "Fuzzy-Sets Beispiel",
  "ex.fuzzy.badge": "Fuzzy [0,1]",
  "ex.fuzzy.desc":
    "14 Fälle mit bereits vorliegenden Zugehörigkeiten in [0,1] – direkt nutzbar, keine Kalibrierung nötig.",
  "ex.crisp.title": "Crisp-Sets Beispiel",
  "ex.crisp.badge": "Crisp 0/1",
  "ex.crisp.desc":
    "14 fiktive Start-ups mit nur 0/1 (Crisp-Sets) – direkt nutzbar, Grundlage für csQCA.",
  "ex.meta": "{cases} Fälle · {conditions} Bedingungen",
  "ex.synthetic": "synthetisch",
  "ex.error": "Beispiel-Datensatz konnte nicht geladen werden.",

  // -- Variablen & Rollen -----------------------------------------------------
  "vars.title": "Variablen & Rollen",
  "vars.intro":
    "QCA arbeitet mit Mengen (Sets): Jede Bedingung und das Outcome brauchen Zugehörigkeitswerte zwischen 0 und 1. Legen Sie hier fest, welche Spalte welche Datenart hat und welche Rolle sie in der Analyse spielt.",
  "vars.col.name": "Variable",
  "vars.col.type": "Datenart",
  "vars.col.role": "Rolle",
  "vars.type.raw": "Rohwert",
  "vars.type.fuzzy": "Fuzzy (0–1)",
  "vars.type.crisp": "Crisp (0/1)",
  "vars.role.condition": "Bedingung",
  "vars.role.outcome": "Outcome",
  "vars.role.ignore": "ignorieren",
  "vars.autoDetected": "automatisch erkannt",
  "vars.badge.raw": "muss kalibriert werden",
  "vars.badge.ready": "direkt verwendbar",
  "vars.warn.crisp":
    "Als „Crisp (0/1)“ gewählt, aber es gibt Werte außerhalb von {0, 1} — diese Variable ist nicht nutzbar.",
  "vars.warn.fuzzy":
    "Als „Fuzzy (0–1)“ gewählt, aber es gibt Werte außerhalb von [0, 1] — diese Variable ist nicht nutzbar.",
  "vars.warn.raw":
    "Kalibrierungsanker fehlen oder sind nicht aufsteigend — bitte in der Kalibrierung festlegen. Bis dahin ist diese Variable nicht nutzbar.",

  // -- KI-Assistent -----------------------------------------------------------
  "ai.contextLabel": "Fachlicher Kontext",
  "ai.contextHelp": "Nur diesen Text und die angezeigten Zusammenfassungswerte senden. Keine Fallnamen oder vertraulichen Rohdaten eingeben.",
  "ai.contextPlaceholder": "Inhaltliche Beschreibung",
  "ai.privacy": "Optionaler Cloud-Aufruf: Der angezeigte Kontext und aggregierte Werte werden an den konfigurierten Modellanbieter gesendet. Es werden keine Fallzeilen oder QCA-Ergebnisse automatisch verändert.",
  "ai.draftLabel": "KI-Entwurf",
  "ai.review": "Vor Verwendung fachlich prüfen und mit eigenen Quellen begründen. Der Entwurf wird nicht automatisch übernommen.",
  "ai.copy": "Entwurf kopieren",
  "ai.copied": "Kopiert",
  "ai.busy": "Entwurf wird erstellt",
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
  "cloud.saveConfirmBtn": "Speichern",
  "cloud.saveCancelBtn": "Abbrechen",
  "cloud.overwriteBtn": "Überschreiben",
  "cloud.manageProjectsLink": "Projekte verwalten →",

  // -- Footer -----------------------------------------------------------------
  "footer.navAria": "Produkt, Rechtliches und Dokumentation",
  "footer.app": "App",
  "footer.download": "Download",
  "footer.preise": "Preise",
  "footer.konto": "Konto",
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
  "pricing.title": "Kosten",
  "pricing.intro":
    "Der vollständige Analysekern bleibt kostenlos und lokal: von Kalibrierung und Minimierung bis Defense pack und R-Export. Cloud ist optionale Bequemlichkeit und kein Methoden-Upgrade.",
  "pricing.free.tag": "Gratis · vollständig lokal",
  "pricing.free.name": "openQCA Local",
  "pricing.free.price": "0 €",
  "pricing.free.li1": "Voller Analysekern und geführte Entscheidungen",
  "pricing.free.li2": "Truth Table, Lösungen, Fallbelege und Robustheit",
  "pricing.free.li3": "Bericht, Replikationsprotokoll und R-Export",
  "pricing.free.li4": "Kein Upload der Analysedaten im Gratis-Kern",
  "pricing.free.li5": "Browser-App und installierbare PWA",
  "pricing.cloud.tag": "Optional, wenn konfiguriert",
  "pricing.cloud.name": "openQCA Cloud",
  "pricing.cloud.price": "Abo",
  "pricing.cloud.li1": "Konto sowie manuelles Speichern und Laden von Cloud-Projekten",
  "pricing.cloud.li2": "Optionale KI-Prüfung für Research Briefs und Kalibrierungsevidenz",
  "pricing.cloud.li3": "Optionaler KI-Entwurf für Analysebegründungen",
  "pricing.cloud.li4": "Derselbe Analysekern, keine zusätzlichen QCA-Varianten",
  "pricing.cta.monthly": "Monatlich abonnieren",
  "pricing.cta.institution": "Institutions-Lizenz",
  "pricing.cta.soon": "Noch nicht verfügbar",
  "pricing.soonNote":
    "Wo Cloud-Dienste konfiguriert sind, können Konto und Projektspeicherung verfügbar sein. Die vollständige lokale Analyse funktioniert immer ohne Cloud.",
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

  // -- Konto: Abo, Projekte, DSGVO ---------------------------------------------
  "account.checkoutCancel": "Checkout abgebrochen — es wurde nichts abgebucht.",
  "account.tier.loading": "Lädt …",
  "account.tier.free": "Gratis",
  "account.tier.cloud": "Cloud",

  "account.subscription.title": "Abo & Zahlung",
  "account.subscription.manageBtn": "Abo verwalten",
  "account.subscription.error": "Abo konnte nicht geöffnet werden.",

  "account.projects.title": "Meine Projekte",
  "account.projects.loading": "Projekte werden geladen …",
  "account.projects.empty":
    "Noch keine gespeicherten Projekte. Projekte, die du in der App in der Cloud speicherst, erscheinen hier.",
  "account.projects.col.name": "Name",
  "account.projects.col.updated": "Zuletzt geändert",
  "account.projects.renameBtn": "Umbenennen",
  "account.projects.saveBtn": "Speichern",
  "account.projects.cancelBtn": "Abbrechen",
  "account.projects.deleteBtn": "Löschen",
  "account.projects.deleteConfirm": "Projekt „{name}“ endgültig löschen?",
  "account.projects.renameError": "Umbenennen fehlgeschlagen.",
  "account.projects.deleteError": "Löschen fehlgeschlagen.",
  "account.projects.exportAllBtn": "Alle Projekte exportieren (JSON)",
  "account.projects.exportError": "Export fehlgeschlagen.",

  "account.danger.title": "Daten & Konto (DSGVO)",
  "account.danger.body":
    "Du kannst alle deine Projekte jederzeit oben als JSON exportieren. Das endgültige Löschen deines Kontos entfernt dein Profil und alle gespeicherten Projekte unwiderruflich aus der Cloud.",
  "account.danger.deleteBtn": "Konto endgültig löschen",
  "account.danger.confirmMsg":
    "Dein Konto und alle gespeicherten Projekte werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden. Wirklich fortfahren?",
  "account.danger.error": "Kontolöschung fehlgeschlagen.",

  // -- Erklär-Popover (InfoHint) ------------------------------------------------
  "info.moreLink": "Mehr in der Methodik →",

  "info.consistency.title": "Konsistenz (Suffizienz)",
  "info.consistency.body":
    "Der Anteil der Zugehörigkeit zu X, der auch in Y liegt. Werte nahe 1 bedeuten: Fast überall, wo X hoch ausgeprägt ist, ist auch Y hoch ausgeprägt. Ab dem gewählten Konsistenz-Cutoff gilt eine Konfiguration als hinreichend konsistent für das Outcome.",
  "info.consistency.formula": "Σ min(Xᵢ,Yᵢ) / Σ Xᵢ",

  "info.pri.title": "PRI (Proportional Reduction in Inconsistency)",
  "info.pri.body":
    "Der PRI schützt vor Konfigurationen, die gleichzeitig Teilmenge von Y und von ~Y sind — ein Fall, den die einfache Konsistenz übersieht. Ist der PRI deutlich niedriger als die Konsistenz, ist das ein Warnsignal für eine widersprüchliche Konfiguration.",
  "info.pri.formula": "(Σmin(Xᵢ,Yᵢ) − Σmin(Xᵢ,Yᵢ,1−Yᵢ)) / (ΣXᵢ − Σmin(Xᵢ,Yᵢ,1−Yᵢ))",

  "info.rawCoverage.title": "Raw Coverage",
  "info.rawCoverage.body":
    "Der Anteil von Y, den dieser Pfad (bzw. diese Lösung) abdeckt. Hohe Coverage zeigt empirische Relevanz — sie sagt aber nichts über Hinreichendheit aus, dafür ist die Konsistenz zuständig.",
  "info.rawCoverage.formula": "Σ min(Xᵢ,Yᵢ) / Σ Yᵢ",

  "info.uniqueCoverage.title": "Unique Coverage",
  "info.uniqueCoverage.body":
    "Der Teil der Outcome-Abdeckung, den ausschließlich dieser Pfad liefert — kein anderer Pfad der Lösung erklärt diese Fälle. Sie ergibt sich als Coverage der Gesamtlösung minus Coverage der Lösung ohne diesen Pfad.",
  "info.uniqueCoverage.formula": "Coverage(Lösung) − Coverage(Lösung ohne Pfad)",

  "info.solutionConsistency.title": "Lösungs-Konsistenz",
  "info.solutionConsistency.body":
    "Konsistenz der gesamten Lösung: X ist hier die Zugehörigkeit zur Vereinigung aller Pfade (Maximum über alle Pfade je Fall). Sie zeigt, wie hinreichend die kombinierte Lösung insgesamt für das Outcome ist.",
  "info.solutionConsistency.formula": "Σ min(Xᵢ,Yᵢ) / Σ Xᵢ  — X = max über alle Pfade",

  "info.solutionCoverage.title": "Lösungs-Coverage",
  "info.solutionCoverage.body":
    "Coverage der gesamten Lösung: wie viel von Y durch die Vereinigung aller Pfade abgedeckt wird. Ergänzt die Lösungs-Konsistenz um die empirische Relevanz der kombinierten Lösung.",
  "info.solutionCoverage.formula": "Σ min(Xᵢ,Yᵢ) / Σ Yᵢ  — X = max über alle Pfade",

  "info.necessityConsistency.title": "Notwendigkeits-Konsistenz",
  "info.necessityConsistency.body":
    "Prüft, ob Y eine Teilmenge von X ist — also ob X (fast) immer vorliegt, wenn Y vorliegt. Ab ≥ 0,9 gilt eine Bedingung konventionell als Kandidat für eine notwendige Bedingung; die Coverage sollte zusätzlich als Relevanz-Check herangezogen werden.",
  "info.necessityConsistency.formula": "Σ min(Xᵢ,Yᵢ) / Σ Yᵢ",

  "info.necessityCoverage.title": "Notwendigkeits-Coverage",
  "info.necessityCoverage.body":
    "Zeigt, wie relevant eine notwendige Bedingung ist: Ist X trivial (z. B. fast immer vorhanden), kann die Konsistenz hoch sein, ohne dass X inhaltlich etwas erklärt. Niedrige Coverage bei hoher Konsistenz ist daher ein Warnsignal für eine triviale Bedingung.",
  "info.necessityCoverage.formula": "Σ min(Xᵢ,Yᵢ) / Σ Xᵢ",

  "info.necessityRelevance.title": "RoN — Relevance of Necessity",
  "info.necessityRelevance.body":
    "Coverage allein erkennt triviale Notwendigkeit nicht zuverlässig. RoN (Schneider & Wagemann 2012) misst, wie viel Nicht-Mitgliedschaft in X überhaupt noch möglich ist: Ist X bei fast allen Fällen nahezu vollständig vorhanden, geht RoN gegen 0 — die Bedingung ist zwar notwendig, aber nichtssagend. Werte nahe 1 sprechen für einen substantiellen Befund.",
  "info.necessityRelevance.formula": "Σ (1−Xᵢ) / Σ (1−min(Xᵢ,Yᵢ))",

  "info.suin.title": "SUIN-Bedingungen",
  "info.suin.body":
    "Eine Disjunktion X + Z kann notwendig sein, obwohl weder X noch Z es einzeln ist — die Teile sind dann „hinreichend, aber nicht notwendig für einen Faktor, der unzureichend, aber notwendig ist“ (SUIN, Mahoney/Kimball/Koivu 2009). Referenz für Auswahl und Kennzahlen ist superSubset aus dem R-Paket QCA; die Kreuzvalidierung ist in VALIDATION.md dokumentiert.",

  "info.caseDiagnostics.title": "Fall-Diagnostik",
  "info.caseDiagnostics.body":
    "Ordnet jeden Fall je Lösungspfad nach seiner Lage im XY-Plot ein (Schneider & Rohlfing 2013, 2016). Typische Fälle eignen sich für Prozessanalysen, „abweichend (Art)“ widerspricht der Hinreichendheit, und „nicht gedeckt“ zeigt, wo die Lösung unvollständig ist. Die 0,5-Grenze wird streng gelesen: Mitgliedschaft heißt > 0,5.",

  "info.freqCutoff.title": "Frequenz-Cutoff (n)",
  "info.freqCutoff.body":
    "Die Mindestzahl an Fällen, die eine Konfiguration in der Truth Table aufweisen muss, damit sie als beobachtet gilt. Konfigurationen mit weniger Fällen werden wie Remainder behandelt, unabhängig von ihrer Konsistenz.",

  "info.consCutoff.title": "Konsistenz-Cutoff",
  "info.consCutoff.body":
    "Die Schwelle, ab der eine beobachtete Konfiguration als konsistent gilt und OUT auf 1 gesetzt wird. Üblich sind Werte ab 0,75–0,8; die Wahl sollte begründet und im Robustheits-Sweep geprüft werden.",

  "info.out.title": "OUT (Truth-Table-Outcome)",
  "info.out.body":
    "1 = beobachtet und konsistent (erfüllt Frequenz- und Konsistenz-Cutoff); 0 = beobachtet, aber inkonsistent; ? = Remainder — eine Konfiguration ohne (ausreichend) beobachtete Fälle, für die keine empirische Aussage möglich ist.",

  "info.calibAnchors.title": "Kalibrierungs-Anker (e / c / i)",
  "info.calibAnchors.body":
    "Die drei Ankerpunkte übersetzen Rohwerte in Fuzzy-Set-Zugehörigkeit: „voll draußen“ (e), Kreuzung (c) und „voll drinnen“ (i). Die direkte Methode berechnet dazwischen eine logistische Kurve (Fixpunkte etwa 0,05 / 0,50 / 0,95); die lineare Methode verbindet dieselben Anker stückweise linear. Anker sind eine inhaltliche Forschungsentscheidung, keine automatische Verteilungsdiagnose.",
  "info.calibAnchors.formula": "e → 0,05 · c → 0,50 · i → 0,95 (direkt; linear: 0 / 0,5 / 1)",

  "info.solComplex.title": "Komplexe (konservative) Lösung",
  "info.solComplex.body":
    "Nutzt nur beobachtete Konfigurationen; Remainder werden nicht als Vereinfachungsannahmen zugelassen. Das ergibt die vorsichtigste, am wenigsten sparsame Lösung — jede Aussage stützt sich ausschließlich auf tatsächlich beobachtete Fälle.",

  "info.solIntermediate.title": "Intermediäre Lösung",
  "info.solIntermediate.body":
    "Liegt zwischen komplexer und sparsamer Lösung: Nur Remainder, die zu den angegebenen Richtungserwartungen passen („easy counterfactuals“), werden als Vereinfachungsannahmen zugelassen. Das gilt meist als die theoretisch am besten begründete Lösung.",

  "info.solParsimonious.title": "Sparsame (parsimonious) Lösung",
  "info.solParsimonious.body":
    "Lässt alle Remainder als Vereinfachungsannahmen zu, auch theoretisch nicht plausible („difficult“) Counterfactuals. Das ergibt die einfachste Lösung, die aber unbegründete Annahmen über unbeobachtete Fälle enthalten kann.",

  "info.robustness.title": "Robustheits-Sweep",
  "info.robustness.body":
    "Zeigt, wie die sparsame Lösung sich verändert, wenn der Konsistenz-Cutoff systematisch variiert wird. Bleibt die Lösung über einen weiten Bereich stabil, ist die Cutoff-Wahl unkritisch; ändert sie sich schnell, sollte der gewählte Cutoff besonders sorgfältig begründet werden.",

  "info.negatedOutcome.title": "Negiertes Outcome (~Y)",
  "info.negatedOutcome.body":
    "QCA ist asymmetrisch: Eine Lösung, die Y erklärt, erklärt nicht automatisch das Fehlen von Y. Deshalb wird dieselbe Analyse separat für ~Y durchgeführt, indem die Outcome-Zugehörigkeit jedes Falls durch 1 − y ersetzt wird — die Pfade können völlig andere Bedingungen umfassen.",
  "info.negatedOutcome.formula": "~Y = 1 − Y",

  "info.xyPlot.title": "XY-Plot (Suffizienz)",
  "info.xyPlot.body":
    "Stellt jeden Fall als Punkt mit X-Zugehörigkeit (Bedingung) gegen Y-Zugehörigkeit (Outcome) dar. Punkte oberhalb der Diagonale (Y ≥ X) stützen die These „X ist hinreichend für Y“; Punkte weit unterhalb der Diagonale sprechen dagegen.",

  // -- Variablen: Import-Hinweis ------------------------------------------------
  "vars.import.heuristic": "Standard bei neuen Importen: Die letzte numerische Spalte wird als Outcome vorgemerkt, alle anderen numerischen Spalten als Bedingungen. Bitte prüfen Sie die Rollen vor der Interpretation.",



  // -- Research-question workspace -------------------------------------------
  "workspace.nav.aria": "Analysebereiche",
  "workspace.nav.answer": "Antwort",
  "workspace.nav.research": "Forschungsdesign",
  "workspace.nav.decisions": "Entscheidungen",
  "workspace.nav.evidence": "Evidenz",
  "workspace.nav.defense": "Prüfpaket",
  "workspace.answer.title": "Aktuelle Antwort",
  "workspace.research.title": "Forschungsdesign",
  "workspace.decisions.title": "Entscheidungen",
  "workspace.evidence.title": "Evidenz",
  "workspace.defense.title": "Prüfpaket",
  "workspace.start.title": "Starten Sie mit Ihren eigenen Small-N-Daten",
  "workspace.start.desc": "Importieren Sie CSV oder XLSX lokal. Alternativ können Sie ein synthetisches Lehrbeispiel öffnen oder ein gespeichertes Projekt ausdrücklich fortsetzen.",
  "workspace.start.learn.title": "Synthetisches Beispiel öffnen",
  "workspace.start.learn.desc": "Lädt ein vollständig berechenbares Lehrbeispiel. Synthetisch, nicht zitierfähig.",
  "workspace.start.learn.action": "Synthetisches Beispiel öffnen",
  "workspace.start.import.title": "Eigene Daten importieren",
  "workspace.start.import.desc": "CSV oder XLSX lokal einlesen. Danach prüfen Sie Forschungsfrage, Rollen und Entscheidungen.",
  "workspace.start.import.action": "Eigene Daten importieren",
  "workspace.start.import.schema": "Erste Spalte: eindeutige Fall-ID. Weitere Spalten: numerische Rohwerte oder Set-Zugehörigkeiten von 0 bis 1. Überschriften erforderlich.",
  "workspace.noData": "Noch keine Daten geladen. Öffnen Sie Antwort und importieren Sie eigene Daten oder starten Sie mit dem synthetischen Beispiel.",
  "workspace.start.resume.title": "Projekt fortsetzen",
  "workspace.start.resume.none": "Kein gespeichertes Projekt",
  "workspace.start.resume.action": "Gespeichertes Projekt laden",
  "workspace.start.resume.meta": "{dataset}, gespeichert {savedAt}",
  "workspace.import.error": "Import fehlgeschlagen: {message}",
  "workspace.dataset.summary": "{dataset}: {rows} Rohfälle, {cases} analysierte Fälle, {excluded} ausgeschlossen oder ungeklärt",
  "workspace.data.actions": "Daten und Projekt",
  "workspace.examples.summary": "Synthetische Lehrdatensätze",
  "workspace.rawData.summary": "Rohdatentabelle",
  "workspace.descriptives.summary": "Deskriptivstatistik der aktiven Sets",
  "workspace.roles.title": "Variablenrollen",
  "workspace.roles.suggested": "Automatisch vorgeschlagen, bis das Forschungsdesign bestätigt ist.",
  "workspace.brief.title": "Research Brief",
  "workspace.brief.desc": "Der Brief bindet Frage, Falluniversum, Zeitraum, Outcome-Konzept und Auswahl der Bedingungen an die aktuellen Rollen.",
  "workspace.brief.question": "Forschungsfrage",
  "workspace.brief.question.help": "Formulieren Sie die zu untersuchende mengen-theoretische Frage.",
  "workspace.brief.caseUniverse": "Falluniversum",
  "workspace.brief.caseUniverse.help": "Welche Fälle gehören zur Untersuchung und warum?",
  "workspace.brief.timePeriod": "Zeitraum",
  "workspace.brief.timePeriod.help": "Für welchen Zeitraum gelten Fälle und Set-Definitionen?",
  "workspace.brief.outcomeConcept": "Outcome-Konzept",
  "workspace.brief.outcomeConcept.help": "Benennen Sie die inhaltliche Bedeutung der Outcome-Zugehörigkeit.",
  "workspace.brief.conditionRationale": "Begründung der Bedingungsauswahl",
  "workspace.brief.conditionRationale.help": "Warum sind genau diese Bedingungen für die Frage relevant?",
  "workspace.answer.syntheticReason": "Synthetische Demo-Daten: Dieses Ergebnis dient nur zur Orientierung und ist nicht zitierfähig.",
  "workspace.answer.noncausal": "Dies ist ein konfigurationaler Zusammenhang in den analysierten Fällen, kein kausaler Effekt.",
  "workspace.brief.confirm": "Forschungsdesign bestätigen",
  "workspace.brief.confirmed": "Forschungsdesign bestätigt",
  "workspace.brief.invalidated": "Änderungen an Brief oder Rollen erfordern eine neue Bestätigung.",
  "workspace.brief.rolesRequired": "Vor der Bestätigung müssen mindestens eine Bedingung und genau ein Outcome gewählt sein.",
  "workspace.brief.rolesAction": "Variablenrollen wählen",
  "workspace.decisions.ledgerTitle": "Entscheidungsregister",
  "workspace.decisions.priority": "Vollständigkeitspriorität, keine Rangfolge inhaltlicher Wichtigkeit.",
  "workspace.decisions.ready": "Alle aktuellen Entscheidungen sind bestätigt und belegt.",
  "workspace.decisions.open": "{n} offene Entscheidungen",
  "workspace.decisions.strongest": "Stärkste offene Entscheidung",
  "workspace.decisions.jump": "Entscheidung bearbeiten",
  "workspace.decisions.brief": "Research Brief bestätigen",
  "workspace.decisions.calibration": "Set {column} dokumentieren",
  "workspace.decisions.frequency": "Frequency-Cutoff begründen",
  "workspace.decisions.consistency": "Consistency-Cutoff begründen",
  "workspace.decisions.expectations": "Richtungserwartungen begründen",
  "workspace.decisions.missing": "Fehlt: {items}",
  "workspace.decisions.currentValue": "Aktueller Wert",
  "workspace.decision.rationale": "Begründung",
  "workspace.decision.confirm": "Aktuellen Wert bestätigen",
  "workspace.decision.confirmed": "Bestätigt",
  "workspace.decision.missing.caseReview": "Fallprüfung",
  "workspace.decision.missing.provisionalDefaults": "vorläufige Standardwerte",
  "workspace.decision.missing.sensitivityReview": "Sensitivitätsprüfung",
  "workspace.decision.missing.more": "und {n} weitere",
  "workspace.decision.missing.other": "weitere Dokumentation",
  "workspace.decision.frequency.effect": "{positive} positive Truth-Table-Zeilen, {unassigned} unzugeordnete Fälle bei n.cut = {value}.",
  "workspace.decision.consistency.effect": "{positive} positive Truth-Table-Zeilen, {unassigned} unzugeordnete Fälle bei incl.cut = {value}.",
  "workspace.decision.expectations.effect": "{models} intermediäre Modelle unter den aktuellen Richtungserwartungen.",
  "workspace.decision.effect.note": "Annahme → beobachtete rechnerische Folge. Dies ist keine empirische Validierung.",
  "workspace.decisions.notComputable": "Mindestens eine aktive Set-Kalibrierung ist noch nicht berechenbar.",
  "workspace.calibration.title": "Set-Kalibrierungen",
  "workspace.calibration.quick": "Schnell",
  "workspace.calibration.documentation": "Dokumentation",
  "workspace.answer.question.pending": "Bestätigen Sie die Forschungsfrage, damit die Aussage an einen Research Brief gebunden ist.",
  "workspace.answer.question.action": "Forschungsdesign öffnen",
  "workspace.answer.analysis.notComputable": "Nicht berechenbar",
  "workspace.answer.analysis.noSolution": "Keine hinreichende Lösung",
  "workspace.answer.analysis.solution": "Lösung berechnet",
  "workspace.answer.maturity.synthetic": "Synthetisch",
  "workspace.answer.maturity.provisional": "Vorläufig",
  "workspace.answer.maturity.ready": "Defense-ready",
  "workspace.answer.statement": "Unter der aktuellen Kalibrierung ist/sind {paths} in den {cases} analysierten Fällen hinreichend für die Zugehörigkeit zu {outcome}.",
  "workspace.answer.absence": "Abwesenheit von {set}",
  "workspace.answer.or": " oder ",
  "workspace.answer.and": " und ",
  "workspace.answer.ambiguous": "{n} gleichwertige intermediäre Modelle liegen vor. Die Aussage zeigt den ersten Repräsentanten; alle Alternativen stehen in Evidenz.",
  "workspace.answer.cases.typical": "Unterstützend",
  "workspace.answer.cases.kind": "Abweichend der Art nach",
  "workspace.answer.cases.degree": "Abweichend dem Grad nach",
  "workspace.answer.cases.uncovered": "Outcome-Fälle ohne Deckung",
  "workspace.answer.cases.crossover": "Grenzfälle bei 0,5",
  "workspace.answer.robustness": "Robustheit: {stable} von {total} geprüften Zellen stimmen mit dem aktuellen intermediären Ergebnis überein.",
  "workspace.answer.evidence": "Details in Evidenz",
  "workspace.answer.noRoles": "Mindestens eine aktive Bedingung und genau ein aktives Outcome sind erforderlich.",
  "workspace.answer.noCases": "Nach Missing- und Ausschlussregeln verbleiben keine analysierbaren Fälle.",
  "workspace.answer.tooMany": "Mit {n} Bedingungen ist die Suffizienzanalyse auf höchstens 12 Bedingungen begrenzt.",
  "workspace.answer.noPositive": "Die Truth Table enthält unter den aktuellen Cutoffs keine positive Zeile.",
  "workspace.answer.noModel": "Die intermediäre Minimierung liefert unter den aktuellen Annahmen kein Modell.",
  "workspace.evidence.chain": "Prüfbare Evidenzkette",
  "workspace.evidence.brief": "Research Brief",
  "workspace.evidence.sets": "Aktive Set-Definitionen",
  "workspace.evidence.sources": "Quellenabdeckung",
  "workspace.evidence.cases": "Ausgeschlossene oder ungeklärte Fälle",
  "workspace.evidence.analysis": "Analyseentscheidungen",
  "workspace.evidence.editResearch": "Im Forschungsdesign bearbeiten",
  "workspace.evidence.editDecisions": "In Entscheidungen bearbeiten",
  "workspace.evidence.truthTable": "Truth Table, Remainder und Cutoffs",
  "workspace.evidence.solutions": "Alle Lösungen und gleichwertigen Modelle",
  "workspace.evidence.diagnostics": "Fall-Diagnostik und XY-Plot",
  "workspace.evidence.robustness": "Robustheit und negiertes Outcome",
  "workspace.defense.ready": "Prüfpaket freigegeben",
  "workspace.defense.blocked": "Replikationsartefakte bleiben gesperrt, bis alle Punkte erfüllt sind.",
  "workspace.defense.check.demo": "Eigene, nicht synthetische Daten",
  "workspace.defense.check.cases": "Mindestens ein analysierter Fall",
  "workspace.defense.check.brief": "Bestätigter vollständiger Research Brief",
  "workspace.defense.check.analysis": "Begründete und bestätigte Analyseentscheidungen",
  "workspace.defense.check.calibration": "Alle aktiven Sets protokollbereit und sourced oder externally checked",
  "workspace.defense.check.results": "Notwendigkeit, Truth Table und Lösungen berechnet",
  "workspace.defense.reportMissing": "Vorläufiger Bericht. Noch offen: {groups}",
  "workspace.defense.artifacts": "Replikationsartefakte",
  "workspace.defense.references": "Methodikreferenzen",
  "workspace.defense.limitations": "Bekannte Grenzen",
  "workspace.defense.limitations.body": "Das Szenario- und Cutoff-Raster implementiert nicht die RF_incl-, RF_cov- und RF_case-Metriken nach Oana und Schneider. Im breiteren ESA-Korpus stimmen 11.408 von 13.216 intermediären Lösungen (86,3 %) mit R überein; die Engine bleibt bei den Abweichungen spezifischer. Komplexe und sparsame Lösungen sind davon nicht betroffen.",

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
  "landing.nav.proof": "Live proof",
  "landing.nav.validation": "Validation",
  "landing.nav.methodik": "Methodology",
  "landing.nav.pricing": "Cost",
  "landing.nav.ariaPrimary": "Primary navigation",

  "landing.hero.eyebrow": "QCA for small-N research without R",
  "landing.hero.title": "From your CSV/XLSX data to a defensible QCA.",
  "landing.hero.sub":
    "openQCA takes crisp or fuzzy-set data to a solution formula, case evidence, and an inspectable defense pack. You document the research design, calibrations, cutoffs, and directional expectations where they affect the analysis.",
  "landing.hero.local":
    "The complete analysis core runs free and locally in your browser. The free core does not upload your research data.",
  "landing.hero.ctaDemo": "Open the synthetic example",

  "landing.hero.ctaOwn": "Start analysing your own data",
  "landing.fit.aria": "Checklist for whether openQCA fits your project",
  "landing.fit.title": "A fit for your project when",
  "landing.fit.i1": "you are investigating a comparative small-N question",
  "landing.fit.i2": "your conditions are, or need to become, crisp or fuzzy sets",
  "landing.fit.i3": "each row in your CSV or XLSX represents exactly one case",
  "landing.fit.i4": "you need standard QCA with necessity, a truth table, and complex, intermediate, or parsimonious solutions",

  "landing.proof.eyebrow": "A real engine, not a result mock-up",
  "landing.proof.title": "One input, one computed result, one inspectable chain of evidence.",
  "landing.proof.intro":
    "This excerpt is computed on load with the same engine and demo settings as the app. The annotations show what happens to the cases and what you take into a defense.",
  "landing.proof.aria": "Live-computed path from raw data through a QCA solution to a defense pack",
  "landing.proof.input.title": "Your case table",
  "landing.proof.input.body": "Import cases, assign conditions and outcome, and calibrate raw values with a traceable rationale.",
  "landing.proof.input.cases": "18 cases in this proof",
  "landing.proof.raw": "Raw values",
  "landing.proof.calibrated": "Set membership",
  "landing.proof.crossover": "0.5",
  "landing.proof.result.title": "Live-computed solution",
  "landing.proof.result.body": "The truth table, intermediate formula, and fit measures come from the synthetic demo dataset.",
  "landing.proof.consistency": "Consistency",
  "landing.proof.coverage": "Coverage",
  "landing.proof.cutoff": "incl. ≥ 0.80",
  "landing.proof.output": "OUT",
  "landing.proof.output.yes": "positive truth-table row",
  "landing.proof.output.no": "not a positive truth-table row",
  "landing.proof.defense.title": "Defense pack",
  "landing.proof.defense.body": "Replication artifacts become exportable only after the relevant decisions have been justified and confirmed.",
  "landing.proof.defense.i1": "decision ledger with rationales",
  "landing.proof.defense.i2": "case-linked evidence and diagnostics",
  "landing.proof.defense.i3": "HTML report, protocol JSON, and methods text",
  "landing.proof.defense.i4": "R script as a bridge to the specialist reference",
  "landing.proof.caption":
    "Synthetic teaching data, not citable. The formula and measures retain the existing test IDs for direct comparison with the app.",

  "landing.workflow.eyebrow": "The difference is in the decisions",
  "landing.workflow.title": "Do not just calculate. Show why the result is defensible.",
  "landing.workflow.intro":
    "fsQCA and R calculate QCA. openQCA has a different emphasis: consequential decisions, their rationale, and their observed effects remain visible as one chain of provenance.",
  "landing.workflow.brief.title": "Confirm the research brief",
  "landing.workflow.brief.desc": "Research question, case universe, time period, outcome concept, and condition selection form the project contract.",
  "landing.workflow.decisions.title": "Justify assumptions",
  "landing.workflow.decisions.desc": "Calibration anchors, cutoffs, and directional expectations carry a visible status, rationale, and confirmation.",
  "landing.workflow.evidence.title": "Trace back to cases",
  "landing.workflow.evidence.desc": "Formula, fit measures, typical and deviant cases, and robustness findings stay connected.",
  "landing.workflow.pack.title": "Release the defense pack",
  "landing.workflow.pack.desc": "Replication artifacts become exportable only when the current decisions are defense-ready.",

  "landing.validation.eyebrow": "Validation you can inspect",
  "landing.validation.title": "23 of 25 scenarios match the R package QCA.",
  "landing.validation.intro":
    "The fixed cross-validation compares solution formulas and fit measures, plus necessity, with checked-in R references. The broader ESA check additionally measures the reach of the known intermediate-solution divergence.",
  "landing.validation.matrix.title": "Fixed cross-validation matrix",
  "landing.validation.matrix.body": "23 scenarios PASS, including all six necessity scenarios against superSubset.",
  "landing.validation.deviations.title": "Broader ESA corpus: 86.3% agreement",
  "landing.validation.deviations.body": "11,408 of 13,216 tested three-condition configurations agree with R. In the remaining cases the engine stays more specific; complex and parsimonious solutions are unaffected.",
  "landing.validation.calibration.title": "Direct calibration checked separately",
  "landing.validation.calibration.body": "The crossover is exactly 0.500; a documented residual difference of at most 0.01 remains against the rounded R reference.",
  "landing.validation.scope":
    "23/25 describes the fixed reference suite, not general R equivalence. The broader ESA measurement concerns the intermediate solution and includes ambig_intermediate_mixed and lipset_intermediate_all_present. R remains the reference for specialist cases.",
  "landing.validation.linksAria": "Validation evidence",
  "landing.validation.linkRecord": "Validation record and divergences",
  "landing.validation.linkScript": "Executable cross-validation script",
  "landing.validation.linkMethods": "Formulas and methodology",

  "landing.compare.eyebrow": "Tool choice, not a tool fight",
  "landing.compare.title": "openQCA, fsQCA, or R?",
  "landing.compare.intro": "The tools address different parts of the same research path. This comparison names their emphasis, not a universal winner.",
  "landing.compare.tableAria": "Comparison of openQCA, fsQCA 4, and the R package QCA",
  "landing.compare.dimension": "Work required",
  "landing.compare.colR": "R package QCA",
  "landing.compare.start": "Start without code",
  "landing.compare.start.openqca": "CSV/XLSX directly in the browser",
  "landing.compare.start.fsqca": "desktop interface",
  "landing.compare.start.r": "R environment and script",
  "landing.compare.provenance": "Rationales and confirmations",
  "landing.compare.provenance.openqca": "integrated decision ledger",
  "landing.compare.provenance.fsqca": "document separately",
  "landing.compare.provenance.r": "document in a script or notebook",
  "landing.compare.evidence": "Case evidence and defense pack",
  "landing.compare.evidence.openqca": "integrated and exportable",
  "landing.compare.evidence.fsqca": "assemble outputs separately",
  "landing.compare.evidence.r": "freely programmable",
  "landing.compare.bridge": "Continue in R",
  "landing.compare.bridge.openqca": "one-click R script",
  "landing.compare.bridge.fsqca": "separate transition",
  "landing.compare.bridge.r": "already in the reference environment",
  "landing.compare.scope": "Methodological emphasis",
  "landing.compare.scope.openqca": "guided standard QCA",
  "landing.compare.scope.fsqca": "established desktop workflow",
  "landing.compare.scope.r": "special cases and extensible analysis",
  "landing.compare.note":
    "The R package QCA remains the specialist reference, particularly beyond openQCA's documented scope and for the known ESA divergences. openQCA does not replace R. It provides a traceable entry point and a direct bridge to it.",

  "landing.pricing.eyebrow": "A clear product boundary",
  "landing.pricing.title": "The complete local analysis stays free.",
  "landing.pricing.intro": "Cloud is optional convenience, not a methods upgrade. A complete QCA, report, and defense pack require no account.",
  "landing.pricing.free.label": "Free, fully local",
  "landing.pricing.free.name": "openQCA Local",
  "landing.pricing.free.desc": "Analysis core, guided decisions, evidence, report, replication protocol, and R export in the browser and as an installable PWA.",
  "landing.pricing.cloud.label": "Optional, where configured",
  "landing.pricing.cloud.name": "openQCA Cloud",
  "landing.pricing.cloud.desc": "An account, manual cloud project save and load, plus optional reviewed AI drafts for research briefs, calibration evidence, and analysis rationales.",
  "landing.pricing.note": "Cloud adds no QCA variants, collaboration, or automatic synchronization. Availability depends on the instance.",
  "landing.pricing.details": "Cost and availability in detail",

  "landing.cta.title": "Start with your own small-N table.",
  "landing.cta.sub": "Import CSV or XLSX locally, confirm the research design, and calculate an immediate result that is clearly marked provisional.",

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
    "openQCA is open source (MIT license). The full source code — engine, web app, and validation suite — is publicly available on GitHub.",
  "download.source.link": "View the repository on GitHub →",



  // -- Import errors (alert) --------------------------------------------------
  "alert.csvError": "Could not read the CSV file: {msg}",
  "alert.xlsxError": "Could not read the Excel file: {msg}",
  "alert.unknown": "unknown",

  // -- Data section (dataset loaded) ------------------------------------------
  "data.reloadBtn": "Load a different dataset (CSV/XLSX)",
  "data.saveLocal": "Save project locally",
  "data.loadLocal": "Load local project",
  "data.localSaved": "Saved locally.",
  "data.localRestored": "Local project loaded.",
  "data.localMissing": "No local project found.",
  "data.localSaveFailed": "Local save unavailable (storage quota or private mode).",
  "data.title": "Data · {n} cases",
  "descriptives.title": "Descriptive statistics (calibrated sets)",



  // -- Key terms (Glossary) -----------------------------------------------------
  "gloss.toggle": "Method terms",
  "gloss.set.term": "Set",
  "gloss.set.def":
    "A set is a property that a case belongs to more or less strongly — e.g. “democratic”.",
  "gloss.membership.term": "Membership (0–1)",
  "gloss.membership.def":
    "The number between 0 and 1 that shows how strongly a case belongs to a set.",
  "gloss.crispFuzzy.term": "Crisp vs. fuzzy",
  "gloss.crispFuzzy.def":
    "Crisp only knows 0 or 1 (fully out/in); fuzzy allows degrees in between.",
  "gloss.calibration.term": "Calibration",
  "gloss.calibration.def":
    "Translating raw values into memberships from 0 to 1, using substantively justified anchors.",
  "gloss.consistency.term": "Consistency",
  "gloss.consistency.def":
    "How reliably a condition (or combination) goes together with the outcome.",
  "gloss.coverage.term": "Coverage",
  "gloss.coverage.def":
    "How much of the outcome a solution actually explains — its explanatory reach.",
  "gloss.moreLink": "In depth: methodology →",

  // -- Calibration ------------------------------------------------------------
  "calib.title": "Calibration that thinks along",
  "calib.desc":
    "Raw values become fuzzy-set membership. The coach checks every decision live against your cases.",
  "calib.anchorOut": "Fully out → ≈0.047",
  "calib.anchorCross": "Crossover → 0.500",
  "calib.anchorIn": "Fully in → ≈0.953",
"calib.badOrder": "Anchors must follow membership direction: fully out < crossover < fully in (descending raw values for an inverted scale).",
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
  "calib.reset": "Reset anchors",
  "calib.handle.aria": "{name}: {value} — adjust with the arrow keys (hold Shift for larger steps)",
  "calib.handle.out": "Fully-out anchor",
  "calib.handle.cross": "Crossover anchor",
  "calib.handle.in": "Fully-in anchor",
  "calib.rug.desc": "Drag the handles beneath the curve; the short ticks show the distribution of raw values.",
  "calib.allCalibrated": "Your data is already calibrated — nothing to do.",
  "calib.descGuided":
    "From set definition through method and justified anchors to case review and sensitivity. Distributional plots are aids — not substantive proof on their own.",
  "calib.seed.apply": "Use the filled-in teaching example (editable, provisional)",
  "calib.ph.definition":
    "Membership in the set «{col}» (provisional placeholder — replace with a substantive definition).",
  "calib.ph.fullOut": "Clearly out of the set (provisional)",
  "calib.ph.crossover": "Maximum ambiguity (provisional)",
  "calib.ph.fullIn": "Clearly in the set (provisional)",
  "calib.ph.provenance":
    "Already calibrated {type} values from «{dataset}» (confirm provenance before publication).",
  "calib.ph.precalibratedDefinition":
    "Pre-calibrated membership for «{col}» (provisional — document original calibration).",
  "calib.seed.hint":
    "Synthetic rationales for rohwerte-demokratie.csv — not a literature claim. Replace before publication.",
  "calib.missing.excluded": "{n} case(s) excluded from analysis due to missing values.",
  "calib.tab.outcome": "Outcome",
  "calib.ready.yes": "analysis-ready",
  "calib.ready.no": "incomplete",
  "calib.status.unresolved": "unresolved",
  "calib.status.provisional": "provisional",
  "calib.status.sourced": "sourced",
  "calib.status.external": "externally checked",
  "calib.status.markProvisional": "Mark as provisional (without source)",
  "calib.set.title": "1. Define the set",
  "calib.set.label": "Set label",
  "calib.set.unit": "Unit",
  "calib.set.scope": "Population / scope",
  "calib.set.time": "Time period",
  "calib.set.definition": "Substantive membership definition",
  "calib.set.highIsIn": "Higher raw value = more membership",
  "calib.outcome.hintTitle": "Outcome is its own set",
  "calib.outcome.hintBody":
    "Outcome calibration is a research-design choice and is not the same as truth-table frequency, consistency, or PRI cutoffs or solution fit metrics. Sources: Ragin (2008); Schneider & Wagemann (2012); Oana & Schneider (2022), DOI 10.1177/00491241211036158.",
  "calib.outcome.blurb":
    "There is no universal “good outcome value”. Outcome membership ≠ analysis cutoffs.",
  "calib.method.title": "2. Calibration method",
  "calib.method.direct": "Direct (fuzzy, logistic)",
  "calib.method.crisp": "Crisp (one inclusion threshold)",
  "calib.method.linear": "Linear (fuzzy, piecewise)",
  "calib.method.provenance": "Provenance of already calibrated values",
  "calib.method.provenancePh": "e.g. from paper X, appendix table 2; scale 0–1 …",
  "calib.method.directHelp":
    "Three qualitative anchors map to raw values and are translated logistically (Ragin 2008).",
  "calib.method.directHelpInverted":
    "Three qualitative anchors map to descending raw values when lower raw values mean more membership; the resulting curve is inverted accordingly.",
  "calib.method.linearHelp":
    "The same three qualitative anchors are connected with a piecewise-linear membership function; this matches QCA::calibrate(logistic = FALSE).",
  "calib.method.linearHelpInverted":
    "The same three qualitative anchors are connected with a piecewise-linear function when lower raw values mean more membership, then the result is inverted.",
  "calib.method.crispHelp":
    "One substantively justified inclusion boundary: raw ≥ threshold → 1, else 0 (higher raw values mean more membership).",
  "calib.method.crispHelpInverted":
    "One substantively justified inclusion boundary: raw ≤ threshold → 1, else 0 (lower raw values mean more membership).",
  "calib.method.alreadyHelp":
    "Values are already memberships — document provenance and semantics.",
  "calib.anchors.title": "3. Qualitative anchors and raw values",
  "calib.anchors.qualFirst": "State the qualitative meaning first, then the raw number.",
  "calib.anchors.meaning": "Meaning",
  "calib.anchors.raw": "Raw value",
  "calib.crisp.title": "3. Crisp threshold",
  "calib.crisp.meaning": "Meaning of the inclusion threshold",
  "calib.crisp.threshold": "Threshold (raw)",
  "calib.evidence.title": "4. Evidence",
  "calib.evidence.help":
    "Literature, theory, standards, expertise, or case knowledge. Label distributional diagnostics as empirical aids — not sole justification.",
  "calib.evidence.type": "Type",
  "calib.evidence.supports": "Supports",
  "calib.evidence.note": "Note / short excerpt",
  "calib.evidence.authors": "Authors",
  "calib.evidence.year": "Year",
  "calib.evidence.titleField": "Title",
  "calib.evidence.doi": "DOI/URL",
  "calib.evidence.pages": "Pages",
  "calib.evidence.add": "Add evidence",
  "calib.evidence.remove": "Remove",
  "calib.evidence.diagnosticNote": "Empirical aid — not substantive proof alone.",
  "calib.evidence.type.literature": "Literature",
  "calib.evidence.type.theory": "Theory",
  "calib.evidence.type.standard": "Standard/norm",
  "calib.evidence.type.domain_expertise": "Domain expertise",
  "calib.evidence.type.case_knowledge": "Case knowledge",
  "calib.evidence.type.empirical_diagnostic": "Empirical diagnostic (aid)",
  "calib.cases.title": "5. Review cases",
  "calib.cases.case": "Case",
  "calib.cases.raw": "Raw",
  "calib.cases.m": "Membership",
  "calib.cases.side": "Side",
  "calib.cases.flags": "Flags",
  "calib.cases.note": "Exception",
  "calib.sens.title": "6. Anchor sensitivity",
  "calib.sens.help": "Plausible alternatives at the crossover/threshold of {col}; other sets stay fixed.",
  "calib.sens.variant": "Variant",
  "calib.sens.flips": "Δ m",
  "calib.sens.half": "Side of 0.5",
  "calib.sens.tt": "TT bits",
  "calib.sens.solChanged": "Solution?",
  "calib.sens.baseSol": "Base",
  "calib.sens.varSol": "Variant",
  "calib.sens.yes": "yes",
  "calib.sens.no": "no",
  "calib.sens.stable": "No qualitative membership or solution changes under the tested alternatives.",
  "calib.sens.unstable": "At least one alternative changes side-of-0.5 and/or the parsimonious solution — document in the protocol.",
  "calib.sens.flipList": "Side-of-0.5 flip examples:",
  "calib.migrate.banner":
    "This project was saved in an older version: please complete set definitions and anchor rationales (new in this version).",
  "calib.protocol.ready": "Protocol ready: definition, method, evidence, case review, and sensitivity are documented.",
  "calib.protocol.incomplete": "Protocol incomplete ({n} open item(s)).",
  "calib.demoNotice": "Synthetic demo dataset: calculations and the report are visible (the report carries a warning banner) — protocol and R export stay locked.",

  // -- Calibration: view switch, documentation meter, quick view ---------------
  "calib.view.aria": "Calibration view",
  "calib.view.quick": "Quick",
  "calib.view.doc": "Documentation",
  "calib.meter.title": "Publication readiness: {done} of {total} sets documented",
  "calib.meter.aria": "Documentation status per set",
  "calib.meter.hint":
    "Results compute immediately — documentation makes them publication-ready and unlocks the protocol and R export.",
  "calib.meter.docBtn": "Document →",
  "calib.meter.chipDone": "documented",
  "calib.meter.chipOpen": "open",
  "calib.meter.chipAria": "Document {col}",
  "calib.quick.title": "Set anchors, see results",
  "calib.quick.desc":
    "Per set: choose a method and place the three anchors — by typing a value or by dragging the handles below the curve. Necessity, truth table, and solutions recompute right away.",
  "calib.quick.anchorsFromData":
    "Sets marked “10th/50th/90th percentile” still carry anchors that were suggested automatically from your data distribution on import — that is not yet a substantive decision. Data-driven thresholds are not a justification in QCA: set the anchors where they make sense substantively. The mark disappears once you touch an anchor of that set.",
  "calib.quick.anchorsFromData.chip": "10th/50th/90th percentile",
  "calib.quick.method": "Method",
  "calib.quick.method.direct": "Direct",
  "calib.quick.method.linear": "Linear",
  "calib.quick.method.crisp": "Crisp",
  "calib.quick.methodAria": "Calibration method for {col}",
  "calib.quick.noMethod": "No method chosen yet — pick direct, linear, or crisp.",
  "calib.quick.passthrough": "Already calibrated ({type}): passed through unchanged.",
  "calib.quick.dist": "{inCount} cases in · {outCount} out",
  "calib.quick.nearHalf": "{n} near 0.5",
  "calib.quick.missing": "{n} without a value",
  "calib.set.notes": "Additional set notes / exceptions",
  "calib.method.confirm": "Confirm method and semantics",
  "calib.method.confirmed": "Method confirmed",
  "calib.anchor.invalid": "At least one anchor is not a finite number.",
  "calib.anchor.duplicate": "Anchors must be distinct; check their substantive order.",
  "calib.missing.title": "Missing values",
  "calib.missing.policy": "How to handle missing raw values",
  "calib.missing.exclude": "Exclude case from analysis",
  "calib.missing.assign": "Assign membership explicitly",
  "calib.missing.unresolved": "Leave unresolved (do not analyze)",
  "calib.missing.membership": "Assigned membership",
  "calib.missing.help": "This choice is recorded in the protocol; missing values are never silently treated as 0.",
  "calib.evidence.coverage": "Evidence coverage:",
  "calib.evidence.coverageComplete": "all required decision points have substantive support.",
  "calib.evidence.coverageMissing": "Evidence is missing for: {targets}.",
  "calib.evidence.target.set": "set definition",
  "calib.evidence.target.method": "method",
  "calib.evidence.target.fullOut": "full out",
  "calib.evidence.target.crossover": "crossover",
  "calib.evidence.target.fullIn": "full in",
  "calib.evidence.target.threshold": "crisp threshold",
  "calib.status.label": "Decision status",
  "calib.status.reviewer": "Reviewer",
  "calib.status.date": "Review date",
  "calib.status.note": "Review note",
  "calib.cases.review": "I reviewed case memberships, boundary cases, missing values, and exceptions.",
  "calib.sens.altLabel": "Alternative label",
  "calib.sens.delta": "Change at crossover / threshold",
  "calib.sens.rationale": "Substantive rationale for this alternative",
  "calib.sens.add": "Add alternative",
  "calib.sens.notes": "Sensitivity decision notes",
  "calib.sens.review": "I reviewed the sensitivity results and justified the alternatives.",
  "calib.sens.noResults": "No comparison results yet. Add at least two calibratable alternatives.",
  "calib.guide.variables": "Calibration variables",
  "calib.guide.outcomeGroup": "Outcome set",
  "calib.guide.conditionGroup": "Condition sets",
  "calib.guide.aria": "Calibration sections",
  "calib.guide.role.condition": "Condition",
  "calib.guide.role.outcome": "Outcome",
  "calib.guide.context.condition": "This set explains the outcome together with the other conditions.",
  "calib.guide.context.outcome": "This set is the outcome being explained. Its membership is not a truth-table, frequency, consistency, or PRI cutoff.",
  "calib.guide.mode.already": "already calibrated, provenance",
  "calib.guide.mode.direct": "direct fuzzy calibration",
  "calib.guide.mode.linear": "linear fuzzy calibration",
  "calib.guide.mode.crisp": "crisp calibration",
  "calib.guide.mode.unselected": "method not selected",
  "calib.guide.direction.high": "higher raw values increase membership",
  "calib.guide.direction.low": "lower raw values increase membership",
  "calib.guide.progress": "{done} of {total}",
  "calib.guide.progressLabel": "applicable sections complete",
  "calib.guide.next": "Open next incomplete section",
  "calib.guide.complete": "All applicable sections have been reviewed.",
  "calib.guide.collapseDone": "Collapse completed",
  "calib.guide.expandAll": "Expand all",
  "calib.guide.summary.evidence": "{n} evidence items",
  "calib.guide.summary.cases": "{n} cases",
  "calib.guide.summary.sensitivity": "{n} alternatives",
  "calib.guide.summary.threshold": "Threshold {value}",
  "calib.guide.status.complete": "complete",
  "calib.guide.status.attention": "attention",
  "calib.guide.status.incomplete": "incomplete",
  "calib.guide.status.na": "not applicable",
  "calib.guide.definition": "Define set",
  "calib.guide.method": "Method / provenance",
  "calib.guide.mapping": "Anchors / threshold",
  "calib.guide.evidence": "Evidence",
  "calib.guide.cases": "Review cases",
  "calib.guide.sensitivity": "Sensitivity",
  "calib.evidence.targetSupported": "supported",
  "calib.evidence.targetMissing": "open",
  "calib.evidence.diagnosticWarning": "Distributions, percentiles, gaps, and clusters can inform review. They do not by themselves justify set membership or anchors.",
  "calib.flag.missing": "missing raw value",
  "calib.flag.excluded": "case excluded",
  "calib.flag.unresolved": "unresolved",
  "calib.flag.missingAssigned": "missing value assigned",
  "calib.flag.rawBoundary": "raw value at anchor",
  "calib.flag.exactCrossover": "exactly 0.5",
  "calib.flag.nearCrossover": "near 0.5",
  "calib.flag.duplicateCase": "duplicate case label",
  "calib.flag.outOfRange": "outside [0,1]",
  "calib.flag.missingSpec": "set specification missing",
  "calib.flag.missingMethod": "method missing",
  "calib.flag.invalidParameters": "invalid parameters",
  "calib.flag.other": "other diagnostic",
  "calib.side.in": "in",
  "calib.side.out": "out",
  "calib.side.half": "crossover, 0.5",
  "calib.side.missing": "undetermined",
  "calib.cases.summary": "Diagnostics: {missing} missing or unresolved, {boundary} at anchors, {exact} exactly at 0.5, {near} near 0.5, {duplicate} duplicate case labels, {outOfRange} outside [0,1].",
  "calib.sens.cutoffs": "Comparison at frequency {freq} and consistency {cons}. These analysis cutoffs remain separate from outcome calibration.",
  "calib.sens.outcomeHelp": "For an outcome, alternative anchors can change outcome memberships and case classifications. They are not truth-table or fit cutoffs.",
  "calib.sens.waitForMapping": "Results appear once the method, direction, and anchors or threshold are valid.",
  "calib.sens.waitForAnalysis": "Results appear once at least one condition and one outcome are defined.",
  "calib.sens.membershipChanges": "Membership changes",
  "calib.sens.truthChanges": "Truth-table rows",
  "calib.sens.caseChanges": "Case classification changes",
  "calib.sens.fit": "Fit, base to variant",
  "calib.sens.baseFit": "Base: consistency {cons}, coverage {cov}",
  "calib.sens.variantFit": "Variant: consistency {cons}, coverage {cov}",
  "calib.sens.details": "Show case classifications",
  "calib.sens.thresholds": "Raw-value thresholds",
  "calib.sens.caseChange": "{caseLabel}: conditions {baseBits} → {variantBits}; outcome {baseOutcome} → {variantOutcome}; row {baseRow} → {variantRow}",
  "calib.sens.truncated": "{n} more changes are not shown.",
  "calib.sens.noCaseChanges": "No case classification changes.",
  "vars.role.help": "An outcome is the set being explained. Conditions are calibrated independently and combined to explain it. Ignored columns are excluded from the analysis.",
  "vars.limitedDiversity":
    "{k} conditions yield {configurations} possible configurations for {n} cases — many truth-table rows necessarily stay unobserved (limited diversity). Consider fewer conditions or a theory-driven pre-selection; the analysis still runs, but how remainders are treated matters more.",
  "vars.type.help.raw": "Raw values will be calibrated next. The observed distribution does not replace a set rationale.",
  "vars.type.help.fuzzy": "Already calibrated fuzzy memberships. Document provenance, meaning, and direction.",
  "vars.type.help.crisp": "Already calibrated crisp memberships. Document provenance, inclusion rule, and direction.",
  "proto.downloadMd": "Methods protocol (Markdown)",
  "proto.copyR": "Copy R script",
  "proto.downloadR": "Download R script",
  "proto.noEvidence": "No evidence documented.",
  "proto.status": "Status",
  "proto.recorded": "recorded",
  "proto.ready": "Protocol ready",
  "proto.setNotReady": "Protocol not ready",
  "proto.missingFields": "missing fields",
  "proto.missingEvidence": "missing evidence",
  "proto.definition": "Definition",
  "proto.unit": "Unit",
  "proto.scope": "Scope / population",
  "proto.timePeriod": "Time period",
  "proto.direction": "Direction",
  "proto.direction.high": "higher raw values → more in set",
  "proto.direction.low": "inverted (higher raw values → more out)",
  "proto.missingPolicy": "Missing-value policy",
  "proto.setNotes": "Set notes",
  "proto.methodConfirmed": "Method confirmed",
  "proto.caseReviewConfirmed": "Case review confirmed",
  "proto.sensitivityReviewConfirmed": "Sensitivity review confirmed",
  "proto.method.direct": "direct fuzzy calibration (logistic)",
  "proto.method.linear": "linear fuzzy calibration",
  "proto.method.crisp": "crisp calibration",
  "proto.method.already": "already calibrated",
  "proto.provenance": "Provenance",
  "proto.anchor.fullOut": "Full-out meaning",
  "proto.anchor.crossover": "Crossover meaning",
  "proto.anchor.fullIn": "Full-in meaning",
  "proto.anchor.inclusion": "Inclusion-threshold meaning",
  "proto.exceptionalCases": "Exceptional cases",
  "proto.yes": "yes",
  "proto.no": "no",
  "proto.missingText": "missing",
  "proto.evidenceAid": " *(empirical aid — not substantive proof alone)*",
  "proto.none": "none",
  "proto.sensitivity.truthRows": "Truth-table row changes (first 8):",
  "proto.sensitivity.caseRows": "Case classifications (first 8):",
  "proto.row": "row",


  // -- Truth table ------------------------------------------------------------
  "tt.title": "Truth table",
  "tt.conditions": "Conditions",
  "tt.outcome": "Outcome",
  "tt.rolesHint": "Conditions and outcome are set under “Variables & roles”.",
  "tt.rolesLink": "→ Variables & roles",
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
  "tt.limitWarn": "The engine limits truth tables to 12 conditions (2^k rows). Reduce the conditions before continuing.",

  // -- Solutions --------------------------------------------------------------
  "sol.complex.title": "Complex (conservative) solution",
  "sol.intermediate.title": "Intermediate solution",
  "sol.parsimonious.title": "Parsimonious solution",
  "sol.model.n": "Model {i} of {total} (equivalent — the solution is ambiguous)",
  "sol.report.convention":
    "The intermediate solution is the one usually reported; the complex and parsimonious solutions serve as context (Ragin 2008). The intermediate solution follows the directional expectations you set on its card.",
  "sol.sameAsComplex":
    "Identical to the complex solution — with these directional expectations no simplifying assumption applies. That is a result, not an error.",
  "sol.ambiguous.n":
    "{n} equivalent models — the solution is ambiguous. Report all {n}, or justify why you pick one.",
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
  "nec.orderHint":
    "The necessity analysis methodologically belongs before the sufficiency analysis (truth table and solutions).",
  "nec.col.condition": "Condition",
  "nec.col.consistency": "Consistency",
  "nec.col.coverage": "Coverage",
  "nec.col.relevance": "RoN",
  "nec.candidate": "≥ 0.9 — candidate",
  "nec.finding.none":
    "No finding: no condition reaches consistency ≥ 0.9. For this dataset there is no candidate for necessity.",
  "nec.finding.one":
    "1 candidate: {list}. That does not establish necessity — it has to make substantive sense.",
  "nec.finding.many":
    "{n} candidates: {list}. That does not establish necessity — each candidate has to make substantive sense.",
  "nec.hint":
    "Convention: consistency ≥ 0.9 as an indication of necessity — interpret together with coverage, RoN and case knowledge.",
  "nec.suin.title": "Necessary combinations (SUIN)",
  "nec.suin.desc":
    "Disjunctions (X + Z) and conjunctions (X·Z) up to order 3 are tested as well — the reference is superSubset from the R package QCA. If the disjunction is necessary while no single part is, these are SUIN conditions.",
  "nec.suin.col.expression": "Expression",
  "nec.suin.col.kind": "Form",
  "nec.suin.kind.disjunction": "Disjunction (SUIN)",
  "nec.suin.kind.conjunction": "Conjunction",
  "nec.suin.none":
    "No combination reaches consistency ≥ 0.9 together with coverage ≥ 0.5.",
  "nec.suin.finding":
    "{n} combinations meet the consistency criterion — that alone does not make them worth reporting. RoN is what decides: {top} leads with {topRon}, the lowest value is {minRon}. A combination with low RoN holds for nearly every case and therefore explains little.",
  "nec.suin.findingOne":
    "One combination meets the consistency criterion: {top} (RoN {topRon}). That alone does not make it worth reporting — necessity has to make substantive sense.",
  "nec.suin.toggle": "Show {n} tested combinations (sorted by RoN)",
  "nec.suin.hint":
    "A high RoN speaks against triviality. Necessity alone is not a finding — the combination has to make substantive sense.",

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
  "rob.combined.explainer":
    "This grid separates calibration alternatives from analytical cutoffs. Only explicitly documented substantive alternatives become scenarios; diagnostic shifts are not evidence.",
  "rob.combined.scenarios": "{count} calibration scenario(s) are checked together with frequency, consistency, and PRI cutoffs.",
  "rob.combined.stabilityTitle": "Solution-term stability",
  "rob.combined.stabilityHint": "Share of tested cells with the same expression. Stability does not replace substantive justification.",
  "rob.combined.solutionType": "Solution model",
  "rob.combined.expression": "Expression",
  "rob.combined.cells": "Cells",
  "rob.combined.share": "Share",
  "rob.combined.caseTitle": "Case classifications",
  "rob.combined.caseHint": "These cases change their truth-table classification or outcome side relative to the baseline cell.",
  "rob.combined.caseChanged": "cells changed",
  "rob.combined.fullGrid": "Full robustness grid ({count} cells)",
  "rob.combined.scenario": "Scenario",
  "rob.combined.caseChanges": "Case changes",
  "rob.chart.aria":
    "Line chart of the cutoff sweep: solution consistency and solution coverage across the consistency cutoff (0.70 to 0.95).",
  "rob.chart.consistency": "Consistency",
  "rob.chart.coverage": "Coverage",
  "rob.chart.currentCutoff": "Cutoff {cutoff}",

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

  // -- Chart export -----------------------------------------------------------
  "chart.exportSvg": "SVG",
  "chart.exportPng": "PNG",
  "chart.exportAria": "Export chart as {fmt}",

  // -- XY plot ----------------------------------------------------------------
  "xy.title": "XY plot (sufficiency)",
  "xy.hint":
    "Points above the diagonal support “X is sufficient for Y”. Consistency & coverage are shown above the plot.",
  "xyplot.kpi.consistency": "Consistency (sufficiency)",
  "xyplot.kpi.coverage": "Coverage",
  "xyplot.aria":
    "Fuzzy-set XY plot: {x} (X) against {y} (Y), {n} cases, axes 0 to 1",
  "xy.labelsToggle": "Case labels",
  "xy.labels.off": "Off",
  "xy.labels.notable": "Notable",
  "xy.labels.all": "All",
  "xy.diagonalLabel": "Diagonal X = Y",
  "xy.consistentZone": "consistent: X ≤ Y",
  "xy.legend.consistent": "consistent (X ≤ Y)",
  "xy.legend.inconsistent": "contradicts (X > Y)",
  "xy.source.label": "X axis",
  "xy.source.conditions": "Single conditions",
  "xy.source.paths": "Solution paths (intermediate)",
  "xy.source.solution": "Whole solution (intermediate)",
  "xy.pathHint":
    "For a solution path, X is membership in the term (the minimum across its literals) — this is the sufficiency plot reported in journal articles.",

  // -- Case diagnostics (Schneider & Rohlfing) ---------------------------------
  "diag.title": "Case diagnostics per path",
  "diag.desc":
    "Which cases stand behind each path, and which contradict it? The basis for case-oriented follow-up (Schneider & Rohlfing 2013, 2016).",
  "diag.typical": "Typical",
  "diag.deviantKind": "Deviant (kind)",
  "diag.deviantDegree": "Deviant (degree)",
  "diag.irrelevant": "Irrelevant (IIR)",
  "diag.irrelevantCount": "{n} cases",
  "diag.deviantCoverage": "Not covered by the model (deviant coverage)",
  "diag.none": "none",
  "diag.crossover": "Borderline cases with membership exactly 0.5: {cases}",
  "diag.hint":
    "Typical = X > 0.5, Y > 0.5, X ≤ Y · Deviant (kind) = X > 0.5, Y ≤ 0.5 (contradicts sufficiency) · Deviant (degree) = X > Y, both > 0.5 · Irrelevant = X ≤ 0.5, the path says nothing about the case. “Not covered by the model (deviant coverage)” only appears when such cases exist — if the line is absent, every outcome case is covered by at least one path.",

  // -- Protocol ---------------------------------------------------------------
  "cite.title": "Cite openQCA",
  "cite.desc":
    "If you use openQCA in your work, state the exact version — results depend on the release they were computed with.",
  "cite.noDoi":
    "No DOI yet: the citable identifier is minted with the next release archived through Zenodo. Until then the repository URL is the reliable reference.",
  "cite.copy": "Copy citation",
  "cite.copyBibtex": "Copy BibTeX",
  "cite.copied": "copied",
  "proto.title": "Analysis protocol",
  "proto.desc":
    "Reproducible: calibration protocol (JSON + Markdown) and R script (QCA package; logistic = TRUE for direct and logistic = FALSE for piecewise-linear fuzzy calibration).",
  "proto.downloadBtn": "Download protocol as JSON",
  "proto.downloadData": "Download raw data as CSV",
  "proto.notReady":
    "The export is the replication artefact and unlocks once every set is fully documented: definition, method, evidence, case review, and sensitivity. Report and results are available regardless.",

  // -- Report -----------------------------------------------------------------
  "report.title": "Report",
  "report.desc": "Opens a print-ready report (PDF via the print dialog).",
  "result.provisional.chip": "provisional",
  "result.provisional.reason": "The anchors have not been justified substantively yet.",
  "result.provisional.link": "Go to decisions",
  "result.provisional.title":
    "The calculation is exact, but the calibration is not yet substantively documented. For citable results, justify the anchors (view \u201cDocumentation\u201d).",
  "report.demoNotice":
    "Demo dataset: the report can be generated and shows the full calculation path — it then carries the notice “Synthetic teaching data — not citable”. Protocol and R export stay locked until you work with your own data and justify the calibration.",
  "report.provisionalNotice":
    "The report can be generated and is marked “provisional” for as long as the calibration is not fully documented.",
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
    "16 fictional countries with raw values (percentages and indices) – raw values that must be calibrated before analysis.",
  "ex.fuzzy.title": "Fuzzy-sets example",
  "ex.fuzzy.badge": "Fuzzy [0,1]",
  "ex.fuzzy.desc":
    "14 cases with memberships already in [0,1] – directly usable, no calibration needed.",
  "ex.crisp.title": "Crisp-sets example",
  "ex.crisp.badge": "Crisp 0/1",
  "ex.crisp.desc":
    "14 fictional start-ups with only 0/1 (crisp sets) – directly usable, the basis for csQCA.",
  "ex.meta": "{cases} cases · {conditions} conditions",
  "ex.synthetic": "synthetic",
  "ex.error": "Example dataset could not be loaded.",

  // -- Variables & roles ------------------------------------------------------
  "vars.title": "Variables & roles",
  "vars.intro":
    "QCA works with sets: every condition and the outcome need membership values between 0 and 1. Here you define which data type each column has and what role it plays in the analysis.",
  "vars.col.name": "Variable",
  "vars.col.type": "Data type",
  "vars.col.role": "Role",
  "vars.type.raw": "Raw value",
  "vars.type.fuzzy": "Fuzzy (0–1)",
  "vars.type.crisp": "Crisp (0/1)",
  "vars.role.condition": "Condition",
  "vars.role.outcome": "Outcome",
  "vars.role.ignore": "ignore",
  "vars.autoDetected": "auto-detected",
  "vars.badge.raw": "must be calibrated",
  "vars.badge.ready": "directly usable",
  "vars.warn.crisp":
    "Set to “Crisp (0/1)”, but there are values outside {0, 1} — this variable is not usable.",
  "vars.warn.fuzzy":
    "Set to “Fuzzy (0–1)”, but there are values outside [0, 1] — this variable is not usable.",
  "vars.warn.raw":
    "Calibration anchors are missing or not ascending — please set them in calibration. Until then this variable is not usable.",

  // -- AI assistant -----------------------------------------------------------
  "ai.contextLabel": "Substantive context",
  "ai.contextHelp": "Send only this text and the displayed summary values. Do not enter case names or confidential raw data.",
  "ai.contextPlaceholder": "Substantive description",
  "ai.privacy": "Optional cloud request: the displayed context and aggregate values are sent to the configured model provider. No case rows or QCA results are changed automatically.",
  "ai.draftLabel": "AI draft",
  "ai.review": "Review substantively and support with your own sources before use. The draft is never applied automatically.",
  "ai.copy": "Copy draft",
  "ai.copied": "Copied",
  "ai.busy": "Creating draft",
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
  "cloud.saveConfirmBtn": "Save",
  "cloud.saveCancelBtn": "Cancel",
  "cloud.overwriteBtn": "Overwrite",
  "cloud.manageProjectsLink": "Manage projects →",

  // -- Footer -----------------------------------------------------------------
  "footer.navAria": "Product, legal and documentation",
  "footer.app": "App",
  "footer.download": "Download",
  "footer.preise": "Pricing",
  "footer.konto": "Account",
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
  "pricing.title": "Cost",
  "pricing.intro":
    "The complete analysis core stays free and local, from calibration and minimization to the defense pack and R export. Cloud is optional convenience, not a methods upgrade.",
  "pricing.free.tag": "Free · fully local",
  "pricing.free.name": "openQCA Local",
  "pricing.free.price": "€0",
  "pricing.free.li1": "Full analysis core and guided decisions",
  "pricing.free.li2": "Truth table, solutions, case evidence, and robustness",
  "pricing.free.li3": "Report, replication protocol, and R export",
  "pricing.free.li4": "No upload of analysis data in the free core",
  "pricing.free.li5": "Browser app and installable PWA",
  "pricing.cloud.tag": "Optional, where configured",
  "pricing.cloud.name": "openQCA Cloud",
  "pricing.cloud.price": "Subscription",
  "pricing.cloud.li1": "Account plus manual cloud project save and load",
  "pricing.cloud.li2": "Optional AI review for research briefs and calibration evidence",
  "pricing.cloud.li3": "Optional AI draft for analysis rationales",
  "pricing.cloud.li4": "The same analysis core, with no additional QCA variants",
  "pricing.cta.monthly": "Subscribe monthly",
  "pricing.cta.institution": "Institutional license",
  "pricing.cta.soon": "Not yet available",
  "pricing.soonNote":
    "Where cloud services are configured, accounts and project storage may be available. The complete local analysis always works without cloud.",
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

  // -- Account: subscription, projects, GDPR -----------------------------------
  "account.checkoutCancel": "Checkout cancelled — nothing was charged.",
  "account.tier.loading": "Loading …",
  "account.tier.free": "Free",
  "account.tier.cloud": "Cloud",

  "account.subscription.title": "Subscription & billing",
  "account.subscription.manageBtn": "Manage subscription",
  "account.subscription.error": "Could not open the subscription portal.",

  "account.projects.title": "My projects",
  "account.projects.loading": "Loading projects …",
  "account.projects.empty":
    "No saved projects yet. Projects you save to the cloud in the app will appear here.",
  "account.projects.col.name": "Name",
  "account.projects.col.updated": "Last changed",
  "account.projects.renameBtn": "Rename",
  "account.projects.saveBtn": "Save",
  "account.projects.cancelBtn": "Cancel",
  "account.projects.deleteBtn": "Delete",
  "account.projects.deleteConfirm": "Permanently delete project “{name}”?",
  "account.projects.renameError": "Rename failed.",
  "account.projects.deleteError": "Delete failed.",
  "account.projects.exportAllBtn": "Export all projects (JSON)",
  "account.projects.exportError": "Export failed.",

  "account.danger.title": "Data & account (GDPR)",
  "account.danger.body":
    "You can export all your projects as JSON at any time above. Permanently deleting your account irreversibly removes your profile and all saved projects from the cloud.",
  "account.danger.deleteBtn": "Permanently delete account",
  "account.danger.confirmMsg":
    "Your account and all saved projects will be permanently deleted. This action cannot be undone. Continue?",
  "account.danger.error": "Account deletion failed.",

  // -- Explainer popover (InfoHint) --------------------------------------------
  "info.moreLink": "More in the methodology →",

  "info.consistency.title": "Consistency (sufficiency)",
  "info.consistency.body":
    "The share of membership in X that also lies in Y. Values near 1 mean that wherever X is strongly present, Y tends to be strongly present too. From the chosen consistency cutoff onward, a configuration counts as sufficiently consistent for the outcome.",
  "info.consistency.formula": "Σ min(Xᵢ,Yᵢ) / Σ Xᵢ",

  "info.pri.title": "PRI (proportional reduction in inconsistency)",
  "info.pri.body":
    "PRI guards against configurations that are simultaneously a subset of both Y and ~Y — a case plain consistency can miss. A PRI markedly lower than the consistency value is a warning sign of a contradictory configuration.",
  "info.pri.formula": "(Σmin(Xᵢ,Yᵢ) − Σmin(Xᵢ,Yᵢ,1−Yᵢ)) / (ΣXᵢ − Σmin(Xᵢ,Yᵢ,1−Yᵢ))",

  "info.rawCoverage.title": "Raw coverage",
  "info.rawCoverage.body":
    "The share of Y that this path (or solution) accounts for. High coverage indicates empirical relevance — but says nothing about sufficiency, which is what consistency measures.",
  "info.rawCoverage.formula": "Σ min(Xᵢ,Yᵢ) / Σ Yᵢ",

  "info.uniqueCoverage.title": "Unique coverage",
  "info.uniqueCoverage.body":
    "The portion of outcome coverage that only this path provides — no other path in the solution explains these cases. It equals the solution's coverage minus the coverage of the solution without this path.",
  "info.uniqueCoverage.formula": "Coverage(Lösung) − Coverage(Lösung ohne Pfad)",

  "info.solutionConsistency.title": "Solution consistency",
  "info.solutionConsistency.body":
    "Consistency of the whole solution: X here is membership in the union of all paths (the maximum across paths for each case). It shows how sufficient the combined solution is for the outcome overall.",
  "info.solutionConsistency.formula": "Σ min(Xᵢ,Yᵢ) / Σ Xᵢ  — X = max über alle Pfade",

  "info.solutionCoverage.title": "Solution coverage",
  "info.solutionCoverage.body":
    "Coverage of the whole solution: how much of Y is accounted for by the union of all paths. It complements solution consistency with the combined solution's empirical relevance.",
  "info.solutionCoverage.formula": "Σ min(Xᵢ,Yᵢ) / Σ Yᵢ  — X = max über alle Pfade",

  "info.necessityConsistency.title": "Necessity consistency",
  "info.necessityConsistency.body":
    "Tests whether Y is a subset of X — that is, whether X is (almost) always present when Y is present. By convention, ≥ 0.9 marks a condition as a candidate necessary condition; coverage should additionally be checked as a relevance indicator.",
  "info.necessityConsistency.formula": "Σ min(Xᵢ,Yᵢ) / Σ Yᵢ",

  "info.necessityCoverage.title": "Necessity coverage",
  "info.necessityCoverage.body":
    "Shows how relevant a necessary condition is: if X is trivial (e.g. present almost always), consistency can be high without X explaining anything substantive. Low coverage alongside high consistency is therefore a warning sign of a trivial condition.",
  "info.necessityCoverage.formula": "Σ min(Xᵢ,Yᵢ) / Σ Xᵢ",

  "info.necessityRelevance.title": "RoN — relevance of necessity",
  "info.necessityRelevance.body":
    "Coverage alone does not reliably detect trivial necessity. RoN (Schneider & Wagemann 2012) measures how much non-membership in X is still possible: if X is almost fully present in nearly every case, RoN approaches 0 — the condition is necessary but uninformative. Values close to 1 point to a substantive finding.",
  "info.necessityRelevance.formula": "Σ (1−Xᵢ) / Σ (1−min(Xᵢ,Yᵢ))",

  "info.suin.title": "SUIN conditions",
  "info.suin.body":
    "A disjunction X + Z can be necessary even though neither X nor Z is necessary on its own — the parts are then “sufficient but unnecessary for a factor that is insufficient but necessary” (SUIN, Mahoney/Kimball/Koivu 2009). The reference for selection and measures is superSubset from the R package QCA; the cross-validation is documented in VALIDATION.md.",

  "info.caseDiagnostics.title": "Case diagnostics",
  "info.caseDiagnostics.body":
    "Classifies every case per solution path by its position in the XY plot (Schneider & Rohlfing 2013, 2016). Typical cases are candidates for process tracing, “deviant (kind)” contradicts sufficiency, and “not covered” shows where the solution is incomplete. The 0.5 threshold is read strictly: membership means > 0.5.",

  "info.freqCutoff.title": "Frequency cutoff (n)",
  "info.freqCutoff.body":
    "The minimum number of cases a configuration must have in the truth table to count as observed. Configurations with fewer cases are treated like remainders, regardless of their consistency.",

  "info.consCutoff.title": "Consistency cutoff",
  "info.consCutoff.body":
    "The threshold above which an observed configuration counts as consistent and OUT is set to 1. Common values start around 0.75–0.8; the choice should be justified and checked in the robustness sweep.",

  "info.out.title": "OUT (truth table outcome)",
  "info.out.body":
    "1 = observed and consistent (meets the frequency and consistency cutoffs); 0 = observed but inconsistent; ? = remainder — a configuration without (enough) observed cases, for which no empirical claim can be made.",

  "info.calibAnchors.title": "Calibration anchors (e / c / i)",
  "info.calibAnchors.body":
    "The three anchor points translate raw values into fuzzy-set membership: “fully out” (e), crossover (c), and “fully in” (i). The direct method uses a logistic curve between them (fixed-point values about 0.05 / 0.50 / 0.95); the linear method connects the same anchors piecewise linearly. Anchors are a substantive research decision, not an automatic distributional diagnostic.",
  "info.calibAnchors.formula": "e → 0,05 · c → 0,50 · i → 0,95 (direct; linear: 0 / 0,5 / 1)",

  "info.solComplex.title": "Complex (conservative) solution",
  "info.solComplex.body":
    "Uses only observed configurations; remainders are not admitted as simplifying assumptions. This yields the most cautious, least parsimonious solution — every claim rests exclusively on actually observed cases.",

  "info.solIntermediate.title": "Intermediate solution",
  "info.solIntermediate.body":
    "Lies between the complex and parsimonious solution: only remainders consistent with the stated directional expectations (“easy counterfactuals”) are admitted as simplifying assumptions. This is usually considered the most theoretically defensible solution.",

  "info.solParsimonious.title": "Parsimonious solution",
  "info.solParsimonious.body":
    "Admits all remainders as simplifying assumptions, including theoretically implausible (“difficult”) counterfactuals. This yields the simplest solution, but it may embed unjustified assumptions about unobserved cases.",

  "info.robustness.title": "Robustness sweep",
  "info.robustness.body":
    "Shows how the parsimonious solution changes as the consistency cutoff is systematically varied. If the solution stays stable across a wide range, the cutoff choice is uncritical; if it changes quickly, the chosen cutoff should be justified with particular care.",

  "info.negatedOutcome.title": "Negated outcome (~Y)",
  "info.negatedOutcome.body":
    "QCA is asymmetric: a solution explaining Y does not automatically explain the absence of Y. The same analysis is therefore run separately for ~Y by replacing each case's outcome membership with 1 − y — the resulting paths can involve entirely different conditions.",
  "info.negatedOutcome.formula": "~Y = 1 − Y",

  "info.xyPlot.title": "XY plot (sufficiency)",
  "info.xyPlot.body":
    "Plots each case as a point of X membership (condition) against Y membership (outcome). Points above the diagonal (Y ≥ X) support the claim “X is sufficient for Y”; points well below the diagonal argue against it.",

  // -- Variables: import heuristic ---------------------------------------------
  "vars.import.heuristic": "Default for new imports: the last numeric column is pre-set as the outcome, and all other numeric columns as conditions. Review the roles before interpreting.",


  // -- Research-question workspace -------------------------------------------
  "workspace.nav.aria": "Analysis destinations",
  "workspace.nav.answer": "Answer",
  "workspace.nav.research": "Research design",
  "workspace.nav.decisions": "Decisions",
  "workspace.nav.evidence": "Evidence",
  "workspace.nav.defense": "Defense pack",
  "workspace.answer.title": "Current answer",
  "workspace.research.title": "Research design",
  "workspace.decisions.title": "Decisions",
  "workspace.evidence.title": "Evidence",
  "workspace.defense.title": "Defense pack",
  "workspace.start.title": "Start with your own small-N data",
  "workspace.start.desc": "Import CSV or XLSX locally. Or open the synthetic teaching example, or explicitly resume a saved project.",
  "workspace.start.learn.title": "Open the synthetic example",
  "workspace.start.learn.desc": "Loads a fully computable teaching example. Synthetic and not citable.",
  "workspace.start.learn.action": "Open the synthetic example",
  "workspace.start.import.title": "Import your own data",
  "workspace.start.import.desc": "Read CSV or XLSX locally. Then review the research question, roles, and decisions.",
  "workspace.start.import.action": "Import your own data",
  "workspace.start.import.schema": "First column: unique case ID. Further columns: numeric raw values or set memberships from 0 to 1. Headers required.",
  "workspace.noData": "No data loaded yet. Open Answer and import your own data or start with the synthetic example.",
  "workspace.start.resume.title": "Resume project",
  "workspace.start.resume.none": "No saved project",
  "workspace.start.resume.action": "Load saved project",
  "workspace.start.resume.meta": "{dataset}, saved {savedAt}",
  "workspace.import.error": "Import failed: {message}",
  "workspace.dataset.summary": "{dataset}: {rows} raw cases, {cases} analyzed cases, {excluded} excluded or unresolved",
  "workspace.data.actions": "Data and project",
  "workspace.examples.summary": "Synthetic teaching datasets",
  "workspace.rawData.summary": "Raw data table",
  "workspace.descriptives.summary": "Descriptive statistics for active sets",
  "workspace.roles.title": "Variable roles",
  "workspace.roles.suggested": "Automatically suggested until the research design is confirmed.",
  "workspace.brief.title": "Research brief",
  "workspace.brief.desc": "The brief binds the question, case universe, period, outcome concept, and condition selection to the current roles.",
  "workspace.brief.question": "Research question",
  "workspace.brief.question.help": "State the set-theoretic question to be investigated.",
  "workspace.brief.caseUniverse": "Case universe",
  "workspace.brief.caseUniverse.help": "Which cases belong in the study, and why?",
  "workspace.brief.timePeriod": "Time period",
  "workspace.brief.timePeriod.help": "For what period do the cases and set definitions apply?",
  "workspace.brief.outcomeConcept": "Outcome concept",
  "workspace.brief.outcomeConcept.help": "Name the substantive meaning of outcome membership.",
  "workspace.brief.conditionRationale": "Condition-selection rationale",
  "workspace.brief.conditionRationale.help": "Why are these conditions relevant to the question?",
  "workspace.decisions.ledgerTitle": "Decision ledger",
  "workspace.brief.confirm": "Confirm research design",
  "workspace.answer.syntheticReason": "Synthetic demo data: this result is for orientation only and is not citable.",
  "workspace.answer.noncausal": "This is a configurational association in the analyzed cases, not a causal effect.",
  "workspace.brief.confirmed": "Research design confirmed",
  "workspace.brief.invalidated": "Changes to the brief or roles require renewed confirmation.",
  "workspace.decisions.priority": "Completeness priority, not a ranking of substantive importance.",
  "workspace.decisions.ready": "All current decisions are confirmed and supported.",
  "workspace.brief.rolesRequired": "Choose at least one condition and exactly one outcome before confirming.",
  "workspace.brief.rolesAction": "Choose variable roles",
  "workspace.decisions.open": "{n} open decisions",
  "workspace.decisions.strongest": "Highest-priority open decision",
  "workspace.decisions.jump": "Edit decision",
  "workspace.decisions.brief": "Confirm research brief",
  "workspace.decisions.calibration": "Document set {column}",
  "workspace.decisions.frequency": "Justify frequency cutoff",
  "workspace.decisions.consistency": "Justify consistency cutoff",
  "workspace.decisions.expectations": "Justify directional expectations",
  "workspace.decisions.missing": "Missing: {items}",
  "workspace.decisions.currentValue": "Current value",
  "workspace.decision.rationale": "Rationale",
  "workspace.decision.confirm": "Confirm current value",
  "workspace.decision.confirmed": "Confirmed",
  "workspace.decision.missing.caseReview": "case review",
  "workspace.decision.missing.provisionalDefaults": "provisional defaults",
  "workspace.decision.missing.sensitivityReview": "sensitivity review",
  "workspace.decision.missing.more": "and {n} more",
  "workspace.decision.missing.other": "additional documentation",
  "workspace.decision.frequency.effect": "{positive} positive truth-table rows, {unassigned} unassigned cases at n.cut = {value}.",
  "workspace.decision.consistency.effect": "{positive} positive truth-table rows, {unassigned} unassigned cases at incl.cut = {value}.",
  "workspace.decision.expectations.effect": "{models} intermediate models under the current directional expectations.",
  "workspace.decision.effect.note": "Assumption → observed computational consequence. This is not empirical validation.",
  "workspace.decisions.notComputable": "At least one active set calibration is not yet computable.",
  "workspace.calibration.title": "Set calibrations",
  "workspace.calibration.quick": "Quick",
  "workspace.calibration.documentation": "Documentation",
  "workspace.answer.question.pending": "Confirm the research question so the statement is bound to a research brief.",
  "workspace.answer.question.action": "Open research design",
  "workspace.answer.analysis.notComputable": "Not computable",
  "workspace.answer.analysis.noSolution": "No sufficient solution",
  "workspace.answer.analysis.solution": "Solution computed",
  "workspace.answer.maturity.synthetic": "Synthetic",
  "workspace.answer.maturity.provisional": "Provisional",
  "workspace.answer.maturity.ready": "Defense-ready",
  "workspace.answer.statement": "Under the current calibration, {paths} is/are sufficient for membership in {outcome} across the {cases} analyzed cases.",
  "workspace.answer.absence": "absence of {set}",
  "workspace.answer.or": " or ",
  "workspace.answer.and": " and ",
  "workspace.answer.ambiguous": "{n} equivalent intermediate models are available. The statement shows the first representative; all alternatives remain in Evidence.",
  "workspace.answer.cases.typical": "Supporting",
  "workspace.answer.cases.kind": "Deviant in kind",
  "workspace.answer.cases.degree": "Deviant in degree",
  "workspace.answer.cases.uncovered": "Outcome cases without coverage",
  "workspace.answer.cases.crossover": "Cases at the 0.5 crossover",
  "workspace.answer.robustness": "Robustness: {stable} of {total} checked cells match the current intermediate result.",
  "workspace.answer.evidence": "Details in Evidence",
  "workspace.answer.noRoles": "At least one active condition and exactly one active outcome are required.",
  "workspace.answer.noCases": "No analyzable cases remain after missing-data and exclusion rules.",
  "workspace.answer.tooMany": "With {n} conditions, sufficiency analysis is limited to at most 12 conditions.",
  "workspace.answer.noPositive": "The truth table has no positive row under the current cutoffs.",
  "workspace.answer.noModel": "Intermediate minimization returns no model under the current assumptions.",
  "workspace.evidence.chain": "Auditable evidence chain",
  "workspace.evidence.brief": "Research brief",
  "workspace.evidence.sets": "Active set definitions",
  "workspace.evidence.sources": "Source coverage",
  "workspace.evidence.cases": "Excluded or unresolved cases",
  "workspace.evidence.analysis": "Analysis decisions",
  "workspace.evidence.editResearch": "Edit in Research design",
  "workspace.evidence.editDecisions": "Edit in Decisions",
  "workspace.evidence.truthTable": "Truth table, remainders, and cutoffs",
  "workspace.evidence.solutions": "All solutions and equivalent models",
  "workspace.evidence.diagnostics": "Case diagnostics and XY plot",
  "workspace.evidence.robustness": "Robustness and negated outcome",
  "workspace.defense.ready": "Defense pack unlocked",
  "workspace.defense.blocked": "Replication artifacts remain locked until every item is satisfied.",
  "workspace.defense.check.demo": "Own, non-synthetic data",
  "workspace.defense.check.cases": "At least one analyzed case",
  "workspace.defense.check.brief": "Complete, confirmed research brief",
  "workspace.defense.check.analysis": "Justified and confirmed analysis decisions",
  "workspace.defense.check.calibration": "Every active set protocol-ready and sourced or externally checked",
  "workspace.defense.check.results": "Necessity, truth table, and solutions computed",
  "workspace.defense.reportMissing": "Provisional report. Still open: {groups}",
  "workspace.defense.artifacts": "Replication artifacts",
  "workspace.defense.references": "Methodology references",
  "workspace.defense.limitations": "Known limitations",
  "workspace.defense.limitations.body": "The scenario and cutoff grid does not implement Oana and Schneider's RF_incl, RF_cov, or RF_case measures. In the broader ESA corpus, 11,408 of 13,216 intermediate solutions (86.3%) agree with R; the engine stays more specific where they diverge. Complex and parsimonious solutions are unaffected.",

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
