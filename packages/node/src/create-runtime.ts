import {
  PROTOCOL_VERSION,
  evaluateBehavior,
  intersectCapabilities,
  runSkillRouter,
  runTaskClassifier,
  type BehaviorInput,
  type Capability,
  type ClassificationDecision,
  type RuntimeDiagnostic,
} from "@agentic-swe/core";
import { inspectRepository } from "./inspect.js";
import type {
  NodeEvaluationRequest,
  NodeEvaluationResult,
  NodeRuntime,
  NodeRuntimeOptions,
} from "./types.js";

const defaultHostCapabilities: Capability[] = [
  "repository:read",
  "instructions:read",
  "skills:read",
];

function mergeEvidence<T extends { id: string }>(...groups: readonly T[][]): T[] {
  const values = new Map<string, T>();
  for (const group of groups) for (const value of group) values.set(value.id, value);
  return [...values.values()];
}

export function createNodeRuntime(options: NodeRuntimeOptions = {}): NodeRuntime {
  const baseInspectionOptions = {
    ...(options.startPath ? { startPath: options.startPath } : {}),
    ...(options.globalSkillDirectories
      ? { globalSkillDirectories: options.globalSkillDirectories }
      : {}),
  };

  return {
    async inspect(inspectOptions = {}) {
      return inspectRepository({ ...baseInspectionOptions, ...inspectOptions });
    },

    async evaluate(
      request: NodeEvaluationRequest,
      signal?: AbortSignal,
    ): Promise<NodeEvaluationResult> {
      const runtimeDiagnostics: RuntimeDiagnostic[] = [];
      let classification: ClassificationDecision;
      if (request.classification) classification = request.classification;
      else if (options.classifier) {
        const result = await runTaskClassifier(
          options.classifier,
          { requestId: request.requestId, summary: request.summary },
          signal,
          options.portTimeoutMs,
        );
        classification = result.classification;
        runtimeDiagnostics.push(...result.diagnostics);
      } else {
        classification = {
          value: "uncertain",
          source: "heuristic",
          reasons: ["No TaskClassifier port or explicit classification was provided."],
        };
        runtimeDiagnostics.push({
          code: "CLASSIFIER_FAILED",
          severity: "warning",
          message: "No TaskClassifier port or explicit classification was provided.",
        });
      }

      const inspection = await inspectRepository({
        ...baseInspectionOptions,
        ...(request.planningRecord ? { planningRecord: request.planningRecord } : {}),
        ...(request.relevantSkills ? { relevantSkills: request.relevantSkills } : {}),
      });
      if (options.skillRouter) {
        const routed = await runSkillRouter(
          options.skillRouter,
          { requestId: request.requestId, summary: request.summary },
          inspection.availableSkills,
          signal,
          options.portTimeoutMs,
        );
        const relevant = new Set(routed.skills.map((skill) => skill.name));
        inspection.availableSkills = inspection.availableSkills.map((skill) => ({
          ...skill,
          relevant: relevant.has(skill.name),
        }));
        runtimeDiagnostics.push(...routed.diagnostics);
      }

      const config = inspection.config.config;
      const hostCapabilities = request.hostCapabilities ?? defaultHostCapabilities;
      const behaviorRequest: BehaviorInput["request"] = {
        summary: request.summary,
        classification,
        explicitOnboarding: request.explicitOnboarding ?? false,
        explicitLighterProcess: request.explicitLighterProcess ?? false,
        implementationFinished: request.implementationFinished ?? false,
        mutationRequested: request.mutationRequested ?? true,
      };
      if (request.lighterProcessReason) {
        behaviorRequest.lighterProcessReason = request.lighterProcessReason;
      }
      const input: BehaviorInput = {
        protocolVersion: PROTOCOL_VERSION,
        requestId: request.requestId,
        repository: {
          configured: inspection.setupEvidence,
          configVersion: inspection.config.configVersion,
          protocolCompatibility:
            inspection.config.status === "valid"
              ? "compatible"
              : inspection.config.status === "missing"
                ? "unknown"
                : "incompatible",
          instructionFiles: inspection.instructionFiles,
          setupEvidence: inspection.setupEvidence,
          planningEvidence: inspection.planningEvidence,
          planningGate: config?.workflow.planning_gate ?? "non-trivial",
        },
        request: behaviorRequest,
        availableSkills: inspection.availableSkills,
        hostCapabilities,
        evidence: mergeEvidence(inspection.evidence, request.evidence ?? []),
      };
      if (request.state) input.state = request.state;
      if (request.learningSignals) input.learningSignals = request.learningSignals;

      const plan = evaluateBehavior(input);
      return {
        inspection,
        input,
        plan,
        effectiveCapabilities: intersectCapabilities(
          plan.requestedCapabilities,
          hostCapabilities,
          request.userModeCapabilities,
        ),
        diagnostics: [...inspection.diagnostics, ...runtimeDiagnostics],
      };
    },
  };
}
