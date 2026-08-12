# openQCA Web

Next.js-Arbeitsraum für die lokale, reproduzierbare QCA-Analyse.

## Lokale Entwicklung

Vom Repository-Root:

```bash
npm install
npm run dev --workspace web
```

Die App läuft unter `http://localhost:3000/app`.

## Arbeitsraum-Vertrag

`/app` besitzt fünf kontrollierte Ziele: `#answer`, `#research`, `#decisions`, `#evidence`
und `#defense`. Navigation aktualisiert die URL und Browser-History, ohne den Analysezustand
zu demontieren.

Lokale Projekte werden automatisch als Envelope `openqca-local-project` Version 2 gespeichert.
Beim App-Start wird ein kompatibler V1- oder V2-Stand nur als Resume-Kandidat angezeigt; geladen
wird er ausschließlich über die explizite Schaltfläche. `?demo=1` lädt weiterhin direkt das
synthetische Lehrbeispiel und wechselt zu `#answer`.

Rechnen und Verteidigen sind getrennt: berechenbare Ergebnisse erscheinen sofort als vorläufig.
Berichtsvorschau und Antwort bleiben zugänglich; die vier Replikationsartefakte werden erst
gemeinsam freigeschaltet, wenn Forschungsbrief, aktive Set-Kalibrierungen und die drei
wertgebundenen Analyseentscheidungen bestätigt sind. Demo-Daten sind nie zitier- oder exportfähig.

## KI-Review-Vertrag

Der optionale KI-Coach arbeitet ausschließlich mit drei geschlossenen Schreibaufgaben:
Forschungsfrage präzisieren, Set-Definition prüfen und eine ausgewählte Analysebegründung
prüfen. Vor jedem Versand zeigt die Oberfläche die exakte Nutzlast; Datensatzzeilen,
QCA-Ergebnisse, numerische Empfehlungen und Defense-Freigaben gehören nicht zum Vertrag.
Eine Antwort kann nur das zuvor geprüfte Zielfeld ersetzen. Jede Übernahme hebt dessen
menschliche Bestätigung auf.

Lokale und Cloud-Projekte speichern für übernommene KI-Texte nur Provider, Modell,
Erzeugungszeitpunkt und SHA-256-Hashes des vorherigen und übernommenen Texts. Bericht,
JSON-Protokoll (Schema-Version 2) und Markdown-Protokoll weisen diese Provenienz aus;
die ersetzten Texte werden nicht zusätzlich in der Provenienz dupliziert.

## Prüfung

```bash
npm run lint --workspace web
npm run build --workspace web
cd apps/web && npx playwright test
```

Die Playwright-Konfiguration startet den Produktions-Build auf Port 3100.
