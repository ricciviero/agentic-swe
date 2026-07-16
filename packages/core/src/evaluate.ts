import { getPhaseDefinition } from "./protocol.js";
import {
  CONFIG_VERSION,
  PROTOCOL_VERSION,
  type BehaviorInput,
  type BehaviorPlan,
  type CompletionCriterion,
  type Diagnostic,
  type EvidenceKind,
  type GateDecision,
  type Phase,
  type ReasonCode,
  type SkillReference,
} from "./types.js";

function withEvidence<T extends object>(
  value: T,
  evidenceIds: string[],
): T & { evidenceIds?: string[] } {
  return (evidenceIds.length === 0 ? value : { ...value, evidenceIds }) as T & {
    evidenceIds?: string[];
  };
}

function validEvidenceIds(input: BehaviorInput, kind: EvidenceKind): string[] {
  return input.evidence
    .filter((evidence) => evidence.kind === kind && evidence.valid)
    .map((evidence) => evidence.id);
}

function uniqueReasons(reasons: ReasonCode[]): ReasonCode[] {
  return [...new Set(reasons)];
}

function hasRequiredSkill(input: BehaviorInput, name: string): boolean {
  return input.availableSkills.some(
    (skill) => skill.name === name && skill.selected && skill.relevant,
  );
}

function requiredSkill(
  input: BehaviorInput,
  name: string,
  reasonCode: ReasonCode,
  diagnostics: Diagnostic[],
): SkillReference[] {
  if (hasRequiredSkill(input, name)) return [{ name, required: true, reasonCode }];
  diagnostics.push({
    code: reasonCode,
    severity: "error",
    message: `Required workflow skill is unavailable or not approved: ${name}`,
  });
  return [];
}

function blockedPlan(input: BehaviorInput): BehaviorPlan {
  const blockedGate = (id: GateDecision["id"]): GateDecision => ({
    id,
    status: "blocked",
    reasonCode: "PROTOCOL_VERSION_INCOMPATIBLE",
  });
  return {
    protocolVersion: PROTOCOL_VERSION,
    requestId: input.requestId,
    phase: "blocked",
    effectiveClassification:
      input.request.classification.value === "trivial" ? "trivial" : "non-trivial",
    requiredGates: [blockedGate("setup"), blockedGate("planning"), blockedGate("verification")],
    selectedSkills: [],
    requestedCapabilities: [...getPhaseDefinition("blocked").requestedCapabilities],
    completionCriteria: [
      { id: "gates-satisfied", status: "pending", hard: true },
      { id: "implementation-accounted-for", status: "pending", hard: true },
      { id: "validation-evidence", status: "pending", hard: true },
      { id: "documentation-aligned", status: "pending", hard: false },
      { id: "assumptions-reported", status: "pending", hard: false },
      { id: "learning-reviewed", status: "pending", hard: false },
    ],
    canComplete: false,
    reasons: ["PROTOCOL_VERSION_INCOMPATIBLE"],
    diagnostics: [{ code: "PROTOCOL_VERSION_INCOMPATIBLE", severity: "error" }],
  };
}

export function evaluateBehavior(input: BehaviorInput): BehaviorPlan {
  const incompatible =
    input.protocolVersion !== PROTOCOL_VERSION ||
    input.repository.protocolCompatibility === "incompatible" ||
    (input.repository.configVersion !== null && input.repository.configVersion !== CONFIG_VERSION);
  if (incompatible) return blockedPlan(input);

  const diagnostics: Diagnostic[] = [];
  const reasons: ReasonCode[] = [];
  const originalClassification = input.request.classification.value;
  const effectiveClassification =
    originalClassification === "trivial" ? "trivial" : "non-trivial";
  const classificationReason: ReasonCode =
    originalClassification === "uncertain"
      ? "CLASSIFICATION_UNCERTAIN"
      : effectiveClassification === "trivial"
        ? "TASK_TRIVIAL"
        : "TASK_NON_TRIVIAL";

  if (input.repository.configured && input.state === undefined) reasons.push("CONFIGURATION_PRESENT");
  if (!input.repository.configured && effectiveClassification === "trivial") {
    reasons.push("UNCONFIGURED_TRIVIAL_ALLOWED");
  }
  reasons.push(classificationReason);
  if (originalClassification === "uncertain") {
    diagnostics.push({ code: "CLASSIFICATION_UNCERTAIN", severity: "warning" });
  }

  const setupRequired =
    !input.repository.configured &&
    (input.request.explicitOnboarding || effectiveClassification === "non-trivial");
  let setupGate: GateDecision;
  if (input.repository.configured) {
    setupGate = { id: "setup", status: "satisfied", reasonCode: "CONFIGURATION_PRESENT" };
  } else if (setupRequired) {
    setupGate = { id: "setup", status: "required", reasonCode: "SETUP_REQUIRED" };
    reasons.push("SETUP_REQUIRED");
  } else {
    setupGate = {
      id: "setup",
      status: "not-applicable",
      reasonCode: "UNCONFIGURED_TRIVIAL_ALLOWED",
    };
  }

  const planningEvidenceIds = validEvidenceIds(input, "planning");
  const planningPolicyApplies =
    effectiveClassification === "non-trivial" && input.repository.planningGate !== "disabled";
  const waiverReason = input.request.lighterProcessReason?.trim();
  let planningGate: GateDecision;
  if (!planningPolicyApplies) {
    planningGate = {
      id: "planning",
      status: "not-applicable",
      reasonCode: effectiveClassification === "trivial" ? "TASK_TRIVIAL" : "TASK_NON_TRIVIAL",
    };
  } else if (input.request.explicitLighterProcess && waiverReason) {
    planningGate = {
      id: "planning",
      status: "waived",
      reasonCode: "PLANNING_WAIVED_BY_USER",
    };
    reasons.push("PLANNING_WAIVED_BY_USER");
  } else if (input.repository.planningEvidence && planningEvidenceIds.length > 0) {
    planningGate = withEvidence(
      { id: "planning", status: "satisfied", reasonCode: "PLANNING_SATISFIED" },
      planningEvidenceIds,
    );
    reasons.push("PLANNING_SATISFIED");
  } else {
    planningGate = {
      id: "planning",
      status: setupRequired ? "pending" : "required",
      reasonCode: "PLANNING_REQUIRED",
    };
    reasons.push("PLANNING_REQUIRED");
    if (input.request.explicitLighterProcess && !waiverReason) {
      diagnostics.push({
        code: "PLANNING_REQUIRED",
        severity: "error",
        message: "A planning waiver requires an explicit non-empty user reason.",
      });
    }
  }

  const implementationEvidenceIds = validEvidenceIds(input, "implementation");
  const validationEvidenceIds = validEvidenceIds(input, "validation");
  const documentationEvidenceIds = validEvidenceIds(input, "documentation");
  const assumptionEvidenceIds = validEvidenceIds(input, "assumption");
  const setupEvidenceIds = validEvidenceIds(input, "setup");
  const workflowGatesSatisfied =
    [setupGate, planningGate].every((gate) =>
      ["satisfied", "waived", "not-applicable"].includes(gate.status),
    );
  const implementationSatisfied =
    input.request.implementationFinished && implementationEvidenceIds.length > 0;
  const validationSatisfied =
    input.request.implementationFinished && validationEvidenceIds.length > 0;
  const hardCriteriaSatisfied =
    workflowGatesSatisfied && implementationSatisfied && validationSatisfied;

  let verificationGate: GateDecision;
  if (!input.request.implementationFinished) {
    verificationGate = { id: "verification", status: "pending", reasonCode: "VALIDATION_REQUIRED" };
  } else if (hardCriteriaSatisfied) {
    verificationGate = withEvidence(
      {
        id: "verification",
        status: "satisfied",
        reasonCode: "COMPLETION_CRITERIA_SATISFIED",
      },
      validationEvidenceIds,
    );
    reasons.push("COMPLETION_CRITERIA_SATISFIED");
  } else {
    verificationGate = { id: "verification", status: "required", reasonCode: "VALIDATION_REQUIRED" };
    reasons.push("VALIDATION_REQUIRED");
  }

  let phase: Phase;
  if (setupGate.status === "required") phase = "setup";
  else if (planningGate.status === "required") phase = "planning";
  else if (input.request.implementationFinished) {
    phase = hardCriteriaSatisfied ? "completion" : "verification";
  } else phase = "execution";

  const learningEvidenceIds = (input.learningSignals ?? []).flatMap((signal) => {
    if (signal.reasonCode !== "REPEATED_CORRECTION") return [];
    const validIds = signal.evidenceIds.filter((id) =>
      input.evidence.some(
        (evidence) =>
          evidence.id === id &&
          evidence.valid &&
          evidence.kind === "learning" &&
          evidence.reasonCode === "REPEATED_CORRECTION",
      ),
    );
    return validIds.length >= 2 ? validIds : [];
  });
  const uniqueLearningEvidenceIds = [...new Set(learningEvidenceIds)];
  const learningSatisfied = uniqueLearningEvidenceIds.length >= 2;

  const gateEvidenceIds = [...setupEvidenceIds, ...planningEvidenceIds];
  const completionCriteria: CompletionCriterion[] = [
    withEvidence(
      {
        id: "gates-satisfied",
        status: workflowGatesSatisfied ? "satisfied" : "pending",
        hard: true,
      },
      workflowGatesSatisfied ? gateEvidenceIds : [],
    ),
    withEvidence(
      {
        id: "implementation-accounted-for",
        status: implementationSatisfied ? "satisfied" : "pending",
        hard: true,
      },
      implementationSatisfied ? implementationEvidenceIds : [],
    ),
    withEvidence(
      {
        id: "validation-evidence",
        status: validationSatisfied ? "satisfied" : "pending",
        hard: true,
      },
      validationSatisfied ? validationEvidenceIds : [],
    ),
    withEvidence(
      {
        id: "documentation-aligned",
        status:
          documentationEvidenceIds.length > 0
            ? "satisfied"
            : input.request.implementationFinished
              ? "not-applicable"
              : "pending",
        hard: false,
      },
      documentationEvidenceIds,
    ),
    withEvidence(
      {
        id: "assumptions-reported",
        status:
          assumptionEvidenceIds.length > 0
            ? "satisfied"
            : input.request.implementationFinished
              ? "not-applicable"
              : "pending",
        hard: false,
      },
      assumptionEvidenceIds,
    ),
    withEvidence(
      {
        id: "learning-reviewed",
        status: learningSatisfied
          ? "satisfied"
          : phase === "completion"
            ? "not-applicable"
            : "pending",
        hard: false,
      },
      learningSatisfied ? uniqueLearningEvidenceIds : [],
    ),
  ];

  const selectedSkills: SkillReference[] = [];
  if (setupGate.status === "required") {
    selectedSkills.push(...requiredSkill(input, "agents-setup", "SETUP_REQUIRED", diagnostics));
  } else if (planningGate.status === "required") {
    selectedSkills.push(
      ...requiredSkill(input, "iterations-planner", "PLANNING_REQUIRED", diagnostics),
    );
  } else if (phase === "execution") {
    for (const skill of input.availableSkills) {
      if (
        skill.selected &&
        skill.relevant &&
        skill.name !== "agents-setup" &&
        skill.name !== "iterations-planner"
      ) {
        selectedSkills.push({ name: skill.name, required: false, reasonCode: classificationReason });
      }
    }
  }

  const plan: BehaviorPlan = {
    protocolVersion: PROTOCOL_VERSION,
    requestId: input.requestId,
    phase,
    effectiveClassification,
    requiredGates: [setupGate, planningGate, verificationGate],
    selectedSkills,
    requestedCapabilities: [...getPhaseDefinition(phase).requestedCapabilities],
    completionCriteria,
    canComplete: phase === "completion" && hardCriteriaSatisfied,
    reasons: uniqueReasons(reasons),
    diagnostics,
  };
  if (planningGate.status === "waived" && waiverReason) {
    plan.overrides = [{
      gate: "planning",
      source: "user",
      reasonCode: "PLANNING_WAIVED_BY_USER",
      reason: waiverReason,
    }];
  }
  if (learningSatisfied) {
    plan.reasons.push("REPEATED_CORRECTION");
    plan.learningActions = [{
      target: "AGENTS.md",
      reasonCode: "REPEATED_CORRECTION",
      status: "proposed",
      evidenceIds: uniqueLearningEvidenceIds,
    }];
  }
  return plan;
}
