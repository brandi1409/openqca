"use client";

import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

interface XyPoint {
  label: string;
  x: number;
  y: number;
}

interface XyPlotProps {
  xLabel: string;
  yLabel: string;
  points: XyPoint[];
}

const fmt = (v: number): string =>
  Number.isFinite(v) ? v.toFixed(3).replace(".", ",") : "—";

const tick = (v: number): string => v.toFixed(2).replace(".", ",");

// Quadratisches Koordinatensystem; Plotfläche innerhalb der Ränder ist quadratisch.
const W = 480;
const H = 480;
const ML = 48;
const MR = 18;
const MT = 18;
const MB = 48;
const TICKS = [0, 0.25, 0.5, 0.75, 1] as const;

const px = (x: number): number => ML + x * (W - ML - MR);
const py = (y: number): number => MT + (1 - y) * (H - MT - MB);

/**
 * Fuzzy-Set-XY-Plot der Hinreichendheit: X (Bedingung) gegen Y (Outcome),
 * beide 0–1. Berechnet Konsistenz Σ min(x,y)/Σ x und Coverage Σ min(x,y)/Σ y.
 */
export function XyPlot({ xLabel, yLabel, points }: XyPlotProps) {
  const [locale] = useLocale();
  let sumMin = 0;
  let sumX = 0;
  let sumY = 0;
  for (const p of points) {
    sumMin += Math.min(p.x, p.y);
    sumX += p.x;
    sumY += p.y;
  }
  const consistency = sumX > 0 ? sumMin / sumX : NaN;
  const coverage = sumY > 0 ? sumMin / sumY : NaN;

  const cx = (ML + (W - MR)) / 2;
  const cy = (MT + (H - MB)) / 2;

  return (
    <div>
      <div style={kpiRowStyle}>
        <Kpi value={fmt(consistency)} label={t(locale, "xyplot.kpi.consistency")} />
        <Kpi value={fmt(coverage)} label={t(locale, "xyplot.kpi.coverage")} />
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={t(locale, "xyplot.aria", { x: xLabel, y: yLabel, n: points.length })}
        style={svgStyle}
      >
        {/* Gitternetz */}
        {TICKS.map((t) => (
          <g key={`g-${t}`}>
            <line x1={ML} x2={W - MR} y1={py(t)} y2={py(t)} stroke="var(--grid)" />
            <line x1={px(t)} x2={px(t)} y1={MT} y2={H - MB} stroke="var(--grid)" />
            <text x={ML - 7} y={py(t) + 3.5} textAnchor="end" fill="var(--muted)" fontSize={10.5}>
              {tick(t)}
            </text>
            <text x={px(t)} y={H - MB + 16} textAnchor="middle" fill="var(--muted)" fontSize={10.5}>
              {tick(t)}
            </text>
          </g>
        ))}

        {/* Diagonale (gestrichelt) */}
        <line
          x1={px(0)}
          y1={py(0)}
          x2={px(1)}
          y2={py(1)}
          stroke="var(--muted)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.75}
        />

        {/* Fälle */}
        {points.map((p, i) => (
          <circle
            key={`${p.label}-${i}`}
            cx={px(p.x)}
            cy={py(p.y)}
            r={5}
            fill="var(--accent)"
            stroke="var(--panel)"
            strokeWidth={2}
          >
            <title>{`${p.label}: X=${fmt(p.x)}, Y=${fmt(p.y)}`}</title>
          </circle>
        ))}

        {/* Achsenbeschriftung */}
        <text x={cx} y={H - 6} textAnchor="middle" fill="var(--ink-2)" fontSize={12}>
          {xLabel} (X)
        </text>
        <text
          x={14}
          y={cy}
          textAnchor="middle"
          fill="var(--ink-2)"
          fontSize={12}
          transform={`rotate(-90 14 ${cy})`}
        >
          {yLabel} (Y)
        </text>
      </svg>
    </div>
  );
}

function Kpi({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiLabelStyle}>{label}</div>
    </div>
  );
}

const kpiRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 26,
  flexWrap: "wrap",
  margin: "0 0 12px",
};
const kpiValueStyle: React.CSSProperties = { fontSize: 21, fontWeight: 650, fontVariantNumeric: "tabular-nums" };
const kpiLabelStyle: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--muted)",
  fontWeight: 600,
};
const svgStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: W,
  height: "auto",
  background: "var(--panel)",
};
