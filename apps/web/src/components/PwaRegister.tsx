"use client";

import { useEffect } from "react";

/**
 * Registriert den Service Worker (public/sw.js) für die installierbare PWA.
 * Rendert nichts. Nur in Production aktiv, nur wenn der Browser Service
 * Worker unterstützt, alle Fehler defensiv abgefangen.
 */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    try {
      navigator.serviceWorker.register("/sw.js").catch(function () {
        // Registrierung fehlgeschlagen ist unkritisch — App funktioniert
        // weiterhin ohne Offline-Unterstützung.
      });
    } catch {
      // Synchrone Fehler (sehr selten) ebenfalls ignorieren.
    }
  }, []);

  return null;
}
