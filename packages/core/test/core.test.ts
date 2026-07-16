import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import {
  PROTOCOL_VERSION,
  TransitionError,
  applyBehaviorEvent,
  createBehaviorState,
  claimEventEvidence,
  evaluateCompletion,
  evaluateBehavior,
  evidenceFromEvents,
  intersectCapabilities,
  protocolSchemasV1,
  protocolV1,
  restoreBehaviorState,
  recordEvent,
  runSkillRouter,
  runTaskClassifier,
  serializeBehaviorState,
  type BehaviorEvent,
  type BehaviorInput,
  type BehaviorPlan,
  type BehaviorState,
  type HostExecutionEvent,
} from "@agenticswe/core";

function hostEvent(
  sequence: number,
  overrides: Partial<HostExecutionEvent> = {},
): HostExecutionEvent {
  return {
    schemaVersion: 1,
    protocolVersion: PROTOCOL_VERSION,
    id: `host-${sequence}`,
    sessionId: "session-delivery",
    requestId: "request-delivery",
    turnNumber: 1,
    sequence,
    type: "tool.completed",
    outcome: "succeeded",
    occurredAt: "2026-07-16T12:00:00.000Z",
    ...overrides,
  };
}

async function fixture(name: string): Promise<{ input: BehaviorInput; expected: BehaviorPlan }> {
  return JSON.parse(
    await readFile(resolve(`protocol/v1/conformance/${name}`), "utf8"),
  ) as { input: BehaviorInput; expected: BehaviorPlan };
}

test("capability intersection preserves protocol order and deny-wins", () => {
  assert.deepEqual(
    intersectCapabilities(
      ["repository:read", "workspace:mutate", "external:mutate"],
      ["repository:read", "workspace:mutate"],
      ["repository:read", "external:mutate"],
    ),
    ["repository:read"],
  );
});

test("embedded protocol and schemas are deeply immutable", () => {
  assert.equal(Object.isFrozen(protocolV1), true);
  assert.equal(Object.isFrozen(protocolV1.phases), true);
  assert.equal(Object.isFrozen(protocolV1.phases[0]?.requestedCapabilities), true);
  assert.equal(Object.isFrozen(protocolSchemasV1), true);
  assert.equal(Object.isFrozen(protocolSchemasV1["common.schema.json"]), true);
});

test("state machine applies a guarded legal transition", () => {
  const state = createBehaviorState("session-1", "request-1");
  const event: BehaviorEvent = {
    protocolVersion: PROTOCOL_VERSION,
    id: "event-1",
    sessionId: state.sessionId,
    requestId: state.requestId,
    sequence: 1,
    type: "repository.discovered",
    source: "host",
    fromPhase: "discovery",
    toPhase: "classification",
  };
  const next = applyBehaviorEvent(state, event, ["repository-context-valid"]);
  assert.equal(next.phase, "classification");
  assert.equal(next.sequence, 1);
  assert.equal(next.lastEventId, "event-1");
});

test("state machine rejects illegal transitions and missing guards", () => {
  const state = createBehaviorState("session-1", "request-1");
  const event: BehaviorEvent = {
    protocolVersion: PROTOCOL_VERSION,
    id: "event-1",
    sessionId: state.sessionId,
    requestId: state.requestId,
    sequence: 1,
    type: "repository.discovered",
    source: "host",
    fromPhase: "discovery",
    toPhase: "classification",
  };
  assert.throws(
    () => applyBehaviorEvent(state, event),
    (error: unknown) => error instanceof TransitionError && error.code === "UNSATISFIED_GUARD",
  );
  assert.throws(
    () => applyBehaviorEvent(state, { ...event, type: "implementation.finished" }),
    (error: unknown) => error instanceof TransitionError && error.code === "ILLEGAL_TRANSITION",
  );
});

test("serialized state restores to the same evaluation", async () => {
  const { input } = await fixture("08-verification-missing-evidence.json");
  const original = input.state as BehaviorState;
  const serialized = serializeBehaviorState(original);
  const restored = restoreBehaviorState(serialized);
  assert.deepEqual(restored, original);
  assert.deepEqual(
    evaluateBehavior({ ...input, state: restored }),
    evaluateBehavior({ ...input, state: original }),
  );
  assert.equal(serializeBehaviorState(restored), serialized);
});

test("restore rejects state from an incompatible protocol", () => {
  assert.throws(
    () => restoreBehaviorState(JSON.stringify({ protocolVersion: "2.0" })),
    /protocol version is incompatible/,
  );
});

test("classifier failures and invalid output fall back to uncertain", async () => {
  const failed = await runTaskClassifier(
    { classify: async () => { throw new Error("provider unavailable"); } },
    { requestId: "request-1", summary: "Change behavior" },
  );
  assert.equal(failed.classification.value, "uncertain");
  assert.equal(failed.diagnostics[0]?.code, "CLASSIFIER_FAILED");

  const invalid = await runTaskClassifier(
    { classify: async () => ({ value: "easy", reasons: [] }) },
    { requestId: "request-1", summary: "Change behavior" },
  );
  assert.equal(invalid.classification.value, "uncertain");
  assert.equal(invalid.diagnostics[0]?.code, "CLASSIFIER_INVALID_OUTPUT");
});

test("aborted classifier resolves conservatively without throwing", async () => {
  const controller = new AbortController();
  controller.abort();
  const result = await runTaskClassifier(
    { classify: async () => ({ value: "trivial", reasons: ["mechanical"] }) },
    { requestId: "request-1", summary: "Typo" },
    controller.signal,
  );
  assert.equal(result.classification.value, "uncertain");
  assert.equal(result.diagnostics[0]?.code, "CLASSIFIER_ABORTED");
});

test("classifier abort settles even when the port ignores its signal", async () => {
  const controller = new AbortController();
  const pending = runTaskClassifier(
    { classify: async () => new Promise(() => {}) },
    { requestId: "request-1", summary: "Change behavior" },
    controller.signal,
    1_000,
  );
  setTimeout(() => controller.abort(), 5);
  const result = await pending;
  assert.equal(result.classification.value, "uncertain");
  assert.equal(result.diagnostics[0]?.code, "CLASSIFIER_ABORTED");
});

test("classifier timeout aborts the port and falls back to uncertain", async () => {
  let observedAbort = false;
  const result = await runTaskClassifier(
    {
      classify: async (_input, signal) =>
        new Promise((_resolve) => {
          signal?.addEventListener("abort", () => { observedAbort = true; }, { once: true });
        }),
    },
    { requestId: "request-1", summary: "Change behavior" },
    undefined,
    5,
  );
  assert.equal(result.classification.value, "uncertain");
  assert.equal(result.diagnostics[0]?.code, "CLASSIFIER_TIMEOUT");
  assert.equal(observedAbort, true);
});

test("skill router cannot select skills outside the approved candidates", async () => {
  const result = await runSkillRouter(
    { select: async () => ["approved-skill", "unapproved-skill"] },
    { requestId: "request-1", summary: "Specialized task" },
    [{ name: "approved-skill", source: "global", selected: true, relevant: false }],
  );
  assert.deepEqual(result.skills.map((skill) => skill.name), ["approved-skill"]);
  assert.equal(result.diagnostics[0]?.code, "SKILL_NOT_APPROVED");
});

test("skill router failures return no skills and a structured diagnostic", async () => {
  const result = await runSkillRouter(
    { select: async () => { throw new Error("router unavailable"); } },
    { requestId: "request-1", summary: "Specialized task" },
    [{ name: "approved-skill", source: "global", selected: true, relevant: false }],
  );
  assert.deepEqual(result.skills, []);
  assert.equal(result.diagnostics[0]?.code, "SKILL_ROUTER_FAILED");
});

test("planning waiver is accepted only with an explicit reason", async () => {
  const { input } = await fixture("06-explicit-lighter-process.json");
  const { lighterProcessReason: _omittedReason, ...requestWithoutReason } = input.request;
  const missingReason = evaluateBehavior({
    ...input,
    request: requestWithoutReason,
  });
  assert.equal(missingReason.phase, "planning");
  assert.equal(missingReason.overrides, undefined);
  assert.equal(missingReason.diagnostics[0]?.code, "PLANNING_REQUIRED");
});

test("host execution events produce evidence only after successful real events", async () => {
  let events: HostExecutionEvent[] = [];
  events = recordEvent(events, hostEvent(1, {
    type: "validation.recorded",
    outcome: "failed",
    exitCode: 1,
    evidenceKind: "validation",
  }));
  events = recordEvent(events, hostEvent(2, {
    type: "validation.recorded",
    outcome: "succeeded",
    exitCode: 0,
    evidenceKind: "validation",
  }));
  assert.deepEqual(evidenceFromEvents(events).map((item) => item.id), ["host-2"]);
  assert.throws(() => claimEventEvidence(events, "invented", "validation"), /unknown host event/);
  assert.throws(() => claimEventEvidence(events, "host-1", "validation"), /did not succeed/);
});

test("completion evaluation keeps hard criteria outstanding until evidence exists", async () => {
  const { expected: plan } = await fixture("07-planning-evidence-allows-execution.json");
  const implementation = hostEvent(1, {
    type: "workspace.mutated",
    evidenceKind: "implementation",
  });
  const validation = hostEvent(2, {
    type: "validation.recorded",
    evidenceKind: "validation",
    exitCode: 0,
  });
  const events = recordEvent(recordEvent([], implementation), validation);
  const before = evaluateCompletion(plan, []);
  const after = evaluateCompletion(plan, evidenceFromEvents(events));
  assert.equal(before.satisfied, false);
  assert.deepEqual(before.outstanding.map((criterion) => criterion.id), [
    "implementation-accounted-for",
    "validation-evidence",
  ]);
  assert.equal(after.satisfied, true);
  assert.deepEqual(after.outstanding, []);
});

test("read-only requests complete without mutation or validation evidence", async () => {
  const { input } = await fixture("12-configured-read-only-request.json");
  const plan = evaluateBehavior({
    ...input,
    request: { ...input.request, implementationFinished: true },
  });
  const completion = evaluateCompletion(plan, []);
  assert.equal(plan.phase, "completion");
  assert.equal(plan.canComplete, true);
  assert.deepEqual(
    plan.completionCriteria
      .filter((criterion) => criterion.hard)
      .map((criterion) => [criterion.id, criterion.status]),
    [
      ["gates-satisfied", "satisfied"],
      ["implementation-accounted-for", "not-applicable"],
      ["validation-evidence", "not-applicable"],
    ],
  );
  assert.equal(completion.satisfied, true);
  assert.deepEqual(completion.outstanding, []);
});
