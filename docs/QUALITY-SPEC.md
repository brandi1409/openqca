# openQCA — Qualitäts-Spezifikation „Fertig"

**Zweck:** Verbindliche, maschinell prüfbare Definition von „fertig" für Web-App und Website.
Jedes Kriterium ist entweder durch die **E2E-Suite** (`apps/web/e2e/`, Playwright) oder durch die
bestehenden Prüfungen (Engine-Tests, R-Kreuzvalidierung, Build) abgedeckt. „Fertig" heißt:
**alle Prüfungen grün in CI** — nicht „sieht beim Durchklicken gut aus".

Stand: 2026-07-25 · Ausführung: lokale Implementierung, deterministische Prüfungen und Playwright

---

## A · Abnahmekriterien (maschinell geprüft)

### A1 — Korrektheit (bereits abgedeckt, bleibt Pflicht)
| # | Kriterium | Prüfung |
|---|---|---|
| A1.1 | Engine-Unit-Tests grün | `node --test` in `packages/engine` (57) |
| A1.2 | Referenz-Suite grün | `node scripts/reference-check.mjs` |
| A1.3 | **R-Kreuzvalidierung exakt** — Lösungsmodelle (konservativ/intermediär/sparsam, fuzzy+crisp+Modell-Ambiguität+Lipset) **und** Notwendigkeit inkl. Disjunktionen/SUIN und RoN gegen `superSubset` | `node scripts/cross-validate.mjs` (23/25 PASS, 2 in VALIDATION.md dokumentierte Abweichungen derselben ESA-Ursache) — die Zahl auf der Landing (`landing.rigor.r1`, `landing.h.proof`) muss diesem Stand entsprechen; das Skript erzwingt das selbst |
| A1.4 | Produktions-Build fehlerfrei | `npm run build --workspace web` |
| A1.5 | **Kalibrierungs-Kreuzvalidierung** (crisp/piecewise-linear exakt; direkt-logistisch mit dokumentierter Restabweichung) | `node scripts/calibrate-cross-validate.mjs` — Engine nutzt Ragins ±3-Logit-Fixpunkte (≈0,0474/0,9526), R QCA zielt auf ≈0,05/0,95; Restabweichung ≤ 0,01 wird akzeptiert und dokumentiert |

### A2 — Funktionale Flüsse (E2E, Chromium)

**Wo das Gate sitzt (verbindlich seit dem Flow-Umbau):** Das Rechnen ist **nie** gesperrt —
sobald jede aktive Spalte eine *berechenbare* Kalibrierung hat, laufen Notwendigkeit, Truth Table,
Lösungen und Robustheit, und der Bericht ist erzeugbar. Gesperrt bleibt allein die
**Publikationsreife**: die vier Replikationsartefakte des Protokoll-Abschnitts (Protokoll-JSON,
Rohdaten-CSV, Methoden-Protokoll Markdown, R-Skript) verlangen, dass **jedes** Set vollständig
dokumentiert ist (Definition, Methode, Evidenz, Fallprüfung, Sensitivität). Bis dahin trägt der
Bericht das Kennzeichen „Vorläufig". Kriterien, die früher „Analyse gesperrt" prüften, prüfen
deshalb jetzt die Export-Buttons — die Schärfe bleibt, der Ort wandert.

Der Kalibrier-Schritt hat zwei Ansichten: **„Schnell"** (Startzustand: Methode, drei Anker, Kurve)
und **„Dokumentation"** (die vollständige Werkbank). Alle Werkbank-Tiefenprüfungen laufen
unverändert scharf, nur eben nach `openDocumentationView()` (Helper in `e2e/helpers.ts`).

| # | Kriterium | Test |
|---|---|---|
| A2.1 | Alle Routen liefern 200 und **null Konsolen-Fehler/Pageerrors**: `/`, `/app`, `/methodik`, `/preise`, `/download`, `/konto`, `/rechtliches/{impressum,datenschutz,agb}` | `smoke.spec` |
| A2.2 | **Demo-Datensatz**: laden → Schritte 1–3 ✓ → alle vier numerischen Nicht-Outcome-Spalten sind Bedingungen (`STABIL` steht in der Truth Table) → komplexe Lösung enthält `WOHLSTAND*BILDUNG*STABIL` | `flows.spec` |
| A2.3 | **Crisp-Beispiel**: laden ohne Fehler; Deskriptivstatistik zeigt Min/Max exakt `0`/`1`; **beide** Kalibrier-Ansichten zeigen „bereits kalibriert" (Schnell-Karte und Kontextband der Werkbank) | `flows.spec` |
| A2.4 | **Fuzzy-Beispiel**: laden ohne Fehler; WOHLSTAND Min/Max exakt `0,100`/`0,900` (keine Re-Kalibrierung) | `flows.spec` |
| A2.5 | **Beispiel-Tour**: startet, alle 7 Stationen per „Weiter", endet sauber | `tour.spec` |
| A2.6 | **DE/EN**: Umschalter stellt Kern-Überschriften um und zurück; Wahl übersteht Reload | `i18n.spec` |
| A2.7 | **Rollen-Wechsel**: Outcome im Variablen-Schritt umstellen → genau 1 Outcome, Lösungen rechnen neu, kein Fehler | `flows.spec` |
| A2.8 | **Grafik-Export**: SVG- und PNG-Button lösen echten Download aus | `interactions.spec` |
| A2.9 | **ⓘ-Popover**: öffnet vollständig im Viewport (auch in der kürzesten Tabelle), schließt per Escape | `interactions.spec` |
| A2.10 | **Anker per Tastatur**: Pfeiltaste am Kurven-Griff der Schnell-Karte ändert das zugehörige Zahlenfeld synchron (Griffe existieren in beiden Ansichten — der Test greift bewusst nur die Schnell-Karte) | `interactions.spec` |
| A2.11 | **Rohdaten-Checkliste**: Rohdaten laden, Ansicht „Dokumentation", Lehr-Seed übernehmen → Definition/Methode/Anker/Evidenz/Fallprüfung/Sensitivität sichtbar **und editierbar**; Ergebnisse rechnen bereits (Schritte 4–6 offen), Meter meldet „0 von 4 Sets dokumentiert", alle vier Export-Buttons gesperrt | `flows.spec` |
| A2.12 | **Raw calibration milestone**: `rohwerte-demokratie.csv` trägt mindestens eine Crisp-Bedingung, eine direkt-fuzzy Bedingung, eine stückweise-lineare Bedingung und ein direkt-fuzzy Outcome — mit substanzieller Evidenzdeckung, Fall-Diagnostik, Sensitivitäts-Fit/Fallwirkungen; während der Dokumentation ist das **Export**-Gate geschlossen, danach liefern JSON/Markdown/R vollständige Artefakte (inkl. A2.19) | `flows.spec` |
| A2.13 | **Evidence and method gate**: empirische Diagnostik erfüllt die substanzielle Evidenzpflicht nicht → Publikationsreife bleibt aus und das **Export**-Gate geschlossen; Methodenwechsel direkt/linear/crisp entfernt inkompatiblen Mapping-Zustand und entwertet Methoden-/Sensitivitäts-Bestätigungen | `flows.spec` |
| A2.14 | **Lokale Projekt-Persistenz**: „Projekt lokal speichern" → Reload lädt den Datensatz automatisch zurück | `flows.spec` |
| A2.15 | **Kalibrier-Provenienz & Missing-Policy** überstehen Reload (Set-Bezeichnung, Policy, Evidenzzeile) | `flows.spec` |
| A2.16 | **Demo-Bericht**: erzeugbar, trägt im Dokument selbst das Banner „Synthetische Lehrdaten — nicht zitierfähig"; Rechenweg vollständig; Protokoll-/R-Export bleibt gesperrt | `flows.spec` |
| A2.17 | **Schnellpfad**: eigene Rohwerte laden, **nichts** ausfüllen → Schnell-Ansicht ist Startzustand, Notwendigkeit/Truth Table/Lösungen rechnen sofort, Bericht-Button frei, Meter zeigt „0 von 5 Sets dokumentiert" (vier Bedingungen + Outcome — keine stille Deckelung), alle vier Export-Buttons gesperrt, null Pageerrors | `flows.spec` |
| A2.18 | **„Vorläufig"-Banner**: Bericht aus dem Schnellpfad trägt `Vorläufig — Kalibrierung noch nicht vollständig dokumentiert`, **kein** Demo-Banner, und enthält den vollständigen Rechenweg | `flows.spec` |
| A2.19 | **Dokumentation schaltet Export frei**: nach vollständiger Dokumentation aller Sets meldet das Meter „4 von 4", alle vier Export-Buttons sind bedienbar, der Sperrgrund verschwindet und der Bericht trägt **kein** Banner mehr | `flows.spec` (im A2.12-Durchlauf geprüft — der vollständige Dokumentationslauf ist dort bereits vorhanden; ein eigener Test wäre reine Wiederholung) |
| A2.20 | **Landing = App**: Lösungsformel und die beiden Kennzahlen im Hero-Beweisstreifen auf `/` sind identisch mit der intermediären Lösung auf `/app?demo=1` (Text normalisiert). Geprüft wird die **Identität**, kein eingefrorener Zahlenwert — Datensatz und Engine dürfen sich ändern, aber nie unterschiedlich auf beiden Seiten | `flows.spec` |
| A2.21 | **Anker-Herkunft und Vorläufig-Marke**: Nach dem Import ist ausgewiesen, dass die Anker aus Perzentilen stammen; der Hinweis verschwindet, sobald ein Anker angefasst wird. Die Ergebniskarten (Schritte 4–6) tragen die „vorläufig"-Marke, solange die Kalibrierung nicht dokumentiert ist | `flows.spec` |
| A2.22 | **Methodenkanon sichtbar** (Fuzzy-Beispiel): Notwendigkeitstabelle weist **RoN** aus · Karte „Notwendige Kombinationen (SUIN)" zeigt `BILDUNG + STAATSKAPAZITAET` mit 0,965 / 0,904 / 0,857 (inclN/covN/RoN — Werte aus der R-kreuzvalidierten Engine) · **Fall-Diagnostik** an der intermediären Lösungskarte nennt `Fall_11` (abweichend der Art nach) und `Fall_13` (dem Grad nach) und meldet keine deviant coverage · **XY-Plot** lässt Lösungspfad und Gesamtlösung als X-Achse wählen, blendet den Pfad-Hinweis ein und beschriftet die Achse mit dem Lösungsterm | `flows.spec` |
| A2.23 | **390px mit geladener Analyse**: kein horizontaler Seiten-Overflow, und kein Element der SUIN-Karte, der Fall-Diagnostik oder der XY-Karte reicht näher als **10px** an den rechten Rand (breite Tabellen dürfen in ihrem `overflow-x: auto`-Container liegen) | `flows.spec` |

**Rollen-Vorbelegung (verbindlich):** Beim Laden eines Datensatzes ist die **letzte** numerische
Spalte das Outcome und **jede** weitere numerische Spalte eine Bedingung. Es gibt kein stilles
Budget mehr, das überzählige Spalten auf „ignorieren" setzt. Wird `2^k` größer als die Fallzahl,
weist Schritt 2 sichtbar auf *limited diversity* hin (`[data-testid="variables-limited-diversity"]`),
ohne die Analyse zu blockieren.

### A3 — Visuelle Integrität (E2E, generisch — findet auch künftige Fälle)
Geprüft in **4 Matrizen**: Light/Dark × Desktop (1280) / Mobile (390).
| # | Kriterium | Test |
|---|---|---|
| A3.1 | **Keine überlappenden Text-Labels in irgendeinem SVG** (Bounding-Box-Scan aller `<text>`-Paare) — Demo UND Fuzzy-Datensatz | `visual.spec` |
| A3.2 | **Kein horizontaler Seiten-Overflow** auf keiner Route | `visual.spec` |
| A3.3 | Consent-Banner: beide Buttons vollständig im Viewport | `visual.spec` |
| A3.4 | Kein sichtbarer Text `fs_`, `PLATZHALTER`, `undefined`, `NaN` auf gerenderten Seiten | `visual.spec` |

### A4 — Konsistenz des Design-Systems (E2E + statisch)
| # | Kriterium | Prüfung |
|---|---|---|
| A4.1 | **Jeder** `<button>` der App nutzt `.oq-btn` oder ist dokumentierte Ausnahme (Segment-Control, ⓘ, Chart-Punkte, Nav-Pills, Consent) — geprüft per DOM-Scan über alle Routen | `consistency.spec` |
| A4.2 | Schriftgrößen im gerenderten DOM nur aus der Skala {11, 12, 13.5, 15, 16.5, 20, 28} (+ SVG-Ausnahme ≤11); Gewichte nur {400, 600, 700} | `consistency.spec` |
| A4.3 | Interaktive Radien 8px, Karten 12px, Pills 999px | Stichprobe in `consistency.spec` |
| A4.4 | Gilt für **alle** Seiten — auch `/konto`, `/preise`, `/download`, Header-Anmeldung (`cloud.tsx`), Glossar, Tour, ~Y-Panel | dito |

### A5 — Frische nach Deploys
| # | Kriterium | Umsetzung |
|---|---|---|
| A5.1 | Service-Worker-Cache-Name trägt die Build-ID; alte Caches werden beim Aktivieren gelöscht → kein tagelang veralteter Stand | Build-Zeit-Ersetzung in `sw.js` + `PwaRegister` mit `updatefound`-Reload-Hinweis |

### A6 — CI
`.github/workflows/ci.yml` führt bei jedem Push auf `main` und jedem Pull Request folgende Gates
in dieser Reihenfolge aus; PRs ohne grüne Kette gelten als rot.
| # | Kriterium | Schritt in `ci.yml` |
|---|---|---|
| A6.1 | Engine-Unit-Tests grün | „Engine — unit tests" |
| A6.2 | Referenz-Suite grün | „Engine — reference/validation check" |
| A6.3 | R-Kreuzvalidierung grün (A1.3) | „Engine — R-Kreuzvalidierung (QUALITY-SPEC A1.3)" |
| A6.4 | R-Kalibrierungs-Kreuzvalidierung grün (A1.5) | „Engine — R-Kalibrierungs-Kreuzvalidierung (QUALITY-SPEC A1.5)" |
| A6.5 | Lint fehlerfrei | „Web — Lint" |
| A6.6 | Produktions-Build fehlerfrei | „Web — production build" |
| A6.7 | Playwright-Suite grün (Chromium, A2–A4) | „E2E — Playwright suite (QUALITY-SPEC A2–A4)" |

---

## B · Umsetzungsplan (Wellen)

| Welle | Inhalt | Wer |
|---|---|---|
| **W0** | **E2E-Infrastruktur**: Playwright + Chromium, `playwright.config.ts` (webServer = `next start` auf Prod-Build), die 6 Spec-Dateien aus A2–A4, npm-Skript `test:e2e` | Opus |
| **W1** | **Konsistenz-Restpass** (A4 auf allen Restflächen): `cloud.tsx` (Header-Anmeldung!), `konto`, `preise`, `DownloadPage`, `Glossary`, `GuidedTour`, `NegatedOutcomePanel`, `SectionNav` → Skala + `.oq-btn` | Sonnet |
| **W2** | **Label-Layout box-basiert** (A3.1-Wurzelfix): Kollisionserkennung über geschätzte Textbox-Intervalle statt fixer Punkt-Abstände (XY-Plot + Kalibrierkurve) | Fable (direkt) |
| **W3** | **SW-Versionierung** (A5) | Fable (direkt) |
| **W4** | **Suite ausführen → Befunde fixen → wiederholen bis grün** → CI-Job → Deploy → Live-Stichprobe | Fable |

**Bewusst außerhalb dieses Specs** (Roadmap, keine „Fertig"-Blocker): EN-Methodikseite, Bericht auf EN,
Verteilungs-Plots in der Deskriptivstatistik, Lösungs-Tabs, Tauri-Build (braucht Signier-Konten),
Aktivierung von KI/Zahlungen (braucht Schlüssel), juristische [PRÜFEN]-Punkte.

---

## C · Definition von „fertig"

`npm run build --workspace web && node --test (engine) && node scripts/reference-check.mjs &&
node scripts/cross-validate.mjs && npm run test:e2e --workspace web` — **alles grün, lokal und in CI.**
Erst dann wird deployt. Jede künftige Änderung läuft gegen dieselbe Messlatte.
