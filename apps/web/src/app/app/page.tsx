"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  buildTruthTable,
  complexSolution,
  parsimoniousSolution,
  intermediateSolution,
  necessityAnalysis,
  type TruthTableResult,
  type Expectation,
} from "@openqca/engine";
import { DEMO, type RawDataset } from "@/lib/demo";
import { parseCsv } from "@/lib/csv";
import { parseXlsxToDataset } from "@/lib/xlsx";
import { AccountButton, CloudSaveLoad } from "@/components/cloud";
import { XyPlot } from "@/components/XyPlot";
import { Descriptives } from "@/components/Descriptives";
// Onboarding-Karte entfernt: Der 6-Schritte-Stepper + Tour + Glossar ersetzen sie
// (die alte Karte sprach widersprüchlich von „drei Schritten").
import { Glossary } from "@/components/Glossary";
import { GuidedTour, type GuidedTourStep } from "@/components/GuidedTour";
import { ExampleDatasets } from "@/components/ExampleDatasets";
import { RobustnessPanel } from "@/components/RobustnessPanel";
import NegatedOutcomePanel from "@/components/NegatedOutcomePanel";
import { ReportButton } from "@/components/ReportButton";
import { type ReportInput } from "@/lib/report";
import { useLocale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";
import { LanguageToggle } from "@/components/LanguageToggle";
import { InfoHint } from "@/components/InfoHint";
import { Kpi as UiKpi, SectionHeading } from "@/components/ui";
import { CalibrationWorkbench } from "@/components/calibration/CalibrationWorkbench";
import {
  anchorsFromSpecs,
  migrateSpecsFromAnchors,
  specIsAnalysisReady,
  specIsComputable,
  specIsProtocolReady,
  type CalibSpecs,
} from "@/lib/calibration-model";
import { numericColumns, numericValues } from "@/lib/dataset-columns";
import {
  buildSensitivityBundle,
  evaluateCalibration,
  type CalibrationEvaluation,
  type SensitivityBundle,
} from "@/lib/calibration-analysis";
import {
  buildRScript,
  buildRawCsv,
  buildCalibrationProtocolJson,
  buildCalibrationNarrative,
  downloadText,
  RAW_DATA_FILENAME,
} from "@/lib/protocol-export";

/** Datenart je numerischer Spalte: Rohwert (muss kalibriert werden), bereits Fuzzy, oder Crisp. */
type VarType = "raw" | "fuzzy" | "crisp";
/** Rolle je Spalte in der Analyse. */
type VarRole = "condition" | "outcome" | "ignore";
interface VarMeta {
  type: VarType;
  role: VarRole;
}

interface SavedState {
  dataset: RawDataset;
  anchors: Anchors;
  varMeta?: Record<string, VarMeta>;
  calibSpecs?: CalibSpecs;
  demoMode?: boolean;
  // Ältere Speicherstände hielten Bedingungen/Outcome (mit fs_-Präfix) direkt —
  // werden beim Laden bewusst ignoriert und aus varMeta neu abgeleitet.
  conditions?: string[];
  outcome?: string;
  freqCut: number;
  consCut: number;
}

type Anchors = Record<string, [number, number, number]>;
type SolBundle = {
  complex: ReturnType<typeof complexSolution>;
  intermediate: ReturnType<typeof intermediateSolution>;
  parsimonious: ReturnType<typeof parsimoniousSolution>;
};

const fmt = (v: number, d = 3) =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(d).replace(".", ",");

/** Zustand eines Stepper-Schritts: erledigt / aktiv (bereit) / gesperrt. */
type StepStatus = "done" | "active" | "locked";
/** Gesperrt wenn Voraussetzung fehlt, sonst erledigt wenn fertig, sonst aktiv. */
function statusOf(unlocked: boolean, done: boolean): StepStatus {
  if (!unlocked) return "locked";
  return done ? "done" : "active";
}


/** Numerische Werte einer Spalte (NaN herausgefiltert). */

/**
 * Datenart einer numerischen Spalte automatisch erkennen:
 * - alle Werte ∈ {0,1} → "crisp"
 * - alle Werte ∈ [0,1] (mind. ein Nicht-0/1-Wert) → "fuzzy"
 * - sonst → "raw"
 */
function detectVarType(values: number[]): VarType {
  if (values.length === 0) return "raw";
  const all01 = values.every((v) => v === 0 || v === 1);
  if (all01) return "crisp";
  const allUnit = values.every((v) => v >= 0 && v <= 1);
  return allUnit ? "fuzzy" : "raw";
}


/**
 * Ist eine Spalte mit Datenart + Kalibrierungsspezifikation als Set nutzbar?
 */
function isColUsable(
  type: VarType,
  values: number[],
  col: string,
  calibSpecs: CalibSpecs,
): boolean {
  if (!specIsComputable(calibSpecs[col], type)) return false;
  if (type === "crisp") return values.every((v) => v === 0 || v === 1);
  if (type === "fuzzy") return values.every((v) => v >= 0 && v <= 1);
  return true;
}

/** Auto-Ableitung des Variablen-Metamodells: Datenart erkennen, Rollen heuristisch vorbelegen. */
function deriveVarMeta(ds: RawDataset): Record<string, VarMeta> {
  const cols = numericColumns(ds);
  const meta: Record<string, VarMeta> = {};
  const outcomeCol = cols.length ? cols[cols.length - 1] : "";
  let conditionBudget = 3;
  cols.forEach((col) => {
    const type = detectVarType(numericValues(ds, col));
    let role: VarRole;
    if (col === outcomeCol) {
      role = "outcome";
    } else if (conditionBudget > 0) {
      role = "condition";
      conditionBudget--;
    } else {
      role = "ignore";
    }
    meta[col] = { type, role };
  });
  return meta;
}

/** Anker nur der Roh-Variablen mit gültiger direkter Kalibrierung — für Bericht. */
function rawAnchorsOf(ds: RawDataset, varMeta: Record<string, VarMeta>, calibSpecs: CalibSpecs): Anchors {
  return anchorsFromSpecs(
    Object.fromEntries(
      Object.entries(calibSpecs).filter(
        ([col, s]) =>
          varMeta[col]?.type === "raw" &&
          varMeta[col]?.role !== "ignore" &&
          s.method === "direct" &&
          s.direct,
      ),
    ),
  );
}

export default function Home() {
  const [locale] = useLocale();
  const [ds, setDs] = useState<RawDataset | null>(null);
  const [anchors, setAnchors] = useState<Anchors>({});
  const [calibSpecs, setCalibSpecs] = useState<CalibSpecs>({});
  // Synthetic demo data may illustrate the full calculation chain, but it is
  // never treated as a research-ready export.
  const [demoMode, setDemoMode] = useState(false);
  const [calibMigrateBanner, setCalibMigrateBanner] = useState(false);
  const [varMeta, setVarMeta] = useState<Record<string, VarMeta>>({});
  const [focusVar, setFocusVar] = useState<string>("");
  const [freqCut, setFreqCut] = useState(1);
  const [consCut, setConsCut] = useState(0.8);
  const [xyCond, setXyCond] = useState("");
  const [expectations, setExpectations] = useState<Record<string, Expectation>>({});
  // Geführte Beispiel-Tour: null = aus, sonst Index der aktiven Station.
  const [tourStep, setTourStep] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const tourSteps: GuidedTourStep[] = useMemo(
    () => [
      { targetId: "daten", title: t(locale, "tour.s1.title"), body: t(locale, "tour.s1.body") },
      { targetId: "variablen", title: t(locale, "tour.s2.title"), body: t(locale, "tour.s2.body") },
      { targetId: "kalibrierung", title: t(locale, "tour.s3.title"), body: t(locale, "tour.s3.body") },
      { targetId: "notwendigkeit", title: t(locale, "tour.s4.title"), body: t(locale, "tour.s4.body") },
      { targetId: "truthtable", title: t(locale, "tour.s5.title"), body: t(locale, "tour.s5.body") },
      { targetId: "loesungen", title: t(locale, "tour.s6.title"), body: t(locale, "tour.s6.body") },
      { targetId: "protokoll", title: t(locale, "tour.s7.title"), body: t(locale, "tour.s7.body") },
    ],
    [locale],
  );

  function firstRawFocus(dataset: RawDataset, meta: Record<string, VarMeta>): string {
    return (
      numericColumns(dataset).find((c) => meta[c]?.type === "raw" && meta[c]?.role !== "ignore") ?? ""
    );
  }

  function applyDataset(dataset: RawDataset, options: { demo?: boolean } = {}) {
    setDemoMode(options.demo === true);
    setDs(dataset);
    setAnchors({ ...dataset.anchors });
    const meta = deriveVarMeta(dataset);
    setVarMeta(meta);
    const cols = numericColumns(dataset);
    const specs = migrateSpecsFromAnchors(cols, dataset.anchors);
    for (const col of cols) {
      const m = meta[col];
      if (!m) continue;
      if (m.type === "raw") {
        const s = specs[col];
        if (!s.set.setLabel.trim()) s.set.setLabel = col;
        if (!s.set.definition.trim()) {
          s.set.definition = `Membership in the set «${col}» (provisional placeholder — replace with a substantive definition).`;
        }
        if (s.method === "direct" && s.direct) {
          if (!s.direct.meaningFullOut.trim()) s.direct.meaningFullOut = "Clearly out of the set (provisional)";
          if (!s.direct.meaningCrossover.trim()) s.direct.meaningCrossover = "Maximum ambiguity (provisional)";
          if (!s.direct.meaningFullIn.trim()) s.direct.meaningFullIn = "Clearly in the set (provisional)";
        }
        specs[col] = {
          ...s,
          provisionalDefaults: true,
          status: s.status === "unresolved" ? "provisional" : s.status,
        };
        continue;
      }
      specs[col] = {
        ...specs[col],
        method: undefined,
        alreadyCalibratedProvenance: specs[col].alreadyCalibratedProvenance?.trim() ||
          `Already calibrated ${m.type} values from «${dataset.name}» (confirm provenance before publication).`,
        set: {
          ...specs[col].set,
          setLabel: specs[col].set.setLabel || col,
          definition:
            specs[col].set.definition ||
            `Pre-calibrated membership for «${col}» (provisional — document original calibration).`,
        },
        provisionalDefaults: true,
        status: specs[col].status === "unresolved" ? "provisional" : specs[col].status,
      };
    }
    setCalibSpecs(specs);
    setCalibMigrateBanner(false);
    setFocusVar(firstRawFocus(dataset, meta));
  }

  function loadDemo() {
    applyDataset(DEMO, { demo: true });
  }

  function startTour() {
    loadDemo();
    setTourStep(0);
  }
  function nextTourStep() {
    setTourStep((s) => (s === null ? null : s + 1 >= tourSteps.length ? null : s + 1));
  }
  function endTour() {
    setTourStep(null);
  }

  // Deep-Link von der Landing: /app?demo=1 lädt sofort den Demo-Datensatz.
  // Der Parameter wird danach entfernt, damit ein Reload nicht erneut lädt.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("demo") !== "1") return;
    const timer = window.setTimeout(() => applyDataset(DEMO, { demo: true }), 0);
    params.delete("demo");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function importCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        applyDataset(parseCsv(String(reader.result), file.name));
      } catch (e) {
        alert(t(locale, "alert.csvError", { msg: e instanceof Error ? e.message : t(locale, "alert.unknown") }));
      }
    };
    reader.readAsText(file);
  }

  async function importXlsx(file: File) {
    try {
      applyDataset(await parseXlsxToDataset(file));
    } catch (e) {
      alert(t(locale, "alert.xlsxError", { msg: e instanceof Error ? e.message : t(locale, "alert.unknown") }));
    }
  }

  function importFile(file: File) {
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      importXlsx(file);
    } else {
      importCsv(file);
    }
  }

  function currentState(): SavedState {
    return { dataset: ds!, anchors, varMeta, calibSpecs, demoMode, freqCut, consCut };
  }
  function loadState(raw: unknown) {
    const s = raw as SavedState;
    if (!s?.dataset) return;
    setDemoMode(s.demoMode === true);
    setDs(s.dataset);
    setAnchors(s.anchors ?? {});
    // Fehlt das Variablen-Metamodell (alter Speicherstand), neu ableiten;
    // alte fs_-Bedingungen werden bewusst ignoriert (kein Crash).
    const meta =
      s.varMeta && Object.keys(s.varMeta).length > 0 ? s.varMeta : deriveVarMeta(s.dataset);
    setVarMeta(meta);
    const cols = numericColumns(s.dataset);
    const hadSpecs = !!(s.calibSpecs && Object.keys(s.calibSpecs).length > 0);
    setCalibSpecs(migrateSpecsFromAnchors(cols, s.anchors ?? s.dataset.anchors ?? {}, s.calibSpecs));
    setCalibMigrateBanner(!hadSpecs);
    setFreqCut(s.freqCut ?? 1);
    setConsCut(s.consCut ?? 0.8);
    setFocusVar(firstRawFocus(s.dataset, meta));
  }

  // Berechnungskette: crisp/fuzzy → Wert unverändert; raw → calibrateValue per CalibrationSpec.
  // Fälle mit NaN in genutzten Spalten werden für TT/Lösungen ausgeschlossen.
  const evaluation: CalibrationEvaluation = useMemo(
    () =>
      ds
        ? evaluateCalibration(ds, varMeta, calibSpecs)
        : {
            cases: [],
            cells: [],
            excludedCaseLabels: [],
            unresolvedCaseLabels: [],
          },
    [ds, varMeta, calibSpecs],
  );
  const setCols = useMemo(
    () =>
      ds
        ? numericColumns(ds).filter((column) => {
            const meta = varMeta[column];
            return (
              !!meta &&
              meta.role !== "ignore" &&
              isColUsable(meta.type, numericValues(ds, column), column, calibSpecs)
            );
          })
        : [],
    [ds, varMeta, calibSpecs],
  );
  const cases = evaluation.cases;
  const excludedMissingCount = new Set([
    ...evaluation.excludedCaseLabels,
    ...evaluation.unresolvedCaseLabels,
  ]).size;

  // Bedingungen/Outcome leiten sich aus varMeta ab (nur nutzbare Set-Spalten).
  const conditions = useMemo(
    () => setCols.filter((c) => varMeta[c]?.role === "condition"),
    [setCols, varMeta],
  );
  const outcome = useMemo(
    () => setCols.find((c) => varMeta[c]?.role === "outcome") ?? "",
    [setCols, varMeta],
  );

  const tt: TruthTableResult | null = useMemo(() => {
    if (!ds || conditions.length < 1 || !outcome) return null;
    if (conditions.includes(outcome)) return null;
    try {
      return buildTruthTable({ cases, conditions, outcome, freqCut, consCut });
    } catch {
      return null;
    }
  }, [ds, cases, conditions, outcome, freqCut, consCut]);
  const sensitivity: SensitivityBundle = useMemo(
    () =>
      ds
        ? buildSensitivityBundle({
            ds,
            varMeta,
            calibSpecs,
            conditions,
            outcome,
            freqCut,
            consCut,
          })
        : { resultsByColumn: {}, variantsByColumn: {} },
    [ds, varMeta, calibSpecs, conditions, outcome, freqCut, consCut],
  );

  // Notwendigkeitsanalyse hängt methodisch NUR von conditions/outcome/cases ab
  // (nicht von der Truth Table) — sie gehört vor die Suffizienzanalyse.
  const necessity: ReturnType<typeof necessityAnalysis> | null = useMemo(() => {
    if (!(conditions.length > 0 && outcome && !conditions.includes(outcome))) return null;
    try {
      return necessityAnalysis(conditions, outcome, cases);
    } catch {
      return null;
    }
  }, [conditions, outcome, cases]);

  const sol: SolBundle | null = useMemo(() => {
    if (!tt) return null;
    const exp: Record<string, Expectation> = Object.fromEntries(
      conditions.map((c) => [c, expectations[c] ?? "present"]),
    );
    return {
      complex: complexSolution(tt, cases),
      intermediate: intermediateSolution(tt, cases, exp),
      parsimonious: parsimoniousSolution(tt, cases),
    };
  }, [tt, cases, conditions, expectations]);

  // -- Geführter 6-Schritte-Stepper: Status je Schritt aus dem State ableiten. --
  const activeAnalysisCols = useMemo(
    () =>
      ds
        ? numericColumns(ds).filter((c) => {
            const m = varMeta[c];
            return m && m.role !== "ignore";
          })
        : [],
    [ds, varMeta],
  );

  const step1Done = !!ds;
  const step2Done =
    activeAnalysisCols.some((c) => varMeta[c]?.role === "condition") &&
    activeAnalysisCols.some((c) => varMeta[c]?.role === "outcome");
  // The synthetic demo is an explicit teaching exception: calculations stay
  // visible, while the research/export gate remains closed below.
  const step3Done =
    step2Done &&
    (demoMode ||
      activeAnalysisCols.every((column) =>
        specIsAnalysisReady(calibSpecs[column], varMeta[column].type),
      ));
  const calibrationResearchReady =
    !demoMode &&
    step2Done &&
    activeAnalysisCols.every((column) =>
      specIsProtocolReady(calibSpecs[column], varMeta[column].type),
    );
  const step4Done = step3Done && !!necessity; // Analyse-Schritt: bereit = Ergebnis liegt vor
  const step5Done = step3Done && !!(tt && sol);
  const step6Done = false; // Terminal-Schritt: bleibt „aktiv", solange man hier arbeitet

  const s1 = statusOf(true, step1Done);
  const s2 = statusOf(step1Done, step2Done);
  // Step 3 is the editing workspace; do not lock it behind its own checklist.
  const s3: StepStatus = step2Done ? (step3Done ? "done" : "active") : "locked";
  const s4 = statusOf(step3Done, step4Done);
  const s5 = statusOf(step3Done, step5Done);
  const s6 = statusOf(step5Done, step6Done);
  const statuses: StepStatus[] = [s1, s2, s3, s4, s5, s6];

  // Anzahl der von vorne lückenlos erledigten Schritte → aktiver Schritt = k+1.
  let doneRun = 0;
  for (const st of statuses) {
    if (st === "done") doneRun++;
    else break;
  }
  const activeStepNum = doneRun < 6 ? doneRun + 1 : 0;

  const stepMeta: { id: string; titleKey: DictKey; navKey: DictKey }[] = [
    { id: "daten", titleKey: "step.title.1", navKey: "nav.step1" },
    { id: "variablen", titleKey: "step.title.2", navKey: "nav.step2" },
    { id: "kalibrierung", titleKey: "step.title.3", navKey: "nav.step3" },
    { id: "notwendigkeit", titleKey: "step.title.4", navKey: "nav.step4" },
    { id: "truthtable", titleKey: "step.title.5", navKey: "nav.step5" },
    { id: "robustheit", titleKey: "step.title.6", navKey: "nav.step6" },
  ];
  const lockedReasonKeys: (DictKey | null)[] = [
    null,
    "step.locked.2",
    "step.locked.3",
    "step.locked.4",
    "step.locked.5",
    "step.locked.6",
  ];
  const navSteps = stepMeta.map((m, i) => ({
    n: i + 1,
    id: m.id,
    label: t(locale, m.navKey),
    status: statuses[i],
  }));
  const activeStepId = activeStepNum > 0 ? stepMeta[activeStepNum - 1].id : stepMeta[0].id;

  // „Weiter"-Button unter dem zuletzt erledigten Schritt (= aktiver − 1),
  // zeigt auf den nun aktiven Schritt. Nicht unter Schritt 6.
  const continueUnder = doneRun >= 1 && doneRun < 6 ? doneRun : 0;
  const renderContinue = (afterStep: number) =>
    continueUnder === afterStep ? (
      <ContinueButton
        targetN={afterStep + 1}
        targetTitle={t(locale, stepMeta[afterStep].titleKey)}
        targetId={stepMeta[afterStep].id}
      />
    ) : null;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px clamp(12px, 4vw, 26px) 90px" }}>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt,.tsv,.xlsx,.xls"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importFile(f);
          e.target.value = "";
        }}
      />
      <Header />
      <SectionNav steps={navSteps} activeStepId={activeStepId} />
      {ds && <Glossary />}
      {!ds && (
        <div style={{ padding: "10px 2px 22px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 8px", maxWidth: "24ch" }}>
            {t(locale, "hero.title")}
          </h1>
          <p style={{ color: "var(--ink-2)", maxWidth: "62ch", margin: 0 }}>
            {t(locale, "hero.desc")}
          </p>
          <p style={{ color: "var(--ink-2)", maxWidth: "62ch", margin: "8px 0 0" }}>
            {t(locale, "hero.tourHint")}
          </p>
        </div>
      )}

      {/* Schritt 1 — Daten laden */}
      <Step n={1} id={stepMeta[0].id} title={t(locale, stepMeta[0].titleKey)} status={s1} intro={t(locale, "step.intro.1")}>
        {!ds ? (
          <>
            <Card>
              {/* Titel liefert der Step-Wrapper — hier nicht doppeln. */}
              <p style={{ color: "var(--ink-2)", maxWidth: "60ch", marginTop: 0 }}>
                {t(locale, "load.desc")}
              </p>
              <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button primary onClick={loadDemo}>{t(locale, "load.demoBtn")}</Button>
                <Button onClick={() => fileRef.current?.click()}>{t(locale, "load.importBtn")}</Button>
                <Button onClick={startTour}>{t(locale, "tour.start")}</Button>
              </div>
              <p className="hint" style={hintStyle}>
                {t(locale, "load.hint")}
              </p>
            </Card>
            <Card>
              <H2>{t(locale, "examples.title")}</H2>
              <ExampleDatasets onSelect={applyDataset} />
            </Card>
          </>
        ) : (
          <>
            <DataSection ds={ds} />
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, margin: "-8px 0 18px" }}>
              <Button onClick={() => fileRef.current?.click()}>{t(locale, "data.reloadBtn")}</Button>
              <CloudSaveLoad getState={currentState} onLoad={loadState} />
            </div>
          </>
        )}
      </Step>
      {renderContinue(1)}

      {/* Schritt 2 — Variablen & Rollen */}
      <Step n={2} id={stepMeta[1].id} title={t(locale, stepMeta[1].titleKey)} status={s2} lockedReason={t(locale, lockedReasonKeys[1]!)} intro={t(locale, "step.intro.2")}>
        {ds && <VariablesSection ds={ds} varMeta={varMeta} setVarMeta={setVarMeta} calibSpecs={calibSpecs} />}
      </Step>
      <Step n={3} id={stepMeta[2].id} title={t(locale, stepMeta[2].titleKey)} status={s3} lockedReason={t(locale, lockedReasonKeys[2]!)} intro={t(locale, "step.intro.3")}>
        {ds && (
          <>
            {demoMode ? (
              <Diag kind="warn">{t(locale, "calib.demoNotice")}</Diag>
            ) : (
              !calibrationResearchReady && (
                <Diag kind="warn">{t(locale, "calib.protocol.pageIncomplete")}</Diag>
              )
            )}
            {calibMigrateBanner && (
              <Diag kind="warn">{t(locale, "calib.migrate.banner")}</Diag>
            )}
            {setCols.length > 0 && (
              <Card id="deskriptiv">
                <H2>{t(locale, "descriptives.title")}</H2>
                <Descriptives columns={setCols} cases={cases} />
              </Card>
            )}
            <CalibrationWorkbench
              ds={ds}
              varMeta={varMeta}
              setVarMeta={setVarMeta}
              calibSpecs={calibSpecs}
              setCalibSpecs={setCalibSpecs}
              anchors={anchors}
              setAnchors={setAnchors}
              focusVar={focusVar}
              setFocusVar={setFocusVar}
              evaluation={evaluation}
              sensitivity={sensitivity}
              conditions={conditions}
              outcome={outcome}
              excludedMissingCount={excludedMissingCount}
              freqCut={freqCut}
              consCut={consCut}
            />
          </>
        )}
      </Step>
      {renderContinue(3)}

      {/* Schritt 4 — Notwendigkeit */}
      <Step n={4} id={stepMeta[3].id} title={t(locale, stepMeta[3].titleKey)} status={s4} lockedReason={t(locale, lockedReasonKeys[3]!)} intro={t(locale, "step.intro.4")}>
        {necessity ? <NecessitySection necessity={necessity} /> : <p className="hint" style={hintStyle}>{t(locale, "step.pending")}</p>}
      </Step>
      {renderContinue(4)}

      {/* Schritt 5 — Truth Table & Lösungen */}
      <Step n={5} id={stepMeta[4].id} title={t(locale, stepMeta[4].titleKey)} status={s5} lockedReason={t(locale, lockedReasonKeys[4]!)} intro={t(locale, "step.intro.5")}>
        <TruthTableSection
          freqCut={freqCut}
          setFreqCut={setFreqCut}
          consCut={consCut}
          setConsCut={setConsCut}
          tt={tt}
        />
        {sol && tt && (
          <SolutionSection
            tt={tt}
            sol={sol}
            expectations={expectations}
            setExpectations={setExpectations}
            conditions={conditions}
          />
        )}
      </Step>
      {renderContinue(5)}

      {/* Schritt 6 — Robustheit, Bericht & Export */}
      <Step n={6} id={stepMeta[5].id} title={t(locale, stepMeta[5].titleKey)} status={s6} lockedReason={t(locale, lockedReasonKeys[5]!)} intro={t(locale, "step.intro.6")}>
        {sol && tt && ds && (
          <>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <h2 style={{ fontSize: 16.5, fontWeight: 600, margin: 0 }}>{t(locale, "robustness.title")}</h2>
                <InfoHint
                  title={t(locale, "info.robustness.title")}
                  body={t(locale, "info.robustness.body")}
                />
              </div>
              <RobustnessPanel cases={cases} conditions={conditions} outcome={outcome} freqCut={freqCut} currentConsCut={consCut} />
            </Card>
            {/* Panel bringt eigene Karte + Überschrift mit — nicht doppelt verpacken. */}
            <div id="negiert" style={{ scrollMarginTop: 56 }}>
              <NegatedOutcomePanel cases={cases} conditions={conditions} outcome={outcome} freqCut={freqCut} consCut={consCut} />
            </div>
            {conditions.length > 0 && outcome && (() => {
              const xc = xyCond && conditions.includes(xyCond) ? xyCond : conditions[0];
              const points = cases.map((c) => ({ label: c.label, x: c.values[xc], y: c.values[outcome] }));
              return (
                <Card id="xyplot">
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <h2 style={{ fontSize: 16.5, fontWeight: 600, margin: 0 }}>{t(locale, "xy.title")}</h2>
                      <InfoHint title={t(locale, "info.xyPlot.title")} body={t(locale, "info.xyPlot.body")} />
                    </div>
                    <select value={xc} onChange={(e) => setXyCond(e.target.value)} style={{ ...inputStyle, marginLeft: "auto" }}>
                      {conditions.map((c) => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  <XyPlot xLabel={xc} yLabel={outcome} points={points} />
                  <p className="hint" style={hintStyle}>{t(locale, "xy.hint")}</p>
                </Card>
              );
            })()}
            <ProtocolSection
              ds={ds}
              calibSpecs={calibSpecs}
              varMeta={varMeta}
              conditions={conditions}
              outcome={outcome}
              freqCut={freqCut}
              consCut={consCut}
              evaluation={evaluation}
              sensitivity={sensitivity}
              researchReady={calibrationResearchReady}
            />
            <Card>
              <H2>{t(locale, "report.title")}</H2>
              <p style={{ color: "var(--ink-2)", marginTop: 0 }}>{t(locale, "report.desc")}</p>
              <ReportButton
                disabled={!calibrationResearchReady}
                getInput={(): ReportInput | null => {
                  if (!calibrationResearchReady || !ds || !tt || !sol || !necessity) return null;
                  return {
                    datasetName: ds.name,
                    caseCount: ds.rows.length,
                    anchors: rawAnchorsOf(ds, varMeta, calibSpecs),
                    calibSpecs,
                    varMeta,
                    conditions,
                    outcome,
                    freqCut,
                    consCut,
                    tt,
                    complex: sol.complex,
                    intermediate: sol.intermediate,
                    parsimonious: sol.parsimonious,
                    necessity,
                    expectations: Object.fromEntries(conditions.map((c) => [c, expectations[c] ?? "present"])),
                    rScript: buildRScript({
                      ds,
                      calibSpecs,
                      varMeta,
                      conditions,
                      outcome,
                      freqCut,
                      consCut,
                      sensitivity,
                    }),
                  };
                }}
              />
            </Card>
          </>
        )}
      </Step>
      <GuidedTour
        active={tourStep !== null}
        stepIndex={tourStep ?? 0}
        onNext={nextTourStep}
        onEnd={endTour}
        steps={tourSteps}
      />
    </div>
  );
}

/* ---------- Stepper-Bausteine ---------- */

function Step({
  n,
  title,
  status,
  lockedReason,
  id,
  intro,
  children,
}: {
  n: number;
  title: string;
  status: StepStatus;
  lockedReason?: string;
  id: string;
  intro?: string;
  children: React.ReactNode;
}) {
  const [locale] = useLocale();
  const done = status === "done";
  const locked = status === "locked";
  const chip =
    status === "done"
      ? { label: t(locale, "step.status.done"), color: "var(--good-text)", bg: "rgba(12,163,12,0.10)" }
      : status === "active"
        ? { label: t(locale, "step.status.active"), color: "var(--accent-deep)", bg: "var(--accent-wash)" }
        : { label: t(locale, "step.status.locked"), color: "var(--muted)", bg: "var(--line-soft)" };
  return (
    <section id={id} style={{ scrollMarginTop: 56, marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: locked ? 6 : 14 }}>
        <span
          aria-hidden
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            flex: "none",
            display: "grid",
            placeItems: "center",
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            background: locked ? "var(--muted)" : "var(--brand)",
          }}
        >
          {done ? "✓" : n}
        </span>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, flex: 1, color: locked ? "var(--muted)" : "var(--ink)" }}>
          {title}
        </h2>
        {/* Bei „erledigt" reicht das ✓ im Nummern-Kreis — kein doppeltes Signal. */}
        {!done && (
          <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap", color: chip.color, background: chip.bg }}>
            {chip.label}
          </span>
        )}
      </div>
      {intro && (
        <p
          style={{
            color: "var(--ink-2)",
            fontSize: 13.5,
            lineHeight: 1.5,
            margin: locked ? "0 0 4px" : "0 0 14px",
            paddingLeft: 40,
            maxWidth: "70ch",
          }}
        >
          {intro}
        </p>
      )}
      {locked ? (
        <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "0 0 4px", paddingLeft: 40 }}>{lockedReason}</p>
      ) : (
        children
      )}
    </section>
  );
}

function ContinueButton({ targetN, targetTitle, targetId }: { targetN: number; targetTitle: string; targetId: string }) {
  const [locale] = useLocale();
  return (
    <div style={{ margin: "-4px 0 22px", paddingLeft: 40 }}>
      <button
        className="oq-btn"
        onClick={() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" })}
        style={{
          fontSize: 13.5,
          color: "var(--accent-deep)",
          background: "var(--accent-wash)",
          borderColor: "var(--accent)",
        }}
      >
        {t(locale, "step.next", { n: targetN, title: targetTitle })}
      </button>
    </div>
  );
}

/* ---------- Daten ---------- */

function DataSection({ ds }: { ds: RawDataset }) {
  const [locale] = useLocale();
  return (
    <Card>
      <H2>{t(locale, "data.title", { n: ds.rows.length })}</H2>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
          <thead>
            <tr>
              {ds.columns.map((c) => (
                <th key={c} style={thStyle()}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ds.rows.map((r, i) => (
              <tr key={i}>
                {ds.columns.map((c) => (
                  <td key={c} style={tdStyle(typeof r[c] === "number", c === ds.caseCol)}>
                    {String(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ---------- Variablen & Rollen ---------- */

function VariablesSection({
  ds,
  varMeta,
  setVarMeta,
  calibSpecs,
}: {
  ds: RawDataset;
  varMeta: Record<string, VarMeta>;
  setVarMeta: (m: Record<string, VarMeta>) => void;
  calibSpecs: CalibSpecs;
}) {
  const [locale] = useLocale();
  const cols = numericColumns(ds);

  function setType(col: string, type: VarType) {
    setVarMeta({ ...varMeta, [col]: { ...varMeta[col], type } });
  }
  function setRole(col: string, role: VarRole) {
    const next: Record<string, VarMeta> = { ...varMeta };
    if (role === "outcome") {
      // Genau ein Outcome: vorhandenes Outcome auf Bedingung zurücksetzen.
      for (const k of Object.keys(next)) {
        if (next[k].role === "outcome") next[k] = { ...next[k], role: "condition" };
      }
    }
    next[col] = { ...next[col], role };
    setVarMeta(next);
  }

  const typeOptions: { id: VarType; key: DictKey }[] = [
    { id: "raw", key: "vars.type.raw" },
    { id: "fuzzy", key: "vars.type.fuzzy" },
    { id: "crisp", key: "vars.type.crisp" },
  ];
  const roleOptions: { id: VarRole; key: DictKey }[] = [
    { id: "condition", key: "vars.role.condition" },
    { id: "outcome", key: "vars.role.outcome" },
    { id: "ignore", key: "vars.role.ignore" },
  ];

  return (
    <Card>
      {/* Titel + Intro liefert der Step-Wrapper (step.intro.2) — hier nicht doppeln. */}
      <p
        data-testid="variables-role-explainer"
        style={{ color: "var(--ink-2)", maxWidth: "70ch", margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.55 }}
      >
        {t(locale, "vars.role.help")}
      </p>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
          <thead>
            <tr>
              <th style={thStyle()}>{t(locale, "vars.col.name")}</th>
              <th style={thStyle()}>{t(locale, "vars.col.type")}</th>
              <th style={thStyle()}>{t(locale, "vars.col.role")}</th>
            </tr>
          </thead>
          <tbody>
            {cols.map((col) => {
              const meta = varMeta[col] ?? { type: "raw" as VarType, role: "ignore" as VarRole };
              const values = numericValues(ds, col);
              const detected = detectVarType(values);
              const usable = meta.role === "ignore" || isColUsable(meta.type, values, col, calibSpecs);
              const badgeKey: DictKey = meta.type === "raw" ? "vars.badge.raw" : "vars.badge.ready";
              const warnKey: DictKey =
                meta.type === "crisp"
                  ? "vars.warn.crisp"
                  : meta.type === "fuzzy"
                    ? "vars.warn.fuzzy"
                    : "vars.warn.raw";
              return (
                <Fragment key={col}>
                  <tr>
                    <td style={{ ...tdStyle(false, true), verticalAlign: "top" }} className="mono">{col}</td>
                    <td style={{ ...tdStyle(false, false), verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <select
                          value={meta.type}
                          onChange={(e) => setType(col, e.target.value as VarType)}
                          style={{ ...inputStyle, padding: "4px 7px", fontSize: 13.5 }}
                        >
                          {typeOptions.map((o) => (
                            <option key={o.id} value={o.id}>{t(locale, o.key)}</option>
                          ))}
                        </select>
                        {meta.type === detected && (
                          <span style={autoBadgeStyle}>{t(locale, "vars.autoDetected")}</span>
                        )}
                        <span style={typeBadgeStyle(meta.type)}>{t(locale, badgeKey)}</span>
                      </div>
                      <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "6px 0 0", maxWidth: "42ch" }}>
                        {t(
                          locale,
                          meta.type === "raw"
                            ? "vars.type.help.raw"
                            : meta.type === "fuzzy"
                              ? "vars.type.help.fuzzy"
                              : "vars.type.help.crisp",
                        )}
                      </p>
                    </td>
                    <td style={{ ...tdStyle(false, false), verticalAlign: "top" }}>
                      <select
                        value={meta.role}
                        onChange={(e) => setRole(col, e.target.value as VarRole)}
                        style={{ ...inputStyle, padding: "4px 7px", fontSize: 13.5 }}
                      >
                        {roleOptions.map((o) => (
                          <option key={o.id} value={o.id}>{t(locale, o.key)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  {!usable && (
                    <tr>
                      <td colSpan={3} style={{ padding: "0 12px 8px", borderBottom: "1px solid var(--line-soft)" }}>
                        <span style={{ color: "var(--bad)", fontSize: 13.5 }}>{t(locale, warnKey)}</span>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const autoBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.03em",
  color: "var(--muted)",
  border: "1px solid var(--line)",
  borderRadius: 999,
  padding: "1px 7px",
  whiteSpace: "nowrap",
};

function typeBadgeStyle(type: VarType): React.CSSProperties {
  const raw = type === "raw";
  return {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    color: raw ? "var(--warn-text)" : "var(--accent-deep)",
    background: raw ? "var(--warn-wash)" : "var(--accent-wash)",
    borderRadius: 999,
    padding: "1px 8px",
    whiteSpace: "nowrap",
  };
}

/* ---------- Truth Table ---------- */

function TruthTableSection(props: {
  freqCut: number;
  setFreqCut: (n: number) => void;
  consCut: number;
  setConsCut: (n: number) => void;
  tt: TruthTableResult | null;
}) {
  const [locale] = useLocale();
  const { freqCut, setFreqCut, consCut, setConsCut, tt } = props;
  const observed = tt
    ? tt.rows
        .filter((r) => r.n > 0)
        .sort((x, y) => Number(y.output === 1) - Number(x.output === 1) || y.consistency - x.consistency)
    : [];
  const remainders = tt ? tt.rows.length - observed.length : 0;

  return (
    <Card>
      <H2>{t(locale, "tt.title")}</H2>
      <p className="hint" style={{ ...hintStyle, marginTop: 0, marginBottom: 12 }}>
        {t(locale, "tt.rolesHint")}{" "}
        <a href="#variablen" style={{ color: "var(--accent-deep)", textDecoration: "none", fontWeight: 600 }}>
          {t(locale, "tt.rolesLink")}
        </a>
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "end" }}>
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              {t(locale, "tt.freqCut")}
              <InfoHint title={t(locale, "info.freqCutoff.title")} body={t(locale, "info.freqCutoff.body")} />
            </span>
          }
        >
          <input data-testid="truth-table-frequency-cut" type="number" min={1} value={freqCut} onChange={(e) => setFreqCut(Math.max(1, Number(e.target.value) || 1))} style={{ ...inputStyle, width: 90 }} />
        </Field>
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              {t(locale, "tt.consCut")}
              <InfoHint title={t(locale, "info.consCutoff.title")} body={t(locale, "info.consCutoff.body")} />
            </span>
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input data-testid="truth-table-consistency-cut" type="number" min={0} max={1} step={0.01} value={consCut} onChange={(e) => setConsCut(Number(e.target.value) || 0.8)} style={{ ...inputStyle, width: 90 }} />
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.01}
              value={consCut}
              onChange={(e) => setConsCut(Number(e.target.value))}
              aria-label={t(locale, "tt.consCut")}
              style={{ width: 140, accentColor: "var(--accent)" }}
            />
          </div>
        </Field>
      </div>

      {tt && (
        <>
          {tt.assignedCaseCount < tt.totalCaseCount && (
            <p className="hint" style={{ ...hintStyle, color: "var(--bad)" }}>
              {t(locale, "tt.unassignedWarn", { n: tt.totalCaseCount - tt.assignedCaseCount })}
            </p>
          )}
          <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8, marginTop: 12 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
              <thead>
                <tr>
                  {tt.conditions.map((c) => (<th key={c} style={thStyle()}>{c.replace(/^fs_/, "")}</th>))}
                  <th style={thStyle()}>{t(locale, "tt.col.n")}</th>
                  <th style={thStyle()}>
                    <span style={thHintStyle}>
                      {t(locale, "tt.col.consistency")}
                      <InfoHint title={t(locale, "info.consistency.title")} body={t(locale, "info.consistency.body")} formula={t(locale, "info.consistency.formula")} />
                    </span>
                  </th>
                  <th style={thStyle()}>
                    <span style={thHintStyle}>
                      {t(locale, "tt.col.pri")}
                      <InfoHint title={t(locale, "info.pri.title")} body={t(locale, "info.pri.body")} formula={t(locale, "info.pri.formula")} />
                    </span>
                  </th>
                  <th style={thStyle()}>
                    <span style={thHintStyle}>
                      {t(locale, "tt.col.out")}
                      <InfoHint title={t(locale, "info.out.title")} body={t(locale, "info.out.body")} />
                    </span>
                  </th>
                  <th style={thStyle()}>{t(locale, "tt.col.cases")}</th>
                </tr>
              </thead>
              <tbody>
                {observed.map((r) => (
                  <tr key={r.index}>
                    {[...r.bits].map((b, i) => (<td key={i} style={tdStyle(true, false)} className="mono">{b}</td>))}
                    <td style={tdStyle(true, false)}>{r.n}</td>
                    <td style={{ ...tdStyle(true, false), color: r.consistency >= consCut ? "var(--good-text)" : undefined, fontWeight: r.consistency >= consCut ? 600 : 400 }}>{fmt(r.consistency)}</td>
                    <td style={tdStyle(true, false)}>{fmt(r.pri)}</td>
                    <td style={tdStyle(false, false)}>{chip(r.output)}</td>
                    <td style={{ ...tdStyle(false, false), whiteSpace: "normal", maxWidth: 260, color: "var(--ink-2)", fontSize: 13.5 }}>{r.cases.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint" style={hintStyle}>
            {t(locale, "tt.hint", { observed: observed.length, remainders, freqCut, consCut })}
          </p>
        </>
      )}
    </Card>
  );
}

/* ---------- Lösungen ---------- */

function SolutionSection({
  tt,
  sol,
  expectations,
  setExpectations,
  conditions,
}: {
  tt: TruthTableResult;
  sol: SolBundle;
  expectations: Record<string, Expectation>;
  setExpectations: (e: Record<string, Expectation>) => void;
  conditions: string[];
}) {
  const [locale] = useLocale();
  const outLabel = tt.outcome.replace(/^fs_/, "").toUpperCase();
  return (
    <div id="loesungen" style={{ scrollMarginTop: 56 }}>
      {(["complex", "intermediate", "parsimonious"] as const).map((kind) => {
        const s = sol[kind];
        const title =
          kind === "complex"
            ? t(locale, "sol.complex.title")
            : kind === "intermediate"
              ? t(locale, "sol.intermediate.title")
              : t(locale, "sol.parsimonious.title");
        const infoTitle =
          kind === "complex"
            ? t(locale, "info.solComplex.title")
            : kind === "intermediate"
              ? t(locale, "info.solIntermediate.title")
              : t(locale, "info.solParsimonious.title");
        const infoBody =
          kind === "complex"
            ? t(locale, "info.solComplex.body")
            : kind === "intermediate"
              ? t(locale, "info.solIntermediate.body")
              : t(locale, "info.solParsimonious.body");
        return (
          <Card key={kind}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <h2 style={{ fontSize: 16.5, fontWeight: 600, margin: 0 }}>{title}</h2>
              <InfoHint title={infoTitle} body={infoBody} />
            </div>
            {s.models.length === 0 ? (
              <p className="hint" style={hintStyle}>{t(locale, "sol.none")}</p>
            ) : (
              s.models.map((m, mi) => (
                <div key={mi}>
                  <div className="mono" style={{ fontSize: 15, background: "var(--panel-2)", borderRadius: 8, padding: "10px 14px", overflowX: "auto" }}>
                    {m.paths.map((p) => p.expression.replace(/fs_/g, "").toUpperCase()).join("  +  ")} → {outLabel}
                  </div>
                  <div style={{ display: "flex", gap: 26, margin: "12px 0" }}>
                    <Kpi
                      v={fmt(m.solutionConsistency)}
                      l={
                        <span style={thHintStyle}>
                          {t(locale, "sol.kpi.consistency")}
                          <InfoHint
                            title={t(locale, "info.solutionConsistency.title")}
                            body={t(locale, "info.solutionConsistency.body")}
                            formula={t(locale, "info.solutionConsistency.formula")}
                          />
                        </span>
                      }
                    />
                    <Kpi
                      v={fmt(m.solutionCoverage)}
                      l={
                        <span style={thHintStyle}>
                          {t(locale, "sol.kpi.coverage")}
                          <InfoHint
                            title={t(locale, "info.solutionCoverage.title")}
                            body={t(locale, "info.solutionCoverage.body")}
                            formula={t(locale, "info.solutionCoverage.formula")}
                          />
                        </span>
                      }
                    />
                  </div>
                  <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
                      <thead>
                        <tr>
                          <th style={thStyle()}>{t(locale, "sol.col.path")}</th>
                          <th style={thStyle()}>
                            <span style={thHintStyle}>
                              {t(locale, "sol.col.rawCov")}
                              <InfoHint title={t(locale, "info.rawCoverage.title")} body={t(locale, "info.rawCoverage.body")} formula={t(locale, "info.rawCoverage.formula")} />
                            </span>
                          </th>
                          <th style={thStyle()}>
                            <span style={thHintStyle}>
                              {t(locale, "sol.col.uniqueCov")}
                              <InfoHint title={t(locale, "info.uniqueCoverage.title")} body={t(locale, "info.uniqueCoverage.body")} formula={t(locale, "info.uniqueCoverage.formula")} />
                            </span>
                          </th>
                          <th style={thStyle()}>
                            <span style={thHintStyle}>
                              {t(locale, "sol.col.consistency")}
                              <InfoHint title={t(locale, "info.consistency.title")} body={t(locale, "info.consistency.body")} formula={t(locale, "info.consistency.formula")} />
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.paths.map((p, pi) => (
                          <tr key={pi}>
                            <td style={tdStyle(false, false)} className="mono">{p.expression.replace(/fs_/g, "").toUpperCase()}</td>
                            <td style={tdStyle(true, false)}>{fmt(p.rawCoverage)}</td>
                            <td style={tdStyle(true, false)}>{fmt(p.uniqueCoverage)}</td>
                            <td style={tdStyle(true, false)}>{fmt(p.consistency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
            {kind === "intermediate" && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}>
                <Label>{t(locale, "sol.exp.label")}</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
                  {conditions.map((c) => (
                    <label key={c} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13.5 }}>
                      <span className="mono" style={{ color: "var(--ink-2)" }}>{c.replace(/^fs_/, "")}</span>
                      <select
                        value={expectations[c] ?? "present"}
                        onChange={(e) => setExpectations({ ...expectations, [c]: e.target.value as Expectation })}
                        style={{ ...inputStyle, padding: "3px 6px", fontSize: 13.5 }}
                      >
                        <option value="present">{t(locale, "sol.exp.present")}</option>
                        <option value="absent">{t(locale, "sol.exp.absent")}</option>
                        <option value="either">{t(locale, "sol.exp.either")}</option>
                      </select>
                    </label>
                  ))}
                </div>
                <p className="hint" style={hintStyle}>
                  {t(locale, "sol.exp.hint")}
                </p>
              </div>
            )}
            {kind === "parsimonious" && (
              <p className="hint" style={hintStyle}>{t(locale, "sol.pars.hint")}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- Notwendigkeit ---------- */

function NecessitySection({ necessity }: { necessity: ReturnType<typeof necessityAnalysis> }) {
  const [locale] = useLocale();
  return (
    <Card>
      <H2>{t(locale, "nec.title")}</H2>
      <p style={{ color: "var(--ink-2)", marginTop: -6, marginBottom: 12, fontSize: 13.5 }}>
        {t(locale, "nec.orderHint")}
      </p>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
          <thead>
            <tr>
              <th style={thStyle()}>{t(locale, "nec.col.condition")}</th>
              <th style={thStyle()}>
                <span style={thHintStyle}>
                  {t(locale, "nec.col.consistency")}
                  <InfoHint title={t(locale, "info.necessityConsistency.title")} body={t(locale, "info.necessityConsistency.body")} formula={t(locale, "info.necessityConsistency.formula")} />
                </span>
              </th>
              <th style={thStyle()}>
                <span style={thHintStyle}>
                  {t(locale, "nec.col.coverage")}
                  <InfoHint title={t(locale, "info.necessityCoverage.title")} body={t(locale, "info.necessityCoverage.body")} formula={t(locale, "info.necessityCoverage.formula")} />
                </span>
              </th>
              <th style={thStyle()}></th>
            </tr>
          </thead>
          <tbody>
            {necessity.map((n) => (
              <tr key={n.condition}>
                <td style={tdStyle(false, false)} className="mono">{n.condition.replace(/^fs_/, "")}</td>
                <td style={tdStyle(true, false)}>{fmt(n.consistency)}</td>
                <td style={tdStyle(true, false)}>{fmt(n.coverage)}</td>
                <td style={tdStyle(false, false)}>{n.isCandidate ? <span style={{ color: "var(--good-text)", fontWeight: 600 }}>{t(locale, "nec.candidate")}</span> : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint" style={hintStyle}>{t(locale, "nec.hint")}</p>
    </Card>
  );
}

/* ---------- Protokoll ---------- */

function ProtocolSection({
  ds,
  calibSpecs,
  varMeta,
  conditions,
  outcome,
  freqCut,
  consCut,
  evaluation,
  sensitivity,
  researchReady,
}: {
  ds: RawDataset;
  calibSpecs: CalibSpecs;
  varMeta: Record<string, VarMeta>;
  conditions: string[];
  outcome: string;
  freqCut: number;
  consCut: number;
  evaluation: CalibrationEvaluation;
  sensitivity: SensitivityBundle;
  researchReady: boolean;
}) {
  const [locale] = useLocale();
  const r = useMemo(
    () =>
      buildRScript({
        ds,
        calibSpecs,
        varMeta,
        conditions,
        outcome,
        freqCut,
        consCut,
        sensitivity,
      }),
    [ds, calibSpecs, varMeta, conditions, outcome, freqCut, consCut, sensitivity],
  );

  function downloadJson() {
    const payload = buildCalibrationProtocolJson({
      ds,
      calibSpecs,
      varMeta,
      conditions,
      outcome,
      freqCut,
      consCut,
      evaluation,
      sensitivity,
    });
    downloadText(
      "openqca-calibration-protocol.json",
      JSON.stringify(payload, null, 2),
      "application/json",
    );
  }
  function downloadRawData() {
    downloadText(
      RAW_DATA_FILENAME,
      buildRawCsv(ds),
      "text/csv;charset=utf-8",
    );
  }

  function downloadMd() {
    const md = buildCalibrationNarrative({
      ds,
      calibSpecs,
      varMeta,
      conditions,
      outcome,
      evaluation,
      sensitivity,
      freqCut,
      consCut,
      locale,
    });
    downloadText("openqca-calibration-protocol.md", md, "text/markdown;charset=utf-8");
  }

  async function copyR() {
    try {
      await navigator.clipboard.writeText(r);
    } catch {
      /* ignore */
    }
  }

  return (
    <Card id="protokoll">
      <H2>{t(locale, "proto.title")}</H2>
      <p style={{ color: "var(--ink-2)", marginTop: 0 }}>{t(locale, "proto.desc")}</p>
      {!researchReady && (
        <p className="hint" style={hintStyle}>{t(locale, "proto.notReady")}</p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button primary disabled={!researchReady} onClick={downloadJson}>{t(locale, "proto.downloadBtn")}</Button>
        <Button disabled={!researchReady} onClick={downloadRawData}>{t(locale, "proto.downloadData")}</Button>
        <Button disabled={!researchReady} onClick={downloadMd}>{t(locale, "proto.downloadMd")}</Button>
        <Button disabled={!researchReady} onClick={() => void copyR()}>{t(locale, "proto.copyR")}</Button>
      </div>
      <pre className="mono" style={{ fontSize: 13.5, lineHeight: 1.6, background: "var(--panel-2)", borderRadius: 8, padding: "12px 14px", overflowX: "auto", marginTop: 14 }}>
        {r}
      </pre>
    </Card>
  );
}

/* ---------- UI-Bausteine ---------- */

function Header() {
  const [locale] = useLocale();
  return (
    <header style={{ display: "flex", alignItems: "baseline", gap: 13, flexWrap: "wrap", paddingBottom: 16, borderBottom: "1px solid var(--line)", marginBottom: 22 }}>
      <Link href="/" style={{ fontWeight: 600, fontSize: 20, letterSpacing: "-0.01em", color: "var(--ink)", textDecoration: "none" }}>
        open<span style={{ color: "var(--brand)" }}>QCA</span>
      </Link>
      <span style={{ fontSize: 13.5, color: "var(--muted)" }}>{t(locale, "header.tagline")}</span>
      <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 12 }}>
        <a href="/methodik" style={{ fontSize: 13.5, color: "var(--accent-deep)", textDecoration: "none" }}>{t(locale, "header.methodik")}</a>
        <a href="/preise" style={{ fontSize: 13.5, color: "var(--accent-deep)", textDecoration: "none" }}>{t(locale, "header.tarife")}</a>
        <a href="/download" style={{ fontSize: 13.5, color: "var(--accent-deep)", textDecoration: "none" }}>{t(locale, "header.download")}</a>
        <LanguageToggle />
        <AccountButton />
      </span>
    </header>
  );
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

/* ---------- Sektions-Navigation (Scroll-Spy) ---------- */

function SectionNav({
  steps,
  activeStepId,
}: {
  steps: { n: number; id: string; label: string; status: StepStatus }[];
  activeStepId: string;
}) {
  const [locale] = useLocale();
  const [activeId, setActiveId] = useState<string>(activeStepId);
  // Scroll-Spy nur für freigeschaltete (nicht gesperrte) Schritte.
  const idsKey = steps
    .filter((s) => s.status !== "locked")
    .map((s) => s.id)
    .join("|");

  // Fortschritt springt weiter → aktiven Schritt hervorheben, bis der Nutzer scrollt.
  useEffect(() => {
    const timer = window.setTimeout(() => setActiveId(activeStepId), 0);
    return () => window.clearTimeout(timer);
  }, [activeStepId]);

  useEffect(() => {
    if (!idsKey) return;
    const ids = idsKey.split("|");
    const entryMap = new Map<string, IntersectionObserverEntry>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => entryMap.set(entry.target.id, entry));
        const visible = ids
          .map((id) => entryMap.get(id))
          .filter((e): e is IntersectionObserverEntry => !!e && e.isIntersecting);
        if (visible.length > 0) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-56px 0px -65% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [idsKey]);

  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label={t(locale, "nav.ariaLabel")}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "var(--bg)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--line)",
        marginBottom: 18,
      }}
    >
      <style>{`
        .oq-section-nav { scrollbar-width: thin; }
        .oq-section-nav::-webkit-scrollbar { height: 4px; }
        .oq-section-nav::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
      `}</style>
      <div
        className="oq-section-nav"
        style={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          padding: "8px 2px",
          whiteSpace: "nowrap",
        }}
      >
        {steps.map((s) => {
          const locked = s.status === "locked";
          const done = s.status === "done";
          const isActive = !locked && activeId === s.id;
          const prefix = done ? "✓" : `${s.n}`;
          const baseStyle: React.CSSProperties = {
            flex: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 13.5,
            padding: "5px 10px",
            borderRadius: 8,
            textDecoration: "none",
            whiteSpace: "nowrap",
          };
          const badge = (color: string) => (
            <span
              aria-hidden
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                background: color,
              }}
            >
              {prefix}
            </span>
          );
          if (locked) {
            return (
              <span
                key={s.id}
                aria-disabled
                style={{ ...baseStyle, color: "var(--muted)", opacity: 0.55, cursor: "default" }}
              >
                {badge("var(--muted)")}
                {s.label}
              </span>
            );
          }
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(s.id);
              }}
              style={{
                ...baseStyle,
                color: isActive ? "var(--accent-deep)" : done ? "var(--good-text)" : "var(--ink-2)",
                fontWeight: isActive ? 600 : 400,
                background: isActive ? "var(--panel-2)" : "transparent",
              }}
            >
              {badge(done ? "var(--good-text)" : "var(--brand)")}
              {s.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
// Dünner Wrapper — EINE Definition lebt in components/ui.tsx (SectionHeading).
function H2({ children }: { children: React.ReactNode }) {
  return <SectionHeading>{children}</SectionHeading>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>{children}</span>;
}
function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><Label>{label}</Label>{children}</div>;
}
function Button({
  children,
  primary,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button disabled={disabled} onClick={onClick} className={`oq-btn oq-btn--${primary ? "primary" : "secondary"}`}>
      {children}
    </button>
  );
}
// Dünner Wrapper — EINE Definition lebt in components/ui.tsx (Kpi).
function Kpi({ v, l }: { v: string; l: React.ReactNode }) {
  return <UiKpi value={v} label={l} />;
}
function Diag({ kind, children }: { kind: "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const map = { ok: ["var(--good)", "rgba(12,163,12,0.09)"], warn: ["#b26a00", "var(--warn-wash)"], bad: ["var(--bad)", "var(--bad-wash)"] } as const;
  const [icon, wash] = map[kind];
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13.5, padding: "9px 11px", borderRadius: 9, border: `1px solid ${wash}`, background: wash }}>
      <span style={{ width: 17, height: 17, borderRadius: "50%", flex: "none", marginTop: 1, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "#fff", background: icon }}>
        {kind === "ok" ? "✓" : "!"}
      </span>
      <div>{children}</div>
    </div>
  );
}

const hintStyle: React.CSSProperties = { fontSize: 13.5, color: "var(--muted)", margin: "8px 0 0" };
const thHintStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4 };
const inputStyle: React.CSSProperties = { font: "inherit", color: "var(--ink)", background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 9px" };
// Spaltenköpfe immer neutral (--muted) — dürfen nicht wie Links (accent) aussehen.
function thStyle(): React.CSSProperties {
  return { textAlign: "left", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, padding: "8px 12px", borderBottom: "1px solid var(--line)", background: "var(--panel-2)", whiteSpace: "nowrap" };
}
function tdStyle(num: boolean, caseCol: boolean): React.CSSProperties {
  return { padding: "6px 12px", borderBottom: "1px solid var(--line-soft)", whiteSpace: "nowrap", textAlign: num ? "right" : "left", fontVariantNumeric: num ? "tabular-nums" : undefined, fontWeight: caseCol ? 600 : 400 };
}
function chip(out: 0 | 1 | "?") {
  const style: React.CSSProperties = { display: "inline-block", padding: "1px 9px", borderRadius: 999, fontSize: 12, fontWeight: 700 };
  if (out === 1) return <span style={{ ...style, background: "var(--accent-wash)", color: "var(--accent-deep)" }}>1</span>;
  if (out === 0) return <span style={{ ...style, background: "var(--line-soft)", color: "var(--ink-2)" }}>0</span>;
  return <span style={{ ...style, border: "1px dashed var(--line)", color: "var(--muted)" }}>?</span>;
}
