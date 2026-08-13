import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  aggregateResearchObservations,
  createObservationTemplate,
} from "./aggregate-research-observations.mjs";

const script = join(import.meta.dirname, "aggregate-research-observations.mjs");
const aiResult = {
  payload_reviewed: "yes",
  request_outcome: "returned",
  helpfulness: "helpful",
  human_review_boundary: "yes",
  prohibited_output: "none",
  ai_time: "under_2m",
};

function session(locale) {
  return {
    locale,
    entry_paths_identified: 3,
    activation: "complete",
    activation_time: "under_5m",
    activation_blocker: "none",
    first_destination: "answer",
    brief_confirmation: "complete",
    roles_understood: "yes",
    brief_time: "under_5m",
    brief_blocker: "none",
    calibration_completion: "complete",
    decision_completion: "complete",
    frequency_confirmation: 1,
    consistency_confirmation: 1,
    expectations_confirmation: 1,
    invalidation_understood: "yes",
    decision_time: "under_10m",
    decision_blocker: "none",
    evidence_visited: "yes",
    provisional_interpretation: "correct",
    defense_ready: "complete",
    gate_interpretation: "correct",
    causal_interpretation: "correct",
    defense_time: "under_5m",
    defense_blocker: "none",
    ai: {
      brief_clarify: { ...aiResult },
      calibration_evidence_gaps: { ...aiResult },
      decision_rationale_review: { ...aiResult },
    },
  };
}

function passingInput() {
  return {
    schemaVersion: "v2",
    sessions: [session("de"), session("de"), session("en"), session("en"), session("de")],
  };
}

function createResearchKey(directory) {
  const key = join(directory, "research.key");
  execFileSync(process.execPath, [script, "--create-key", key], { encoding: "utf8" });
  assert.equal(statSync(key).mode & 0o777, 0o600);
  return key;
}

test("aggregates all one-dimensional diagnostics and passes a complete five-session cohort", () => {
  const aggregate = aggregateResearchObservations(passingInput());
  assert.equal(aggregate.cohortSize, 5);
  assert.deepEqual(aggregate.languageMix, { de: 3, en: 2, requirementMet: true });
  assert.equal(aggregate.observations.entry_paths_identified[3], 5);
  assert.equal(aggregate.observations.activation.complete, 5);
  assert.equal(aggregate.observations.decision_completion.complete, 5);
  assert.equal(aggregate.observations.activation_time.under_5m, 5);
  assert.equal(aggregate.decisions.completeWithoutAssistance, 5);
  assert.equal(aggregate.conceptualBoundary.correct, 5);
  assert.equal(aggregate.ai.brief_clarify.observations.request_outcome.returned, 5);
  assert.equal(aggregate.ai.brief_clarify.helpful, 5);
  assert.equal(aggregate.stopGates.allPassed, true);
});

test("one-session template is valid, private-data bounded, and fail-closed by default", () => {
  const template = createObservationTemplate("de");
  const aggregate = aggregateResearchObservations(template);
  assert.equal(template.sessions.length, 1);
  assert.equal(aggregate.cohortSize, 1);
  assert.equal(aggregate.languageMix.de, 1);
  assert.equal(aggregate.stopGates.cohortComplete, false);
  assert.equal(aggregate.stopGates.allPassed, false);
});

test("fails only the affected final gates without weakening other aggregates", () => {
  const input = passingInput();
  input.sessions[0].activation = "assisted";
  input.sessions[1].activation = "assisted";
  input.sessions[0].provisional_interpretation = "partial";
  input.sessions[0].causal_interpretation = "incorrect";
  input.sessions[0].ai.brief_clarify.prohibited_output = "numeric_recommendation";
  const aggregate = aggregateResearchObservations(input);
  assert.equal(aggregate.stopGates.activationWithoutAssistance, false);
  assert.equal(aggregate.stopGates.conceptualBoundary, false);
  assert.equal(aggregate.stopGates.ai.brief_clarify, false);
  assert.equal(aggregate.stopGates.ai.calibration_evidence_gaps, true);
  assert.equal(aggregate.stopGates.allPassed, false);
});

test("causal interpretation independently gates the conceptual boundary", () => {
  const input = passingInput();
  input.sessions[0].causal_interpretation = "incorrect";
  const aggregate = aggregateResearchObservations(input);
  assert.equal(aggregate.observations.provisional_interpretation.correct, 5);
  assert.equal(aggregate.observations.gate_interpretation.correct, 5);
  assert.equal(aggregate.observations.causal_interpretation.incorrect, 1);
  assert.equal(aggregate.conceptualBoundary.correct, 4);
  assert.equal(aggregate.stopGates.conceptualBoundary, false);
  assert.equal(aggregate.stopGates.allPassed, false);
});

test("rejects the pre-causal-boundary v1 schema", () => {
  const input = passingInput();
  input.schemaVersion = "v1";
  assert.throws(() => aggregateResearchObservations(input), /schemaVersion: 'v2'/);
});

test("rejects identifiers, free text, missing tasks, and non-enum values", () => {
  const withIdentifier = passingInput();
  withIdentifier.sessions[0].participant = "P1";
  assert.throws(() => aggregateResearchObservations(withIdentifier), /unknown=\[participant\]/);

  const withFreeText = passingInput();
  withFreeText.sessions[0].notes = "clicked around";
  assert.throws(() => aggregateResearchObservations(withFreeText), /unknown=\[notes\]/);

  const missingTask = passingInput();
  delete missingTask.sessions[0].ai.brief_clarify;
  assert.throws(() => aggregateResearchObservations(missingTask), /invalid shape/);

  const invalidValue = passingInput();
  invalidValue.sessions[0].activation_time = "4m12s";
  assert.throws(() => aggregateResearchObservations(invalidValue), /activation_time must be one of/);
});

test("rejects impossible AI and decision cross-field combinations", () => {
  const impossibleAi = passingInput();
  impossibleAi.sessions[0].ai.brief_clarify.request_outcome = "declined";
  assert.throws(
    () => aggregateResearchObservations(impossibleAi),
    /only for a returned response/,
  );

  const unreviewedAi = passingInput();
  unreviewedAi.sessions[0].ai.brief_clarify.payload_reviewed = "no";
  assert.throws(
    () => aggregateResearchObservations(unreviewedAi),
    /payload_reviewed=yes/,
  );

  const assistedDecision = passingInput();
  assistedDecision.sessions[0].calibration_completion = "assisted";
  assert.throws(
    () => aggregateResearchObservations(assistedDecision),
    /decision_completion cannot be complete/,
  );
});

test("rejects a language sequence that can no longer satisfy two DE and two EN", () => {
  const impossibleMix = {
    schemaVersion: "v2",
    sessions: [session("de"), session("de"), session("de"), session("de")],
  };
  assert.throws(
    () => aggregateResearchObservations(impossibleMix),
    /at most three sessions in either language/,
  );
});

test("CLI rejects infeasible decision and AI marginals in prior aggregates", () => {
  const directory = mkdtempSync(join(tmpdir(), "openqca-observations-test-"));
  const output = join(directory, "aggregate.json");
  const source = join(directory, "next.json");
  const key = createResearchKey(directory);
  const run = () =>
    execFileSync(
      process.execPath,
      [script, source, "--output", output, "--key-file", key, "--delete-source"],
      { encoding: "utf8", stdio: "pipe" },
    );
  try {
    const invalidDecisions = aggregateResearchObservations(passingInput());
    invalidDecisions.observations.frequency_confirmation["1"] = 0;
    invalidDecisions.observations.frequency_confirmation["0"] = 5;
    writeFileSync(output, JSON.stringify(invalidDecisions), { mode: 0o600 });
    writeFileSync(source, JSON.stringify({ schemaVersion: "v2", sessions: [session("en")] }), {
      mode: 0o600,
    });
    assert.throws(run, /required-decision histogram/);
    assert.equal(existsSync(source), true);

    const invalidAi = aggregateResearchObservations(passingInput());
    const ai = invalidAi.ai.brief_clarify;
    ai.observations.request_outcome.returned = 4;
    ai.observations.request_outcome.declined = 1;
    ai.observations.helpfulness.helpful = 3;
    ai.observations.helpfulness.mixed = 1;
    ai.observations.helpfulness.not_helpful = 1;
    ai.helpful = 3;
    ai.mixed = 1;
    ai.usable = 4;
    writeFileSync(output, JSON.stringify(invalidAi), { mode: 0o600 });
    assert.throws(run, /counters are inconsistent/);
    assert.equal(existsSync(source), true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI creates private key and session files exclusively", () => {
  const directory = mkdtempSync(join(tmpdir(), "openqca-observations-test-"));
  const output = join(directory, "session.json");
  try {
    const key = createResearchKey(directory);
    assert.equal(readFileSync(key).length, 32);
    assert.throws(() =>
      execFileSync(process.execPath, [script, "--create-key", key], {
        encoding: "utf8",
        stdio: "pipe",
      }),
    );
    execFileSync(process.execPath, [script, "--template", "en", output], { encoding: "utf8" });
    assert.equal(statSync(output).mode & 0o777, 0o600);
    const template = JSON.parse(readFileSync(output, "utf8"));
    assert.equal(template.sessions.length, 1);
    assert.equal(template.sessions[0].locale, "en");
    assert.throws(() =>
      execFileSync(process.execPath, [script, "--template", "de", output], {
        encoding: "utf8",
        stdio: "pipe",
      }),
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI encrypts partial counts, then emits only the complete five-session aggregate", () => {
  const directory = mkdtempSync(join(tmpdir(), "openqca-observations-test-"));
  const output = join(directory, "aggregate.json");
  const key = createResearchKey(directory);
  try {
    for (const [index, locale] of ["de", "de", "en", "en", "de"].entries()) {
      const source = join(directory, `session-${index}.json`);
      writeFileSync(source, JSON.stringify({ schemaVersion: "v2", sessions: [session(locale)] }), {
        mode: 0o600,
      });
      execFileSync(
        process.execPath,
        [script, source, "--output", output, "--key-file", key, "--delete-source"],
        { encoding: "utf8" },
      );
      assert.equal(existsSync(source), false);
      const persistedText = readFileSync(output, "utf8");
      const persisted = JSON.parse(persistedText);
      if (index < 4) {
        assert.equal(persisted.kind, "encrypted-partial-cohort");
        assert.equal("cohortSize" in persisted, false);
        assert.equal(persistedText.includes("\"observations\""), false);
        assert.equal(existsSync(key), true);
      } else {
        assert.equal(persisted.cohortSize, 5);
        assert.equal(persisted.stopGates.allPassed, true);
      }
    }
    const aggregateText = readFileSync(output, "utf8");
    const aggregate = JSON.parse(aggregateText);
    assert.equal(existsSync(key), false);
    assert.equal(statSync(output).mode & 0o777, 0o600);
    assert.equal(aggregate.languageMix.requirementMet, true);
    assert.equal(aggregate.observations.decision_blocker.none, 5);
    assert.equal(aggregate.ai.decision_rationale_review.observations.ai_time.under_2m, 5);
    assert.equal(aggregateText.includes("participant"), false);
    assert.equal(aggregateText.includes("notes"), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test(
  "CLI removes the obsolete key when final source deletion fails",
  { skip: process.platform === "win32" },
  () => {
    const directory = mkdtempSync(join(tmpdir(), "openqca-observations-test-"));
    const output = join(directory, "aggregate.json");
    const key = createResearchKey(directory);
    let lockedDirectory;
    try {
      for (const [index, locale] of ["de", "de", "en", "en"].entries()) {
        const source = join(directory, `accepted-${index}.json`);
        writeFileSync(source, JSON.stringify({ schemaVersion: "v2", sessions: [session(locale)] }), {
          mode: 0o600,
        });
        execFileSync(
          process.execPath,
          [script, source, "--output", output, "--key-file", key, "--delete-source"],
        );
      }
      lockedDirectory = mkdtempSync(join(directory, "locked-"));
      const source = join(lockedDirectory, "final.json");
      writeFileSync(source, JSON.stringify({ schemaVersion: "v2", sessions: [session("de")] }), {
        mode: 0o600,
      });
      chmodSync(lockedDirectory, 0o500);
      assert.throws(
        () =>
          execFileSync(
            process.execPath,
            [script, source, "--output", output, "--key-file", key, "--delete-source"],
            { encoding: "utf8", stdio: "pipe" },
          ),
        /obsolete final-cohort key was deleted/,
      );
      assert.equal(existsSync(source), true);
      assert.equal(existsSync(key), false);
      assert.equal(JSON.parse(readFileSync(output, "utf8")).cohortSize, 5);
    } finally {
      if (lockedDirectory && existsSync(lockedDirectory)) chmodSync(lockedDirectory, 0o700);
      rmSync(directory, { recursive: true, force: true });
    }
  },
);

test("CLI preserves source and encrypted partial aggregate when the next session is invalid", () => {
  const directory = mkdtempSync(join(tmpdir(), "openqca-observations-test-"));
  const output = join(directory, "aggregate.json");
  const key = createResearchKey(directory);
  try {
    for (let index = 0; index < 3; index += 1) {
      const source = join(directory, `accepted-${index}.json`);
      writeFileSync(source, JSON.stringify({ schemaVersion: "v2", sessions: [session("de")] }), {
        mode: 0o600,
      });
      execFileSync(
        process.execPath,
        [script, source, "--output", output, "--key-file", key, "--delete-source"],
      );
    }
    const before = readFileSync(output, "utf8");
    const rejected = join(directory, "rejected.json");
    writeFileSync(rejected, JSON.stringify({ schemaVersion: "v2", sessions: [session("de")] }), {
      mode: 0o600,
    });
    assert.throws(() =>
      execFileSync(
        process.execPath,
        [script, rejected, "--output", output, "--key-file", key, "--delete-source"],
        { encoding: "utf8", stdio: "pipe" },
      ),
    );
    assert.equal(existsSync(rejected), true);
    assert.equal(readFileSync(output, "utf8"), before);
    assert.equal(readdirSync(directory).some((name) => name.includes(".candidate-")), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("CLI authenticates partial state before deleting the next session", () => {
  const directory = mkdtempSync(join(tmpdir(), "openqca-observations-test-"));
  const output = join(directory, "aggregate.json");
  const first = join(directory, "first.json");
  const next = join(directory, "next.json");
  const key = createResearchKey(directory);
  try {
    writeFileSync(first, JSON.stringify({ schemaVersion: "v2", sessions: [session("de")] }), {
      mode: 0o600,
    });
    execFileSync(
      process.execPath,
      [script, first, "--output", output, "--key-file", key, "--delete-source"],
    );
    const tampered = JSON.parse(readFileSync(output, "utf8"));
    tampered.unexpected = true;
    writeFileSync(output, JSON.stringify(tampered), { mode: 0o600 });
    const before = readFileSync(output, "utf8");
    writeFileSync(next, JSON.stringify({ schemaVersion: "v2", sessions: [session("en")] }), {
      mode: 0o600,
    });
    assert.throws(() =>
      execFileSync(
        process.execPath,
        [script, next, "--output", output, "--key-file", key, "--delete-source"],
        { encoding: "utf8", stdio: "pipe" },
      ),
    );
    assert.equal(existsSync(next), true);
    assert.equal(readFileSync(output, "utf8"), before);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
