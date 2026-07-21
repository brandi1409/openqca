# openQCA — Qualitäts-Spezifikation „Fertig"

**Zweck:** Verbindliche, maschinell prüfbare Definition von „fertig" für Web-App und Website.
Jedes Kriterium ist entweder durch die **E2E-Suite** (`apps/web/e2e/`, Playwright) oder durch die
bestehenden Prüfungen (Engine-Tests, R-Kreuzvalidierung, Build) abgedeckt. „Fertig" heißt:
**alle Prüfungen grün in CI** — nicht „sieht beim Durchklicken gut aus".

Stand: 2026-07-15 · Ausführung: Fable (Orchestrierung/Review), Opus/Sonnet (Umsetzung)

---

## A · Abnahmekriterien (maschinell geprüft)

### A1 — Korrektheit (bereits abgedeckt, bleibt Pflicht)
| # | Kriterium | Prüfung |
|---|---|---|
| A1.1 | Engine-Unit-Tests grün | `node --test` in `packages/engine` (29+) |
| A1.2 | Referenz-Suite grün | `node scripts/reference-check.mjs` |
| A1.3 | **R-Kreuzvalidierung exakt** (konservativ/intermediär/sparsam, fuzzy+crisp) | `node scripts/cross-validate.mjs` (12/12) |
| A1.4 | Produktions-Build fehlerfrei | `npm run build --workspace web` |

### A2 — Funktionale Flüsse (E2E, Chromium)
| # | Kriterium | Test |
|---|---|---|
| A2.1 | Alle Routen liefern 200 und **null Konsolen-Fehler/Pageerrors**: `/`, `/app`, `/methodik`, `/preise`, `/download`, `/konto`, `/rechtliches/{impressum,datenschutz,agb}` | `smoke.spec` |
| A2.2 | **Demo-Datensatz**: laden → Schritte 1–3 ✓ → komplexe Lösung enthält `WOHLSTAND*URBAN*BILDUNG` | `flows.spec` |
| A2.3 | **Crisp-Beispiel**: laden ohne Fehler; Deskriptivstatistik zeigt Min/Max exakt `0`/`1`; Kalibrier-Schritt zeigt „bereits kalibriert" | `flows.spec` |
| A2.4 | **Fuzzy-Beispiel**: laden ohne Fehler; WOHLSTAND Min/Max exakt `0,100`/`0,900` (keine Re-Kalibrierung) | `flows.spec` |
| A2.5 | **Beispiel-Tour**: startet, alle 7 Stationen per „Weiter", endet sauber | `tour.spec` |
| A2.6 | **DE/EN**: Umschalter stellt Kern-Überschriften um und zurück; Wahl übersteht Reload | `i18n.spec` |
| A2.7 | **Rollen-Wechsel**: Outcome im Variablen-Schritt umstellen → genau 1 Outcome, Lösungen rechnen neu, kein Fehler | `flows.spec` |
| A2.8 | **Grafik-Export**: SVG- und PNG-Button lösen echten Download aus | `interactions.spec` |
| A2.9 | **ⓘ-Popover**: öffnet vollständig im Viewport (auch in der kürzesten Tabelle), schließt per Escape | `interactions.spec` |
| A2.10 | **Anker per Tastatur**: Pfeiltaste am Kurven-Griff ändert das Zahlenfeld synchron | `interactions.spec` |

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
| # | Kriterium |
|---|---|
| A6.1 | `.github/workflows/ci.yml` führt zusätzlich die Playwright-Suite aus (Chromium); PRs ohne grüne Suite gelten als rot |

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
