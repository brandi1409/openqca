"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

export interface GuidedTourStep {
  targetId: string;
  title: string;
  body: string;
}

interface GuidedTourProps {
  active: boolean;
  stepIndex: number;
  onNext: () => void;
  onEnd: () => void;
  steps: GuidedTourStep[];
}

/**
 * Geführte Beispiel-Tour: fixe Karte unten mittig, die Schritt für Schritt
 * durch die Kernstationen der App führt. Scrollt beim Stationswechsel das
 * Ziel-Element ins Bild und hebt es dezent per Outline hervor. Escape beendet
 * die Tour.
 */
export function GuidedTour({ active, stepIndex, onNext, onEnd, steps }: GuidedTourProps) {
  const [locale] = useLocale();
  const highlightedRef = useRef<HTMLElement | null>(null);
  const step = steps[stepIndex];

  // Ziel-Element scrollen + hervorheben; Hervorhebung beim Wechsel/Verlassen entfernen.
  useEffect(() => {
    if (!active || !step) return;
    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.outline = "2px solid var(--accent)";
      el.style.outlineOffset = "4px";
      highlightedRef.current = el;
    }
    return () => {
      if (highlightedRef.current) {
        highlightedRef.current.style.outline = "";
        highlightedRef.current.style.outlineOffset = "";
        highlightedRef.current = null;
      }
    };
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onEnd();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, onEnd]);

  if (!active || !step) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={step.title}
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        width: "min(420px, calc(100vw - 24px))",
        maxWidth: 420,
        background: "var(--panel)",
        border: "1px solid var(--accent)",
        borderRadius: 12,
        boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 6,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>{step.title}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", whiteSpace: "nowrap" }}>
          {t(locale, "tour.progress", { n: stepIndex + 1, total: steps.length })}
        </span>
      </div>
      <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 14px" }}>{step.body}</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="oq-btn oq-btn--secondary" onClick={onEnd}>
          {t(locale, "tour.end")}
        </button>
        <button type="button" className="oq-btn oq-btn--primary" onClick={onNext}>
          {t(locale, "tour.next")}
        </button>
      </div>
    </div>
  );
}
