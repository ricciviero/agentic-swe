import { lstat, mkdir, readdir, readlink, symlink, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

export type SkillLinkTarget = "codex" | "claude";

export interface SkillLinkMutation {
  target: SkillLinkTarget;
  skill: string;
  path: string;
  operation: "create" | "remove" | "none";
  status: "changed" | "unchanged" | "conflict";
  dryRun: boolean;
  message: string;
}

export interface SkillLinkOptions {
  target: SkillLinkTarget;
  sourceRoot: string;
  dryRun?: boolean;
  codexHome?: string;
  claudeHome?: string;
}

async function pathKind(path: string): Promise<"missing" | "symlink" | "other"> {
  const metadata = await lstat(path).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return "missing";
  return metadata.isSymbolicLink() ? "symlink" : "other";
}

async function skillDirectories(sourceRoot: string): Promise<Array<{ name: string; path: string }>> {
  const root = resolve(sourceRoot);
  const entries = await readdir(root, { withFileTypes: true });
  const skills: Array<{ name: string; path: string }> = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue;
    const source = join(root, entry.name);
    const skill = await lstat(join(source, "SKILL.md")).catch(() => null);
    if (skill?.isFile()) skills.push({ name: entry.name, path: source });
  }
  return skills;
}

function destinationRoot(options: SkillLinkOptions): string {
  if (options.target === "codex") {
    return join(resolve(options.codexHome ?? process.env.CODEX_HOME ?? join(homedir(), ".codex")), "skills");
  }
  return join(resolve(options.claudeHome ?? process.env.CLAUDE_HOME ?? join(homedir(), ".claude")), "skills");
}

function result(
  options: SkillLinkOptions,
  skill: string,
  path: string,
  operation: SkillLinkMutation["operation"],
  status: SkillLinkMutation["status"],
  message: string,
): SkillLinkMutation {
  return { target: options.target, skill, path, operation, status, dryRun: options.dryRun ?? false, message };
}

async function pointsTo(destination: string, source: string): Promise<boolean> {
  try {
    return resolve(dirname(destination), await readlink(destination)) === resolve(source);
  } catch {
    return false;
  }
}

export async function linkSkillDirectories(options: SkillLinkOptions): Promise<SkillLinkMutation[]> {
  const root = destinationRoot(options);
  const dryRun = options.dryRun ?? false;
  const mutations: SkillLinkMutation[] = [];
  if (!dryRun) await mkdir(root, { recursive: true });
  for (const skill of await skillDirectories(options.sourceRoot)) {
    const destination = join(root, skill.name);
    const kind = await pathKind(destination);
    if (kind === "symlink" && (await pointsTo(destination, skill.path))) {
      mutations.push(result(options, skill.name, destination, "none", "unchanged", "Skill link is current."));
    } else if (kind !== "missing") {
      mutations.push(result(options, skill.name, destination, "none", "conflict", "Existing skill path was not replaced."));
    } else {
      if (!dryRun) await symlink(skill.path, destination, process.platform === "win32" ? "junction" : "dir");
      mutations.push(result(options, skill.name, destination, "create", "changed", dryRun ? "Would link skill." : "Linked skill."));
    }
  }
  return mutations;
}

export async function unlinkSkillDirectories(options: SkillLinkOptions): Promise<SkillLinkMutation[]> {
  const root = destinationRoot(options);
  const dryRun = options.dryRun ?? false;
  const mutations: SkillLinkMutation[] = [];
  for (const skill of await skillDirectories(options.sourceRoot)) {
    const destination = join(root, skill.name);
    const kind = await pathKind(destination);
    if (kind === "missing") {
      mutations.push(result(options, skill.name, destination, "none", "unchanged", "Skill link is not installed."));
    } else if (kind !== "symlink" || !(await pointsTo(destination, skill.path))) {
      mutations.push(result(options, skill.name, destination, "none", "conflict", "Unowned skill path was not removed."));
    } else {
      if (!dryRun) await unlink(destination);
      mutations.push(result(options, skill.name, destination, "remove", "changed", dryRun ? "Would unlink owned skill." : "Unlinked owned skill."));
    }
  }
  return mutations;
}
