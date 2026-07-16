import { protocolV1 } from "./protocol.js";
import {
  PROTOCOL_VERSION,
  type BehaviorEvent,
  type BehaviorState,
  type Phase,
} from "./types.js";

export type TransitionErrorCode =
  | "EVENT_VERSION_MISMATCH"
  | "EVENT_SESSION_MISMATCH"
  | "EVENT_REQUEST_MISMATCH"
  | "EVENT_SEQUENCE_MISMATCH"
  | "EVENT_PHASE_MISMATCH"
  | "ILLEGAL_TRANSITION"
  | "UNSATISFIED_GUARD";

export class TransitionError extends Error {
  override readonly name = "TransitionError";

  constructor(
    readonly code: TransitionErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export function createBehaviorState(
  sessionId: string,
  requestId: string,
  phase: Phase = "discovery",
): BehaviorState {
  if (!sessionId || !requestId) throw new TypeError("Session and request identifiers are required.");
  return {
    protocolVersion: PROTOCOL_VERSION,
    sessionId,
    requestId,
    phase,
    sequence: 0,
    gates: [],
    selectedSkills: [],
    evidenceIds: [],
  };
}

export function applyBehaviorEvent(
  state: BehaviorState,
  event: BehaviorEvent,
  satisfiedGuards: readonly string[] = [],
): BehaviorState {
  if (event.protocolVersion !== PROTOCOL_VERSION) {
    throw new TransitionError("EVENT_VERSION_MISMATCH", "Event protocol version is incompatible.");
  }
  if (event.sessionId !== state.sessionId) {
    throw new TransitionError("EVENT_SESSION_MISMATCH", "Event belongs to another session.");
  }
  if (event.requestId !== state.requestId) {
    throw new TransitionError("EVENT_REQUEST_MISMATCH", "Event belongs to another request.");
  }
  if (event.sequence !== state.sequence + 1) {
    throw new TransitionError("EVENT_SEQUENCE_MISMATCH", "Event sequence is not contiguous.");
  }
  if (event.fromPhase !== state.phase) {
    throw new TransitionError("EVENT_PHASE_MISMATCH", "Event source phase does not match current state.");
  }

  const transition = protocolV1.transitions.find(
    (candidate) =>
      candidate.from.includes(state.phase) &&
      candidate.event === event.type &&
      candidate.to === event.toPhase,
  );
  if (!transition) {
    throw new TransitionError(
      "ILLEGAL_TRANSITION",
      `Illegal Agentic SWE transition: ${state.phase} --${event.type}--> ${event.toPhase}`,
    );
  }
  const guards = new Set(satisfiedGuards);
  const missingGuard = transition.guards.find((guard) => !guards.has(guard));
  if (missingGuard) {
    throw new TransitionError("UNSATISFIED_GUARD", `Transition guard is not satisfied: ${missingGuard}`);
  }

  const evidenceIds = [...new Set([...state.evidenceIds, ...(event.evidenceIds ?? [])])];
  const next: BehaviorState = {
    ...state,
    phase: event.toPhase,
    sequence: event.sequence,
    evidenceIds,
    lastEventId: event.id,
  };
  if (event.toPhase === "blocked" && event.reasonCode) next.blockedReason = event.reasonCode;
  return next;
}
