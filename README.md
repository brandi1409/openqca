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

**Live:** https://openqca.vercel.app

- **Engine** komplett & getestet (26 Tests): Kalibrierung (direkt/linear/crisp/4-Werte), Konsistenz/Coverage/PRI, Truth Table, Quine-McCluskey-Minimierung, komplexe + **intermediäre** (directional expectations) + sparsame Lösung, Notwendigkeitsanalyse, **Robustheits-Sweep**. Referenz-Suite: `node scripts/reference-check.mjs` (siehe `VALIDATION.md`).
- **Web-App** (deployt): geführte Kalibrierung mit Live-Coach, Truth Table, alle drei Lösungstypen, Notwendigkeit, **Analyse des negierten Outcomes (~Y)**, Robustheits-Panel, XY-Plot, Deskriptivstatistik, CSV/**XLSX**-Import, Beispieldatensätze, Protokoll-Export (JSON + R-Skript), **druckfähiger Bericht (PDF)**, **DE/EN-Umschalter**. Der kostenlose Kern rechnet vollständig lokal im Browser.
- **Cloud (optional):** Konto (Supabase Magic Link) + Projekt-Speicherung; KI-Assistenten (Anthropic) und Zahlungen (Stripe) sind im Code fertig und werden rein über Env-Variablen zugeschaltet.
- **Offen:** Desktop-Build (Tauri, braucht Rust + Signierung), Cross-Validierung gegen fsQCA 4.1 / R-Paket `QCA`, juristische Prüfung der `[PRÜFEN]`-Punkte in `legal/`, öffentliches Repository, eigene Domain.

Details und der vollständige Bauplan: `prototypes/03-goldplan.html` · Übergabe: `docs/handoff-checklist.md`.

## Lizenz

MIT (siehe `package.json`). Rechtstexte unter `legal/` sind unverbindliche Entwürfe und vor Veröffentlichung juristisch zu prüfen.
