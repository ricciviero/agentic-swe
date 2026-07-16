import {
  PHASES,
  PROTOCOL_VERSION,
  REASON_CODES,
  type BehaviorState,
  type Phase,
  type ReasonCode,
} from "./types.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])]),
  );
}

export function assertBehaviorState(value: unknown): asserts value is BehaviorState {
  if (!isRecord(value)) throw new TypeError("Behavior state must be an object.");
  if (value.protocolVersion !== PROTOCOL_VERSION) {
    throw new TypeError("Behavior state protocol version is incompatible.");
  }
  if (typeof value.sessionId !== "string" || value.sessionId.length === 0) {
    throw new TypeError("Behavior state sessionId is invalid.");
  }
  if (typeof value.requestId !== "string" || value.requestId.length === 0) {
    throw new TypeError("Behavior state requestId is invalid.");
  }
  if (typeof value.phase !== "string" || !(PHASES as readonly string[]).includes(value.phase)) {
    throw new TypeError("Behavior state phase is invalid.");
  }
  if (!Number.isInteger(value.sequence) || (value.sequence as number) < 0) {
    throw new TypeError("Behavior state sequence is invalid.");
  }
  if (!Array.isArray(value.gates) || !Array.isArray(value.selectedSkills)) {
    throw new TypeError("Behavior state gate/skill collections are invalid.");
  }
  if (
    !Array.isArray(value.evidenceIds) ||
    !value.evidenceIds.every((id) => typeof id === "string" && id.length > 0)
  ) {
    throw new TypeError("Behavior state evidence identifiers are invalid.");
  }
  if (
    value.blockedReason !== undefined &&
    (typeof value.blockedReason !== "string" ||
      !(REASON_CODES as readonly string[]).includes(value.blockedReason))
  ) {
    throw new TypeError("Behavior state blocked reason is invalid.");
  }
}

export function serializeBehaviorState(state: BehaviorState): string {
  assertBehaviorState(state);
  return JSON.stringify(canonicalize(state));
}

export function restoreBehaviorState(serialized: string): BehaviorState {
  let value: unknown;
  try {
    value = JSON.parse(serialized) as unknown;
  } catch (error) {
    throw new TypeError(`Behavior state is not valid JSON: ${String(error)}`);
  }
  assertBehaviorState(value);
  return value;
}

export function isPhase(value: string): value is Phase {
  return (PHASES as readonly string[]).includes(value);
}

export function isReasonCode(value: string): value is ReasonCode {
  return (REASON_CODES as readonly string[]).includes(value);
}
