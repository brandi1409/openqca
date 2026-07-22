/**
 * Explicit teaching seed for rohwerte-demokratie.csv.
 * Labelled provisional — not literature claims.
 */

import type { CalibSpecs, CalibrationSpec } from "@/lib/calibration-model";
import { newEvidenceId } from "@/lib/calibration-model";
import type { VarMeta } from "@/lib/protocol-export";

const TEACHING_NOTE =
  "Illustrative teaching seed, not a literature claim. Replace with project-specific sources before publication.";

function theoryEvidence(supports: CalibrationSpec["evidence"][0]["supports"]): CalibrationSpec["evidence"][0] {
  return {
    id: newEvidenceId(),
    type: "theory",
    supports,
    citation: {
      title: "openQCA teaching seed (synthetic)",
      year: "2026",
    },
    note: TEACHING_NOTE,
    isSubstantive: true,
  };
}

export function isRohwerteDataset(name: string): boolean {
  return /rohwerte-demokratie/i.test(name);
}

export function applyRohwerteTeachingSeed(): {
  varMeta: Record<string, VarMeta>;
  calibSpecs: CalibSpecs;
} {
  const varMeta: Record<string, VarMeta> = {
    BIP_pKopf: { type: "raw", role: "condition" },
    URBANISIERUNG: { type: "raw", role: "ignore" },
    ALPHABETISIERUNG: { type: "raw", role: "condition" },
    INDUSTRIEANTEIL: { type: "raw", role: "condition" },
    DEMOKRATIE_INDEX: { type: "raw", role: "outcome" },
  };

  const calibSpecs: CalibSpecs = {
    BIP_pKopf: {
      column: "BIP_pKopf",
      set: {
        setLabel: "Relatively wealthy countries",
        definition:
          "Cases with high GDP per capita relative to a mid-20th-century development threshold (synthetic teaching set).",
        unit: "fictional GDP per capita units",
        scopePopulation: "16 synthetic countries in rohwerte-demokratie",
        timePeriod: "illustrative cross-section",
        highIsMembership: true,
        notes: TEACHING_NOTE,
      },
      method: "direct",
      direct: {
        fullOut: 300,
        crossover: 600,
        fullIn: 1000,
        meaningFullOut: "Clearly not in the set of relatively wealthy cases",
        meaningCrossover: "Maximum ambiguity about relative wealth",
        meaningFullIn: "Clearly in the set of relatively wealthy cases",
      },
      missing: { kind: "exclude_case" },
      evidence: [theoryEvidence("set"), theoryEvidence("crossover")],
      status: "provisional",
      methodConfirmed: false,
      caseReviewConfirmed: false,
      exceptionalCases: [
        {
          caseLabel: "Mittelreich",
          note: "High wealth with lower democracy index — useful deviant case for discussion.",
        },
      ],
      sensitivity: {
        alternatives: [
          {
            id: "crossover-lower",
            label: "Crossover 60 units lower",
            delta: -60,
            rationale: TEACHING_NOTE,
          },
          {
            id: "crossover-higher",
            label: "Crossover 60 units higher",
            delta: 60,
            rationale: TEACHING_NOTE,
          },
        ],
        notes: "",
        reviewed: false,
      },
    },
    INDUSTRIEANTEIL: {
      column: "INDUSTRIEANTEIL",
      set: {
        setLabel: "Industrial society (employment share)",
        definition:
          "Cases at or above a crisp industrial employment share are members of the industrial-society set.",
        unit: "percent industrial employment",
        scopePopulation: "16 synthetic countries",
        timePeriod: "illustrative",
        highIsMembership: true,
        notes: TEACHING_NOTE,
      },
      method: "crisp",
      crisp: {
        threshold: 40,
        meaningInclusion:
          "Industrial employment share indicates industrial society (≥ 40%)",
      },
      missing: { kind: "exclude_case" },
      evidence: [theoryEvidence("threshold")],
      status: "provisional",
      methodConfirmed: false,
      caseReviewConfirmed: false,
      exceptionalCases: [],
      sensitivity: {
        alternatives: [
          {
            id: "threshold-lower",
            label: "Threshold 5 points lower",
            delta: -5,
            rationale: TEACHING_NOTE,
          },
          {
            id: "threshold-higher",
            label: "Threshold 5 points higher",
            delta: 5,
            rationale: TEACHING_NOTE,
          },
        ],
        notes: "",
        reviewed: false,
      },
    },
    ALPHABETISIERUNG: {
      column: "ALPHABETISIERUNG",
      set: {
        setLabel: "High literacy",
        definition: "Membership in the set of highly literate societies.",
        unit: "percent",
        scopePopulation: "16 synthetic countries",
        timePeriod: "illustrative",
        highIsMembership: true,
        notes: TEACHING_NOTE,
      },
      method: "direct",
      direct: {
        fullOut: 50,
        crossover: 75,
        fullIn: 95,
        meaningFullOut: "Clearly not highly literate",
        meaningCrossover: "Ambiguous literacy membership",
        meaningFullIn: "Clearly highly literate",
      },
      missing: { kind: "exclude_case" },
      evidence: [theoryEvidence("set")],
      status: "provisional",
      methodConfirmed: false,
      caseReviewConfirmed: false,
      exceptionalCases: [],
      sensitivity: {
        alternatives: [
          {
            id: "literacy-lower",
            label: "Crossover 5 points lower",
            delta: -5,
            rationale: TEACHING_NOTE,
          },
          {
            id: "literacy-higher",
            label: "Crossover 5 points higher",
            delta: 5,
            rationale: TEACHING_NOTE,
          },
        ],
        notes: "",
        reviewed: false,
      },
    },
    DEMOKRATIE_INDEX: {
      column: "DEMOKRATIE_INDEX",
      set: {
        setLabel: "Stable democracy",
        definition:
          "Outcome set: membership in stable democracy. This is a set-membership judgment, not a truth-table consistency cutoff.",
        unit: "democracy index 0–100",
        scopePopulation: "16 synthetic countries",
        timePeriod: "illustrative",
        highIsMembership: true,
        notes: TEACHING_NOTE,
      },
      method: "direct",
      direct: {
        fullOut: 25,
        crossover: 50,
        fullIn: 75,
        meaningFullOut: "Clearly not a stable democracy",
        meaningCrossover: "Maximum ambiguity about democratic stability",
        meaningFullIn: "Clearly a stable democracy",
      },
      missing: { kind: "exclude_case" },
      evidence: [theoryEvidence("set"), theoryEvidence("crossover")],
      status: "provisional",
      methodConfirmed: false,
      caseReviewConfirmed: false,
      exceptionalCases: [],
      sensitivity: {
        alternatives: [
          {
            id: "democracy-lower",
            label: "Crossover 10 points lower",
            delta: -10,
            rationale: TEACHING_NOTE,
          },
          {
            id: "democracy-higher",
            label: "Crossover 10 points higher",
            delta: 10,
            rationale: TEACHING_NOTE,
          },
        ],
        notes: "",
        reviewed: false,
      },
    },
    URBANISIERUNG: {
      column: "URBANISIERUNG",
      set: {
        setLabel: "Urbanized",
        definition: "",
        unit: "%",
        scopePopulation: "",
        timePeriod: "",
        highIsMembership: true,
        notes: "",
      },
      method: "direct",
      direct: {
        fullOut: 25,
        crossover: 45,
        fullIn: 70,
        meaningFullOut: "",
        meaningCrossover: "",
        meaningFullIn: "",
      },
      missing: { kind: "exclude_case" },
      evidence: [],
      status: "unresolved",
      methodConfirmed: false,
      caseReviewConfirmed: false,
      exceptionalCases: [],
      sensitivity: { alternatives: [], notes: "", reviewed: false },
    },
  };

  return { varMeta, calibSpecs };
}
