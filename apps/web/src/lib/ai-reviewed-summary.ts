import type { AiAssistRequest, ReviewedSummary } from "@/lib/ai-contract";

/** Stable, human-readable payload preview. This is the exact body sent after confirmation. */
export function reviewedPayloadPreview(request: AiAssistRequest): Array<{ label: string; value: string }> {
  switch (request.task) {
    case "brief_clarify":
      return [
        { label: "Research question", value: request.payload.question },
        { label: "Case universe", value: request.payload.caseUniverse },
        { label: "Time period", value: request.payload.timePeriod },
        { label: "Outcome concept", value: request.payload.outcomeConcept },
        { label: "Condition rationale", value: request.payload.conditionSelectionRationale },
      ];
    case "calibration_evidence_gaps":
      return [
        { label: "Variable", value: request.payload.variable },
        { label: "Set label", value: request.payload.setLabel },
        { label: "Set definition", value: request.payload.definition },
        { label: "Researcher rationale", value: request.payload.rationale },
      ];
    case "decision_rationale_review":
      return [{ label: "Decision", value: request.payload.decision }, { label: "Rationale", value: request.payload.rationale }];
  }
}

export function isAdoptableDraft(summary: ReviewedSummary): boolean {
  return summary.status === "ok" && summary.draft.trim().length > 0;
}
