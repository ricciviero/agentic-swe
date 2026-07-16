import { access, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { AvailableSkill, ProjectConfig } from "@agentic-swe/core";
import { assertRealPathWithinRepository, resolveWithinRepository } from "./paths.js";
import type { NodeDiagnostic } from "./types.js";

async function exists(path: string): Promise<boolean> {
  return access(path).then(() => true, () => false);
}

async function globalSkillExists(roots: readonly string[], name: string): Promise<boolean> {
  for (const root of roots) {
    if ((await exists(join(root, name, "SKILL.md"))) || (await exists(join(root, `${name}.md`)))) {
      return true;
    }
  }
  return false;
}

export async function inventorySkills(options: {
  root: string;
  config: ProjectConfig;
  globalSkillDirectories?: readonly string[];
  relevantSkills?: readonly string[];
}): Promise<{ skills: AvailableSkill[]; diagnostics: NodeDiagnostic[] }> {
  const relevant = new Set(options.relevantSkills ?? []);
  const skills: AvailableSkill[] = [];
  const diagnostics: NodeDiagnostic[] = [];
  for (const selection of options.config.selected_skills) {
    if (await globalSkillExists(options.globalSkillDirectories ?? [], selection.name)) {
      skills.push({
        name: selection.name,
        source: "global",
        selected: true,
        relevant: relevant.has(selection.name),
      });
    }
  }

  try {
    const directory = resolveWithinRepository(options.root, options.config.project_skills_dir);
    if (!(await exists(directory))) return { skills, diagnostics };
    await assertRealPathWithinRepository(options.root, directory);
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (!entry.isDirectory() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name)) continue;
      if (!(await exists(join(directory, entry.name, "SKILL.md")))) continue;
      skills.push({
        name: entry.name,
        source: "project",
        selected: true,
        relevant: relevant.has(entry.name),
      });
    }
  } catch (error) {
    diagnostics.push({
      code: "SKILL_DIRECTORY_UNREADABLE",
      severity: "error",
      message: error instanceof Error ? error.message : String(error),
      path: options.config.project_skills_dir,
    });
  }
  return { skills, diagnostics };
}
