import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { inspectRepository } from "./inspect.js";
import type {
  InspectRepositoryOptions,
  NodeDiagnostic,
  RepositoryInspection,
} from "./types.js";

export interface ProjectVerification {
  valid: boolean;
  inspection: RepositoryInspection;
  diagnostics: NodeDiagnostic[];
}

function error(code: NodeDiagnostic["code"], message: string, path?: string): NodeDiagnostic {
  return { code, severity: "error", message, ...(path ? { path } : {}) };
}

function ignoredByRootFile(content: string, directory: string): boolean {
  const normalized = directory.replace(/^\.\//, "").replace(/\/$/, "");
  const accepted = new Set([normalized, `${normalized}/`, `/${normalized}`, `/${normalized}/`]);
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .some((line) => !line.startsWith("#") && accepted.has(line));
}

export async function verifyProject(
  options: InspectRepositoryOptions = {},
): Promise<ProjectVerification> {
  const inspection = await inspectRepository(options);
  const diagnostics = [...inspection.diagnostics];
  const root = inspection.root;

  if (inspection.config.status === "missing") {
    diagnostics.push(error("CONFIG_MISSING", "Missing .agentic/config.yaml.", ".agentic/config.yaml"));
  }
  if (!inspection.instructionFiles.includes("AGENTS.md")) {
    diagnostics.push(error("AGENTS_MISSING", "Missing canonical AGENTS.md.", "AGENTS.md"));
  } else {
    const agents = await readFile(join(root, "AGENTS.md"), "utf8");
    if (!/^## Agentic Workflow\s*$/m.test(agents)) {
      diagnostics.push(error("AGENTIC_WORKFLOW_MISSING", "AGENTS.md is missing the Agentic Workflow section.", "AGENTS.md"));
    }
  }

  const config = inspection.config.config;
  if (config) {
    if (config.workflow.local_workspaces_gitignored) {
      const ignore = await readFile(join(root, ".gitignore"), "utf8").catch(() => "");
      for (const directory of [config.workflow.iteration_directory, config.workflow.fix_directory]) {
        if (!ignoredByRootFile(ignore, directory)) {
          diagnostics.push(error("WORKSPACE_NOT_IGNORED", `Local workflow directory is not ignored: ${directory}/`, ".gitignore"));
        }
      }
    }
    if (config.agents.includes("claude-code")) {
      if (!inspection.instructionFiles.includes("CLAUDE.md")) {
        diagnostics.push(error("CLAUDE_ADAPTER_MISSING", "Claude Code is configured but CLAUDE.md is missing.", "CLAUDE.md"));
      } else {
        const claude = await readFile(join(root, "CLAUDE.md"), "utf8");
        if (!/^@AGENTS\.md\s*$/m.test(claude)) {
          diagnostics.push(error("CLAUDE_ADAPTER_INVALID", "CLAUDE.md must import AGENTS.md.", "CLAUDE.md"));
        }
      }
    }
    const available = new Set(inspection.availableSkills.map((skill) => skill.name));
    for (const selection of config.selected_skills) {
      if (!available.has(selection.name)) {
        diagnostics.push({
          code: "SKILL_NOT_FOUND",
          severity: "warning",
          message: `Selected skill is unavailable in the inspected host paths: ${selection.name}`,
        });
      }
    }
  }

  return {
    valid: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
    inspection,
    diagnostics,
  };
}
