"use client";

import { useCallback, useSyncExternalStore } from "react";

export type Locale = "de" | "en";

const STORAGE_KEY = "openqca_locale";
const LOCALE_EVENT = "openqca-locale";
const DEFAULT_LOCALE: Locale = "de";

/** Liest die aktuelle Sprache aus localStorage; Fallback ist Deutsch. */
function readLocale(): Locale {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "de";
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** SSR-/Hydration-Snapshot: immer Deutsch, damit kein Mismatch entsteht. */
function serverSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

/**
 * Abonniert Sprachwechsel. Reagiert auf das app-interne `openqca-locale`-Event
 * (gleicher Tab, getrennte Client-Bäume) und auf `storage` (andere Tabs).
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener(LOCALE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LOCALE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Client-Hook für die App-Sprache. Baut auf `useSyncExternalStore` auf, damit
 * getrennte Client-Bäume (Seite, Footer, Consent-Banner) synchron bleiben.
 * `setLocale` schreibt localStorage und stößt das app-interne Event an.
 */
export function useLocale(): [Locale, (next: Locale) => void] {
  const locale = useSyncExternalStore(subscribe, readLocale, serverSnapshot);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Speichern fehlgeschlagen (z. B. Privatmodus) – Event trotzdem senden,
      // damit die Wahl zumindest für diese Sitzung greift.
    }
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  return [locale, setLocale];
}
