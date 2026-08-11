import type React from "react";

/**
 * Gemeinsame UI-Bausteine mit EINER Definition (statt Duplikaten in page.tsx
 * und XyPlot.tsx). Alle Größen/Gewichte folgen der Skala aus globals.css.
 */

/** Kennzahl: großer Wert über kleiner, versaler Beschriftung. */
export function Kpi({ value, label }: { value: string; label: React.ReactNode }) {
  return (
    <div className="oq-kpi">
      <div className="oq-kpi__value">{value}</div>
      <div className="oq-kpi__label">{label}</div>
    </div>
  );
}

/** Karten-/Panel-Überschrift (16.5/600) — eine Stufe unter dem Step-Titel (20/700). */
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="oq-section-heading">{children}</h2>;
}
