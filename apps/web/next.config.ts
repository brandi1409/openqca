import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/**
 * Version des Werkzeugs, wie sie in jedes Replikationsartefakt geschrieben wird
 * (R-Skript-Kopfzeile, Protokoll-JSON, Methoden-Protokoll). Einzige Quelle ist
 * `apps/web/package.json` — die Datei wird hier nur GELESEN.
 */
function appVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(fileURLToPath(new URL("./package.json", import.meta.url)), "utf8"),
    ) as { version?: string };
    return typeof pkg.version === "string" && pkg.version.trim() ? pkg.version.trim() : "dev";
  } catch {
    return "dev";
  }
}

/**
 * Kurze Commit-Kennung, damit ein Protokoll auf genau einen Stand zeigt.
 * Ohne Zusatzabhängigkeit: erst die von Hostern gesetzte Umgebungsvariable,
 * sonst `git rev-parse`. Ist beides nicht verfügbar (Tarball-Build), bleibt die
 * Kennung leer statt erfunden.
 */
function commitId(): string {
  const fromEnv =
    process.env.OPENQCA_COMMIT ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    "";
  if (fromEnv.trim()) return fromEnv.trim().slice(0, 7);
  try {
    return execFileSync("git", ["rev-parse", "--short=7", "HEAD"], {
      cwd: fileURLToPath(new URL(".", import.meta.url)),
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
  } catch {
    return "";
  }
}

const commit = commitId();

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    // Build-Zeitstempel für die Service-Worker-Versionierung (QUALITY-SPEC A5.1):
    // PwaRegister registriert /sw.js?v=<dieser Wert> — jede neue Version ergibt
    // eine neue SW-URL, alte Offline-Caches werden beim Aktivieren geräumt.
    NEXT_PUBLIC_BUILD_TS: String(Date.now()),
    // Reproduzierbarkeits-Metadaten der Exporte (Befund D): früher stand hier
    // hartkodiert „0.0.0" im Protokoll. Jetzt: echte Paketversion, optional mit
    // Commit-Kennung („0.1.0+5ef7611").
    NEXT_PUBLIC_APP_VERSION: commit ? `${appVersion()}+${commit}` : appVersion(),
  },
};

export default nextConfig;
