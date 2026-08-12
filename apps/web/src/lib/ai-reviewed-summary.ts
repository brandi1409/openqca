import type { AiAssistRequest, AiReviewResponse } from "@/lib/ai-contract";
import type {
  AiWritingProvenance,
  AiWritingProvenanceEntry,
  SavedState,
} from "@/lib/workspace-model";

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

export function aiReviewSuggestion(response: AiReviewResponse): string {
  if (response.task === "brief_clarify") return response.suggested.question;
  if (response.task === "calibration_evidence_gaps") return response.suggested.definition;
  return response.suggested.rationale;
}

export function isAdoptableSuggestion(response: AiReviewResponse): boolean {
  return response.status === "ok" && aiReviewSuggestion(response).trim().length > 0;
}

export interface AiAdoptionMetadata {
  provider: string;
  model: string;
  generatedAt: string;
}

export async function sha256Text(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("AI_PROVENANCE_HASH_UNAVAILABLE");
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  let hex = "";
  for (const byte of new Uint8Array(digest)) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

export async function aiWritingProvenanceMatches(
  entry: AiWritingProvenanceEntry,
  currentText: string,
): Promise<boolean> {
  try {
    return entry.adoptedTextHash === await sha256Text(currentText);
  } catch {
    return false;
  }
}

export async function verifyAiWritingProvenance(
  state: Pick<
    SavedState,
    "aiWritingProvenance" | "researchBrief" | "analysisDecisions" | "calibSpecs"
  >,
): Promise<AiWritingProvenance> {
  const verified: AiWritingProvenance = {
    brief_clarify: {},
    calibration_evidence_gaps: {},
    decision_rationale_review: {},
  };
  const question = state.aiWritingProvenance.brief_clarify.question;
  if (question && await aiWritingProvenanceMatches(question, state.researchBrief.question)) {
    verified.brief_clarify.question = question;
  }

  await Promise.all(
    ([
      "frequencyCutoff",
      "consistencyCutoff",
      "directionalExpectations",
    ] as const).map(async (decision) => {
      const entry = state.aiWritingProvenance.decision_rationale_review[decision];
      if (
        entry &&
        await aiWritingProvenanceMatches(entry, state.analysisDecisions[decision].rationale)
      ) {
        verified.decision_rationale_review[decision] = entry;
      }
    }),
  );

  await Promise.all(
    Object.entries(state.aiWritingProvenance.calibration_evidence_gaps).map(
      async ([column, entry]) => {
        const definition = state.calibSpecs[column]?.set.definition;
        if (
          definition !== undefined &&
          await aiWritingProvenanceMatches(entry, definition)
        ) {
          verified.calibration_evidence_gaps[column] = entry;
        }
      },
    ),
  );
  return verified;
}

export async function buildAiWritingProvenanceEntry(
  metadata: AiAdoptionMetadata,
  previousText: string,
  adoptedText: string,
): Promise<AiWritingProvenanceEntry> {
  const provider = metadata.provider.trim();
  const model = metadata.model.trim();
  const generatedAt = new Date(metadata.generatedAt);
  if (!provider || !model || Number.isNaN(generatedAt.getTime())) {
    throw new Error("AI_PROVENANCE_METADATA_INVALID");
  }
  const [previousTextHash, adoptedTextHash] = await Promise.all([
    sha256Text(previousText),
    sha256Text(adoptedText),
  ]);
  return {
    provider,
    model,
    generatedAt: generatedAt.toISOString(),
    previousTextHash,
    adoptedTextHash,
  };
}
