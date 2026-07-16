import {
  embeddedProtocolV1,
  embeddedSchemasV1,
} from "./generated/protocol-v1.generated.js";
import {
  CAPABILITIES,
  CONFIG_VERSION,
  EVENT_TYPES,
  PHASES,
  PROTOCOL_VERSION,
  type Capability,
  type EventType,
  type Phase,
  type ProtocolDefinition,
} from "./types.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.isFrozen(value) ? value : Object.freeze(value);
}

function assertStringArray<T extends string>(
  value: unknown,
  allowed: ReadonlySet<string>,
  label: string,
): T[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string" && allowed.has(item))) {
    throw new TypeError(`Invalid ${label} in embedded Agentic SWE protocol.`);
  }
  return [...new Set(value)] as T[];
}

function loadProtocol(value: unknown): ProtocolDefinition {
  if (!isRecord(value)) throw new TypeError("Embedded Agentic SWE protocol must be an object.");
  if (value.id !== "agentic-swe" || value.protocolVersion !== PROTOCOL_VERSION) {
    throw new TypeError("Embedded Agentic SWE protocol identity/version is invalid.");
  }
  if (value.configVersion !== CONFIG_VERSION) {
    throw new TypeError("Embedded Agentic SWE config version is invalid.");
  }

  const phaseSet = new Set<string>(PHASES);
  const capabilitySet = new Set<string>(CAPABILITIES);
  if (!Array.isArray(value.phases)) throw new TypeError("Embedded protocol phases are missing.");
  const phases = value.phases.map((entry): ProtocolDefinition["phases"][number] => {
    if (!isRecord(entry) || typeof entry.id !== "string" || !phaseSet.has(entry.id)) {
      throw new TypeError("Embedded protocol contains an invalid phase.");
    }
    if (typeof entry.terminal !== "boolean") {
      throw new TypeError(`Embedded phase ${entry.id} has no terminal flag.`);
    }
    return {
      id: entry.id as Phase,
      terminal: entry.terminal,
      requestedCapabilities: assertStringArray<Capability>(
        entry.requestedCapabilities,
        capabilitySet,
        `capabilities for phase ${entry.id}`,
      ),
    };
  });
  if (new Set(phases.map((phase) => phase.id)).size !== PHASES.length) {
    throw new TypeError("Embedded protocol phases are incomplete or duplicated.");
  }

  const eventSet = new Set<string>(EVENT_TYPES);
  if (!Array.isArray(value.transitions)) throw new TypeError("Embedded protocol transitions are missing.");
  const transitions = value.transitions.map((entry): ProtocolDefinition["transitions"][number] => {
    if (!isRecord(entry) || typeof entry.to !== "string" || !phaseSet.has(entry.to)) {
      throw new TypeError("Embedded protocol contains an invalid transition target.");
    }
    if (typeof entry.event !== "string" || !eventSet.has(entry.event)) {
      throw new TypeError("Embedded protocol contains an invalid transition event.");
    }
    return {
      from: assertStringArray<Phase>(entry.from, phaseSet, "transition source"),
      event: entry.event as EventType,
      to: entry.to as Phase,
      guards: assertStringArray<string>(
        entry.guards,
        new Set(Array.isArray(entry.guards) ? entry.guards.filter((item): item is string => typeof item === "string") : []),
        "transition guards",
      ),
    };
  });

  return deepFreeze({
    id: "agentic-swe",
    protocolVersion: PROTOCOL_VERSION,
    configVersion: CONFIG_VERSION,
    phases,
    transitions,
  });
}

export const protocolV1 = loadProtocol(embeddedProtocolV1);
export const protocolSchemasV1 = deepFreeze(embeddedSchemasV1);

export function getPhaseDefinition(phase: Phase): ProtocolDefinition["phases"][number] {
  const definition = protocolV1.phases.find((candidate) => candidate.id === phase);
  if (!definition) throw new RangeError(`Unknown Agentic SWE phase: ${phase}`);
  return definition;
}
