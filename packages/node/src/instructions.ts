import { access } from "node:fs/promises";
import { join } from "node:path";
import { assertRealPathWithinRepository, normalizeRelativePath } from "./paths.js";
import type { NodeDiagnostic } from "./types.js";

const candidates = ["AGENTS.md", "CLAUDE.md", ".claude/rules/agentic-swe.md"] as const;

export async function discoverInstructionFiles(root: string): Promise<{
  files: string[];
  diagnostics: NodeDiagnostic[];
}> {
  const files: string[] = [];
  const diagnostics: NodeDiagnostic[] = [];
  for (const relativePath of candidates) {
    const absolutePath = join(root, relativePath);
    if (!(await access(absolutePath).then(() => true, () => false))) continue;
    try {
      await assertRealPathWithinRepository(root, absolutePath);
      files.push(normalizeRelativePath(relativePath));
    } catch (error) {
      diagnostics.push({
        code: "INSTRUCTION_UNREADABLE",
        severity: "error",
        message: error instanceof Error ? error.message : String(error),
        path: normalizeRelativePath(relativePath),
      });
    }
  }
  return { files, diagnostics };
}
