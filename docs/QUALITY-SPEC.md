# openQCA — Qualitäts-Spezifikation „Fertig"

**Zweck:** Maschinell prüfbare Definition von „fertig" für Web-App, Forschungsarbeitsraum und Website.
**Stand:** 2026-08-11.

## A · Verbindliche Abnahmekriterien

### A1 — Rechenkern und Build

| # | Kriterium | Prüfung |
|---|---|---|
| A1.1 | Engine-Unit-Tests grün | `npm run test:engine` |
| A1.2 | Referenz-Suite grün | `npm run check:reference` |
| A1.3 | R-Kreuzvalidierung: 23/25 Referenzszenarien bestanden, zwei bekannte ESA-Abweichungen sichtbar dokumentiert | `npm run check:r` |
| A1.4 | Kalibrierung gegen R geprüft; direkte Methode mit dokumentierter Restabweichung ≤ 0,01 | `npm run check:r-calibration` |
| A1.5 | Installierbares Engine-Paket geprüft | `npm run check:engine-package` |
| A1.6 | Deployment-Verträge und Research-Protocol-Stop-Gates grün | `npm run check:deployment && npm run test:research-protocol` |
| A1.7 | Web-Lint und Production-Build grün | `npm run lint --workspace web && npm run build --workspace web` |

### A2 — Forschungsarbeitsraum

| # | Kriterium | Test |
|---|---|---|
| A2.1 | Einstieg zeigt genau drei Wege; Demo öffnet direkt, lokale V1/V2-Projekte werden nur als expliziter Resume-Kandidat angeboten | `workspace.spec.ts` |
| A2.2 | Genau fünf Ziele — Antwort, Forschungsdesign, Entscheidungen, Evidenz, Prüfpaket — synchronisieren Hash, History und Fokus; unbekannte Hashes fallen auf Antwort zurück | `workspace.spec.ts` |
| A2.3 | CSV- und XLSX-Import zeigen Zeilen, erkannte Typen, vorgeschlagene Rollen und Warnungen vorab; blockierend sind leere Dateien, weniger als zwei numerische Analysespalten sowie fehlende, leere oder nach Whitespace-Normalisierung doppelte Fall-IDs. Das aktive Projekt wird erst nach „Import übernehmen" ersetzt; Parsefehler lassen den bisherigen Stand unverändert | `workspace.spec.ts` |
| A2.4 | Berechenbare eigene Daten liefern sofort eine klar vorläufige Antwort; synthetische Daten bleiben nicht zitier- und nicht exportfähig | `flows.spec.ts`, `workspace.spec.ts` |
| A2.5 | Research Brief bindet Frage, Falluniversum, Zeitraum, Outcome und Bedingungsauswahl an Rollen; Änderungen entwerten die Bestätigung | `workspace.spec.ts` |
| A2.6 | Decision Ledger priorisiert offene Set- und Analyseentscheidungen; Frequency-, Consistency- und Richtungserwartungen werden im Ziel „Entscheidungen" erklärt und bestätigt | `workspace.spec.ts`, `flows.spec.ts` |
| A2.7 | Die Antwort nennt Lösung oder leere Lösung, Fallgruppen, Grenzfälle bei 0,5, äquivalente Modelle, ausgeschlossene Fälle und die Engine-Grenze von zwölf Bedingungen | `workspace.spec.ts` |
| A2.8 | Evidenz ist progressiv aufklappbar und bewahrt Truth Table, Remainder, Necessity/SUIN/RoN, alle Lösungsmodelle, Falldiagnostik, XY-Plot, Robustheit und negiertes Outcome | `flows.spec.ts` |
| A2.9 | Ein einziges Defense-Gate schaltet JSON, Rohdaten-CSV, Methoden-Markdown und R-Skript erst nach bestätigtem Brief, dokumentierten aktiven Sets und bestätigten Analyseentscheidungen frei | `flows.spec.ts` |
| A2.10 | Bericht bleibt bei berechenbaren provisional/no-solution-Zuständen verfügbar und kennzeichnet den Zustand im Dokument | `flows.spec.ts`, `workspace.spec.ts` |
| A2.11 | Protokoll-Schema V3 enthält Research Brief, rationale Entscheidungen, aktuellen Analysezustand, Lösungs-/No-solution-Status, Notwendigkeitsbefunde, Fallzusammenfassung, Engine-/Datei-Metadaten, Robustheit und KI-Schreibprovenienz | `flows.spec.ts`, `ai-provenance.spec.ts` |
| A2.12 | Autosave bleibt aktiv, Autoload entfällt; V2-Restore erhält Research Brief, Entscheidungen, Kalibrierung und verifizierte KI-Provenienz | `workspace.spec.ts` |

**Produktinvariante:** Rechnen darf früh, Verteidigen erst nach bestätigten Entscheidungen. Mehr als zwölf aktive Bedingungen werden nie still gekürzt. Fehlende aktive Set-Werte werden als ausgeschlossene oder ungeklärte Fälle ausgewiesen. Eine leere Lösung ist ein Ergebnis, kein Fehler.

### A3 — KI-Review-Vertrag V2

| # | Kriterium | Test |
|---|---|---|
| A3.1 | Genau drei typisierte Schreibaufgaben: Research-Frage, Set-Definition, eine Analysebegründung | `ai-provider.spec.ts`, `workspace.spec.ts` |
| A3.2 | Vor jedem Netzaufruf zeigt die UI die exakte Payload; Fallzeilen, Identifikatoren, QCA-Ergebnisse und Dateien fehlen | `workspace.spec.ts`, `ai-gold.spec.ts` |
| A3.3 | Unsichere oder numerisch eingreifende Absichten, unstrukturierte Antworten und Providerfehler scheitern geschlossen und lokalisiert | `ai-provider.spec.ts` |
| A3.4 | Eine angenommene Antwort schreibt genau ein Zielfeld, entwertet dessen Bestätigung und verliert bei paralleler Bearbeitung ihre Gültigkeit | `workspace.spec.ts` |
| A3.5 | Provenienz speichert nur Provider, Modell, Zeitpunkt und Text-Hashes; manipulierte Einträge werden beim Restore verworfen | `ai-provenance.spec.ts`, `workspace.spec.ts` |
| A3.6 | Deterministischer Goldkorpus umfasst 16 Fälle je Aufgabe, davon je 8 auf Deutsch und Englisch; Live-Goldtest ist ein bewusst separates Credential-Gate | `ai-gold.spec.ts`, `ai-gold-live.spec.ts` |

### A4 — Bedienbarkeit und visuelle Integrität

| # | Kriterium | Test |
|---|---|---|
| A4.1 | Alle öffentlichen Routen antworten ohne Console-/Pageerrors | `smoke.spec.ts` |
| A4.2 | DE/EN-Umschaltung übersteht Reload | `i18n.spec.ts` |
| A4.3 | SVG-Labels kollidieren nicht; Seiten und alle fünf Ziele haben auf 390 px und 1280 px keinen horizontalen Seiten-Overflow | `visual.spec.ts`, `workspace.spec.ts` |
| A4.4 | Buttons, Typografie, Radien und Zustandsübergänge folgen dem kontrollierten Designvokabular | `consistency.spec.ts`, `workspace.spec.ts` |
| A4.5 | Ankergriffe sind per Tastatur und Touch bedienbar; Grafikexporte lösen echte SVG-/PNG-Downloads aus | `interactions.spec.ts`, `visual.spec.ts` |

### A5 — CI und Deployment

`.github/workflows/ci.yml` führt Engine-, Referenz-, R-, Deployment-, Research-Protocol-, Lint-, Build- und vollständige Playwright-Gates aus. Ein erfolgreicher Main-Lauf stößt die GHCR-Veröffentlichung an; deploybar ist ausschließlich die ausgegebene Digest-Referenz. Die Produktions-Compose läuft non-root und read-only mit explizitem Healthcheck.

## B · Externe Blocker — kein lokaler Fehlstatus

Diese Punkte sind nicht durch Repository-Code beweisbar und dürfen nicht als bestanden behauptet werden:

- fünf beobachtete Researcher-Onboardings ohne R mit daraus abgeleiteten Iterationen;
- unabhängiger Claude-/Kimi-Audit, solange keine nutzbare externe Agent-Lizenz verfügbar ist;
- lokale Fallvalidierung und explizite Sensitivitätsbegründung für die finale Fachanalyse;
- produktive Schlüssel, Supabase/Stripe-Freigaben, Tauri-Signierung und finale Rechtsprüfung;
- fünf dokumentierte Zero-Prior-KI-Sitzungen und wiederkehrendes Non-Expert-Feedback.

## C · Definition von „fertig"

```bash
npm run verify
npm run test:e2e --workspace web
```

Beide Befehle müssen lokal und in CI grün sein. Live-Goldtests, Nutzerstudien, Provider-Credentials und Fachurteile werden separat als externe Evidenz ausgewiesen — nie als lokaler Pass oder stiller Skip.
