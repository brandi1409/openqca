# Deployment

## Web (Vercel)

Das Repo ist ein npm-Monorepo; die Web-App liegt in `apps/web` und bindet den Rechenkern `packages/engine` als Workspace ein (via `transpilePackages`).

1. Repo auf GitHub pushen.
2. Auf **vercel.com** das Repo importieren.
   - Framework-Preset: **Next.js**
   - Root Directory: **Repo-Wurzel** (nicht `apps/web`) — die `vercel.json` setzt Install/Build/Output korrekt:
     - Install: `npm install` (verlinkt die Workspaces)
     - Build: `npm run build --workspace web`
     - Output: `apps/web/.next`
3. Umgebungsvariablen aus `.env.example` in Vercel → Settings → Environment Variables eintragen (siehe `handoff-checklist.md`).
4. Deploy. Ohne die Cloud-Variablen läuft die App als kostenloser local-first Kern; mit ihnen aktivieren sich Konto, Sync, KI und Zahlungen automatisch.

## Datenbank (Supabase)

`supabase/schema.sql` im SQL Editor ausführen (Tabellen + Row-Level-Security + Trigger). Details in `supabase/README.md`.

## Continuous Integration

`.github/workflows/ci.yml` läuft bei Push/PR: Engine-Tests, Referenz-/Validierungsprüfung (`scripts/reference-check.mjs`) und Produktions-Build.

## Desktop (Tauri)

Siehe `src-tauri/README.md`. Erfordert lokal installiertes Rust (rustup); signierte Installer brauchen Apple-/Microsoft-Entwicklerkonten.
