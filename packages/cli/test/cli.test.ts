import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { EXIT_CODES, runCli, type CliIo } from "@agenticswe/cli";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "agentic-swe-cli-test-"));
  temporaryDirectories.push(root);
  await Promise.all([
    mkdir(join(root, ".git"), { recursive: true }),
    mkdir(join(root, ".agentic"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(root, "AGENTS.md"), "# Repo\n\n## Agentic Workflow\n\nFollow config.\n", "utf8"),
    writeFile(join(root, "CLAUDE.md"), "@AGENTS.md\n", "utf8"),
    writeFile(join(root, ".gitignore"), "/iterazioni\n/fix\n", "utf8"),
    writeFile(
      join(root, ".agentic", "config.yaml"),
      "version: 1\nagents: [codex, claude-code]\nproject_skills_dir: .agents/skills\nselected_skills:\n  - name: agents-setup\n    trigger: Bootstrap a project.\nworkflow:\n  planning_gate: non-trivial\n  iteration_directory: iterazioni\n  fix_directory: fix\n  local_workspaces_gitignored: true\n",
      "utf8",
    ),
  ]);
  return root;
}

function capture(): { io: CliIo; stdout: string[]; stderr: string[] } {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: { stdout: (value) => stdout.push(value), stderr: (value) => stderr.push(value) },
    stdout,
    stderr,
  };
}

test("inspect and verify expose the read-only public path", async () => {
  const root = await fixture();
  const before = await readFile(join(root, "AGENTS.md"), "utf8");
  const inspected = capture();
  assert.equal(await runCli(["inspect", root, "--json"], inspected.io, {}), EXIT_CODES.ok);
  assert.equal(JSON.parse(inspected.stdout.join("")).config.status, "valid");
  const verified = capture();
  assert.equal(await runCli(["verify", root, "--json"], verified.io, {}), EXIT_CODES.ok);
  assert.equal(JSON.parse(verified.stdout.join("")).valid, true);
  assert.equal(await readFile(join(root, "AGENTS.md"), "utf8"), before);
});

test("evaluate emits a BehaviorPlan without executing tools", async () => {
  const root = await fixture();
  const request = join(root, "request.json");
  await writeFile(
    request,
    JSON.stringify({
      requestId: "cli-test",
      summary: "Fix a mechanical typo",
      classification: { value: "trivial", source: "human", reasons: ["Mechanical."] },
    }),
    "utf8",
  );
  const output = capture();
  assert.equal(await runCli(["evaluate", root, "--request-file", request], output.io, {}), EXIT_CODES.ok);
  const result = JSON.parse(output.stdout.join(""));
  assert.equal(result.plan.phase, "execution");
  assert.deepEqual(result.effectiveCapabilities, ["repository:read", "instructions:read", "skills:read"]);
});

test("install dry-run is non-mutating and conflicts have a distinct exit code", async () => {
  const root = await fixture();
  const codexHome = join(root, "codex");
  const dryRun = capture();
  assert.equal(
    await runCli(["install", "--target", "codex", "--codex-home", codexHome, "--dry-run"], dryRun.io, {}),
    EXIT_CODES.ok,
  );
  await assert.rejects(readFile(join(codexHome, "AGENTS.md"), "utf8"));
  await mkdir(codexHome, { recursive: true });
  await mkdir(join(codexHome, "AGENTS.md"));
  const conflict = capture();
  assert.equal(
    await runCli(["install", "--target", "codex", "--codex-home", codexHome], conflict.io, {}),
    EXIT_CODES.conflict,
  );
});

test("CLI exit codes distinguish invalid and incompatible configurations", async () => {
  const root = await fixture();
  const config = join(root, ".agentic", "config.yaml");
  await writeFile(config, "version: 1\n", "utf8");
  assert.equal(await runCli(["verify", root], capture().io, {}), EXIT_CODES.invalidConfig);
  await writeFile(config, "version: 2\n", "utf8");
  assert.equal(await runCli(["verify", root], capture().io, {}), EXIT_CODES.incompatibleConfig);
  assert.equal(await runCli(["inspect", "--unknown"], capture().io, {}), EXIT_CODES.usage);
  assert.equal(await runCli(["inspect", join(root, "missing")], capture().io, {}), EXIT_CODES.unexpected);
});
