"use client";

import { useEffect, useRef } from "react";
import { calibrateDirect, calibrateLinear } from "@openqca/engine";
import { useLocale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";
import { ChartFrame } from "@/components/ChartFrame";

/**
 * Anker-Mapping als eigenständige Bausteine: die interaktive Kalibrierungs-
 * kurve (ziehbare Griffe, Tastatur-`role="slider"`, Rug der Rohwerte) und der
 * Crisp-Streifen. Beide werden an ZWEI Stellen gebraucht — in der ausführlichen
 * `CalibrationWorkbench` (Teilschritt „Zuordnung") und in der kompakten
 * `CalibrationQuick`-Ansicht. Sie leben deshalb hier statt doppelt zu
 * existieren; das Verhalten ist unverändert aus der Workbench übernommen.
 */

export function CrispStrip({
  values,
  threshold,
  highIsMembership,
}: {
  values: number[];
  threshold: number;
  highIsMembership: boolean;
}) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return null;
  const lo = Math.min(...finite, threshold);
  const hi = Math.max(...finite, threshold);
  const pad = (hi - lo) * 0.05 || 1;
  const W = 640;
  const H = 56;
  const x = (v: number) => ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (W - 24) + 12;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, marginTop: 10 }}>
      <line x1={12} x2={W - 12} y1={H / 2} y2={H / 2} stroke="var(--line)" />
      {finite.map((v, i) => (
        <circle
          key={i}
          cx={x(v)}
          cy={H / 2}
          r={4}
          fill={(highIsMembership ? v >= threshold : v <= threshold) ? "var(--accent)" : "var(--muted)"}
        />
      ))}
      <line
        x1={x(threshold)}
        x2={x(threshold)}
        y1={8}
        y2={H - 8}
        stroke="var(--brand)"
        strokeWidth={2}
      />
    </svg>
  );
}

export function CalibrationCurve({
  variable,
  anchors,
  anchorLabelKeys,
  values,
  highIsMembership,
  rows,
  onAnchorChange,
  method,
}: {
  variable: string;
  anchors: [number, number, number];
  anchorLabelKeys: [DictKey, DictKey, DictKey];
  values: number[];
  highIsMembership: boolean;
  rows: { label: string; f: number }[];
  onAnchorChange: (index: number, value: number) => void;
  method: "direct" | "linear";
}) {
  const [locale] = useLocale();
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);
  const pointerX = useRef(0);
  const dragIndex = useRef<number | null>(null);

  const [o, c, i] = anchors;
  const finiteVals = values.filter((v) => Number.isFinite(v));
  const lo = Math.min(...finiteVals, o);
  const hi = Math.max(...finiteVals, i);
  const pad = (hi - lo) * 0.07 || 1;
  const W = 640,
    H = 280,
    ML = 44,
    MR = 16,
    MT = 12,
    MB = 40;
  const domainLo = lo - pad;
  const domainHi = hi + pad;
  const px = (val: number) => ML + ((val - domainLo) / (domainHi - domainLo)) * (W - ML - MR);
  const py = (val: number) => MT + (1 - val) * (H - MT - MB);
  const invX = (xInSvg: number) =>
    domainLo + ((xInSvg - ML) / (W - ML - MR)) * (domainHi - domainLo);

  const span = hi - lo;
  const step = span >= 100 ? 1 : 0.01;
  const roundVal = (val: number) => (step >= 1 ? Math.round(val) : Math.round(val * 100) / 100);

  const commit = (index: number, rawVal: number) => {
    const r = roundVal(rawVal);
    let clamped: number;
    if (index === 0) clamped = Math.min(r, roundVal(c - step));
    else if (index === 2) clamped = Math.max(r, roundVal(c + step));
    else clamped = Math.min(Math.max(r, roundVal(o + step)), roundVal(i - step));
    onAnchorChange(index, clamped);
  };

  const clientToValue = (clientX: number): number => {
    const svg = svgRef.current;
    if (!svg) return domainLo;
    const rect = svg.getBoundingClientRect();
    const xInSvg = rect.width ? ((clientX - rect.left) / rect.width) * W : ML;
    return invX(xInSvg);
  };

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  let curve = "";
  for (let s = 0; s <= 140; s++) {
    const x = domainLo + (s / 140) * (domainHi - domainLo);
    const mapped = method === "linear" ? calibrateLinear(x, o, c, i) : calibrateDirect(x, o, c, i);
    curve +=
      (s ? "L" : "M") +
      px(x).toFixed(1) +
      "," +
      py(highIsMembership ? mapped : 1 - mapped).toFixed(1);
  }

  const anchorMeta = [
    { value: o, name: t(locale, anchorLabelKeys[0]) },
    { value: c, name: t(locale, anchorLabelKeys[1]) },
    { value: i, name: t(locale, anchorLabelKeys[2]) },
  ];

  return (
    <ChartFrame filename={`kalibrierung-${variable}`} caption={t(locale, "calib.rug.desc")}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        style={{ width: "100%", maxWidth: W, height: "auto", background: "var(--panel)" }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((val) => (
          <g key={val}>
            <line x1={ML} x2={W - MR} y1={py(val)} y2={py(val)} stroke="var(--grid)" />
            <text x={ML - 6} y={py(val) + 3.5} textAnchor="end" fill="var(--muted)" fontSize={10.5}>
              {val.toFixed(2).replace(".", ",")}
            </text>
          </g>
        ))}
        {finiteVals.map((val, idx) => (
          <line
            key={`rug-${idx}`}
            x1={px(val)}
            x2={px(val)}
            y1={H - MB}
            y2={H - MB - 8}
            stroke="var(--muted)"
            strokeWidth={1.5}
            opacity={0.8}
          />
        ))}
        {anchorMeta.map(({ value }, idx) => (
          <g key={`anchor-line-${idx}`}>
            <line
              x1={px(value)}
              x2={px(value)}
              y1={MT}
              y2={H - MB}
              stroke="var(--accent)"
              strokeWidth={1}
              strokeDasharray="3 4"
              opacity={0.8}
            />
            <text
              x={px(value)}
              y={H - MB + 15}
              textAnchor="middle"
              fill="var(--accent-deep)"
              fontSize={10.5}
              fontWeight={600}
            >
              {String(value).replace(".", ",")}
            </text>
          </g>
        ))}
        <path d={curve} fill="none" stroke="var(--accent)" strokeWidth={2.25} />
        {rows.map((r, idx) => {
          const flag = r.f > 0.4 && r.f < 0.6;
          const xv = values[idx];
          if (!Number.isFinite(xv)) return null;
          return (
            <circle
              key={idx}
              cx={px(xv)}
              cy={py(r.f)}
              r={5}
              fill={flag ? "var(--warn-text)" : "var(--accent)"}
              stroke="var(--panel)"
              strokeWidth={2}
            >
              <title>{`${r.label}: ${xv} → ${r.f.toFixed(3)}`}</title>
            </circle>
          );
        })}
        {anchorMeta.map(({ value, name }, idx) => {
          const cx = px(value);
          return (
            <g key={`handle-${idx}`}>
              <rect
                x={cx - 12}
                y={MT}
                width={24}
                height={H - MB - MT}
                fill="transparent"
                style={{ cursor: "ew-resize", touchAction: "none" }}
                tabIndex={0}
                role="slider"
                aria-label={t(locale, "calib.handle.aria", {
                  name,
                  value: String(value).replace(".", ","),
                })}
                aria-valuemin={roundVal(domainLo)}
                aria-valuemax={roundVal(domainHi)}
                aria-valuenow={value}
                onPointerDown={(e) => {
                  (e.currentTarget as Element).setPointerCapture(e.pointerId);
                  dragIndex.current = idx;
                  e.preventDefault();
                }}
                onPointerMove={(e) => {
                  if (dragIndex.current !== idx) return;
                  pointerX.current = e.clientX;
                  if (rafRef.current == null) {
                    rafRef.current = requestAnimationFrame(() => {
                      rafRef.current = null;
                      if (dragIndex.current != null)
                        commit(dragIndex.current, clientToValue(pointerX.current));
                    });
                  }
                }}
                onPointerUp={(e) => {
                  dragIndex.current = null;
                  (e.currentTarget as Element).releasePointerCapture(e.pointerId);
                }}
                onKeyDown={(e) => {
                  let dir = 0;
                  if (e.key === "ArrowLeft" || e.key === "ArrowDown") dir = -1;
                  else if (e.key === "ArrowRight" || e.key === "ArrowUp") dir = 1;
                  else return;
                  e.preventDefault();
                  commit(idx, value + dir * step * (e.shiftKey ? 10 : 1));
                }}
              />
              <circle
                cx={cx}
                cy={H - MB}
                r={7}
                fill="var(--accent)"
                stroke="var(--panel)"
                strokeWidth={2}
                style={{ pointerEvents: "none" }}
              />
            </g>
          );
        })}
        <text x={(ML + W - MR) / 2} y={H - 2} textAnchor="middle" fill="var(--muted)" fontSize={11}>
          {t(locale, "calib.curve.axis", { variable })}
        </text>
      </svg>
    </ChartFrame>
  );
}
