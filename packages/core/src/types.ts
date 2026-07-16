export const PROTOCOL_VERSION = "1.0" as const;
export const CONFIG_VERSION = 1 as const;

export const PHASES = [
  "discovery",
  "classification",
  "setup",
  "planning",
  "execution",
  "verification",
  "completion",
  "blocked",
  "aborted",
] as const;
export type Phase = (typeof PHASES)[number];

export const CLASSIFICATIONS = ["trivial", "non-trivial", "uncertain"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];
export type EffectiveClassification = Exclude<Classification, "uncertain">;
export type ClassificationSource = "model" | "heuristic" | "human";

export const CAPABILITIES = [
  "repository:read",
  "instructions:read",
  "skills:read",
  "workspace:setup-write",
  "workspace:plan-write",
  "workspace:mutate",
  "commands:execute",
  "subagents:invoke",
  "external:mutate",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

export type GateId = "setup" | "planning" | "verification";
export type GateStatus =
  | "pending"
  | "required"
  | "satisfied"
  | "waived"
  | "not-applicable"
  | "blocked";
export type CompletionStatus = "pending" | "satisfied" | "waived" | "not-applicable";
export type EvidenceKind =
  | "setup"
  | "planning"
  | "implementation"
  | "validation"
  | "documentation"
  | "assumption"
  | "learning";

export const REASON_CODES = [
  "CONFIGURATION_PRESENT",
  "UNCONFIGURED_TRIVIAL_ALLOWED",
  "SETUP_REQUIRED",
  "TASK_TRIVIAL",
  "TASK_NON_TRIVIAL",
  "CLASSIFICATION_UNCERTAIN",
  "PLANNING_REQUIRED",
  "PLANNING_SATISFIED",
  "PLANNING_WAIVED_BY_USER",
  "VALIDATION_REQUIRED",
  "COMPLETION_CRITERIA_SATISFIED",
  "PROTOCOL_VERSION_INCOMPATIBLE",
  "REPEATED_CORRECTION",
] as const;
export type ReasonCode = (typeof REASON_CODES)[number];

export const EVENT_TYPES = [
  "session.started",
  "repository.discovered",
  "classification.completed",
  "setup.satisfied",
  "planning.satisfied",
  "planning.waived",
  "implementation.finished",
  "verification.satisfied",
  "verification.failed",
  "configuration.incompatible",
  "user.refused",
  "turn.aborted",
  "external.blocked",
  "learning.candidate-recorded",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface Diagnostic {
  code: ReasonCode;
  severity: "info" | "warning" | "error";
  message?: string;
}

export interface ClassificationDecision {
  value: Classification;
  source: ClassificationSource;
  reasons: string[];
}

export interface RepositorySnapshot {
  configured: boolean;
  configVersion: number | null;
  protocolCompatibility: "compatible" | "incompatible" | "unknown";
  instructionFiles: string[];
  setupEvidence: boolean;
  planningEvidence: boolean;
  planningGate: "non-trivial" | "always" | "disabled";
}

export interface BehaviorRequest {
  summary?: string;
  classification: ClassificationDecision;
  explicitOnboarding: boolean;
  explicitLighterProcess: boolean;
  lighterProcessReason?: string;
  implementationFinished: boolean;
}

export interface AvailableSkill {
  name: string;
  source: "global" | "project";
  selected: boolean;
  relevant: boolean;
}

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  valid: boolean;
  reasonCode?: ReasonCode;
}

export interface LearningSignal {
  reasonCode: "REPEATED_CORRECTION";
  evidenceIds: string[];
}

export interface GateDecision {
  id: GateId;
  status: GateStatus;
  reasonCode: ReasonCode;
  evidenceIds?: string[];
}

export interface SkillReference {
  name: string;
  required: boolean;
  reasonCode: ReasonCode;
}

export type CompletionCriterionId =
  | "gates-satisfied"
  | "implementation-accounted-for"
  | "validation-evidence"
  | "documentation-aligned"
  | "assumptions-reported"
  | "learning-reviewed";

export interface CompletionCriterion {
  id: CompletionCriterionId;
  status: CompletionStatus;
  hard: boolean;
  evidenceIds?: string[];
}

export interface BehaviorOverride {
  gate: "planning";
  source: "user";
  reasonCode: "PLANNING_WAIVED_BY_USER";
  reason: string;
}

export interface LearningAction {
  target: "AGENTS.md";
  reasonCode: "REPEATED_CORRECTION";
  status: "proposed";
  evidenceIds: string[];
}

export interface BehaviorPlan {
  protocolVersion: typeof PROTOCOL_VERSION;
  requestId: string;
  phase: Phase;
  effectiveClassification: EffectiveClassification;
  requiredGates: GateDecision[];
  selectedSkills: SkillReference[];
  requestedCapabilities: Capability[];
  completionCriteria: CompletionCriterion[];
  canComplete: boolean;
  reasons: ReasonCode[];
  diagnostics: Diagnostic[];
  overrides?: BehaviorOverride[];
  learningActions?: LearningAction[];
}

export interface BehaviorState {
  protocolVersion: typeof PROTOCOL_VERSION;
  sessionId: string;
  requestId: string;
  phase: Phase;
  sequence: number;
  effectiveClassification?: EffectiveClassification;
  gates: GateDecision[];
  selectedSkills: SkillReference[];
  evidenceIds: string[];
  lastEventId?: string;
  blockedReason?: ReasonCode;
}

export interface BehaviorEvent {
  protocolVersion: typeof PROTOCOL_VERSION;
  id: string;
  sessionId: string;
  requestId: string;
  sequence: number;
  type: EventType;
  source: "host" | "model" | "user";
  fromPhase: Phase;
  toPhase: Phase;
  reasonCode?: ReasonCode;
  evidenceIds?: string[];
  occurredAt?: string;
}

export interface BehaviorInput {
  protocolVersion: typeof PROTOCOL_VERSION;
  requestId: string;
  repository: RepositorySnapshot;
  request: BehaviorRequest;
  availableSkills: AvailableSkill[];
  hostCapabilities: Capability[];
  evidence: Evidence[];
  state?: BehaviorState;
  learningSignals?: LearningSignal[];
}

export interface ProjectSkillSelection {
  name: string;
  trigger: string;
}

export interface ProjectConfig {
  version: typeof CONFIG_VERSION;
  agents: string[];
  project_skills_dir: string;
  selected_skills: ProjectSkillSelection[];
  workflow: {
    planning_gate: RepositorySnapshot["planningGate"];
    iteration_directory: string;
    fix_directory: string;
    local_workspaces_gitignored: boolean;
  };
}

export interface PhaseDefinition {
  id: Phase;
  terminal: boolean;
  requestedCapabilities: readonly Capability[];
}

export interface TransitionDefinition {
  from: readonly Phase[];
  event: EventType;
  to: Phase;
  guards: readonly string[];
}

export interface ProtocolDefinition {
  id: "agentic-swe";
  protocolVersion: typeof PROTOCOL_VERSION;
  configVersion: typeof CONFIG_VERSION;
  phases: readonly PhaseDefinition[];
  transitions: readonly TransitionDefinition[];
}
