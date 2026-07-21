import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Build-Zeitstempel für die Service-Worker-Versionierung (QUALITY-SPEC A5.1):
    // PwaRegister registriert /sw.js?v=<dieser Wert> — jede neue Version ergibt
    // eine neue SW-URL, alte Offline-Caches werden beim Aktivieren geräumt.
    NEXT_PUBLIC_BUILD_TS: String(Date.now()),
  },
};

export default nextConfig;
