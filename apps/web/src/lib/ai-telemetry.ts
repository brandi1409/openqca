import type { AiTask } from "@/lib/ai-contract";

export type AiRequestOutcome = "disabled" | "auth_required" | "plan_required" | "rate_limited" | "returned" | "invalid_response" | "unavailable";

function durationBucket(elapsed: number): "under_2s" | "2_to_5s" | "5_to_15s" | "over_15s" {
  if (elapsed < 2_000) return "under_2s";
  if (elapsed < 5_000) return "2_to_5s";
  if (elapsed < 15_000) return "5_to_15s";
  return "over_15s";
}

/**
 * Operational telemetry deliberately contains no payload, response, identity,
 * address, provider request ID, research text, filename, value, or timestamp.
 */
export function aiRequestTelemetry(task: AiTask, outcome: AiRequestOutcome, elapsedMs: number) {
  return {
    event: "openqca.ai.request.v1" as const,
    task,
    outcome,
    duration: durationBucket(elapsedMs),
  };
}

export function recordAiRequest(task: AiTask, outcome: AiRequestOutcome, startedAt: number): void {
  console.info(JSON.stringify(aiRequestTelemetry(task, outcome, Date.now() - startedAt)));
}
