# openQCA

Quelloffenes, reproduzierbares Werkzeug für **Qualitative Comparative Analysis (QCA)** — ein moderner Neubau von Ragins fs/QCA. Läuft local-first im Browser (kostenloser Kern) und ist als Cloud-Version (mit Konto & KI) sowie als Desktop-Download geplant.

## Ordnerstruktur

```
openqca/
├── packages/engine/   Rechenkern (TypeScript, ohne Abhängigkeiten) — getestet
├── apps/web/          Web-App (Next.js 16 + React 19) — der kostenlose Workflow
├── prototypes/        Design-/Konzept-Prototypen + Gold-Plan (statisches HTML)
├── datasets/          Beispiel-Datensätze (synthetisch) + README
├── docs/              QCA-Primer & Engine-Doku
└── legal/             DSGVO-Entwürfe (Impressum, Datenschutz, Cookies, AGB) — ENTWÜRFE
```

## Schnellstart

```bash
npm install                    # Abhängigkeiten (Monorepo)
npm test --workspace @openqca/engine   # Engine-Tests (14/14)
npm run dev --workspace web    # Web-App auf http://localhost:3000
```

## Stand

- **Engine** komplett & getestet: Kalibrierung (direkt/linear/crisp/4-Werte), Konsistenz/Coverage/PRI, Truth Table, Quine-McCluskey-Minimierung, komplexe + sparsame Lösung, Notwendigkeitsanalyse.
- **Web-App** lauffähig: geführte Kalibrierung mit Live-Coach, Truth Table, Lösungen, Notwendigkeit, Protokoll-Export (JSON + R-Skript). Alles rechnet lokal im Browser.
- **Offen:** intermediäre Lösung/ESA, CSV-Import-UI, Desktop-Wrapper (Tauri), Cloud (Supabase), KI-Routen (Anthropic), Zahlungen (Stripe), Rechtsprüfung, Deployment (Vercel).

Details und der vollständige Bauplan: `prototypes/03-goldplan.html`.

## Lizenz

MIT (siehe `package.json`). Rechtstexte unter `legal/` sind unverbindliche Entwürfe und vor Veröffentlichung juristisch zu prüfen.
