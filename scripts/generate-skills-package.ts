import { createHash } from "node:crypto";
import { cp, lstat, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

interface SkillEntry {
  name: string;
  description: string;
  integrity: string;
  files: string[];
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const skillsRoot = resolve(repositoryRoot, "skills");
const packageRoot = resolve(repositoryRoot, "packages/skills");
const generatedPath = resolve(packageRoot, "src/generated/manifest.generated.ts");
const manifestPath = resolve(packageRoot, "manifest.json");
const noticesPath = resolve(packageRoot, "THIRD_PARTY_NOTICES.md");
const assetsRoot = resolve(packageRoot, "dist/assets");

function normalize(path: string): string {
  return path.split(sep).join("/");
}

function frontmatter(content: string, path: string): { name: string; description: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  if (!match?.[1]) throw new Error(`Missing YAML frontmatter: ${path}`);
  const value = parse(match[1]) as unknown;
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid YAML frontmatter: ${path}`);
  }
  const record = value as Record<string, unknown>;
  if (typeof record.name !== "string" || typeof record.description !== "string") {
    throw new Error(`Skill frontmatter requires name and description: ${path}`);
  }
  return { name: record.name, description: record.description };
}

async function filesUnder(root: string): Promise<string[]> {
  const output: string[] = [];
  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(directory, entry.name);
      const metadata = await lstat(path);
      if (metadata.isSymbolicLink()) throw new Error(`Skill packages cannot contain symlinks: ${path}`);
      if (metadata.isDirectory()) await walk(path);
      else if (metadata.isFile()) output.push(normalize(relative(root, path)));
    }
  }
  await walk(root);
  return output;
}

async function integrity(root: string, files: readonly string[]): Promise<string> {
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file);
    hash.update("\0");
    hash.update(await readFile(resolve(root, file)));
    hash.update("\0");
  }
  return `sha256-${hash.digest("base64")}`;
}

async function buildManifest(): Promise<{
  skills: SkillEntry[];
  sourceDirectories: ReadonlyMap<string, string>;
}> {
  const directories = (await readdir(skillsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));
  const skills: SkillEntry[] = [];
  const sourceDirectories = new Map<string, string>();
  for (const directory of directories) {
    const root = resolve(skillsRoot, directory.name);
    const skillPath = resolve(root, "SKILL.md");
    const metadata = await lstat(skillPath).catch(() => null);
    if (!metadata?.isFile()) continue;
    const parsed = frontmatter(await readFile(skillPath, "utf8"), skillPath);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsed.name)) {
      throw new Error(`Invalid skill name: ${parsed.name}`);
    }
    if (sourceDirectories.has(parsed.name)) throw new Error(`Duplicate skill name: ${parsed.name}`);
    const files = await filesUnder(root);
    skills.push({
      name: parsed.name,
      description: parsed.description,
      integrity: await integrity(root, files),
      files,
    });
    sourceDirectories.set(parsed.name, root);
  }
  skills.sort((left, right) => left.name.localeCompare(right.name));
  return { skills, sourceDirectories };
}

function generatedSource(skills: readonly SkillEntry[]): string {
  return [
    "/* Generated from the canonical root skills directory. Do not edit directly. */",
    `export const generatedSkillManifest = Object.freeze(JSON.parse(${JSON.stringify(JSON.stringify(skills))})) as readonly {`,
    "  readonly name: string;",
    "  readonly description: string;",
    "  readonly integrity: string;",
    "  readonly files: readonly string[];",
    "}[];",
    "",
  ].join("\n");
}

const packageManifest = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8")) as { version?: unknown };
if (typeof packageManifest.version !== "string") throw new Error("Skills package version is missing.");
const { skills, sourceDirectories } = await buildManifest();
const manifest = `${JSON.stringify({ version: 1, packageVersion: packageManifest.version, skills }, null, 2)}\n`;
const source = generatedSource(skills);
const notices = await readFile(resolve(repositoryRoot, "THIRD_PARTY_NOTICES.md"), "utf8");
const checkOnly = process.argv.includes("--check");
const assetsOnly = process.argv.includes("--assets-only");

if (!assetsOnly) {
  if (checkOnly) {
    const [currentSource, currentManifest, currentNotices] = await Promise.all([
      readFile(generatedPath, "utf8").catch(() => ""),
      readFile(manifestPath, "utf8").catch(() => ""),
      readFile(noticesPath, "utf8").catch(() => ""),
    ]);
    if (currentSource !== source || currentManifest !== manifest || currentNotices !== notices) {
      console.error("Generated skill manifest is stale. Run: npm run skills:generate");
      process.exitCode = 1;
    } else {
      console.log(`Generated skill manifest is current (${skills.length} skills).`);
    }
  } else {
    await mkdir(dirname(generatedPath), { recursive: true });
    await Promise.all([
      writeFile(generatedPath, source, "utf8"),
      writeFile(manifestPath, manifest, "utf8"),
      writeFile(noticesPath, notices, "utf8"),
    ]);
    console.log(`Generated @agenticswe/skills manifest (${skills.length} skills).`);
  }
}

if (assetsOnly) {
  await rm(assetsRoot, { recursive: true, force: true });
  await mkdir(assetsRoot, { recursive: true });
  for (const skill of skills) {
    const source = sourceDirectories.get(skill.name);
    if (!source) throw new Error(`Missing source directory for skill: ${skill.name}`);
    await cp(source, resolve(assetsRoot, skill.name), {
      recursive: true,
      errorOnExist: true,
      force: false,
      dereference: false,
    });
  }
  console.log(`Prepared @agenticswe/skills assets (${skills.length} skills).`);
}
