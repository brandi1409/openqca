# Desktop-App (Tauri) — Gerüst

Dies ist ein **Konfigurationsgerüst** für die local-first Desktop-Auslieferung. Es ist bewusst noch nicht gebaut — dazu fehlen Voraussetzungen, die nur lokal/mit Konten erfüllt werden können.

## Voraussetzungen (nur du)
- **Rust/cargo** lokal installieren: https://rustup.rs (in dieser Umgebung war es nicht vorhanden).
- **Tauri-CLI**: `cargo install tauri-cli` bzw. `npm i -D @tauri-apps/cli`.
- **Signierung/Notarisierung** der Installer braucht ein **Apple-Entwicklerkonto** (macOS) bzw. ein **Microsoft-Code-Signing-Zertifikat** (Windows).

## Noch zu erledigen
1. **Statischer Frontend-Export.** Die Desktop-App bündelt den kostenlosen, local-first Kern — ohne die Server-/API-Routen (KI/Stripe/Supabase laufen nur in der Cloud-Version). Dafür eine Export-Variante der Web-App bauen (`next build` mit `output: "export"` in einer Desktop-Konfiguration, sodass nur die Client-Analyse einfließt) und das Ergebnis nach `apps/web/out/` schreiben. `frontendDist` in `tauri.conf.json` zeigt bereits dorthin.
2. **Rust-Grundgerüst** erzeugen: `cargo tauri init` bzw. den `src-tauri/src/main.rs`-Einstieg + `Cargo.toml` ergänzen.
3. Icons unter `bundle.icon` hinterlegen.
4. Bauen: `cargo tauri build` → signierte `.dmg`/`.msi`.

## Warum als Gerüst belassen
Der Rust-Toolchain-Build und die Code-Signierung sind an lokale Installation bzw. Entwicklerkonten gebunden. Der Nutzen-Kern (dieselbe Web-UI, voll offline) ist damit vorbereitet, aber der eigentliche Binär-Build bleibt ein bewusst dokumentierter, von dir auszuführender Schritt.
