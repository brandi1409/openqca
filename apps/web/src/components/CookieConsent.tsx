"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

const STORAGE_KEY = "openqca_consent";

/** Gültige, in localStorage abgelegte Einwilligungswerte. */
type ConsentChoice = "necessary" | "all";

/**
 * Dezentes Consent-Banner am unteren Rand.
 *
 * openQCA ist local-first: Der Kern funktioniert allein mit technisch
 * notwendiger Speicherung. Es wird KEIN Tracking-/Analyse-Code geladen –
 * dieses Banner dokumentiert nur die Einwilligung und speichert die Wahl
 * datenschutzfreundlich in localStorage (`openqca_consent`).
 *
 * Beide Schaltflächen sind gleichwertig gestaltet; „Nur notwendige" ist die
 * empfohlene, datenschutzfreundliche Voreinstellung. Das Banner startet
 * unsichtbar und erscheint erst nach dem Mount, um Hydration-Flackern zu
 * vermeiden. localStorage-Zugriffe sind in try/catch gekapselt.
 */
export function CookieConsent() {
  const [locale] = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== "necessary" && stored !== "all") setVisible(true);
    } catch {
      // localStorage nicht verfügbar (z. B. Privatmodus) → Banner zeigen,
      // damit die Wahl zumindest für diese Sitzung getroffen werden kann.
      setVisible(true);
    }
  }, []);

  function choose(choice: ConsentChoice) {
    try {
      window.localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Speichern fehlgeschlagen ist unkritisch – Banner trotzdem schließen.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      style={bannerStyle}
    >
      <div style={innerStyle}>
        <div style={textStyle}>
          <p id="cookie-consent-title" style={titleStyle}>
            {t(locale, "consent.title")}
          </p>
          <p id="cookie-consent-desc" style={descStyle}>
            {t(locale, "consent.descPre")}
            <a href="/rechtliches/datenschutz" style={linkStyle}>
              {t(locale, "consent.descLink")}
            </a>
            .
          </p>
        </div>

        <div style={actionsStyle}>
          <button
            type="button"
            onClick={() => choose("necessary")}
            style={primaryButtonStyle}
          >
            {t(locale, "consent.necessary")}
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            style={secondaryButtonStyle}
          >
            {t(locale, "consent.acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}

const bannerStyle: CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 60,
  borderTop: "1px solid var(--line)",
  background: "var(--panel)",
  boxShadow: "0 -6px 24px rgba(0, 0, 0, 0.08)",
};

const innerStyle: CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "14px 20px",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
};

const textStyle: CSSProperties = {
  flex: "1 1 320px",
  minWidth: 0,
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 13.5,
  fontWeight: 700,
  color: "var(--ink)",
};

const descStyle: CSSProperties = {
  margin: "3px 0 0",
  fontSize: 13.5,
  lineHeight: 1.5,
  color: "var(--ink-2)",
};

const linkStyle: CSSProperties = {
  color: "var(--accent-deep)",
  textDecoration: "underline",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  flexGrow: 1,
  flexBasis: 220,
  minWidth: 0,
};

const buttonBase: CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  padding: "8px 16px",
  borderRadius: 8,
  cursor: "pointer",
  lineHeight: 1.2,
  flex: "1 1 180px",
  minWidth: 0,
  textAlign: "center",
};

const primaryButtonStyle: CSSProperties = {
  ...buttonBase,
  color: "var(--panel)",
  background: "var(--brand)",
  border: "1px solid var(--brand)",
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonBase,
  color: "var(--ink)",
  background: "var(--panel-2)",
  border: "1px solid var(--line)",
};
