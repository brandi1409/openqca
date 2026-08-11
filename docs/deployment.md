# Deployment

## Web — VPS als Betriebsziel

Produktive und Staging-Instanzen laufen als eigenständiges Next.js-Image hinter
Caddy. Vercel ist ausschließlich eine Vorschau.

### Image veröffentlichen

`.github/workflows/publish-web-image.yml` läuft nach einer erfolgreichen
`main`-CI oder manuell. Es baut `apps/web/Dockerfile`, veröffentlicht nach GHCR
und schreibt den einzigen deploybaren Verweis in die Job-Zusammenfassung:

```text
OPENQCA_IMAGE=ghcr.io/<owner>/openqca-web@sha256:<digest>
```

Der `sha-*`-Tag dient nur der Lesbarkeit. Deployment und Rollback verwenden
immer den Digest. Öffentliche `NEXT_PUBLIC_*`-Werte werden über die
`STAGING_NEXT_PUBLIC_*` Repository-Variablen beim Build eingebettet. OpenAI-,
Supabase-Service- und Stripe-Secrets dürfen weder Build-Argumente noch
Image-Labels sein.

### Staging vorbereiten

Voraussetzungen: Docker Engine mit Compose v2, DNS auf den VPS, eingehende
Ports 80/443 und Zugriff auf GHCR. Bei einem privaten Paket meldet sich der VPS
einmalig mit einem nur lesenden `read:packages`-Credential bei `ghcr.io` an.

Eine private Env-Datei, beispielsweise `/srv/openqca/staging/.env`, enthält
mindestens:

```dotenv
OPENQCA_IMAGE=ghcr.io/<owner>/openqca-web@sha256:<digest>
CADDY_IMAGE=caddy@sha256:<verifizierter-digest>
OPENQCA_DOMAIN=staging.example.org
CADDY_EMAIL=ops@example.org
NEXT_PUBLIC_SITE_URL=https://staging.example.org
AI_ENABLED=false
```

Optionale Supabase-, AI- und Stripe-Werte folgen `.env.example`. Das
Anwendungsimage und das Caddy-Image müssen Digests sein.

### Promote, Smoke und Rollback

Auf dem VPS aus einem Checkout derselben Repository-Revision:

```bash
npm run release:staging -- promote /srv/openqca/staging/.env \
  ghcr.io/<owner>/openqca-web@sha256:<digest> \
  https://staging.example.org
```

Der Befehl:

1. speichert den bisherigen App-Digest mit Dateimodus 0600,
2. validiert die Compose-Konfiguration,
3. zieht App und Caddy,
4. startet ohne lokalen Build und wartet auf den Container-Healthcheck,
5. prüft anschließend den öffentlichen HTTPS-Health-Endpunkt.

Rollback verwendet das zuvor gespeicherte Image und baut nichts neu:

```bash
npm run release:staging -- rollback /srv/openqca/staging/.env \
  https://staging.example.org
```

Nur den öffentlichen Smoke erneut ausführen:

```bash
npm run smoke:staging -- https://staging.example.org
```

Es gibt absichtlich keinen SSH-Deploy aus GitHub Actions. Host, Benutzer,
Host-Fingerprint, Deployment-Verzeichnis und Credential-Policy müssen zuerst
vom Betreiber festgelegt werden; bis dahin bleibt die Freigabe
operatorgesteuert und überprüfbar.

## Web — Vercel-Vorschau

Das Repo ist ein npm-Monorepo; die Web-App liegt in `apps/web` und bindet den
Rechenkern `packages/engine` als Workspace ein. Für eine Vorschau:

1. Repo auf Vercel importieren, Root Directory: Repo-Wurzel.
2. `vercel.json` für Install, Build und Output verwenden.
3. Öffentliche und serverseitige Vorschauvariablen getrennt konfigurieren.

## Datenbank (Supabase)

`supabase/schema.sql` im SQL Editor ausführen (Tabellen + Row-Level-Security + Trigger). Details in `supabase/README.md`.

## Continuous Integration

`.github/workflows/ci.yml` läuft bei Push/PR: Engine-Tests, Referenz-/Validierungsprüfung (`scripts/reference-check.mjs`) und Produktions-Build.

## Desktop (Tauri)

Siehe `src-tauri/README.md`. Erfordert lokal installiertes Rust (rustup); signierte Installer brauchen Apple-/Microsoft-Entwicklerkonten.
