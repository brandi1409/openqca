import type { MetadataRoute } from "next";

/**
 * Web App Manifest für die installierbare PWA. Der Gratis-Kern rechnet
 * vollständig im Browser — installiert als App ist openQCA nach dem ersten
 * Besuch auch offline nutzbar (siehe public/sw.js + PwaRegister.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "openQCA",
    short_name: "openQCA",
    description:
      "Das offene, geführte Werkzeug für Qualitative Comparative Analysis — local-first, reproduzierbar.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#f6f8f7",
    theme_color: "#0f5c54",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
