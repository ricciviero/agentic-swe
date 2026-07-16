import type {
  AvailableSkill,
  BehaviorInput,
  BehaviorPlan,
  Capability,
  ClassificationDecision,
  Evidence,
  LearningSignal,
  ProjectConfig,
  RuntimeDiagnostic,
  SkillRouter,
  TaskClassifier,
} from "@agentic-swe/core";

export type NodeDiagnosticCode =
  | "REPOSITORY_NOT_FOUND"
  | "PATH_OUTSIDE_REPOSITORY"
  | "CONFIG_PARSE_FAILED"
  | "CONFIG_INVALID"
  | "CONFIG_VERSION_INCOMPATIBLE"
  | "INSTRUCTION_UNREADABLE"
  | "SKILL_DIRECTORY_UNREADABLE"
  | "PLANNING_RECORD_INVALID";

export interface NodeDiagnostic {
  code: NodeDiagnosticCode;
  severity: "warning" | "error";
  message: string;
  path?: string;
}

export interface ProjectConfigResult {
  status: "missing" | "valid" | "invalid" | "incompatible";
  config: ProjectConfig | null;
  configVersion: number | null;
  diagnostics: NodeDiagnostic[];
}

export interface RepositoryInspection {
  root: string;
  config: ProjectConfigResult;
  instructionFiles: string[];
  availableSkills: AvailableSkill[];
  setupEvidence: boolean;
  planningEvidence: boolean;
  evidence: Evidence[];
  diagnostics: NodeDiagnostic[];
}

export interface InspectRepositoryOptions {
  startPath?: string;
  globalSkillDirectories?: string[];
  relevantSkills?: string[];
  planningRecord?: string;
}

export interface NodeRuntimeOptions {
  startPath?: string;
  globalSkillDirectories?: string[];
  classifier?: TaskClassifier;
  skillRouter?: SkillRouter;
  portTimeoutMs?: number;
}

export interface NodeEvaluationRequest {
  requestId: string;
  summary: string;
  classification?: ClassificationDecision;
  explicitOnboarding?: boolean;
  explicitLighterProcess?: boolean;
  lighterProcessReason?: string;
  implementationFinished?: boolean;
  planningRecord?: string;
  relevantSkills?: string[];
  hostCapabilities?: Capability[];
  userModeCapabilities?: Capability[];
  evidence?: Evidence[];
  state?: BehaviorInput["state"];
  learningSignals?: LearningSignal[];
}

export interface NodeEvaluationResult {
  inspection: RepositoryInspection;
  input: BehaviorInput;
  plan: BehaviorPlan;
  effectiveCapabilities: Capability[];
  diagnostics: Array<NodeDiagnostic | RuntimeDiagnostic>;
}

export interface NodeRuntime {
  inspect(options?: Omit<InspectRepositoryOptions, "startPath" | "globalSkillDirectories">): Promise<RepositoryInspection>;
  evaluate(request: NodeEvaluationRequest, signal?: AbortSignal): Promise<NodeEvaluationResult>;
}
