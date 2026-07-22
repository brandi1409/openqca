"use client";

import { useMemo } from "react";
import {
  runCombinedRobustnessGrid,
  type CombinedRobustnessResult,
  type ConsistencySweepEntry,
  type QcaCase,
  type RobustnessScenario,
} from "@openqca/engine";
import { useLocale, type Locale } from "@/i18n/locale";
import { t } from "@/i18n/dict";
import { InfoHint } from "@/components/InfoHint";
import { ChartFrame } from "@/components/ChartFrame";

interface RobustnessPanelProps {
  cases: QcaCase[];
  scenarios: RobustnessScenario[];
  conditions: string[];
  outcome: string;
  freqCut: number;
  currentConsCut: number;
  expectations: Record<string, "present" | "absent" | "either">;
  robustness?: CombinedRobustnessResult | null;
}

const fmt = (v: number): string =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(3).replace(".", ",");

/** Entfernt das "fs_"-Präfix und wandelt in Großbuchstaben, wie im Rest der App. */
const cleanExpr = (expr: string): string => expr.replace(/fs_/g, "").toUpperCase();
function solutionFormula(entry: { expressions: string[] }): string {
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
function displayCaseLabel(label: string): string {
  try {
    const parsed = JSON.parse(label) as unknown;
    return Array.isArray(parsed) && typeof parsed[0] === "string" ? parsed[0] : label;
  } catch {
    return label;
  }
}

/**
 * Robustheits-Panel: verbindet explizite Kalibrierungsalternativen mit einem
 * Raster aus Frequency-, Consistency- und PRI-Cutoffs. Die Basisreihe bleibt
 * als Diagramm sichtbar; die vollständige Kreuztabelle liegt progressiv offen.
 */
export function RobustnessPanel({
  cases,
  scenarios,
  conditions,
  outcome,
  freqCut,
  currentConsCut,
  expectations,
  robustness,
}: RobustnessPanelProps) {
  const [locale] = useLocale();
  const freqCuts = useMemo(
    () => [...new Set([Math.max(1, freqCut - 1), freqCut, freqCut + 1])].sort((a, b) => a - b),
    [freqCut],
  );
  const consCuts = useMemo(
    () =>
      [...new Set([0.7, 0.8, 0.9, 0.95, currentConsCut])]
        .filter((cut) => cut >= 0 && cut <= 1)
        .sort((a, b) => a - b),
    [currentConsCut],
  );
  const priCuts = useMemo(() => [null, 0.5, 0.75] as Array<number | null>, []);
  const computed = useMemo((): {
    result: CombinedRobustnessResult | null;
    error: string | null;
  } => {
    if (robustness !== undefined) return { result: null, error: null };
    const activeScenarios = scenarios.length
      ? scenarios
      : cases.length
        ? [{ id: "base", label: "Basis-Kalibrierung", cases }]
        : [];
    if (!activeScenarios.length || !conditions.length || !outcome) {
      return { result: null, error: null };
    }
    try {
      return {
        result: runCombinedRobustnessGrid({
          scenarios: activeScenarios,
          conditions,
          outcome,
          freqCuts,
          consCuts,
          priCuts,
          baseline: {
            scenarioId: activeScenarios[0].id,
            freqCut,
            consCut: currentConsCut,
            priCut: null,
          },
          expectations,
        }),
        error: null,
      };
    } catch (e) {
      return {
        result: null,
        error: e instanceof Error ? e.message : t(locale, "rob.sweepFailed"),
      };
    }
  }, [
    cases,
    conditions,
    consCuts,
    currentConsCut,
    expectations,
    freqCut,
    freqCuts,
    locale,
    outcome,
    priCuts,
    scenarios,
    robustness,
  ]);
  const result = robustness === undefined ? computed.result : robustness;
  const error = robustness === undefined ? computed.error : null;

  if (error) {
    return <p style={hintStyle}>{t(locale, "rob.error", { msg: error })}</p>;
  }
  if (!result) {
    return <p style={hintStyle}>{t(locale, "rob.noResults")}</p>;
  }

  const baselineScenarioId = result.baseline.scenarioId;
  const chartEntries: ConsistencySweepEntry[] = result.cells
    .filter(
      (cell) =>
        cell.scenarioId === baselineScenarioId &&
        cell.freqCut === freqCut &&
        cell.priCut === null,
    )
    .sort((a, b) => a.consCut - b.consCut)
    .map((cell) => ({
      cutoff: cell.consCut,
      pathCount: cell.solutions.parsimonious.pathCount,
      solutionConsistency: cell.solutions.parsimonious.consistency,
      solutionCoverage: cell.solutions.parsimonious.coverage,
      expressions: cell.solutions.parsimonious.expressions,
    }));
  const entries = chartEntries.length ? chartEntries : result.cells.slice(0, 1).map((cell) => ({
    cutoff: cell.consCut,
    pathCount: cell.solutions.parsimonious.pathCount,
    solutionConsistency: cell.solutions.parsimonious.consistency,
    solutionCoverage: cell.solutions.parsimonious.coverage,
    expressions: cell.solutions.parsimonious.expressions,
  }));
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
  const changedCases = result.caseStability.filter((item) => item.changedCells > 0);

  return (
    <div data-testid="robustness-grid">
      <p style={hintStyle}>{t(locale, "rob.combined.explainer")}</p>
      <p style={{ ...hintStyle, marginTop: 4 }}>
        {t(locale, "rob.combined.scenarios", {
          count: String(scenarios.length || 1),
        })}
      </p>
      <ChartFrame filename="robustheit-sweep">
        <SweepChart
          entries={entries}
          currentConsCut={currentConsCut}
          nearestIndex={nearestIndex}
          locale={locale}
        />
      </ChartFrame>
      <div style={{ ...containerStyle, marginTop: 16 }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle(false)}>
                <span style={thHintStyle}>
                  {t(locale, "rob.col.cutoff")}
                  <InfoHint title={t(locale, "info.robustness.title")} body={t(locale, "info.robustness.body")} />
                </span>
              </th>
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

      <div style={{ ...containerStyle, marginTop: 18 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15.5 }}>{t(locale, "rob.combined.stabilityTitle")}</h3>
        <p style={{ ...hintStyle, marginTop: 0 }}>{t(locale, "rob.combined.stabilityHint")}</p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle(false)}>{t(locale, "rob.combined.solutionType")}</th>
              <th style={thStyle(false)}>{t(locale, "rob.combined.expression")}</th>
              <th style={thStyle(true)}>{t(locale, "rob.combined.cells")}</th>
              <th style={thStyle(true)}>{t(locale, "rob.combined.share")}</th>
            </tr>
          </thead>
          <tbody>
            {result.solutionStability.slice(0, 9).map((item) => (
              <tr key={`${item.type}-${item.expression}`}>
                <td style={tdStyle(false)}>{item.type}</td>
                <td style={tdStyle(false)} className="mono">{item.expression ? cleanExpr(item.expression) : "—"}</td>
                <td style={tdStyle(true)}>{item.cells}/{result.totalCells}</td>
                <td style={tdStyle(true)}>{fmt(item.share)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {changedCases.length > 0 && (
        <div style={{ ...containerStyle, marginTop: 18 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 15.5 }}>{t(locale, "rob.combined.caseTitle")}</h3>
          <p style={{ ...hintStyle, marginTop: 0 }}>{t(locale, "rob.combined.caseHint")}</p>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.55 }}>
            {changedCases.slice(0, 8).map((item) => (
              <li key={item.caseLabel}>
                <strong>{displayCaseLabel(item.caseLabel)}</strong>: {item.changedCells}/{item.observedCells}{" "}
                {t(locale, "rob.combined.caseChanged")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <details style={{ marginTop: 18 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>
          {t(locale, "rob.combined.fullGrid", { count: String(result.totalCells) })}
        </summary>
        <div style={{ ...containerStyle, marginTop: 10, overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle(false)}>{t(locale, "rob.combined.scenario")}</th>
                <th style={thStyle(true)}>n</th>
                <th style={thStyle(true)}>cons.</th>
                <th style={thStyle(true)}>PRI</th>
                <th style={thStyle(false)}>Parsimonious</th>
                <th style={thStyle(true)}>{t(locale, "rob.combined.caseChanges")}</th>
              </tr>
            </thead>
            <tbody>
              {result.cells.map((cell) => (
                <tr key={`${cell.scenarioId}-${cell.freqCut}-${cell.consCut}-${cell.priCut ?? "none"}`}>
                  <td style={tdStyle(false)}>{cell.scenarioLabel}</td>
                  <td style={tdStyle(true)}>{cell.freqCut}</td>
                  <td style={tdStyle(true)}>{fmt(cell.consCut)}</td>
                  <td style={tdStyle(true)}>{cell.priCut === null ? "—" : fmt(cell.priCut)}</td>
                  <td style={tdStyle(false)} className="mono">
                    {cell.solutions.parsimonious.expression
                      ? cleanExpr(cell.solutions.parsimonious.expression)
                      : "—"}
                  </td>
                  <td style={tdStyle(true)}>{cell.caseClassificationChanges.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

// -- Sweep-Diagramm -----------------------------------------------------------

const CW = 620;
const CH = 200;
const CML = 40;
const CMR = 96;
const CMT = 16;
const CMB = 30;
const C_FROM = 0.7;
const C_TO = 0.95;
const YT = [0, 0.25, 0.5, 0.75, 1] as const;

const cScaleX = (cutoff: number): number =>
  CML + ((cutoff - C_FROM) / (C_TO - C_FROM)) * (CW - CML - CMR);
const cScaleY = (v: number): number => CMT + (1 - v) * (CH - CMT - CMB);
const ctick = (v: number): string => v.toFixed(2).replace(".", ",");
const isFin = (v: number): boolean => typeof v === "number" && Number.isFinite(v);

/** Findet alle Sweep-Indizes, an denen sich die Lösungsformel ändert (Streifen). */
function allChangePoints(entries: ConsistencySweepEntry[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < entries.length; i++) {
    if (solutionFormula(entries[i]) !== solutionFormula(entries[i - 1])) out.push(i);
  }
  return out;
}

/**
 * Kompaktes Linien-Diagramm des Cutoff-Sweeps: Lösungs-Konsistenz (durchgezogen)
 * und Lösungs-Coverage (gestrichelt) über dem Cutoff-Bereich, mit direkter
 * Linienbeschriftung, Pfadzahl je Konsistenz-Punkt, aktuellem Cutoff als
 * gepunkteter Vertikale und getönten Streifen an Lösungswechseln.
 */
function SweepChart({
  entries,
  currentConsCut,
  nearestIndex,
  locale,
}: {
  entries: ConsistencySweepEntry[];
  currentConsCut: number;
  nearestIndex: number;
  locale: Locale;
}) {
  const changePoints = allChangePoints(entries);

  const consPts = entries.filter((e) => isFin(e.solutionConsistency));
  const covPts = entries.filter((e) => isFin(e.solutionCoverage));

  const consLine = consPts
    .map((e) => `${cScaleX(e.cutoff)},${cScaleY(e.solutionConsistency)}`)
    .join(" ");
  const covLine = covPts
    .map((e) => `${cScaleX(e.cutoff)},${cScaleY(e.solutionCoverage)}`)
    .join(" ");

  const lastCons = consPts[consPts.length - 1];
  const lastCov = covPts[covPts.length - 1];

  // Direktbeschriftung rechts; bei Überlappung vertikal auseinanderziehen.
  let consLabelY = lastCons ? cScaleY(lastCons.solutionConsistency) : cScaleY(1);
  let covLabelY = lastCov ? cScaleY(lastCov.solutionCoverage) : cScaleY(0);
  if (Math.abs(consLabelY - covLabelY) < 13) {
    if (consLabelY <= covLabelY) {
      consLabelY -= 7;
      covLabelY += 7;
    } else {
      consLabelY += 7;
      covLabelY -= 7;
    }
  }

  const cutClamped = Math.min(C_TO, Math.max(C_FROM, currentConsCut));

  return (
    <svg
      viewBox={`0 0 ${CW} ${CH}`}
      role="img"
      aria-label={t(locale, "rob.chart.aria")}
      style={sweepSvgStyle}
    >
      <defs>
        <pattern
          id="rob-change-hatch"
          patternUnits="userSpaceOnUse"
          width={6}
          height={6}
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={6} stroke="var(--warn-text)" strokeWidth={1} opacity={0.35} />
        </pattern>
      </defs>

      {/* Lösungswechsel-Streifen */}
      {changePoints.map((i) => {
        const x1 = cScaleX(entries[i - 1].cutoff);
        const x2 = cScaleX(entries[i].cutoff);
        return (
          <g key={`band-${i}`}>
            <rect x={x1} y={CMT} width={x2 - x1} height={CH - CMT - CMB} fill="var(--warn-text)" opacity={0.08} />
            <rect x={x1} y={CMT} width={x2 - x1} height={CH - CMT - CMB} fill="url(#rob-change-hatch)" />
          </g>
        );
      })}

      {/* Y-Gitter + Ticks */}
      {YT.map((v) => (
        <g key={`gy-${v}`}>
          <line x1={CML} x2={CW - CMR} y1={cScaleY(v)} y2={cScaleY(v)} stroke="var(--grid)" />
          <text x={CML - 6} y={cScaleY(v) + 3.5} textAnchor="end" fill="var(--muted)" fontSize={10}>
            {ctick(v)}
          </text>
        </g>
      ))}

      {/* X-Ticks (Cutoffs) */}
      {entries.map((e) => (
        <text
          key={`gx-${e.cutoff}`}
          x={cScaleX(e.cutoff)}
          y={CH - CMB + 15}
          textAnchor="middle"
          fill="var(--muted)"
          fontSize={10}
        >
          {ctick(e.cutoff)}
        </text>
      ))}

      {/* Aktueller Cutoff */}
      <line
        x1={cScaleX(cutClamped)}
        x2={cScaleX(cutClamped)}
        y1={CMT}
        y2={CH - CMB}
        stroke="var(--ink-2)"
        strokeWidth={1}
        strokeDasharray="2 3"
        opacity={0.8}
      />
      <text
        x={cScaleX(cutClamped)}
        y={CMT - 4}
        textAnchor="middle"
        fill="var(--ink-2)"
        fontSize={10}
      >
        {t(locale, "rob.chart.currentCutoff", { cutoff: ctick(cutClamped) })}
      </text>

      {/* Coverage-Linie (gestrichelt) */}
      {covLine && (
        <polyline
          points={covLine}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={2}
          strokeDasharray="5 4"
        />
      )}
      {/* Konsistenz-Linie (durchgezogen) */}
      {consLine && (
        <polyline points={consLine} fill="none" stroke="var(--accent)" strokeWidth={2} />
      )}

      {/* Coverage-Punkte */}
      {covPts.map((e) => (
        <circle
          key={`cov-${e.cutoff}`}
          cx={cScaleX(e.cutoff)}
          cy={cScaleY(e.solutionCoverage)}
          r={3}
          fill="var(--brand)"
        />
      ))}

      {/* Konsistenz-Punkte + Pfadzahl */}
      {consPts.map((e) => {
        const isNear = entries[nearestIndex]?.cutoff === e.cutoff;
        return (
          <g key={`cons-${e.cutoff}`}>
            <circle
              cx={cScaleX(e.cutoff)}
              cy={cScaleY(e.solutionConsistency)}
              r={isNear ? 4 : 3}
              fill="var(--accent)"
              stroke={isNear ? "var(--panel)" : "none"}
              strokeWidth={isNear ? 1.5 : 0}
            />
            <text
              x={cScaleX(e.cutoff)}
              y={cScaleY(e.solutionConsistency) - 7}
              textAnchor="middle"
              fill="var(--muted)"
              fontSize={9.5}
            >
              {e.pathCount}
            </text>
          </g>
        );
      })}

      {/* Direkte Linienbeschriftung rechts */}
      <text x={CW - CMR + 6} y={consLabelY + 3.5} textAnchor="start" fill="var(--accent-deep)" fontSize={10.5} fontWeight={600}>
        {t(locale, "rob.chart.consistency")}
      </text>
      <text x={CW - CMR + 6} y={covLabelY + 3.5} textAnchor="start" fill="var(--brand)" fontSize={10.5} fontWeight={600}>
        {t(locale, "rob.chart.coverage")}
      </text>
    </svg>
  );
}

const sweepSvgStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: CW,
  height: "auto",
  background: "var(--panel)",
};

const containerStyle: React.CSSProperties = {
  overflowX: "auto",
  border: "1px solid var(--line)",
  borderRadius: 8,
};

const tableStyle: React.CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  fontSize: 13.5,
};

const hintStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--muted)",
  margin: "8px 0 0",
};

const thHintStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
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
