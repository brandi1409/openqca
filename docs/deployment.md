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

Voraussetzungen: Docker Engine mit Compose v2, DNS auf den VPS und Zugriff auf
GHCR. Bei einem privaten Paket meldet sich der VPS einmalig mit einem nur
lesenden `read:packages`-Credential bei `ghcr.io` an. Es gibt zwei bewusst
getrennte Proxy-Modi.

#### Eigener, von Compose verwalteter Caddy

Dieser Modus ist für einen freien Host bestimmt. Er belegt die eingehenden Ports
80/443. Eine private Env-Datei, beispielsweise
`/srv/openqca/staging/.env`, enthält mindestens:

```dotenv
OPENQCA_PROXY_MODE=managed
OPENQCA_IMAGE=ghcr.io/<owner>/openqca-web@sha256:<digest>
CADDY_IMAGE=caddy@sha256:<verifizierter-digest>
OPENQCA_DOMAIN=staging.example.org
CADDY_EMAIL=ops@example.org
NEXT_PUBLIC_SITE_URL=https://staging.example.org
AI_ENABLED=false
```

#### Bereits betriebener Host-Caddy

Auf einem gemeinsam genutzten VPS darf `deploy/docker-compose.yml` nicht
gestartet werden: sein Caddy würde mit dem bestehenden Dienst um 80/443
konkurrieren. Stattdessen setzt dieselbe private Env-Datei:

```dotenv
OPENQCA_PROXY_MODE=shared
OPENQCA_UPSTREAM_PORT=3212
OPENQCA_IMAGE=ghcr.io/<owner>/openqca-web@sha256:<digest>
NEXT_PUBLIC_SITE_URL=https://staging.example.org
AI_ENABLED=false
```

`deploy/docker-compose.shared-caddy.yml` übernimmt die unveränderte
Web-Service-Definition und veröffentlicht Port 3000 ausschließlich als
`127.0.0.1:3212`. Der vorhandene Host-Caddy erhält nach Sicherung und
erfolgreichem `caddy validate` einen separaten Site-Block:

```caddyfile
staging.example.org {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3212
}
```

Der Release-Befehl verändert oder lädt die Host-Caddy-Konfiguration nie selbst
und startet in diesem Modus keinen zweiten Proxy. `CADDY_IMAGE`,
`OPENQCA_DOMAIN` und `CADDY_EMAIL` sind dann nicht erforderlich. Vor dem ersten
Release müssen der separate Site-Block und sein TLS-Endpunkt bereits
funktionieren, da ein fehlgeschlagener öffentlicher HTTPS-Smoke automatisch zum
letzten Digest zurückkehrt.

Optionale Supabase-, AI- und Stripe-Werte folgen `.env.example`. Das
Anwendungsimage und im verwalteten Modus auch das Caddy-Image müssen Digests
sein.

Die private Env-Datei ist für Releases autoritativ. Kontrollwerte verwenden
bewusst die kanonische Form `NAME=Wert`; mehrdeutige Compose-Dotenv-Varianten
werden abgelehnt. Gleichnamige exportierte Shell-Variablen entfernt das
Release-Skript vor jedem Compose-Aufruf, damit Promote und Fehler-Rollback
garantiert dieselbe Port-, Image- und Provider-Konfiguration verwenden.

### Promote, Smoke und Rollback

Auf dem VPS aus einem Checkout derselben Repository-Revision:

```bash
npm run release:staging -- promote /srv/openqca/staging/.env \
  ghcr.io/<owner>/openqca-web@sha256:<digest> \
  https://staging.example.org
```

1. speichert den bisherigen App-Digest mit Dateimodus 0600,
2. validiert die ausgewählte Compose-Konfiguration,
3. zieht die App und im verwalteten Modus zusätzlich Caddy,
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
