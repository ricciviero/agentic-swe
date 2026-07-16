import {
  CLASSIFICATIONS,
  type AvailableSkill,
  type Classification,
  type ClassificationDecision,
} from "./types.js";

export type RuntimeDiagnosticCode =
  | "CLASSIFIER_ABORTED"
  | "CLASSIFIER_FAILED"
  | "CLASSIFIER_INVALID_OUTPUT"
  | "CLASSIFIER_TIMEOUT"
  | "SKILL_ROUTER_ABORTED"
  | "SKILL_ROUTER_FAILED"
  | "SKILL_ROUTER_INVALID_OUTPUT"
  | "SKILL_ROUTER_TIMEOUT"
  | "SKILL_NOT_APPROVED";

export interface RuntimeDiagnostic {
  code: RuntimeDiagnosticCode;
  severity: "warning" | "error";
  message: string;
}

export interface TaskClassifierInput {
  requestId: string;
  summary: string;
}

export interface TaskClassifier {
  classify(input: TaskClassifierInput, signal?: AbortSignal): Promise<unknown>;
}

export interface ClassifierRunResult {
  classification: ClassificationDecision;
  confidence?: number;
  diagnostics: RuntimeDiagnostic[];
}

function uncertain(code: RuntimeDiagnosticCode, message: string): ClassifierRunResult {
  return {
    classification: { value: "uncertain", source: "model", reasons: [message] },
    diagnostics: [{ code, severity: "warning", message }],
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

class PortTimeoutError extends Error {
  override readonly name = "PortTimeoutError";
}

class PortAbortError extends Error {
  override readonly name = "AbortError";
}

async function runPortWithTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  externalSignal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError("Port timeout must be a positive finite number.");
  }
  const controller = new AbortController();
  let rejectAbort: ((reason: PortAbortError) => void) | undefined;
  const abortPromise = new Promise<never>((_resolve, reject) => {
    rejectAbort = reject;
  });
  const forwardAbort = () => {
    controller.abort();
    rejectAbort?.(new PortAbortError("Port execution was aborted."));
  };
  externalSignal?.addEventListener("abort", forwardAbort, { once: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(controller.signal),
      abortPromise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new PortTimeoutError(`Port did not settle within ${timeoutMs}ms.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    externalSignal?.removeEventListener("abort", forwardAbort);
  }
}

export async function runTaskClassifier(
  classifier: TaskClassifier,
  input: TaskClassifierInput,
  signal?: AbortSignal,
  timeoutMs = 30_000,
): Promise<ClassifierRunResult> {
  if (signal?.aborted) return uncertain("CLASSIFIER_ABORTED", "Task classification was aborted.");
  try {
    const output = await runPortWithTimeout(
      (portSignal) => classifier.classify(input, portSignal),
      signal,
      timeoutMs,
    );
    if (signal?.aborted) return uncertain("CLASSIFIER_ABORTED", "Task classification was aborted.");
    if (typeof output !== "object" || output === null || Array.isArray(output)) {
      return uncertain("CLASSIFIER_INVALID_OUTPUT", "Task classifier returned a non-object result.");
    }
    const candidate = output as Record<string, unknown>;
    if (
      typeof candidate.value !== "string" ||
      !(CLASSIFICATIONS as readonly string[]).includes(candidate.value) ||
      !Array.isArray(candidate.reasons) ||
      !candidate.reasons.every((reason) => typeof reason === "string" && reason.length > 0)
    ) {
      return uncertain("CLASSIFIER_INVALID_OUTPUT", "Task classifier returned an invalid classification.");
    }
    if (
      candidate.confidence !== undefined &&
      (typeof candidate.confidence !== "number" || candidate.confidence < 0 || candidate.confidence > 1)
    ) {
      return uncertain("CLASSIFIER_INVALID_OUTPUT", "Task classifier returned an invalid confidence value.");
    }
    const result: ClassifierRunResult = {
      classification: {
        value: candidate.value as Classification,
        source: "model",
        reasons: candidate.reasons as string[],
      },
      diagnostics: [],
    };
    if (typeof candidate.confidence === "number") result.confidence = candidate.confidence;
    return result;
  } catch (error) {
    if (error instanceof PortTimeoutError) {
      return uncertain("CLASSIFIER_TIMEOUT", error.message);
    }
    if (signal?.aborted || isAbortError(error)) {
      return uncertain("CLASSIFIER_ABORTED", "Task classification was aborted.");
    }
    const detail = error instanceof Error ? error.message : String(error);
    return uncertain("CLASSIFIER_FAILED", `Task classifier failed: ${detail}`);
  }
}

export interface SkillRouterInput {
  requestId: string;
  summary: string;
}

export interface SkillRouter {
  select(
    input: SkillRouterInput,
    candidates: readonly AvailableSkill[],
    signal?: AbortSignal,
  ): Promise<unknown>;
}

export interface SkillRouterRunResult {
  skills: AvailableSkill[];
  diagnostics: RuntimeDiagnostic[];
}

export async function runSkillRouter(
  router: SkillRouter,
  input: SkillRouterInput,
  candidates: readonly AvailableSkill[],
  signal?: AbortSignal,
  timeoutMs = 30_000,
): Promise<SkillRouterRunResult> {
  const diagnostics: RuntimeDiagnostic[] = [];
  if (signal?.aborted) {
    return {
      skills: [],
      diagnostics: [{ code: "SKILL_ROUTER_ABORTED", severity: "warning", message: "Skill routing was aborted." }],
    };
  }
  try {
    const output = await runPortWithTimeout(
      (portSignal) => router.select(input, candidates, portSignal),
      signal,
      timeoutMs,
    );
    if (signal?.aborted) {
      return {
        skills: [],
        diagnostics: [{ code: "SKILL_ROUTER_ABORTED", severity: "warning", message: "Skill routing was aborted." }],
      };
    }
    if (!Array.isArray(output) || !output.every((name) => typeof name === "string")) {
      return {
        skills: [],
        diagnostics: [{
          code: "SKILL_ROUTER_INVALID_OUTPUT",
          severity: "warning",
          message: "Skill router must return an array of skill names.",
        }],
      };
    }
    const approved = new Map(candidates.filter((candidate) => candidate.selected).map((candidate) => [candidate.name, candidate]));
    const skills: AvailableSkill[] = [];
    for (const name of new Set(output as string[])) {
      const candidate = approved.get(name);
      if (!candidate) {
        diagnostics.push({
          code: "SKILL_NOT_APPROVED",
          severity: "warning",
          message: `Skill router requested an unapproved skill: ${name}`,
        });
        continue;
      }
      skills.push({ ...candidate, relevant: true });
    }
    return { skills, diagnostics };
  } catch (error) {
    if (error instanceof PortTimeoutError) {
      return {
        skills: [],
        diagnostics: [{ code: "SKILL_ROUTER_TIMEOUT", severity: "warning", message: error.message }],
      };
    }
    if (signal?.aborted || isAbortError(error)) {
      return {
        skills: [],
        diagnostics: [{ code: "SKILL_ROUTER_ABORTED", severity: "warning", message: "Skill routing was aborted." }],
      };
    }
    const detail = error instanceof Error ? error.message : String(error);
    return {
      skills: [],
      diagnostics: [{
        code: "SKILL_ROUTER_FAILED",
        severity: "warning",
        message: `Skill router failed: ${detail}`,
      }],
    };
  }
}
