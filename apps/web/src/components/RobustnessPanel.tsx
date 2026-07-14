"use client";

import { useMemo } from "react";
import {
  consistencyThresholdSweep,
  type QcaCase,
  type ConsistencySweepEntry,
} from "@openqca/engine";
import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

interface RobustnessPanelProps {
  cases: QcaCase[];
  conditions: string[];
  outcome: string;
  freqCut: number;
  currentConsCut: number;
}

const fmt = (v: number): string =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(3).replace(".", ",");

/** Entfernt das "fs_"-Präfix und wandelt in Großbuchstaben, wie im Rest der App. */
const cleanExpr = (expr: string): string => expr.replace(/fs_/g, "").toUpperCase();

/** Verbindet die Pfad-Ausdrücke einer Lösung zu einer lesbaren Formel. */
function solutionFormula(entry: ConsistencySweepEntry): string {
  if (entry.expressions.length === 0) return "—";
  return entry.expressions.map(cleanExpr).join(" + ");
}

/** Findet den ersten Sweep-Index, an dem sich die Lösungsformel gegenüber dem vorigen Eintrag ändert. */
function firstChangePoint(entries: ConsistencySweepEntry[]): number | null {
  for (let i = 1; i < entries.length; i++) {
    if (solutionFormula(entries[i]) !== solutionFormula(entries[i - 1])) return i;
  }
  return null;
}

/**
 * Robustheits-Panel: zeigt, wie stabil die sparsame Lösung gegenüber der Wahl
 * des Konsistenz-Cutoffs ist (Sweep über einen Cutoff-Bereich), inklusive
 * einer automatisch erzeugten Interpretation.
 */
export function RobustnessPanel({
  cases,
  conditions,
  outcome,
  freqCut,
  currentConsCut,
}: RobustnessPanelProps) {
  const [locale] = useLocale();
  const { entries, error } = useMemo((): {
    entries: ConsistencySweepEntry[];
    error: string | null;
  } => {
    try {
      const result = consistencyThresholdSweep(cases, conditions, outcome, {
        from: 0.7,
        to: 0.95,
        step: 0.05,
        freqCut,
      });
      return { entries: result, error: null };
    } catch (e) {
      return {
        entries: [],
        error: e instanceof Error ? e.message : t(locale, "rob.sweepFailed"),
      };
    }
  }, [cases, conditions, outcome, freqCut, locale]);

  if (error) {
    return (
      <p style={hintStyle}>{t(locale, "rob.error", { msg: error })}</p>
    );
  }

  if (entries.length === 0) {
    return <p style={hintStyle}>{t(locale, "rob.noResults")}</p>;
  }

  let nearestIndex = 0;
  let nearestDist = Infinity;
  entries.forEach((entry, i) => {
    const dist = Math.abs(entry.cutoff - currentConsCut);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestIndex = i;
    }
  });

  const changeIndex = firstChangePoint(entries);
  const interpretation =
    changeIndex === null
      ? t(locale, "rob.stable")
      : t(locale, "rob.change", {
          cutoff: fmt(entries[changeIndex].cutoff),
          from: solutionFormula(entries[changeIndex - 1]),
          to: solutionFormula(entries[changeIndex]),
        });

  return (
    <div>
      <div style={containerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle(false)}>{t(locale, "rob.col.cutoff")}</th>
              <th style={thStyle(true)}>{t(locale, "rob.col.paths")}</th>
              <th style={thStyle(true)}>{t(locale, "rob.col.solConsistency")}</th>
              <th style={thStyle(true)}>{t(locale, "rob.col.solCoverage")}</th>
              <th style={thStyle(false)}>{t(locale, "rob.col.parsimonious")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr
                key={entry.cutoff}
                style={i === nearestIndex ? { background: "var(--accent-wash)" } : undefined}
              >
                <td style={tdStyle(true)} className="mono">{fmt(entry.cutoff)}</td>
                <td style={tdStyle(true)}>{entry.pathCount}</td>
                <td style={tdStyle(true)}>{fmt(entry.solutionConsistency)}</td>
                <td style={tdStyle(true)}>{fmt(entry.solutionCoverage)}</td>
                <td style={tdStyle(false)} className="mono">{solutionFormula(entry)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={hintStyle}>{interpretation}</p>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid var(--line)",
  borderRadius: 8,
};

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  fontSize: 13,
};

const hintStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--muted)",
  margin: "8px 0 0",
};

function thStyle(num: boolean): React.CSSProperties {
  return {
    textAlign: num ? "right" : "left",
    fontSize: 11,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: "var(--muted)",
    fontWeight: 700,
    padding: "8px 12px",
    borderBottom: "1px solid var(--line)",
    background: "var(--panel-2)",
    whiteSpace: "nowrap",
  };
}

function tdStyle(num: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderBottom: "1px solid var(--line-soft)",
    whiteSpace: "nowrap",
    textAlign: num ? "right" : "left",
    fontVariantNumeric: num ? "tabular-nums" : undefined,
  };
}
