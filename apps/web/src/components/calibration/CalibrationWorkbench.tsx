"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calibrateDirect, calibrateLinear } from "@openqca/engine";
import type { RawDataset } from "@/lib/demo";
import {
  anchorsAscending,
  anchorsFromSpecs,
  calibrationReadiness,
  decisionBadge,
  directThresholds,
  effectiveStatus,
  newEvidenceId,
  requiredEvidenceTargets,
  specIsComputable,
  specIsProtocolReady,
  type CalibSpecs,
  type CalibrationSpec,
  type DirectAnchors,
  type EvidenceType,
  type SensitivityAlternative,
  type VarType,
} from "@/lib/calibration-model";
import {
  applyRohwerteTeachingSeed,
  isRohwerteDataset,
} from "@/lib/calibration-demo-seed";
import type {
  CalibrationEvaluation,
  CalibrationSensitivityResultWithRows,
  SensitivityBundle,
} from "@/lib/calibration-analysis";
import { cellToNumber, numericColumns } from "@/lib/dataset-columns";
import { useLocale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";
import { InfoHint } from "@/components/InfoHint";
import { ChartFrame } from "@/components/ChartFrame";
import { AiAssist } from "@/components/AiAssist";
import { SectionHeading } from "@/components/ui";

type VarMeta = { type: VarType; role: "condition" | "outcome" | "ignore" };
type Anchors = Record<string, [number, number, number]>;

const fmt = (v: number, d = 3) =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(d).replace(".", ",");

const inputStyle: React.CSSProperties = {
  font: "inherit",
  color: "var(--ink)",
  background: "var(--panel-2)",
  border: "1px solid var(--line)",
  borderRadius: 8,
  padding: "6px 9px",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--muted)",
  fontWeight: 700,
};
type CalibrationSubstepId =
  | "definition"
  | "method"
  | "mapping"
  | "evidence"
  | "cases"
  | "sensitivity";
type SubstepStatus = "complete" | "attention" | "incomplete" | "not-applicable";

const CALIBRATION_SUBSTEPS: { id: CalibrationSubstepId; labelKey: DictKey }[] = [
  { id: "definition", labelKey: "calib.guide.definition" },
  { id: "method", labelKey: "calib.guide.method" },
  { id: "mapping", labelKey: "calib.guide.mapping" },
  { id: "evidence", labelKey: "calib.guide.evidence" },
  { id: "cases", labelKey: "calib.guide.cases" },
  { id: "sensitivity", labelKey: "calib.guide.sensitivity" },
];

const FLAG_TRANSLATION_KEYS: Record<string, DictKey> = {
  missing: "calib.flag.missing",
  excluded: "calib.flag.excluded",
  unresolved: "calib.flag.unresolved",
  "missing-assigned": "calib.flag.missingAssigned",
  "raw-anchor-boundary": "calib.flag.rawBoundary",
  boundary: "calib.flag.rawBoundary",
  "exact-crossover": "calib.flag.exactCrossover",
  "near-crossover": "calib.flag.nearCrossover",
  "duplicate-case-label": "calib.flag.duplicateCase",
  "out-of-range": "calib.flag.outOfRange",
  "missing-spec": "calib.flag.missingSpec",
  "missing-method": "calib.flag.missingMethod",
  "invalid-parameters": "calib.flag.invalidParameters",
};

function flagTranslationKey(flag: string): DictKey {
  return FLAG_TRANSLATION_KEYS[flag] ?? "calib.flag.other";
}


function substepStatusKey(status: SubstepStatus): DictKey {
  if (status === "complete") return "calib.guide.status.complete";
  if (status === "attention") return "calib.guide.status.attention";
  if (status === "not-applicable") return "calib.guide.status.na";
  return "calib.guide.status.incomplete";
}

function hasImportPlaceholder(spec: CalibrationSpec, varType?: VarType): boolean {
  const texts = [spec.set.definition];
  if (varType === "raw" && (spec.method === "direct" || spec.method === "linear")) {
    const anchors = spec.method === "direct" ? spec.direct : spec.linear;
    texts.push(
      anchors?.meaningFullOut ?? "",
      anchors?.meaningCrossover ?? "",
      anchors?.meaningFullIn ?? "",
    );
  } else if (varType === "raw" && spec.method === "crisp") {
    texts.push(spec.crisp?.meaningInclusion ?? "");
  } else if (varType === "fuzzy" || varType === "crisp") {
    texts.push(spec.alreadyCalibratedProvenance ?? "");
  } else {
    texts.push(
      spec.alreadyCalibratedProvenance ?? "",
      spec.direct?.meaningFullOut ?? "",
      spec.direct?.meaningCrossover ?? "",
      spec.direct?.meaningFullIn ?? "",
      spec.linear?.meaningFullOut ?? "",
      spec.linear?.meaningCrossover ?? "",
      spec.linear?.meaningFullIn ?? "",
      spec.crisp?.meaningInclusion ?? "",
    );
  }
  return texts.some((value) => {
    const normalized = value.toLowerCase();
    return normalized.includes("provisional") || normalized.includes("confirm provenance before publication");
  });
}

function Card({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div
      id={id}
      style={{
        background: "var(--panel)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "18px 20px",
        marginBottom: 18,
        scrollMarginTop: id ? 56 : undefined,
      }}
    >
      {children}
    </div>
  );
}

function Diag({ kind, children }: { kind: "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const map = {
    ok: ["var(--good)", "rgba(12,163,12,0.09)"],
    warn: ["#b26a00", "var(--warn-wash)"],
    bad: ["var(--bad)", "var(--bad-wash)"],
  } as const;
  const [icon, wash] = map[kind];
  return (
    <div
      style={{
        display: "flex",
        gap: 9,
        alignItems: "flex-start",
        fontSize: 13.5,
        padding: "9px 11px",
        borderRadius: 9,
        border: `1px solid ${wash}`,
        background: wash,
      }}
    >
      <span
        style={{
          width: 17,
          height: 17,
          borderRadius: "50%",
          flex: "none",
          marginTop: 1,
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          background: icon,
        }}
      >
        {kind === "ok" ? "✓" : "!"}
      </span>
      <div>{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export function CalibrationWorkbench({
  ds,
  varMeta,
  setVarMeta,
  calibSpecs,
  setCalibSpecs,
  anchors,
  setAnchors,
  focusVar,
  setFocusVar,
  evaluation,
  sensitivity,
  conditions,
  outcome,
  excludedMissingCount,
  freqCut,
  consCut,
}: {
  ds: RawDataset;
  varMeta: Record<string, VarMeta>;
  setVarMeta: (m: Record<string, VarMeta>) => void;
  calibSpecs: CalibSpecs;
  setCalibSpecs: (s: CalibSpecs) => void;
  anchors: Anchors;
  setAnchors: (a: Anchors) => void;
  focusVar: string;
  setFocusVar: (v: string) => void;
  evaluation: CalibrationEvaluation;
  sensitivity: SensitivityBundle;
  conditions: string[];
  outcome: string;
  excludedMissingCount: number;
  freqCut: number;
  consCut: number;
}) {
  const [locale] = useLocale();
  const [activeStep, setActiveStep] = useState<CalibrationSubstepId>("definition");

  const activeCols = useMemo(
    () =>
      numericColumns(ds).filter((c) => {
        const m = varMeta[c];
        return m && m.role !== "ignore";
      }),
    [ds, varMeta],
  );

  const v = activeCols.includes(focusVar) ? focusVar : activeCols[0] ?? "";
  const meta = v ? varMeta[v] : undefined;
  const spec = v ? calibSpecs[v] : undefined;
  const sensitivityContext = `${freqCut}|${consCut}|${outcome}|${conditions.join("\u001f")}`;
  const sensitivityContextRef = useRef(sensitivityContext);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const sections = CALIBRATION_SUBSTEPS.map(({ id }) =>
      document.getElementById(`calibration-substep-${id}`),
    ).filter((section): section is HTMLElement => !!section);
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const next = visible[0]?.target.id.replace(
          "calibration-substep-",
          "",
        ) as CalibrationSubstepId | undefined;
        if (next) setActiveStep(next);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.25, 0.75] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [v]);

  useEffect(() => {
    if (sensitivityContextRef.current === sensitivityContext) return;
    sensitivityContextRef.current = sensitivityContext;
    if (!Object.values(calibSpecs).some((current) => current.sensitivity.reviewed)) return;
    setCalibSpecs(
      Object.fromEntries(
        Object.entries(calibSpecs).map(([column, current]) => [
          column,
          { ...current, sensitivity: { ...current.sensitivity, reviewed: false } },
        ]),
      ),
    );
  }, [calibSpecs, sensitivityContext, setCalibSpecs]);

  function patchSpec(
    column: string,
    patch: Partial<CalibrationSpec>,
    preserveReview = false,
  ) {
    const prev = calibSpecs[column];
    if (!prev) return;
    const nextSpec: CalibrationSpec = {
      ...prev,
      ...patch,
      set: patch.set ? { ...prev.set, ...patch.set } : prev.set,
      sensitivity: patch.sensitivity
        ? {
            ...prev.sensitivity,
            ...patch.sensitivity,
            alternatives: patch.sensitivity.alternatives ?? prev.sensitivity.alternatives,
          }
        : prev.sensitivity,
    };
    if (patch.direct) nextSpec.direct = { ...prev.direct!, ...patch.direct };
    if (patch.linear) nextSpec.linear = { ...prev.linear!, ...patch.linear };
    if (patch.crisp) nextSpec.crisp = { ...prev.crisp!, ...patch.crisp };
    if (
      nextSpec.provisionalDefaults &&
      !hasImportPlaceholder(nextSpec, varMeta[column]?.type)
    ) {
      nextSpec.provisionalDefaults = undefined;
    }
    if (!preserveReview) {
      nextSpec.caseReviewConfirmed = false;
      nextSpec.sensitivity = { ...nextSpec.sensitivity, reviewed: false };
    }
    const next = { ...calibSpecs, [column]: nextSpec };
    setCalibSpecs(next);
    setAnchors({ ...anchors, ...anchorsFromSpecs(next) });
  }

  function applyTeachingSeed() {
    const seeded = applyRohwerteTeachingSeed();
    setVarMeta({ ...varMeta, ...seeded.varMeta });
    const merged = { ...calibSpecs, ...seeded.calibSpecs };
    setCalibSpecs(merged);
    setAnchors({ ...anchors, ...anchorsFromSpecs(merged) });
    setFocusVar("BIP_pKopf");
  }

  if (activeCols.length === 0) {
    return (
      <Card>
        <SectionHeading>{t(locale, "calib.title")}</SectionHeading>
        <Diag kind="ok">{t(locale, "calib.allCalibrated")}</Diag>
      </Card>
    );
  }

  if (!spec || !meta || !v) {
    return null;
  }
  const activeSpec = spec;

  const readiness = calibrationReadiness(spec, meta.type);
  const status = effectiveStatus(spec, meta.type);
  const badge = decisionBadge(status);
  const ready = specIsComputable(spec, meta.type);
  const protocolReady = specIsProtocolReady(spec, meta.type);
  const isOutcome = meta.role === "outcome";
  const directCurveKeys =
    spec.set.highIsMembership
      ? (["fullOut", "crossover", "fullIn"] as const)
      : (["fullIn", "crossover", "fullOut"] as const);
  const fuzzyAnchors =
    spec.method === "direct" ? spec.direct : spec.method === "linear" ? spec.linear : undefined;
  const directCurveAnchors = fuzzyAnchors
    ? (directCurveKeys.map((key) => fuzzyAnchors[key]) as [number, number, number])
    : null;
  const directEngineAnchors = directThresholds(fuzzyAnchors, spec.set.highIsMembership);

  const rawValues = ds.rows.map((r) => cellToNumber(r[v]) ?? Number.NaN);
  function selectRawMethod(method: "direct" | "linear" | "crisp") {
    if (method === "direct" || method === "linear") {
      const source = method === "direct"
        ? activeSpec.direct ?? activeSpec.linear
        : activeSpec.linear ?? activeSpec.direct;
      const a = anchors[v] ?? ds.anchors[v] ?? [0, 0.5, 1];
      const fuzzy = {
        fullOut: source?.fullOut ?? (activeSpec.set.highIsMembership ? a[0] : a[2]),
        crossover: source?.crossover ?? a[1],
        fullIn: source?.fullIn ?? (activeSpec.set.highIsMembership ? a[2] : a[0]),
        meaningFullOut: source?.meaningFullOut ?? "",
        meaningCrossover: source?.meaningCrossover ?? "",
        meaningFullIn: source?.meaningFullIn ?? "",
      };
      patchSpec(v, {
        method,
        methodConfirmed: false,
        direct: method === "direct" ? fuzzy : undefined,
        linear: method === "linear" ? fuzzy : undefined,
        crisp: undefined,
        sensitivity: { ...activeSpec.sensitivity, alternatives: [], notes: "", reviewed: false },
      });
      return;
    }

    const finite = rawValues.filter(Number.isFinite).sort((a, b) => a - b);
    const median = finite[Math.floor(finite.length / 2)] ?? 0;
    patchSpec(v, {
      method,
      methodConfirmed: false,
      direct: undefined,
      linear: undefined,
      crisp: {
        threshold: activeSpec.crisp?.threshold ?? median,
        meaningInclusion: activeSpec.crisp?.meaningInclusion ?? "",
      },
      sensitivity: { ...activeSpec.sensitivity, alternatives: [], notes: "", reviewed: false },
    });
  }

  function patchFuzzyAnchors(patch: Partial<DirectAnchors>) {
    if (!fuzzyAnchors) return;
    if (activeSpec.method === "direct") {
      patchSpec(v, { direct: { ...fuzzyAnchors, ...patch } });
    } else if (activeSpec.method === "linear") {
      patchSpec(v, { linear: { ...fuzzyAnchors, ...patch } });
    }
  }

  function setDirection(highIsMembership: boolean) {
    if (activeSpec.method === "direct" && activeSpec.direct) {
      patchSpec(v, {
        set: { ...activeSpec.set, highIsMembership },
        direct: {
          ...activeSpec.direct,
          fullOut: activeSpec.direct.fullIn,
          fullIn: activeSpec.direct.fullOut,
        },
      });
      return;
    }
    if (activeSpec.method === "linear" && activeSpec.linear) {
      patchSpec(v, {
        set: { ...activeSpec.set, highIsMembership },
        linear: {
          ...activeSpec.linear,
          fullOut: activeSpec.linear.fullIn,
          fullIn: activeSpec.linear.fullOut,
        },
      });
      return;
    }
    patchSpec(v, { set: { ...activeSpec.set, highIsMembership } });
  }
  const columnCells = evaluation.cells.filter((cell) => cell.column === v);
  const memberships = columnCells.map((cell) => cell.membership ?? undefined);
  const caseRows = ds.rows.map((r, idx) => {
    const cell = columnCells[idx];
    return {
      rowIndex: idx,
      label: String(r[ds.caseCol]),
      raw: cell?.rawValue ?? null,
      m: cell?.membership ?? undefined,
      side: cell?.side ?? "missing",
      flags: cell?.flags ?? ["unresolved"],
    };
  });
  const caseDiagnosticCounts = {
    missing: caseRows.filter((row) => row.flags.some((flag) => flag === "missing" || flag === "unresolved")).length,
    boundary: caseRows.filter((row) => row.flags.includes("raw-anchor-boundary")).length,
    exact: caseRows.filter((row) => row.flags.includes("exact-crossover")).length,
    near: caseRows.filter((row) => row.flags.includes("near-crossover")).length,
    duplicate: caseRows.filter((row) => row.flags.includes("duplicate-case-label")).length,
    outOfRange: caseRows.filter((row) => row.flags.includes("out-of-range")).length,
  };
  const hasCaseAttention = Object.values(caseDiagnosticCounts).some((count) => count > 0);
  const hasEmpiricalDiagnostic = spec.evidence.some((item) => item.type === "empirical_diagnostic");
  const evidenceTargets = requiredEvidenceTargets(spec, meta.type);
  const missing = new Set(readiness.missingFields);
  const definitionStatus: SubstepStatus = ["setLabel", "definition", "unit", "scopePopulation", "timePeriod"].some(
    (field) => missing.has(field),
  )
    ? "incomplete"
    : "complete";
  const methodStatus: SubstepStatus = (meta.type === "raw"
    ? ["method", "methodConfirmed"]
    : ["alreadyCalibratedProvenance", "methodConfirmed"]
  ).some((field) => missing.has(field))
    ? "incomplete"
    : "complete";
  const mappingFields =
    meta.type !== "raw"
      ? ["alreadyCalibratedProvenance", "missingPolicy"]
      : spec.method === "direct" || spec.method === "linear"
        ? ["directAnchors", "meaningFullOut", "meaningCrossover", "meaningFullIn", "missingPolicy"]
        : spec.method === "crisp"
          ? ["crispThreshold", "meaningInclusion", "missingPolicy"]
          : ["method"];
  const mappingStatus: SubstepStatus = mappingFields.some((field) => missing.has(field))
    ? "incomplete"
    : "complete";
  const evidenceStatus: SubstepStatus =
    readiness.missingEvidence.length > 0
      ? hasEmpiricalDiagnostic
        ? "attention"
        : "incomplete"
      : "complete";
  const caseStatus: SubstepStatus = !spec.caseReviewConfirmed
    ? "incomplete"
    : hasCaseAttention
      ? "attention"
      : "complete";
  const sensitivityStatus: SubstepStatus =
    meta.type !== "raw"
      ? "not-applicable"
      : missing.has("sensitivityReview")
        ? "incomplete"
        : "complete";
  const stepStatuses: Record<CalibrationSubstepId, SubstepStatus> = {
    definition: definitionStatus,
    method: methodStatus,
    mapping: mappingStatus,
    evidence: evidenceStatus,
    cases: caseStatus,
    sensitivity: sensitivityStatus,
  };
  const applicableSteps = CALIBRATION_SUBSTEPS.filter(
    ({ id }) => stepStatuses[id] !== "not-applicable",
  );
  const completeSteps = applicableSteps.filter(({ id }) => stepStatuses[id] === "complete").length;
  const recommendedStep =
    CALIBRATION_SUBSTEPS.find(
      ({ id }) => stepStatuses[id] === "incomplete" || stepStatuses[id] === "attention",
    )?.id ??
    applicableSteps[0]?.id ??
    "definition";
  const activeStepStatus = stepStatuses[activeStep];
  const selectedStep =
    activeStepStatus === "not-applicable" ? recommendedStep : activeStep;
  const roleLabel = t(locale, isOutcome ? "calib.guide.role.outcome" : "calib.guide.role.condition");
  const typeLabel = t(
    locale,
    meta.type === "raw" ? "vars.type.raw" : meta.type === "fuzzy" ? "vars.type.fuzzy" : "vars.type.crisp",
  );
  const modeLabel =
    meta.type !== "raw"
      ? t(locale, "calib.guide.mode.already")
      : spec.method === "direct"
        ? t(locale, "calib.guide.mode.direct")
        : spec.method === "linear"
          ? t(locale, "calib.guide.mode.linear")
          : spec.method === "crisp"
            ? t(locale, "calib.guide.mode.crisp")
            : t(locale, "calib.guide.mode.unselected");
  const directionLabel = t(
    locale,
    spec.set.highIsMembership ? "calib.guide.direction.high" : "calib.guide.direction.low",
  );



  function goToSubstep(id: CalibrationSubstepId) {
    setActiveStep(id);
    const section = document.getElementById(`calibration-substep-${id}`);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    const heading = section.querySelector<HTMLElement>("h2, h3");
    if (heading) {
      heading.tabIndex = -1;
      window.setTimeout(() => heading.focus({ preventScroll: true }), 0);
    }
  }

  const renderVariableButton = (column: string) => {
    const role = varMeta[column]?.role ?? "condition";
    const st = effectiveStatus(calibSpecs[column] ?? spec, varMeta[column]?.type ?? "raw");
    const b = decisionBadge(st);
    return (
      <button
        key={column}
        type="button"
        className="oq-btn"
        aria-pressed={column === v}
        aria-label={`${column}, ${t(locale, role === "outcome" ? "calib.guide.role.outcome" : "calib.guide.role.condition")}`}
        data-testid={`calibration-variable-${column}`}
        onClick={() => setFocusVar(column)}
        style={{
          fontSize: 13.5,
          padding: "6px 12px",
          border: "1px solid var(--line)",
          background: column === v ? "var(--brand)" : "var(--panel-2)",
          color: column === v ? "var(--panel)" : "var(--ink-2)",
          fontWeight: column === v ? 600 : 400,
        }}
      >
        {column}
        <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.85, textTransform: "uppercase" }}>
          {t(locale, role === "outcome" ? "calib.guide.role.outcome" : "calib.guide.role.condition")} ·{" "}
          {t(locale, badgeLabelKey(b.labelKey))}
        </span>
      </button>
    );
  };

  return (
    <Card id="kalibrierung">
      <SectionHeading>{t(locale, "calib.title")}</SectionHeading>
      <p style={{ color: "var(--ink-2)", maxWidth: "70ch", marginTop: 0 }}>
        {t(locale, "calib.descGuided")}
      </p>

      {isRohwerteDataset(ds.name) && (
        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            className="oq-btn oq-btn--secondary"
            onClick={applyTeachingSeed}
            style={{ fontSize: 13.5 }}
          >
            {t(locale, "calib.seed.apply")}
          </button>
          <p className="hint" style={{ fontSize: 13.5, color: "var(--muted)", margin: "6px 0 0" }}>
            {t(locale, "calib.seed.hint")}
          </p>
        </div>
      )}

      {excludedMissingCount > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Diag kind="warn">
            {t(locale, "calib.missing.excluded", { n: excludedMissingCount })}
          </Diag>
        </div>
      )}

      <nav
        aria-label={t(locale, "calib.guide.variables")}
        style={{ display: "grid", gap: 10, marginBottom: 14 }}
      >
        {[
          ["calib.guide.outcomeGroup", activeCols.filter((column) => varMeta[column]?.role === "outcome")],
          ["calib.guide.conditionGroup", activeCols.filter((column) => varMeta[column]?.role === "condition")],
        ].map(([groupKey, columns]) => (
          <div key={String(groupKey)} style={{ display: "grid", gap: 6 }}>
            <span style={labelStyle}>{t(locale, groupKey as DictKey)}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(columns as string[]).map(renderVariableButton)}
            </div>
          </div>
        ))}
      </nav>

      <div
        data-testid="calibration-active-context"
        aria-live="polite"
        style={{
          padding: "9px 11px",
          marginBottom: 12,
          border: "1px solid var(--line-soft)",
          borderRadius: 8,
          background: "var(--panel-2)",
          color: "var(--ink-2)",
          fontSize: 13.5,
          lineHeight: 1.55,
        }}
      >
        <strong>{roleLabel}</strong> · <span className="mono">{v}</span> ·{" "}
        {typeLabel} · {modeLabel} · {directionLabel}
        <br />
        {t(locale, isOutcome ? "calib.guide.context.outcome" : "calib.guide.context.condition")}
      </div>

      <nav
        aria-label={t(locale, "calib.guide.aria")}
        data-testid="calibration-substepper"
        style={{
          borderTop: "1px solid var(--line-soft)",
          borderBottom: "1px solid var(--line-soft)",
          padding: "10px 0",
          marginBottom: 14,
        }}
      >
        <ol
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {CALIBRATION_SUBSTEPS.map(({ id, labelKey }) => {
            const stepStatus = stepStatuses[id];
            const isCurrent = selectedStep === id;
            const label = t(locale, labelKey);
            const statusLabel = t(locale, substepStatusKey(stepStatus));
            const content = (
              <>
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{statusLabel}</span>
              </>
            );
            return (
              <li key={id} style={{ display: "flex" }}>
                {stepStatus === "not-applicable" ? (
                  <span
                    data-testid={`calibration-substep-${id}`}
                    aria-disabled="true"
                    style={{
                      display: "grid",
                      gap: 1,
                      padding: "5px 8px",
                      borderRadius: 8,
                      color: "var(--muted)",
                      background: "var(--panel-2)",
                      fontSize: 12,
                    }}
                  >
                    {content}
                  </span>
                ) : (
                  <a
                    href={`#calibration-substep-${id}`}
                    data-testid={`calibration-substep-${id}`}
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      goToSubstep(id);
                    }}
                    style={{
                      display: "grid",
                      gap: 1,
                      padding: "5px 8px",
                      borderRadius: 8,
                      border: isCurrent ? "1px solid var(--accent)" : "1px solid transparent",
                      color: isCurrent ? "var(--accent-deep)" : "var(--ink-2)",
                      background: isCurrent ? "var(--accent-wash)" : "transparent",
                      fontSize: 12,
                      textDecoration: "none",
                    }}
                  >
                    {content}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
        <div
          data-testid="calibration-progress"
          style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, fontSize: 13.5 }}
        >
          <span>
            {t(locale, "calib.guide.progress", {
              done: completeSteps,
              total: applicableSteps.length,
            })}
          </span>
          {completeSteps < applicableSteps.length ? (
            <button
              type="button"
              className="oq-btn oq-btn--secondary"
              data-testid="calibration-next-incomplete"
              onClick={() => goToSubstep(recommendedStep)}
              style={{ fontSize: 12, padding: "4px 8px" }}
            >
              {t(locale, "calib.guide.next")}
            </button>
          ) : (
            <span style={{ color: "var(--good-text)", fontSize: 12 }}>
              {t(locale, "calib.guide.complete")}
            </span>
          )}
        </div>
      </nav>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          padding: "4px 10px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          background:
            badge.kind === "bad"
              ? "var(--bad-wash)"
              : badge.kind === "warn"
                ? "var(--warn-wash)"
                : "rgba(12,163,12,0.09)",
          color:
            badge.kind === "bad"
              ? "var(--bad)"
              : badge.kind === "warn"
                ? "#b26a00"
                : "var(--good-text)",
        }}
      >
        {t(locale, badgeLabelKey(badge.labelKey))}
        {ready ? ` · ${t(locale, "calib.ready.yes")}` : ` · ${t(locale, "calib.ready.no")}`}
      </div>
      <div
        data-testid="calibration-protocol-status"
        data-readiness={protocolReady ? "protocol-ready" : "protocol-incomplete"}
        style={{ fontSize: 13.5, color: protocolReady ? "var(--good-text)" : "var(--muted)", marginBottom: 14 }}
      >
        {protocolReady
          ? t(locale, "calib.protocol.ready")
          : t(locale, "calib.protocol.incomplete", {
              n: readiness.missingFields.length + readiness.missingEvidence.length,
            })}
      </div>

      {/* 1. Set definition */}
      <section id="calibration-substep-definition" style={{ marginBottom: 18 }}>
        <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 10px", outline: "none" }}>
          {t(locale, "calib.set.title")}{" "}
          <span
            data-testid="calibration-set-role"
            style={{
              display: "inline-block",
              marginLeft: 6,
              padding: "2px 7px",
              borderRadius: 999,
              background: isOutcome ? "var(--accent-wash)" : "var(--panel-2)",
              color: isOutcome ? "var(--accent-deep)" : "var(--muted)",
              fontSize: 11,
              verticalAlign: "middle",
            }}
          >
            {roleLabel}
          </span>
        </h3>
        {isOutcome && (
          <div style={{ marginBottom: 10 }}>
            <InfoHint
              title={t(locale, "calib.outcome.hintTitle")}
              body={t(locale, "calib.outcome.hintBody")}
            />
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "6px 0 0", maxWidth: "70ch" }}>
              {t(locale, "calib.outcome.blurb")}
            </p>
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10,
          }}
        >
          <Field label={t(locale, "calib.set.label")}>
            <input
              style={inputStyle}
              value={spec.set.setLabel}
              onChange={(e) => patchSpec(v, { set: { ...spec.set, setLabel: e.target.value } })}
            />
          </Field>
          <Field label={t(locale, "calib.set.unit")}>
            <input
              style={inputStyle}
              value={spec.set.unit}
              onChange={(e) => patchSpec(v, { set: { ...spec.set, unit: e.target.value } })}
            />
          </Field>
          <Field label={t(locale, "calib.set.scope")}>
            <input
              style={inputStyle}
              value={spec.set.scopePopulation}
              onChange={(e) =>
                patchSpec(v, { set: { ...spec.set, scopePopulation: e.target.value } })
              }
            />
          </Field>
          <Field label={t(locale, "calib.set.time")}>
            <input
              style={inputStyle}
              value={spec.set.timePeriod}
              onChange={(e) =>
                patchSpec(v, { set: { ...spec.set, timePeriod: e.target.value } })
              }
            />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label={t(locale, "calib.set.definition")}>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: "vertical" }}
              value={spec.set.definition}
              onChange={(e) =>
                patchSpec(v, { set: { ...spec.set, definition: e.target.value } })
              }
            />
          </Field>
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label={t(locale, "calib.set.notes")}>
            <textarea
              style={{ ...inputStyle, minHeight: 48, resize: "vertical" }}
              value={spec.set.notes}
              onChange={(e) => patchSpec(v, { set: { ...spec.set, notes: e.target.value } })}
            />
          </Field>
        </div>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
            fontSize: 13.5,
          }}
        >
          <input
            data-testid="calibration-direction"
            type="checkbox"
            checked={spec.set.highIsMembership}
            onChange={(e) => setDirection(e.target.checked)}
          />
          {t(locale, "calib.set.highIsIn")}
        </label>
      </section>

      {/* 2. Method / provenance */}
      <section id="calibration-substep-method" style={{ marginBottom: 18 }}>
        <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 10px", outline: "none" }}>
          {t(locale, "calib.method.title")}
        </h3>
        {meta.type === "raw" ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(
              [
                ["direct", "calib.method.direct"],
                ["linear", "calib.method.linear"],
                ["crisp", "calib.method.crisp"],
              ] as const
            ).map(([id, key]) => (
              <button
                key={id}
                type="button"
                className="oq-btn"
                data-testid={`calibration-method-${id}`}
                aria-pressed={spec.method === id}
                onClick={() => selectRawMethod(id)}
                style={{
                  fontSize: 13.5,
                  padding: "8px 14px",
                  border:
                    spec.method === id ? "2px solid var(--brand)" : "1px solid var(--line)",
                  background: spec.method === id ? "var(--panel-2)" : "var(--panel)",
                }}
              >
                {t(locale, key)}
              </button>
            ))}
          </div>
        ) : (
          <Field label={t(locale, "calib.method.provenance")}>
            <textarea
              style={{ ...inputStyle, minHeight: 64 }}
              value={spec.alreadyCalibratedProvenance ?? ""}
              onChange={(e) =>
                patchSpec(v, { alreadyCalibratedProvenance: e.target.value })
              }
              placeholder={t(locale, "calib.method.provenancePh")}
            />
          </Field>
        )}
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 8 }}>
          {meta.type === "raw" && spec.method === "direct"
            ? t(
                locale,
                spec.set.highIsMembership
                  ? "calib.method.directHelp"
                  : "calib.method.directHelpInverted",
              )
            : meta.type === "raw" && spec.method === "linear"
              ? t(
                  locale,
                  spec.set.highIsMembership
                    ? "calib.method.linearHelp"
                    : "calib.method.linearHelpInverted",
                )
              : meta.type === "raw" && spec.method === "crisp"
                ? t(
                    locale,
                    spec.set.highIsMembership
                      ? "calib.method.crispHelp"
                      : "calib.method.crispHelpInverted",
                  )
                : t(locale, "calib.method.alreadyHelp")}
        </p>
        <button
          type="button"
          className="oq-btn oq-btn--secondary"
          data-testid="calibration-method-confirm"
          onClick={() => patchSpec(v, { methodConfirmed: true }, true)}
          style={{ fontSize: 13.5 }}
        >
          {spec.methodConfirmed
            ? t(locale, "calib.method.confirmed")
            : t(locale, "calib.method.confirm")}
        </button>
      </section>

      {/* 3. Anchors / threshold */}
      {meta.type === "raw" &&
        (spec.method === "direct" || spec.method === "linear") &&
        fuzzyAnchors && (
          <section
            id="calibration-substep-mapping"
            data-testid={spec.method === "linear" ? "calibration-mapping-linear" : "calibration-mapping-direct"}
            style={{ marginBottom: 18 }}
          >
            <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 10px", outline: "none" }}>
              {t(locale, "calib.anchors.title")}
            </h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 0 }}>
              {t(locale, "calib.anchors.qualFirst")}
            </p>
            {(
              [
                ["meaningFullOut", "fullOut", "calib.anchorOut"],
                ["meaningCrossover", "crossover", "calib.anchorCross"],
                ["meaningFullIn", "fullIn", "calib.anchorIn"],
              ] as const
            ).map(([meaningKey, numKey, labKey]) => (
              <div
                key={numKey}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <Field label={`${t(locale, labKey)} — ${t(locale, "calib.anchors.meaning")}`}>
                  <input
                    data-testid={`calibration-anchor-meaning-${numKey}`}
                    style={inputStyle}
                    value={fuzzyAnchors[meaningKey]}
                    onChange={(e) =>
                      patchFuzzyAnchors({ [meaningKey]: e.target.value } as Partial<DirectAnchors>)
                    }
                  />
                </Field>
                <Field label={t(locale, "calib.anchors.raw")}>
                  <input
                    data-testid={`calibration-anchor-value-${numKey}`}
                    type="number"
                    step="any"
                    style={inputStyle}
                    value={fuzzyAnchors[numKey]}
                    onChange={(e) =>
                      patchFuzzyAnchors({ [numKey]: Number(e.target.value) } as Partial<DirectAnchors>)
                    }
                  />
                </Field>
              </div>
            ))}
            {[fuzzyAnchors.fullOut, fuzzyAnchors.crossover, fuzzyAnchors.fullIn].some(
              (value) => !Number.isFinite(value),
            ) && <Diag kind="bad">{t(locale, "calib.anchor.invalid")}</Diag>}
            {new Set([fuzzyAnchors.fullOut, fuzzyAnchors.crossover, fuzzyAnchors.fullIn]).size < 3 && (
              <Diag kind="bad">{t(locale, "calib.anchor.duplicate")}</Diag>
            )}
            {anchorsAscending(fuzzyAnchors, spec.set.highIsMembership) ? (
              <CalibrationCurve
                variable={v}
                anchors={directCurveAnchors!}
                method={spec.method}
                anchorLabelKeys={
                  spec.set.highIsMembership
                    ? ["calib.handle.out", "calib.handle.cross", "calib.handle.in"]
                    : ["calib.handle.in", "calib.handle.cross", "calib.handle.out"]
                }
                values={rawValues}
                highIsMembership={spec.set.highIsMembership}
                rows={caseRows.map((r) => ({
                  label: r.label,
                  f: Number.isFinite(r.m)
                    ? (r.m as number)
                    : (() => {
                        const mapper = spec.method === "linear" ? calibrateLinear : calibrateDirect;
                        const mapped = mapper(r.raw ?? Number.NaN, ...directEngineAnchors!);
                        return spec.set.highIsMembership ? mapped : 1 - mapped;
                      })(),
                }))}
                onAnchorChange={(index, val) =>
                  patchFuzzyAnchors({ [directCurveKeys[index]]: val } as Partial<DirectAnchors>)
                }
              />
            ) : (
              <Diag kind="bad">{t(locale, "calib.badOrder")}</Diag>
            )}
          </section>
        )}

      {meta.type === "raw" && spec.method === "crisp" && spec.crisp && (
        <section id="calibration-substep-mapping" data-testid="calibration-mapping-crisp" style={{ marginBottom: 18 }}>
          <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 10px", outline: "none" }}>
            {t(locale, "calib.crisp.title")}
          </h3>
          <Field label={t(locale, "calib.crisp.meaning")}>
            <textarea
              data-testid="calibration-crisp-meaning"
              style={{ ...inputStyle, minHeight: 56 }}
              value={spec.crisp.meaningInclusion}
              onChange={(e) =>
                patchSpec(v, {
                  crisp: { ...spec.crisp!, meaningInclusion: e.target.value },
                })
              }
            />
          </Field>
          <div style={{ marginTop: 8, maxWidth: 200 }}>
            <Field label={t(locale, "calib.crisp.threshold")}>
              <input
                data-testid="calibration-crisp-threshold"
                type="number"
                step="any"
                style={inputStyle}
                value={spec.crisp.threshold}
                onChange={(e) =>
                  patchSpec(v, {
                    crisp: { ...spec.crisp!, threshold: Number(e.target.value) },
                  })
                }
              />
            </Field>
          </div>
          <CrispStrip
            values={rawValues}
            threshold={spec.crisp.threshold}
            highIsMembership={spec.set.highIsMembership}
          />
        </section>
      )}

      <section
        id={meta.type !== "raw" || !spec.method ? "calibration-substep-mapping" : undefined}
        style={{ marginBottom: 18 }}
      >
        <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 10px", outline: "none" }}>
          {t(locale, "calib.missing.title")}
        </h3>
        <div style={{ maxWidth: 320 }}>
          <Field label={t(locale, "calib.missing.policy")}>
            <select
              data-testid="calibration-missing-policy"
              style={inputStyle}
              value={spec.missing.kind}
              onChange={(event) => {
                const kind = event.target.value as CalibrationSpec["missing"]["kind"];
                patchSpec(v, {
                  missing:
                    kind === "assign"
                      ? { kind: "assign", membership: 0 }
                      : { kind },
                });
              }}
            >
              <option value="exclude_case">{t(locale, "calib.missing.exclude")}</option>
              <option value="assign">{t(locale, "calib.missing.assign")}</option>
              <option value="leave_unresolved">{t(locale, "calib.missing.unresolved")}</option>
            </select>
          </Field>
        </div>
        {spec.missing.kind === "assign" && (
          <div style={{ maxWidth: 160, marginTop: 8 }}>
            <Field label={t(locale, "calib.missing.membership")}>
              <select
                style={inputStyle}
                value={spec.missing.membership}
                onChange={(event) =>
                  patchSpec(v, {
                    missing: {
                      kind: "assign",
                      membership: Number(event.target.value) as 0 | 1,
                    },
                  })
                }
              >
                <option value="0">0</option>
                <option value="1">1</option>
              </select>
            </Field>
          </div>
        )}
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 0 }}>
          {t(locale, "calib.missing.help")}
        </p>
      </section>

      {/* 4. Evidence + status */}
      <div
        data-testid="calibration-evidence-coverage"
        style={{
          padding: "9px 11px",
          marginBottom: 10,
          borderRadius: 8,
          border: `1px solid ${
            readiness.missingEvidence.length ? "var(--warn-wash)" : "var(--line-soft)"
          }`,
          background: readiness.missingEvidence.length ? "var(--warn-wash)" : "transparent",
          fontSize: 13.5,
        }}
      >
        <strong>{t(locale, "calib.evidence.coverage")}</strong>{" "}
        {readiness.missingEvidence.length === 0
          ? t(locale, "calib.evidence.coverageComplete")
          : t(locale, "calib.evidence.coverageMissing", {
              targets: readiness.missingEvidence
                .map((target) => t(locale, `calib.evidence.target.${target}` as DictKey))
                .join(", "),
            })}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
            marginTop: 8,
          }}
        >
          {evidenceTargets.map((target) => {
            const supported = !readiness.missingEvidence.includes(target);
            return (
              <span
                key={target}
                data-testid={`calibration-evidence-target-${target}`}
                data-supported={supported ? "true" : "false"}
                style={{
                  padding: "3px 7px",
                  borderRadius: 999,
                  border: `1px solid ${supported ? "var(--good)" : "var(--warn-text)"}`,
                  color: supported ? "var(--good-text)" : "var(--warn-text)",
                  fontSize: 11,
                }}
              >
                {t(locale, `calib.evidence.target.${target}` as DictKey)} ·{" "}
                {t(locale, supported ? "calib.evidence.targetSupported" : "calib.evidence.targetMissing")}
              </span>
            );
          })}
        </div>
      </div>
      {hasEmpiricalDiagnostic && (
        <div data-testid="calibration-evidence-diagnostic-warning" style={{ marginBottom: 10 }}>
          <Diag kind="warn">{t(locale, "calib.evidence.diagnosticWarning")}</Diag>
        </div>
      )}
      <section id="calibration-substep-evidence" style={{ marginBottom: 18 }}>
        <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 10px", outline: "none" }}>
          {t(locale, "calib.evidence.title")}
        </h3>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 0 }}>
          {t(locale, "calib.evidence.help")}
        </p>
        {spec.evidence.map((ev, idx) => (
          <div
            key={ev.id}
            data-testid={`calibration-evidence-row-${idx}`}
            style={{
              border: "1px solid var(--line-soft)",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 8,
              }}
            >
              <Field label={t(locale, "calib.evidence.type")}>
                <select
                  data-testid={`calibration-evidence-type-${idx}`}
                  value={ev.type}
                  onChange={(e) => {
                    const type = e.target.value as EvidenceType;
                    const list = [...spec.evidence];
                    list[idx] = {
                      ...ev,
                      type,
                      isSubstantive: type !== "empirical_diagnostic",
                    };
                    patchSpec(v, { evidence: list });
                  }}
                >
                  {(
                    [
                      "literature",
                      "theory",
                      "standard",
                      "domain_expertise",
                      "case_knowledge",
                      "empirical_diagnostic",
                    ] as EvidenceType[]
                  ).map((tp) => (
                    <option key={tp} value={tp}>
                      {t(locale, `calib.evidence.type.${tp}` as DictKey)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t(locale, "calib.evidence.supports")}>
                <select
                  data-testid={`calibration-evidence-support-${idx}`}
                  value={ev.supports}
                  onChange={(e) => {
                    const list = [...spec.evidence];
                    list[idx] = {
                      ...ev,
                      supports: e.target.value as typeof ev.supports,
                    };
                    patchSpec(v, { evidence: list });
                  }}
                >
                  {["set", "fullOut", "crossover", "fullIn", "threshold", "method"].map((target) => (
                    <option key={target} value={target}>
                      {t(locale, `calib.evidence.target.${target}` as DictKey)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {(ev.type === "empirical_diagnostic" || !ev.isSubstantive) && (
              <p style={{ fontSize: 13.5, color: "#b26a00", margin: "6px 0" }}>
                {t(locale, "calib.evidence.diagnosticNote")}
              </p>
            )}
            <Field label={t(locale, "calib.evidence.note")}>
              <textarea
                data-testid={`calibration-evidence-note-${idx}`}
                value={ev.note}
                onChange={(e) => {
                  const list = [...spec.evidence];
                  list[idx] = { ...ev, note: e.target.value };
                  patchSpec(v, { evidence: list });
                }}
              />
            </Field>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 6,
                marginTop: 6,
              }}
            >
              {(
                [
                  ["authors", "calib.evidence.authors"],
                  ["year", "calib.evidence.year"],
                  ["title", "calib.evidence.titleField"],
                  ["doiOrUrl", "calib.evidence.doi"],
                  ["pages", "calib.evidence.pages"],
                ] as const
              ).map(([k, lab]) => (
                <Field key={k} label={t(locale, lab)}>
                  <input
                    data-testid={
                      k === "doiOrUrl" ? `calibration-evidence-doi-${idx}` : `calibration-evidence-${k}-${idx}`
                    }
                    value={ev.citation[k] ?? ""}
                    onChange={(e) => {
                      const list = [...spec.evidence];
                      list[idx] = {
                        ...ev,
                        citation: { ...ev.citation, [k]: e.target.value },
                      };
                      patchSpec(v, { evidence: list });
                    }}
                  />
                </Field>
              ))}
            </div>
            <button
              type="button"
              className="oq-btn oq-btn--secondary"
              style={{ marginTop: 8, fontSize: 13.5 }}
              onClick={() =>
                patchSpec(v, {
                  evidence: spec.evidence.filter((x) => x.id !== ev.id),
                })
              }
            >
              {t(locale, "calib.evidence.remove")}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="oq-btn oq-btn--secondary"
          data-testid="calibration-evidence-add"
          style={{ fontSize: 13.5 }}
          onClick={() =>
            patchSpec(v, {
              evidence: [
                ...spec.evidence,
                {
                  id: newEvidenceId(),
                  type: "theory",
                  supports: "set",
                  citation: {},
                  note: "",
                  isSubstantive: true,
                },
              ],
            })
          }
        >
          {t(locale, "calib.evidence.add")}
        </button>
        <div style={{ maxWidth: 300, marginTop: 12 }}>
          <Field label={t(locale, "calib.status.label")}>
            <select
              style={inputStyle}
              value={spec.status}
              onChange={(event) =>
                patchSpec(v, {
                  status: event.target.value as CalibrationSpec["status"],
                })
              }
            >
              <option value="unresolved">{t(locale, "calib.status.unresolved")}</option>
              <option value="provisional">{t(locale, "calib.status.provisional")}</option>
              <option value="externally_checked">{t(locale, "calib.status.external")}</option>
              <option value="sourced">{t(locale, "calib.status.sourced")}</option>
            </select>
          </Field>
        </div>
        {spec.status === "externally_checked" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 8,
              marginTop: 8,
            }}
          >
            <Field label={t(locale, "calib.status.reviewer")}>
              <input
                style={inputStyle}
                value={spec.externalReview?.reviewer ?? ""}
                onChange={(event) =>
                  patchSpec(v, {
                    externalReview: {
                      reviewer: event.target.value,
                      date: spec.externalReview?.date ?? "",
                      note: spec.externalReview?.note ?? "",
                    },
                  })
                }
              />
            </Field>
            <Field label={t(locale, "calib.status.date")}>
              <input
                type="date"
                style={inputStyle}
                value={spec.externalReview?.date ?? ""}
                onChange={(event) =>
                  patchSpec(v, {
                    externalReview: {
                      reviewer: spec.externalReview?.reviewer ?? "",
                      date: event.target.value,
                      note: spec.externalReview?.note ?? "",
                    },
                  })
                }
              />
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label={t(locale, "calib.status.note")}>
                <textarea
                  style={{ ...inputStyle, minHeight: 48, resize: "vertical" }}
                  value={spec.externalReview?.note ?? ""}
                  onChange={(event) =>
                    patchSpec(v, {
                      externalReview: {
                        reviewer: spec.externalReview?.reviewer ?? "",
                        date: spec.externalReview?.date ?? "",
                        note: event.target.value,
                      },
                    })
                  }
                />
              </Field>
            </div>
          </div>
        )}
      </section>

      {/* 5. Case table */}
      <section id="calibration-substep-cases" style={{ marginBottom: 18 }}>
        <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 10px", outline: "none" }}>
          {t(locale, "calib.cases.title")}
        </h3>
        <CaseMembershipTable
          rows={caseRows}
          anchors={
            (spec.method === "direct" || spec.method === "linear") && fuzzyAnchors
              ? [fuzzyAnchors.fullOut, fuzzyAnchors.crossover, fuzzyAnchors.fullIn]
              : spec.method === "crisp" && spec.crisp
                ? [spec.crisp.threshold]
                : []
          }
          exceptional={spec.exceptionalCases}
          onExceptional={(rowIndex, caseLabel, note) => {
            const rest = spec.exceptionalCases.filter(
              (x) =>
                !(
                  x.caseLabel === caseLabel &&
                  (x.rowIndex === rowIndex || x.rowIndex === undefined)
                ),
            );
            patchSpec(v, {
              exceptionalCases: note.trim()
                ? [...rest, { rowIndex, caseLabel, note }]
                : rest,
            });
          }}
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
            fontSize: 13.5,
          }}
        >
          <input
            type="checkbox"
            data-testid="calibration-case-review"
            checked={spec.caseReviewConfirmed}
            onChange={(event) => patchSpec(v, { caseReviewConfirmed: event.target.checked }, true)}
          />
          {t(locale, "calib.cases.review")}
        </label>
      </section>

      {/* Diagnostics */}
      {memberships.some((m) => m !== undefined) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {(() => {
            const rows = caseRows.filter((r) => Number.isFinite(r.m));
            const atHalf = rows.filter((r) => Math.abs((r.m as number) - 0.5) < 1e-6);
            const hi = rows.filter((r) => (r.m as number) > 0.5).length;
            const lo = rows.filter((r) => (r.m as number) < 0.5).length;
            return (
              <>
                {atHalf.length ? (
                  <Diag kind="bad">
                    <b>{t(locale, "calib.atHalf.count", { n: atHalf.length })}</b>{" "}
                    {t(locale, "calib.atHalf.rest", {
                      labels: atHalf.map((r) => r.label).join(", "),
                    })}
                  </Diag>
                ) : (
                  <Diag kind="ok">
                    <b>{t(locale, "calib.atHalf.okBold")}</b> {t(locale, "calib.atHalf.okRest")}
                  </Diag>
                )}
                {rows.length > 0 && (hi / rows.length >= 0.85 || hi / rows.length <= 0.15) ? (
                  <Diag kind="warn">
                    <b>{t(locale, "calib.skew.bold")}</b>{" "}
                    {t(locale, "calib.skew.rest", { hi, total: rows.length })}
                  </Diag>
                ) : (
                  <Diag kind="ok">
                    <b>{t(locale, "calib.skew.okBold")}</b>{" "}
                    {t(locale, "calib.skew.okRest", { hi, lo })}
                  </Diag>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* 6. Sensitivity */}
      {meta.type === "raw" && conditions.length > 0 && outcome ? (
        (((spec.method === "direct" || spec.method === "linear") &&
          !!fuzzyAnchors &&
          anchorsAscending(fuzzyAnchors, spec.set.highIsMembership)) ||
          (spec.method === "crisp" && !!spec.crisp && Number.isFinite(spec.crisp.threshold))) ? (
          <AnchorSensitivityPanel
            id="calibration-substep-sensitivity"
            focusCol={v}
            isOutcome={isOutcome}
            baseThresholds={
              directEngineAnchors ??
              (spec.crisp && Number.isFinite(spec.crisp.threshold) ? [spec.crisp.threshold] : [])
            }
            variants={sensitivity.variantsByColumn[v] ?? []}
            freqCut={freqCut}
            consCut={consCut}
            rows={sensitivity.resultsByColumn[v] ?? []}
            alternatives={spec.sensitivity.alternatives}
            notes={spec.sensitivity.notes}
            reviewed={spec.sensitivity.reviewed}
            onAlternativeChange={(index, patch) =>
              patchSpec(
                v,
                {
                  sensitivity: {
                    ...spec.sensitivity,
                    alternatives: spec.sensitivity.alternatives.map((alternative, current) =>
                      current === index ? { ...alternative, ...patch } : alternative,
                    ),
                  },
                },
              )
            }
            onNotesChange={(value) =>
              patchSpec(v, { sensitivity: { ...spec.sensitivity, notes: value } })
            }
            onReviewed={(value) =>
              patchSpec(v, { sensitivity: { ...spec.sensitivity, reviewed: value } }, true)
            }
            onAddAlternative={() =>
              patchSpec(v, {
                sensitivity: {
                  ...spec.sensitivity,
                  alternatives: [
                    ...spec.sensitivity.alternatives,
                    {
                      id: `alternative-${spec.sensitivity.alternatives.length + 1}`,
                      label: "",
                      delta: 0,
                      rationale: "",
                    },
                  ],
                },
              })
            }
          />
        ) : (
          <section id="calibration-substep-sensitivity" style={{ marginBottom: 12 }}>
            <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 8px", outline: "none" }}>
              {t(locale, "calib.sens.title")}
            </h3>
            <Diag kind="warn">{t(locale, "calib.sens.waitForMapping")}</Diag>
          </section>
        )
      ) : meta.type === "raw" ? (
        <section id="calibration-substep-sensitivity" style={{ marginBottom: 12 }}>
          <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 8px", outline: "none" }}>
            {t(locale, "calib.sens.title")}
          </h3>
          <Diag kind="warn">{t(locale, "calib.sens.waitForAnalysis")}</Diag>
        </section>
      ) : null}

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line-soft)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "var(--ai)",
            }}
          >
            {t(locale, "calib.ai.badge")}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{t(locale, "calib.ai.plan")}</span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <AiAssist
            task="anchors"
            label={t(locale, "calib.ai.anchors")}
            needsContext
            getData={() => {
              const sorted = [...rawValues].filter(Number.isFinite).sort((a, b) => a - b);
              return {
                variable: v,
                min: sorted[0],
                median: sorted[Math.floor(sorted.length / 2)],
                max: sorted[sorted.length - 1],
              };
            }}
          />
          <AiAssist
            task="methods"
            label={t(locale, "calib.ai.methods")}
            needsContext
            getData={() => ({
              variable: v,
              anchors:
                fuzzyAnchors
                  ? `${fuzzyAnchors.fullOut} / ${fuzzyAnchors.crossover} / ${fuzzyAnchors.fullIn}`
                  : String(spec.crisp?.threshold ?? ""),
              total: caseRows.length,
              inside: caseRows.filter((r) => (r.m as number) > 0.5).length,
            })}
          />
        </div>
      </div>
    </Card>
  );
}

function badgeLabelKey(key: string): DictKey {
  return key as DictKey;
}

function CaseMembershipTable({
  rows,
  anchors,
  exceptional,
  onExceptional,
}: {
  rows: {
    rowIndex: number;
    label: string;
    raw: number | null;
    m: number | undefined;
    side: string;
    flags: string[];
  }[];
  anchors: number[];
  exceptional: { caseLabel: string; note: string; rowIndex?: number }[];
  onExceptional: (rowIndex: number, caseLabel: string, note: string) => void;
}) {
  const [locale] = useLocale();
  const sorted = [...rows].sort((a, b) => {
    const am = Number.isFinite(a.m) ? Math.abs((a.m as number) - 0.5) : 999;
    const bm = Number.isFinite(b.m) ? Math.abs((b.m as number) - 0.5) : 999;
    return am - bm;
  });
  const rowCounts = new Map<string, number>();
  rows.forEach((row) => rowCounts.set(row.label, (rowCounts.get(row.label) ?? 0) + 1));
  const notesByRow = new Map<number, string>();
  const legacyNotesByLabel = new Map<string, string>();
  exceptional.forEach((entry) => {
    if (typeof entry.rowIndex === "number") notesByRow.set(entry.rowIndex, entry.note);
    else legacyNotesByLabel.set(entry.caseLabel, entry.note);
  });
  const noteForRow = (row: { rowIndex: number; label: string }) =>
    notesByRow.get(row.rowIndex) ??
    (rowCounts.get(row.label) === 1 ? legacyNotesByLabel.get(row.label) : undefined) ??
    "";
  const diagnosticCounts = {
    missing: rows.filter((row) => row.flags.some((flag) => flag === "missing" || flag === "unresolved")).length,
    boundary: rows.filter((row) => row.flags.includes("raw-anchor-boundary")).length,
    exact: rows.filter((row) => row.flags.includes("exact-crossover")).length,
    near: rows.filter((row) => row.flags.includes("near-crossover")).length,
    duplicate: rows.filter((row) => row.flags.includes("duplicate-case-label")).length,
    outOfRange: rows.filter((row) => row.flags.includes("out-of-range")).length,
  };

  return (
    <div data-testid="calibration-case-table" style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
      <p
        data-testid="calibration-case-summary"
        style={{ margin: 0, padding: "9px 10px", color: "var(--muted)", fontSize: 13.5, lineHeight: 1.5 }}
      >
        {t(locale, "calib.cases.summary", diagnosticCounts)}
      </p>
    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
        <thead>
          <tr>
            {[
              "calib.cases.case",
              "calib.cases.raw",
              "calib.cases.m",
              "calib.cases.side",
              "calib.cases.flags",
              "calib.cases.note",
            ].map((k) => (
              <th
                key={k}
                style={{
                  textAlign: "left",
                  fontSize: 11,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  fontWeight: 700,
                  padding: "8px 10px",
                  borderBottom: "1px solid var(--line)",
                  background: "var(--panel-2)",
                }}
              >
                {t(locale, k as DictKey)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const missing = r.m === undefined || !Number.isFinite(r.m);
            const m = r.m as number;
            const flags = r.flags.length
              ? r.flags
              : missing
                ? ["missing"]
                : anchors.some((anchor) => r.raw !== null && Math.abs(r.raw - anchor) < 1e-9)
                  ? ["raw-anchor-boundary"]
                  : [];
            const side = missing ? "missing" : r.side;
            const localizedFlags = flags.map((flag) => t(locale, flagTranslationKey(flag)));
            return (
              <tr key={`${r.label}-${r.rowIndex}`}>
                <td style={td()}>{r.label}</td>
                <td style={td(true)}>{Number.isFinite(r.raw) ? String(r.raw) : "—"}</td>
                <td style={td(true)}>{missing ? "—" : fmt(m, 3)}</td>
                <td style={td()}>
                  {t(
                    locale,
                    side === "in"
                      ? "calib.side.in"
                      : side === "out"
                        ? "calib.side.out"
                        : side === "half"
                          ? "calib.side.half"
                          : "calib.side.missing",
                  )}
                </td>
                <td style={td()}>{localizedFlags.join(", ") || "—"}</td>
                <td style={td()}>
                  <input
                    style={{ ...inputStyle, padding: "3px 6px", fontSize: 12 }}
                    value={noteForRow(r)}
                    onChange={(e) => onExceptional(r.rowIndex, r.label, e.target.value)}
                    placeholder="…"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function td(num = false): React.CSSProperties {
  return {
    padding: "5px 10px",
    borderBottom: "1px solid var(--line-soft)",
    textAlign: num ? "right" : "left",
    fontVariantNumeric: num ? "tabular-nums" : undefined,
    whiteSpace: "nowrap",
  };
}

function CrispStrip({
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

function AnchorSensitivityPanel({
  id,
  focusCol,
  isOutcome,
  baseThresholds,
  variants,
  freqCut,
  consCut,
  rows,
  alternatives,
  notes,
  reviewed,
  onAlternativeChange,
  onNotesChange,
  onReviewed,
  onAddAlternative,
}: {
  id: string;
  focusCol: string;
  isOutcome: boolean;
  baseThresholds: number[];
  variants: { id: string; rationale?: string }[];
  freqCut: number;
  consCut: number;
  rows: CalibrationSensitivityResultWithRows[];
  alternatives: SensitivityAlternative[];
  notes: string;
  reviewed: boolean;
  onAlternativeChange: (index: number, patch: Partial<SensitivityAlternative>) => void;
  onNotesChange: (value: string) => void;
  onReviewed: (value: boolean) => void;
  onAddAlternative: () => void;
}) {
  const [locale] = useLocale();

  return (
    <section id={id} style={{ marginBottom: 12 }} data-testid="calibration-sensitivity">
      <h3 tabIndex={-1} style={{ fontSize: 15, margin: "0 0 8px", outline: "none" }}>
        {t(locale, "calib.sens.title")}
      </h3>
      <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 0 }}>
        {t(locale, "calib.sens.help", { col: focusCol })}
      </p>
      {isOutcome && (
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 0 }}>
          {t(locale, "calib.sens.outcomeHelp")}
        </p>
      )}
      <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 0 }}>
        {t(locale, "calib.sens.cutoffs", {
          freq: fmt(freqCut, 3),
          cons: fmt(consCut, 3),
        })}
      </p>
      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        {alternatives.map((alternative, index) => (
          <div
            key={alternative.id}
            style={{
              border: "1px solid var(--line-soft)",
              borderRadius: 8,
              padding: 10,
              display: "grid",
              gridTemplateColumns: "minmax(140px, 1fr) 120px",
              gap: 8,
            }}
          >
            <Field label={t(locale, "calib.sens.altLabel")}>
              <input
                data-testid={`calibration-sensitivity-label-${index}`}
                style={inputStyle}
                value={alternative.label}
                onChange={(event) => onAlternativeChange(index, { label: event.target.value })}
              />
            </Field>
            <Field label={t(locale, "calib.sens.delta")}>
              <input
                data-testid={`calibration-sensitivity-delta-${index}`}
                type="number"
                step="any"
                style={inputStyle}
                value={alternative.delta}
                onChange={(event) =>
                  onAlternativeChange(index, { delta: Number(event.target.value) })
                }
              />
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label={t(locale, "calib.sens.rationale")}>
                <textarea
                  data-testid={`calibration-sensitivity-rationale-${index}`}
                  style={{ ...inputStyle, minHeight: 48, resize: "vertical" }}
                  value={alternative.rationale}
                  onChange={(event) =>
                    onAlternativeChange(index, { rationale: event.target.value })
                  }
                />
              </Field>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="oq-btn oq-btn--secondary"
          style={{ justifySelf: "start", fontSize: 13.5 }}
          onClick={onAddAlternative}
          data-testid="calibration-sensitivity-add"
        >
          {t(locale, "calib.sens.add")}
        </button>
        <Field label={t(locale, "calib.sens.notes")}>
          <textarea
            style={{ ...inputStyle, minHeight: 48, resize: "vertical" }}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
          />
        </Field>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
          <input
            type="checkbox"
            data-testid="calibration-sensitivity-review"
            checked={reviewed}
            onChange={(event) => onReviewed(event.target.checked)}
          />
          {t(locale, "calib.sens.review")}
        </label>
      </div>
      {rows.length === 0 ? (
        <Diag kind="warn">{t(locale, "calib.sens.noResults")}</Diag>
      ) : (
        <>
          <div
            data-testid="calibration-sensitivity-fit"
            style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}
          >
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
              <thead>
                <tr>
                  {[
                    "calib.sens.variant",
                    "calib.sens.membershipChanges",
                    "calib.sens.half",
                    "calib.sens.truthChanges",
                    "calib.sens.caseChanges",
                    "calib.sens.fit",
                    "calib.sens.solChanged",
                  ].map((key) => (
                    <th
                      key={key}
                      style={{
                        textAlign: "left",
                        fontSize: 11,
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        padding: "8px 10px",
                        borderBottom: "1px solid var(--line)",
                        background: "var(--panel-2)",
                      }}
                    >
                      {t(locale, key as DictKey)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const alternative = variants.find((variant) => variant.id === row.variantId);
                  const detailId = row.variantId.replace(/[^a-zA-Z0-9_-]/g, "-");
                  return (
                    <tr key={row.variantId}>
                      <td style={td()} title={alternative?.rationale || undefined}>{row.label}</td>
                      <td style={td(true)}>{row.flips.length}</td>
                      <td style={td(true)}>{row.flips.filter((flip) => flip.crossedHalf).length}</td>
                      <td style={td(true)}>{row.truthTableRowChanges.length}</td>
                      <td
                        data-testid={`calibration-sensitivity-case-changes-${detailId}`}
                        style={td(true)}
                      >
                        {row.caseClassificationChanges.length}
                      </td>
                      <td data-testid={`calibration-sensitivity-fit-${detailId}`} style={td()}>
                        {fmt(row.baseFit.consistency)} → {fmt(row.variantFit.consistency)} /{" "}
                        {fmt(row.baseFit.coverage)} → {fmt(row.variantFit.coverage)}
                      </td>
                      <td style={td()}>
                        {row.solutionChanged
                          ? t(locale, "calib.sens.yes")
                          : t(locale, "calib.sens.no")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p
            data-testid="calibration-sensitivity-case-changes"
            style={{ fontSize: 13.5, marginTop: 10 }}
          >
            {t(locale, "calib.sens.caseChanges")}:{" "}
            {rows.reduce((count, row) => count + row.caseClassificationChanges.length, 0)}
          </p>
          <p style={{ fontSize: 13.5, marginTop: 10 }}>
            {rows.some((row) => row.flips.some((flip) => flip.crossedHalf) || row.solutionChanged)
              ? t(locale, "calib.sens.unstable")
              : t(locale, "calib.sens.stable")}
          </p>
          {rows.map((row) => {
            const detailId = row.variantId.replace(/[^a-zA-Z0-9_-]/g, "-");
            const alternative = variants.find((variant) => variant.id === row.variantId);
            return (
              <details
                key={`details-${row.variantId}`}
                data-testid={`calibration-sensitivity-details-${detailId}`}
                style={{
                  borderTop: "1px solid var(--line-soft)",
                  padding: "8px 0",
                  fontSize: 13.5,
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  {t(locale, "calib.sens.details")}: {row.label}
                </summary>
                <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
                  <div>
                    <strong>{t(locale, "calib.sens.thresholds")}:</strong>{" "}
                    {focusCol}: {baseThresholds.map((value) => fmt(value, 3)).join(" / ")} →{" "}
                    {row.variantThresholdsByCondition[focusCol]?.map((value) => fmt(value, 3)).join(" / ") || "—"}
                  </div>
                  {alternative?.rationale && <div>{alternative.rationale}</div>}
                  <div>
                    {t(locale, "calib.sens.baseFit", {
                      cons: fmt(row.baseFit.consistency),
                      cov: fmt(row.baseFit.coverage),
                    })}
                    {" · "}
                    {t(locale, "calib.sens.variantFit", {
                      cons: fmt(row.variantFit.consistency),
                      cov: fmt(row.variantFit.coverage),
                    })}
                  </div>
                  <div>
                    <strong>{row.baseSolutionExpression || "—"}</strong> →{" "}
                    <strong>{row.variantSolutionExpression || "—"}</strong>
                  </div>
                  {row.caseClassificationChanges.length === 0 ? (
                    <div>{t(locale, "calib.sens.noCaseChanges")}</div>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {row.caseClassificationChanges.slice(0, 8).map((change) => (
                        <li key={`${row.variantId}-${change.caseLabel}-${change.rowIndex}`}>
                          {t(locale, "calib.sens.caseChange", {
                            caseLabel: `${change.caseLabel} (${t(locale, "proto.row")} ${change.rowIndex + 1})`,
                            baseBits: change.base.conditionBits,
                            variantBits: change.variant.conditionBits,
                            baseOutcome: change.base.outcomeSide,
                            variantOutcome: change.variant.outcomeSide,
                            baseRow: String(change.base.rowOutput ?? "—"),
                            variantRow: String(change.variant.rowOutput ?? "—"),
                          })}
                        </li>
                      ))}
                    </ul>
                  )}
                  {row.caseClassificationChanges.length > 8 && (
                    <div style={{ color: "var(--muted)" }}>
                      {t(locale, "calib.sens.truncated", {
                        n: row.caseClassificationChanges.length - 8,
                      })}
                    </div>
                  )}
                </div>
              </details>
            );
          })}
          {rows.some((row) => row.flips.some((flip) => flip.crossedHalf)) && (
            <div style={{ marginTop: 8 }}>
              <strong style={{ fontSize: 13.5 }}>{t(locale, "calib.sens.flipList")}</strong>
              <ul style={{ fontSize: 13.5, margin: "6px 0" }}>
                {rows.flatMap((row) =>
                  row.flips
                    .filter((flip) => flip.crossedHalf)
                    .slice(0, 6)
                    .map((flip) => (
                      <li key={`${row.variantId}-${flip.caseLabel}-${flip.rowIndex}-${flip.condition}`}>
                        {row.label}: {flip.caseLabel} ({t(locale, "proto.row")} {flip.rowIndex + 1}) / {flip.condition}:{" "}
                        {fmt(flip.baseMembership, 3)} → {fmt(flip.variantMembership, 3)}
                      </li>
                    )),
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function CalibrationCurve({
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

