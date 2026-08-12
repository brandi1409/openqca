"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  buildTruthTable,
  complexSolution,
  parsimoniousSolution,
  intermediateSolution,
  necessityAnalysis,
  necessarySupersets,
  caseDiagnostics,
  termMembership,
  runCombinedRobustnessGrid,
  type TruthTableResult,
  type Expectation,
  type RobustnessScenario,
  type CombinedRobustnessResult,
  type NecessityExpressionEntry,
  type QcaCase,
  type SolutionModel,
} from "@openqca/engine";
import { DEMO, type RawDataset } from "@/lib/demo";
import { parseCsv } from "@/lib/csv";
import { parseXlsxToDataset } from "@/lib/xlsx";
import { AccountButton, CloudSaveLoad } from "@/components/cloud";
import { XyPlot } from "@/components/XyPlot";
import { Descriptives } from "@/components/Descriptives";
import { Glossary } from "@/components/Glossary";
import { ExampleDatasets } from "@/components/ExampleDatasets";
import { RobustnessPanel } from "@/components/RobustnessPanel";
import NegatedOutcomePanel from "@/components/NegatedOutcomePanel";
import { ReportButton } from "@/components/ReportButton";
import { type ReportInput } from "@/lib/report";
import { citationInfo } from "@/lib/citation";
import { useLocale } from "@/i18n/locale";
import type { Locale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";
import { LanguageToggle } from "@/components/LanguageToggle";
import { InfoHint } from "@/components/InfoHint";
import { Kpi as UiKpi, SectionHeading } from "@/components/ui";
import { CalibrationWorkbench } from "@/components/calibration/CalibrationWorkbench";
import { AiAssist } from "@/components/AiAssist";
import {
  verifyAiWritingProvenance,
  buildAiWritingProvenanceEntry,
  type AiAdoptionMetadata,
} from "@/lib/ai-reviewed-summary";
import {
  AI_CONTRACT_VERSION,
  type AiAssistRequest,
  type AiReviewResponse,
  type DecisionRationaleTarget,
} from "@/lib/ai-contract";
import { CalibrationQuick } from "@/components/calibration/CalibrationQuick";
import {
  anchorsFromSpecs,
  migrateSpecsFromAnchors,
  effectiveStatus,
  specIsComputable,
  specIsProtocolReady,
  type CalibSpecs,
  type VarType,
} from "@/lib/calibration-model";
import { numericColumns, numericValues } from "@/lib/dataset-columns";
import {
  readLocalProject,
  writeLocalProject,
  type LocalProjectEnvelope,
} from "@/lib/project-storage";
import {
  buildRobustnessScenarios,
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
  METHODOLOGY_REFERENCES,
  RAW_DATA_FILENAME,
} from "@/lib/protocol-export";
import {
  EMPTY_ANALYSIS_DECISIONS,
  emptyAiWritingProvenance,
  EMPTY_RESEARCH_BRIEF,
  aggregateCaseDiagnostics,
  analysisDecisionReadiness,
  calibrationDefenseReadiness,
  deriveDecisionIssues,
  deriveSuggestedVarMeta,
  normalizeExpectations,
  normalizeSavedState,
  type CalibrationDefenseResult,
  researchBriefReadiness,
  type AiWritingProvenance,
  type AnalysisDecisionState,
  type Anchors,
  type DecisionIssue,
  type ResearchBrief,
  type ReadinessResult,
  type SavedState,
  type VarMeta,
  type VarRole,
  type WorkspaceDestination,
} from "@/lib/workspace-model";
import { inspectImport, type ImportPreflight } from "@/lib/import-preflight";


type SolBundle = {
  complex: ReturnType<typeof complexSolution>;
  intermediate: ReturnType<typeof intermediateSolution>;
  parsimonious: ReturnType<typeof parsimoniousSolution>;
};

const fmt = (v: number, d = 3) => {
  if (v == null || Number.isNaN(v)) return "—";
  const locale = typeof document !== "undefined" && document.documentElement.lang === "en" ? "en-GB" : "de-DE";
  return new Intl.NumberFormat(locale, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
};

/**
 * Ansicht des Kalibrier-Schritts. „Schnell" ist der Standard: Anker setzen,
 * Ergebnisse sehen. „Dokumentation" ist die vollständige Workbench. Die Wahl
 * gehört bewusst NICHT ins gespeicherte Projekt (sie beschreibt keine
 * Forschungsentscheidung), sondern nur in die Sitzung.
 */
type CalibrationView = "quick" | "doc";
const CALIBRATION_VIEW_STORAGE_KEY = "openqca_calibration_view";



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

/** Legacy ascending anchors for active raw fuzzy calibrations — used by report fallbacks. */
function rawAnchorsOf(ds: RawDataset, varMeta: Record<string, VarMeta>, calibSpecs: CalibSpecs): Anchors {
  return anchorsFromSpecs(
    Object.fromEntries(
      Object.entries(calibSpecs).filter(
        ([col, s]) =>
          varMeta[col]?.type === "raw" &&
          varMeta[col]?.role !== "ignore" &&
          (s.method === "direct" || s.method === "linear") &&
          (s.direct || s.linear),
      ),
    ),
  );
}


export default function Home() {
  const [locale] = useLocale();
  const [destination, setDestination] = useState<WorkspaceDestination>("answer");
  const [ds, setDs] = useState<RawDataset | null>(null);
  const [anchors, setAnchors] = useState<Anchors>({});
  const [calibSpecs, setCalibSpecs] = useState<CalibSpecs>({});
  const [demoMode, setDemoMode] = useState(false);
  const [calibMigrateBanner, setCalibMigrateBanner] = useState(false);
  const [varMeta, setVarMeta] = useState<Record<string, VarMeta>>({});
  const [focusVar, setFocusVar] = useState("");
  const [calibView, setCalibView] = useState<CalibrationView>("quick");
  const [freqCut, setFreqCut] = useState(1);
  const [consCut, setConsCut] = useState(0.8);
  const [xySource, setXySource] = useState("");
  const [expectations, setExpectations] = useState<Record<string, Expectation>>({});
  const [researchBrief, setResearchBrief] = useState<ResearchBrief>({ ...EMPTY_RESEARCH_BRIEF });
  const [analysisDecisions, setAnalysisDecisions] = useState<AnalysisDecisionState>({
    frequencyCutoff: { ...EMPTY_ANALYSIS_DECISIONS.frequencyCutoff },
    consistencyCutoff: { ...EMPTY_ANALYSIS_DECISIONS.consistencyCutoff },
    directionalExpectations: { ...EMPTY_ANALYSIS_DECISIONS.directionalExpectations },
  });
  const [aiWritingProvenance, setAiWritingProvenance] =
    useState<AiWritingProvenance>(emptyAiWritingProvenance);
  const aiTargetRevisions = useRef(new Map<string, number>());
  const aiProvenanceEpoch = useRef(0);
  const aiLoadValidationEpoch = useRef(0);
  const [resumeCandidate, setResumeCandidate] = useState<LocalProjectEnvelope | null>(null);
  const [localProjectStatus, setLocalProjectStatus] = useState("");
  const [importError, setImportError] = useState("");
  const [pendingImport, setPendingImport] = useState<ImportPreflight | null>(null);
  const [importReceipt, setImportReceipt] = useState<ImportPreflight | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function selectDestination(
    next: WorkspaceDestination,
    options: { history?: "push" | "replace" | "none"; focus?: boolean } = {},
  ) {
    const historyMode = options.history ?? "push";
    setDestination(next);
    if (historyMode !== "none") {
      const url = `${window.location.pathname}${window.location.search}#${next}`;
      window.history[historyMode === "push" ? "pushState" : "replaceState"](null, "", url);
    }
    if (options.focus !== false) {
      window.setTimeout(() => {
        document.getElementById(`workspace-${next}-heading`)?.focus();
      }, 0);
    }
  }

  useEffect(() => {
    const valid = new Set<WorkspaceDestination>(["answer", "research", "decisions", "evidence", "defense"]);
    const restoreDestination = () => {
      const hash = window.location.hash.slice(1);
      setDestination(valid.has(hash as WorkspaceDestination) ? (hash as WorkspaceDestination) : "answer");
    };
    restoreDestination();
    if (!valid.has(window.location.hash.slice(1) as WorkspaceDestination)) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#answer`);
    }
    window.addEventListener("popstate", restoreDestination);
    window.addEventListener("hashchange", restoreDestination);
    return () => {
      window.removeEventListener("popstate", restoreDestination);
      window.removeEventListener("hashchange", restoreDestination);
    };
  }, []);

  function firstRawFocus(dataset: RawDataset, meta: Record<string, VarMeta>): string {
    return (
      numericColumns(dataset).find(
        (column) => meta[column]?.type === "raw" && meta[column]?.role !== "ignore",
      ) ?? ""
    );
  }

  function resetAnalysisDecisions() {
    setAnalysisDecisions({
      frequencyCutoff: { ...EMPTY_ANALYSIS_DECISIONS.frequencyCutoff },
      consistencyCutoff: { ...EMPTY_ANALYSIS_DECISIONS.consistencyCutoff },
      directionalExpectations: { ...EMPTY_ANALYSIS_DECISIONS.directionalExpectations },
    });
  }
  function aiRevisionKey(task: AiReviewResponse["task"], target: string): string {
    return JSON.stringify([task, target]);
  }

  function currentAiTargetRevision(task: AiReviewResponse["task"], target: string): string {
    return `${aiProvenanceEpoch.current}:${aiTargetRevisions.current.get(aiRevisionKey(task, target)) ?? 0}`;
  }

  function bumpAiTargetRevision(task: AiReviewResponse["task"], target: string): void {
    const key = aiRevisionKey(task, target);
    aiLoadValidationEpoch.current += 1;
    aiTargetRevisions.current.set(key, (aiTargetRevisions.current.get(key) ?? 0) + 1);
  }

  function resetAiWritingProvenance(): void {
    aiLoadValidationEpoch.current += 1;
    aiProvenanceEpoch.current += 1;
    aiTargetRevisions.current.clear();
    setAiWritingProvenance(emptyAiWritingProvenance());
  }

  function clearBriefQuestionProvenance(): void {
    setAiWritingProvenance((current) =>
      current.brief_clarify.question
        ? { ...current, brief_clarify: {} }
        : current,
    );
  }

  function clearDecisionProvenance(decision: DecisionRationaleTarget): void {
    setAiWritingProvenance((current) => {
      if (!current.decision_rationale_review[decision]) return current;
      const decisionEntries = { ...current.decision_rationale_review };
      delete decisionEntries[decision];
      return { ...current, decision_rationale_review: decisionEntries };
    });
  }

  function clearCalibrationProvenance(column: string): void {
    setAiWritingProvenance((current) => {
      if (!current.calibration_evidence_gaps[column]) return current;
      const calibrationEntries = { ...current.calibration_evidence_gaps };
      delete calibrationEntries[column];
      return { ...current, calibration_evidence_gaps: calibrationEntries };
    });
  }

  function syntheticBrief(dataset: RawDataset, outcomeLabel: string): ResearchBrief {
    return locale === "de"
      ? {
          question: `Welche Kombinationen der synthetischen Bedingungen sind mit dem Set „${outcomeLabel}“ in ${dataset.name} verbunden?`,
          caseUniverse: `Synthetische Lehrfälle aus ${dataset.name}`,
          timePeriod: "Kein realer Zeitraum, synthetisches Lehrbeispiel",
          outcomeConcept: `dem Set „${outcomeLabel}“`,
          conditionSelectionRationale: "Die Bedingungen wurden ausschließlich zur Demonstration des QCA-Rechenwegs konstruiert.",
          confirmed: true,
        }
      : {
          question: `Which combinations of synthetic conditions are associated with the set “${outcomeLabel}” in ${dataset.name}?`,
          caseUniverse: `Synthetic teaching cases from ${dataset.name}`,
          timePeriod: "No real period, synthetic teaching example",
          outcomeConcept: `the set “${outcomeLabel}”`,
          conditionSelectionRationale: "The conditions were constructed solely to demonstrate the QCA workflow.",
          confirmed: true,
        };
  }

  function applyDataset(
    dataset: RawDataset,
    options: { demo?: boolean; destination?: WorkspaceDestination } = {},
  ) {
    const isDemo = options.demo === true;
    const meta = deriveSuggestedVarMeta(dataset);
    const columns = numericColumns(dataset);
    const specs = migrateSpecsFromAnchors(columns, dataset.anchors);
    for (const column of columns) {
      const metadata = meta[column];
      if (!metadata) continue;
      if (metadata.type === "raw") {
        const spec = specs[column];
        if (!spec.set.setLabel.trim()) spec.set.setLabel = column;
        if (!spec.set.definition.trim()) {
          spec.set.definition = t(locale, "calib.ph.definition", { col: column });
        }
        const fuzzyAnchors =
          spec.method === "direct" ? spec.direct : spec.method === "linear" ? spec.linear : undefined;
        if (fuzzyAnchors) {
          if (!fuzzyAnchors.meaningFullOut.trim()) {
            fuzzyAnchors.meaningFullOut = t(locale, "calib.ph.fullOut");
          }
          if (!fuzzyAnchors.meaningCrossover.trim()) {
            fuzzyAnchors.meaningCrossover = t(locale, "calib.ph.crossover");
          }
          if (!fuzzyAnchors.meaningFullIn.trim()) {
            fuzzyAnchors.meaningFullIn = t(locale, "calib.ph.fullIn");
          }
        }
        specs[column] = {
          ...spec,
          provisionalDefaults: true,
          anchorsFromData: true,
          status: spec.status === "unresolved" ? "provisional" : spec.status,
        };
      } else {
        const spec = specs[column];
        specs[column] = {
          ...spec,
          method: undefined,
          alreadyCalibratedProvenance:
            spec.alreadyCalibratedProvenance?.trim() ||
            t(locale, "calib.ph.provenance", { type: metadata.type, dataset: dataset.name }),
          set: {
            ...spec.set,
            setLabel: spec.set.setLabel || column,
            definition:
              spec.set.definition ||
              t(locale, "calib.ph.precalibratedDefinition", { col: column }),
          },
          provisionalDefaults: true,
          status: spec.status === "unresolved" ? "provisional" : spec.status,
        };
      }
    }
    const conditionColumns = columns.filter((column) => meta[column]?.role === "condition");
    const outcomeColumn = columns.find((column) => meta[column]?.role === "outcome") ?? "outcome";
    const outcomeLabel = outcomeColumn
      .replace(/^fs_|^demo_/, "")
      .replaceAll("_", " ")
      .replace(/ae/g, "ä")
      .replace(/oe/g, "ö")
      .replace(/ue/g, "ü")
      .replace(/^\p{Ll}/u, (letter) => letter.toLocaleUpperCase(locale));
    setDemoMode(isDemo);
    setDs(dataset);
    setAnchors({ ...dataset.anchors });
    setVarMeta(meta);
    setCalibSpecs(specs);
    setCalibMigrateBanner(false);
    setFocusVar(firstRawFocus(dataset, meta));
    setFreqCut(1);
    setConsCut(0.8);
    setExpectations(normalizeExpectations(conditionColumns, {}));
    setResearchBrief(isDemo ? syntheticBrief(dataset, outcomeLabel) : { ...EMPTY_RESEARCH_BRIEF });
    resetAnalysisDecisions();
    resetAiWritingProvenance();
    setXySource("");
    setImportError("");
    if (options.destination) {
      selectDestination(options.destination, { history: "replace", focus: false });
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedDemo = params.get("demo") === "1";
    if (requestedDemo) {
      params.delete("demo");
      const query = params.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query ? `?${query}` : ""}#answer`,
      );
    }
    const initialization = window.setTimeout(() => {
      if (requestedDemo) {
        applyDataset(DEMO, { demo: true, destination: "answer" });
      } else {
        setResumeCandidate(readLocalProject());
      }
    }, 0);
    return () => window.clearTimeout(initialization);
    // Dataset loading is intentionally one-shot on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const restorePreference = window.setTimeout(() => {
      try {
        const saved = window.sessionStorage.getItem(CALIBRATION_VIEW_STORAGE_KEY);
        if (saved === "quick" || saved === "doc") setCalibView(saved);
      } catch {
        // Session-only display preference is optional.
      }
    }, 0);
    return () => window.clearTimeout(restorePreference);
  }, []);

  function chooseCalibView(next: CalibrationView) {
    setCalibView(next);
    try {
      window.sessionStorage.setItem(CALIBRATION_VIEW_STORAGE_KEY, next);
    } catch {
      // The view still changes for this session.
    }
  }

  function documentVariable(column: string) {
    setFocusVar(column);
    chooseCalibView("doc");
    selectDestination("decisions");
    window.setTimeout(() => {
      document.getElementById("decision-calibration")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }
  function jumpToDecisionIssue(issue: DecisionIssue) {
    if (issue.kind === "researchBrief") {
      selectDestination("research");
      window.setTimeout(() => document.getElementById("brief-question")?.focus(), 0);
      return;
    }
    if (issue.kind === "calibration" && issue.column) {
      documentVariable(issue.column);
      return;
    }
    selectDestination("decisions");
    window.setTimeout(() => {
      document.getElementById(`decision-${issue.kind}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 0);
  }

  function stageImport(dataset: RawDataset, filename: string) {
    setPendingImport(inspectImport(dataset, filename));
    setImportError("");
  }

  function importCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        stageImport(parseCsv(String(reader.result), file.name), file.name);
      } catch (error) {
        setImportError(t(locale, "workspace.import.error", {
          message: error instanceof Error ? error.message : t(locale, "alert.unknown"),
        }));
      }
    };
    reader.onerror = () => setImportError(t(locale, "workspace.import.error", { message: t(locale, "alert.unknown") }));
    reader.readAsText(file);
  }

  async function importXlsx(file: File) {
    try {
      stageImport(await parseXlsxToDataset(file), file.name);
    } catch (error) {
      setImportError(t(locale, "workspace.import.error", {
        message: error instanceof Error ? error.message : t(locale, "alert.unknown"),
      }));
    }
  }

  function importFile(file: File) {
    setImportError("");
    if (/\.(xlsx|xls)$/i.test(file.name)) void importXlsx(file);
    else importCsv(file);
  }

  function commitImport() {
    if (!pendingImport || pendingImport.blockingIssues.length > 0) return;
    const receipt = pendingImport;
    applyDataset(receipt.dataset, { demo: false });
    setImportReceipt(receipt);
    setPendingImport(null);
    selectDestination("research", { history: "replace", focus: true });
  }

  function currentState(): SavedState {
    if (!ds) throw new Error("No active dataset");
    return {
      dataset: ds,
      anchors,
      varMeta,
      calibSpecs,
      demoMode,
      freqCut,
      consCut,
      expectations,
      researchBrief,
      analysisDecisions,
      aiWritingProvenance,
    };
  }

  async function loadState(raw: unknown): Promise<boolean> {
    let state: SavedState | null;
    try {
      state = normalizeSavedState(raw);
    } catch {
      return false;
    }
    if (!state) return false;
    const validationEpoch = ++aiLoadValidationEpoch.current;
    const verifiedProvenance = await verifyAiWritingProvenance(state);
    if (aiLoadValidationEpoch.current !== validationEpoch) return false;

    setDemoMode(state.demoMode);
    setDs(state.dataset);
    setAnchors(state.anchors);
    setVarMeta(state.varMeta);
    setCalibSpecs(state.calibSpecs);
    setCalibMigrateBanner(
      !(
        typeof raw === "object" &&
        raw !== null &&
        "calibSpecs" in raw &&
        raw.calibSpecs
      ),
    );
    setFreqCut(state.freqCut);
    setConsCut(state.consCut);
    setExpectations(state.expectations);
    setResearchBrief(state.researchBrief);
    setAnalysisDecisions(state.analysisDecisions);
    aiProvenanceEpoch.current += 1;
    aiTargetRevisions.current.clear();
    setAiWritingProvenance(verifiedProvenance);
    setFocusVar(firstRawFocus(state.dataset, state.varMeta));
    setImportError("");
    return true;
  }

  function saveLocalProject() {
    if (!ds) return;
    const saved = writeLocalProject(currentState());
    setLocalProjectStatus(saved ? t(locale, "data.localSaved") : t(locale, "data.localSaveFailed"));
    if (saved) setResumeCandidate(readLocalProject());
  }

  async function restoreLocalProject() {
    const saved = readLocalProject();
    if (!saved || !(await loadState(saved.state))) {
      setLocalProjectStatus(t(locale, "data.localMissing"));
      return;
    }
    setResumeCandidate(saved);
    setLocalProjectStatus(t(locale, "data.localRestored"));
    selectDestination("answer");
  }

  useEffect(() => {
    if (!ds || demoMode) return;
    writeLocalProject({
      dataset: ds,
      anchors,
      varMeta,
      calibSpecs,
      demoMode,
      freqCut,
      consCut,
      expectations,
      researchBrief,
      analysisDecisions,
      aiWritingProvenance,
    } satisfies SavedState);
  }, [
    aiWritingProvenance,
    analysisDecisions,
    anchors,
    calibSpecs,
    consCut,
    demoMode,
    ds,
    expectations,
    freqCut,
    researchBrief,
    varMeta,
  ]);

  function changeResearchBrief(
    field: keyof Omit<ResearchBrief, "confirmed">,
    value: string,
  ) {
    if (researchBrief[field] !== value) {
      bumpAiTargetRevision("brief_clarify", "question");
      if (field === "question") clearBriefQuestionProvenance();
    }
    setResearchBrief((current) => ({ ...current, [field]: value, confirmed: false }));
  }

  function changeAnalysisDecisions(next: AnalysisDecisionState): void {
    for (const decision of [
      "frequencyCutoff",
      "consistencyCutoff",
      "directionalExpectations",
    ] as const) {
      if (analysisDecisions[decision].rationale === next[decision].rationale) continue;
      bumpAiTargetRevision("decision_rationale_review", decision);
      clearDecisionProvenance(decision);
    }
    setAnalysisDecisions(next);
  }

  function changeCalibSpecs(next: CalibSpecs): void {
    for (const column of new Set([...Object.keys(calibSpecs), ...Object.keys(next)])) {
      const previousSpec = calibSpecs[column];
      const nextSpec = next[column];
      const previousSource = previousSpec
        ? [
            previousSpec.set.setLabel,
            previousSpec.set.definition,
            previousSpec.set.unit,
            previousSpec.set.scopePopulation,
            previousSpec.set.timePeriod,
          ]
        : [];
      const nextSource = nextSpec
        ? [
            nextSpec.set.setLabel,
            nextSpec.set.definition,
            nextSpec.set.unit,
            nextSpec.set.scopePopulation,
            nextSpec.set.timePeriod,
          ]
        : [];
      if (JSON.stringify(previousSource) !== JSON.stringify(nextSource)) {
        bumpAiTargetRevision("calibration_evidence_gaps", column);
      }
      if ((previousSpec?.set.definition ?? "") !== (nextSpec?.set.definition ?? "")) {
        clearCalibrationProvenance(column);
      }
    }
    setCalibSpecs(next);
  }

  async function adoptBriefQuestion(
    review: AiReviewResponse,
    metadata: AiAdoptionMetadata,
    submittedRequest: AiAssistRequest,
  ): Promise<boolean> {
    if (review.task !== "brief_clarify") return false;
    if (
      submittedRequest.task !== "brief_clarify" ||
      submittedRequest.payload.question !== researchBrief.question.trim()
    ) return false;
    const target = "question";
    const previousText = researchBrief.question;
    const adoptedText = review.suggested.question;
    const revision = currentAiTargetRevision(review.task, target);
    const entry = await buildAiWritingProvenanceEntry(metadata, previousText, adoptedText);
    if (currentAiTargetRevision(review.task, target) !== revision) return false;
    bumpAiTargetRevision(review.task, target);
    setResearchBrief((current) =>
      current.question === previousText
        ? { ...current, question: adoptedText, confirmed: false }
        : current,
    );
    setAiWritingProvenance((current) => ({
      ...current,
      brief_clarify: { question: entry },
    }));
    return true;
  }
  async function adoptDecisionRationale(
    review: AiReviewResponse,
    metadata: AiAdoptionMetadata,
    submittedRequest: AiAssistRequest,
  ): Promise<boolean> {
    if (review.task !== "decision_rationale_review") return false;
    if (
      submittedRequest.task !== "decision_rationale_review" ||
      submittedRequest.payload.decision !== review.suggested.decision
    ) return false;
    const decision = review.suggested.decision;
    if (
      submittedRequest.payload.rationale !== analysisDecisions[decision].rationale.trim()
    ) return false;
    const previousText = analysisDecisions[decision].rationale;
    const adoptedText = review.suggested.rationale;
    const revision = currentAiTargetRevision(review.task, decision);
    const entry = await buildAiWritingProvenanceEntry(metadata, previousText, adoptedText);
    if (currentAiTargetRevision(review.task, decision) !== revision) return false;
    bumpAiTargetRevision(review.task, decision);
    setAnalysisDecisions((current) =>
      current[decision].rationale === previousText
        ? {
            ...current,
            [decision]: { rationale: adoptedText, confirmed: false },
          }
        : current,
    );
    setAiWritingProvenance((current) => ({
      ...current,
      decision_rationale_review: {
        ...current.decision_rationale_review,
        [decision]: entry,
      },
    }));
    return true;
  }

  async function adoptCalibrationDefinition(
    review: AiReviewResponse,
    metadata: AiAdoptionMetadata,
    submittedRequest: AiAssistRequest,
  ): Promise<boolean> {
    if (review.task !== "calibration_evidence_gaps") return false;
    if (
      submittedRequest.task !== "calibration_evidence_gaps" ||
      submittedRequest.payload.variable !== review.suggested.variable
    ) return false;
    const column = review.suggested.variable;
    const spec = calibSpecs[column];
    if (!spec) return false;
    if (submittedRequest.payload.definition !== spec.set.definition.trim()) return false;
    const previousText = spec.set.definition;
    const adoptedText = review.suggested.definition;
    const revision = currentAiTargetRevision(review.task, column);
    const entry = await buildAiWritingProvenanceEntry(metadata, previousText, adoptedText);
    if (currentAiTargetRevision(review.task, column) !== revision) return false;
    bumpAiTargetRevision(review.task, column);
    setCalibSpecs((current) => {
      const currentSpec = current[column];
      if (!currentSpec || currentSpec.set.definition !== previousText) return current;
      return {
        ...current,
        [column]: {
          ...currentSpec,
          set: { ...currentSpec.set, definition: adoptedText },
          caseReviewConfirmed: false,
          sensitivity: { ...currentSpec.sensitivity, reviewed: false },
        },
      };
    });
    setAiWritingProvenance((current) => ({
      ...current,
      calibration_evidence_gaps: {
        ...current.calibration_evidence_gaps,
        [column]: entry,
      },
    }));
    return true;
  }

  function changeVarMeta(next: Record<string, VarMeta>) {
    setVarMeta(next);
    setResearchBrief((current) => ({ ...current, confirmed: false }));
    const activeConditions = ds
      ? numericColumns(ds).filter((column) => next[column]?.role === "condition")
      : [];
    setExpectations((current) => normalizeExpectations(activeConditions, current));
    setAnalysisDecisions((current) => ({
      ...current,
      directionalExpectations: {
        ...current.directionalExpectations,
        confirmed: false,
      },
    }));
  }

  function changeFreqCut(value: number) {
    setFreqCut(value);
    setAnalysisDecisions((current) => ({
      ...current,
      frequencyCutoff: { ...current.frequencyCutoff, confirmed: false },
    }));
  }

  function changeConsCut(value: number) {
    setConsCut(value);
    setAnalysisDecisions((current) => ({
      ...current,
      consistencyCutoff: { ...current.consistencyCutoff, confirmed: false },
    }));
  }

  function changeExpectations(next: Record<string, Expectation>) {
    setExpectations(next);
    setAnalysisDecisions((current) => ({
      ...current,
      directionalExpectations: {
        ...current.directionalExpectations,
        confirmed: false,
      },
    }));
  }

  const activeAnalysisCols = useMemo(
    () =>
      ds
        ? numericColumns(ds).filter((column) => {
            const meta = varMeta[column];
            return meta && meta.role !== "ignore";
          })
        : [],
    [ds, varMeta],
  );
  const selectedConditions = useMemo(
    () => activeAnalysisCols.filter((column) => varMeta[column]?.role === "condition"),
    [activeAnalysisCols, varMeta],
  );
  const selectedOutcomes = useMemo(
    () => activeAnalysisCols.filter((column) => varMeta[column]?.role === "outcome"),
    [activeAnalysisCols, varMeta],
  );
  const selectedRoleContractReady =
    selectedConditions.length >= 1 && selectedOutcomes.length === 1;
  const evaluation: CalibrationEvaluation = useMemo(
    () =>
      ds
        ? evaluateCalibration(ds, varMeta, calibSpecs)
        : { cases: [], cells: [], excludedCaseLabels: [], unresolvedCaseLabels: [] },
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
  const caseIdentifiers = useMemo(
    () =>
      ds
        ? ds.rows
            .map((row) => String(row[ds.caseCol] ?? "").trim())
            .filter((label) => label.length > 0)
        : [],
    [ds],
  );
  const excludedMissingCount = new Set([
    ...evaluation.excludedCaseLabels,
    ...evaluation.unresolvedCaseLabels,
  ]).size;
  const conditions = useMemo(
    () => setCols.filter((column) => varMeta[column]?.role === "condition"),
    [setCols, varMeta],
  );
  const outcome = useMemo(
    () =>
      selectedOutcomes.length === 1 && setCols.includes(selectedOutcomes[0])
        ? selectedOutcomes[0]
        : "",
    [selectedOutcomes, setCols],
  );
  const computedRoleContractReady =
    selectedRoleContractReady &&
    activeAnalysisCols.length === setCols.length &&
    activeAnalysisCols.every((column) => setCols.includes(column)) &&
    conditions.length === selectedConditions.length &&
    outcome === selectedOutcomes[0];
  const incompleteCalibrationColumns = useMemo(
    () => activeAnalysisCols.filter((column) => !setCols.includes(column)),
    [activeAnalysisCols, setCols],
  );
  const tt: TruthTableResult | null = useMemo(() => {
    if (
      !ds ||
      !computedRoleContractReady ||
      cases.length === 0 ||
      conditions.length > 12
    ) {
      return null;
    }
    try {
      return buildTruthTable({ cases, conditions, outcome, freqCut, consCut });
    } catch {
      return null;
    }
  }, [cases, computedRoleContractReady, conditions, ds, outcome, freqCut, consCut]);
  const sensitivity: SensitivityBundle = useMemo(() => {
    if (!ds || !computedRoleContractReady || conditions.length > 12) {
      return { resultsByColumn: {}, variantsByColumn: {} };
    }
    return buildSensitivityBundle({
      ds,
      varMeta,
      calibSpecs,
      conditions,
      outcome,
      freqCut,
      consCut,
    });
  }, [ds, varMeta, calibSpecs, conditions, outcome, freqCut, consCut, computedRoleContractReady]);
  const robustnessScenarios: RobustnessScenario[] = useMemo(() => {
    if (
      !ds ||
      !computedRoleContractReady ||
      conditions.length > 12 ||
      conditions.length < 1 ||
      !outcome
    ) {
      return [];
    }
    try {
      const scenarios = buildRobustnessScenarios({
        ds,
        varMeta,
        calibSpecs,
        conditions,
        outcome,
      });
      return scenarios[0]?.cases.length
        ? scenarios
        : cases.length
          ? [{ id: "base", label: "Basis-Kalibrierung", cases }]
          : [];
    } catch {
      return cases.length ? [{ id: "base", label: "Basis-Kalibrierung", cases }] : [];
    }
  }, [ds, computedRoleContractReady, conditions, outcome, varMeta, calibSpecs, cases]);
  const robustnessResult: CombinedRobustnessResult | null = useMemo(() => {
    if (
      !computedRoleContractReady ||
      !robustnessScenarios.length ||
      conditions.length < 1 ||
      !outcome
    ) {
      return null;
    }
    try {
      return runCombinedRobustnessGrid({
        scenarios: robustnessScenarios,
        conditions,
        outcome,
        freqCuts: [...new Set([Math.max(1, freqCut - 1), freqCut, freqCut + 1])].sort((a, b) => a - b),
        consCuts: [...new Set([0.7, 0.8, 0.9, 0.95, consCut])]
          .filter((cut) => cut >= 0 && cut <= 1)
          .sort((a, b) => a - b),
        priCuts: [null, 0.5, 0.75],
        baseline: { scenarioId: "base", freqCut, consCut, priCut: null },
        expectations: normalizeExpectations(conditions, expectations),
      });
    } catch {
      return null;
    }
  }, [
    computedRoleContractReady,
    conditions,
    consCut,
    expectations,
    freqCut,
    outcome,
    robustnessScenarios,
  ]);
  const necessity: ReturnType<typeof necessityAnalysis> | null = useMemo(() => {
    if (
      !computedRoleContractReady ||
      cases.length === 0 ||
      conditions.length === 0 ||
      !outcome
    ) {
      return null;
    }
    try {
      return necessityAnalysis(conditions, outcome, cases);
    } catch {
      return null;
    }
  }, [computedRoleContractReady, conditions, outcome, cases]);
  const suin: NecessityExpressionEntry[] | null = useMemo(() => {
    if (
      !computedRoleContractReady ||
      cases.length === 0 ||
      conditions.length === 0 ||
      !outcome
    ) {
      return null;
    }
    try {
      return necessarySupersets(conditions, outcome, cases, {
        inclCut: 0.9,
        covCut: 0.5,
        depth: Math.min(conditions.length, 3),
      });
    } catch {
      return null;
    }
  }, [computedRoleContractReady, conditions, outcome, cases]);
  const sol: SolBundle | null = useMemo(() => {
    if (!tt) return null;
    const currentExpectations = normalizeExpectations(conditions, expectations);
    return {
      complex: complexSolution(tt, cases),
      intermediate: intermediateSolution(tt, cases, currentExpectations),
      parsimonious: parsimoniousSolution(tt, cases),
    };
  }, [tt, cases, conditions, expectations]);

  const documentedCols = activeAnalysisCols.filter((column) =>
    specIsProtocolReady(calibSpecs[column], varMeta[column]?.type ?? "raw"),
  );
  const computableCalibration =
    activeAnalysisCols.length > 0 &&
    activeAnalysisCols.every((column) =>
      specIsComputable(calibSpecs[column], varMeta[column]?.type ?? "raw"),
    );
  const briefReadiness = researchBriefReadiness(
    researchBrief,
    selectedConditions,
    selectedOutcomes,
  );
  const decisionReadiness = analysisDecisionReadiness(analysisDecisions);
  const calibrationReadiness = calibrationDefenseReadiness(
    activeAnalysisCols,
    varMeta,
    calibSpecs,
  );
  const decisionIssues = deriveDecisionIssues({
    researchBrief,
    analysisDecisions,
    conditions: selectedConditions,
    outcomes: selectedOutcomes,
    activeColumns: activeAnalysisCols,
    varMeta,
    calibSpecs,
  });
  const resultsReady = tt !== null && sol !== null && necessity !== null && suin !== null;
  const defenseResultsReady = resultsReady && computedRoleContractReady;
  const defenseReady =
    !demoMode &&
    cases.length > 0 &&
    briefReadiness.ready &&
    decisionReadiness.ready &&
    calibrationReadiness.ready &&
    defenseResultsReady;
  const reportAvailable = cases.length > 0 && resultsReady;
  const reportProvisional = !defenseReady;
  const checklist = [
    { key: "workspace.defense.check.demo" as DictKey, ready: !demoMode },
    { key: "workspace.defense.check.cases" as DictKey, ready: cases.length > 0 },
    { key: "workspace.defense.check.brief" as DictKey, ready: briefReadiness.ready },
    { key: "workspace.defense.check.analysis" as DictKey, ready: decisionReadiness.ready },
    { key: "workspace.defense.check.calibration" as DictKey, ready: calibrationReadiness.ready },
    { key: "workspace.defense.check.results" as DictKey, ready: defenseResultsReady },
  ];
  const missingDefenseGroups = checklist
    .filter((item) => !item.ready)
    .map((item) => t(locale, item.key));

  return (
    <div className="oq-workspace-shell">
      <input
        ref={fileRef}
        type="file"
        aria-label={locale === "de" ? "Datei auswählen" : "Choose file"}
        accept=".csv,.txt,.tsv,.xlsx,.xls"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) importFile(file);
          event.target.value = "";
        }}
      />
      <Header />
      <div className="oq-workspace-frame">
        {pendingImport && (
          <ImportPreflightPanel
            preflight={pendingImport}
            onCommit={commitImport}
            onCancel={() => setPendingImport(null)}
          />
        )}
        <aside className="oq-workspace-sidebar">
          <WorkspaceNav destination={destination} onSelect={selectDestination} />
          {ds && <Glossary />}
        </aside>
        <main className="oq-workspace-main">
        {destination === "answer" && (
          <section className="oq-destination oq-destination--answer" aria-labelledby="workspace-answer-heading">
            <DestinationHeading destination="answer" />
            {!ds ? (
              <EntryWorkspace
                resumeCandidate={resumeCandidate}
                onLearn={() => applyDataset(DEMO, { demo: true, destination: "answer" })}
                onImport={() => fileRef.current?.click()}
                onResume={restoreLocalProject}
                importError={importError}
              />
            ) : (
              <AnswerWorkspace
                locale={locale}
                brief={researchBrief}
                conditions={conditions}
                incompleteCalibrationColumns={incompleteCalibrationColumns}
                roleSelectionReady={selectedRoleContractReady}
                outcome={outcome}
                calibSpecs={calibSpecs}
                cases={cases}
                excludedMissingCount={excludedMissingCount}
                tt={tt}
                sol={sol}
                demoMode={demoMode}
                defenseReady={defenseReady}
                issues={decisionIssues}
                robustness={robustnessResult}
                onSelectDestination={selectDestination}
                onJumpIssue={jumpToDecisionIssue}
              />
            )}
          </section>
        )}

        {destination === "research" && (
          <section className="oq-destination oq-destination--research" aria-labelledby="workspace-research-heading">
            <DestinationHeading destination="research" />
                {importReceipt && (
                  <ImportReceipt
                    receipt={importReceipt}
                    onAnswer={() => selectDestination("answer")}
                  />
                )}
            {!ds ? (
              <p className="hint">{t(locale, "workspace.noData")}</p>
            ) : (
              <>
                <ResearchBriefEditor
                  brief={researchBrief}
                  readiness={briefReadiness}
                  onChange={changeResearchBrief}
                  onConfirm={() => setResearchBrief((current) => ({ ...current, confirmed: true }))}
                />
                <AiAssist
                  label={locale === "en" ? "Clarify research brief" : "Forschungsdesign klären"}
                  request={() => ({
                    version: AI_CONTRACT_VERSION,
                    task: "brief_clarify",
                    locale,
                    payload: {
                      question: researchBrief.question,
                      caseUniverse: researchBrief.caseUniverse,
                      timePeriod: researchBrief.timePeriod,
                      outcomeConcept: researchBrief.outcomeConcept,
                      conditionSelectionRationale: researchBrief.conditionSelectionRationale,
                    },
                  })}
                  sourceRevision={() => currentAiTargetRevision("brief_clarify", "question")}
                  sensitiveValues={caseIdentifiers}
                  focusTargetId="brief-question"
                  onAdopt={adoptBriefQuestion}
                />
                <div className="oq-research-layout">
                  <div className="oq-research-primary">
                    <h2 id="workspace-variable-roles" className="oq-workspace-subheading" tabIndex={-1}>{t(locale, "workspace.roles.title")}</h2>
                    {!researchBrief.confirmed && (
                      <p className="hint">{t(locale, "workspace.roles.suggested")}</p>
                    )}
                    <VariablesSection
                      ds={ds}
                      varMeta={varMeta}
                      setVarMeta={changeVarMeta}
                      calibSpecs={calibSpecs}
                      conditionCount={conditions.length}
                      caseCount={cases.length}
                    />
                  </div>
                  <div className="oq-research-support">
                    <Card className="oq-plane--compact oq-research-project">
                      <H2>{t(locale, "workspace.data.actions")}</H2>
                      <p style={{ color: "var(--ink-2)", marginTop: 0 }}>
                        {t(locale, "workspace.dataset.summary", {
                          dataset: ds.name,
                          rows: ds.rows.length,
                          cases: cases.length,
                          excluded: excludedMissingCount,
                        })}
                      </p>
                      <div className="oq-action-row">
                        <Button onClick={() => fileRef.current?.click()}>{t(locale, "data.reloadBtn")}</Button>
                        <Button onClick={saveLocalProject}>{t(locale, "data.saveLocal")}</Button>
                        <Button onClick={restoreLocalProject}>{t(locale, "data.loadLocal")}</Button>
                        <CloudSaveLoad
                          getState={currentState}
                          onLoad={loadState}
                        />
                      </div>
                      {localProjectStatus && <p className="hint">{localProjectStatus}</p>}
                      {importError && <Diag kind="bad">{importError}</Diag>}
                    </Card>
                    <Card className="oq-plane--disclosure oq-research-examples">
                      <details>
                        <summary>{t(locale, "workspace.examples.summary")}</summary>
                        <div style={{ marginTop: 12 }}>
                          <ExampleDatasets
                            onSelect={(dataset) => applyDataset(dataset, { demo: true })}
                          />
                        </div>
                      </details>
                    </Card>
                  </div>
                </div>
                <div className="oq-research-disclosures">
                  {setCols.length > 0 && (
                    <Card className="oq-plane--disclosure">
                      <details>
                        <summary>{t(locale, "workspace.descriptives.summary")}</summary>
                        <div style={{ marginTop: 12 }}>
                          <Descriptives columns={setCols} cases={cases} />
                        </div>
                      </details>
                    </Card>
                  )}
                  <Card className="oq-plane--disclosure">
                    <details>
                      <summary>{t(locale, "workspace.rawData.summary")}</summary>
                      <div style={{ marginTop: 12 }}>
                        <DataSection ds={ds} />
                      </div>
                    </details>
                  </Card>
                </div>
              </>
            )}
          </section>
        )}

        {destination === "decisions" && (
          <section className="oq-destination oq-destination--decisions" aria-labelledby="workspace-decisions-heading">
            <DestinationHeading destination="decisions" />
            {!ds ? (
              <p className="hint">{t(locale, "workspace.noData")}</p>
            ) : (
              <>
                <DecisionLedger
                  issues={decisionIssues}
                  activeColumns={activeAnalysisCols}
                  varMeta={varMeta}
                  calibSpecs={calibSpecs}
                  freqCut={freqCut}
                  consCut={consCut}
                  conditions={selectedConditions}
                  expectations={expectations}
                  decisions={analysisDecisions}
                  onJump={jumpToDecisionIssue}
                />
                <div id="decision-calibration" style={{ scrollMarginTop: 96 }}>
                  <h2 className="oq-workspace-subheading">{t(locale, "workspace.calibration.title")}</h2>
                  {demoMode && <Diag kind="warn">{t(locale, "calib.demoNotice")}</Diag>}
                  {calibMigrateBanner && <Diag kind="warn">{t(locale, "calib.migrate.banner")}</Diag>}
                  <Card className="oq-plane--compact oq-calibration-switcher">
                    <div className="oq-action-row">
                      <button
                        type="button"
                        className="oq-btn"
                        aria-pressed={calibView === "quick"}
                        data-testid="calibration-view-quick"
                        onClick={() => chooseCalibView("quick")}
                      >
                        {t(locale, "workspace.calibration.quick")}
                      </button>
                      <button
                        type="button"
                        className="oq-btn"
                        aria-pressed={calibView === "doc"}
                        data-testid="calibration-view-doc"
                        onClick={() => chooseCalibView("doc")}
                      >
                        {t(locale, "workspace.calibration.documentation")}
                      </button>
                    </div>
                    <DocumentationMeter
                      columns={activeAnalysisCols}
                      doneCount={documentedCols.length}
                      documented={(column) => documentedCols.includes(column)}
                      onDocument={documentVariable}
                    />
                  </Card>
                  {calibView === "quick" ? (
                    <CalibrationQuick
                      ds={ds}
                      varMeta={varMeta}
                      calibSpecs={calibSpecs}
                      setCalibSpecs={changeCalibSpecs}
                      anchors={anchors}
                      setAnchors={setAnchors}
                      evaluation={evaluation}
                      onDocument={documentVariable}
                    />
                  ) : (
                    <CalibrationWorkbench
                      ds={ds}
                      sensitiveValues={caseIdentifiers}
                      varMeta={varMeta}
                      setVarMeta={changeVarMeta}
                      calibSpecs={calibSpecs}
                      setCalibSpecs={changeCalibSpecs}
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
                      aiSourceRevision={(column) =>
                        currentAiTargetRevision("calibration_evidence_gaps", column)
                      }
                      onAiAdopt={adoptCalibrationDefinition}
                    />
                  )}
                </div>
                <AnalysisDecisionEditor
                  freqCut={freqCut}
                  consCut={consCut}
                  expectations={expectations}
                  conditions={selectedConditions}
                  sensitiveValues={caseIdentifiers}
                  decisions={analysisDecisions}
                  tt={tt}
                  sol={sol}
                  onFreqCut={changeFreqCut}
                  onConsCut={changeConsCut}
                  onExpectations={changeExpectations}
                  onDecisions={changeAnalysisDecisions}
                  aiSourceRevision={(decision) =>
                    currentAiTargetRevision("decision_rationale_review", decision)
                  }
                  onAiAdopt={adoptDecisionRationale}
                />
                {!computableCalibration && (
                  <Diag kind="warn">{t(locale, "workspace.decisions.notComputable")}</Diag>
                )}
              </>
            )}
          </section>
        )}

        {destination === "evidence" && (
          <section className="oq-destination oq-destination--evidence" aria-labelledby="workspace-evidence-heading">
            <DestinationHeading destination="evidence" />
            {!ds ? (
              <p className="hint">{t(locale, "workspace.noData")}</p>
            ) : (
              <>
                <EvidenceChain
                  briefReady={briefReadiness.ready}
                  activeColumns={activeAnalysisCols}
                  calibration={calibrationReadiness}
                  excluded={excludedMissingCount}
                  analysisReady={decisionReadiness.ready}
                  onResearch={() => selectDestination("research")}
                  onDecisions={() => selectDestination("decisions")}
                />
                {!defenseReady && !demoMode && (
                  <ProvisionalMark onDecisions={() => selectDestination("decisions")} />
                )}
                {necessity && <NecessitySection necessity={necessity} suin={suin} />}
                <Card className="oq-plane--disclosure">
                  <details>
                    <summary>{t(locale, "workspace.evidence.truthTable")}</summary>
                    <div style={{ marginTop: 12 }}>
                      <TruthTableSection tt={tt} conditionCount={conditions.length} />
                    </div>
                  </details>
                </Card>
                {sol && tt && (
                  <Card className="oq-plane--disclosure">
                    <details>
                      <summary>{t(locale, "workspace.evidence.solutions")}</summary>
                      <div style={{ marginTop: 12 }}>
                        <SolutionSection tt={tt} sol={sol} cases={cases} />
                      </div>
                    </details>
                  </Card>
                )}
                <div>
                  <h2 className="oq-workspace-subheading">{t(locale, "workspace.evidence.diagnostics")}</h2>
                  <XyEvidence
                    cases={computedRoleContractReady ? cases : []}
                    conditions={computedRoleContractReady ? conditions : []}
                    outcome={computedRoleContractReady ? outcome : ""}
                    sol={sol}
                    xySource={xySource}
                    onXySource={setXySource}
                  />
                </div>
                <Card className="oq-plane--disclosure">
                  <details>
                    <summary>{t(locale, "workspace.evidence.robustness")}</summary>
                    <div style={{ marginTop: 12 }}>
                      <RobustnessPanel
                        cases={computedRoleContractReady ? cases : []}
                        robustness={robustnessResult}
                        scenarios={robustnessScenarios}
                        conditions={computedRoleContractReady ? conditions : []}
                        outcome={computedRoleContractReady ? outcome : ""}
                        freqCut={freqCut}
                        currentConsCut={consCut}
                        expectations={normalizeExpectations(conditions, expectations)}
                      />
                      <NegatedOutcomePanel
                        cases={computedRoleContractReady ? cases : []}
                        conditions={computedRoleContractReady ? conditions : []}
                        outcome={computedRoleContractReady ? outcome : ""}
                        freqCut={freqCut}
                        consCut={consCut}
                      />
                    </div>
                  </details>
                </Card>
              </>
            )}
          </section>
        )}

        {destination === "defense" && (
          <section className="oq-destination oq-destination--defense" aria-labelledby="workspace-defense-heading">
            <DestinationHeading destination="defense" />
            {!ds ? (
              <p className="hint">{t(locale, "workspace.noData")}</p>
            ) : (
              <>
                <DefenseChecklist ready={defenseReady} items={checklist} />
                <Card className="oq-plane--report">
                  <H2>{t(locale, "report.title")}</H2>
                  <p style={{ color: "var(--ink-2)", marginTop: 0 }}>{t(locale, "report.desc")}</p>
                  {demoMode ? (
                    <Diag kind="warn">{t(locale, "report.demoNotice")}</Diag>
                  ) : (
                    reportProvisional && (
                      <p className="hint">
                        {t(locale, "workspace.defense.reportMissing", {
                          groups: missingDefenseGroups.join(", "),
                        })}
                      </p>
                    )
                  )}
                  <ReportButton
                    disabled={!reportAvailable}
                    getInput={(): ReportInput | null => {
                      if (!reportAvailable || !ds || !tt || !sol || !necessity) return null;
                      return {
                        demo: demoMode,
                        provisional: reportProvisional,
                        provisionalReasons: missingDefenseGroups,
                        datasetName: ds.name,
                        caseCount: cases.length,
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
                        expectations: normalizeExpectations(conditions, expectations),
                        researchBrief,
                        analysisDecisions,
                        aiWritingProvenance,
                        rScript: defenseReady
                          ? buildRScript({
                              ds,
                              calibSpecs,
                              varMeta,
                              conditions,
                              outcome,
                              freqCut,
                              consCut,
                              sensitivity,
                              robustness: robustnessResult,
                              researchBrief,
                              analysisDecisions,
                              aiWritingProvenance,
                              expectations: normalizeExpectations(conditions, expectations),
                            })
                          : "",
                      };
                    }}
                  />
                </Card>
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
                  robustness={robustnessResult}
                  solutions={sol}
                  necessity={necessity}
                  necessitySupersets={suin}
                  defenseReady={defenseReady}
                  researchBrief={researchBrief}
                  analysisDecisions={analysisDecisions}
                  aiWritingProvenance={aiWritingProvenance}
                  expectations={normalizeExpectations(conditions, expectations)}
                  checklist={checklist}
                />
                <CitationCard />
                <Card className="oq-plane--reference">
                  <H2>{t(locale, "workspace.defense.references")}</H2>
                  <ul className="oq-reference-list">
                    {METHODOLOGY_REFERENCES.map((reference) => (
                      <li key={reference.id}>
                        <a href={reference.url} target="_blank" rel="noreferrer">
                          {reference.citation}
                        </a>
                        <span>{reference.scope}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="oq-plane--reference">
                  <H2>{t(locale, "workspace.defense.limitations")}</H2>
                  <p style={{ color: "var(--ink-2)" }}>
                    {t(locale, "workspace.defense.limitations.body")}
                  </p>
                </Card>
              </>
            )}
          </section>
        )}
        </main>
      </div>
    </div>
  );
}

const WORKSPACE_DESTINATIONS: Array<{ id: WorkspaceDestination; key: DictKey }> = [
  { id: "answer", key: "workspace.nav.answer" },
  { id: "research", key: "workspace.nav.research" },
  { id: "decisions", key: "workspace.nav.decisions" },
  { id: "evidence", key: "workspace.nav.evidence" },
  { id: "defense", key: "workspace.nav.defense" },
];

function WorkspaceNav({
  destination,
  onSelect,
}: {
  destination: WorkspaceDestination;
  onSelect: (destination: WorkspaceDestination) => void;
}) {
  const [locale] = useLocale();
  return (
    <nav className="oq-workspace-nav" aria-label={t(locale, "workspace.nav.aria")}>
      <div className="oq-workspace-nav__track">
        {WORKSPACE_DESTINATIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="oq-btn oq-workspace-nav__item"
            aria-current={destination === item.id ? "page" : undefined}
            onClick={() => onSelect(item.id)}
          >
            {t(locale, item.key)}
          </button>
        ))}
      </div>
    </nav>
  );
}

function DestinationHeading({ destination }: { destination: WorkspaceDestination }) {
  const [locale] = useLocale();
  const keyByDestination: Record<WorkspaceDestination, DictKey> = {
    answer: "workspace.answer.title",
    research: "workspace.research.title",
    decisions: "workspace.decisions.title",
    evidence: "workspace.evidence.title",
    defense: "workspace.defense.title",
  };
  return (
    <h1
      id={`workspace-${destination}-heading`}
      className="oq-workspace-title"
      tabIndex={-1}
    >
      {t(locale, keyByDestination[destination])}
    </h1>
  );
}

function ImportPreflightPanel({
  preflight,
  onCommit,
  onCancel,
}: {
  preflight: ImportPreflight;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const [locale] = useLocale();
  const de = locale === "de";
  return (
    <section className="oq-import-preflight" aria-labelledby="import-preflight-title" role="region">
      <h2 id="import-preflight-title">{de ? "Import vor dem Ersetzen prüfen" : "Review import before replacing the project"}</h2>
      <p>{de ? "Die aktive Analyse bleibt unverändert, bis Sie diesen Import übernehmen." : "Your active analysis remains unchanged until you commit this import."}</p>
      <dl>
        <div><dt>{de ? "Datei" : "File"}</dt><dd>{preflight.filename}</dd></div>
        <div><dt>{de ? "Zeilen" : "Rows"}</dt><dd>{new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(preflight.rowCount)}</dd></div>
        <div><dt>{de ? "Numerische Spalten" : "Numeric columns"}</dt><dd>{preflight.numericColumns.join(", ") || "—"}</dd></div>
        <div><dt>{de ? "Vorgeschlagene Bedingungen" : "Proposed conditions"}</dt><dd>{preflight.proposedConditions.join(", ") || "—"}</dd></div>
        <div><dt>{de ? "Vorgeschlagenes Outcome" : "Proposed outcome"}</dt><dd>{preflight.proposedOutcome ?? "—"}</dd></div>
      </dl>
      <p className="hint">{de ? "Vorlage: eine Fall-ID-Spalte und eine Zeile pro Fall; numerische Bedingungen und ein Outcome anschließend im Forschungsdesign prüfen." : "Template: one case-ID column and one row per case; then review numeric conditions and one outcome in Research design."}</p>
      {Object.entries(preflight.detectedTypes).map(([column, type]) => <span className="oq-status-chip" key={column}>{column}: {type}</span>)}
      {preflight.warnings.map((warning) => <Diag key={warning} kind="warn">{de ? ({ "No case identifier column was detected.": "Keine Fall-ID-Spalte erkannt." }[warning] ?? warning) : warning}</Diag>)}
      {preflight.blockingIssues.map((issue) => <Diag key={issue} kind="bad">{de ? ({
        "A case identifier column is required.": "Eine Fall-ID-Spalte ist erforderlich.",
        "Case identifiers must not be blank.": "Fall-IDs dürfen nicht leer sein.",
        "Case identifiers must be unique.": "Fall-IDs müssen eindeutig sein.",
        "The file contains no data rows.": "Die Datei enthält keine Datenzeilen.",
        "At least two numeric analysis columns are required.": "Mindestens zwei numerische Analysespalten sind erforderlich: eine Bedingung und ein Outcome.",
      }[issue] ?? issue) : issue}</Diag>)}
      <div className="oq-action-row"><button type="button" className="oq-btn oq-btn--primary" disabled={preflight.blockingIssues.length > 0} onClick={onCommit}>{de ? "Import übernehmen" : "Commit import"}</button><button type="button" className="oq-btn" onClick={onCancel}>{de ? "Abbrechen" : "Cancel"}</button></div>
    </section>
  );
}

function ImportReceipt({ receipt, onAnswer }: { receipt: ImportPreflight; onAnswer: () => void }) {
  const [locale] = useLocale();
  return <div className="oq-import-receipt" role="status"><strong>{locale === "de" ? "Import übernommen" : "Import committed"}</strong><span>{receipt.filename} · {new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(receipt.rowCount)} {locale === "de" ? "Zeilen" : "rows"}</span><button type="button" className="oq-btn" onClick={onAnswer}>{locale === "de" ? "Vorläufige Antwort öffnen" : "Open provisional Answer"}</button></div>;
}

function EntryWorkspace({
  resumeCandidate,
  onLearn,
  onImport,
  onResume,
  importError,
}: {
  resumeCandidate: LocalProjectEnvelope | null;
  onLearn: () => void;
  onImport: () => void;
  onResume: () => void;
  importError: string;
}) {
  const [locale] = useLocale();
  const resumedState = resumeCandidate ? normalizeSavedState(resumeCandidate.state) : null;
  const savedAt = resumeCandidate?.savedAt
    ? new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(resumeCandidate.savedAt))
    : "";
  return (
    <div className="oq-entry">
      <div className="oq-entry__intro">
        <h2>{t(locale, "workspace.start.title")}</h2>
        <p>{t(locale, "workspace.start.desc")}</p>
      </div>
      <div className="oq-entry__choices">
        <article className="oq-entry-choice">
          <div>
            <h3>{t(locale, "workspace.start.import.title")}</h3>
            <p>{t(locale, "workspace.start.import.desc")}</p>
            <p className="hint">{t(locale, "workspace.start.import.schema")}</p>
          </div>
          <button type="button" className="oq-btn oq-btn--primary" onClick={onImport}>
            {t(locale, "workspace.start.import.action")}
          </button>
        </article>
        <article className="oq-entry-choice">
          <div>
            <h3>{t(locale, "workspace.start.learn.title")}</h3>
            <p>{t(locale, "workspace.start.learn.desc")}</p>
          </div>
          <button type="button" className="oq-btn" onClick={onLearn}>
            {t(locale, "workspace.start.learn.action")}
          </button>
        </article>
        <article className="oq-entry-choice">
          <div>
            <h3>{t(locale, "workspace.start.resume.title")}</h3>
            <p>
              {resumeCandidate && resumedState
                ? t(locale, "workspace.start.resume.meta", {
                    dataset: resumedState.dataset.name,
                    savedAt,
                  })
                : t(locale, "workspace.start.resume.none")}
            </p>
          </div>
          <button
            type="button"
            className="oq-btn"
            disabled={!resumeCandidate || !resumedState}
            onClick={onResume}
          >
            {t(locale, "workspace.start.resume.action")}
          </button>
        </article>
      </div>
      {importError && <Diag kind="bad">{importError}</Diag>}
    </div>
  );
}

function ResearchBriefEditor({
  brief,
  readiness,
  onChange,
  onConfirm,
}: {
  brief: ResearchBrief;
  readiness: ReadinessResult;
  onChange: (field: keyof Omit<ResearchBrief, "confirmed">, value: string) => void;
  onConfirm: () => void;
}) {
  const [locale] = useLocale();
  const fields: Array<{
    id: keyof Omit<ResearchBrief, "confirmed">;
    label: DictKey;
    help: DictKey;
  }> = [
    { id: "question", label: "workspace.brief.question", help: "workspace.brief.question.help" },
    { id: "caseUniverse", label: "workspace.brief.caseUniverse", help: "workspace.brief.caseUniverse.help" },
    { id: "timePeriod", label: "workspace.brief.timePeriod", help: "workspace.brief.timePeriod.help" },
    { id: "outcomeConcept", label: "workspace.brief.outcomeConcept", help: "workspace.brief.outcomeConcept.help" },
    {
      id: "conditionSelectionRationale",
      label: "workspace.brief.conditionRationale",
      help: "workspace.brief.conditionRationale.help",
    },
  ];
  const incomplete = readiness.missing.some((item) => item !== "confirmation");
  const rolesIncomplete = readiness.missing.includes("conditions") || readiness.missing.includes("outcome");
  return (
    <Card className="oq-research-brief" data-testid="research-brief-editor">
      <H2>{t(locale, "workspace.brief.title")}</H2>
      <p style={{ color: "var(--ink-2)", marginTop: 0, maxWidth: "70ch" }}>
        {t(locale, "workspace.brief.desc")}
      </p>
      <div className="oq-brief-grid">
        {fields.map((field) => (
          <label key={field.id} className="oq-field" htmlFor={`brief-${field.id}`}>
            <span className="oq-field__label">{t(locale, field.label)}</span>
            <span id={`brief-${field.id}-help`} className="oq-field__help">
              {t(locale, field.help)}
            </span>
            <textarea
              id={`brief-${field.id}`}
              data-testid={`brief-${field.id}`}
              value={brief[field.id]}
              aria-describedby={`brief-${field.id}-help`}
              required
              aria-required="true"
              onChange={(event) => onChange(field.id, event.target.value)}
              rows={field.id === "question" || field.id === "conditionSelectionRationale" ? 3 : 2}
            />
          </label>
        ))}
      </div>
      <div className="oq-action-row">
        <button
          type="button"
          className="oq-btn oq-btn--primary"
          disabled={incomplete || brief.confirmed}
          onClick={onConfirm}
        >
          {brief.confirmed
            ? t(locale, "workspace.brief.confirmed")
            : t(locale, "workspace.brief.confirm")}
        </button>
        {!brief.confirmed && rolesIncomplete ? (
          <>
            <span className="hint">{t(locale, "workspace.brief.rolesRequired")}</span>
            <button
              type="button"
              className="oq-btn"
              onClick={() => {
                const roles = document.getElementById("workspace-variable-roles");
                roles?.scrollIntoView({ behavior: "smooth", block: "start" });
                roles?.focus({ preventScroll: true });
              }}
            >
              {t(locale, "workspace.brief.rolesAction")}
            </button>
          </>
        ) : !brief.confirmed ? (
          <span className="hint">{t(locale, "workspace.brief.invalidated")}</span>
        ) : null}
      </div>
    </Card>
  );
}

function decisionIssueLabel(locale: Locale, issue: DecisionIssue): string {
  if (issue.kind === "researchBrief") return t(locale, "workspace.decisions.brief");
  if (issue.kind === "calibration") {
    return t(locale, "workspace.decisions.calibration", { column: issue.column ?? "" });
  }
  if (issue.kind === "frequencyCutoff") return t(locale, "workspace.decisions.frequency");
  if (issue.kind === "consistencyCutoff") return t(locale, "workspace.decisions.consistency");
  return t(locale, "workspace.decisions.expectations");
}

const DECISION_MISSING_LABELS: Record<string, DictKey> = {
  question: "workspace.brief.question",
  caseUniverse: "workspace.brief.caseUniverse",
  timePeriod: "workspace.brief.timePeriod",
  outcomeConcept: "workspace.brief.outcomeConcept",
  conditionSelectionRationale: "workspace.brief.conditionRationale",
  spec: "calib.set.title",
  setLabel: "calib.set.label",
  definition: "calib.set.definition",
  missingPolicy: "calib.missing.policy",
  directAnchors: "calib.anchors.title",
  crispThreshold: "calib.crisp.threshold",
  method: "calib.method.title",
  alreadyCalibratedProvenance: "calib.method.provenance",
  unit: "calib.set.unit",
  scopePopulation: "calib.set.scope",
  meaningFullOut: "calib.evidence.target.fullOut",
  meaningCrossover: "calib.evidence.target.crossover",
  meaningFullIn: "calib.evidence.target.fullIn",
  meaningInclusion: "calib.crisp.meaning",
  methodConfirmed: "calib.method.confirm",
  caseReviewConfirmed: "workspace.decision.missing.caseReview",
  provisionalDefaults: "workspace.decision.missing.provisionalDefaults",
  sensitivityReview: "workspace.decision.missing.sensitivityReview",
  rationale: "workspace.decision.rationale",
  confirmation: "workspace.decision.confirm",
  set: "calib.evidence.target.set",
  fullOut: "calib.evidence.target.fullOut",
  crossover: "calib.evidence.target.crossover",
  fullIn: "calib.evidence.target.fullIn",
  threshold: "calib.evidence.target.threshold",
};

function decisionMissingLabel(locale: Locale, item: string): string {
  return t(
    locale,
    DECISION_MISSING_LABELS[item] ?? "workspace.decision.missing.other",
  );
}

function DecisionLedger({
  issues,
  activeColumns,
  varMeta,
  calibSpecs,
  freqCut,
  consCut,
  conditions,
  expectations,
  decisions,
  onJump,
}: {
  issues: DecisionIssue[];
  activeColumns: string[];
  varMeta: Record<string, VarMeta>;
  calibSpecs: CalibSpecs;
  freqCut: number;
  consCut: number;
  conditions: string[];
  expectations: Record<string, Expectation>;
  decisions: AnalysisDecisionState;
  onJump: (issue: DecisionIssue) => void;
}) {
  const [locale] = useLocale();
  type LedgerEntry = {
    target: DecisionIssue;
    value: string;
    rationale: string;
    status: string;
  };
  const issueById = new Map(issues.map((issue) => [issue.id, issue]));
  const target = (
    id: string,
    kind: DecisionIssue["kind"],
    column?: string,
  ): DecisionIssue =>
    issueById.get(id) ?? {
      id,
      kind,
      ...(column ? { column } : {}),
      status: "unconfirmed",
      protocolReady: true,
      missingFields: [],
      missingEvidence: [],
    };
  const expectationLabel = (value: Expectation) =>
    t(
      locale,
      value === "absent"
        ? "sol.exp.absent"
        : value === "either"
          ? "sol.exp.either"
          : "sol.exp.present",
    );
  const configuredEntries: LedgerEntry[] = [
    ...activeColumns.map((column): LedgerEntry => {
      const spec = calibSpecs[column];
      const issue = issueById.get(`calibration-${column}`);
      return {
        target: target(`calibration-${column}`, "calibration", column),
        value: spec
          ? [spec.set.setLabel.trim() || column, spec.method].filter(Boolean).join(" · ")
          : column,
        rationale: spec?.set.definition ?? "",
        status: issue?.status ?? (spec ? effectiveStatus(spec, varMeta[column]?.type ?? "raw") : "unresolved"),
      };
    }),
    {
      target: target("frequencyCutoff", "frequencyCutoff"),
      value: String(freqCut),
      rationale: decisions.frequencyCutoff.rationale,
      status: issueById.get("frequencyCutoff")?.status ?? t(locale, "workspace.decision.confirmed"),
    },
    {
      target: target("consistencyCutoff", "consistencyCutoff"),
      value: fmt(consCut),
      rationale: decisions.consistencyCutoff.rationale,
      status: issueById.get("consistencyCutoff")?.status ?? t(locale, "workspace.decision.confirmed"),
    },
    {
      target: target("directionalExpectations", "directionalExpectations"),
      value: conditions
        .map((condition) => `${condition}: ${expectationLabel(expectations[condition] ?? "present")}`)
        .join(" · "),
      rationale: decisions.directionalExpectations.rationale,
      status:
        issueById.get("directionalExpectations")?.status ??
        t(locale, "workspace.decision.confirmed"),
    },
  ];
  const configuredById = new Map(configuredEntries.map((entry) => [entry.target.id, entry]));
  const openEntries = issues.map(
    (issue): LedgerEntry =>
      configuredById.get(issue.id) ?? {
        target: issue,
        value: "",
        rationale: "",
        status: issue.status,
      },
  );
  const entries = [
    ...openEntries,
    ...configuredEntries.filter((entry) => !issueById.has(entry.target.id)),
  ];

  return (
    <Card className="oq-decision-ledger" data-testid="decision-ledger">
      <div className="oq-ledger-heading">
        <div>
          <H2>{t(locale, "workspace.decisions.ledgerTitle")}</H2>
          <p className="hint">{t(locale, "workspace.decisions.priority")}</p>
        </div>
        <strong className={issues.length ? "oq-status oq-status--warn" : "oq-status oq-status--ok"}>
          {issues.length
            ? t(locale, "workspace.decisions.open", { n: issues.length })
            : t(locale, "workspace.decisions.ready")}
        </strong>
      </div>
      {issues[0] && (
        <p className="oq-ledger-strongest">
          {t(locale, "workspace.decisions.strongest")}: {decisionIssueLabel(locale, issues[0])}
        </p>
      )}
      <ol className="oq-ledger-list">
        {entries.map((entry) => {
          const missing = [
            ...new Set(
              [...entry.target.missingFields, ...entry.target.missingEvidence].map((item) =>
                decisionMissingLabel(locale, item),
              ),
            ),
          ];
          const visibleMissing = missing.slice(0, 3).join(", ");
          const remainingMissing = missing.length - 3;
          return (
            <li
              key={entry.target.id}
              className="oq-ledger-item"
              data-testid={`decision-ledger-${entry.target.id}`}
            >
              <div>
                <strong>{decisionIssueLabel(locale, entry.target)}</strong>
                <span>{entry.status}</span>
                {entry.value && (
                  <small>
                    {t(locale, "workspace.decisions.currentValue")}: {entry.value}
                  </small>
                )}
                {entry.rationale && (
                  <small>
                    {t(locale, "workspace.decision.rationale")}: {entry.rationale}
                  </small>
                )}
                {missing.length > 0 && (
                  <small>
                    {t(locale, "workspace.decisions.missing", { items: visibleMissing })}
                    {remainingMissing > 0 &&
                      ` ${t(locale, "workspace.decision.missing.more", {
                        n: remainingMissing,
                      })}`}
                  </small>
                )}
              </div>
              <button type="button" className="oq-btn" onClick={() => onJump(entry.target)}>
                {t(locale, "workspace.decisions.jump")}
              </button>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function AnalysisDecisionEditor({
  freqCut,
  consCut,
  expectations,
  conditions,
  sensitiveValues,
  decisions,
  tt,
  sol,
  onFreqCut,
  onConsCut,
  onExpectations,
  onDecisions,
  aiSourceRevision,
  onAiAdopt,
}: {
  freqCut: number;
  consCut: number;
  expectations: Record<string, Expectation>;
  conditions: string[];
  sensitiveValues: readonly string[];
  decisions: AnalysisDecisionState;
  tt: TruthTableResult | null;
  sol: SolBundle | null;
  onFreqCut: (value: number) => void;
  onConsCut: (value: number) => void;
  onExpectations: (value: Record<string, Expectation>) => void;
  onDecisions: (value: AnalysisDecisionState) => void;
  aiSourceRevision: (decision: DecisionRationaleTarget) => string;
  onAiAdopt: (
    review: AiReviewResponse,
    metadata: AiAdoptionMetadata,
    submittedRequest: AiAssistRequest,
  ) => boolean | void | Promise<boolean | void>;
}) {
  const [locale] = useLocale();
  const [coachDecision, setCoachDecision] =
    useState<DecisionRationaleTarget | null>(null);
  const positiveRows = tt?.rows.filter((row) => row.output === 1).length ?? 0;
  const unassigned = tt ? tt.totalCaseCount - tt.assignedCaseCount : 0;

  function updateDecision(
    key: keyof AnalysisDecisionState,
    patch: Partial<AnalysisDecisionState[typeof key]>,
  ) {
    onDecisions({ ...decisions, [key]: { ...decisions[key], ...patch } });
  }

  function decisionCoach(decision: DecisionRationaleTarget) {
    if (coachDecision !== decision) return null;
    return (
      <div id={`decision-ai-coach-${decision}`} className="oq-decision-coach">
        <AiAssist
          key={decision}
          label={locale === "en" ? "Review rationale" : "Begründung prüfen"}
          request={() => ({
            version: AI_CONTRACT_VERSION,
            task: "decision_rationale_review",
            locale,
            payload: { decision, rationale: decisions[decision].rationale },
          })}
          sourceRevision={() => aiSourceRevision(decision)}
          sensitiveValues={sensitiveValues}
          focusTargetId={`decision-rationale-${decision}`}
          onAdopt={onAiAdopt}
        />
      </div>
    );
  }

  function coachToggle(decision: DecisionRationaleTarget) {
    const expanded = coachDecision === decision;
    return (
      <button
        type="button"
        className="oq-btn oq-btn--secondary oq-decision-coach-toggle"
        aria-expanded={expanded}
        aria-controls={`decision-ai-coach-${decision}`}
        onClick={() => setCoachDecision(expanded ? null : decision)}
      >
        {expanded
          ? locale === "en"
            ? "Close AI coach"
            : "KI-Coach schließen"
          : locale === "en"
            ? "AI coach for this decision"
            : "KI-Coach für diese Entscheidung"}
      </button>
    );
  }

  return (
    <div className="oq-decision-blocks">
      <Card id="decision-frequencyCutoff" data-testid="decision-frequency-cutoff">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <H2>{t(locale, "workspace.decisions.frequency")}</H2>
          <InfoHint title={t(locale, "info.freqCutoff.title")} body={t(locale, "info.freqCutoff.body")} />
        </div>
        <Field label={t(locale, "tt.freqCut")}>
          <input
            data-testid="truth-table-frequency-cut"
            type="number"
            min={1}
            value={freqCut}
            onChange={(event) => onFreqCut(Math.max(1, Number(event.target.value) || 1))}
            style={{ ...inputStyle, width: 110 }}
          />
        </Field>
        <DecisionRationale
          value={decisions.frequencyCutoff.rationale}
          confirmed={decisions.frequencyCutoff.confirmed}
          id="decision-rationale-frequencyCutoff"
          onRationale={(rationale) => updateDecision("frequencyCutoff", { rationale, confirmed: false })}
          onConfirm={() => updateDecision("frequencyCutoff", { confirmed: true })}
        />
        {coachToggle("frequencyCutoff")}
        {decisionCoach("frequencyCutoff")}
        <p className="hint">
          {t(locale, "workspace.decision.frequency.effect", {
            positive: positiveRows,
            unassigned,
            value: freqCut,
          })}
        </p>
        <p className="hint">{t(locale, "workspace.decision.effect.note")}</p>
      </Card>

      <Card id="decision-consistencyCutoff" data-testid="decision-consistency-cutoff">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <H2>{t(locale, "workspace.decisions.consistency")}</H2>
          <InfoHint title={t(locale, "info.consCutoff.title")} body={t(locale, "info.consCutoff.body")} />
        </div>
        <Field label={t(locale, "tt.consCut")}>
          <div className="oq-cutoff-control">
            <input
              data-testid="truth-table-consistency-cut"
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={consCut}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value)) onConsCut(Math.min(1, Math.max(0.5, value)));
              }}
              style={{ ...inputStyle, width: 110 }}
            />
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.01}
              value={consCut}
              aria-label={t(locale, "tt.consCut")}
              onChange={(event) => onConsCut(Number(event.target.value))}
            />
          </div>
        </Field>
        <DecisionRationale
          value={decisions.consistencyCutoff.rationale}
          confirmed={decisions.consistencyCutoff.confirmed}
          id="decision-rationale-consistencyCutoff"
          onRationale={(rationale) => updateDecision("consistencyCutoff", { rationale, confirmed: false })}
          onConfirm={() => updateDecision("consistencyCutoff", { confirmed: true })}
        />
        {coachToggle("consistencyCutoff")}
        {decisionCoach("consistencyCutoff")}
        <p className="hint">
          {t(locale, "workspace.decision.consistency.effect", {
            positive: positiveRows,
            unassigned,
            value: consCut,
          })}
        </p>
        <p className="hint">{t(locale, "workspace.decision.effect.note")}</p>
      </Card>

      <Card id="decision-directionalExpectations" data-testid="decision-directional-expectations">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <H2>{t(locale, "workspace.decisions.expectations")}</H2>
          <InfoHint title={t(locale, "sol.exp.label")} body={t(locale, "sol.exp.hint")} />
        </div>
        <div className="oq-expectations">
          {conditions.map((condition) => (
            <label key={condition} className="oq-field">
              <span className="oq-field__label">{condition.replace(/^fs_/, "")}</span>
              <select
                value={expectations[condition] ?? "present"}
                onChange={(event) =>
                  onExpectations({
                    ...expectations,
                    [condition]: event.target.value as Expectation,
                  })
                }
              >
                <option value="present">{t(locale, "sol.exp.present")}</option>
                <option value="absent">{t(locale, "sol.exp.absent")}</option>
                <option value="either">{t(locale, "sol.exp.either")}</option>
              </select>
            </label>
          ))}
        </div>
        <DecisionRationale
          value={decisions.directionalExpectations.rationale}
          confirmed={decisions.directionalExpectations.confirmed}
          id="decision-rationale-directionalExpectations"
          onRationale={(rationale) =>
            updateDecision("directionalExpectations", { rationale, confirmed: false })
          }
          onConfirm={() => updateDecision("directionalExpectations", { confirmed: true })}
        />
        {coachToggle("directionalExpectations")}
        {decisionCoach("directionalExpectations")}
        <p className="hint">
          {t(locale, "workspace.decision.expectations.effect", {
            models: sol?.intermediate.models.length ?? 0,
          })}
        </p>
        <p className="hint">{t(locale, "workspace.decision.effect.note")}</p>
      </Card>
    </div>
  );
}

function DecisionRationale({
  value,
  confirmed,
  id,
  onRationale,
  onConfirm,
}: {
  id: string;
  value: string;
  confirmed: boolean;
  onRationale: (value: string) => void;
  onConfirm: () => void;
}) {
  const [locale] = useLocale();
  return (
    <div className="oq-decision-rationale">
      <label className="oq-field">
        <span className="oq-field__label">{t(locale, "workspace.decision.rationale")}</span>
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(event) => onRationale(event.target.value)}
        />
      </label>
      <button
        type="button"
        className="oq-btn"
        disabled={!value.trim() || confirmed}
        onClick={onConfirm}
      >
        {confirmed
          ? t(locale, "workspace.decision.confirmed")
          : t(locale, "workspace.decision.confirm")}
      </button>
    </div>
  );
}

function AnswerWorkspace({
  locale,
  brief,
  conditions,
  incompleteCalibrationColumns,
  roleSelectionReady,
  outcome,
  calibSpecs,
  cases,
  excludedMissingCount,
  tt,
  sol,
  demoMode,
  defenseReady,
  issues,
  robustness,
  onSelectDestination,
  onJumpIssue,
}: {
  locale: Locale;
  brief: ResearchBrief;
  conditions: string[];
  incompleteCalibrationColumns: string[];
  roleSelectionReady: boolean;
  outcome: string;
  calibSpecs: CalibSpecs;
  cases: QcaCase[];
  excludedMissingCount: number;
  tt: TruthTableResult | null;
  sol: SolBundle | null;
  demoMode: boolean;
  defenseReady: boolean;
  issues: DecisionIssue[];
  robustness: CombinedRobustnessResult | null;
  onSelectDestination: (destination: WorkspaceDestination) => void;
  onJumpIssue: (issue: DecisionIssue) => void;
}) {
  const model = sol?.intermediate.models[0] ?? null;
  const positiveRows = tt?.rows.filter((row) => row.output === 1).length ?? 0;
  const analysisStatus =
    !conditions.length || !outcome || cases.length === 0 || conditions.length > 12 || !tt
      ? "notComputable"
      : model
        ? "solution"
        : "noSolution";
  const maturity = demoMode ? "synthetic" : defenseReady ? "ready" : "provisional";
  const setLabel = (column: string) => calibSpecs[column]?.set.setLabel.trim() || column.replace(/^fs_/, "");
  const pathText = model?.paths.map((path) => {
    const terms = [...path.term].flatMap((bit, index) => {
      if (bit === "-") return [];
      const label = setLabel(conditions[index]);
      return [
        bit === "0"
          ? t(locale, "workspace.answer.absence", { set: label })
          : label,
      ];
    });
    return terms.join(t(locale, "workspace.answer.and"));
  }) ?? [];
  const statedOutcome = brief.outcomeConcept.trim();
  const outcomeText =
    statedOutcome
      .replace(/^zugehörigkeit\s+zum\s+/i, "dem ")
      .replace(/^zugehörigkeit\s+zur\s+/i, "der ")
      .replace(/^zugehörigkeit\s+zu\s+/i, "")
      .replace(/^membership\s+(?:in|of)\s+/i, "") ||
    calibSpecs[outcome]?.set.setLabel.trim() ||
    outcome.replace(/^fs_/, "");
  const formula = model
    ? `${model.paths.map((path) => path.expression.replace(/fs_/g, "").toUpperCase()).join("  +  ")} → ${outcome.replace(/^fs_/, "").toUpperCase()}`
    : "";
  const diagnostics = model
    ? aggregateCaseDiagnostics(model, conditions, outcome, cases)
    : null;
  const diagnosticGroups = diagnostics
    ? [
        { label: t(locale, "workspace.answer.cases.typical"), names: diagnostics.typical },
        { label: t(locale, "workspace.answer.cases.kind"), names: diagnostics.deviantConsistencyKind },
        { label: t(locale, "workspace.answer.cases.degree"), names: diagnostics.deviantConsistencyDegree },
        { label: t(locale, "workspace.answer.cases.uncovered"), names: diagnostics.deviantCoverage },
        { label: t(locale, "workspace.answer.cases.crossover"), names: diagnostics.atCrossover },
      ]
    : [];
  const nonEmptyDiagnostics = diagnosticGroups.filter((group) => group.names.length > 0);
  const emptyDiagnostics = diagnosticGroups.filter((group) => group.names.length === 0);
  const stability = robustness?.solutionStability.find(
    (item) => item.type === "intermediate" && item.expression === model?.paths.map((path) => path.expression).join("+"),
  ) ?? robustness?.solutionStability.find((item) => item.type === "intermediate");
  let limitation = "";
  if (roleSelectionReady && incompleteCalibrationColumns.length) {
    limitation = t(locale, "workspace.answer.incompleteCalibration", {
      columns: incompleteCalibrationColumns.map(setLabel).join(", "),
    });
  } else if (!roleSelectionReady || !conditions.length || !outcome) {
    limitation = t(locale, "workspace.answer.noRoles");
  } else if (cases.length === 0) limitation = t(locale, "workspace.answer.noCases");
  else if (conditions.length > 12) {
    limitation = t(locale, "workspace.answer.tooMany", { n: conditions.length });
  } else if (tt && positiveRows === 0) limitation = t(locale, "workspace.answer.noPositive");
  else if (tt && !model) limitation = t(locale, "workspace.answer.noModel");
  else if (!tt) limitation = t(locale, "workspace.answer.calculationFailed");

  return (
    <div className="oq-answer">
      <section className="oq-answer-instrument">
        <div className="oq-answer-instrument__header">
          <div className="oq-answer__question">
            {brief.confirmed ? (
              <>
                <p>{brief.question}</p>
                {(brief.caseUniverse || brief.timePeriod) && (
                  <small>
                    {[brief.caseUniverse, brief.timePeriod].filter(Boolean).join(" · ")}
                  </small>
                )}
              </>
            ) : (
              <div className="oq-inline-cta">
                <p>{t(locale, "workspace.answer.question.pending")}</p>
                <button type="button" className="oq-btn oq-btn--secondary" onClick={() => onSelectDestination("research")}>
                  {t(locale, "workspace.answer.question.action")}
                </button>
              </div>
            )}
          </div>
          <strong className={`oq-maturity oq-maturity--${maturity}`}>
            {t(locale, `workspace.answer.maturity.${maturity}` as DictKey)}
          </strong>
        </div>

        <div className="oq-answer__analysis-state oq-status-axes">
          <strong>{t(locale, `workspace.answer.analysis.${analysisStatus}` as DictKey)}</strong>
          {model && (
            <span>
              {demoMode
                ? t(locale, "workspace.answer.syntheticReason")
                : defenseReady
                  ? t(locale, "workspace.defense.ready")
                  : `${issues.length} ${t(locale, "workspace.decisions.title").toLocaleLowerCase(locale)}`}
            </span>
          )}
        </div>

        {model ? (
          <>
            <div className="oq-answer-model">
              <div className="oq-answer__result">
                <p className="oq-answer__statement">
                  {t(locale, "workspace.answer.statement", {
                    paths: pathText.join(t(locale, "workspace.answer.or")),
                    cases: cases.length,
                    outcome: outcomeText,
                  })}
                </p>
                {sol && sol.intermediate.models.length > 1 && (
                  <Diag kind="warn">
                    {t(locale, "workspace.answer.ambiguous", { n: sol.intermediate.models.length })}
                  </Diag>
                )}
                <div
                  className="oq-formula oq-answer__formula"
                  data-testid="solution-formula-intermediate"
                >
                  {formula}
                </div>
                <p className="oq-answer__noncausal">{t(locale, "workspace.answer.noncausal")}</p>
              </div>

              <div className="oq-answer__fit" data-testid="solution-kpis-intermediate">
                <div className="oq-answer__kpis">
                  <div className="oq-answer-kpi">
                    <Kpi v={fmt(model.solutionConsistency)} l={t(locale, "sol.kpi.consistency")} />
                    <small>{t(locale, "gloss.consistency.def")}</small>
                  </div>
                  <div className="oq-answer-kpi">
                    <Kpi v={fmt(model.solutionCoverage)} l={t(locale, "sol.kpi.coverage")} />
                    <small>{t(locale, "gloss.coverage.def")}</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="oq-answer__evidence-row">
              {diagnostics && (
                <div className="oq-answer__diagnostics" data-testid="answer-case-summary">
                  <div className="oq-case-summary">
                    {nonEmptyDiagnostics.map((group) => (
                      <DiagGroup key={group.label} label={group.label} names={group.names} />
                    ))}
                    {emptyDiagnostics.length > 0 && (
                      <p className="oq-case-summary__empty">
                        <strong>{emptyDiagnostics.map((group) => group.label).join(" · ")}</strong>
                        <span>{t(locale, "diag.none")}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              <aside className="oq-answer__next-action">
                {issues[0] ? (
                  <>
                    <span>{t(locale, "workspace.decisions.strongest")}</span>
                    <strong>{decisionIssueLabel(locale, issues[0])}</strong>
                    <button
                      type="button"
                      className="oq-btn oq-btn--primary"
                      onClick={() => onJumpIssue(issues[0])}
                    >
                      {t(locale, "workspace.decisions.jump")}
                    </button>
                  </>
                ) : (
                  <>
                    <span>{t(locale, "workspace.answer.maturity.ready")}</span>
                    <strong>{t(locale, "workspace.defense.ready")}</strong>
                  </>
                )}
              </aside>
            </div>

            {(excludedMissingCount > 0 || (stability && robustness)) && (
              <div className="oq-answer__instrument-footer">
                {excludedMissingCount > 0 && (
                  <Diag kind="warn">{t(locale, "calib.missing.excluded", { n: excludedMissingCount })}</Diag>
                )}
                {stability && robustness && (
                  <p className="oq-robustness-line">
                    {t(locale, "workspace.answer.robustness", {
                      stable: stability.cells,
                      total: robustness.totalCells,
                    })}{" "}
                    <button type="button" className="oq-link-button" onClick={() => onSelectDestination("evidence")}>
                      {t(locale, "workspace.answer.evidence")}
                    </button>
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="oq-answer__limited">
            <p>{limitation}</p>
            {issues[0] && (
              <button type="button" className="oq-btn oq-btn--primary" onClick={() => onJumpIssue(issues[0])}>
                {t(locale, "workspace.decisions.jump")}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function EvidenceChain({
  briefReady,
  activeColumns,
  calibration,
  excluded,
  analysisReady,
  onResearch,
  onDecisions,
}: {
  briefReady: boolean;
  activeColumns: string[];
  calibration: CalibrationDefenseResult;
  excluded: number;
  analysisReady: boolean;
  onResearch: () => void;
  onDecisions: () => void;
}) {
  const [locale] = useLocale();
  const sourced = calibration.columns.filter(
    (column) =>
      column.protocolReady &&
      (column.effectiveStatus === "sourced" || column.effectiveStatus === "externally_checked"),
  ).length;
  const rows = [
    { label: t(locale, "workspace.evidence.brief"), value: briefReady ? "✓" : "○", action: onResearch },
    {
      label: t(locale, "workspace.evidence.sets"),
      value: `${activeColumns.length}`,
      action: onDecisions,
    },
    {
      label: t(locale, "workspace.evidence.sources"),
      value: `${sourced}/${activeColumns.length}`,
      action: onDecisions,
    },
    { label: t(locale, "workspace.evidence.cases"), value: `${excluded}`, action: onDecisions },
    {
      label: t(locale, "workspace.evidence.analysis"),
      value: analysisReady ? "✓" : "○",
      action: onDecisions,
    },
  ];
  return (
    <Card className="oq-evidence-chain-panel">
      <H2>{t(locale, "workspace.evidence.chain")}</H2>
      <dl className="oq-evidence-chain">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            <button type="button" className="oq-link-button" onClick={row.action}>
              {row.action === onResearch
                ? t(locale, "workspace.evidence.editResearch")
                : t(locale, "workspace.evidence.editDecisions")}
            </button>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function XyEvidence({
  cases,
  conditions,
  outcome,
  sol,
  xySource,
  onXySource,
}: {
  cases: QcaCase[];
  conditions: string[];
  outcome: string;
  sol: SolBundle | null;
  xySource: string;
  onXySource: (value: string) => void;
}) {
  const [locale] = useLocale();
  const paths = sol?.intermediate.models[0]?.paths ?? [];
  if (!conditions.length || !outcome) {
    return <p className="hint">{t(locale, "workspace.answer.noRoles")}</p>;
  }
  const options: Array<{
    value: string;
    label: string;
    group: "condition" | "path" | "solution";
  }> = [
    ...conditions.map((condition) => ({
      value: `cond:${condition}`,
      label: condition.replace(/^fs_/, ""),
      group: "condition" as const,
    })),
    ...paths.map((path) => ({
      value: `path:${path.term}`,
      label: path.expression.replace(/fs_/g, "").toUpperCase(),
      group: "path" as const,
    })),
    ...(paths.length > 1
      ? [{
          value: "solution",
          label: paths.map((path) => path.expression.replace(/fs_/g, "").toUpperCase()).join(" + "),
          group: "solution" as const,
        }]
      : []),
  ];
  const selection = options.some((option) => option.value === xySource)
    ? xySource
    : `cond:${conditions[0]}`;
  const selected = options.find((option) => option.value === selection) ?? options[0];
  const points = cases.map((item) => {
    let x = item.values[conditions[0]];
    if (selection === "solution") {
      x = paths.length
        ? Math.max(...paths.map((path) => termMembership(path.term, conditions, item.values)))
        : 0;
    } else if (selection.startsWith("path:")) {
      x = termMembership(selection.slice(5), conditions, item.values);
    } else if (selection.startsWith("cond:")) {
      x = item.values[selection.slice(5)];
    }
    return { label: item.label, x, y: item.values[outcome] };
  });
  return (
    <Card id="xyplot" className="oq-xy-evidence">
      <div className="oq-xy-heading">
        <H2>{t(locale, "xy.title")}</H2>
        <select
          value={selection}
          onChange={(event) => onXySource(event.target.value)}
          aria-label={t(locale, "xy.source.label")}
          data-testid="xy-source"
        >
          <optgroup label={t(locale, "xy.source.conditions")}>
            {options.filter((option) => option.group === "condition").map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </optgroup>
          {paths.length > 0 && (
            <optgroup label={t(locale, "xy.source.paths")}>
              {options.filter((option) => option.group === "path").map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
          )}
          {options.some((option) => option.group === "solution") && (
            <optgroup label={t(locale, "xy.source.solution")}>
              {options.filter((option) => option.group === "solution").map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      <XyPlot xLabel={selected.label} yLabel={outcome} points={points} />
      <p className="hint">{t(locale, "xy.hint")}</p>
    </Card>
  );
}

function DefenseChecklist({
  ready,
  items,
}: {
  ready: boolean;
  items: Array<{ key: DictKey; ready: boolean }>;
}) {
  const [locale] = useLocale();
  return (
    <Card className="oq-defense-readiness" data-testid="defense-checklist">
      <H2>
        {ready ? t(locale, "workspace.defense.ready") : t(locale, "workspace.defense.blocked")}
      </H2>
      <ul className="oq-defense-checklist">
        {items.map((item) => (
          <li key={item.key} data-ready={item.ready}>
            <span aria-hidden>{item.ready ? "✓" : "○"}</span>
            {t(locale, item.key)}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- Zitation ---------- */

/**
 * Wie zitiert man dieses Werkzeug? Bisher fand ein Nutzer die Antwort nirgends
 * in der App — die einzigen Zitat-Treffer waren Negativ-Banner („nicht
 * zitierfähig"). Steht im Prüfpaket, wo der Bericht entsteht.
 */
function CitationCard() {
  const [locale] = useLocale();
  const [copied, setCopied] = useState<"plain" | "bibtex" | null>(null);
  const cite = useMemo(() => citationInfo(), []);

  async function copy(what: "plain" | "bibtex") {
    try {
      await navigator.clipboard.writeText(what === "plain" ? cite.plain : cite.bibtex);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Zwischenablage kann blockiert sein — der Text steht sichtbar da und
      // lässt sich markieren. Kein Fehlerdialog für eine Bequemlichkeit.
    }
  }

  return (
    <Card id="zitation" className="oq-defense-citation">
      <H2>{t(locale, "cite.title")}</H2>
      <p style={{ color: "var(--ink-2)", marginTop: 0, fontSize: 13.5 }}>{t(locale, "cite.desc")}</p>
      <p
        data-testid="citation-plain"
        style={{
          fontSize: 13.5,
          lineHeight: 1.6,
          background: "var(--panel-2)",
          border: "1px solid var(--line-soft)",
          borderRadius: 8,
          padding: "10px 12px",
          margin: "0 0 10px",
        }}
      >
        {cite.plain}
      </p>
      {!cite.doi && (
        <p className="hint" style={{ ...hintStyle, marginTop: 0 }} data-testid="citation-no-doi">
          {t(locale, "cite.noDoi")}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Button onClick={() => copy("plain")}>
          {copied === "plain" ? t(locale, "cite.copied") : t(locale, "cite.copy")}
        </Button>
        <Button onClick={() => copy("bibtex")}>
          {copied === "bibtex" ? t(locale, "cite.copied") : t(locale, "cite.copyBibtex")}
        </Button>
      </div>
    </Card>
  );
}


/* ---------- Dokumentations-Meter ---------- */

/**
 * Zeigt in BEIDEN Kalibrier-Ansichten, wie weit die Dokumentation ist: eine
 * Zeile „X von Y Sets dokumentiert" plus je ein Chip pro Set. Der Chip führt in
 * die Dokumentations-Ansicht und fokussiert dort das Set. Bewusst kein
 * Warnhinweis: Fortschritt statt Sperre.
 */
function DocumentationMeter({
  columns,
  doneCount,
  documented,
  onDocument,
}: {
  columns: string[];
  doneCount: number;
  documented: (column: string) => boolean;
  onDocument: (column: string) => void;
}) {
  const [locale] = useLocale();
  if (columns.length === 0) return null;
  return (
    <div data-testid="calibration-doc-meter">
      <p
        data-testid="calibration-doc-meter-title"
        style={{ fontSize: 13.5, fontWeight: 600, margin: "0 0 8px" }}
      >
        {t(locale, "calib.meter.title", { done: doneCount, total: columns.length })}
      </p>
      <div
        role="group"
        aria-label={t(locale, "calib.meter.aria")}
        style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
      >
        {columns.map((column) => {
          const isDone = documented(column);
          const color = isDone ? "var(--good-text)" : "var(--warn-text)";
          return (
            <button
              key={column}
              type="button"
              className="oq-btn oq-btn--quiet"
              data-testid={`calibration-doc-chip-${column}`}
              data-documented={isDone ? "true" : "false"}
              // Eigener zugänglicher Name: In der Ansicht „Dokumentation" trägt der
              // Werkbank-Variablenknopf sonst praktisch denselben Namen bei anderer
              // Wirkung — Screenreader hörten zwei gleichnamige Knöpfe.
              aria-label={t(locale, "calib.meter.chipAria", { col: column })}
              onClick={() => onDocument(column)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 9px",
                borderRadius: 999,
                border: `1px solid ${color}`,
                color,
                maxWidth: "100%",
                overflowWrap: "anywhere",
                textAlign: "left",
              }}
            >
              {column} · {t(locale, isDone ? "calib.meter.chipDone" : "calib.meter.chipOpen")}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0", maxWidth: "70ch", lineHeight: 1.55 }}>
        {t(locale, "calib.meter.hint")}
      </p>
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
  conditionCount,
  caseCount,
}: {
  ds: RawDataset;
  varMeta: Record<string, VarMeta>;
  setVarMeta: (m: Record<string, VarMeta>) => void;
  calibSpecs: CalibSpecs;
  /** Bedingungen, mit denen tatsächlich gerechnet wird (nutzbare Set-Spalten). */
  conditionCount: number;
  /** Fälle, die tatsächlich in die Analyse eingehen (Missing bereits abgezogen). */
  caseCount: number;
}) {
  const [locale] = useLocale();
  const cols = numericColumns(ds);
  /**
   * Limited diversity, sichtbar statt still: 2^k Konfigurationen bei n Fällen —
   * übersteigt 2^k die Fallzahl, bleiben zwangsläufig Zeilen unbeobachtet
   * (Remainders). Das ist kein Fehler, aber eine methodische Entscheidung, die
   * die Nutzerin kennen muss. Ersetzt die frühere stille Deckelung auf drei
   * Bedingungen.
   */
  const configurations = conditionCount > 0 && conditionCount <= 30 ? 2 ** conditionCount : 0;
  const limitedDiversity = caseCount > 0 && configurations > caseCount;

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
      <p
        style={{ color: "var(--ink-2)", maxWidth: "70ch", margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.55 }}
      >
        {t(locale, "vars.role.help")}
      </p>
      <div
        data-testid="variables-import-heuristic"
        style={{
          margin: "0 0 14px",
          padding: "9px 12px",
          background: "var(--accent-wash)",
          border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--ink-2)",
        }}
      >
        {t(locale, "vars.import.heuristic")}
      </div>
      {limitedDiversity && (
        <div data-testid="variables-limited-diversity" style={{ margin: "0 0 14px" }}>
          <Diag kind="warn">
            {t(locale, "vars.limitedDiversity", {
              k: String(conditionCount),
              configurations: String(configurations),
              n: String(caseCount),
            })}
          </Diag>
        </div>
      )}
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }}>
          <thead>
            <tr>
              <th scope="col" style={thStyle()}>{t(locale, "vars.col.name")}</th>
              <th scope="col" style={thStyle()}>{t(locale, "vars.col.type")}</th>
              <th scope="col" style={thStyle()}>{t(locale, "vars.col.role")}</th>
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
                          aria-label={`${col}: ${t(locale, "vars.col.type")}`}
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
                        aria-label={`${col}: ${t(locale, "vars.col.role")}`}
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

function TruthTableSection({
  tt,
  conditionCount,
}: {
  tt: TruthTableResult | null;
  conditionCount: number;
}) {
  const [locale] = useLocale();
  const observed = tt
    ? tt.rows
        .filter((row) => row.n > 0)
        .sort(
          (left, right) =>
            Number(right.output === 1) - Number(left.output === 1) ||
            right.consistency - left.consistency,
        )
    : [];
  const remainders = tt ? tt.rows.length - observed.length : 0;

  return (
    <Card>
      <H2>{t(locale, "tt.title")}</H2>
      {tt && (
        <p className="hint" style={{ ...hintStyle, marginTop: 0, marginBottom: 12 }}>
          {t(locale, "tt.hint", {
            observed: observed.length,
            remainders,
            freqCut: tt.freqCut,
            consCut: tt.consCut,
          })}
        </p>
      )}
      {conditionCount > 12 && (
        <p className="hint" style={{ ...hintStyle, color: "var(--bad)", marginTop: 0 }}>
          {t(locale, "tt.limitWarn", { n: conditionCount })}
        </p>
      )}

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
                    <td style={{ ...tdStyle(true, false), color: r.consistency >= tt.consCut ? "var(--good-text)" : undefined, fontWeight: r.consistency >= tt.consCut ? 600 : 400 }}>{fmt(r.consistency)}</td>
                    <td style={tdStyle(true, false)}>{fmt(r.pri)}</td>
                    <td style={tdStyle(false, false)}>{chip(r.output)}</td>
                    <td style={{ ...tdStyle(false, false), whiteSpace: "normal", maxWidth: 260, color: "var(--ink-2)", fontSize: 13.5 }}>{r.cases.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint" style={hintStyle}>
            {t(locale, "tt.hint", {
              observed: observed.length,
              remainders,
              freqCut: tt.freqCut,
              consCut: tt.consCut,
            })}
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
  cases,
}: {
  tt: TruthTableResult;
  sol: SolBundle;
  cases: QcaCase[];
}) {
  const [locale] = useLocale();
  const outLabel = tt.outcome.replace(/^fs_/, "").toUpperCase();
  // Grenzfälle bei exakt 0,5 sind eine Eigenschaft des Datensatzes, nicht des
  // Modells — einmal je Schritt, nicht unter jedem Lösungsmodell.
  const atCrossover = tt.rows.flatMap((r) => r.atCrossover ?? []);
  // Vergleich über die kanonisch sortierten Formeln aller Modelle, nicht über das
  // erste — bei Mehrdeutigkeit wäre der Vergleich sonst von der Reihenfolge abhängig.
  const formulaSet = (s: SolBundle["complex"]) =>
    s.models
      .map((m) => m.paths.map((p) => p.expression).sort().join("+"))
      .sort()
      .join(" | ");
  const sameAsComplex =
    sol.intermediate.models.length > 0 &&
    formulaSet(sol.intermediate) === formulaSet(sol.complex);
  return (
    <div>
      {/* Drei Lösungen, gleich aufgebaut — ohne diese Zeile weiß niemand,
          welche in ein Paper gehört. */}
      <p
        data-testid="solution-report-convention"
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          margin: "0 0 12px",
          color: "var(--ink)",
          background: "var(--panel-2)",
          border: "1px solid var(--line-soft)",
          borderRadius: 8,
          padding: "9px 12px",
        }}
      >
        {t(locale, "sol.report.convention")}
      </p>
      <p className="hint" style={{ ...hintStyle, marginTop: 0, marginBottom: 12 }}>
        {t(locale, "diag.desc")}
        {atCrossover.length > 0 && ` ${t(locale, "diag.crossover", { cases: [...new Set(atCrossover)].join(", ") })}`}
      </p>
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
          // Die intermediäre Lösung wird in Aufsätzen berichtet — sie bekommt die
          // Ergebnis-Hervorhebung, die anderen beiden bleiben ruhig daneben.
          <Card key={kind} className={kind === "intermediate" ? "oq-card--primary-result" : undefined}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <h2 style={{ fontSize: 16.5, fontWeight: 600, margin: 0 }}>{title}</h2>
              <InfoHint title={infoTitle} body={infoBody} />
            </div>
            {/* Mehrdeutigkeit muss in einer Publikation berichtet werden — sie stand
                bisher als 12-px-Grauzeile neben zwei 28-px-Kennzahlen, also leiser
                als die Sicherheit, die sie einschränkt. */}
            {s.models.length > 1 && (
              <p
                data-testid={`solution-ambiguity-${kind}`}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  margin: "0 0 12px",
                  color: "var(--warn-text)",
                  background: "var(--warn-wash)",
                  border: "1px solid color-mix(in srgb, var(--warn-text) 30%, transparent)",
                  borderRadius: 8,
                  padding: "9px 12px",
                }}
              >
                {t(locale, "sol.ambiguous.n", { n: s.models.length })}
              </p>
            )}
            {/* Zwei identische Formeln nebeneinander lesen sich wie ein Rechenfehler. */}
            {kind === "intermediate" && sameAsComplex && (
              <p
                data-testid="solution-same-as-complex"
                style={{ fontSize: 13.5, color: "var(--ink-2)", margin: "0 0 12px", lineHeight: 1.5 }}
              >
                {t(locale, "sol.sameAsComplex")}
              </p>
            )}
            {s.models.length === 0 ? (
              <p className="hint" style={hintStyle}>{t(locale, "sol.none")}</p>
            ) : (
              s.models.map((m, mi) => (
                // Mehrdeutigkeit ist ein methodischer Befund, kein Anzeigeproblem:
                // Bei mehreren gleichwertigen Modellen wird das benannt und nur
                // das erste ausgeklappt — sonst stapeln sich hier fuenf volle
                // Bloecke samt Diagnostik untereinander.
                <details key={mi} open={mi === 0} style={{ marginTop: mi ? 10 : 0 }}>
                  <summary
                    style={{
                      cursor: s.models.length > 1 ? "pointer" : "default",
                      listStyle: s.models.length > 1 ? undefined : "none",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--muted)",
                      marginBottom: 6,
                      display: s.models.length > 1 ? "list-item" : "none",
                    }}
                  >
                    {t(locale, "sol.model.n", { i: mi + 1, total: s.models.length })}
                  </summary>
                  <div
                    className="oq-formula"
                    data-testid={
                      mi === 0
                        ? kind === "intermediate"
                          ? "evidence-solution-formula-intermediate"
                          : `solution-formula-${kind}`
                        : undefined
                    }
                  >
                    {m.paths.map((p) => p.expression.replace(/fs_/g, "").toUpperCase()).join("  +  ")} → {outLabel}
                  </div>
                  <div
                    data-testid={
                      mi === 0
                        ? kind === "intermediate"
                          ? "evidence-solution-kpis-intermediate"
                          : `solution-kpis-${kind}`
                        : undefined
                    }
                    style={{ display: "flex", gap: 26, margin: "12px 0" }}
                  >
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
                  <CaseDiagnosticsBlock
                    model={m}
                    conditions={tt.conditions}
                    outcome={tt.outcome}
                    cases={cases}
                    testId={mi === 0 ? `case-diagnostics-${kind}` : undefined}
                  />
                </details>
              ))
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

/* ---------- Fall-Diagnostik je Lösungspfad ---------- */

/** Eine Gruppe von Fallnamen; leere Gruppen bleiben sichtbar („keine"). */
function DiagGroup({ label, names }: { label: string; names: string[] }) {
  const [locale] = useLocale();
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, flex: "none" }}>{label}</span>
      <span style={{ fontSize: 13.5, color: names.length ? "var(--ink-2)" : "var(--muted)" }}>
        {names.length ? names.join(", ") : t(locale, "diag.none")}
      </span>
    </div>
  );
}

/**
 * Kompakte Fall-Diagnostik (Schneider & Rohlfing) unter der Pfadtabelle.
 * Bewusst keine zweite Tabelle: je Pfad ein Block mit gruppierten Fallnamen.
 * Die individuell irrelevanten Fälle (X ≤ 0,5) werden nur gezählt — sie sind in
 * der Regel die Mehrheit und tragen zur Interpretation des Pfads nichts bei.
 */
function CaseDiagnosticsBlock({
  model,
  conditions,
  outcome,
  cases,
  testId,
}: {
  model: SolutionModel;
  conditions: string[];
  outcome: string;
  cases: QcaCase[];
  testId?: string;
}) {
  const [locale] = useLocale();
  const diag = useMemo(
    () => caseDiagnostics(model, conditions, outcome, cases),
    [model, conditions, outcome, cases],
  );
  return (
    <div
      data-testid={testId}
      style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}
    >
      {/* Erklärtext, Legende und die datensatzweite Grenzfall-Zeile stehen NICHT
          hier: Dieser Block wird je Lösungsmodell gerendert, bei Modell-
          Ambiguität also vielfach. Sie erschienen dadurch sechsmal auf einem
          Bildschirm. Sie stehen jetzt einmal am Anfang des Lösungs-Schritts. */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Label>{t(locale, "diag.title")}</Label>
        <InfoHint
          title={t(locale, "info.caseDiagnostics.title")}
          body={`${t(locale, "info.caseDiagnostics.body")} ${t(locale, "diag.hint")}`}
        />
      </div>
      <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
        {diag.paths.map((path) => (
          <div
            key={path.term}
            style={{
              border: "1px solid var(--line-soft)",
              borderRadius: 8,
              padding: "8px 10px",
              display: "grid",
              gap: 4,
            }}
          >
            <div className="mono" style={{ fontSize: 13.5, fontWeight: 600 }}>
              {path.expression.replace(/fs_/g, "").toUpperCase()}
            </div>
            <DiagGroup label={t(locale, "diag.typical")} names={path.typical.map((c) => c.label)} />
            <DiagGroup
              label={t(locale, "diag.deviantKind")}
              names={path.deviantConsistencyKind.map((c) => c.label)}
            />
            <DiagGroup
              label={t(locale, "diag.deviantDegree")}
              names={path.deviantConsistencyDegree.map((c) => c.label)}
            />
            <DiagGroup
              label={t(locale, "diag.irrelevant")}
              names={
                path.irrelevant.length
                  ? [t(locale, "diag.irrelevantCount", { n: path.irrelevant.length })]
                  : []
              }
            />
          </div>
        ))}
      </div>
      {/* Nur melden, wenn es etwas zu melden gibt — die Leermeldung stand sonst
          unter jedem Modell. Grenzfälle (0,5) sind datensatzweit identisch und
          stehen einmal oben im Schritt. */}
      {diag.deviantCoverage.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <DiagGroup
            label={t(locale, "diag.deviantCoverage")}
            names={diag.deviantCoverage.map((c) => c.label)}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Notwendigkeit ---------- */

function NecessitySection({
  necessity,
  suin,
}: {
  necessity: ReturnType<typeof necessityAnalysis>;
  suin: NecessityExpressionEntry[] | null;
}) {
  const [locale] = useLocale();
  // Der Befund gehört über das Material: die Kandidatenmarke stand bisher als
  // kleiner Text in der letzten Spalte, und ob überhaupt etwas gefunden wurde,
  // musste man sich aus acht Zeilen selbst zusammensuchen.
  const candidates = necessity.filter((n) => n.isCandidate);
  const candidateList = candidates
    .map((n) => `${n.condition.replace(/^fs_/, "")} (${fmt(n.consistency)})`)
    .join(", ");
  return (
    <>
    <Card>
      <H2>{t(locale, "nec.title")}</H2>
      <p style={{ color: "var(--ink-2)", marginTop: -6, marginBottom: 12, fontSize: 13.5 }}>
        {t(locale, "nec.orderHint")}
      </p>
      <p
        data-testid="necessity-finding"
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          margin: "0 0 12px",
          color: "var(--ink)",
          background: candidates.length ? "var(--accent-wash)" : "var(--panel-2)",
          border: "1px solid var(--line-soft)",
          borderRadius: 8,
          padding: "9px 12px",
        }}
      >
        {candidates.length === 0
          ? t(locale, "nec.finding.none")
          : candidates.length === 1
            ? t(locale, "nec.finding.one", { list: candidateList })
            : t(locale, "nec.finding.many", { n: candidates.length, list: candidateList })}
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
              <th style={thStyle()}>
                <span style={thHintStyle}>
                  {t(locale, "nec.col.relevance")}
                  <InfoHint title={t(locale, "info.necessityRelevance.title")} body={t(locale, "info.necessityRelevance.body")} formula={t(locale, "info.necessityRelevance.formula")} />
                </span>
              </th>
              <th style={thStyle()}></th>
            </tr>
          </thead>
          <tbody>
            {necessity.map((n) => (
              <tr
                key={n.condition}
                style={n.isCandidate ? { background: "var(--accent-wash)" } : undefined}
              >
                <td style={tdStyle(false, false)} className="mono">{n.condition.replace(/^fs_/, "")}</td>
                <td style={tdStyle(true, false)}>{fmt(n.consistency)}</td>
                <td style={tdStyle(true, false)}>{fmt(n.coverage)}</td>
                <td style={tdStyle(true, false)}>{fmt(n.relevance)}</td>
                <td style={tdStyle(false, false)}>{n.isCandidate ? <span style={{ color: "var(--good-text)", fontWeight: 600 }}>{t(locale, "nec.candidate")}</span> : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint" style={hintStyle}>{t(locale, "nec.hint")}</p>
    </Card>
    {suin && <SuinSection entries={suin} />}
    </>
  );
}

/* ---------- Notwendige Kombinationen (SUIN) ---------- */

/**
 * Zweite Ebene der Notwendigkeitsprüfung: Disjunktionen (SUIN) und
 * Konjunktionen. Bewusst kompakt — die Tabelle ist ein Befund, keine
 * Materialschlacht; Einzelbedingungen stehen bereits in der Tabelle darüber.
 */
function SuinSection({ entries }: { entries: NecessityExpressionEntry[] }) {
  const [locale] = useLocale();
  // Nach RoN absteigend: alle Zeilen erfüllen ohnehin das Konsistenzkriterium,
  // die Reihenfolge nach RoN ist die einzige, die einen Befund erkennbar macht.
  // Eine RoN-Schwelle wird bewusst nicht behauptet — die Literatur nennt keine.
  const rows = entries
    .filter((e) => e.literals.length > 1)
    .slice()
    .sort((a, b) => b.relevance - a.relevance);
  const top = rows[0];
  const finding = !top
    ? null
    : rows.length === 1
      ? t(locale, "nec.suin.findingOne", {
          top: top.expression.replace(/fs_/g, "").toUpperCase(),
          topRon: fmt(top.relevance),
        })
      : t(locale, "nec.suin.finding", {
          n: rows.length,
          top: top.expression.replace(/fs_/g, "").toUpperCase(),
          topRon: fmt(top.relevance),
          minRon: fmt(rows[rows.length - 1].relevance),
        });
  return (
    <Card id="suin">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontSize: 16.5, fontWeight: 600, margin: 0 }}>{t(locale, "nec.suin.title")}</h2>
        <InfoHint title={t(locale, "info.suin.title")} body={t(locale, "info.suin.body")} />
      </div>
      <p style={{ color: "var(--ink-2)", marginTop: -6, marginBottom: 12, fontSize: 13.5 }}>
        {t(locale, "nec.suin.desc")}
      </p>
      {rows.length === 0 ? (
        <p className="hint" style={hintStyle} data-testid="suin-empty">{t(locale, "nec.suin.none")}</p>
      ) : (
        <>
        <p
          data-testid="suin-finding"
          style={{
            fontSize: 15,
            lineHeight: 1.5,
            margin: "0 0 12px",
            color: "var(--ink)",
            background: "var(--panel-2)",
            border: "1px solid var(--line-soft)",
            borderRadius: 8,
            padding: "9px 12px",
          }}
        >
          {finding}
        </p>
        <details open={rows.length <= 3}>
          <summary style={{ fontSize: 13.5, color: "var(--accent-deep)", cursor: "pointer", marginBottom: 10 }}>
            {t(locale, "nec.suin.toggle", { n: rows.length })}
          </summary>
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 8 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13.5 }} data-testid="suin-table">
            <thead>
              <tr>
                <th style={thStyle()}>{t(locale, "nec.suin.col.expression")}</th>
                <th style={thStyle()}>{t(locale, "nec.suin.col.kind")}</th>
                <th style={thStyle()}>{t(locale, "nec.col.consistency")}</th>
                <th style={thStyle()}>{t(locale, "nec.col.coverage")}</th>
                <th style={thStyle()}>{t(locale, "nec.col.relevance")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.expression}>
                  <td style={tdStyle(false, false)} className="mono">
                    {entry.expression.replace(/fs_/g, "").toUpperCase()}
                  </td>
                  <td style={tdStyle(false, false)}>
                    {t(locale, entry.kind === "disjunction" ? "nec.suin.kind.disjunction" : "nec.suin.kind.conjunction")}
                  </td>
                  <td style={tdStyle(true, false)}>{fmt(entry.consistency)}</td>
                  <td style={tdStyle(true, false)}>{fmt(entry.coverage)}</td>
                  <td style={tdStyle(true, false)}>{fmt(entry.relevance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </details>
        </>
      )}
      <p className="hint" style={hintStyle}>{t(locale, "nec.suin.hint")}</p>
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
  robustness,
  solutions,
  necessity,
  necessitySupersets,
  defenseReady,
  researchBrief,
  analysisDecisions,
  aiWritingProvenance,
  expectations,
  checklist,
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
  robustness: CombinedRobustnessResult | null;
  solutions: SolBundle | null;
  necessity: ReturnType<typeof necessityAnalysis> | null;
  necessitySupersets: NecessityExpressionEntry[] | null;
  defenseReady: boolean;
  researchBrief: ResearchBrief;
  analysisDecisions: AnalysisDecisionState;
  aiWritingProvenance: AiWritingProvenance;
  expectations: Record<string, Expectation>;
  checklist: Array<{ key: DictKey; ready: boolean }>;
}) {
  const [locale] = useLocale();
  const r = useMemo(
    () =>
      defenseReady
        ? buildRScript({
            ds,
            calibSpecs,
            varMeta,
            conditions,
            outcome,
            freqCut,
            consCut,
            sensitivity,
            robustness,
            researchBrief,
            analysisDecisions,
            aiWritingProvenance,
            expectations,
          })
        : "",
    [
      analysisDecisions,
      aiWritingProvenance,
      calibSpecs,
      conditions,
      consCut,
      defenseReady,
      ds,
      expectations,
      freqCut,
      outcome,
      researchBrief,
      robustness,
      sensitivity,
      varMeta,
    ],
  );

  function downloadJson() {
    if (!defenseReady || !solutions || !necessity || !necessitySupersets) return;
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
      robustness,
      researchBrief,
      analysisDecisions,
      aiWritingProvenance,
      expectations,
      solutions,
      necessity,
      necessitySupersets,
    });
    downloadText(
      "openqca-calibration-protocol.json",
      JSON.stringify(payload, null, 2),
      "application/json",
    );
  }

  function downloadRawData() {
    if (!defenseReady) return;
    downloadText(
      RAW_DATA_FILENAME,
      buildRawCsv(ds),
      "text/csv;charset=utf-8",
    );
  }

  function downloadMd() {
    if (!defenseReady || !solutions || !necessity || !necessitySupersets) return;
    const md = buildCalibrationNarrative({
      ds,
      calibSpecs,
      varMeta,
      conditions,
      outcome,
      evaluation,
      sensitivity,
      robustness,
      freqCut,
      consCut,
      locale,
      researchBrief,
      analysisDecisions,
      aiWritingProvenance,
      expectations,
      solutions,
      necessity,
      necessitySupersets,
    });
    downloadText("openqca-calibration-protocol.md", md, "text/markdown;charset=utf-8");
  }

  async function copyR() {
    if (!defenseReady || !r) return;
    try {
      await navigator.clipboard.writeText(r);
    } catch {
      // The source is visible after readiness, so clipboard access is optional.
    }
  }
  function downloadR() {
    if (!defenseReady || !r) return;
    downloadText("openqca-replication.R", r, "text/plain;charset=utf-8");
  }

  return (
    <Card className="oq-defense-artifacts" data-testid="defense-artifacts">
      <H2>{t(locale, "workspace.defense.artifacts")}</H2>
      <p style={{ color: "var(--ink-2)", marginTop: 0 }}>{t(locale, "proto.desc")}</p>
      {!defenseReady && (
        <ul className="oq-defense-checklist oq-defense-checklist--compact">
          {checklist.filter((item) => !item.ready).map((item) => (
            <li key={item.key}>
              <span aria-hidden>○</span>
              {t(locale, item.key)}
            </li>
          ))}
        </ul>
      )}
      <div className="oq-action-row">
        <Button primary disabled={!defenseReady} onClick={downloadJson}>{t(locale, "proto.downloadBtn")}</Button>
        <Button disabled={!defenseReady} onClick={downloadRawData}>{t(locale, "proto.downloadData")}</Button>
        <Button disabled={!defenseReady} onClick={downloadMd}>{t(locale, "proto.downloadMd")}</Button>
        <Button disabled={!defenseReady} onClick={() => void copyR()}>{t(locale, "proto.copyR")}</Button>
        <Button disabled={!defenseReady} onClick={downloadR}>{t(locale, "proto.downloadR")}</Button>
      </div>
      {defenseReady && (
        <pre
          className="mono"
          data-testid="defense-r-preview"
          style={{
            fontSize: 13.5,
            lineHeight: 1.6,
            background: "var(--panel-2)",
            borderRadius: 8,
            padding: "12px 14px",
            overflowX: "auto",
            marginTop: 14,
          }}
        >
          {r}
        </pre>
      )}
    </Card>
  );
}

/* ---------- UI-Bausteine ---------- */

function Header() {
  const [locale] = useLocale();
  return (
    <header className="oq-app-header">
      <div className="oq-app-header__identity">
        <Link href="/" className="oq-app-header__brand">
          open<span>QCA</span>
        </Link>
        <span className="oq-app-header__tagline">{t(locale, "header.tagline")}</span>
      </div>
      <div className="oq-app-header__global">
        <LanguageToggle />
        <AccountButton />
      </div>
    </header>
  );
}

function Card({
  children,
  id,
  className,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode;
  id?: string;
  /** Für Sonderflächen wie `oq-card--primary-result` (hervorgehobenes Ergebnis). */
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div
      id={id}
      className={["oq-plane", className].filter(Boolean).join(" ")}
      data-testid={dataTestId}
    >
      {children}
    </div>
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
/**
 * „Vorläufig"-Marke an den berechneten Ergebnisflächen.
 *
 * Der Hinweis an der Bericht-Karte allein genügt nicht: Screenshots entstehen an
 * der Lösung, nicht am Export. Solange die Kalibrierung nicht dokumentiert ist,
 * muss das Ergebnis selbst sagen, worauf es beruht.
 */
/**
 * „Vorläufig" stand als freischwebender Chip über den Ergebnissen — ohne Grund
 * und ohne Ausweg; der Grund lag nur im title-Attribut, also unsichtbar auf
 * Touch. Chip, Grund und der Weg dorthin stehen jetzt in einer Zeile.
 */
function ProvisionalMark({ onDecisions }: { onDecisions: () => void }) {
  const [locale] = useLocale();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span
        data-testid="provisional-result-mark"
        title={t(locale, "result.provisional.title")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          fontWeight: 600,
          color: "var(--warn-text)",
          background: "var(--warn-wash)",
          border: "1px solid color-mix(in srgb, var(--warn-text) 30%, transparent)",
          borderRadius: 999,
          padding: "2px 9px",
        }}
      >
        <span aria-hidden>⚠</span>
        {t(locale, "result.provisional.chip")}
      </span>
      <span style={{ fontSize: 12, color: "var(--ink-2)" }}>
        {t(locale, "result.provisional.reason")}{" "}
        <button type="button" className="oq-link-button" onClick={onDecisions}>
          {t(locale, "result.provisional.link")}
        </button>
      </span>
    </div>
  );
}

function Diag({ kind, children }: { kind: "ok" | "warn" | "bad"; children: React.ReactNode }) {
  const map = { ok: ["var(--good)", "var(--good-wash)"], warn: ["var(--warn-text)", "var(--warn-wash)"], bad: ["var(--bad)", "var(--bad-wash)"] } as const;
  const [icon, wash] = map[kind];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5, padding: "8px 10px", borderRadius: "var(--radius-surface)", border: `1px solid ${wash}`, background: wash }}>
      <span style={{ width: 17, height: 17, borderRadius: "50%", flex: "none", marginTop: 1, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, color: "var(--accent-contrast)", background: icon }}>
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
