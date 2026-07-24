/**
 * Explicit teaching seed for rohwerte-demokratie.csv.
 * Labelled provisional — not literature claims.
 *
 * All texts are bilingual (de/en). German is authoritative for the app's
 * teaching audience; English is kept for completeness. Values, anchors,
 * numbers, structures, and thresholds are locale-independent and must not
 * change between locales.
 */

import type { CalibSpecs, CalibrationSpec } from "@/lib/calibration-model";
import { newEvidenceId } from "@/lib/calibration-model";
import type { VarMeta } from "@/lib/protocol-export";

type Locale = "de" | "en";

interface Localized {
  de: string;
  en: string;
}

function pick(locale: Locale, text: Localized): string {
  return locale === "de" ? text.de : text.en;
}

const TEACHING_NOTE: Localized = {
  de: "Illustratives Lehrbeispiel, keine Literaturbehauptung. Vor einer Publikation durch projekteigene Quellen ersetzen.",
  en: "Illustrative teaching seed, not a literature claim. Replace with project-specific sources before publication.",
};

const EVIDENCE_TITLE: Localized = {
  de: "openQCA-Lehrbeispiel (synthetisch)",
  en: "openQCA teaching seed (synthetic)",
};

function theoryEvidence(
  locale: Locale,
  supports: CalibrationSpec["evidence"][0]["supports"],
): CalibrationSpec["evidence"][0] {
  return {
    id: newEvidenceId(),
    type: "theory",
    supports,
    citation: {
      title: pick(locale, EVIDENCE_TITLE),
      year: "2026",
    },
    note: pick(locale, TEACHING_NOTE),
    isSubstantive: true,
  };
}

export function isRohwerteDataset(name: string): boolean {
  return /rohwerte-demokratie/i.test(name);
}

export function applyRohwerteTeachingSeed(locale: Locale = "de"): {
  varMeta: Record<string, VarMeta>;
  calibSpecs: CalibSpecs;
} {
  const note = pick(locale, TEACHING_NOTE);

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
        setLabel: pick(locale, {
          de: "Relativ wohlhabende Länder",
          en: "Relatively wealthy countries",
        }),
        definition: pick(locale, {
          de: "Fälle mit hohem BIP pro Kopf relativ zu einer Entwicklungsschwelle Mitte des 20. Jahrhunderts (synthetisches Lehrbeispiel-Set).",
          en: "Cases with high GDP per capita relative to a mid-20th-century development threshold (synthetic teaching set).",
        }),
        unit: pick(locale, {
          de: "fiktive Einheiten des BIP pro Kopf",
          en: "fictional GDP per capita units",
        }),
        scopePopulation: pick(locale, {
          de: "16 synthetische Länder in rohwerte-demokratie",
          en: "16 synthetic countries in rohwerte-demokratie",
        }),
        timePeriod: pick(locale, {
          de: "illustrativer Querschnitt",
          en: "illustrative cross-section",
        }),
        highIsMembership: true,
        notes: note,
      },
      method: "direct",
      direct: {
        fullOut: 300,
        crossover: 600,
        fullIn: 1000,
        meaningFullOut: pick(locale, {
          de: "Klar außerhalb der Menge relativ wohlhabender Fälle",
          en: "Clearly not in the set of relatively wealthy cases",
        }),
        meaningCrossover: pick(locale, {
          de: "Maximale Unentschiedenheit über relativen Wohlstand",
          en: "Maximum ambiguity about relative wealth",
        }),
        meaningFullIn: pick(locale, {
          de: "Klar innerhalb der Menge relativ wohlhabender Fälle",
          en: "Clearly in the set of relatively wealthy cases",
        }),
      },
      missing: { kind: "exclude_case" },
      evidence: [theoryEvidence(locale, "set"), theoryEvidence(locale, "crossover")],
      status: "provisional",
      methodConfirmed: false,
      caseReviewConfirmed: false,
      exceptionalCases: [
        {
          caseLabel: "Mittelreich",
          note: pick(locale, {
            de: "Hoher Wohlstand bei niedrigerem Demokratie-Index — nützlicher abweichender Fall für die Diskussion.",
            en: "High wealth with lower democracy index — useful deviant case for discussion.",
          }),
        },
      ],
      sensitivity: {
        alternatives: [
          {
            id: "crossover-lower",
            label: pick(locale, {
              de: "Kreuzungspunkt 60 Einheiten niedriger",
              en: "Crossover 60 units lower",
            }),
            delta: -60,
            rationale: note,
          },
          {
            id: "crossover-higher",
            label: pick(locale, {
              de: "Kreuzungspunkt 60 Einheiten höher",
              en: "Crossover 60 units higher",
            }),
            delta: 60,
            rationale: note,
          },
        ],
        notes: "",
        reviewed: false,
      },
    },
    INDUSTRIEANTEIL: {
      column: "INDUSTRIEANTEIL",
      set: {
        setLabel: pick(locale, {
          de: "Industriegesellschaft (Beschäftigungsanteil)",
          en: "Industrial society (employment share)",
        }),
        definition: pick(locale, {
          de: "Fälle mit einem industriellen Beschäftigungsanteil auf oder über der Schwelle gehören zur Menge der Industriegesellschaften.",
          en: "Cases at or above a crisp industrial employment share are members of the industrial-society set.",
        }),
        unit: pick(locale, {
          de: "Prozent industrielle Beschäftigung",
          en: "percent industrial employment",
        }),
        scopePopulation: pick(locale, {
          de: "16 synthetische Länder",
          en: "16 synthetic countries",
        }),
        timePeriod: pick(locale, { de: "illustrativ", en: "illustrative" }),
        highIsMembership: true,
        notes: note,
      },
      method: "crisp",
      crisp: {
        threshold: 40,
        meaningInclusion: pick(locale, {
          de: "Industrieller Beschäftigungsanteil zeigt Industriegesellschaft an (≥ 40 %)",
          en: "Industrial employment share indicates industrial society (≥ 40%)",
        }),
      },
      missing: { kind: "exclude_case" },
      evidence: [theoryEvidence(locale, "threshold")],
      status: "provisional",
      methodConfirmed: false,
      caseReviewConfirmed: false,
      exceptionalCases: [],
      sensitivity: {
        alternatives: [
          {
            id: "threshold-lower",
            label: pick(locale, {
              de: "Schwelle 5 Punkte niedriger",
              en: "Threshold 5 points lower",
            }),
            delta: -5,
            rationale: note,
          },
          {
            id: "threshold-higher",
            label: pick(locale, {
              de: "Schwelle 5 Punkte höher",
              en: "Threshold 5 points higher",
            }),
            delta: 5,
            rationale: note,
          },
        ],
        notes: "",
        reviewed: false,
      },
    },
    ALPHABETISIERUNG: {
      column: "ALPHABETISIERUNG",
      set: {
        setLabel: pick(locale, { de: "Hohe Alphabetisierung", en: "High literacy" }),
        definition: pick(locale, {
          de: "Zugehörigkeit zur Menge hoch alphabetisierter Gesellschaften.",
          en: "Membership in the set of highly literate societies.",
        }),
        unit: pick(locale, { de: "Prozent", en: "percent" }),
        scopePopulation: pick(locale, {
          de: "16 synthetische Länder",
          en: "16 synthetic countries",
        }),
        timePeriod: pick(locale, { de: "illustrativ", en: "illustrative" }),
        highIsMembership: true,
        notes: note,
      },
      method: "direct",
      direct: {
        fullOut: 50,
        crossover: 75,
        fullIn: 95,
        meaningFullOut: pick(locale, {
          de: "Klar nicht hoch alphabetisiert",
          en: "Clearly not highly literate",
        }),
        meaningCrossover: pick(locale, {
          de: "Unentschiedene Zugehörigkeit zur Alphabetisierung",
          en: "Ambiguous literacy membership",
        }),
        meaningFullIn: pick(locale, {
          de: "Klar hoch alphabetisiert",
          en: "Clearly highly literate",
        }),
      },
      missing: { kind: "exclude_case" },
      evidence: [theoryEvidence(locale, "set")],
      status: "provisional",
      methodConfirmed: false,
      caseReviewConfirmed: false,
      exceptionalCases: [],
      sensitivity: {
        alternatives: [
          {
            id: "literacy-lower",
            label: pick(locale, {
              de: "Kreuzungspunkt 5 Punkte niedriger",
              en: "Crossover 5 points lower",
            }),
            delta: -5,
            rationale: note,
          },
          {
            id: "literacy-higher",
            label: pick(locale, {
              de: "Kreuzungspunkt 5 Punkte höher",
              en: "Crossover 5 points higher",
            }),
            delta: 5,
            rationale: note,
          },
        ],
        notes: "",
        reviewed: false,
      },
    },
    DEMOKRATIE_INDEX: {
      column: "DEMOKRATIE_INDEX",
      set: {
        setLabel: pick(locale, { de: "Stabile Demokratie", en: "Stable democracy" }),
        definition: pick(locale, {
          de: "Outcome-Set: Zugehörigkeit zur stabilen Demokratie. Dies ist ein Zugehörigkeitsurteil, kein Konsistenz-Cutoff der Wahrheitstafel.",
          en: "Outcome set: membership in stable democracy. This is a set-membership judgment, not a truth-table consistency cutoff.",
        }),
        unit: pick(locale, { de: "Demokratie-Index 0–100", en: "democracy index 0–100" }),
        scopePopulation: pick(locale, {
          de: "16 synthetische Länder",
          en: "16 synthetic countries",
        }),
        timePeriod: pick(locale, { de: "illustrativ", en: "illustrative" }),
        highIsMembership: true,
        notes: note,
      },
      method: "direct",
      direct: {
        fullOut: 25,
        crossover: 50,
        fullIn: 75,
        meaningFullOut: pick(locale, {
          de: "Klar keine stabile Demokratie",
          en: "Clearly not a stable democracy",
        }),
        meaningCrossover: pick(locale, {
          de: "Maximale Unentschiedenheit über demokratische Stabilität",
          en: "Maximum ambiguity about democratic stability",
        }),
        meaningFullIn: pick(locale, {
          de: "Klar eine stabile Demokratie",
          en: "Clearly a stable democracy",
        }),
      },
      missing: { kind: "exclude_case" },
      evidence: [theoryEvidence(locale, "set"), theoryEvidence(locale, "crossover")],
      status: "provisional",
      methodConfirmed: false,
      caseReviewConfirmed: false,
      exceptionalCases: [],
      sensitivity: {
        alternatives: [
          {
            id: "democracy-lower",
            label: pick(locale, {
              de: "Kreuzungspunkt 10 Punkte niedriger",
              en: "Crossover 10 points lower",
            }),
            delta: -10,
            rationale: note,
          },
          {
            id: "democracy-higher",
            label: pick(locale, {
              de: "Kreuzungspunkt 10 Punkte höher",
              en: "Crossover 10 points higher",
            }),
            delta: 10,
            rationale: note,
          },
        ],
        notes: "",
        reviewed: false,
      },
    },
    URBANISIERUNG: {
      column: "URBANISIERUNG",
      set: {
        setLabel: pick(locale, { de: "Urbanisiert", en: "Urbanized" }),
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
