import assert from "node:assert/strict";
import {
  mkdir,
  mkdtemp,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import {
  createNodeRuntime,
  inspectPlanningEvidence,
  inspectRepository,
  readProjectConfig,
  validateProjectConfigData,
} from "@agentic-swe/node";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function createRepository(): Promise<{ root: string; globalSkills: string }> {
  const root = await mkdtemp(join(tmpdir(), "agentic-swe-node-test-"));
  temporaryDirectories.push(root);
  const globalSkills = join(root, "global-skills");
  await Promise.all([
    mkdir(join(root, ".git"), { recursive: true }),
    mkdir(join(root, ".agentic"), { recursive: true }),
    mkdir(join(root, ".agents", "skills", "project-review"), { recursive: true }),
    mkdir(join(root, "iterazioni", "42-reference-runtime"), { recursive: true }),
    mkdir(join(root, "src", "nested"), { recursive: true }),
    mkdir(join(globalSkills, "iterations-planner"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(root, "AGENTS.md"), "# Test repository\n", "utf8"),
    writeFile(
      join(root, ".agentic", "config.yaml"),
      [
        "version: 1",
        "agents: [codex]",
        "project_skills_dir: .agents/skills",
        "selected_skills:",
        "  - name: iterations-planner",
        "    trigger: Plan non-trivial work.",
        "workflow:",
        "  planning_gate: non-trivial",
        "  iteration_directory: iterazioni",
        "  fix_directory: fix",
        "  local_workspaces_gitignored: true",
        "",
      ].join("\n"),
      "utf8",
    ),
    writeFile(join(root, ".agents", "skills", "project-review", "SKILL.md"), "# Review\n", "utf8"),
    writeFile(join(globalSkills, "iterations-planner", "SKILL.md"), "# Planner\n", "utf8"),
    writeFile(join(root, "iterazioni", "42-reference-runtime", "task.md"), "# Task\n", "utf8"),
    writeFile(join(root, "iterazioni", "42-reference-runtime", "plan.md"), "# Plan\n", "utf8"),
  ]);
  return { root, globalSkills };
}

test("project config validator accepts v1 and rejects incompatible versions", () => {
  const valid = validateProjectConfigData({
    version: 1,
    agents: ["codex"],
    project_skills_dir: ".agents/skills",
    selected_skills: [],
    workflow: {
      planning_gate: "non-trivial",
      iteration_directory: "iterazioni",
      fix_directory: "fix",
      local_workspaces_gitignored: true,
    },
  });
  assert.equal(valid.status, "valid");
  const incompatible = validateProjectConfigData({ ...valid.config, version: 2 });
  assert.equal(incompatible.status, "incompatible");
  assert.equal(incompatible.diagnostics[0]?.code, "CONFIG_VERSION_INCOMPATIBLE");
  const malformed = validateProjectConfigData({ version: 1 });
  assert.equal(malformed.status, "invalid");
  assert.equal(malformed.diagnostics[0]?.code, "CONFIG_INVALID");
});

test("repository inspection discovers only normalized, policy-approved metadata", async () => {
  const { root, globalSkills } = await createRepository();
  const inspection = await inspectRepository({
    startPath: join(root, "src", "nested"),
    globalSkillDirectories: [globalSkills],
    relevantSkills: ["iterations-planner", "project-review"],
    planningRecord: "iterazioni/42-reference-runtime",
  });
  assert.equal(inspection.root, await realpath(root));
  assert.equal(inspection.config.status, "valid");
  assert.equal(inspection.setupEvidence, true);
  assert.equal(inspection.planningEvidence, true);
  assert.deepEqual(inspection.instructionFiles, ["AGENTS.md"]);
  assert.deepEqual(
    inspection.availableSkills.map((skill) => [skill.name, skill.source, skill.relevant]),
    [
      ["iterations-planner", "global", true],
      ["project-review", "project", true],
    ],
  );
  assert.equal(inspection.evidence[0]?.id, "planning:iterazioni/42-reference-runtime");
});

test("planning evidence rejects paths outside configured workspaces", async () => {
  const { root } = await createRepository();
  const config = await readProjectConfig(root);
  assert(config.config);
  const result = await inspectPlanningEvidence({
    root,
    config: config.config,
    planningRecord: "src/nested",
  });
  assert.equal(result.present, false);
  assert.equal(result.diagnostics[0]?.code, "PLANNING_RECORD_INVALID");
});

test("node runtime evaluates read-only and intersects capabilities", async () => {
  const { root, globalSkills } = await createRepository();
  const before = (await readdir(root, { recursive: true })).sort();
  const runtime = createNodeRuntime({
    startPath: root,
    globalSkillDirectories: [globalSkills],
    skillRouter: { select: async () => ["project-review", "not-approved"] },
  });
  const result = await runtime.evaluate({
    requestId: "request-1",
    summary: "Implement a cross-layer runtime",
    classification: {
      value: "non-trivial",
      source: "human",
      reasons: ["Multiple independently verifiable deliverables."],
    },
    planningRecord: "iterazioni/42-reference-runtime",
    hostCapabilities: ["repository:read", "workspace:mutate"],
    userModeCapabilities: ["repository:read"],
  });
  assert.equal(result.plan.phase, "execution");
  assert.deepEqual(result.effectiveCapabilities, ["repository:read"]);
  assert.equal(result.diagnostics.some((diagnostic) => diagnostic.code === "SKILL_NOT_APPROVED"), true);
  const after = (await readdir(root, { recursive: true })).sort();
  assert.deepEqual(after, before);
});

test("malformed configuration produces a blocked read-only plan", async () => {
  const { root } = await createRepository();
  await writeFile(join(root, ".agentic", "config.yaml"), "version: 2\n", "utf8");
  const runtime = createNodeRuntime({ startPath: root });
  const result = await runtime.evaluate({
    requestId: "request-1",
    summary: "Fix a typo",
    classification: { value: "trivial", source: "human", reasons: ["Mechanical."] },
    hostCapabilities: ["repository:read", "workspace:mutate"],
  });
  assert.equal(result.plan.phase, "blocked");
  assert.deepEqual(result.plan.requestedCapabilities, ["repository:read", "instructions:read"]);
  assert.deepEqual(result.effectiveCapabilities, ["repository:read"]);
  assert.equal(result.inspection.config.status, "incompatible");
});
