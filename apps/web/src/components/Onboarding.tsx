"use client";

import { useEffect, useState } from "react";
import { useLocale, type Locale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

const STORAGE_KEY = "openqca_onboarding_dismissed";

interface OnboardingStep {
  no: number;
  title: string;
  detail: string;
}

function steps(locale: Locale): readonly OnboardingStep[] {
  return [
    { no: 1, title: t(locale, "onboarding.step1.title"), detail: t(locale, "onboarding.step1.detail") },
    { no: 2, title: t(locale, "onboarding.step2.title"), detail: t(locale, "onboarding.step2.detail") },
    { no: 3, title: t(locale, "onboarding.step3.title"), detail: t(locale, "onboarding.step3.detail") },
  ];
}

interface OnboardingProps {
  /** Optionaler Callback, sobald die Einführung geschlossen wird. */
  onDismiss?: () => void;
}

/**
 * Dezente, schließbare 3-Schritt-Kurzeinführung (Karte oben, kein modaler
 * Blocker). Merkt sich das Schließen in localStorage und erscheint danach
 * nicht mehr. Startet unsichtbar und wird erst nach dem Mount eingeblendet,
 * um Hydration-Flackern zu vermeiden.
 */
export function Onboarding({ onDismiss }: OnboardingProps) {
  const [locale] = useLocale();
  const [visible, setVisible] = useState(false);
  const STEPS = steps(locale);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      // localStorage nicht verfügbar (z. B. Privatmodus) → Einführung zeigen
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Speichern fehlgeschlagen ist unkritisch – Karte trotzdem schließen
    }
    setVisible(false);
    onDismiss?.();
  }

  if (!visible) return null;

  return (
    <section aria-label={t(locale, "onboarding.aria")} style={cardStyle}>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t(locale, "onboarding.closeAria")}
        style={closeStyle}
      >
        <span aria-hidden="true">×</span>
      </button>

      <div style={headStyle}>
        <span style={eyebrowStyle}>{t(locale, "onboarding.eyebrow")}</span>
        <h2 style={headingStyle}>{t(locale, "onboarding.heading")}</h2>
      </div>

      <ol style={stepsStyle}>
        {STEPS.map((step, i) => (
          <li key={step.no} style={stepItemStyle}>
            <span aria-hidden="true" style={numStyle}>
              {step.no}
            </span>
            <span style={stepTextStyle}>
              <span style={stepTitleStyle}>{step.title}</span>
              <span style={stepDetailStyle}>{step.detail}</span>
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" style={arrowStyle}>
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  position: "relative",
  border: "1px solid var(--line)",
  borderLeft: "3px solid var(--brand)",
  background: "var(--brand-wash)",
  borderRadius: 12,
  padding: "16px 18px",
};

const closeStyle: React.CSSProperties = {
  position: "absolute",
  top: 8,
  right: 8,
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  lineHeight: 1,
  cursor: "pointer",
  color: "var(--muted)",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 7,
};

const headStyle: React.CSSProperties = {
  marginBottom: 12,
  paddingRight: 32,
};

const eyebrowStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--brand)",
};

const headingStyle: React.CSSProperties = {
  margin: "3px 0 0",
  fontSize: 16,
  fontWeight: 700,
  color: "var(--ink)",
};

const stepsStyle: React.CSSProperties = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const stepItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flex: "1 1 200px",
};

const numStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 26,
  height: 26,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  color: "var(--panel)",
  background: "var(--brand)",
  borderRadius: 999,
};

const stepTextStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 1,
  minWidth: 0,
};

const stepTitleStyle: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 600,
  color: "var(--ink)",
};

const stepDetailStyle: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.4,
  color: "var(--ink-2)",
};

const arrowStyle: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 16,
  color: "var(--muted)",
};
