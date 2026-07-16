import { PROTOCOL_VERSION } from "./types.js";
import type {
  BehaviorPlan,
  Capability,
  CompletionCriterion,
  Evidence,
  EvidenceKind,
} from "./types.js";

export const HOST_EVENT_TYPES = [
  "tool.requested",
  "tool.allowed",
  "tool.denied",
  "tool.refused",
  "tool.completed",
  "tool.failed",
  "workspace.mutated",
  "validation.recorded",
  "documentation.recorded",
  "gate.satisfied",
  "turn.aborted",
  "completion.requested",
] as const;

export type HostEventType = (typeof HOST_EVENT_TYPES)[number];
export type HostEventOutcome = "pending" | "succeeded" | "failed" | "denied" | "refused" | "aborted";

/**
 * A host-owned execution record. Subject and metadata must already be redacted;
 * the protocol core deliberately never receives command output or file content.
 */
export interface HostExecutionEvent {
  schemaVersion: 1;
  protocolVersion: typeof PROTOCOL_VERSION;
  id: string;
  sessionId: string;
  requestId: string;
  turnNumber: number;
  sequence: number;
  type: HostEventType;
  outcome: HostEventOutcome;
  occurredAt: string;
  capability?: Capability;
  subject?: string;
  exitCode?: number;
  evidenceKind?: EvidenceKind;
}

export interface CompletionEvaluation {
  satisfied: boolean;
  criteria: CompletionCriterion[];
  outstanding: CompletionCriterion[];
}

const eventTypeSet = new Set<string>(HOST_EVENT_TYPES);
const evidenceEventTypes: Partial<Record<EvidenceKind, readonly HostEventType[]>> = {
  setup: ["workspace.mutated", "gate.satisfied"],
  planning: ["workspace.mutated", "gate.satisfied"],
  implementation: ["workspace.mutated", "tool.completed"],
  validation: ["validation.recorded"],
  documentation: ["documentation.recorded", "workspace.mutated"],
  assumption: ["completion.requested"],
  learning: ["completion.requested"],
};

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) throw new TypeError(`${field} must be non-empty`);
}

export function recordEvent(
  events: readonly HostExecutionEvent[],
  event: HostExecutionEvent,
): HostExecutionEvent[] {
  if (event.schemaVersion !== 1) throw new TypeError("host event schema version is incompatible");
  if (event.protocolVersion !== PROTOCOL_VERSION) throw new TypeError("host event protocol version is incompatible");
  if (!eventTypeSet.has(event.type)) throw new TypeError(`unsupported host event type: ${event.type}`);
  assertNonEmpty(event.id, "event.id");
  assertNonEmpty(event.sessionId, "event.sessionId");
  assertNonEmpty(event.requestId, "event.requestId");
  if (!Number.isInteger(event.turnNumber) || event.turnNumber < 1) throw new TypeError("event.turnNumber must be positive");
  if (!Number.isInteger(event.sequence) || event.sequence !== events.length + 1) {
    throw new TypeError("host event sequence must be contiguous");
  }
  if (events.some((existing) => existing.id === event.id)) throw new TypeError(`duplicate host event id: ${event.id}`);
  if (events.some((existing) => existing.sessionId !== event.sessionId)) throw new TypeError("host event session mismatch");
  if (event.evidenceKind) {
    const allowed = evidenceEventTypes[event.evidenceKind] ?? [];
    if (!allowed.includes(event.type)) {
      throw new TypeError(`${event.type} cannot establish ${event.evidenceKind} evidence`);
    }
  }
  return [...events, Object.freeze({ ...event })];
}

/** Only successful, existing events can become evidence. */
export function evidenceFromEvents(events: readonly HostExecutionEvent[]): Evidence[] {
  return events.flatMap((event) => {
    if (event.outcome !== "succeeded" || !event.evidenceKind) return [];
    const allowed = evidenceEventTypes[event.evidenceKind] ?? [];
    if (!allowed.includes(event.type)) return [];
    return [{ id: event.id, kind: event.evidenceKind, valid: true } satisfies Evidence];
  });
}

export function claimEventEvidence(
  events: readonly HostExecutionEvent[],
  eventId: string,
  kind: EvidenceKind,
): Evidence {
  const event = events.find((candidate) => candidate.id === eventId);
  if (!event) throw new TypeError(`unknown host event id: ${eventId}`);
  if (event.outcome !== "succeeded") throw new TypeError(`host event did not succeed: ${eventId}`);
  const allowed = evidenceEventTypes[kind] ?? [];
  if (!allowed.includes(event.type)) throw new TypeError(`${event.type} cannot establish ${kind} evidence`);
  return { id: event.id, kind, valid: true };
}

function evidenceIds(evidence: readonly Evidence[], kind: EvidenceKind): string[] {
  return evidence
    .filter((item) => item.valid && item.kind === kind)
    .map((item) => item.id);
}

/** Reconciles completion criteria against host-verifiable evidence without I/O. */
export function evaluateCompletion(
  plan: BehaviorPlan,
  evidence: readonly Evidence[],
): CompletionEvaluation {
  const gatesSatisfied = plan.requiredGates
    .filter((gate) => gate.id !== "verification")
    .every((gate) => ["satisfied", "waived", "not-applicable"].includes(gate.status));
  const implementation = evidenceIds(evidence, "implementation");
  const validation = evidenceIds(evidence, "validation");
  const documentation = evidenceIds(evidence, "documentation");
  const assumptions = evidenceIds(evidence, "assumption");
  const learning = evidenceIds(evidence, "learning");
  const updated = plan.completionCriteria.map((criterion): CompletionCriterion => {
    if (criterion.status === "not-applicable" || criterion.status === "waived") {
      return criterion;
    }
    const { evidenceIds: _previousEvidenceIds, ...baseCriterion } = criterion;
    let ids: string[] = [];
    let satisfied = false;
    if (criterion.id === "gates-satisfied") satisfied = gatesSatisfied;
    else if (criterion.id === "implementation-accounted-for") {
      ids = implementation;
      satisfied = ids.length > 0;
    } else if (criterion.id === "validation-evidence") {
      ids = validation;
      satisfied = ids.length > 0;
    } else if (criterion.id === "documentation-aligned") {
      ids = documentation;
      satisfied = ids.length > 0;
    } else if (criterion.id === "assumptions-reported") {
      ids = assumptions;
      satisfied = ids.length > 0;
    } else if (criterion.id === "learning-reviewed") {
      ids = learning;
      satisfied = ids.length > 0;
    }
    if (!satisfied) return { ...baseCriterion, status: "pending" };
    return ids.length > 0
      ? { ...baseCriterion, status: "satisfied", evidenceIds: ids }
      : { ...baseCriterion, status: "satisfied" };
  });
  const outstanding = updated.filter(
    (criterion) =>
      criterion.hard && !["satisfied", "waived", "not-applicable"].includes(criterion.status),
  );
  return { satisfied: outstanding.length === 0, criteria: updated, outstanding };
}

export function outstandingCriteria(
  plan: BehaviorPlan,
  evidence: readonly Evidence[],
): CompletionCriterion[] {
  return evaluateCompletion(plan, evidence).outstanding;
}
