"use client";

import { useLocale } from "@/i18n/locale";
import { t } from "@/i18n/dict";

interface DescriptiveCase {
  label: string;
  values: Record<string, number>;
}

interface DescriptivesProps {
  columns: string[];
  cases: DescriptiveCase[];
}

interface ColumnStat {
  n: number;
  min: number;
  median: number;
  mean: number;
  max: number;
}

const fmt = (v: number): string =>
  Number.isFinite(v) ? v.toFixed(3).replace(".", ",") : "—";

function computeStat(values: number[]): ColumnStat {
  const nums = values.filter((v) => Number.isFinite(v));
  const n = nums.length;
  if (n === 0) return { n: 0, min: NaN, median: NaN, mean: NaN, max: NaN };
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const mean = nums.reduce((sum, v) => sum + v, 0) / n;
  return { n, min: sorted[0], median, mean, max: sorted[n - 1] };
}

/**
 * Deskriptive Statistik-Tabelle: N, Minimum, Median, Mittelwert und Maximum
 * je Variable, überlaufscrollbar und im Tabellenstil der App.
 */
export function Descriptives({ columns, cases }: DescriptivesProps) {
  const [locale] = useLocale();
  const stats = columns.map((col) => ({
    col,
    stat: computeStat(cases.map((c) => c.values[col])),
  }));

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle(false)}>{t(locale, "desc.col.variable")}</th>
            <th style={thStyle(true)}>{t(locale, "desc.col.n")}</th>
            <th style={thStyle(true)}>{t(locale, "desc.col.min")}</th>
            <th style={thStyle(true)}>{t(locale, "desc.col.median")}</th>
            <th style={thStyle(true)}>{t(locale, "desc.col.mean")}</th>
            <th style={thStyle(true)}>{t(locale, "desc.col.max")}</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(({ col, stat }) => (
            <tr key={col}>
              <td style={tdStyle(false)} className="mono">
                {col}
              </td>
              <td style={tdStyle(true)}>{stat.n}</td>
              <td style={tdStyle(true)}>{fmt(stat.min)}</td>
              <td style={tdStyle(true)}>{fmt(stat.median)}</td>
              <td style={tdStyle(true)}>{fmt(stat.mean)}</td>
              <td style={tdStyle(true)}>{fmt(stat.max)}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
