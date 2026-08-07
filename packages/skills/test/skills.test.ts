import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getSkillMetadata,
  listSkills,
  loadSkill,
  readSkillFile,
  verifySkillIntegrity,
} from "@agenticswe/skills";

test("published skill manifest is complete, ordered, and unique", () => {
  const skills = listSkills();
  assert.equal(skills.length, 45);
  assert.deepEqual(
    skills.map((skill) => skill.name),
    [...skills.map((skill) => skill.name)].sort(),
  );
  assert.equal(new Set(skills.map((skill) => skill.name)).size, skills.length);
  assert(getSkillMetadata("agents-setup"));
  assert(getSkillMetadata("agentic-loop-dev"));
  assert(getSkillMetadata("agentic-loop-staging"));
  assert(getSkillMetadata("agentic-loop-prod"));
  assert(getSkillMetadata("build-unity-games"));
  assert(getSkillMetadata("just-do-it"));
  assert(getSkillMetadata("redesign-existing-projects"));
  assert.throws(() => {
    (skills[0] as { name: string }).name = "mutated";
  }, TypeError);
  assert.throws(() => {
    (skills[0]?.files as string[]).push("unpublished.txt");
  }, TypeError);
});

test("just-do-it publishes its execution discipline and response patterns", async () => {
  const skill = await loadSkill("just-do-it");
  assert.match(skill.description, /user-directed work/i);
  assert.match(skill.body, /Never create a Git branch autonomously/);
  assert.match(skill.body, /## Prove Blockers/);
  assert.match(await readSkillFile(skill.name, "references/response-patterns.md"), /## Decision Table/);
  assert.equal(await verifySkillIntegrity(skill.name), true);
});

test("host can resolve skill metadata, body, files, and integrity", async () => {
  const skill = await loadSkill("iterations-planner");
  assert.match(skill.description, /planning gate/i);
  assert.match(skill.body, /# iterations-planner/);
  assert.match(await readSkillFile(skill.name, "templates/task.template.md"), /## Original brief/);
  assert.equal(await verifySkillIntegrity(skill.name), true);
});

test("skill file resolver rejects traversal and unpublished files", async () => {
  await assert.rejects(readSkillFile("agents-setup", "../iterations-planner/SKILL.md"), RangeError);
  await assert.rejects(readSkillFile("missing", "SKILL.md"), RangeError);
});
