import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

interface ProtocolSource {
  protocolVersion: string;
  configVersion: number;
  principles: Array<{ id: string; statement: string }>;
  classifications: {
    trivial: { criteria: string[] };
    "non-trivial": { criteria: string[] };
  };
  gates: Array<{ id: string; skill?: string }>;
  completionCriteria: Array<{ id: string; hard: boolean; description: string }>;
  policies: {
    learning: { target: string; requireRepeatedSignal: boolean; excludeOneOffPreferences: boolean };
  };
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const protocolPath = resolve(repositoryRoot, "protocol/v1/protocol.yaml");
const packagePath = resolve(repositoryRoot, "packages/core/package.json");

function assertProtocol(value: unknown): asserts value is ProtocolSource {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new TypeError("Protocol source must be an object.");
  }
  const candidate = value as Partial<ProtocolSource>;
  if (
    typeof candidate.protocolVersion !== "string" ||
    !Number.isInteger(candidate.configVersion) ||
    !Array.isArray(candidate.principles) ||
    !Array.isArray(candidate.gates) ||
    !Array.isArray(candidate.completionCriteria) ||
    !candidate.classifications ||
    !candidate.policies
  ) {
    throw new TypeError("Protocol source is missing adapter fields.");
  }
}

function humanize(value: string): string {
  return value.replaceAll("-", " ");
}

function list(values: readonly string[]): string {
  return values.map((value) => `- ${humanize(value)}`).join("\n");
}

function generatedHeader(protocolVersion: string, packageVersion: string): string {
  return `<!-- Generated from protocol/v1/protocol.yaml by \`npm run adapters:generate\`. Do not edit directly. Protocol ${protocolVersion}; package ${packageVersion}. -->`;
}

function generatedYamlHeader(protocolVersion: string, packageVersion: string): string {
  return `# Generated from protocol/v1/protocol.yaml by npm run adapters:generate. Do not edit directly. Protocol ${protocolVersion}; package ${packageVersion}.`;
}

function renderProtocol(
  protocol: ProtocolSource,
  packageVersion: string,
): string {
  const setupSkill = protocol.gates.find((gate) => gate.id === "setup")?.skill ?? "agents-setup";
  const planningSkill =
    protocol.gates.find((gate) => gate.id === "planning")?.skill ?? "iterations-planner";
  const hardCriteria = protocol.completionCriteria
    .filter((criterion) => criterion.hard)
    .map((criterion) => `- **${humanize(criterion.id)}**: ${criterion.description}`)
    .join("\n");
  const principles = protocol.principles
    .map((principle) => `- **${humanize(principle.id)}**: ${principle.statement}`)
    .join("\n");

  return [
    "# Agentic SWE Protocol",
    "",
    generatedHeader(protocol.protocolVersion, packageVersion),
    "",
    "This is global routing guidance for coding agents. Repository instructions in `AGENTS.md` define project-specific rules and may add stricter requirements.",
    "",
    "## Session Start",
    "",
    "1. Establish the repository root and read the applicable instruction files before editing.",
    "2. When `.agentic/config.yaml` exists, read it and use its selected-skill mapping, local-workspace paths, and delivery rules.",
    `3. When the repository is unconfigured, do not create project policy for a mechanical microtask. For onboarding or non-trivial work, run \`${setupSkill}\` before implementation.`,
    "",
    "## Task Classification",
    "",
    "Treat a task as **trivial** only when every criterion applies:",
    "",
    list(protocol.classifications.trivial.criteria),
    "",
    "Treat a task as **non-trivial** when any criterion applies:",
    "",
    list(protocol.classifications["non-trivial"].criteria),
    "",
    "When uncertain, classify the task as non-trivial and state the assumption.",
    "",
    "## Planning Gate",
    "",
    `Before editing for non-trivial work, use \`${planningSkill}\` to create or reconcile the local iteration or fix record declared in \`.agentic/config.yaml\`. Keep the original brief, scope, decisions, affected files, validation, and completion evidence current as work changes.`,
    "",
    "Do not bypass the planning gate merely because the implementation looks obvious. A user can explicitly request a lighter process; record that exception in the final report.",
    "",
    "## Skill Routing",
    "",
    "Use the smallest relevant set of skills mapped by the project configuration. Read a matching skill before acting on its specialized workflow. Propose a project-specific skill only for durable repository knowledge that does not belong in a global skill.",
    "",
    "## Delivery",
    "",
    "Implement only after the applicable setup and planning gates are satisfied. Run validation that matches the changed surface, update durable documentation when conventions or architecture change, and report evidence plus unresolved assumptions.",
    "",
    hardCriteria,
    "",
    "## Security Boundary",
    "",
    principles,
    "",
    "A model may classify intent or propose actions, but it never grants capabilities. Effective access is the intersection of protocol requests, host policy, and the user-selected mode; any deny wins.",
    "",
    "## Learning Loop",
    "",
    `Treat repeated corrections, recurring review feedback, and persistent discovery costs as candidates for \`${protocol.policies.learning.target}\` updates. Require repeated evidence, exclude one-off preferences, and keep changes concise and project-specific.`,
    "",
  ].join("\n");
}

function renderProjectConfig(protocol: ProtocolSource, packageVersion: string): string {
  return [
    generatedYamlHeader(protocol.protocolVersion, packageVersion),
    `version: ${protocol.configVersion}`,
    "",
    "agents:",
    "  - codex",
    "  - claude-code",
    "",
    "project_skills_dir: .agents/skills",
    "selected_skills: []",
    "",
    "workflow:",
    "  planning_gate: non-trivial",
    "  iteration_directory: iterazioni",
    "  fix_directory: fix",
    "  local_workspaces_gitignored: true",
    "",
  ].join("\n");
}

function renderProjectSection(protocol: ProtocolSource, packageVersion: string): string {
  const setupSkill = protocol.gates.find((gate) => gate.id === "setup")?.skill ?? "agents-setup";
  const planningSkill =
    protocol.gates.find((gate) => gate.id === "planning")?.skill ?? "iterations-planner";
  return [
    generatedHeader(protocol.protocolVersion, packageVersion),
    "## Agentic Workflow",
    "",
    "Read `.agentic/config.yaml` before selecting skills or creating local workflow records.",
    "",
    `- For an unconfigured repository, use \`${setupSkill}\` before onboarding or non-trivial implementation work.`,
    `- For non-trivial work, use \`${planningSkill}\` before editing. Local records live in the configured iteration and fix directories and remain gitignored unless this repository explicitly says otherwise.`,
    "- Treat `selected_skills` as the project-approved global-skill mapping. Keep project-specific skills under the configured project-skills directory.",
    "- Run the validation commands required by the affected surface before reporting completion.",
    "",
  ].join("\n");
}

function renderClaudeProject(protocol: ProtocolSource, packageVersion: string): string {
  return [
    generatedHeader(protocol.protocolVersion, packageVersion),
    "@AGENTS.md",
    "",
    "## Claude Code",
    "",
    "Keep Claude Code-specific instructions below this line. Do not duplicate portable project rules from `AGENTS.md`.",
    "",
  ].join("\n");
}

function renderTypeScript(values: Record<string, string>): string {
  return [
    "/* Generated from protocol/v1/protocol.yaml. Do not edit directly. */",
    ...Object.entries(values).map(
      ([name, value]) => `export const ${name} = ${JSON.stringify(value)} as const;`,
    ),
    "",
  ].join("\n");
}

const parsed = parse(await readFile(protocolPath, "utf8")) as unknown;
assertProtocol(parsed);
const packageManifest = JSON.parse(await readFile(packagePath, "utf8")) as { version?: unknown };
if (typeof packageManifest.version !== "string") throw new TypeError("Core package version is missing.");

const protocolMarkdown = renderProtocol(parsed, packageManifest.version);
const projectConfig = renderProjectConfig(parsed, packageManifest.version);
const projectSection = renderProjectSection(parsed, packageManifest.version);
const claudeProject = renderClaudeProject(parsed, packageManifest.version);
const outputs = new Map<string, string>([
  [resolve(repositoryRoot, "core/agentic-protocol.md"), protocolMarkdown],
  [resolve(repositoryRoot, "core/templates/project-config.yaml"), projectConfig],
  [resolve(repositoryRoot, "core/templates/project-agentic-section.md"), projectSection],
  [resolve(repositoryRoot, "core/templates/CLAUDE.md"), claudeProject],
  [
    resolve(repositoryRoot, "packages/core/src/generated/adapters-v1.generated.ts"),
    renderTypeScript({
      agenticProtocolMarkdownV1: protocolMarkdown,
      projectConfigTemplateV1: projectConfig,
      projectAgenticSectionV1: projectSection,
      claudeProjectAdapterV1: claudeProject,
    }),
  ],
]);

const checkOnly = process.argv.includes("--check");
let stale = false;
for (const [path, expected] of outputs) {
  const current = await readFile(path, "utf8").catch(() => "");
  if (current === expected) continue;
  if (checkOnly) {
    console.error(`Generated adapter is stale: ${path.slice(repositoryRoot.length + 1)}`);
    stale = true;
  } else {
    await writeFile(path, expected, "utf8");
    console.log(`Generated ${path.slice(repositoryRoot.length + 1)}`);
  }
}
if (checkOnly && stale) process.exitCode = 1;
else if (checkOnly) console.log("Generated adapters are current.");
