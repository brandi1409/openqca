"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";
import { ChartFrame } from "@/components/ChartFrame";

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

type LabelMode = "off" | "notable" | "all";

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

/** Ist der Fall inkonsistent (unterhalb der Diagonale, X > Y)? */
const isBelow = (p: XyPoint): boolean => p.x > p.y;

/**
 * Wählt die „auffälligen“ Fälle: alle unterhalb der Diagonale (X > Y, sie
 * widersprechen der Suffizienz) plus die zwei Fälle oberhalb mit dem größten
 * Abstand |X − Y|.
 */
function notableIndices(points: XyPoint[]): Set<number> {
  const set = new Set<number>();
  const above: { i: number; d: number }[] = [];
  points.forEach((p, i) => {
    if (isBelow(p)) {
      set.add(i);
    } else {
      above.push({ i, d: Math.abs(p.x - p.y) });
    }
  });
  above.sort((a, b) => b.d - a.d);
  for (const a of above.slice(0, 2)) set.add(a.i);
  return set;
}

interface PlacedLabel {
  i: number;
  text: string;
  anchorX: number;
  anchorY: number;
  textAnchor: "start" | "end";
}

/**
 * Platziert die Labels mit einfacher Kollisionsvermeidung: nach Bildschirm-y
 * sortieren und bei zu geringem Abstand (< 12px) zwischen Labels mit ähnlichem
 * x (< 60px) das spätere Label vertikal nach unten versetzen. Der Textanker
 * liegt je nach Plot-Hälfte links oder rechts vom Punkt.
 */
function placeLabels(points: XyPoint[], shown: number[]): PlacedLabel[] {
  const items = shown.map((i) => {
    const p = points[i];
    const cxPx = px(p.x);
    const rightHalf = p.x >= 0.5;
    return {
      i,
      text: p.label,
      pointX: cxPx,
      anchorX: rightHalf ? cxPx - 9 : cxPx + 9,
      anchorY: py(p.y) + 3.5,
      textAnchor: (rightHalf ? "end" : "start") as "start" | "end",
    };
  });
  items.sort((a, b) => a.anchorY - b.anchorY);
  for (let k = 1; k < items.length; k++) {
    const cur = items[k];
    const prev = items[k - 1];
    if (
      cur.anchorY - prev.anchorY < 12 &&
      Math.abs(cur.pointX - prev.pointX) < 60
    ) {
      cur.anchorY = prev.anchorY + 12;
    }
  }
  return items.map(({ i, text, anchorX, anchorY, textAnchor }) => ({
    i,
    text,
    anchorX,
    anchorY,
    textAnchor,
  }));
}

/**
 * Fuzzy-Set-XY-Plot der Hinreichendheit: X (Bedingung) gegen Y (Outcome),
 * beide 0–1. Berechnet Konsistenz Σ min(x,y)/Σ x und Coverage Σ min(x,y)/Σ y.
 * Bietet umschaltbare Fall-Labels (Aus / Auffällige / Alle) und dauerhaft per
 * Klick fixierbare Einzel-Labels.
 */
export function XyPlot({ xLabel, yLabel, points }: XyPlotProps) {
  const [locale] = useLocale();
  const [mode, setMode] = useState<LabelMode>("notable");
  const [pinned, setPinned] = useState<Set<number>>(() => new Set());

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

  const notable = useMemo(() => notableIndices(points), [points]);

  const shownIndices = useMemo(() => {
    const set = new Set<number>(pinned);
    if (mode === "all") {
      points.forEach((_, i) => set.add(i));
    } else if (mode === "notable") {
      notable.forEach((i) => set.add(i));
    }
    return [...set];
  }, [mode, pinned, notable, points]);

  const labels = useMemo(
    () => placeLabels(points, shownIndices),
    [points, shownIndices],
  );

  const togglePinned = (i: number) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const modes: { id: LabelMode; label: string }[] = [
    { id: "off", label: t(locale, "xy.labels.off") },
    { id: "notable", label: t(locale, "xy.labels.notable") },
    { id: "all", label: t(locale, "xy.labels.all") },
  ];

  return (
    <div>
      <div style={kpiRowStyle}>
        <Kpi value={fmt(consistency)} label={t(locale, "xyplot.kpi.consistency")} />
        <Kpi value={fmt(coverage)} label={t(locale, "xyplot.kpi.coverage")} />
      </div>

      <div style={toggleRowStyle}>
        <span style={toggleLabelStyle}>{t(locale, "xy.labelsToggle")}</span>
        <div
          role="group"
          aria-label={t(locale, "xy.labelsToggle")}
          style={segmentGroupStyle}
        >
          {modes.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={active}
                style={segmentButtonStyle(active)}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <ChartFrame filename={`xy-${xLabel}-${yLabel}`}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t(locale, "xyplot.aria", { x: xLabel, y: yLabel, n: points.length })}
          style={svgStyle}
        >
          {/* Konsistente Zone (oberhalb der Diagonale, Y ≥ X) dezent füllen */}
          <polygon
            points={`${px(0)},${py(0)} ${px(0)},${py(1)} ${px(1)},${py(1)}`}
            fill="var(--accent)"
            opacity={0.04}
          />

          {/* Gitternetz */}
          {TICKS.map((tk) => (
            <g key={`g-${tk}`}>
              <line x1={ML} x2={W - MR} y1={py(tk)} y2={py(tk)} stroke="var(--grid)" />
              <line x1={px(tk)} x2={px(tk)} y1={MT} y2={H - MB} stroke="var(--grid)" />
              <text x={ML - 7} y={py(tk) + 3.5} textAnchor="end" fill="var(--muted)" fontSize={11}>
                {tick(tk)}
              </text>
              <text x={px(tk)} y={H - MB + 16} textAnchor="middle" fill="var(--muted)" fontSize={11}>
                {tick(tk)}
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

          {/* Diagonalen-Beschriftung, entlang der Linie rotiert */}
          <text
            x={px(0.9)}
            y={py(0.9) - 5}
            textAnchor="middle"
            fill="var(--muted)"
            fontSize={10}
            transform={`rotate(-45 ${px(0.9)} ${py(0.9) - 5})`}
          >
            {t(locale, "xy.diagonalLabel")}
          </text>

          {/* Zonen-Beschriftung in der oberen linken Ecke */}
          <text x={ML + 6} y={MT + 13} textAnchor="start" fill="var(--accent-deep)" fontSize={10}>
            {t(locale, "xy.consistentZone")}
          </text>

          {/* Fälle */}
          {points.map((p, i) => {
            const below = isBelow(p);
            return (
              <circle
                key={`${p.label}-${i}`}
                cx={px(p.x)}
                cy={py(p.y)}
                r={5}
                fill={below ? "var(--bad)" : "var(--accent)"}
                stroke="var(--panel)"
                strokeWidth={2}
                role="button"
                tabIndex={0}
                aria-label={p.label}
                aria-pressed={pinned.has(i)}
                style={{ cursor: "pointer", outline: "none" }}
                onClick={() => togglePinned(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    togglePinned(i);
                  }
                }}
              >
                <title>{`${p.label}: X=${fmt(p.x)}, Y=${fmt(p.y)}`}</title>
              </circle>
            );
          })}

          {/* Fall-Labels */}
          {labels.map((l) => (
            <text
              key={`lbl-${l.i}`}
              x={l.anchorX}
              y={l.anchorY}
              textAnchor={l.textAnchor}
              fill="var(--ink-2)"
              fontSize={10}
              style={{ pointerEvents: "none" }}
            >
              {l.text}
            </text>
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
      </ChartFrame>

      <div style={legendRowStyle}>
        <span style={legendItemStyle}>
          <span style={legendDotStyle("var(--accent)")} />
          {t(locale, "xy.legend.consistent")}
        </span>
        <span style={legendItemStyle}>
          <span style={legendDotStyle("var(--bad)")} />
          {t(locale, "xy.legend.inconsistent")}
        </span>
      </div>
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

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  margin: "0 0 10px",
};
const toggleLabelStyle: React.CSSProperties = {
  fontSize: 11.5,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--muted)",
  fontWeight: 600,
};
const segmentGroupStyle: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid var(--line)",
  borderRadius: 8,
  overflow: "hidden",
};
function segmentButtonStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 11px",
    border: "none",
    borderLeft: "1px solid var(--line)",
    cursor: "pointer",
    background: active ? "var(--accent-wash)" : "var(--panel)",
    color: active ? "var(--accent-deep)" : "var(--muted)",
    font: "inherit",
  };
}

const legendRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
  margin: "8px 0 0",
};
const legendItemStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  color: "var(--ink-2)",
};
function legendDotStyle(color: string): React.CSSProperties {
  return {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: color,
    display: "inline-block",
    flex: "none",
  };
}
