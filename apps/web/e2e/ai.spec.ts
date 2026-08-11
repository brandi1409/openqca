import { expect, test } from "@playwright/test";

const briefPayload = {
  version: "v1",
  task: "brief_clarify",
  locale: "de",
  payload: {
    question: "Welche Konfigurationen erklären das Outcome?",
    caseUniverse: "Verglichene Gemeinden",
    timePeriod: "2020–2024",
    outcomeConcept: "hohe Resilienz",
    conditionSelectionRationale: "Theoretisch begründete Bedingungen",
  },
};

test("AI route rejects legacy and forbidden-data payloads before provider access", async ({ request }) => {
  const legacy = await request.post("/api/ai/assist", { data: { task: "methods", locale: "de", context: "x", data: {} } });
  expect(legacy.status()).toBe(400);
  await expect(legacy.json()).resolves.toMatchObject({ error: { code: "invalid_request" } });

  const confidentialRows = await request.post("/api/ai/assist", {
    data: { ...briefPayload, payload: { ...briefPayload.payload, rows: [{ case: "Fall 1" }] } },
  });
  expect(confidentialRows.status()).toBe(400);

  const numericGate = await request.post("/api/ai/assist", {
    data: { version: "v1", task: "decision_rationale_review", locale: "en", payload: { decision: "frequencyCutoff", rationale: "Theory", cutoff: 2 } },
  });
  expect(numericGate.status()).toBe(400);
  await expect(numericGate.json()).resolves.toEqual({
    error: { code: "invalid_request", message: "This AI request does not match the reviewed task contract." },
  });

  const oversized = await request.post("/api/ai/assist", {
    data: { ...briefPayload, payload: { ...briefPayload.payload, question: "x".repeat(13_000) } },
  });
  expect(oversized.status()).toBe(400);
});

test("AI route fails closed with a typed localized error when disabled", async ({ request }) => {
  const response = await request.post("/api/ai/assist", { data: { ...briefPayload, locale: "en" } });
  expect(response.status()).toBe(501);
  await expect(response.json()).resolves.toEqual({ error: { code: "disabled", message: "AI is not configured on this instance." } });
});
