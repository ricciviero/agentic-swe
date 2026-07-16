import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generatedSkillManifest } from "./generated/manifest.generated.js";

export interface SkillMetadata {
  readonly name: string;
  readonly description: string;
  readonly integrity: string;
  readonly files: readonly string[];
}

export interface LoadedSkill extends SkillMetadata {
  readonly content: string;
  readonly body: string;
}

export const SKILLS_PACKAGE_VERSION = "0.1.0" as const;
export const skillManifest: readonly SkillMetadata[] = Object.freeze(
  generatedSkillManifest.map((entry) => Object.freeze({
    ...entry,
    files: Object.freeze([...entry.files]),
  })),
);

const manifestByName = new Map(skillManifest.map((entry) => [entry.name, entry]));

export function skillAssetRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "assets");
}

export function listSkills(): readonly SkillMetadata[] {
  return skillManifest;
}

export function getSkillMetadata(name: string): SkillMetadata | undefined {
  return manifestByName.get(name);
}

function requiredSkill(name: string): SkillMetadata {
  const skill = getSkillMetadata(name);
  if (!skill) throw new RangeError(`Unknown Agentic SWE skill: ${name}`);
  return skill;
}

function bodyOf(content: string): string {
  const match = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(content);
  return match ? content.slice(match[0].length) : content;
}

export async function readSkillFile(name: string, relativePath: string): Promise<string> {
  const skill = requiredSkill(name);
  const normalized = relativePath.replaceAll("\\", "/").replace(/^\.\//, "");
  if (!skill.files.includes(normalized)) {
    throw new RangeError(`File is not part of the published skill: ${name}/${normalized}`);
  }
  return readFile(resolve(skillAssetRoot(), name, normalized), "utf8");
}

export async function loadSkill(name: string): Promise<LoadedSkill> {
  const skill = requiredSkill(name);
  const content = await readSkillFile(name, "SKILL.md");
  return { ...skill, content, body: bodyOf(content) };
}

export async function verifySkillIntegrity(name: string): Promise<boolean> {
  const skill = requiredSkill(name);
  const hash = createHash("sha256");
  try {
    for (const file of skill.files) {
      hash.update(file);
      hash.update("\0");
      hash.update(await readFile(resolve(skillAssetRoot(), name, file)));
      hash.update("\0");
    }
  } catch {
    return false;
  }
  return `sha256-${hash.digest("base64")}` === skill.integrity;
}
