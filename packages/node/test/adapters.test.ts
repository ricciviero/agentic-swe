import assert from "node:assert/strict";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { parse } from "yaml";
import {
  installGlobalAdapters,
  linkSkillDirectories,
  renderAdapter,
  renderAdapterToFile,
  uninstallGlobalAdapters,
  unlinkSkillDirectories,
  validateProjectConfigData,
  verifyProject,
} from "@agentic-swe/node";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "agentic-swe-adapter-test-"));
  temporaryDirectories.push(root);
  return root;
}

test("generated adapters match tracked canonical outputs", async () => {
  assert.equal(
    await readFile(new URL("../../../core/agentic-protocol.md", import.meta.url), "utf8"),
    renderAdapter("protocol"),
  );
  assert.equal(
    await readFile(new URL("../../../core/templates/project-config.yaml", import.meta.url), "utf8"),
    renderAdapter("project-config"),
  );
  assert.equal(validateProjectConfigData(parse(renderAdapter("project-config"))).status, "valid");
});

test("Codex install preserves personal content and uninstall restores it", async () => {
  const root = await temporaryRoot();
  const codexHome = join(root, "codex");
  const destination = join(codexHome, "AGENTS.md");
  await mkdir(codexHome, { recursive: true });
  const personal = "# Personal guidance\n\nKeep this exact text.\n";
  await writeFile(destination, personal, "utf8");

  const dryRun = await installGlobalAdapters({ target: "codex", codexHome, dryRun: true });
  assert.equal(dryRun[0]?.status, "changed");
  assert.equal(await readFile(destination, "utf8"), personal);

  const installed = await installGlobalAdapters({ target: "codex", codexHome });
  assert.equal(installed[0]?.operation, "update");
  const content = await readFile(destination, "utf8");
  assert.match(content, /<!-- agentic-swe:begin -->/);
  assert.match(content, /Keep this exact text\./);
  const repeated = await installGlobalAdapters({ target: "codex", codexHome });
  assert.equal(repeated[0]?.status, "unchanged");

  const removed = await uninstallGlobalAdapters({ target: "codex", codexHome });
  assert.equal(removed[0]?.operation, "remove");
  assert.equal(await readFile(destination, "utf8"), personal);
});

test("Claude install refuses unowned files and hostile symlinks", async () => {
  const root = await temporaryRoot();
  const claudeHome = join(root, "claude");
  const rules = join(claudeHome, "rules");
  const destination = join(rules, "agentic-swe.md");
  await mkdir(rules, { recursive: true });
  await writeFile(destination, "# User rule\n", "utf8");
  const conflict = await installGlobalAdapters({ target: "claude", claudeHome });
  assert.equal(conflict[0]?.status, "conflict");
  assert.equal(await readFile(destination, "utf8"), "# User rule\n");

  await rm(destination);
  const outside = join(root, "outside.md");
  await writeFile(outside, "do not follow\n", "utf8");
  await symlink(outside, destination);
  const symlinkConflict = await installGlobalAdapters({ target: "claude", claudeHome });
  assert.equal(symlinkConflict[0]?.status, "conflict");
  assert.equal(await readFile(outside, "utf8"), "do not follow\n");
});

test("Claude owned rule is removable without touching its directory", async () => {
  const root = await temporaryRoot();
  const claudeHome = join(root, "claude");
  const destination = join(claudeHome, "rules", "agentic-swe.md");
  const installed = await installGlobalAdapters({ target: "claude", claudeHome });
  assert.equal(installed[0]?.operation, "create");
  assert.equal(await readFile(destination, "utf8"), renderAdapter("claude"));
  const removed = await uninstallGlobalAdapters({ target: "claude", claudeHome });
  assert.equal(removed[0]?.operation, "remove");
  assert.equal(await access(destination).then(() => true, () => false), false);
  assert.equal(await access(join(claudeHome, "rules")).then(() => true, () => false), true);
});

test("render refuses an unowned destination", async () => {
  const root = await temporaryRoot();
  const destination = join(root, "AGENTS.md");
  await writeFile(destination, "# User content\n", "utf8");
  const result = await renderAdapterToFile({ kind: "project-agents-section", path: destination });
  assert.equal(result.status, "conflict");
  assert.equal(await readFile(destination, "utf8"), "# User content\n");
});

test("render refreshes its own generated YAML output", async () => {
  const root = await temporaryRoot();
  const destination = join(root, "config.yaml");
  await writeFile(
    destination,
    "# Generated from protocol/v1/protocol.yaml by an older adapter.\nversion: 0\n",
    "utf8",
  );
  const result = await renderAdapterToFile({ kind: "project-config", path: destination });
  assert.equal(result.status, "changed");
  assert.equal(validateProjectConfigData(parse(await readFile(destination, "utf8"))).status, "valid");
});

test("skill linker creates and removes only owned symlinks", async () => {
  const root = await temporaryRoot();
  const sourceRoot = join(root, "source");
  const codexHome = join(root, "codex");
  await Promise.all([
    mkdir(join(sourceRoot, "alpha"), { recursive: true }),
    mkdir(join(sourceRoot, "beta"), { recursive: true }),
    mkdir(join(codexHome, "skills", "beta"), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(join(sourceRoot, "alpha", "SKILL.md"), "# Alpha\n", "utf8"),
    writeFile(join(sourceRoot, "beta", "SKILL.md"), "# Beta\n", "utf8"),
    writeFile(join(codexHome, "skills", "beta", "personal.txt"), "keep\n", "utf8"),
  ]);
  const linked = await linkSkillDirectories({ target: "codex", sourceRoot, codexHome });
  assert.equal(linked.find((entry) => entry.skill === "alpha")?.status, "changed");
  assert.equal(linked.find((entry) => entry.skill === "beta")?.status, "conflict");
  const removed = await unlinkSkillDirectories({ target: "codex", sourceRoot, codexHome });
  assert.equal(removed.find((entry) => entry.skill === "alpha")?.status, "changed");
  assert.equal(removed.find((entry) => entry.skill === "beta")?.status, "conflict");
  assert.equal(await readFile(join(codexHome, "skills", "beta", "personal.txt"), "utf8"), "keep\n");
});

test("project verifier uses v1 config and actionable contract checks", async () => {
  const root = await temporaryRoot();
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
      "version: 1\nagents: [codex, claude-code]\nproject_skills_dir: .agents/skills\nselected_skills: []\nworkflow:\n  planning_gate: non-trivial\n  iteration_directory: iterazioni\n  fix_directory: fix\n  local_workspaces_gitignored: true\n",
      "utf8",
    ),
  ]);
  const valid = await verifyProject({ startPath: root });
  assert.equal(valid.valid, true);
  await writeFile(join(root, ".gitignore"), "", "utf8");
  const invalid = await verifyProject({ startPath: root });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.diagnostics.filter((diagnostic) => diagnostic.code === "WORKSPACE_NOT_IGNORED").length, 2);
});
