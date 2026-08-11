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
    <span className="oq-language-toggle" role="group" aria-label={t(locale, "toggle.ariaLabel")} style={groupStyle}>
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
  borderRadius: "var(--radius-control)",
  overflow: "hidden",
};

const baseButtonStyle: CSSProperties = {
  minWidth: 44,
  minHeight: 44,
  padding: "3px 9px",
  border: "none",
  font: "inherit",
  fontSize: 12,
  fontWeight: 650,
  letterSpacing: "0.03em",
  lineHeight: 1.4,
  cursor: "pointer",
};

const activeStyle: CSSProperties = {
  ...baseButtonStyle,
  color: "var(--accent-deep)",
  background: "var(--accent-wash)",
  boxShadow: "inset 0 0 0 1px color-mix(in oklch, var(--accent) 28%, transparent)",
  cursor: "default",
};

const inactiveStyle: CSSProperties = {
  ...baseButtonStyle,
  background: "var(--panel)",
  color: "var(--ink-2)",
};
