#!/usr/bin/env node
import {
  existsSync,
  linkSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const AI_TASKS = ["brief_clarify", "calibration_evidence_gaps", "decision_rationale_review"];

const FIELD_ENUMS = {
  locale: ["de", "en"],
  entry_paths_identified: [0, 1, 2, 3],
  activation: ["complete", "assisted", "abandoned"],
  activation_time: ["under_5m", "5_to_10m", "over_10m"],
  activation_blocker: ["none", "entry", "import", "roles", "calibration", "navigation", "other"],
  first_destination: ["answer", "research", "decisions", "evidence", "defense"],
  brief_confirmation: ["complete", "assisted", "abandoned"],
  roles_understood: ["yes", "partial", "no"],
  brief_time: ["under_5m", "5_to_10m", "over_10m"],
  brief_blocker: ["none", "field_meaning", "role_selection", "confirmation", "navigation", "other"],
  calibration_completion: ["complete", "assisted", "abandoned"],
  decision_completion: ["complete", "assisted", "abandoned"],
  frequency_confirmation: [0, 1],
  consistency_confirmation: [0, 1],
  expectations_confirmation: [0, 1],
  invalidation_understood: ["yes", "partial", "no"],
  decision_time: ["under_10m", "10_to_20m", "over_20m"],
  decision_blocker: ["none", "calibration", "rationale", "confirmation", "navigation", "other"],
  evidence_visited: ["yes", "no"],
  provisional_interpretation: ["correct", "partial", "incorrect"],
  defense_ready: ["complete", "assisted", "abandoned"],
  gate_interpretation: ["correct", "partial", "incorrect"],
  defense_time: ["under_5m", "5_to_10m", "over_10m"],
  defense_blocker: ["none", "checklist", "calibration_status", "analysis_confirmation", "navigation", "other"],
};

const AI_FIELD_ENUMS = {
  payload_reviewed: ["yes", "no"],
  request_outcome: ["returned", "unavailable", "declined", "error"],
  helpfulness: ["helpful", "mixed", "not_helpful", "not_observed"],
  human_review_boundary: ["yes", "partial", "no"],
  prohibited_output: [
    "none",
    "numeric_recommendation",
    "citation_or_source",
    "causal_claim",
    "raw_or_case_data",
    "defense_assertion",
    "other",
  ],
  ai_time: ["under_2m", "2_to_5m", "over_5m"],
};

const OBSERVATION_FIELDS = Object.keys(FIELD_ENUMS).filter((field) => field !== "locale");

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value, expected, label) {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    const unknown = actual.filter((key) => !wanted.includes(key));
    const missing = wanted.filter((key) => !actual.includes(key));
    throw new Error(`${label} has an invalid shape; unknown=[${unknown.join(",")}], missing=[${missing.join(",")}].`);
  }
}

function validateEnumRecord(value, enums, label) {
  exactKeys(value, Object.keys(enums), label);
  for (const [key, allowed] of Object.entries(enums)) {
    if (!allowed.includes(value[key])) {
      throw new Error(`${label}.${key} must be one of: ${allowed.join(", ")}.`);
    }
  }
}

function emptyHistogram(values) {
  return Object.fromEntries(values.map((value) => [String(value), 0]));
}

function increment(histogram, value) {
  histogram[String(value)] += 1;
}

function createEmptyAggregate() {
  return {
    schemaVersion: "v1",
    cohortSize: 0,
    languageMix: { de: 0, en: 0, requirementMet: false },
    observations: Object.fromEntries(
      OBSERVATION_FIELDS.map((field) => [field, emptyHistogram(FIELD_ENUMS[field])]),
    ),
    decisions: { completeWithoutAssistance: 0 },
    conceptualBoundary: { correct: 0 },
    ai: Object.fromEntries(
      AI_TASKS.map((task) => [
        task,
        {
          observations: Object.fromEntries(
            Object.entries(AI_FIELD_ENUMS).map(([field, values]) => [field, emptyHistogram(values)]),
          ),
          helpful: 0,
          mixed: 0,
          usable: 0,
          prohibitedOutputs: 0,
        },
      ]),
    ),
    stopGates: {},
  };
}

function recomputeStopGates(aggregate) {
  aggregate.languageMix.requirementMet =
    aggregate.cohortSize === 5 && aggregate.languageMix.de >= 2 && aggregate.languageMix.en >= 2;
  aggregate.stopGates = {
    cohortComplete: aggregate.cohortSize === 5,
    languageMix: aggregate.languageMix.requirementMet,
    activationWithoutAssistance:
      aggregate.cohortSize === 5 && aggregate.observations.activation.complete >= 4,
    decisionsWithoutAssistance:
      aggregate.cohortSize === 5 && aggregate.decisions.completeWithoutAssistance >= 4,
    defenseReadyWithoutAssistance:
      aggregate.cohortSize === 5 && aggregate.observations.defense_ready.complete >= 4,
    conceptualBoundary:
      aggregate.cohortSize === 5 && aggregate.conceptualBoundary.correct === 5,
    ai: Object.fromEntries(
      AI_TASKS.map((task) => [
        task,
        aggregate.cohortSize === 5 &&
          aggregate.ai[task].helpful >= 3 &&
          aggregate.ai[task].usable >= 4 &&
          aggregate.ai[task].prohibitedOutputs === 0,
      ]),
    ),
  };
  aggregate.stopGates.allPassed =
    aggregate.stopGates.cohortComplete &&
    aggregate.stopGates.languageMix &&
    aggregate.stopGates.activationWithoutAssistance &&
    aggregate.stopGates.decisionsWithoutAssistance &&
    aggregate.stopGates.defenseReadyWithoutAssistance &&
    aggregate.stopGates.conceptualBoundary &&
    Object.values(aggregate.stopGates.ai).every(Boolean);
  return aggregate;
}

function validateSession(session, label) {
  exactKeys(session, [...Object.keys(FIELD_ENUMS), "ai"], label);
  validateEnumRecord(
    Object.fromEntries(Object.keys(FIELD_ENUMS).map((key) => [key, session[key]])),
    FIELD_ENUMS,
    label,
  );
  exactKeys(session.ai, AI_TASKS, `${label}.ai`);

  if (
    session.decision_completion === "complete" &&
    (session.calibration_completion !== "complete" ||
      session.frequency_confirmation !== 1 ||
      session.consistency_confirmation !== 1 ||
      session.expectations_confirmation !== 1 ||
      session.invalidation_understood !== "yes")
  ) {
    throw new Error(`${label}.decision_completion cannot be complete while a required decision is incomplete.`);
  }

  for (const task of AI_TASKS) {
    const result = session.ai[task];
    validateEnumRecord(result, AI_FIELD_ENUMS, `${label}.ai.${task}`);
    if (result.request_outcome !== "declined" && result.payload_reviewed !== "yes") {
      throw new Error(
        `${label}.ai.${task} must record payload_reviewed=yes before any request attempt.`,
      );
    }
    if (result.request_outcome !== "returned") {
      if (
        result.helpfulness !== "not_observed" ||
        result.human_review_boundary !== "no" ||
        result.prohibited_output !== "none"
      ) {
        throw new Error(
          `${label}.ai.${task} may record helpfulness, review understanding, or prohibited output only for a returned response.`,
        );
      }
    }
  }
}

function addSession(aggregate, session) {
  if (aggregate.cohortSize >= 5) throw new Error("The five-session cohort is already complete.");
  validateSession(session, `sessions[${aggregate.cohortSize}]`);
  if (aggregate.languageMix[session.locale] >= 3) {
    throw new Error("A five-session cohort may contain at most three sessions in either language.");
  }

  aggregate.cohortSize += 1;
  aggregate.languageMix[session.locale] += 1;
  for (const field of OBSERVATION_FIELDS) increment(aggregate.observations[field], session[field]);

  const decisionsComplete =
    session.decision_completion === "complete" &&
    session.calibration_completion === "complete" &&
    session.frequency_confirmation === 1 &&
    session.consistency_confirmation === 1 &&
    session.expectations_confirmation === 1 &&
    session.invalidation_understood === "yes";
  if (decisionsComplete) aggregate.decisions.completeWithoutAssistance += 1;

  if (session.provisional_interpretation === "correct" && session.gate_interpretation === "correct") {
    aggregate.conceptualBoundary.correct += 1;
  }

  for (const task of AI_TASKS) {
    const result = session.ai[task];
    for (const field of Object.keys(AI_FIELD_ENUMS)) {
      increment(aggregate.ai[task].observations[field], result[field]);
    }
    if (result.request_outcome === "returned") {
      if (result.helpfulness === "helpful") aggregate.ai[task].helpful += 1;
      if (result.helpfulness === "mixed") aggregate.ai[task].mixed += 1;
      if (result.helpfulness === "helpful" || result.helpfulness === "mixed") {
        aggregate.ai[task].usable += 1;
      }
      if (result.prohibited_output !== "none") aggregate.ai[task].prohibitedOutputs += 1;
    }
  }

  return recomputeStopGates(aggregate);
}

function validateCount(value, maximum, label) {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new Error(`${label} must be an integer from 0 to ${maximum}.`);
  }
}
function validateBoolean(value, label) {
  if (typeof value !== "boolean") throw new Error(`${label} must be a boolean.`);
}

function validateHistogram(histogram, values, total, label) {
  exactKeys(histogram, values.map(String), label);
  let sum = 0;
  for (const value of Object.values(histogram)) {
    validateCount(value, total, label);
    sum += value;
  }
  if (sum !== total) throw new Error(`${label} counts must sum to ${total}.`);
}

function validateAggregate(raw) {
  exactKeys(
    raw,
    [
      "schemaVersion",
      "cohortSize",
      "languageMix",
      "observations",
      "decisions",
      "conceptualBoundary",
      "ai",
      "stopGates",
    ],
    "aggregate",
  );
  if (raw.schemaVersion !== "v1") throw new Error("aggregate.schemaVersion must be v1.");
  validateCount(raw.cohortSize, 5, "aggregate.cohortSize");
  exactKeys(raw.languageMix, ["de", "en", "requirementMet"], "aggregate.languageMix");
  validateCount(raw.languageMix.de, raw.cohortSize, "aggregate.languageMix.de");
  validateCount(raw.languageMix.en, raw.cohortSize, "aggregate.languageMix.en");
  if (raw.languageMix.de + raw.languageMix.en !== raw.cohortSize) {
    throw new Error("aggregate.languageMix counts must equal cohortSize.");
  }
  if (raw.languageMix.de > 3 || raw.languageMix.en > 3) {
    throw new Error("aggregate language mix cannot satisfy the final two-per-language requirement.");
  }

  exactKeys(raw.observations, OBSERVATION_FIELDS, "aggregate.observations");
  for (const field of OBSERVATION_FIELDS) {
    validateHistogram(
      raw.observations[field],
      FIELD_ENUMS[field],
      raw.cohortSize,
      `aggregate.observations.${field}`,
    );
  }

  exactKeys(raw.decisions, ["completeWithoutAssistance"], "aggregate.decisions");
  validateCount(
    raw.decisions.completeWithoutAssistance,
    raw.cohortSize,
    "aggregate.decisions.completeWithoutAssistance",
  );
  if (
    raw.decisions.completeWithoutAssistance !==
    raw.observations.decision_completion.complete
  ) {
    throw new Error(
      "aggregate.decisions.completeWithoutAssistance must equal completed decision blocks.",
    );
  }
  const decisionPrerequisites = [
    raw.observations.calibration_completion.complete,
    raw.observations.frequency_confirmation["1"],
    raw.observations.consistency_confirmation["1"],
    raw.observations.expectations_confirmation["1"],
    raw.observations.invalidation_understood.yes,
  ];
  if (
    decisionPrerequisites.some(
      (count) => count < raw.decisions.completeWithoutAssistance,
    )
  ) {
    throw new Error(
      "aggregate completed decision blocks exceed a required-decision histogram.",
    );
  }
  exactKeys(raw.conceptualBoundary, ["correct"], "aggregate.conceptualBoundary");
  validateCount(raw.conceptualBoundary.correct, raw.cohortSize, "aggregate.conceptualBoundary.correct");
  const conceptualMinimum = Math.max(
    0,
    raw.observations.provisional_interpretation.correct +
      raw.observations.gate_interpretation.correct -
      raw.cohortSize,
  );
  const conceptualMaximum = Math.min(
    raw.observations.provisional_interpretation.correct,
    raw.observations.gate_interpretation.correct,
  );
  if (
    raw.conceptualBoundary.correct < conceptualMinimum ||
    raw.conceptualBoundary.correct > conceptualMaximum
  ) {
    throw new Error("aggregate.conceptualBoundary.correct is inconsistent with its histograms.");
  }

  exactKeys(raw.ai, AI_TASKS, "aggregate.ai");
  for (const task of AI_TASKS) {
    const ai = raw.ai[task];
    exactKeys(
      ai,
      ["observations", "helpful", "mixed", "usable", "prohibitedOutputs"],
      `aggregate.ai.${task}`,
    );
    exactKeys(ai.observations, Object.keys(AI_FIELD_ENUMS), `aggregate.ai.${task}.observations`);
    for (const [field, values] of Object.entries(AI_FIELD_ENUMS)) {
      validateHistogram(
        ai.observations[field],
        values,
        raw.cohortSize,
        `aggregate.ai.${task}.observations.${field}`,
      );
    }
    for (const field of ["helpful", "mixed", "usable", "prohibitedOutputs"]) {
      validateCount(ai[field], raw.cohortSize, `aggregate.ai.${task}.${field}`);
    }
    const returned = ai.observations.request_outcome.returned;
    const attempted =
      raw.cohortSize - ai.observations.request_outcome.declined;
    const assessed =
      raw.cohortSize - ai.observations.helpfulness.not_observed;
    const boundaryAssessed =
      ai.observations.human_review_boundary.yes +
      ai.observations.human_review_boundary.partial;
    if (
      ai.helpful !== ai.observations.helpfulness.helpful ||
      ai.mixed !== ai.observations.helpfulness.mixed ||
      ai.usable !== ai.helpful + ai.mixed ||
      ai.prohibitedOutputs !== raw.cohortSize - ai.observations.prohibited_output.none ||
      ai.usable > returned ||
      assessed > returned ||
      boundaryAssessed > returned ||
      ai.prohibitedOutputs > returned ||
      attempted > ai.observations.payload_reviewed.yes
    ) {
      throw new Error(`aggregate.ai.${task} counters are inconsistent with their histograms.`);
    }
  }
  validateBoolean(raw.languageMix.requirementMet, "aggregate.languageMix.requirementMet");
  exactKeys(
    raw.stopGates,
    [
      "cohortComplete",
      "languageMix",
      "activationWithoutAssistance",
      "decisionsWithoutAssistance",
      "defenseReadyWithoutAssistance",
      "conceptualBoundary",
      "ai",
      "allPassed",
    ],
    "aggregate.stopGates",
  );
  exactKeys(raw.stopGates.ai, AI_TASKS, "aggregate.stopGates.ai");
  for (const key of [
    "cohortComplete",
    "languageMix",
    "activationWithoutAssistance",
    "decisionsWithoutAssistance",
    "defenseReadyWithoutAssistance",
    "conceptualBoundary",
    "allPassed",
  ]) {
    validateBoolean(raw.stopGates[key], `aggregate.stopGates.${key}`);
  }
  for (const task of AI_TASKS) {
    validateBoolean(raw.stopGates.ai[task], `aggregate.stopGates.ai.${task}`);
  }
  const normalized = recomputeStopGates(structuredClone(raw));
  if (
    raw.languageMix.requirementMet !== normalized.languageMix.requirementMet ||
    Object.keys(raw.stopGates).some(
      (key) =>
        key !== "ai" &&
        raw.stopGates[key] !== normalized.stopGates[key],
    ) ||
    AI_TASKS.some((task) => raw.stopGates.ai[task] !== normalized.stopGates.ai[task])
  ) {
    throw new Error("aggregate derived readiness fields are inconsistent with its counts.");
  }
  return normalized;
}

export function createObservationTemplate(locale) {
  if (!FIELD_ENUMS.locale.includes(locale)) throw new Error("Template locale must be de or en.");
  const ai = Object.fromEntries(
    AI_TASKS.map((task) => [
      task,
      {
        payload_reviewed: "no",
        request_outcome: "declined",
        helpfulness: "not_observed",
        human_review_boundary: "no",
        prohibited_output: "none",
        ai_time: "under_2m",
      },
    ]),
  );
  return {
    schemaVersion: "v1",
    sessions: [
      {
        locale,
        entry_paths_identified: 0,
        activation: "abandoned",
        activation_time: "over_10m",
        activation_blocker: "other",
        first_destination: "answer",
        brief_confirmation: "abandoned",
        roles_understood: "no",
        brief_time: "over_10m",
        brief_blocker: "other",
        calibration_completion: "abandoned",
        decision_completion: "abandoned",
        frequency_confirmation: 0,
        consistency_confirmation: 0,
        expectations_confirmation: 0,
        invalidation_understood: "no",
        decision_time: "over_20m",
        decision_blocker: "other",
        evidence_visited: "no",
        provisional_interpretation: "incorrect",
        defense_ready: "abandoned",
        gate_interpretation: "incorrect",
        defense_time: "over_10m",
        defense_blocker: "other",
        ai,
      },
    ],
  };
}

export function aggregateResearchObservations(input) {
  exactKeys(input, ["schemaVersion", "sessions"], "input");
  if (input.schemaVersion !== "v1" || !Array.isArray(input.sessions)) {
    throw new Error("Expected { schemaVersion: 'v1', sessions: [...] }.");
  }
  if (input.sessions.length < 1 || input.sessions.length > 5) {
    throw new Error("One to five session rows are required.");
  }
  const aggregate = createEmptyAggregate();
  for (const session of input.sessions) addSession(aggregate, session);
  return aggregate;
}

const PARTIAL_KIND = "encrypted-partial-cohort";
const PARTIAL_ALGORITHM = "aes-256-gcm";
const PARTIAL_AAD = Buffer.from("openqca-research-partial-v1", "utf8");

function readPrivateKey(keyFile) {
  const key = readFileSync(keyFile);
  if (key.length !== 32) throw new Error("Research key must contain exactly 32 random bytes.");
  if (process.platform !== "win32" && (statSync(keyFile).mode & 0o077) !== 0) {
    throw new Error("Research key must not be readable or writable by group or other users.");
  }
  return key;
}

function encryptPartialAggregate(aggregate, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(PARTIAL_ALGORITHM, key, iv);
  cipher.setAAD(PARTIAL_AAD);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(aggregate), "utf8"),
    cipher.final(),
  ]);
  return {
    schemaVersion: "v1",
    kind: PARTIAL_KIND,
    algorithm: PARTIAL_ALGORITHM,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };
}

function decodeBase64(value, bytes, label) {
  if (typeof value !== "string") throw new Error(`${label} must be base64 text.`);
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== bytes || decoded.toString("base64") !== value) {
    throw new Error(`${label} is not canonical base64 with ${bytes} bytes.`);
  }
  return decoded;
}

function decryptPartialAggregate(envelope, key) {
  exactKeys(
    envelope,
    ["schemaVersion", "kind", "algorithm", "iv", "authTag", "ciphertext"],
    "partial aggregate",
  );
  if (
    envelope.schemaVersion !== "v1" ||
    envelope.kind !== PARTIAL_KIND ||
    envelope.algorithm !== PARTIAL_ALGORITHM
  ) {
    throw new Error("Unsupported encrypted partial aggregate.");
  }
  const iv = decodeBase64(envelope.iv, 12, "partial aggregate iv");
  const authTag = decodeBase64(envelope.authTag, 16, "partial aggregate authTag");
  if (typeof envelope.ciphertext !== "string" || envelope.ciphertext.length === 0) {
    throw new Error("partial aggregate ciphertext must be non-empty base64 text.");
  }
  const ciphertext = Buffer.from(envelope.ciphertext, "base64");
  if (ciphertext.toString("base64") !== envelope.ciphertext) {
    throw new Error("partial aggregate ciphertext must be canonical base64.");
  }
  try {
    const decipher = createDecipheriv(PARTIAL_ALGORITHM, key, iv);
    decipher.setAAD(PARTIAL_AAD);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return validateAggregate(JSON.parse(plaintext.toString("utf8")));
  } catch {
    throw new Error("Encrypted partial aggregate authentication failed.");
  }
}

function writePrivateJsonAtomic(output, value, { replace = false } = {}) {
  if (!replace && existsSync(output)) throw new Error(`Refusing to overwrite existing file: ${output}`);
  const candidate = join(dirname(output), `.${basename(output)}.candidate-${randomUUID()}`);
  try {
    writeFileSync(candidate, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
      flag: "wx",
    });
    if (replace) {
      renameSync(candidate, output);
    } else {
      linkSync(candidate, output);
      unlinkSync(candidate);
    }
  } catch (error) {
    rmSync(candidate, { force: true });
    throw error;
  }
}

function runCli() {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === "--create-key") {
    const [, output] = args;
    writeFileSync(output, randomBytes(32), { mode: 0o600, flag: "wx" });
    process.stdout.write(`Private research key written to ${output}.\n`);
    return;
  }
  if (args.length === 3 && args[0] === "--template") {
    const [, locale, output] = args;
    writePrivateJsonAtomic(output, createObservationTemplate(locale));
    process.stdout.write(`Private ${locale} session template written to ${output}.\n`);
    return;
  }

  const [source, outputFlag, output, keyFlag, keyFile, deleteFlag] = args;
  if (
    !source ||
    outputFlag !== "--output" ||
    !output ||
    keyFlag !== "--key-file" ||
    !keyFile ||
    deleteFlag !== "--delete-source" ||
    args.length !== 6
  ) {
    throw new Error(
      "Usage: node scripts/aggregate-research-observations.mjs --create-key KEY.bin | --template de|en SESSION.json | SESSION.json --output AGGREGATE.json --key-file KEY.bin --delete-source",
    );
  }
  if (new Set([source, output, keyFile].map((path) => resolve(path))).size !== 3) {
    throw new Error("Session, aggregate, and key paths must be distinct.");
  }

  const input = JSON.parse(readFileSync(source, "utf8"));
  if (!Array.isArray(input.sessions) || input.sessions.length !== 1) {
    throw new Error("The CLI accepts exactly one session row so it can be deleted within 24 hours.");
  }
  aggregateResearchObservations(input);
  const key = readPrivateKey(keyFile);
  const outputExists = existsSync(output);
  let aggregate;
  if (outputExists) {
    const persisted = JSON.parse(readFileSync(output, "utf8"));
    if (isRecord(persisted) && persisted.kind === PARTIAL_KIND) {
      aggregate = decryptPartialAggregate(persisted, key);
    } else {
      aggregate = validateAggregate(persisted);
      if (aggregate.cohortSize < 5) {
        throw new Error("Partial cohort state must never be stored as readable aggregate counts.");
      }
    }
  } else {
    aggregate = createEmptyAggregate();
  }
  addSession(aggregate, input.sessions[0]);
  const cohortComplete = aggregate.cohortSize === 5;
  writePrivateJsonAtomic(
    output,
    cohortComplete ? aggregate : encryptPartialAggregate(aggregate, key),
    { replace: outputExists },
  );
  try {
    unlinkSync(source);
  } catch (error) {
    let keyRecovery = "";
    if (cohortComplete) {
      try {
        unlinkSync(keyFile);
        keyRecovery = " The obsolete final-cohort key was deleted.";
      } catch (keyError) {
        keyRecovery = ` Also delete ${keyFile} manually: ${
          keyError instanceof Error ? keyError.message : String(keyError)
        }`;
      }
    }
    throw new Error(
      `Aggregate updated at ${output}, but source deletion failed. Delete ${source} manually and do not rerun it: ${
        error instanceof Error ? error.message : String(error)
      }.${keyRecovery}`,
    );
  }
  if (cohortComplete) {
    try {
      unlinkSync(keyFile);
    } catch (error) {
      throw new Error(
        `Final aggregate written and source deleted, but obsolete key deletion failed. Delete ${keyFile} manually: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    process.stdout.write(
      `Final five-session aggregate written to ${output}; validated source and partial-state key deleted.\n`,
    );
  } else {
    process.stdout.write(
      `Session ${aggregate.cohortSize}/5 secured in ${output}; validated source deleted.\n`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    runCli();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
