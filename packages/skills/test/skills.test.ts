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
  assert.equal(skills.length, 40);
  assert.deepEqual(
    skills.map((skill) => skill.name),
    [...skills.map((skill) => skill.name)].sort(),
  );
  assert.equal(new Set(skills.map((skill) => skill.name)).size, skills.length);
  assert(getSkillMetadata("agents-setup"));
  assert(getSkillMetadata("redesign-existing-projects"));
  assert.throws(() => {
    (skills[0] as { name: string }).name = "mutated";
  }, TypeError);
  assert.throws(() => {
    (skills[0]?.files as string[]).push("unpublished.txt");
  }, TypeError);
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
