"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

interface InfoHintProps {
  title: string;
  body: string;
  formula?: string;
}

/**
 * Kleines, barrierefreies Erklär-Popover für Kennzahlen und Konzepte: ein
 * dezentes ⓘ-Symbol als Button, das bei Klick eine kurze Erklärung einblendet
 * (Titel, Erklärtext, optional eine Formel in Unicode-Notation). Schließt bei
 * Klick außerhalb des Popovers oder mit Escape.
 */
export function InfoHint({ title, body, formula }: InfoHintProps) {
  const [locale] = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <button
        type="button"
        aria-label={title}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={infoButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--accent-deep)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--muted)";
        }}
      >
        ⓘ
      </button>
      {open && (
        <div role="dialog" aria-label={title} style={popoverStyle}>
          <div style={popoverTitleStyle}>{title}</div>
          <div style={popoverBodyStyle}>{body}</div>
          {formula && (
            <div className="mono" style={popoverFormulaStyle}>
              {formula}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <a href="/methodik" style={popoverLinkStyle}>
              {t(locale, "info.moreLink")}
            </a>
          </div>
        </div>
      )}
    </span>
  );
}

const infoButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 16,
  height: 16,
  padding: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: 14,
  lineHeight: 1,
  color: "var(--muted)",
  font: "inherit",
  flex: "none",
};

const popoverStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  zIndex: 60,
  width: "max-content",
  maxWidth: 300,
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  boxShadow: "0 4px 18px rgba(0,0,0,0.16)",
  padding: "12px 14px",
  textTransform: "none",
  letterSpacing: "normal",
};

const popoverTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  color: "var(--ink)",
  fontSize: 13.5,
  marginBottom: 4,
};

const popoverBodyStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.5,
  color: "var(--ink-2)",
  fontWeight: 400,
};

const popoverFormulaStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  background: "var(--panel-2)",
  border: "1px solid var(--line)",
  borderRadius: 6,
  padding: "6px 8px",
  overflowX: "auto",
  whiteSpace: "nowrap",
  color: "var(--ink)",
};

const popoverLinkStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--accent-deep)",
  textDecoration: "none",
  fontWeight: 600,
};
