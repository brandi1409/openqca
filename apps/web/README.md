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

## Prüfung

```bash
npm run lint --workspace web
npm run build --workspace web
cd apps/web && npx playwright test
```

Die Playwright-Konfiguration startet den Produktions-Build auf Port 3100.
