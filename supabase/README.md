# Supabase-Setup (openQCA)

Projekt: **OpenQCA** · Ref `yuhsxueaafugixeiausy` · Region `eu-central-1`
Dashboard: https://supabase.com/dashboard/project/yuhsxueaafugixeiausy

## CLI (linked)

```sh
supabase link --project-ref yuhsxueaafugixeiausy
supabase migration list
supabase db push --linked
supabase config push --project-ref yuhsxueaafugixeiausy
```

## Schema

- Versionierte Migration: `migrations/20260714120000_init.sql`
- Spiegel: `schema.sql` (gleiche Inhalte, idempotent)
- Tabellen: `profiles`, `projects` + RLS + Trigger `on_auth_user_created`

## App-Env

Lokal (nicht committen): `apps/web/.env.local`

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://yuhsxueaafugixeiausy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…   # nur Server
```

Produktion: Vercel Project `openqca` (Production/Preview/Development).

## Auth

- E-Mail / Magic Link aktiv
- `site_url`: https://openqca.vercel.app
- Redirects: Production + `http://localhost:3000` (+ 127.0.0.1)

Keys: `supabase projects api-keys --project-ref yuhsxueaafugixeiausy`
