# Übergabe-Checkliste — openQCA live schalten

Der **kostenlose Kern** läuft bereits ohne alles Weitere. Diese Liste betrifft nur den Cloud-Tarif und den Live-Gang. Alles hier kann **nur der Inhaber** tun (Konten, Schlüssel, Rechtsprüfung, Deploy). Reihenfolge einhalten.

## 0. Grundlage
- [x] Repo auf GitHub anlegen und pushen (`openqca`).
- [x] Lokal prüfen: `npm install`, dann `npm run verify` (Engine-Tests 43/43, Referenz-Check, beide R-Kreuzvalidierungen, Lint, Build) — geprüft.

## 1. Supabase (Konto & Datenbank — P3)
- [x] Konto auf **supabase.com**, neues Projekt anlegen. Region wählen (EU für DSGVO). → OpenQCA `yuhsxueaafugixeiausy` eu-central-1
- [x] SQL Editor → Inhalt von `supabase/schema.sql` ausführen (Tabellen `profiles`, `projects` + RLS + Trigger). → via CLI migration applied
- [x] Project Settings → API: `URL`, `anon key`, `service_role key` kopieren. → in Vercel + local `.env.local`
- [x] Auth → E-Mail-Anmeldung (Magic Link) aktivieren; unter „Redirect URLs" die Live-Domain und `http://localhost:3000` eintragen. → config push
- [x] Werte eintragen: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. → Vercel prod/preview/dev + apps/web/.env.local

## 2. KI-Provider (optionale KI — P4)
- [x] Für lokale Integrationstests ist ein getrennt konfigurierbarer Gemini-Pfad vorhanden; OpenAI bleibt unterstützt.
- [ ] Auf dem Staging-VPS `AI_ENABLED=true`, `AI_PROVIDER=openai|gemini`, den passenden serverseitigen API-Key und das festgelegte Modell als Runtime-Secrets setzen; Keys niemals als Docker-Build-Argument verwenden.
- [ ] Mit derselben Provider-Konfiguration `AI_GOLD_LIVE=true npm run test:ai-gold:live --workspace web` ausführen und null Sicherheitsverstöße sowie mindestens 46 von 48 Status-/Qualitätsübereinstimmungen belegen.

## 3. Stripe (Zahlungen — P5)
- [ ] Konto auf **stripe.com**. Zwei Preise anlegen (Abo monatlich; Institutions-Lizenz) → Preis-IDs kopieren.
- [ ] `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_INSTITUTION` eintragen.
- [ ] Webhook-Endpunkt `https://DEINE-DOMAIN/api/stripe/webhook` anlegen (Events: `checkout.session.completed`, `customer.subscription.deleted`) → `STRIPE_WEBHOOK_SECRET` eintragen.

## 4. Recht (P6) — nur du + Prüfung
- [ ] Impressum: echte Angaben (Name, ladungsfähige Anschrift, E-Mail, ggf. USt-IdNr.) in `legal/impressum.md` einsetzen.
- [ ] `legal/datenschutz.md` und `legal/agb.md` mit echten Angaben füllen und **von einer qualifizierten Person (Anwalt/Datenschutzbeauftragte) prüfen lassen** — besonders VPS-Hosting, Drittlandübermittlung für Supabase/Stripe und den ausgewählten KI-Provider (OpenAI oder Google/Gemini), AV-Verträge und Widerrufsbelehrung.

## 5. VPS-Staging und produktiver Cutover (P7)
- [ ] Staging-Domain, DNS-A/AAAA-Einträge, VPS-Host, SSH-Benutzer, geprüften Host-Fingerprint und Deployment-Verzeichnis festlegen.
- [ ] GHCR-Paketsichtbarkeit bestimmen; bei privatem Paket ein nur lesendes `read:packages`-Credential auf dem VPS hinterlegen.
- [ ] Repository-Variablen `STAGING_NEXT_PUBLIC_SITE_URL` sowie optional die öffentlichen Supabase-/Stripe-Buildwerte setzen und den erfolgreichen GHCR-Workflow-Digest übernehmen.
- [ ] Docker Engine + Compose v2 bereitstellen und den Proxy-Modus wählen: auf freiem Host Compose-Caddy mit 80/443 und persistenten Volumes; auf gemeinsam genutztem Host den bestehenden Caddy nach Backup/Validierung um einen separaten Site-Block ergänzen und openQCA nur über einen unprivilegierten Loopback-Port anbinden. Alle verwendeten Images ausschließlich per Digest konfigurieren.
- [ ] Mit `npm run release:staging -- promote …` freigeben, öffentlichen HTTPS-Smoke und Browser-Canary ausführen, anschließend den dokumentierten Rollback einmal proben.
- [ ] Erst nach Goldset, fünf beobachteten Forschenden und juristischer Freigabe den Produktions-DNS-/Env-Cutover durchführen. Vercel bleibt Vorschau.

## 6. Optional — Desktop-App
- [ ] Rust installieren (`rustup`), dann Tauri bauen (siehe `src-tauri/README.md`). Signierte Builds brauchen Apple-/Microsoft-Entwicklerkonten.

## 7. Optional — Wissenschaftliche Verankerung
- [x] `CITATION.cff` + `paper/paper.md` sind mit echten Angaben gefüllt (Autor, Repository-/Website-URL, Release-Datum).
- [ ] Nur der Eigentümer kann noch ergänzen: optionale ORCID/Affiliation in beiden Dateien, eine Zenodo-DOI, die JOSS-Einreichung.

---
**Prüf-Schnelltest ohne Konten:** Läuft die App unter `npm run dev --workspace web` und zeigt „Cloud-Tarif · nicht konfiguriert", ist alles korrekt — die Cloud-Features aktivieren sich automatisch, sobald die Schlüssel gesetzt sind.
