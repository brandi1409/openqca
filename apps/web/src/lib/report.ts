/**
 * Reiner Report-Baustein (kein React): erzeugt aus den Ergebnissen einer
 * Analyse ein vollständiges, in sich geschlossenes HTML-Dokument, das sich
 * direkt drucken oder als PDF sichern lässt.
 */

import type { NecessityEntry, Solution, TruthTableResult, TruthTableRow } from "@openqca/engine";
import type { CalibSpecs } from "@/lib/calibration-model";

export interface ReportInput {
  datasetName: string;
  caseCount: number;
  anchors: Record<string, [number, number, number]>;
  calibSpecs?: CalibSpecs;
  varMeta?: Record<string, { type: string; role: string }>;
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
  locale?: "de" | "en";
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

function formatDateAT(d: Date, locale: "de" | "en"): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-AT", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}

const REPORT_COPY = {
  de: {
    fullOut: "voll draußen (0,05)",
    crossover: "Kreuzung (0,50)",
    fullIn: "voll drinnen (0,95)",
    variable: "Variable",
    status: "Status",
    method: "Methode",
    direction: "Richtung",
    highIn: "hoch→drinnen",
    inverted: "invertiert",
    meanings: "Bedeutungen",
    out: "draußen",
    cross: "Kreuzung",
    in: "drinnen",
    linearMeanings: "Lineare Ankerbedeutungen",
    inclusionMeaning: "Bedeutung der Inklusion",
    provenance: "Herkunft",
    already: "bereits",
    crisp: "crisp",
    linear: "linear",
    direct: "direct",
    remainder: "Remainder (unbeobachtet)",
    n: "n",
    consistency: "Konsistenz",
    pri: "PRI",
    outHeader: "OUT",
    cases: "Fälle",
    noSolution: "Keine Konfiguration erfüllt die Cutoffs — keine Lösung.",
    solutionConsistency: "Lösungs-Konsistenz",
    solutionCoverage: "Lösungs-Coverage",
    path: "Pfad",
    rawCoverage: "Raw Cov.",
    uniqueCoverage: "Unique Cov.",
    directionalExpectations: "Richtungserwartungen",
    condition: "Bedingung",
    candidate: "Kandidat (≥0,9)",
    analysisTitle: "Analysebericht",
    dataset: "Datensatz",
    created: "Erstellt",
    createdWith: "Erstellt mit openQCA (openqca.vercel.app), Open Source (MIT).",
    calibration: "Kalibrierung",
    truthTable: "Truth Table",
    conditions: "Bedingungen",
    outcome: "Outcome",
    frequencyCutoff: "Frequenz-Cutoff",
    consistencyCutoff: "Konsistenz-Cutoff",
    solutions: "Lösungen",
    necessity: "Notwendige Bedingungen",
    necessityHint: "Konvention: Konsistenz ≥ 0,9 als Hinweis auf Notwendigkeit — mit Coverage und Fallkenntnis interpretieren.",
    reproducibility: "Reproduzierbarkeit",
    footer: "Dieser Bericht dokumentiert Rechenschritte und Parameter einer fsQCA-Analyse. Die inhaltliche Interpretation der Ergebnisse — insbesondere Kausalitätsannahmen, Fallauswahl und theoretische Einordnung — liegt in der wissenschaftlichen Verantwortung der Nutzerin bzw. des Nutzers.",
  },
  en: {
    fullOut: "full non-membership (0.05)",
    crossover: "crossover (0.50)",
    fullIn: "full membership (0.95)",
    variable: "Variable",
    status: "Status",
    method: "Method",
    direction: "Direction",
    highIn: "high→in",
    inverted: "inverted",
    meanings: "Meanings",
    out: "out",
    cross: "crossover",
    in: "in",
    linearMeanings: "Linear anchor meanings",
    inclusionMeaning: "Inclusion meaning",
    provenance: "Provenance",
    already: "already calibrated",
    crisp: "crisp",
    linear: "linear",
    direct: "direct",
    remainder: "remainder (unobserved)",
    n: "n",
    consistency: "Consistency",
    pri: "PRI",
    outHeader: "OUT",
    cases: "Cases",
    noSolution: "No configuration meets the cutoffs — no solution.",
    solutionConsistency: "Solution consistency",
    solutionCoverage: "Solution coverage",
    path: "Path",
    rawCoverage: "Raw cov.",
    uniqueCoverage: "Unique cov.",
    directionalExpectations: "Directional expectations",
    condition: "Condition",
    candidate: "Candidate (≥0.9)",
    analysisTitle: "Analysis report",
    dataset: "Dataset",
    created: "Created",
    createdWith: "Created with openQCA (openqca.vercel.app), Open Source (MIT).",
    calibration: "Calibration",
    truthTable: "Truth table",
    conditions: "Conditions",
    outcome: "Outcome",
    frequencyCutoff: "Frequency cutoff",
    consistencyCutoff: "Consistency cutoff",
    solutions: "Solutions",
    necessity: "Necessary conditions",
    necessityHint: "Convention: consistency ≥ 0.9 is a candidate signal for necessity; interpret it with coverage and case knowledge.",
    reproducibility: "Reproducibility",
    footer: "This report documents the calculation steps and parameters of an fsQCA analysis. Substantive interpretation of the results—especially causal assumptions, case selection, and theoretical positioning—remains the scientific responsibility of the user.",
  },
} as const;

function outSymbol(out: 0 | 1 | "?"): string {
  return out === "?" ? "?" : String(out);
}

function observedRows(tt: TruthTableResult): TruthTableRow[] {
  return tt.rows
    .filter((r) => r.n > 0)
    .sort((x, y) => Number(y.output === 1) - Number(x.output === 1) || y.consistency - x.consistency);
}

function calibrationTable(
  anchors: Record<string, [number, number, number]>,
  calibSpecs: CalibSpecs | undefined,
  varMeta: Record<string, { type: string; role: string }> | undefined,
  locale: "de" | "en",
): string {
  const copy = REPORT_COPY[locale];
  if (calibSpecs && Object.keys(calibSpecs).length) {
    const blocks = Object.values(calibSpecs)
      .filter((s) => {
        const role = varMeta?.[s.column]?.role;
        return role === "condition" || role === "outcome";
      })
      .map((s) => {
        const role = varMeta?.[s.column]?.role ?? "";
        const method =
          varMeta?.[s.column]?.type === "raw"
            ? s.method === "crisp"
              ? `${copy.crisp} ≥ ${s.crisp?.threshold ?? "—"}`
              : s.method === "linear" && s.linear
                ? `${copy.linear} ${s.linear.fullOut} / ${s.linear.crossover} / ${s.linear.fullIn}`
                : s.direct
                  ? `${copy.direct} ${s.direct.fullOut} / ${s.direct.crossover} / ${s.direct.fullIn}`
                  : "raw"
            : `${copy.already} ${varMeta?.[s.column]?.type ?? ""}`;
        const direction = s.set.highIsMembership ? copy.highIn : copy.inverted;
        const meanings =
          s.method === "direct" && s.direct
            ? `${copy.meanings} — ${copy.out}: ${s.direct.meaningFullOut || "—"}; ${copy.cross}: ${s.direct.meaningCrossover || "—"}; ${copy.in}: ${s.direct.meaningFullIn || "—"}`
            : s.method === "linear" && s.linear
              ? `${copy.linearMeanings} — ${copy.out}: ${s.linear.meaningFullOut || "—"}; ${copy.cross}: ${s.linear.meaningCrossover || "—"}; ${copy.in}: ${s.linear.meaningFullIn || "—"}`
              : s.method === "crisp" && s.crisp
                ? `${copy.inclusionMeaning}: ${s.crisp.meaningInclusion || "—"}`
                : s.alreadyCalibratedProvenance
                  ? `${copy.provenance}: ${s.alreadyCalibratedProvenance}`
                  : "";
        return `<div class="set-block">
          <h3>${esc(s.set.setLabel || s.column)} <span class="hint">(${esc(role)} · ${esc(s.column)})</span></h3>
          <p>${esc(s.set.definition || "—")}</p>
          <p class="hint">${copy.status}: ${esc(s.status)} · ${copy.method}: ${esc(method)} · ${copy.direction}: ${direction}</p>
          ${meanings ? `<p class="hint">${esc(meanings)}</p>` : ""}
        </div>`;
      })
      .join("");
    if (blocks) return blocks;
  }
  const rows = Object.entries(anchors)
    .map(
      ([v, a]) =>
        `<tr><td>${esc(label(v))}</td><td>${fmt(a[0])}</td><td>${fmt(a[1])}</td><td>${fmt(a[2])}</td></tr>`,
    )
    .join("");
  return `
    <table>
      <thead>
        <tr><th>${copy.variable}</th><th>${copy.fullOut}</th><th>${copy.crossover}</th><th>${copy.fullIn}</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function truthTableSection(tt: TruthTableResult, locale: "de" | "en"): string {
  const copy = REPORT_COPY[locale];
  const observed = observedRows(tt);
  const remainderCount = tt.rows.length - observed.length;
  const conditionHeaders = tt.conditions.map((c) => `<th>${esc(label(c))}</th>`).join("");
  const bodyRows = observed
    .map((r) => {
      const bits = [...r.bits].map((b) => `<td class="mono num">${b}</td>`).join("");
      return `<tr>${bits}<td class="num">${r.n}</td><td class="num">${fmt(r.consistency)}</td><td class="num">${fmt(r.pri)}</td><td class="num">${outSymbol(r.output)}</td><td>${esc(r.cases.join(", "))}</td></tr>`;
    })
    .join("");
  const remainderRow = `<tr><td colspan="${tt.conditions.length + 5}" class="remainder">${remainderCount} ${copy.remainder}</td></tr>`;
  return `
    <table>
      <thead>
        <tr>${conditionHeaders}<th>${copy.n}</th><th>${copy.consistency}</th><th>${copy.pri}</th><th>${copy.outHeader}</th><th>${copy.cases}</th></tr>
      </thead>
      <tbody>${bodyRows}${remainderRow}</tbody>
    </table>`;
}

function solutionBlock(
  title: string,
  sol: Solution,
  outLabel: string,
  expectations: Record<string, string> | undefined,
  locale: "de" | "en",
): string {
  const copy = REPORT_COPY[locale];
  if (sol.models.length === 0) {
    return `<h3>${esc(title)}</h3><p class="hint">${copy.noSolution}</p>`;
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
        <p class="kpis">${copy.solutionConsistency}: <strong>${fmt(m.solutionConsistency)}</strong> &nbsp;·&nbsp; ${copy.solutionCoverage}: <strong>${fmt(m.solutionCoverage)}</strong></p>
        <table>
          <thead><tr><th>${copy.path}</th><th>${copy.rawCoverage}</th><th>${copy.uniqueCoverage}</th><th>${copy.consistency}</th></tr></thead>
          <tbody>${pathRows}</tbody>
        </table>`;
    })
    .join("<hr class=\"soft\"/>");
  const expectationsLine = expectations
    ? `<p class="hint">${copy.directionalExpectations}: ${Object.entries(expectations)
        .map(([c, v]) => `${esc(label(c))} = ${esc(v)}`)
        .join(", ")}</p>`
    : "";
  return `<h3>${esc(title)}</h3>${models}${expectationsLine}`;
}

function necessityTable(entries: NecessityEntry[], locale: "de" | "en"): string {
  const copy = REPORT_COPY[locale];
  const rows = entries
    .map(
      (n) =>
        `<tr><td class="mono">${esc(label(n.condition))}</td><td class="num">${fmt(n.consistency)}</td><td class="num">${fmt(n.coverage)}</td><td class="num">${n.isCandidate ? (locale === "en" ? "yes" : "ja") : "—"}</td></tr>`,
    )
    .join("");
  return `
    <table>
      <thead><tr><th>${copy.condition}</th><th>${copy.consistency}</th><th>Coverage</th><th>${copy.candidate}</th></tr></thead>
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
  const locale = input.locale ?? "de";
  const copy = REPORT_COPY[locale];
  const outLabel = label(input.outcome);
  const created = formatDateAT(new Date(), locale);

  const complexHtml = solutionBlock(
    locale === "en" ? "Complex (conservative) solution" : "Komplexe (konservative) Lösung",
    input.complex,
    outLabel,
    undefined,
    locale,
  );
  const intermediateHtml = solutionBlock(
    locale === "en" ? "Intermediate solution" : "Intermediäre Lösung",
    input.intermediate,
    outLabel,
    input.expectations,
    locale,
  );
  const parsimoniousHtml = solutionBlock(
    locale === "en" ? "Parsimonious solution" : "Sparsame (parsimonious) Lösung",
    input.parsimonious,
    outLabel,
    undefined,
    locale,
  );

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<title>openQCA — ${copy.analysisTitle}: ${esc(label(input.datasetName))}</title>
<style>${STYLE}</style>
</head>
<body>
  <h1>openQCA — ${copy.analysisTitle}</h1>
  <p class="subtitle">${copy.dataset}: <strong>${esc(input.datasetName)}</strong> &nbsp;·&nbsp; ${copy.cases}: <strong>${input.caseCount}</strong> &nbsp;·&nbsp; ${copy.created}: ${esc(created)}</p>
  <p class="note">${copy.createdWith}</p>

  <h2>${copy.calibration}</h2>
  ${calibrationTable(input.anchors, input.calibSpecs, input.varMeta, locale)}

  <h2>${copy.truthTable}</h2>
  <p class="hint">${copy.conditions}: ${esc(input.conditions.map(label).join(", "))} &nbsp;·&nbsp; ${copy.outcome}: ${esc(outLabel)} &nbsp;·&nbsp; ${copy.frequencyCutoff}: ${input.freqCut} &nbsp;·&nbsp; ${copy.consistencyCutoff}: ${fmt(input.consCut)}</p>
  ${truthTableSection(input.tt, locale)}

  <h2>${copy.solutions}</h2>
  ${complexHtml}
  ${intermediateHtml}
  ${parsimoniousHtml}

  <h2>${copy.necessity}</h2>
  ${necessityTable(input.necessity, locale)}
  <p class="hint">${copy.necessityHint}</p>

  <h2>${copy.reproducibility}</h2>
  <pre>${esc(input.rScript)}</pre>

  <footer>${copy.footer}</footer>
</body>
</html>`;
}
