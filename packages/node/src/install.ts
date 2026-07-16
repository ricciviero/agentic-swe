import {
  lstat,
  mkdir,
  readFile,
  readlink,
  rename,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import {
  AGENTIC_BEGIN_MARKER,
  AGENTIC_END_MARKER,
  isGeneratedAdapter,
  renderAdapter,
  type AdapterKind,
} from "./render.js";

export type InstallTarget = "codex" | "claude" | "all";
export type MutationStatus = "changed" | "unchanged" | "conflict";

export interface AdapterMutation {
  target: "codex" | "claude" | "render";
  path: string;
  operation: "create" | "update" | "remove" | "none";
  status: MutationStatus;
  dryRun: boolean;
  message: string;
}

export interface GlobalAdapterOptions {
  target: InstallTarget;
  dryRun?: boolean;
  codexHome?: string;
  claudeHome?: string;
}

interface ManagedParts {
  prefix: string;
  suffix: string;
}

async function pathKind(path: string): Promise<"missing" | "file" | "symlink" | "other"> {
  const metadata = await lstat(path).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (!metadata) return "missing";
  if (metadata.isSymbolicLink()) return "symlink";
  if (metadata.isFile()) return "file";
  return "other";
}

async function atomicWrite(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = join(dirname(path), `.${basename(path)}.agentic-swe-${randomUUID()}`);
  const existing = await lstat(path).catch(() => null);
  try {
    await writeFile(temporary, content, { encoding: "utf8", mode: existing?.mode ?? 0o644 });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true }).catch(() => undefined);
  }
}

function markerMatches(content: string, marker: string): RegExpMatchArray[] {
  const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...content.matchAll(new RegExp(`^${escaped}\\r?$`, "gm"))];
}

function managedParts(content: string): ManagedParts | null {
  const begins = markerMatches(content, AGENTIC_BEGIN_MARKER);
  const ends = markerMatches(content, AGENTIC_END_MARKER);
  if (begins.length === 0 && ends.length === 0) return null;
  if (begins.length !== 1 || ends.length !== 1) {
    throw new Error("Managed block markers are incomplete or duplicated.");
  }
  const begin = begins[0];
  const end = ends[0];
  if (begin?.index === undefined || end?.index === undefined || end.index <= begin.index) {
    throw new Error("Managed block markers are out of order.");
  }
  let suffixStart = end.index + AGENTIC_END_MARKER.length;
  if (content.slice(suffixStart, suffixStart + 2) === "\r\n") suffixStart += 2;
  else if (content[suffixStart] === "\n") suffixStart += 1;
  return { prefix: content.slice(0, begin.index), suffix: content.slice(suffixStart) };
}

function installCodexContent(current: string): string {
  const block = renderAdapter("codex");
  const parts = managedParts(current);
  if (parts) return `${parts.prefix}${block}${parts.suffix}`;
  if (current.length === 0) return block;
  return `${block}\n${current}`;
}

function uninstallCodexContent(current: string): string | null {
  const parts = managedParts(current);
  if (!parts) return null;
  if (parts.prefix.length === 0 && parts.suffix.startsWith("\n")) {
    return parts.suffix.slice(1);
  }
  if (parts.suffix.length === 0 && parts.prefix.endsWith("\n\n")) {
    return parts.prefix.slice(0, -1);
  }
  return `${parts.prefix}${parts.suffix}`;
}

function mutation(
  target: AdapterMutation["target"],
  path: string,
  operation: AdapterMutation["operation"],
  status: MutationStatus,
  dryRun: boolean,
  message: string,
): AdapterMutation {
  return { target, path, operation, status, dryRun, message };
}

async function installCodex(path: string, dryRun: boolean): Promise<AdapterMutation> {
  const kind = await pathKind(path);
  if (kind === "symlink" || kind === "other") {
    return mutation("codex", path, "none", "conflict", dryRun, "Codex AGENTS.md is not a regular file and was not replaced.");
  }
  const current = kind === "file" ? await readFile(path, "utf8") : "";
  let next: string;
  try {
    next = installCodexContent(current);
  } catch (error) {
    return mutation("codex", path, "none", "conflict", dryRun, error instanceof Error ? error.message : String(error));
  }
  if (current === next) return mutation("codex", path, "none", "unchanged", dryRun, "Codex adapter is current.");
  if (!dryRun) await atomicWrite(path, next);
  return mutation("codex", path, kind === "missing" ? "create" : "update", "changed", dryRun, dryRun ? "Would install the Codex managed block." : "Installed the Codex managed block.");
}

async function uninstallCodex(path: string, dryRun: boolean): Promise<AdapterMutation> {
  const kind = await pathKind(path);
  if (kind === "missing") return mutation("codex", path, "none", "unchanged", dryRun, "Codex adapter is not installed.");
  if (kind !== "file") return mutation("codex", path, "none", "conflict", dryRun, "Codex AGENTS.md is not a regular file and was not modified.");
  const current = await readFile(path, "utf8");
  let next: string | null;
  try {
    next = uninstallCodexContent(current);
  } catch (error) {
    return mutation("codex", path, "none", "conflict", dryRun, error instanceof Error ? error.message : String(error));
  }
  if (next === null) return mutation("codex", path, "none", "unchanged", dryRun, "No Agentic SWE managed block was found.");
  if (!dryRun) {
    if (next.trim().length === 0) await unlink(path);
    else await atomicWrite(path, next);
  }
  return mutation("codex", path, "remove", "changed", dryRun, dryRun ? "Would remove only the Codex managed block." : "Removed only the Codex managed block.");
}

async function isOwnedClaudeSymlink(path: string): Promise<boolean> {
  try {
    const target = await readlink(path);
    const content = await readFile(resolve(dirname(path), target), "utf8");
    return content === renderAdapter("protocol") || content === renderAdapter("claude");
  } catch {
    return false;
  }
}

function claudeContentIsOwned(content: string): boolean {
  try {
    const parts = managedParts(content);
    return parts !== null && parts.prefix.trim().length === 0 && parts.suffix.trim().length === 0;
  } catch {
    return false;
  }
}

async function installClaude(path: string, dryRun: boolean): Promise<AdapterMutation> {
  const expected = renderAdapter("claude");
  const kind = await pathKind(path);
  if (kind === "other") return mutation("claude", path, "none", "conflict", dryRun, "Claude rule path is not a regular file and was not replaced.");
  if (kind === "symlink") {
    if (!(await isOwnedClaudeSymlink(path))) return mutation("claude", path, "none", "conflict", dryRun, "Unexpected Claude rule symlink was not followed or replaced.");
    if (!dryRun) {
      await unlink(path);
      await atomicWrite(path, expected);
    }
    return mutation("claude", path, "update", "changed", dryRun, dryRun ? "Would migrate the owned legacy Claude symlink." : "Migrated the owned legacy Claude symlink.");
  }
  const current = kind === "file" ? await readFile(path, "utf8") : "";
  if (current === expected) return mutation("claude", path, "none", "unchanged", dryRun, "Claude adapter is current.");
  if (kind === "file" && current !== renderAdapter("protocol") && !claudeContentIsOwned(current)) {
    return mutation("claude", path, "none", "conflict", dryRun, "Unowned Claude rule was not replaced.");
  }
  if (!dryRun) await atomicWrite(path, expected);
  return mutation("claude", path, kind === "missing" ? "create" : "update", "changed", dryRun, dryRun ? "Would install the Claude rule." : "Installed the Claude rule.");
}

async function uninstallClaude(path: string, dryRun: boolean): Promise<AdapterMutation> {
  const kind = await pathKind(path);
  if (kind === "missing") return mutation("claude", path, "none", "unchanged", dryRun, "Claude adapter is not installed.");
  let owned = false;
  if (kind === "symlink") owned = await isOwnedClaudeSymlink(path);
  else if (kind === "file") {
    const content = await readFile(path, "utf8");
    owned = content === renderAdapter("protocol") || claudeContentIsOwned(content);
  }
  if (!owned) return mutation("claude", path, "none", "conflict", dryRun, "Unowned Claude rule was not removed.");
  if (!dryRun) await unlink(path);
  return mutation("claude", path, "remove", "changed", dryRun, dryRun ? "Would remove the owned Claude rule." : "Removed the owned Claude rule.");
}

function targets(target: InstallTarget): Array<"codex" | "claude"> {
  return target === "all" ? ["codex", "claude"] : [target];
}

function adapterPaths(options: GlobalAdapterOptions): Record<"codex" | "claude", string> {
  return {
    codex: join(resolve(options.codexHome ?? process.env.CODEX_HOME ?? join(homedir(), ".codex")), "AGENTS.md"),
    claude: join(resolve(options.claudeHome ?? process.env.CLAUDE_HOME ?? join(homedir(), ".claude")), "rules", "agentic-swe.md"),
  };
}

export async function installGlobalAdapters(options: GlobalAdapterOptions): Promise<AdapterMutation[]> {
  const dryRun = options.dryRun ?? false;
  const paths = adapterPaths(options);
  const results: AdapterMutation[] = [];
  for (const target of targets(options.target)) {
    results.push(target === "codex" ? await installCodex(paths.codex, dryRun) : await installClaude(paths.claude, dryRun));
  }
  return results;
}

export async function uninstallGlobalAdapters(options: GlobalAdapterOptions): Promise<AdapterMutation[]> {
  const dryRun = options.dryRun ?? false;
  const paths = adapterPaths(options);
  const results: AdapterMutation[] = [];
  for (const target of targets(options.target)) {
    results.push(target === "codex" ? await uninstallCodex(paths.codex, dryRun) : await uninstallClaude(paths.claude, dryRun));
  }
  return results;
}

export async function renderAdapterToFile(options: {
  kind: AdapterKind;
  path: string;
  dryRun?: boolean;
}): Promise<AdapterMutation> {
  const path = resolve(options.path);
  const dryRun = options.dryRun ?? false;
  const expected = renderAdapter(options.kind);
  const kind = await pathKind(path);
  if (kind === "symlink" || kind === "other") return mutation("render", path, "none", "conflict", dryRun, "Render destination is not a regular file and was not replaced.");
  const current = kind === "file" ? await readFile(path, "utf8") : "";
  if (current === expected) return mutation("render", path, "none", "unchanged", dryRun, "Rendered adapter is current.");
  if (kind === "file" && !isGeneratedAdapter(current)) return mutation("render", path, "none", "conflict", dryRun, "Unowned render destination was not replaced.");
  if (!dryRun) await atomicWrite(path, expected);
  return mutation("render", path, kind === "missing" ? "create" : "update", "changed", dryRun, dryRun ? "Would write the generated adapter." : "Wrote the generated adapter.");
}
