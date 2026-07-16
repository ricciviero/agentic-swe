import { readProjectConfig } from "./config.js";
import { inspectPlanningEvidence } from "./evidence.js";
import { discoverInstructionFiles } from "./instructions.js";
import { findRepositoryRoot } from "./repository.js";
import { inventorySkills } from "./skills.js";
import type { InspectRepositoryOptions, RepositoryInspection } from "./types.js";

export async function inspectRepository(
  options: InspectRepositoryOptions = {},
): Promise<RepositoryInspection> {
  const root = await findRepositoryRoot(options.startPath);
  const [config, instructions] = await Promise.all([
    readProjectConfig(root),
    discoverInstructionFiles(root),
  ]);
  const diagnostics = [...config.diagnostics, ...instructions.diagnostics];
  let availableSkills: RepositoryInspection["availableSkills"] = [];
  let planningEvidence = false;
  let evidence: RepositoryInspection["evidence"] = [];

  if (config.status === "valid" && config.config) {
    const [skills, planning] = await Promise.all([
      inventorySkills({
        root,
        config: config.config,
        ...(options.globalSkillDirectories
          ? { globalSkillDirectories: options.globalSkillDirectories }
          : {}),
        ...(options.relevantSkills ? { relevantSkills: options.relevantSkills } : {}),
      }),
      inspectPlanningEvidence({
        root,
        config: config.config,
        ...(options.planningRecord ? { planningRecord: options.planningRecord } : {}),
      }),
    ]);
    availableSkills = skills.skills;
    planningEvidence = planning.present;
    evidence = planning.evidence;
    diagnostics.push(...skills.diagnostics, ...planning.diagnostics);
  }

  const setupEvidence =
    config.status === "valid" && instructions.files.includes("AGENTS.md");
  return {
    root,
    config,
    instructionFiles: instructions.files,
    availableSkills,
    setupEvidence,
    planningEvidence,
    evidence,
    diagnostics,
  };
}
