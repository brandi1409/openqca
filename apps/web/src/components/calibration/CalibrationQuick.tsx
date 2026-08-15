"use client";

import { useState } from "react";
import { calibrateDirect, calibrateLinear } from "@openqca/engine";
import type { RawDataset } from "@/lib/demo";
import {
  anchorsAscending,
  anchorsFromSpecs,
  directThresholds,
  specIsProtocolReady,
  type CalibSpecs,
  type CalibrationSpec,
  type DirectAnchors,
  type RawCalibrationMethod,
  type VarType,
} from "@/lib/calibration-model";
import type { CalibrationEvaluation } from "@/lib/calibration-analysis";
import { cellToNumber, numericColumns } from "@/lib/dataset-columns";
import { AI_CONTRACT_VERSION, type AiAssistRequest, type AiReviewResponse } from "@/lib/ai-contract";
import type { AiAdoptionMetadata } from "@/lib/ai-reviewed-summary";
import { AiAssist } from "@/components/AiAssist";
import { useLocale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";
import { SectionHeading } from "@/components/ui";
import { CalibrationCurve, CrispStrip } from "@/components/calibration/AnchorMapping";

type VarMeta = { type: VarType; role: "condition" | "outcome" | "ignore" };
type Anchors = Record<string, [number, number, number]>;

const inputStyle: React.CSSProperties = {
  font: "inherit",
  fontSize: 13.5,
  color: "var(--ink)",
  background: "var(--panel-2)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "6px 9px",
  width: "100%",
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--muted)",
  fontWeight: 700,
};

const METHODS: { id: RawCalibrationMethod; key: DictKey }[] = [
  { id: "direct", key: "calib.quick.method.direct" },
  { id: "linear", key: "calib.quick.method.linear" },
  { id: "crisp", key: "calib.quick.method.crisp" },
];

/**
 * Schnell-Ansicht der Kalibrierung: pro aktiver Variable genau so viel, wie es
 * braucht, damit gerechnet werden kann — Methode, drei Anker (mit ziehbarer
 * Kurve) bzw. eine Schwelle. KEINE Pflicht-Textfelder: Die beim Import
 * gesetzten vorläufigen Platzhalter bleiben im Hintergrund bestehen, sodass die
 * Ergebnisse sofort rechnen und die Workbench sie weiterhin als „vorläufig"
 * ausweist. Die vollständige Dokumentation ist ein Angebot (Ansicht
 * „Dokumentation"), keine Voraussetzung fürs Sehen.
 */
export function CalibrationQuick({
  ds,
  varMeta,
  calibSpecs,
  setCalibSpecs,
  anchors,
  setAnchors,
  evaluation,
  sensitiveValues,
  aiSourceRevision,
  onAiAdopt,
  onDocument,
}: {
  ds: RawDataset;
  varMeta: Record<string, VarMeta>;
  calibSpecs: CalibSpecs;
  setCalibSpecs: (s: CalibSpecs) => void;
  anchors: Anchors;
  setAnchors: (a: Anchors) => void;
  evaluation: CalibrationEvaluation;
  /** Fallkennungen — die lokale Datenschutzprüfung sperrt sie vor dem Versand. */
  sensitiveValues: readonly string[];
  /** Quellrevision des KI-Ziels — exakt dieselbe Verdrahtung wie in der Werkbank. */
  aiSourceRevision: (column: string) => string;
  /** Feldgenaue Übernahme der vorgeschlagenen Definition (setzt Bestätigungen zurück). */
  onAiAdopt: (
    review: AiReviewResponse,
    metadata: AiAdoptionMetadata,
    submittedRequest: AiAssistRequest,
  ) => boolean | void | Promise<boolean | void>;
  /** Wechselt in die Dokumentations-Ansicht und fokussiert dort die Variable. */
  onDocument: (column: string) => void;
}) {
  const [locale] = useLocale();

  const activeCols = numericColumns(ds).filter((column) => {
    const meta = varMeta[column];
    return !!meta && meta.role !== "ignore";
  });

  /**
   * Wie `patchSpec` der Workbench: Spezifikation ändern, die Legacy-Anker
   * spiegeln und bewusst bestätigte Prüfungen zurücksetzen — wer die Anker
   * verschiebt, hat Fallprüfung und Sensitivität noch nicht für DIESE Anker
   * bestätigt. `provisionalDefaults` wird hier nie gelöscht: Die Schnell-Ansicht
   * ersetzt keinen einzigen Platzhaltertext.
   */
  function patchSpec(column: string, patch: Partial<CalibrationSpec>) {
    const prev = calibSpecs[column];
    if (!prev) return;
    const touchesAnchors =
      patch.direct !== undefined || patch.linear !== undefined || patch.crisp !== undefined;
    const nextSpec: CalibrationSpec = {
      ...prev,
      ...patch,
      set: patch.set ? { ...prev.set, ...patch.set } : prev.set,
      sensitivity: patch.sensitivity
        ? { ...prev.sensitivity, ...patch.sensitivity }
        : prev.sensitivity,
      caseReviewConfirmed: false,
      // Sobald ein Anker angefasst wird, ist er keine Perzentil-Vorgabe mehr.
      anchorsFromData: touchesAnchors ? false : prev.anchorsFromData,
    };
    nextSpec.sensitivity = { ...nextSpec.sensitivity, reviewed: false };
    const next = { ...calibSpecs, [column]: nextSpec };
    setCalibSpecs(next);
    setAnchors({ ...anchors, ...anchorsFromSpecs(next) });
  }

  function selectMethod(column: string, method: RawCalibrationMethod) {
    const spec = calibSpecs[column];
    if (!spec || spec.method === method) return;
    if (method === "direct" || method === "linear") {
      const source =
        method === "direct" ? (spec.direct ?? spec.linear) : (spec.linear ?? spec.direct);
      const a = anchors[column] ?? ds.anchors[column] ?? [0, 0.5, 1];
      const fuzzy: DirectAnchors = {
        fullOut: source?.fullOut ?? (spec.set.highIsMembership ? a[0] : a[2]),
        crossover: source?.crossover ?? a[1],
        fullIn: source?.fullIn ?? (spec.set.highIsMembership ? a[2] : a[0]),
        meaningFullOut: source?.meaningFullOut ?? "",
        meaningCrossover: source?.meaningCrossover ?? "",
        meaningFullIn: source?.meaningFullIn ?? "",
      };
      patchSpec(column, {
        method,
        methodConfirmed: false,
        direct: method === "direct" ? fuzzy : undefined,
        linear: method === "linear" ? fuzzy : undefined,
        crisp: undefined,
        sensitivity: { ...spec.sensitivity, alternatives: [], notes: "", reviewed: false },
      });
      return;
    }
    const finite = ds.rows
      .map((row) => cellToNumber(row[column]) ?? Number.NaN)
      .filter(Number.isFinite)
      .sort((x, y) => x - y);
    patchSpec(column, {
      method,
      methodConfirmed: false,
      direct: undefined,
      linear: undefined,
      crisp: {
        threshold: spec.crisp?.threshold ?? finite[Math.floor(finite.length / 2)] ?? 0,
        meaningInclusion: spec.crisp?.meaningInclusion ?? "",
      },
      sensitivity: { ...spec.sensitivity, alternatives: [], notes: "", reviewed: false },
    });
  }

  const anyAnchorsFromData = activeCols.some(
    (column) => varMeta[column]?.type === "raw" && calibSpecs[column]?.anchorsFromData,
  );

  /**
   * Ein Set offen, die übrigen als Zeile. Fünf ausgeklappte Karten waren gut
   * 3.600px hoch — bei sechs oder acht Bedingungen, wie in einer Dissertation
   * üblich, ist der Schritt so nicht mehr bedienbar, und man sieht nirgends,
   * welche Sets man schon angefasst hat. Offen ist zunächst das erste Set, das
   * überhaupt kalibriert werden muss.
   */
  const firstRaw = activeCols.find((column) => varMeta[column]?.type === "raw");
  const [openColumn, setOpenColumn] = useState<string | null>(firstRaw ?? activeCols[0] ?? null);

  /** Kurzfassung fürs eingeklappte Set: Methode und die gesetzten Schwellen. */
  function summaryOf(column: string): string {
    const meta = varMeta[column];
    const spec = calibSpecs[column];
    if (!meta || !spec) return "";
    if (meta.type !== "raw")
      return t(locale, "calib.quick.passthrough", {
        type: t(locale, meta.type === "fuzzy" ? "vars.type.fuzzy" : "vars.type.crisp"),
      });
    const num = (v: number) => String(roundForDisplay(v)).replace(".", ",");
    if (spec.method === "crisp" && spec.crisp)
      return `${t(locale, "calib.quick.method.crisp")} · ≥ ${num(spec.crisp.threshold)}`;
    const a = spec.method === "direct" ? spec.direct : spec.linear;
    if (!a) return t(locale, "calib.quick.noMethod");
    const label = t(
      locale,
      spec.method === "direct" ? "calib.quick.method.direct" : "calib.quick.method.linear",
    );
    return `${label} · ${num(a.fullOut)} / ${num(a.crossover)} / ${num(a.fullIn)}`;
  }

  return (
    <div data-testid="calibration-quick">
      <div className="oq-calibration-quick__intro">
        <SectionHeading>{t(locale, "calib.quick.title")}</SectionHeading>
        <p style={{ color: "var(--ink-2)", fontSize: 13.5, maxWidth: "70ch", margin: 0 }}>
          {t(locale, "calib.quick.desc")}
        </p>
        {/* Die Begründung steht einmal hier, nicht an jeder Set-Karte: sie ist für
            alle Sets dieselbe und stand sonst fünfmal untereinander. An der Karte
            bleibt nur die kurze Marke, damit die Herkunft am Anker sichtbar ist. */}
        {anyAnchorsFromData && (
          <p
            data-testid="calibration-origin-note"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 7,
              fontSize: 12,
              lineHeight: 1.5,
              color: "var(--warn-text)",
              background: "var(--warn-wash)",
              border: "1px solid color-mix(in srgb, var(--warn-text) 30%, transparent)",
              borderRadius: 8,
              padding: "7px 10px",
              margin: "12px 0 0",
              maxWidth: "70ch",
            }}
          >
            <span aria-hidden>!</span>
            <span>{t(locale, "calib.quick.anchorsFromData")}</span>
          </p>
        )}
      </div>

      {activeCols.map((column) => {
        const meta = varMeta[column];
        const spec = calibSpecs[column];
        if (!meta || !spec) return null;
        const documented = specIsProtocolReady(spec, meta.type);
        const cells = evaluation.cells.filter((cell) => cell.column === column);
        const inCount = cells.filter((cell) => cell.side === "in").length;
        const outCount = cells.filter((cell) => cell.side === "out").length;
        const nearCount = cells.filter(
          (cell) =>
            cell.membership !== null &&
            Number.isFinite(cell.membership) &&
            cell.membership > 0.4 &&
            cell.membership < 0.6,
        ).length;
        const missingCount = cells.filter((cell) => cell.side === "missing").length;
        const rawValues = ds.rows.map((row) => cellToNumber(row[column]) ?? Number.NaN);
        const fuzzyAnchors =
          spec.method === "direct"
            ? spec.direct
            : spec.method === "linear"
              ? spec.linear
              : undefined;
        const curveKeys = spec.set.highIsMembership
          ? (["fullOut", "crossover", "fullIn"] as const)
          : (["fullIn", "crossover", "fullOut"] as const);
        const curveAnchors = fuzzyAnchors
          ? (curveKeys.map((key) => fuzzyAnchors[key]) as [number, number, number])
          : null;
        const engineAnchors = directThresholds(fuzzyAnchors, spec.set.highIsMembership);

        function patchAnchors(patch: Partial<DirectAnchors>) {
          if (!fuzzyAnchors) return;
          if (spec.method === "direct") patchSpec(column, { direct: { ...fuzzyAnchors, ...patch } });
          else if (spec.method === "linear")
            patchSpec(column, { linear: { ...fuzzyAnchors, ...patch } });
        }

        const isOpen = openColumn === column;

        async function adoptAiDefinition(
          review: AiReviewResponse,
          metadata: AiAdoptionMetadata,
          submittedRequest: AiAssistRequest,
        ): Promise<boolean | void> {
          const adopted = await onAiAdopt(review, metadata, submittedRequest);
          if (adopted === false) return false;
          onDocument(column);
          return adopted;
        }

        return (
          <details
            key={column}
            data-testid={`calibration-quick-card-${column}`}
            open={isOpen}
            onToggle={(e) => {
              const nowOpen = (e.currentTarget as HTMLDetailsElement).open;
              setOpenColumn(nowOpen ? column : (prev) => (prev === column ? null : prev));
            }}
            className="oq-calibration-quick__set"
            data-open={isOpen ? "true" : "false"}
          >
            <summary
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 8,
                marginBottom: isOpen ? 12 : 0,
                cursor: "pointer",
              }}
            >
              <span className="mono" style={{ fontSize: 15, fontWeight: 700, minWidth: 0, overflowWrap: "anywhere" }}>
                {column}
              </span>
              <span style={pillStyle("neutral")}>
                {t(
                  locale,
                  meta.role === "outcome" ? "calib.guide.role.outcome" : "calib.guide.role.condition",
                )}
              </span>
              <span
                data-testid={`calibration-quick-doc-${column}`}
                data-documented={documented ? "true" : "false"}
                style={pillStyle(documented ? "good" : "warn")}
              >
                {t(locale, documented ? "calib.meter.chipDone" : "calib.meter.chipOpen")}
              </span>
              {/* Herkunft der Anker ausweisen, solange sie unverändert aus der
                  Perzentil-Heuristik des Imports stammen. Verschwindet, sobald ein
                  Anker angefasst wurde — datengetriebene Schwellen sind in der
                  QCA-Methodik keine Begründung. Die Begründung dazu steht einmal
                  oben im Schritt. */}
              {meta.type === "raw" && spec.anchorsFromData && (
                <span
                  data-testid={`calibration-quick-origin-${column}`}
                  style={pillStyle("warn")}
                  title={t(locale, "calib.quick.anchorsFromData")}
                >
                  {t(locale, "calib.quick.anchorsFromData.chip")}
                </span>
              )}
              {/* Eingeklappt trägt die Zeile den Stand des Sets — sonst müsste man
                  jedes Set aufklappen, um zu sehen, wo die Anker stehen. */}
              {!isOpen && (
                <span
                  data-testid={`calibration-quick-summary-${column}`}
                  className="mono"
                  style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}
                >
                  {summaryOf(column)}
                </span>
              )}
            </summary>

            {meta.type !== "raw" ? (
              <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: 0 }}>
                {t(locale, "calib.quick.passthrough", {
                  type: t(locale, meta.type === "fuzzy" ? "vars.type.fuzzy" : "vars.type.crisp"),
                })}
              </p>
            ) : (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={labelStyle}>{t(locale, "calib.quick.method")}</span>
                  <span
                    role="group"
                    aria-label={t(locale, "calib.quick.methodAria", { col: column })}
                    style={segmentGroupStyle}
                  >
                    {METHODS.map(({ id, key }) => {
                      const active = spec.method === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={active}
                          data-testid={`calibration-quick-method-${column}-${id}`}
                          onClick={() => selectMethod(column, id)}
                          style={active ? segmentActiveStyle : segmentInactiveStyle}
                        >
                          {t(locale, key)}
                        </button>
                      );
                    })}
                  </span>
                </div>

                {(spec.method === "direct" || spec.method === "linear") && fuzzyAnchors ? (
                  <>
                    <div
                      style={{
                        display: "grid",
                        // 190px statt 112px: Bei 112px brach die Reihe auf 390px in
                        // 2+1 um, und die Reihenfolge draußen → Kreuzung → drinnen
                        // ist genau das, was die drei Anker erklärt. Jetzt kippt sie
                        // auf schmalen Breiten in eine einzige Spalte.
                        gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {(
                        [
                          ["fullOut", "calib.anchorOut"],
                          ["crossover", "calib.anchorCross"],
                          ["fullIn", "calib.anchorIn"],
                        ] as const
                      ).map(([numKey, labKey]) => (
                        <label key={numKey} style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                          <span style={labelStyle}>{t(locale, labKey)}</span>
                          <input
                            data-testid={`calibration-quick-anchor-${column}-${numKey}`}
                            type="number"
                            step="any"
                            style={inputStyle}
                            value={fuzzyAnchors[numKey]}
                            onChange={(e) =>
                              patchAnchors({ [numKey]: Number(e.target.value) } as Partial<DirectAnchors>)
                            }
                          />
                        </label>
                      ))}
                    </div>
                    {anchorsAscending(fuzzyAnchors, spec.set.highIsMembership) && curveAnchors && engineAnchors ? (
                      <CalibrationCurve
                        variable={column}
                        anchors={curveAnchors}
                        method={spec.method}
                        anchorLabelKeys={
                          spec.set.highIsMembership
                            ? ["calib.handle.out", "calib.handle.cross", "calib.handle.in"]
                            : ["calib.handle.in", "calib.handle.cross", "calib.handle.out"]
                        }
                        values={rawValues}
                        highIsMembership={spec.set.highIsMembership}
                        rows={ds.rows.map((row, idx) => {
                          const cell = cells[idx];
                          const membership = cell?.membership;
                          const mapper = spec.method === "linear" ? calibrateLinear : calibrateDirect;
                          const mapped = mapper(rawValues[idx], ...engineAnchors);
                          return {
                            label: String(row[ds.caseCol]),
                            f:
                              membership !== null && membership !== undefined && Number.isFinite(membership)
                                ? membership
                                : spec.set.highIsMembership
                                  ? mapped
                                  : 1 - mapped,
                          };
                        })}
                        onAnchorChange={(index, value) =>
                          patchAnchors({ [curveKeys[index]]: value } as Partial<DirectAnchors>)
                        }
                      />
                    ) : (
                      <p style={{ fontSize: 13.5, color: "var(--bad)", margin: "10px 0 0" }}>
                        {t(locale, "calib.badOrder")}
                      </p>
                    )}
                  </>
                ) : spec.method === "crisp" && spec.crisp ? (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 200 }}>
                      <span style={labelStyle}>{t(locale, "calib.crisp.threshold")}</span>
                      <input
                        data-testid={`calibration-quick-threshold-${column}`}
                        type="number"
                        step="any"
                        style={inputStyle}
                        value={spec.crisp.threshold}
                        onChange={(e) =>
                          patchSpec(column, {
                            crisp: { ...spec.crisp!, threshold: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                    <CrispStrip
                      values={rawValues}
                      threshold={spec.crisp.threshold}
                      highIsMembership={spec.set.highIsMembership}
                    />
                  </>
                ) : (
                  <p style={{ fontSize: 13.5, color: "var(--warn-text)", margin: 0 }}>
                    {t(locale, "calib.quick.noMethod")}
                  </p>
                )}
              </>
            )}

            {/* KI-Coach nur für das aktuell geöffnete Set — so existiert nie mehr
                als ein Coach gleichzeitig. Er steht direkt am Arbeitskontext
                (Methode, Anker, Kurve), nicht am Kartenende. Nutzlast,
                Quellrevision, Fallkennungen und Übernahme-Handler sind exakt
                dieselben wie in der Werkbank; Vorschläge bleiben reine Prosa. */}
            {isOpen && (
              <div className="oq-calibration-quick__coach">
                <AiAssist
                  label={locale === "en" ? "Review evidence gaps" : "Evidenzlücken prüfen"}
                  request={() => ({
                    version: AI_CONTRACT_VERSION,
                    task: "calibration_evidence_gaps",
                    locale,
                    payload: {
                      variable: column,
                      setLabel: spec.set.setLabel,
                      definition: spec.set.definition,
                      rationale: [spec.set.unit, spec.set.scopePopulation, spec.set.timePeriod].filter(Boolean).join("; ") || (locale === "en" ? "No rationale supplied." : "Keine Begründung angegeben."),
                    },
                  })}
                  sourceRevision={() => aiSourceRevision(column)}
                  sensitiveValues={sensitiveValues}
                  focusTargetId={`calibration-set-definition-${column}`}
                  onAdopt={adoptAiDefinition}
                />
              </div>
            )}

            {/* Verteilung links, der Weg zur Begründung rechts — beides gehört ans
                Ende des Sets, nicht über die Anker. */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                marginTop: 10,
              }}
            >
              <p
                data-testid={`calibration-quick-dist-${column}`}
                style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}
              >
                {t(locale, "calib.quick.dist", { inCount, outCount })}
                {nearCount > 0 ? ` · ${t(locale, "calib.quick.nearHalf", { n: nearCount })}` : ""}
                {missingCount > 0 ? ` · ${t(locale, "calib.quick.missing", { n: missingCount })}` : ""}
              </p>
              <button
                type="button"
                className="oq-btn oq-btn--quiet"
                data-testid={`calibration-quick-document-${column}`}
                onClick={() => onDocument(column)}
                style={{ fontSize: 12, padding: "4px 8px", color: "var(--accent-deep)" }}
              >
                {t(locale, "calib.meter.docBtn")}
              </button>
            </div>
          </details>
        );
      })}
    </div>
  );
}

/** Kurzfassung in der eingeklappten Zeile: höchstens drei Nachkommastellen. */
function roundForDisplay(v: number): number {
  if (!Number.isFinite(v)) return Number.NaN;
  return Math.round(v * 1000) / 1000;
}

function pillStyle(kind: "neutral" | "good" | "warn"): React.CSSProperties {
  const color =
    kind === "good" ? "var(--good-text)" : kind === "warn" ? "var(--warn-text)" : "var(--muted)";
  return {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.03em",
    color,
    border: `1px solid ${kind === "neutral" ? "var(--line)" : color}`,
    borderRadius: 999,
    padding: "1px 8px",
    whiteSpace: "nowrap",
  };
}

const segmentGroupStyle: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid var(--line)",
  borderRadius: 8,
  overflow: "hidden",
};

const segmentBaseStyle: React.CSSProperties = {
  font: "inherit",
  fontSize: 12,
  fontWeight: 600,
  padding: "4px 10px",
  cursor: "pointer",
  border: "none",
  lineHeight: 1.4,
};

const segmentActiveStyle: React.CSSProperties = {
  ...segmentBaseStyle,
  background: "var(--brand)",
  color: "var(--accent-contrast)",
};

const segmentInactiveStyle: React.CSSProperties = {
  ...segmentBaseStyle,
  background: "var(--panel)",
  color: "var(--ink-2)",
};
