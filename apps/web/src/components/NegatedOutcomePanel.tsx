"use client";

import { useMemo } from "react";
import {
  buildTruthTable,
  complexSolution,
  parsimoniousSolution,
  type QcaCase,
  type Solution,
} from "@openqca/engine";
import { useLocale, type Locale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

export interface NegatedOutcomePanelProps {
  cases: QcaCase[];
  conditions: string[];
  outcome: string;
  freqCut: number;
  consCut: number;
}

const fmt = (v: number, d = 3) =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(d).replace(".", ",");

const labelStyle: React.CSSProperties = { fontSize: 12.5, color: "var(--muted)" };
const formulaStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  fontSize: 14.5,
  background: "var(--panel-2)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "10px 14px",
  overflowX: "auto",
};

function SolutionBlock({ title, sol, negOutLabel, locale }: { title: string; sol: Solution | null; negOutLabel: string; locale: Locale }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ ...labelStyle, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {title}
      </div>
      {sol === null || sol.models.length === 0 ? (
        <p style={{ ...labelStyle, margin: 0 }}>
          {t(locale, "neg.none", { label: negOutLabel })}
        </p>
      ) : (
        sol.models.map((m, mi) => (
          <div key={mi} style={{ marginBottom: mi < sol.models.length - 1 ? 12 : 0 }}>
            <div style={formulaStyle}>
              {m.paths.map((p) => p.expression.replace(/fs_/g, "").toUpperCase()).join(" + ")} → {negOutLabel}
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
              <span style={labelStyle}>{t(locale, "neg.solConsistency")}: {fmt(m.solutionConsistency)}</span>
              <span style={labelStyle}>{t(locale, "neg.solCoverage")}: {fmt(m.solutionCoverage)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function NegatedOutcomePanel({ cases, conditions, outcome, freqCut, consCut }: NegatedOutcomePanelProps) {
  const [locale] = useLocale();
  const negOutLabel = "~" + outcome.replace(/^fs_/, "").toUpperCase();

  const result = useMemo(() => {
    try {
      const negCases: QcaCase[] = cases.map((c) => ({
        ...c,
        values: { ...c.values, [outcome]: +(1 - c.values[outcome]).toFixed(4) },
      }));
      const tt = buildTruthTable({ cases: negCases, conditions, outcome, freqCut, consCut });
      const complex = complexSolution(tt, negCases);
      const parsimonious = parsimoniousSolution(tt, negCases);
      return { complex, parsimonious, error: null as string | null };
    } catch (e) {
      return {
        complex: null as Solution | null,
        parsimonious: null as Solution | null,
        error: e instanceof Error ? e.message : t(locale, "neg.calcErrorUnknown"),
      };
    }
  }, [cases, conditions, outcome, freqCut, consCut, locale]);

  return (
    <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
      <h2 style={{ fontSize: 16, fontWeight: 650, margin: "0 0 8px" }}>{t(locale, "neg.heading", { label: negOutLabel })}</h2>
      <p style={{ ...labelStyle, margin: "0 0 4px" }}>
        {t(locale, "neg.intro", { label: negOutLabel })}
      </p>
      {result.error ? (
        <p style={{ ...labelStyle, margin: "8px 0 0" }}>{t(locale, "neg.error", { label: negOutLabel, msg: result.error })}</p>
      ) : (
        <>
          <SolutionBlock title={t(locale, "neg.complex")} sol={result.complex} negOutLabel={negOutLabel} locale={locale} />
          <SolutionBlock title={t(locale, "neg.parsimonious")} sol={result.parsimonious} negOutLabel={negOutLabel} locale={locale} />
        </>
      )}
    </div>
  );
}
