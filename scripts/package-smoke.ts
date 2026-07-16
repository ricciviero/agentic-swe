import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

interface PackFile {
  path: string;
}

interface PackResult {
  filename: string;
  files: PackFile[];
}

function run(command: string, args: string[], cwd: string): string {
  try {
    return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    if (typeof error === "object" && error !== null) {
      const failure = error as { stdout?: string; stderr?: string };
      throw new Error(`${command} ${args.join(" ")} failed\n${failure.stdout ?? ""}${failure.stderr ?? ""}`);
    }
    throw error;
  }
}

function pack(packageDirectory: string, destination: string): PackResult {
  const output = run(
    "npm",
    ["pack", "--json", "--pack-destination", destination, packageDirectory],
    process.cwd(),
  );
  const results = JSON.parse(output) as PackResult[];
  const result = results[0];
  if (!result) throw new Error(`npm pack returned no result for ${packageDirectory}`);
  for (const file of result.files) {
    assert(!/(^|\/)(iterazioni|fix|node_modules)(\/|$)/.test(file.path), `${result.filename}: ${file.path}`);
    assert(!/(^|\/)\.env(?:\.|$)/.test(file.path), `${result.filename}: ${file.path}`);
    assert(!file.path.endsWith(".tsbuildinfo"), `${result.filename}: ${file.path}`);
  }
  return result;
}

async function assertNoPrivatePaths(root: string): Promise<void> {
  const entries = await readdir(root, { recursive: true });
  for (const entry of entries) {
    if (!entry.endsWith(".map")) continue;
    const content = await readFile(join(root, entry), "utf8");
    assert(!content.includes("/Users/"), `Source map leaks a private path: ${entry}`);
    assert(!content.includes("Desktop/REPO"), `Source map leaks a workspace path: ${entry}`);
  }
}

const smokeSource = `
import { evaluateBehavior, PROTOCOL_VERSION } from "@agentic-swe/core";
import { validateProjectConfigData } from "@agentic-swe/node";
import { runCli } from "@agentic-swe/cli";
import { loadSkill, verifySkillIntegrity } from "@agentic-swe/skills";

const plan = evaluateBehavior({
  protocolVersion: PROTOCOL_VERSION,
  requestId: "smoke",
  repository: {
    configured: true,
    configVersion: 1,
    protocolCompatibility: "compatible",
    instructionFiles: ["AGENTS.md"],
    setupEvidence: true,
    planningEvidence: false,
    planningGate: "non-trivial"
  },
  request: {
    classification: { value: "trivial", source: "human", reasons: ["Mechanical."] },
    explicitOnboarding: false,
    explicitLighterProcess: false,
    mutationRequested: true,
    implementationFinished: false
  },
  availableSkills: [],
  hostCapabilities: ["repository:read"],
  evidence: []
});
if (plan.phase !== "execution") throw new Error("Unexpected plan: " + plan.phase);
const config = validateProjectConfigData({
  version: 1,
  agents: ["codex"],
  project_skills_dir: ".agents/skills",
  selected_skills: [],
  workflow: {
    planning_gate: "non-trivial",
    iteration_directory: "iterazioni",
    fix_directory: "fix",
    local_workspaces_gitignored: true
  }
});
if (config.status !== "valid") throw new Error("Config validation failed");
const planner = await loadSkill("iterations-planner");
if (!planner.body.includes("# iterations-planner")) throw new Error("Skill body unavailable");
if (!(await verifySkillIntegrity(planner.name))) throw new Error("Skill integrity failed");
let version = "";
const exitCode = await runCli(["--version"], {
  stdout: value => { version += value; },
  stderr: value => { throw new Error(value); }
});
if (exitCode !== 0 || version.trim() !== "0.1.0") throw new Error("CLI public API failed");
console.log("consumer smoke: ok");
`;

const temporaryRoot = await mkdtemp(join(tmpdir(), "agentic-swe-pack-"));
try {
  const tarballs = join(temporaryRoot, "tarballs");
  await mkdir(tarballs);
  const core = pack("./packages/core", tarballs);
  const node = pack("./packages/node", tarballs);
  const skills = pack("./packages/skills", tarballs);
  const cli = pack("./packages/cli", tarballs);
  const coreTarball = resolve(tarballs, core.filename);
  const nodeTarball = resolve(tarballs, node.filename);
  const skillsTarball = resolve(tarballs, skills.filename);
  const cliTarball = resolve(tarballs, cli.filename);
  assert(skills.files.some((file) => file.path === "dist/assets/agents-setup/SKILL.md"));
  assert(skills.files.some((file) => file.path === "THIRD_PARTY_NOTICES.md"));
  assert(cli.files.some((file) => file.path === "dist/bin.js"));

  for (const runtime of ["node", "bun"] as const) {
    const consumer = join(temporaryRoot, `${runtime}-consumer`);
    await mkdir(consumer);
    const dependencies = {
      "@agentic-swe/core": `file:${coreTarball}`,
      "@agentic-swe/node": `file:${nodeTarball}`,
      "@agentic-swe/skills": `file:${skillsTarball}`,
      "@agentic-swe/cli": `file:${cliTarball}`,
    };
    const manifest = {
      name: `${runtime}-consumer`,
      private: true,
      type: "module",
      dependencies,
      ...(runtime === "bun" ? { overrides: dependencies } : {}),
    };
    await writeFile(
      join(consumer, "package.json"),
      JSON.stringify(manifest, null, 2),
    );
    await writeFile(join(consumer, "smoke.mjs"), smokeSource);
    if (runtime === "node") {
      run("npm", ["install", "--ignore-scripts"], consumer);
      const output = run("node", ["smoke.mjs"], consumer);
      assert.match(output, /consumer smoke: ok/);
      assert.equal(run("node", ["node_modules/@agentic-swe/cli/dist/bin.js", "--version"], consumer).trim(), "0.1.0");
    } else {
      run("bun", ["install"], consumer);
      const output = run("bun", ["run", "smoke.mjs"], consumer);
      assert.match(output, /consumer smoke: ok/);
      assert.equal(run("bun", ["run", "node_modules/@agentic-swe/cli/dist/bin.js", "--version"], consumer).trim(), "0.1.0");
    }
    assert.equal(run(join(consumer, "node_modules", ".bin", "agentic-swe"), ["--version"], consumer).trim(), "0.1.0");
    await assertNoPrivatePaths(join(consumer, "node_modules", "@agentic-swe"));
  }
  console.log(
    `Package smoke: Node and Bun consumers passed (${[coreTarball, nodeTarball, skillsTarball, cliTarball].map((path) => basename(path)).join(", ")}).`,
  );
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
