# Übergabe-Checkliste — openQCA live schalten

Der **kostenlose Kern** läuft bereits ohne alles Weitere. Diese Liste betrifft nur den Cloud-Tarif und den Live-Gang. Alles hier kann **nur der Inhaber** tun (Konten, Schlüssel, Rechtsprüfung, Deploy). Reihenfolge einhalten.

## 0. Grundlage
- [x] Repo auf GitHub anlegen und pushen (`openqca`).
- [ ] Lokal prüfen: `npm install`, dann `npm test --workspace @openqca/engine` (43/43) und `npm run build --workspace web`.

## 1. Supabase (Konto & Datenbank — P3)
- [x] Konto auf **supabase.com**, neues Projekt anlegen. Region wählen (EU für DSGVO). → OpenQCA `yuhsxueaafugixeiausy` eu-central-1
- [x] SQL Editor → Inhalt von `supabase/schema.sql` ausführen (Tabellen `profiles`, `projects` + RLS + Trigger). → via CLI migration applied
- [x] Project Settings → API: `URL`, `anon key`, `service_role key` kopieren. → in Vercel + local `.env.local`
- [x] Auth → E-Mail-Anmeldung (Magic Link) aktivieren; unter „Redirect URLs" die Live-Domain und `http://localhost:3000` eintragen. → config push
- [x] Werte eintragen: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. → Vercel prod/preview/dev + apps/web/.env.local

## 2. Anthropic (KI — P4)
- [ ] Konto auf **console.anthropic.com**, API-Key erstellen.
- [ ] `ANTHROPIC_API_KEY` eintragen. (Modelle sind im Code gesetzt: `claude-haiku-4-5` Standard, `claude-sonnet-5` für Textgenerierung — Kosten laufen über dein Konto.)

## 3. Stripe (Zahlungen — P5)
- [ ] Konto auf **stripe.com**. Zwei Preise anlegen (Abo monatlich; Institutions-Lizenz) → Preis-IDs kopieren.
- [ ] `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_INSTITUTION` eintragen.
- [ ] Webhook-Endpunkt `https://DEINE-DOMAIN/api/stripe/webhook` anlegen (Events: `checkout.session.completed`, `customer.subscription.deleted`) → `STRIPE_WEBHOOK_SECRET` eintragen.

## 4. Recht (P6) — nur du + Prüfung
- [ ] Impressum: echte Angaben (Name, ladungsfähige Anschrift, E-Mail, ggf. USt-IdNr.) in `legal/impressum.md` einsetzen.
- [ ] `legal/datenschutz.md` und `legal/agb.md` mit echten Angaben füllen und **von einer qualifizierten Person (Anwalt/Datenschutzbeauftragte) prüfen lassen** — besonders Drittlandübermittlung (USA) für Supabase/Stripe/Anthropic/Vercel, AV-Verträge, Widerrufsbelehrung. Das ist der einzige Punkt, der nicht vorbereitbar war.

## 5. Vercel (Deploy — P7)
- [ ] Konto auf **vercel.com**, Repo importieren. Framework-Preset: **Next.js**. Root: Repo-Wurzel (die `vercel.json` steuert Build der Web-App).
- [ ] Alle Env-Variablen aus Schritt 1–3 in Vercel → Project → Settings → Environment Variables eintragen. `NEXT_PUBLIC_SITE_URL` auf die Live-Domain setzen.
- [ ] Deploy. Danach die Domain in Supabase-Redirect-URLs und im Stripe-Webhook eintragen (falls noch localhost).

## 6. Optional — Desktop-App
- [ ] Rust installieren (`rustup`), dann Tauri bauen (siehe `src-tauri/README.md`). Signierte Builds brauchen Apple-/Microsoft-Entwicklerkonten.

## 7. Optional — Wissenschaftliche Verankerung
- [ ] `CITATION.cff` + `paper/paper.md` mit echten Autor:innen/ORCID/DOIs füllen; Zenodo-DOI erzeugen; JOSS-Einreichung.

---
**Prüf-Schnelltest ohne Konten:** Läuft die App unter `npm run dev --workspace web` und zeigt „Cloud-Tarif · nicht konfiguriert", ist alles korrekt — die Cloud-Features aktivieren sich automatisch, sobald die Schlüssel gesetzt sind.
