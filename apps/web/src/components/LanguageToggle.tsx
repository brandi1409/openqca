"use client";

import type { CSSProperties } from "react";
import { useLocale, type Locale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

const OPTIONS: readonly Locale[] = ["de", "en"];

/**
 * Kleiner DE/EN-Sprachumschalter. Die aktive Sprache ist hervorgehoben und
 * mit `aria-pressed` ausgezeichnet. Nutzt `useLocale`, damit alle Client-Bäume
 * synchron umschalten.
 */
export function LanguageToggle() {
  const [locale, setLocale] = useLocale();

  return (
    <span role="group" aria-label={t(locale, "toggle.ariaLabel")} style={groupStyle}>
      {OPTIONS.map((opt) => {
        const active = locale === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(opt)}
            style={active ? activeStyle : inactiveStyle}
          >
            {opt.toUpperCase()}
          </button>
        );
      })}
    </span>
  );
}

const groupStyle: CSSProperties = {
  display: "inline-flex",
  border: "1px solid var(--line)",
  borderRadius: 7,
  overflow: "hidden",
};

const baseButtonStyle: CSSProperties = {
  font: "inherit",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.03em",
  padding: "3px 9px",
  cursor: "pointer",
  border: "none",
  lineHeight: 1.4,
};

const activeStyle: CSSProperties = {
  ...baseButtonStyle,
  background: "var(--brand)",
  color: "#fff",
  cursor: "default",
};

const inactiveStyle: CSSProperties = {
  ...baseButtonStyle,
  background: "var(--panel)",
  color: "var(--ink-2)",
};
