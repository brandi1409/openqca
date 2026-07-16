import type React from "react";

/**
 * Gemeinsame UI-Bausteine mit EINER Definition (statt Duplikaten in page.tsx
 * und XyPlot.tsx). Alle Größen/Gewichte folgen der Skala aus globals.css.
 */

/** Kennzahl: großer Wert über kleiner, versaler Beschriftung. */
export function Kpi({ value, label }: { value: string; label: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div
        style={{
          fontSize: 12,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--muted)",
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** Karten-/Panel-Überschrift (16.5/600) — eine Stufe unter dem Step-Titel (20/700). */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 16.5, fontWeight: 600, margin: "0 0 12px" }}>{children}</h2>;
}
