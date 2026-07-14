# Supabase-Setup

1. Projekt auf [supabase.com](https://supabase.com) anlegen (EU-Region für DSGVO empfohlen).
2. **SQL Editor** öffnen → Inhalt von [`schema.sql`](./schema.sql) einfügen und ausführen.
   Das legt an: Tabellen `profiles` (Tarif je Nutzer:in) und `projects` (gespeicherte Analysen),
   Row-Level-Security-Policies (jede*r sieht nur eigene Daten), einen Trigger, der bei Registrierung
   automatisch ein Profil anlegt, und einen `updated_at`-Trigger.
3. **Authentication → Providers**: E-Mail (Magic Link) aktivieren.
   **URL Configuration → Redirect URLs**: Live-Domain und `http://localhost:3000` eintragen.
4. **Project Settings → API**: `URL`, `anon key` und `service_role key` in die Env-Variablen übernehmen
   (siehe `../.env.example` und `../docs/handoff-checklist.md`).

Änderungen am Schema am besten versioniert hier ablegen (weitere `*.sql`-Dateien) und im SQL Editor anwenden.
