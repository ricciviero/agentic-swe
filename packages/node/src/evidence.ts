import { access, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import type { Evidence, ProjectConfig } from "@agentic-swe/core";
import {
  assertRealPathWithinRepository,
  normalizeRelativePath,
  resolveWithinRepository,
} from "./paths.js";
import type { NodeDiagnostic } from "./types.js";

async function isNonEmptyFile(path: string): Promise<boolean> {
  return stat(path).then((metadata) => metadata.isFile() && metadata.size > 0, () => false);
}

function isInside(parent: string, child: string): boolean {
  const path = relative(parent, child);
  return path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

export async function inspectPlanningEvidence(options: {
  root: string;
  config: ProjectConfig;
  planningRecord?: string;
}): Promise<{ present: boolean; evidence: Evidence[]; diagnostics: NodeDiagnostic[] }> {
  if (!options.planningRecord) return { present: false, evidence: [], diagnostics: [] };
  const diagnostics: NodeDiagnostic[] = [];
  try {
    const record = resolveWithinRepository(options.root, options.planningRecord);
    await assertRealPathWithinRepository(options.root, record);
    const iterationRoot = resolveWithinRepository(
      options.root,
      options.config.workflow.iteration_directory,
    );
    const fixRoot = resolveWithinRepository(options.root, options.config.workflow.fix_directory);
    let requiredFiles: string[];
    if (isInside(iterationRoot, record)) requiredFiles = ["task.md", "plan.md"];
    else if (isInside(fixRoot, record)) requiredFiles = ["bug.md", "fix.md"];
    else throw new RangeError("Planning record is outside the configured iteration/fix workspaces.");

    const files = requiredFiles.map((filename) => resolve(record, filename));
    for (const file of files) {
      await assertRealPathWithinRepository(options.root, file);
      if (!(await isNonEmptyFile(file))) throw new Error(`Planning evidence file is missing or empty: ${file}`);
    }
    const relativeRecord = normalizeRelativePath(relative(options.root, record));
    return {
      present: true,
      evidence: [{ id: `planning:${relativeRecord}`, kind: "planning", valid: true }],
      diagnostics,
    };
  } catch (error) {
    diagnostics.push({
      code: "PLANNING_RECORD_INVALID",
      severity: "error",
      message: error instanceof Error ? error.message : String(error),
      path: options.planningRecord,
    });
    return { present: false, evidence: [], diagnostics };
  }
}
