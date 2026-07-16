"use client";

import { useRef } from "react";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

interface ChartFrameProps {
  children: React.ReactNode;
  filename: string;
  caption?: string;
}

/**
 * Feste LICHT-Palette für den Export (Werte aus globals.css, Light-Theme).
 * Publikationsgrafiken werden immer hell exportiert — unabhängig vom aktiven
 * Theme der App, damit Text/Achsen auf dem weißen PNG-Hintergrund lesbar sind.
 */
const LIGHT_VARS: Record<string, string> = {
  "--bg": "#f6f8f7",
  "--panel": "#ffffff",
  "--panel-2": "#fbfcfb",
  "--ink": "#17211e",
  "--ink-2": "#505c58",
  "--muted": "#86918c",
  "--line": "#e2e7e4",
  "--line-soft": "#edf1ef",
  "--accent": "#2a78d6",
  "--accent-deep": "#1c5cab",
  "--accent-wash": "rgba(42,120,214,0.09)",
  "--brand": "#0f5c54",
  "--brand-wash": "rgba(15,92,84,0.08)",
  "--good": "#0ca30c",
  "--good-text": "#006300",
  "--warn-text": "#935600",
  "--warn-wash": "rgba(224,150,0,0.12)",
  "--bad": "#d03b3b",
  "--bad-wash": "rgba(208,59,59,0.09)",
  "--grid": "#e1e5e2",
};

/** Ersetzt alle var(--x[, fallback])-Vorkommen durch die Light-Hexwerte. */
function resolveCssVarsToLight(value: string): string {
  return value.replace(
    /var\((--[a-z0-9-]+)\s*(?:,\s*([^)]+))?\)/gi,
    (_m, name: string, fallback: string | undefined) => LIGHT_VARS[name] ?? fallback ?? "#000000",
  );
}

/**
 * Rahmen für publikationsfähige SVG-Grafiken: rendert die Grafik und bietet
 * oben rechts zwei kleine Export-Buttons (SVG und PNG). Beim Export werden die
 * CSS-Variablen (fill/stroke/color) über getComputedStyle zu absoluten Werten
 * aufgelöst, damit die exportierte Datei ohne die App-Stylesheets korrekt
 * aussieht. PNG wird mit 3× Skalierung und weißem Hintergrund gerendert.
 */
export function ChartFrame({ children, filename, caption }: ChartFrameProps) {
  const [locale] = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Baut ein exportfähiges, eigenständiges SVG: klont das erste <svg> im
   * Container, löst CSS-Variablen zu absoluten Werten auf, setzt width/height
   * aus der viewBox und stellt den xmlns-Namensraum sicher.
   */
  function buildExportSvg(): { clone: SVGSVGElement; width: number; height: number } | null {
    const container = containerRef.current;
    if (!container) return null;
    const original = container.querySelector("svg");
    if (!original) return null;

    const clone = original.cloneNode(true) as SVGSVGElement;

    // CSS-Variablen deterministisch mit der LICHT-Palette auflösen — unabhängig
    // vom aktiven Theme. Vorher wurde per getComputedStyle das AKTUELLE Theme
    // eingefroren: Im Dark Mode ergab das helle Schrift auf dem weißen
    // PNG-Hintergrund (unlesbar). Publikationsgrafiken sind hell.
    const cloneNodes = [clone, ...Array.from(clone.querySelectorAll("*"))];
    for (const node of cloneNodes) {
      if (!(node instanceof Element)) continue;
      for (const attr of ["fill", "stroke", "stop-color", "color", "style"]) {
        const value = node.getAttribute(attr);
        if (value && value.includes("var(")) {
          node.setAttribute(attr, resolveCssVarsToLight(value));
        }
      }
    }

    // width/height aus viewBox setzen.
    let width = 0;
    let height = 0;
    const vb = original.getAttribute("viewBox");
    if (vb) {
      const parts = vb.split(/[\s,]+/).map(Number);
      if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
        width = parts[2];
        height = parts[3];
      }
    }
    if (!width || !height) {
      const rect = original.getBoundingClientRect();
      width = rect.width || 480;
      height = rect.height || 480;
    }
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    return { clone, width, height };
  }

  function triggerDownload(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function exportSvg() {
    try {
      const built = buildExportSvg();
      if (!built) return;
      const source = new XMLSerializer().serializeToString(built.clone);
      const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', source], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${filename}.svg`);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      // Export defensiv: bei Fehlern still bleiben.
    }
  }

  function exportPng() {
    try {
      const built = buildExportSvg();
      if (!built) return;
      const { clone, width, height } = built;
      const scale = 3;
      const source = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(width * scale);
          canvas.height = Math.round(height * scale);
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            URL.revokeObjectURL(url);
            return;
          }
          // Weißer Hintergrund für Publikationen.
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const pngUrl = URL.createObjectURL(blob);
              triggerDownload(pngUrl, `${filename}.png`);
              setTimeout(() => URL.revokeObjectURL(pngUrl), 4000);
            }
            URL.revokeObjectURL(url);
          }, "image/png");
        } catch {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    } catch {
      // Export defensiv: bei Fehlern still bleiben.
    }
  }

  return (
    <div style={frameStyle}>
      <div style={toolbarStyle}>
        <button
          type="button"
          onClick={exportSvg}
          style={exportButtonStyle}
          aria-label={t(locale, "chart.exportAria", { fmt: t(locale, "chart.exportSvg") })}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--accent-deep)";
            e.currentTarget.style.borderColor = "var(--accent-deep)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.borderColor = "var(--line)";
          }}
        >
          {t(locale, "chart.exportSvg")}
        </button>
        <button
          type="button"
          onClick={exportPng}
          style={exportButtonStyle}
          aria-label={t(locale, "chart.exportAria", { fmt: t(locale, "chart.exportPng") })}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--accent-deep)";
            e.currentTarget.style.borderColor = "var(--accent-deep)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--muted)";
            e.currentTarget.style.borderColor = "var(--line)";
          }}
        >
          {t(locale, "chart.exportPng")}
        </button>
      </div>
      <div ref={containerRef}>{children}</div>
      {caption && <div style={captionStyle}>{caption}</div>}
    </div>
  );
}

const frameStyle: React.CSSProperties = {
  position: "relative",
};

const toolbarStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
  display: "flex",
  gap: 6,
  zIndex: 2,
};

const exportButtonStyle: React.CSSProperties = {
  fontSize: 11.5,
  color: "var(--muted)",
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: 6,
  padding: "2px 8px",
  cursor: "pointer",
  lineHeight: 1.4,
  font: "inherit",
  fontWeight: 600,
};

const captionStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--muted)",
  marginTop: 6,
  lineHeight: 1.5,
};
