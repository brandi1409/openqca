/**
 * Reiner Report-Baustein (kein React): erzeugt aus den Ergebnissen einer
 * Analyse ein vollständiges, in sich geschlossenes HTML-Dokument, das sich
 * direkt drucken oder als PDF sichern lässt.
 */

import type { NecessityEntry, Solution, TruthTableResult, TruthTableRow } from "@openqca/engine";
import type { CalibSpecs } from "@/lib/calibration-model";
import { citationInfo } from "@/lib/citation";
import type { AnalysisDecisionState, ResearchBrief } from "@/lib/workspace-model";

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
  researchBrief: ResearchBrief;
  analysisDecisions: AnalysisDecisionState;
  rScript: string;
  locale?: "de" | "en";
  /**
   * Synthetischer Demo-/Lehrdatensatz. Der Bericht wird dann erzeugt, trägt aber
   * einen unübersehbaren Warnhinweis: Rechenweg zeigen ja — als Forschungs-
   * ergebnis durchgehen nein.
   */
  demo?: boolean;
  /**
   * Kalibrierung noch nicht vollständig dokumentiert (Definitionen, Evidenz,
   * Fallprüfung). Der Bericht wird trotzdem erzeugt — Ergebnisse zuerst — und
   * kennzeichnet sich als vorläufig. Bei `demo: true` hat das Demo-Banner
   * Vorrang; dieses hier erscheint dann nicht zusätzlich.
   */
  provisional?: boolean;
  provisionalReasons?: string[];
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

/** Format measures with locale-appropriate decimal separators. */
function fmt(v: number, d = 3, locale: "de" | "en" = "de"): string {
  if (v == null || Number.isNaN(v)) return "—";
  const fixed = v.toFixed(d);
  return locale === "en" ? fixed : fixed.replace(".", ",");
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
    // Die Engine bildet die Anker nach Ragins Verfahren über Log-Odds ±3 ab —
    // das ergibt 1/(1+e^±3) ≈ 0,047 / 0,953, NICHT die gerundeten 0,05 / 0,95.
    // Der Bericht beschriftet, was gerechnet wurde (Befund E).
    fullOut: "voll draußen (≈0,047)",
    crossover: "Kreuzung (0,500)",
    fullIn: "voll drinnen (≈0,953)",
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
    linear: "linear (stückweise)",
    direct: "direkt (logistisch)",
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
    citation: "Zitation",
    citationHint:
      "Bitte die genaue Version angeben — Ergebnisse hängen von der Fassung ab, mit der sie gerechnet wurden.",
    footer: "Dieser Bericht dokumentiert Rechenschritte und Parameter einer fsQCA-Analyse. Die inhaltliche Interpretation der Ergebnisse — insbesondere Kausalitätsannahmen, Fallauswahl und theoretische Einordnung — liegt in der wissenschaftlichen Verantwortung der Nutzerin bzw. des Nutzers.",
    roles: { condition: "Bedingung", outcome: "Outcome", ignore: "ignoriert" } as Record<string, string>,
    statuses: {
      unresolved: "offen",
      provisional: "vorläufig",
      sourced: "belegt",
      external: "extern geprüft",
    } as Record<string, string>,
    demoBannerTitle: "Synthetische Lehrdaten — nicht zitierfähig",
    demoBannerBody:
      "Dieser Bericht wurde aus einem synthetischen Demonstrationsdatensatz erzeugt. Er zeigt den vollständigen Rechenweg von openQCA, belegt aber keine empirischen Befunde. Die Zahlen dürfen nicht zitiert, veröffentlicht oder als Forschungsergebnis verwendet werden. Für eine belastbare Analyse eigene Daten laden und die Kalibrierung inhaltlich begründen.",
    provisionalBannerTitle: "Vorläufig — Kalibrierung noch nicht vollständig dokumentiert",
    provisionalShort: "Vorläufig",
    provisionalBannerBody:
      "Die Berechnungen sind exakt, aber die inhaltliche Begründung der Kalibrierung (Set-Definitionen, Evidenz, Fallprüfung) ist noch unvollständig. Für eine publikationsreife Fassung die Dokumentation in der Kalibrier-Werkbank vervollständigen — sie schaltet auch Protokoll- und R-Export frei.",
  },
  en: {
    fullOut: "full non-membership (≈0.047)",
    crossover: "crossover (0.500)",
    fullIn: "full membership (≈0.953)",
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
    citation: "Citation",
    citationHint:
      "Please state the exact version — results depend on the release they were computed with.",
    footer: "This report documents the calculation steps and parameters of an fsQCA analysis. Substantive interpretation of the results—especially causal assumptions, case selection, and theoretical positioning—remains the scientific responsibility of the user.",
    roles: { condition: "condition", outcome: "outcome", ignore: "ignored" } as Record<string, string>,
    statuses: {
      unresolved: "unresolved",
      provisional: "provisional",
      sourced: "sourced",
      external: "externally verified",
    } as Record<string, string>,
    demoBannerTitle: "Synthetic teaching data — not citable",
    demoBannerBody:
      "This report was generated from a synthetic demonstration dataset. It shows openQCA's full calculation path but establishes no empirical findings. The numbers must not be cited, published, or used as research results. For a defensible analysis, load your own data and justify the calibration substantively.",
    provisionalBannerTitle: "Provisional — calibration not yet fully documented",
    provisionalShort: "Provisional",
    provisionalBannerBody:
      "The calculations are exact, but the substantive justification of the calibration (set definitions, evidence, case review) is still incomplete. For a publication-ready version, complete the documentation in the calibration workbench — it also unlocks protocol and R export.",
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
          <h3>${esc(s.set.setLabel || s.column)} <span class="hint">(${esc(copy.roles[role] ?? role)} · ${esc(s.column)})</span></h3>
          <p>${esc(s.set.definition || "—")}</p>
          <p class="hint">${copy.status}: ${esc(copy.statuses[s.status] ?? s.status)} · ${copy.method}: ${esc(method)} · ${copy.direction}: ${direction}</p>
          ${meanings ? `<p class="hint">${esc(meanings)}</p>` : ""}
        </div>`;
      })
      .join("");
    if (blocks) return blocks;
  }
  const rows = Object.entries(anchors)
    .map(
      ([v, a]) =>
        `<tr><td>${esc(label(v))}</td><td>${fmt(a[0], 3, locale)}</td><td>${fmt(a[1], 3, locale)}</td><td>${fmt(a[2], 3, locale)}</td></tr>`,
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
      return `<tr>${bits}<td class="num">${r.n}</td><td class="num">${fmt(r.consistency, 3, locale)}</td><td class="num">${fmt(r.pri, 3, locale)}</td><td class="num">${outSymbol(r.output)}</td><td>${esc(r.cases.join(", "))}</td></tr>`;
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
            `<tr><td class="mono">${esc(label(p.expression))}</td><td class="num">${fmt(p.rawCoverage, 3, locale)}</td><td class="num">${fmt(p.uniqueCoverage, 3, locale)}</td><td class="num">${fmt(p.consistency, 3, locale)}</td></tr>`,
        )
        .join("");
      return `
        <div class="formula mono">${esc(formula)} → ${esc(outLabel)}</div>
        <p class="kpis">${copy.solutionConsistency}: <strong>${fmt(m.solutionConsistency, 3, locale)}</strong> &nbsp;·&nbsp; ${copy.solutionCoverage}: <strong>${fmt(m.solutionCoverage, 3, locale)}</strong></p>
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
        `<tr><td class="mono">${esc(label(n.condition))}</td><td class="num">${fmt(n.consistency, 3, locale)}</td><td class="num">${fmt(n.coverage, 3, locale)}</td><td class="num">${n.isCandidate ? (locale === "en" ? "yes" : "ja") : "—"}</td></tr>`,
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
  /* Warnbanner für synthetische Lehrdaten — muss auch im Schwarzweiß-Ausdruck
     auffallen, daher kräftiger Rahmen statt reiner Farbfläche. */
  .demo-banner {
    border: 2px solid #935600;
    background: #fdf3e3;
    border-radius: 6px;
    padding: 12px 14px;
    margin: 0 0 18px;
    color: #4a3000;
    page-break-inside: avoid;
  }
  .demo-banner strong { display: block; font-size: 14px; margin-bottom: 4px; letter-spacing: 0.01em; }
  .demo-banner span { font-size: 12.5px; }
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

  const cite = citationInfo();
  const briefTitle = locale === "en" ? "Research brief" : "Research Brief";
  const ledgerTitle = locale === "en" ? "Decision ledger" : "Entscheidungsprotokoll";
  const yes = locale === "en" ? "confirmed" : "bestätigt";
  const no = locale === "en" ? "not confirmed" : "nicht bestätigt";
  const briefRows: Array<[string, string]> = locale === "en"
    ? [
        ["Research question", input.researchBrief.question],
        ["Case universe", input.researchBrief.caseUniverse],
        ["Time period", input.researchBrief.timePeriod],
        ["Outcome concept", input.researchBrief.outcomeConcept],
        ["Condition-selection rationale", input.researchBrief.conditionSelectionRationale],
        ["Status", input.researchBrief.confirmed ? yes : no],
      ]
    : [
        ["Forschungsfrage", input.researchBrief.question],
        ["Falluniversum", input.researchBrief.caseUniverse],
        ["Zeitraum", input.researchBrief.timePeriod],
        ["Outcome-Konzept", input.researchBrief.outcomeConcept],
        ["Begründung der Bedingungsauswahl", input.researchBrief.conditionSelectionRationale],
        ["Status", input.researchBrief.confirmed ? yes : no],
      ];
  const decisionRows: Array<[string, string, string, string]> = [
    [
      copy.frequencyCutoff,
      String(input.freqCut),
      input.analysisDecisions.frequencyCutoff.rationale,
      input.analysisDecisions.frequencyCutoff.confirmed ? yes : no,
    ],
    [
      copy.consistencyCutoff,
      String(input.consCut),
      input.analysisDecisions.consistencyCutoff.rationale,
      input.analysisDecisions.consistencyCutoff.confirmed ? yes : no,
    ],
    [
      copy.directionalExpectations,
      input.conditions
        .map((condition) => `${condition}: ${input.expectations[condition] ?? "present"}`)
        .join(", "),
      input.analysisDecisions.directionalExpectations.rationale,
      input.analysisDecisions.directionalExpectations.confirmed ? yes : no,
    ],
  ];
  const provisionalDetails = input.provisionalReasons?.length
    ? `<ul>${input.provisionalReasons.map((reason) => `<li>${esc(reason)}</li>`).join("")}</ul>`
    : "";

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<title>${input.demo ? `[${copy.demoBannerTitle}] ` : input.provisional ? `[${copy.provisionalShort}] ` : ""}openQCA — ${copy.analysisTitle}: ${esc(label(input.datasetName))}</title>
<style>${STYLE}</style>
</head>
<body>
  <h1>openQCA — ${copy.analysisTitle}</h1>
  ${
    input.demo
      ? `<div class="demo-banner" role="note"><strong>${copy.demoBannerTitle}</strong><span>${copy.demoBannerBody}</span></div>`
      : input.provisional
        ? `<div class="demo-banner" role="note"><strong>${copy.provisionalBannerTitle}</strong><span>${copy.provisionalBannerBody}</span>${provisionalDetails}</div>`
        : ""
  }
  <p class="subtitle">${copy.dataset}: <strong>${esc(input.datasetName)}</strong> &nbsp;·&nbsp; ${copy.cases}: <strong>${input.caseCount}</strong> &nbsp;·&nbsp; ${copy.created}: ${esc(created)}</p>
  <p class="note">${copy.createdWith}</p>

  <h2>${briefTitle}</h2>
  <table>
    <tbody>
      ${briefRows.map(([field, value]) => `<tr><th>${esc(field)}</th><td>${esc(value || "—")}</td></tr>`).join("")}
    </tbody>
  </table>

  <h2>${ledgerTitle}</h2>
  <table>
    <thead>
      <tr>
        <th>${locale === "en" ? "Decision" : "Entscheidung"}</th>
        <th>${locale === "en" ? "Current value" : "Aktueller Wert"}</th>
        <th>${locale === "en" ? "Rationale" : "Begründung"}</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${decisionRows.map(([decision, value, rationale, status]) => `<tr><td>${esc(decision)}</td><td>${esc(value || "—")}</td><td>${esc(rationale || "—")}</td><td>${esc(status)}</td></tr>`).join("")}
    </tbody>
  </table>

  <h2>${copy.calibration}</h2>
  ${calibrationTable(input.anchors, input.calibSpecs, input.varMeta, locale)}

  <h2>${copy.truthTable}</h2>
  <p class="hint">${copy.conditions}: ${esc(input.conditions.map(label).join(", "))} &nbsp;·&nbsp; ${copy.outcome}: ${esc(outLabel)} &nbsp;·&nbsp; ${copy.frequencyCutoff}: ${input.freqCut} &nbsp;·&nbsp; ${copy.consistencyCutoff}: ${fmt(input.consCut, 3, locale)}</p>
  ${truthTableSection(input.tt, locale)}

  <h2>${copy.solutions}</h2>
  ${complexHtml}
  ${intermediateHtml}
  ${parsimoniousHtml}

  <h2>${copy.necessity}</h2>
  ${necessityTable(input.necessity, locale)}
  <p class="hint">${copy.necessityHint}</p>

  ${
    input.rScript
      ? `<h2>${copy.reproducibility}</h2><pre>${esc(input.rScript)}</pre>`
      : ""
  }

  <h2>${copy.citation}</h2>
  <p>${esc(cite.plain)}</p>
  <p class="hint">${copy.citationHint}</p>
  <pre>${esc(cite.bibtex)}</pre>

  <footer>${copy.footer}</footer>
</body>
</html>`;
}
