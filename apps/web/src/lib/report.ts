/**
 * Reiner Report-Baustein (kein React): erzeugt aus den Ergebnissen einer
 * Analyse ein vollständiges, in sich geschlossenes HTML-Dokument, das sich
 * direkt drucken oder als PDF sichern lässt.
 */

import type { NecessityEntry, Solution, TruthTableResult, TruthTableRow } from "@openqca/engine";

export interface ReportInput {
  datasetName: string;
  caseCount: number;
  anchors: Record<string, [number, number, number]>;
  conditions: string[];
  outcome: string;
  freqCut: number;
  consCut: number;
  tt: TruthTableResult;
  complex: Solution;
  intermediate: Solution;
  parsimonious: Solution;
  necessity: NecessityEntry[];
  expectations: Record<string, string>;
  rScript: string;
}

/** HTML-Escaping für alle dynamischen Strings (Namen, Fälle, Ausdrücke). */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Zahl mit 3 Nachkommastellen und Dezimal-Komma; NaN/undefined als „—". */
function fmt(v: number, d = 3): string {
  return v == null || Number.isNaN(v) ? "—" : v.toFixed(d).replace(".", ",");
}

/** „fs_"-Präfixe entfernen und groß schreiben, wie in der App-Anzeige. */
function label(s: string): string {
  return s.replace(/fs_/g, "").toUpperCase();
}

function formatDateAT(d: Date): string {
  return new Intl.DateTimeFormat("de-AT", { dateStyle: "long", timeStyle: "short" }).format(d);
}

function outSymbol(out: 0 | 1 | "?"): string {
  return out === "?" ? "?" : String(out);
}

function observedRows(tt: TruthTableResult): TruthTableRow[] {
  return tt.rows
    .filter((r) => r.n > 0)
    .sort((x, y) => Number(y.output === 1) - Number(x.output === 1) || y.consistency - x.consistency);
}

function calibrationTable(anchors: Record<string, [number, number, number]>): string {
  const rows = Object.entries(anchors)
    .map(
      ([v, a]) =>
        `<tr><td>${esc(label(v))}</td><td>${fmt(a[0])}</td><td>${fmt(a[1])}</td><td>${fmt(a[2])}</td></tr>`,
    )
    .join("");
  return `
    <table>
      <thead>
        <tr><th>Variable</th><th>voll draußen (0,05)</th><th>Kreuzung (0,50)</th><th>voll drinnen (0,95)</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function truthTableSection(tt: TruthTableResult): string {
  const observed = observedRows(tt);
  const remainderCount = tt.rows.length - observed.length;
  const conditionHeaders = tt.conditions.map((c) => `<th>${esc(label(c))}</th>`).join("");
  const bodyRows = observed
    .map((r) => {
      const bits = [...r.bits].map((b) => `<td class="mono num">${b}</td>`).join("");
      return `<tr>${bits}<td class="num">${r.n}</td><td class="num">${fmt(r.consistency)}</td><td class="num">${fmt(r.pri)}</td><td class="num">${outSymbol(r.output)}</td><td>${esc(r.cases.join(", "))}</td></tr>`;
    })
    .join("");
  const remainderRow = `<tr><td colspan="${tt.conditions.length + 5}" class="remainder">${remainderCount} Remainder (unbeobachtet)</td></tr>`;
  return `
    <table>
      <thead>
        <tr>${conditionHeaders}<th>n</th><th>Konsistenz</th><th>PRI</th><th>OUT</th><th>Fälle</th></tr>
      </thead>
      <tbody>${bodyRows}${remainderRow}</tbody>
    </table>`;
}

function solutionBlock(title: string, sol: Solution, outLabel: string, expectations?: Record<string, string>): string {
  if (sol.models.length === 0) {
    return `<h3>${esc(title)}</h3><p class="hint">Keine Konfiguration erfüllt die Cutoffs — keine Lösung.</p>`;
  }
  const models = sol.models
    .map((m) => {
      const formula = m.paths.map((p) => label(p.expression)).join(" + ");
      const pathRows = m.paths
        .map(
          (p) =>
            `<tr><td class="mono">${esc(label(p.expression))}</td><td class="num">${fmt(p.rawCoverage)}</td><td class="num">${fmt(p.uniqueCoverage)}</td><td class="num">${fmt(p.consistency)}</td></tr>`,
        )
        .join("");
      return `
        <div class="formula mono">${esc(formula)} → ${esc(outLabel)}</div>
        <p class="kpis">Lösungs-Konsistenz: <strong>${fmt(m.solutionConsistency)}</strong> &nbsp;·&nbsp; Lösungs-Coverage: <strong>${fmt(m.solutionCoverage)}</strong></p>
        <table>
          <thead><tr><th>Pfad</th><th>Raw Cov.</th><th>Unique Cov.</th><th>Konsistenz</th></tr></thead>
          <tbody>${pathRows}</tbody>
        </table>`;
    })
    .join("<hr class=\"soft\"/>");
  const expectationsLine = expectations
    ? `<p class="hint">Richtungserwartungen: ${Object.entries(expectations)
        .map(([c, v]) => `${esc(label(c))} = ${esc(v)}`)
        .join(", ")}</p>`
    : "";
  return `<h3>${esc(title)}</h3>${models}${expectationsLine}`;
}

function necessityTable(entries: NecessityEntry[]): string {
  const rows = entries
    .map(
      (n) =>
        `<tr><td class="mono">${esc(label(n.condition))}</td><td class="num">${fmt(n.consistency)}</td><td class="num">${fmt(n.coverage)}</td><td class="num">${n.isCandidate ? "ja" : "—"}</td></tr>`,
    )
    .join("");
  return `
    <table>
      <thead><tr><th>Bedingung</th><th>Konsistenz</th><th>Coverage</th><th>Kandidat (≥0,9)</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

const STYLE = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111;
    background: #fff;
    margin: 0;
    padding: 32px 40px 60px;
    line-height: 1.5;
  }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 30px 0 10px; padding-top: 14px; border-top: 1px solid #ccc; }
  h3 { font-size: 14px; margin: 18px 0 8px; }
  p { margin: 6px 0; }
  .subtitle { color: #444; font-size: 13px; margin: 0 0 2px; }
  .note { color: #666; font-size: 12px; margin-top: 10px; }
  .hint { color: #555; font-size: 12.5px; }
  table {
    border-collapse: collapse;
    width: 100%;
    font-size: 12.5px;
    margin: 8px 0 4px;
  }
  th, td {
    border: 1px solid #bbb;
    padding: 5px 8px;
    text-align: left;
  }
  th { background: #f2f2f2; font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .mono { font-family: "SFMono-Regular", Menlo, Consolas, monospace; }
  .remainder { text-align: center; color: #666; font-style: italic; background: #fafafa; }
  .formula {
    font-size: 14px;
    background: #f7f7f7;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 6px 0;
  }
  .kpis { font-size: 12.5px; }
  hr.soft { border: none; border-top: 1px dashed #ccc; margin: 14px 0; }
  pre {
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 11.5px;
    background: #f7f7f7;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 10px 12px;
    white-space: pre-wrap;
    word-break: break-word;
  }
  footer { margin-top: 34px; padding-top: 12px; border-top: 1px solid #ccc; color: #666; font-size: 11.5px; }
  @media print {
    body { padding: 0 18px; }
    table, .formula, pre { page-break-inside: avoid; }
    h2 { page-break-after: avoid; }
  }
`;

export function generateReportHtml(input: ReportInput): string {
  const outLabel = label(input.outcome);
  const created = formatDateAT(new Date());

  const complexHtml = solutionBlock("Komplexe (konservative) Lösung", input.complex, outLabel);
  const intermediateHtml = solutionBlock("Intermediäre Lösung", input.intermediate, outLabel, input.expectations);
  const parsimoniousHtml = solutionBlock("Sparsame (parsimonious) Lösung", input.parsimonious, outLabel);

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>openQCA — Analysebericht: ${esc(label(input.datasetName))}</title>
<style>${STYLE}</style>
</head>
<body>
  <h1>openQCA — Analysebericht</h1>
  <p class="subtitle">Datensatz: <strong>${esc(input.datasetName)}</strong> &nbsp;·&nbsp; Fälle: <strong>${input.caseCount}</strong> &nbsp;·&nbsp; Erstellt: ${esc(created)}</p>
  <p class="note">Erstellt mit openQCA (openqca.vercel.app), Open Source (MIT).</p>

  <h2>Kalibrierung</h2>
  ${calibrationTable(input.anchors)}

  <h2>Truth Table</h2>
  <p class="hint">Bedingungen: ${esc(input.conditions.map(label).join(", "))} &nbsp;·&nbsp; Outcome: ${esc(outLabel)} &nbsp;·&nbsp; Frequenz-Cutoff: ${input.freqCut} &nbsp;·&nbsp; Konsistenz-Cutoff: ${fmt(input.consCut)}</p>
  ${truthTableSection(input.tt)}

  <h2>Lösungen</h2>
  ${complexHtml}
  ${intermediateHtml}
  ${parsimoniousHtml}

  <h2>Notwendige Bedingungen</h2>
  ${necessityTable(input.necessity)}
  <p class="hint">Konvention: Konsistenz ≥ 0,9 als Hinweis auf Notwendigkeit — mit Coverage und Fallkenntnis interpretieren.</p>

  <h2>Reproduzierbarkeit</h2>
  <pre>${esc(input.rScript)}</pre>

  <footer>
    Dieser Bericht dokumentiert Rechenschritte und Parameter einer fsQCA-Analyse. Die inhaltliche
    Interpretation der Ergebnisse — insbesondere Kausalitätsannahmen, Fallauswahl und theoretische
    Einordnung — liegt in der wissenschaftlichen Verantwortung der Nutzerin bzw. des Nutzers.
  </footer>
</body>
</html>`;
}
